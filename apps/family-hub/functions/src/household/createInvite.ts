import { onCall, HttpsError } from "firebase-functions/v2/https";
import { errMeta } from "../lib/log";
import { callOpts } from "../lib/callOpts";
import { logger } from "firebase-functions/v2";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { db } from "../lib/admin";
import { writeAudit } from "../lib/audit";
import { APP_BASE_URL } from "../lib/brand";
import { requireAdult } from "../lib/tenant";
import { hashToken, randomToken } from "../lib/tokens";
import { CreateInvite, INVITE_TTL_MS } from "./schema";

/**
 * An adult invites another adult by email. The server keeps only the hash of
 * the token; the raw token rides in the URL FRAGMENT so it never appears in
 * server logs or referrers. Seven-day expiry, one-time use, bound to the
 * email (acceptInvite checks the signed-in address matches).
 *
 * Phase 1 hands the link back for the inviter to share (share sheet, text).
 * Sending it from a product domain lands with Resend (FAMILY_PLAN.md 10.2).
 */
export const createInvite = onCall(callOpts(), async (request) => {
  const caller = requireAdult(request);
  const input = CreateInvite.parse(request.data);
  const ctx = { fn: "createInvite", uid: caller.uid, hid: caller.hid };
  try {
    const hh = await db.collection("households").doc(caller.hid).get();
    const members = (hh.data()?.members ?? {}) as Record<string, { email?: string }>;
    if (Object.values(members).some((m) => m.email === input.email)) {
      throw new HttpsError("already-exists", "Already a member");
    }
    const token = randomToken();
    const ref = db.collection("households").doc(caller.hid).collection("invites").doc();
    await ref.set({
      emailLower: input.email,
      name: input.name,
      colour: input.colour,
      role: "adult",
      tokenHash: hashToken(token),
      createdBy: caller.uid,
      createdAt: FieldValue.serverTimestamp(),
      expiresAt: Timestamp.fromMillis(Date.now() + INVITE_TTL_MS),
      acceptedAt: null,
      acceptedUid: null,
    });
    await writeAudit(caller.hid, { action: "invite.create", actorUid: caller.uid, target: ref.id });
    logger.info("created", { ...ctx, inviteId: ref.id });
    return { inviteId: ref.id, link: `${APP_BASE_URL}/invite/${caller.hid}/${ref.id}#${token}` };
  } catch (err) {
    logger.error("failed", { ...ctx, err: errMeta(err) });
    if (err instanceof HttpsError) throw err;
    throw new HttpsError("internal", "Could not create the invite");
  }
});
