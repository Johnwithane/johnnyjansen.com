import { onCall, HttpsError } from "firebase-functions/v2/https";
import { errMeta } from "../lib/log";
import { callOpts } from "../lib/callOpts";
import { logger } from "firebase-functions/v2";
import { FieldValue } from "firebase-admin/firestore";
import { db } from "../lib/admin";
import { writeAudit } from "../lib/audit";
import { setHouseholdClaims } from "../lib/claims";
import { requireSignedIn } from "../lib/tenant";
import { CreateHousehold } from "./schema";

/**
 * The founder's first step. Creates the household, makes the caller its
 * first adult, stamps the claims. A person already in a household cannot
 * found another (one active household per token, FAMILY_PLAN.md 10.1).
 */
export const createHousehold = onCall(callOpts(), async (request) => {
  const { uid, email } = requireSignedIn(request);
  if (typeof request.auth?.token.hid === "string") {
    throw new HttpsError("failed-precondition", "Already in a household");
  }
  const input = CreateHousehold.parse(request.data);
  const ctx = { fn: "createHousehold", uid };
  try {
    const ref = db.collection("households").doc();
    const member = {
      role: "adult",
      name: input.yourName,
      colour: input.colour,
      email,
      birthDate: input.birthDate ?? null,
      uid,
    };
    await db.runTransaction(async (tx) => {
      tx.set(ref, {
        name: input.name,
        timeZone: input.timeZone,
        currency: "CAD",
        country: "CA",
        plan: "free",
        limits: { aiCallsPerDay: 20, members: 8 },
        members: { [uid]: member },
        memberUids: [uid],
        createdBy: uid,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
      tx.set(
        db.collection("users").doc(uid),
        {
          hid: ref.id,
          role: "adult",
          name: input.yourName,
          colour: input.colour,
          timeZone: input.timeZone,
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true },
      );
    });
    await setHouseholdClaims(uid, ref.id, "adult");
    await writeAudit(ref.id, { action: "household.create", actorUid: uid });
    logger.info("created", { ...ctx, hid: ref.id });
    return { hid: ref.id };
  } catch (err) {
    logger.error("failed", { ...ctx, err: errMeta(err) });
    if (err instanceof HttpsError) throw err;
    throw new HttpsError("internal", "Could not create the household");
  }
});
