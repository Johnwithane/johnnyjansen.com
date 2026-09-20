import { onRequest, type Request } from "firebase-functions/v2/https";
import { logger } from "firebase-functions/v2";
import { FieldValue } from "firebase-admin/firestore";
import type { Response } from "express";
import { db } from "../lib/admin";
import { dayBounds, dayKey } from "../lib/dates";
import { GOOGLE_SECRETS } from "../lib/params";
import { hashToken } from "../lib/tokens";
import { googleClientsFor } from "../google/client";
import { listEvents } from "../google/calendar";
import { listUnread } from "../google/gmail";
import { collectToday, storeSnapshot, type Person } from "../sync/collect";
import { personFor } from "../sync/people";
import { runDigestFor } from "../digest/runDigest";
import { dispatchToGitHub, GITHUB_FEEDBACK_TOKEN } from "../feedback/dispatch";
import { storage } from "../lib/admin";
import { scanIntakeFor } from "../intake/scan";
import type { BillDoc, EventDoc, SuggestionDoc, TaskDoc, UserDoc } from "../types";
import { MeBody } from "./schema";

// The door a Claude Code session uses. One personal token per adult
// (mintMeToken), stored as a hash at meTokens/{hash} -> { uid, hid }. A leaked
// token reaches one person's view of one household and is revocable from the
// Household screen. A closed menu of actions (schema.ts), not a query surface.

/**
 * Signed read URLs for a report's screenshots. The admin SDK ignores
 * storage.rules, so a path is signed only if it sits inside this household's
 * feedback folder; the rules enforce the same shape on write, this is the
 * second lock.
 */
async function signShots(hid: string, paths: unknown): Promise<string[]> {
  const out: string[] = [];
  const list = Array.isArray(paths) ? paths : [];
  for (const p of list.slice(0, 3)) {
    if (typeof p !== "string" || !p.startsWith(`households/${hid}/feedback/`) || p.includes("..")) continue;
    try {
      const [url] = await storage.bucket().file(p).getSignedUrl({ action: "read", expires: Date.now() + 3600_000 });
      out.push(url);
    } catch {
      /* a missing object is not worth failing the digest */
    }
  }
  return out;
}

function reportOut(id: string, d: Record<string, unknown>, shots: string[]) {
  const ts = (v: unknown) => (v && typeof v === "object" && "toDate" in v ? (v as { toDate(): Date }).toDate().toISOString() : null);
  return {
    id,
    type: d.type,
    status: d.status,
    description: d.description,
    route: d.route,
    url: d.url,
    environment: d.environment,
    appVersion: d.appVersion,
    notes: d.notes ?? "",
    reporterName: d.reporterName,
    screenshots: shots,
    githubIssueUrl: d.githubIssueUrl ?? null,
    createdAt: ts(d.createdAt),
    updatedAt: ts(d.updatedAt),
    shippedAt: ts(d.shippedAt),
  };
}

async function resolveCaller(req: Request): Promise<(Person & { email: string }) | null> {
  const raw = req.get("x-me-token") ?? "";
  if (!raw || raw.length > 200) return null;
  const snap = await db.collection("meTokens").doc(hashToken(raw)).get();
  const uid = snap.data()?.uid as string | undefined;
  if (!uid) return null;
  const p = await personFor(uid);
  if (!p) return null;
  const email = ((await db.collection("users").doc(uid).get()).data()?.email as string | undefined) ?? "";
  return { ...p, email };
}

function taskOut(id: string, t: TaskDoc) {
  return {
    id,
    title: t.title,
    done: t.done,
    due: t.due ?? null,
    notes: t.notes ?? "",
    visibility: t.visibility,
    ownerUid: t.ownerUid,
    assigneeUid: t.assigneeUid ?? null,
    source: t.source,
    createdAt: t.createdAt?.toDate?.().toISOString() ?? null,
    doneAt: t.doneAt?.toDate?.().toISOString() ?? null,
  };
}

/** A task this person may see: shared, or their own private one. */
function canSee(p: Person, t: TaskDoc): boolean {
  return t.visibility === "household" || t.ownerUid === p.uid;
}

async function handle(p: Person & { email: string }, body: MeBody): Promise<unknown> {
  const now = new Date();
  const tasks = db.collection("households").doc(p.hid).collection("tasks");

  switch (body.action) {
    case "today": {
      const c = await collectToday(p, now);
      await storeSnapshot(p, c);
      return c;
    }
    case "calendar": {
      const g = await googleClientsFor(p.uid);
      if (!g) return { error: "google_unconfigured", events: [] };
      const { start } = dayBounds(now, p.timeZone);
      const end = new Date(start.getTime() + body.days * 86400000);
      return { from: dayKey(start, p.timeZone), days: body.days, events: await listEvents(g.calendar, start, end, p.calendarIds) };
    }
    case "inbox": {
      const g = await googleClientsFor(p.uid);
      if (!g) return { error: "google_unconfigured", items: [], total: 0 };
      return listUnread(g.gmail, body.max);
    }
    case "tasks.list": {
      const snap = await tasks.where("done", "==", body.done).limit(300).get();
      const out = snap.docs
        .filter((d) => canSee(p, d.data() as TaskDoc))
        .map((d) => taskOut(d.id, d.data() as TaskDoc))
        .sort((a, b) => (body.done ? (b.doneAt ?? "").localeCompare(a.doneAt ?? "") : (a.createdAt ?? "").localeCompare(b.createdAt ?? "")));
      return { tasks: out };
    }
    case "tasks.add": {
      const ref = await tasks.add({
        title: body.title,
        done: false,
        doneAt: null,
        due: body.due ?? null,
        notes: body.notes ?? "",
        visibility: body.visibility,
        ownerUid: p.uid,
        assigneeUid: null,
        source: "cli",
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
      const snap = await ref.get();
      return { task: taskOut(ref.id, snap.data() as TaskDoc) };
    }
    case "tasks.done":
    case "tasks.reopen": {
      const ref = tasks.doc(body.id);
      const snap = await ref.get();
      if (!snap.exists || !canSee(p, snap.data() as TaskDoc)) return { error: "not_found", id: body.id };
      const done = body.action === "tasks.done";
      await ref.update({ done, doneAt: done ? FieldValue.serverTimestamp() : null, updatedAt: FieldValue.serverTimestamp() });
      const after = await ref.get();
      return { task: taskOut(ref.id, after.data() as TaskDoc) };
    }
    case "tasks.delete": {
      const ref = tasks.doc(body.id);
      const snap = await ref.get();
      const t = snap.data() as TaskDoc | undefined;
      if (!snap.exists || !t || !canSee(p, t)) return { error: "not_found", id: body.id };
      if (t.ownerUid !== p.uid && t.visibility === "private") return { error: "not_found", id: body.id };
      await ref.delete();
      return { deleted: body.id };
    }
    case "digest.get": {
      const col = db.collection("users").doc(p.uid).collection("digests");
      const snap = body.day ? await col.doc(body.day).get() : (await col.orderBy("dayKey", "desc").limit(1).get()).docs[0];
      if (!snap || !snap.exists) return { error: "not_found" };
      const d = snap.data() as Record<string, unknown>;
      return { dayKey: d.dayKey, subject: d.subject, text: d.text, counts: d.counts, emailed: d.emailed, emailError: d.emailError ?? null };
    }
    case "digest.run": {
      const r = await runDigestFor(p, now);
      return { dayKey: r.dayKey, subject: r.subject, text: r.text, counts: r.counts, emailed: r.emailed, emailError: r.emailError ?? null };
    }
    case "feedback.list": {
      const col = db.collection("households").doc(p.hid).collection("feedback");
      const snap = body.status === "all" ? await col.orderBy("createdAt", "desc").limit(200).get() : await col.where("status", "==", body.status).orderBy("createdAt", "desc").limit(200).get();
      const reports = [];
      for (const d of snap.docs) {
        const data = d.data() as Record<string, unknown>;
        reports.push(reportOut(d.id, data, await signShots(p.hid, data.screenshotPaths)));
      }
      return { reports };
    }
    case "feedback.get": {
      const snap = await db.collection("households").doc(p.hid).collection("feedback").doc(body.id).get();
      if (!snap.exists) return { error: "not_found", id: body.id };
      const data = snap.data() as Record<string, unknown>;
      return { report: reportOut(snap.id, data, await signShots(p.hid, data.screenshotPaths)) };
    }
    case "feedback.triage": {
      const ref = db.collection("households").doc(p.hid).collection("feedback").doc(body.id);
      const snap = await ref.get();
      if (!snap.exists) return { error: "not_found", id: body.id };
      if (snap.data()?.status === "shipped") return { error: "already_shipped", id: body.id };
      await ref.update({ status: body.status, ...(body.notes !== undefined ? { notes: body.notes } : {}), updatedAt: FieldValue.serverTimestamp() });
      return { id: body.id, status: body.status };
    }
    case "events.list": {
      const { start } = dayBounds(now, p.timeZone);
      const from = dayKey(start, p.timeZone);
      const toKey = dayKey(new Date(start.getTime() + body.days * 86400000), p.timeZone);
      const snap = await db.collection("households").doc(p.hid).collection("events").where("start", ">=", from).where("start", "<", toKey).orderBy("start").limit(300).get();
      return { from, days: body.days, events: snap.docs.map((d) => ({ id: d.id, ...(d.data() as EventDoc), createdAt: undefined, updatedAt: undefined })) };
    }
    case "events.add": {
      const allDay = !body.start.includes("T");
      const ref = await db.collection("households").doc(p.hid).collection("events").add({
        title: body.title,
        start: body.start,
        end: body.end ?? body.start,
        allDay,
        kind: body.kind,
        memberIds: [],
        location: body.location ?? "",
        notes: body.notes ?? "",
        source: "cli",
        ownerUid: p.uid,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
      return { event: { id: ref.id, title: body.title, start: body.start, allDay, kind: body.kind } };
    }
    case "events.delete": {
      const ref = db.collection("households").doc(p.hid).collection("events").doc(body.id);
      const snap = await ref.get();
      if (!snap.exists) return { error: "not_found", id: body.id };
      await ref.delete();
      return { deleted: body.id };
    }
    case "suggestions.list": {
      const col = db.collection("households").doc(p.hid).collection("suggestions");
      const [shared, mine] = await Promise.all([
        col.where("status", "==", "pending").where("visibility", "==", "household").limit(100).get(),
        col.where("status", "==", "pending").where("visibility", "==", "private").where("ownerUid", "==", p.uid).limit(100).get(),
      ]);
      const list = [...shared.docs, ...mine.docs].map((d) => {
        const s = d.data() as SuggestionDoc;
        return { id: d.id, kind: s.kind, source: s.source, summary: s.summary, payload: s.payload, visibility: s.visibility, createdAt: s.createdAt?.toDate?.().toISOString() ?? null };
      });
      return { suggestions: list.sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? "")) };
    }
    case "suggestions.dismiss": {
      const ref = db.collection("households").doc(p.hid).collection("suggestions").doc(body.id);
      const snap = await ref.get();
      const s = snap.data() as SuggestionDoc | undefined;
      if (!snap.exists || !s || (s.visibility === "private" && s.ownerUid !== p.uid)) return { error: "not_found", id: body.id };
      if (s.status !== "pending") return { error: "already_resolved", id: body.id };
      await ref.update({ status: "dismissed", resolvedAt: FieldValue.serverTimestamp(), resolvedBy: p.uid });
      return { id: body.id, status: "dismissed" };
    }
    case "feedback.dispatch": {
      try {
        return { issue: await dispatchToGitHub(p.hid, body.id) };
      } catch (err) {
        return { error: err instanceof Error ? err.message : "dispatch_failed", id: body.id };
      }
    }
    case "bills.list": {
      if (p.role !== "adult") return { error: "adults_only", bills: [] };
      const snap = await db.collection("households").doc(p.hid).collection("bills").orderBy("nextDue").limit(300).get();
      const bills = snap.docs
        .map((d) => ({ id: d.id, ...(d.data() as BillDoc) }))
        .filter((b) => b.visibility === "household" || b.ownerUid === p.uid)
        .map((b) => ({ id: b.id, name: b.name, amount: b.amount, currency: b.currency, cadence: b.cadence, nextDue: b.nextDue, responsibleUid: b.responsibleUid, autopay: b.autopay, visibility: b.visibility, notes: b.notes }));
      return { bills };
    }
    case "bills.add": {
      if (p.role !== "adult") return { error: "adults_only" };
      const ref = await db.collection("households").doc(p.hid).collection("bills").add({
        name: body.name,
        amount: Math.round(body.amount * 100) / 100,
        currency: "CAD",
        cadence: body.cadence,
        nextDue: body.nextDue,
        accountId: null,
        category: "subscriptions",
        responsibleUid: body.responsibleUid ?? null,
        autopay: false,
        notes: body.notes ?? "",
        visibility: "household",
        ownerUid: p.uid,
        source: "cli",
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
      return { bill: { id: ref.id, name: body.name, amount: body.amount, cadence: body.cadence, nextDue: body.nextDue } };
    }
    case "bills.delete": {
      if (p.role !== "adult") return { error: "adults_only" };
      const ref = db.collection("households").doc(p.hid).collection("bills").doc(body.id);
      const snap = await ref.get();
      const b = snap.data() as BillDoc | undefined;
      if (!snap.exists || !b || (b.visibility === "private" && b.ownerUid !== p.uid)) return { error: "not_found", id: body.id };
      await ref.delete();
      return { deleted: body.id };
    }
    case "intake.scan": {
      if (p.role !== "adult") return { error: "adults_only" };
      return scanIntakeFor(p, now);
    }
    case "intake.senders": {
      if (p.role !== "adult") return { error: "adults_only" };
      const ref = db.collection("users").doc(p.uid);
      if (body.set) {
        const senders = [...new Set(body.set.map((s) => s.toLowerCase()))];
        await ref.set({ intake: { senders }, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
        return { senders };
      }
      const u = (await ref.get()).data() as UserDoc | undefined;
      return { senders: u?.intake?.senders ?? [], lastScanAt: u?.intake?.lastScanAt?.toDate?.().toISOString() ?? null };
    }
  }
}

export const me = onRequest(
  { region: "us-central1", secrets: [...GOOGLE_SECRETS, GITHUB_FEEDBACK_TOKEN], timeoutSeconds: 120, memory: "256MiB", cors: false },
  async (req: Request, res: Response) => {
    if (req.method !== "POST") {
      res.status(405).json({ error: "POST only" });
      return;
    }
    const caller = await resolveCaller(req);
    if (!caller) {
      res.status(401).json({ error: "unauthorized" });
      return;
    }
    const parsed = MeBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "bad_request", issues: parsed.error.issues });
      return;
    }
    const ctx = { fn: "me", uid: caller.uid, hid: caller.hid, action: parsed.data.action };
    try {
      const out = await handle(caller, parsed.data);
      logger.info("me: ok", ctx);
      res.json({ ok: true, ...(out as object) });
    } catch (err) {
      logger.error("me: failed", { ...ctx, err });
      res.status(500).json({ error: "internal" });
    }
  },
);
