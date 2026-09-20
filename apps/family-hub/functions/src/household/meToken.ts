import { onCall, HttpsError } from "firebase-functions/v2/https";
import { errMeta } from "../lib/log";
import { callOpts } from "../lib/callOpts";
import { logger } from "firebase-functions/v2";
import { FieldValue } from "firebase-admin/firestore";
import { db } from "../lib/admin";
import { writeAudit } from "../lib/audit";
import { requireAdult, requireMfaAdult } from "../lib/tenant";
import { hashToken, randomToken } from "../lib/tokens";

/**
 * A personal token for the `me` endpoint (the Claude Code door). One per
 * adult, shown once, stored as a hash at meTokens/{hash} -> { uid, hid }.
 * Minting again replaces the old one; revoking deletes it. Both audited.
 * Since 2c the token reaches bills, so minting one takes a second-factor
 * session, the same bar Money itself sets. Revoking never needs it.
 */
export const mintMeToken = onCall(callOpts(), async (request) => {
  const caller = requireMfaAdult(request);
  const ctx = { fn: "mintMeToken", uid: caller.uid, hid: caller.hid };
  try {
    const token = randomToken();
    const hash = hashToken(token);
    const privRef = db.collection("users").doc(caller.uid).collection("private").doc("meToken");
    await db.runTransaction(async (tx) => {
      const prev = await tx.get(privRef);
      const prevHash = prev.data()?.hash as string | undefined;
      if (prevHash) tx.delete(db.collection("meTokens").doc(prevHash));
      tx.set(db.collection("meTokens").doc(hash), { uid: caller.uid, hid: caller.hid, createdAt: FieldValue.serverTimestamp() });
      tx.set(privRef, { hash, createdAt: FieldValue.serverTimestamp() });
    });
    await writeAudit(caller.hid, { action: "meToken.mint", actorUid: caller.uid });
    logger.info("minted", ctx);
    return { token };
  } catch (err) {
    logger.error("failed", { ...ctx, err: errMeta(err) });
    throw new HttpsError("internal", "Could not mint a token");
  }
});

export const revokeMeToken = onCall(callOpts(), async (request) => {
  const caller = requireAdult(request);
  const ctx = { fn: "revokeMeToken", uid: caller.uid, hid: caller.hid };
  try {
    const privRef = db.collection("users").doc(caller.uid).collection("private").doc("meToken");
    await db.runTransaction(async (tx) => {
      const prev = await tx.get(privRef);
      const prevHash = prev.data()?.hash as string | undefined;
      if (prevHash) tx.delete(db.collection("meTokens").doc(prevHash));
      tx.delete(privRef);
    });
    await writeAudit(caller.hid, { action: "meToken.revoke", actorUid: caller.uid });
    logger.info("revoked", ctx);
    return { ok: true };
  } catch (err) {
    logger.error("failed", { ...ctx, err: errMeta(err) });
    throw new HttpsError("internal", "Could not revoke the token");
  }
});
