import { onCall, HttpsError } from "firebase-functions/v2/https";
import { errMeta } from "../lib/log";
import { logger } from "firebase-functions/v2";
import { FieldValue } from "firebase-admin/firestore";
import { db } from "../lib/admin";
import { callOpts } from "../lib/callOpts";
import { dayKey } from "../lib/dates";
import { GOOGLE_SECRETS } from "../lib/params";
import { enforceHouseholdCap } from "../lib/rateLimit";
import { requireAdult } from "../lib/tenant";
import { generateJson } from "../lib/vertex";
import { googleClientsFor } from "../google/client";
import { listRecentMeta } from "../google/gmail";
import { personFor } from "../sync/people";
import type { AccountDoc, BillDoc } from "../types";
import { SetupFound, condense, setupPrompt, toFoundProposals } from "./setupPrompt";

/**
 * The wizard's one-time scan (PLAN.md 4.19 step 4): 90 days of senders and
 * subjects, one Gemini call, grouped proposals into the suggestions queue.
 * Never bodies, never stored. Two runs per person per day. Re-running only
 * proposes what is not already a bill or an account.
 */
export const setupScanInbox = onCall(callOpts({ secrets: GOOGLE_SECRETS, timeoutSeconds: 300 }), async (request) => {
  const caller = requireAdult(request);
  const ctx = { fn: "setupScanInbox", uid: caller.uid, hid: caller.hid };
  try {
    const p = await personFor(caller.uid);
    if (!p) throw new HttpsError("failed-precondition", "Not in a household");
    const g = await googleClientsFor(p.uid);
    if (!g) return { skipped: "google_unconfigured", scanned: 0, proposed: 0 };
    await enforceHouseholdCap(p.hid, "setupScan", 2, { subject: p.uid, today: dayKey(new Date(), p.timeZone) });

    const hh = db.collection("households").doc(p.hid);
    const [bills, accounts, meta] = await Promise.all([
      hh.collection("bills").limit(200).get(),
      hh.collection("accounts").limit(50).get(),
      listRecentMeta(g.gmail, 90, 600),
    ]);
    const already = { bills: bills.docs.map((d) => (d.data() as BillDoc).name), accounts: accounts.docs.map((d) => (d.data() as AccountDoc).name) };
    const today = dayKey(new Date(), p.timeZone);
    const lines = condense(meta);
    if (!lines.length) return { scanned: 0, proposed: 0 };

    const found = SetupFound.parse(await generateJson([{ text: setupPrompt(today, lines, already) }], 4096));
    const proposals = toFoundProposals(found, today, already);

    // Skip anything already waiting on Review from a previous run.
    const pending = await hh.collection("suggestions").where("status", "==", "pending").where("ownerUid", "==", p.uid).limit(200).get();
    const waiting = new Set(pending.docs.map((d) => `${d.data().kind}:${d.data().summary}`));
    const batch = db.batch();
    let n = 0;
    for (const prop of proposals) {
      if (waiting.has(`${prop.kind}:${prop.summary}`)) continue;
      batch.set(hh.collection("suggestions").doc(), {
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
    logger.info("ok", { ...ctx, scanned: meta.length, lines: lines.length, proposed: n });
    return { scanned: meta.length, proposed: n };
  } catch (err) {
    logger.error("failed", { ...ctx, err: errMeta(err) });
    if (err instanceof HttpsError) throw err;
    throw new HttpsError("unavailable", "The scan did not finish. Try again in a minute.");
  }
});
