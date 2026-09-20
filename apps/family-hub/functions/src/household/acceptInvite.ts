import { onCall, HttpsError } from "firebase-functions/v2/https";
import { callOpts } from "../lib/callOpts";
import { logger } from "firebase-functions/v2";
import { FieldValue, type Timestamp } from "firebase-admin/firestore";
import { db } from "../lib/admin";
import { writeAudit } from "../lib/audit";
import { setHouseholdClaims } from "../lib/claims";
import { requireSignedIn } from "../lib/tenant";
import { hashToken, hashesMatch } from "../lib/tokens";
import { AcceptInvite } from "./schema";

interface InviteDoc {
  emailLower: string;
  name: string;
  colour: string;
  role: "adult";
  tokenHash: string;
  expiresAt: Timestamp;
  acceptedAt: Timestamp | null;
}

/**
 * Redeem an invite. Four checks, each its own refusal so the person is told
 * the truth: wrong account, expired, already used, bad link. Membership,
 * the user doc, the invite's burn and the claims change in one go.
 */
export const acceptInvite = onCall(callOpts(), async (request) => {
  const { uid, email } = requireSignedIn(request);
  const currentHid = request.auth?.token.hid;
  const input = AcceptInvite.parse(request.data);
  const ctx = { fn: "acceptInvite", uid, hid: input.hid };
  try {
    if (typeof currentHid === "string" && currentHid !== input.hid) {
      throw new HttpsError("failed-precondition", "Already in another household");
    }
    const ref = db.collection("households").doc(input.hid).collection("invites").doc(input.inviteId);
    const snap = await ref.get();
    if (!snap.exists) throw new HttpsError("not-found", "That invite does not exist");
    const inv = snap.data() as InviteDoc;
    if (!hashesMatch(hashToken(input.token), inv.tokenHash)) throw new HttpsError("permission-denied", "That link is not valid");
    if (inv.acceptedAt) throw new HttpsError("failed-precondition", "That invite was already used");
    if (inv.expiresAt.toMillis() < Date.now()) throw new HttpsError("failed-precondition", "That invite has expired");
    if (inv.emailLower !== email) throw new HttpsError("permission-denied", "Sign in with the address the invite was sent to");

    const hhRef = db.collection("households").doc(input.hid);
    await db.runTransaction(async (tx) => {
      tx.update(hhRef, {
        [`members.${uid}`]: { role: inv.role, name: inv.name, colour: inv.colour, email, birthDate: null, uid },
        memberUids: FieldValue.arrayUnion(uid),
        updatedAt: FieldValue.serverTimestamp(),
      });
      tx.set(
        db.collection("users").doc(uid),
        { hid: input.hid, role: inv.role, name: inv.name, colour: inv.colour, updatedAt: FieldValue.serverTimestamp() },
        { merge: true },
      );
      tx.update(ref, { acceptedAt: FieldValue.serverTimestamp(), acceptedUid: uid });
    });
    await setHouseholdClaims(uid, input.hid, inv.role);
    await writeAudit(input.hid, { action: "invite.accept", actorUid: uid, target: input.inviteId });
    logger.info("accepted", ctx);
    return { hid: input.hid };
  } catch (err) {
    logger.error("failed", { ...ctx, err });
    if (err instanceof HttpsError) throw err;
    throw new HttpsError("internal", "Could not accept the invite");
  }
});
