import { onRequest, type Request } from "firebase-functions/v2/https";
import { logger } from "firebase-functions/v2";
import { FieldValue } from "firebase-admin/firestore";
import { timingSafeEqual } from "node:crypto";
import type { Response } from "express";
import { db } from "../lib/admin";
import { dayBounds, dayKey } from "../lib/dates";
import { GOOGLE_SECRETS, ME_TOKEN, TIMEZONE } from "../lib/params";
import { googleClients } from "../google/client";
import { listEvents } from "../google/calendar";
import { listUnread } from "../google/gmail";
import { collectToday, storeSnapshot } from "../sync/collect";
import { runDigest } from "../digest/runDigest";
import type { TaskDoc } from "../types";
import { MeBody } from "./schema";

// The door a Claude Code session (or a terminal) uses to reach the portal's
// data from anywhere with ONE shared secret: no Google credentials on the
// session, no admin SDK. Same shape as bettertour's feedbackQueue.
//
// It is deliberately a small, closed menu of actions (see schema.ts), not a
// general query surface. Anything it can do, the portal can do by hand.

const TOKEN_UNSET = "unset";

function tokenOk(req: Request): boolean {
  const expected = ME_TOKEN.value();
  if (!expected || expected === TOKEN_UNSET) return false;
  const got = req.get("x-me-token") ?? "";
  const a = Buffer.from(got);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

function taskOut(id: string, t: TaskDoc) {
  return {
    id,
    title: t.title,
    done: t.done,
    due: t.due ?? null,
    notes: t.notes ?? "",
    source: t.source,
    createdAt: t.createdAt?.toDate?.().toISOString() ?? null,
    doneAt: t.doneAt?.toDate?.().toISOString() ?? null,
  };
}

async function handle(body: MeBody): Promise<unknown> {
  const tz = TIMEZONE.value();
  const now = new Date();

  switch (body.action) {
    case "today": {
      const c = await collectToday(now, tz);
      await storeSnapshot(c);
      return c;
    }
    case "calendar": {
      const g = googleClients();
      if (!g) return { error: "google_unconfigured", events: [] };
      const { start } = dayBounds(now, tz);
      const end = new Date(start.getTime() + body.days * 86400000);
      return { from: dayKey(start, tz), days: body.days, events: await listEvents(g.calendar, start, end) };
    }
    case "inbox": {
      const g = googleClients();
      if (!g) return { error: "google_unconfigured", items: [], total: 0 };
      return listUnread(g.gmail, body.max);
    }
    case "tasks.list": {
      const snap = await db
        .collection("tasks")
        .where("done", "==", body.done)
        .orderBy("createdAt", body.done ? "desc" : "asc")
        .limit(200)
        .get();
      return { tasks: snap.docs.map((d) => taskOut(d.id, d.data() as TaskDoc)) };
    }
    case "tasks.add": {
      const ref = await db.collection("tasks").add({
        title: body.title,
        done: false,
        doneAt: null,
        due: body.due ?? null,
        notes: body.notes ?? "",
        source: "cli",
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
      const snap = await ref.get();
      return { task: taskOut(ref.id, snap.data() as TaskDoc) };
    }
    case "tasks.done":
    case "tasks.reopen": {
      const ref = db.collection("tasks").doc(body.id);
      const snap = await ref.get();
      if (!snap.exists) return { error: "not_found", id: body.id };
      const done = body.action === "tasks.done";
      await ref.update({
        done,
        doneAt: done ? FieldValue.serverTimestamp() : null,
        updatedAt: FieldValue.serverTimestamp(),
      });
      const after = await ref.get();
      return { task: taskOut(ref.id, after.data() as TaskDoc) };
    }
    case "tasks.delete": {
      const ref = db.collection("tasks").doc(body.id);
      const snap = await ref.get();
      if (!snap.exists) return { error: "not_found", id: body.id };
      await ref.delete();
      return { deleted: body.id };
    }
    case "digest.get": {
      const snap = body.day
        ? await db.collection("digests").doc(body.day).get()
        : (await db.collection("digests").orderBy("dayKey", "desc").limit(1).get()).docs[0];
      if (!snap || !snap.exists) return { error: "not_found" };
      const d = snap.data() as Record<string, unknown>;
      return {
        dayKey: d.dayKey,
        subject: d.subject,
        text: d.text,
        counts: d.counts,
        emailed: d.emailed,
        emailError: d.emailError ?? null,
      };
    }
    case "digest.run": {
      const r = await runDigest(now);
      return { dayKey: r.dayKey, subject: r.subject, text: r.text, counts: r.counts, emailed: r.emailed, emailError: r.emailError ?? null };
    }
  }
}

export const me = onRequest(
  {
    region: "us-central1",
    secrets: [ME_TOKEN, ...GOOGLE_SECRETS],
    timeoutSeconds: 120,
    memory: "256MiB",
    cors: false,
  },
  async (req: Request, res: Response) => {
    if (req.method !== "POST") {
      res.status(405).json({ error: "POST only" });
      return;
    }
    if (!tokenOk(req)) {
      res.status(401).json({ error: "unauthorized" });
      return;
    }
    const parsed = MeBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "bad_request", issues: parsed.error.issues });
      return;
    }
    const ctx = { fn: "me", action: parsed.data.action };
    try {
      const out = await handle(parsed.data);
      logger.info("me: ok", ctx);
      res.json({ ok: true, ...(out as object) });
    } catch (err) {
      logger.error("me: failed", { ...ctx, err });
      res.status(500).json({ error: "internal" });
    }
  },
);
