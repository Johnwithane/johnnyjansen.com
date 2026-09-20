import { FieldValue } from "firebase-admin/firestore";
import { HttpsError } from "firebase-functions/v2/https";
import { logger } from "firebase-functions/v2";
import { db } from "../lib/admin";
import { dayKey } from "../lib/dates";
import { enforceHouseholdCap } from "../lib/rateLimit";
import { generateJson } from "../lib/vertex";
import { googleClientsFor } from "../google/client";
import type { Person } from "../sync/collect";
import type { HouseholdDoc, UserDoc } from "../types";
import { extractText } from "./mailText";
import { IntakeOut, intakePrompt, toProposal, type MemberRef } from "./prompt";

// The standing inbox scan (PLAN.md 4.20): new mail from senders this adult
// approved, read once, turned into suggestions. Bodies are never stored;
// the message id is, so a message is read once. Everything lands in the
// queue as `scan`, household-visible, and nothing is written for real until
// someone accepts it on Review.

export interface ScanResult {
  scanned: number;
  proposed: number;
  /** Why nothing ran: no approved senders, or Google not connected. */
  skipped?: "no_senders" | "google_unconfigured" | "cap_reached";
}

const MAX_PER_SCAN = 10;
const SEEN_CAP = 400;

/** Gmail's search syntax: `from:` matches an address or a whole domain. */
export function scanQuery(senders: string[], days = 7): string {
  const froms = senders.map((s) => `from:${s.replace(/[^a-z0-9@.\-_+]/gi, "")}`).filter((s) => s.length > 5);
  return `(${froms.join(" OR ")}) newer_than:${days}d -in:trash -in:spam`;
}

export async function scanIntakeFor(p: Person, now = new Date()): Promise<ScanResult> {
  const userRef = db.collection("users").doc(p.uid);
  const user = (await userRef.get()).data() as UserDoc | undefined;
  const senders = (user?.intake?.senders ?? []).slice(0, 30);
  if (!senders.length) return { scanned: 0, proposed: 0, skipped: "no_senders" };
  const g = await googleClientsFor(p.uid);
  if (!g) return { scanned: 0, proposed: 0, skipped: "google_unconfigured" };

  const seenRef = userRef.collection("private").doc("intakeSeen");
  const seen = new Set<string>(((await seenRef.get()).data()?.ids as string[] | undefined) ?? []);
  const list = await g.gmail.users.messages.list({ userId: "me", q: scanQuery(senders), maxResults: 25 });
  const fresh = (list.data.messages ?? []).filter((m) => m.id && !seen.has(m.id)).slice(0, MAX_PER_SCAN);
  if (!fresh.length) {
    await userRef.set({ intake: { senders, lastScanAt: FieldValue.serverTimestamp() } }, { merge: true });
    return { scanned: 0, proposed: 0 };
  }

  const hh = (await db.collection("households").doc(p.hid).get()).data() as HouseholdDoc | undefined;
  const members: MemberRef[] = Object.entries(hh?.members ?? {}).map(([id, m]) => ({ id, name: m.name, role: m.role }));
  const cap = hh?.limits?.aiCallsPerDay ?? 20;
  const today = dayKey(now, p.timeZone);
  const suggestions = db.collection("households").doc(p.hid).collection("suggestions");

  let scanned = 0;
  let proposed = 0;
  let capReached = false;
  const newlySeen: string[] = [];
  for (const m of fresh) {
    const id = m.id as string;
    try {
      await enforceHouseholdCap(p.hid, "ai", cap);
    } catch (err) {
      if (err instanceof HttpsError && err.code === "resource-exhausted") {
        capReached = true;
        break;
      }
      throw err;
    }
    const full = await g.gmail.users.messages.get({ userId: "me", id, format: "full" });
    const headers = full.data.payload?.headers ?? [];
    const h = (n: string) => headers.find((x) => x.name?.toLowerCase() === n)?.value ?? "";
    const mail = { messageId: id, from: h("from"), subject: h("subject") || "(no subject)", date: full.data.internalDate ? new Date(Number(full.data.internalDate)).toISOString() : "" };
    const text = extractText(full.data.payload);
    scanned++;
    newlySeen.push(id);
    if (text.length < 20) continue;
    try {
      const out = IntakeOut.parse(await generateJson([{ text: `${intakePrompt(today, members)}\n\nFROM: ${mail.from}\nSUBJECT: ${mail.subject}\n\n${text}` }], 2048));
      const batch = db.batch();
      let n = 0;
      for (const item of out.items.slice(0, 8)) {
        const prop = toProposal(item, mail, members);
        if (!prop) continue;
        batch.set(suggestions.doc(), {
          kind: prop.kind,
          source: "scan",
          summary: prop.summary,
          payload: prop.payload,
          status: "pending",
          visibility: "household",
          ownerUid: p.uid,
          createdAt: FieldValue.serverTimestamp(),
          resolvedAt: null,
          resolvedBy: null,
        });
        n++;
      }
      if (n) await batch.commit();
      proposed += n;
    } catch (err) {
      logger.warn("intake: message not read", { uid: p.uid, messageId: id, err });
    }
  }

  const ids = [...newlySeen, ...seen].slice(0, SEEN_CAP);
  await Promise.all([
    seenRef.set({ ids, updatedAt: FieldValue.serverTimestamp() }),
    userRef.set({ intake: { senders, lastScanAt: FieldValue.serverTimestamp() } }, { merge: true }),
  ]);
  logger.info("intake: scanned", { uid: p.uid, hid: p.hid, scanned, proposed, capReached });
  return { scanned, proposed, ...(capReached ? { skipped: "cap_reached" as const } : {}) };
}
