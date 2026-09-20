import { onCall, HttpsError } from "firebase-functions/v2/https";
import { logger } from "firebase-functions/v2";
import { FieldValue } from "firebase-admin/firestore";
import { db } from "../lib/admin";
import { writeAudit } from "../lib/audit";
import { requireAdult } from "../lib/tenant";
import { AddChild } from "./schema";

/**
 * A child is a member record without an account: a name, a birth date, a
 * colour. Sign-in for a child comes later and links an account to this
 * record; nothing else about the child is stored (FAMILY_PLAN.md 10.4).
 */
export const addChild = onCall({ region: "us-central1" }, async (request) => {
  const caller = requireAdult(request);
  const input = AddChild.parse(request.data);
  const ctx = { fn: "addChild", uid: caller.uid, hid: caller.hid };
  try {
    const memberId = `child_${db.collection("_").doc().id}`;
    await db.collection("households").doc(caller.hid).update({
      [`members.${memberId}`]: { role: "child", name: input.name, colour: input.colour, birthDate: input.birthDate, uid: null, email: null },
      updatedAt: FieldValue.serverTimestamp(),
    });
    await writeAudit(caller.hid, { action: "member.child.add", actorUid: caller.uid, target: memberId });
    logger.info("added", { ...ctx, memberId });
    return { memberId };
  } catch (err) {
    logger.error("failed", { ...ctx, err });
    if (err instanceof HttpsError) throw err;
    throw new HttpsError("internal", "Could not add the child");
  }
});
