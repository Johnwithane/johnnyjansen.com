import * as functionsV1 from "firebase-functions/v1";
import { logger } from "firebase-functions/v2";
import { FieldValue } from "firebase-admin/firestore";
import { db } from "../lib/admin";

/**
 * A new Google sign-in gets a profile doc and nothing else: no household,
 * no role, no claims. Until they found a household or accept an invite they
 * can read exactly one document (their own profile). v1 because v2 has no
 * plain auth.onCreate without Identity Platform.
 */
export const onUserCreated = functionsV1
  .region("us-central1")
  .auth.user()
  .onCreate(async (user) => {
    await db
      .collection("users")
      .doc(user.uid)
      .set(
        {
          email: (user.email ?? "").toLowerCase(),
          name: user.displayName ?? "",
          colour: "#37ff8b",
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true },
      );
    logger.info("user profile created", { uid: user.uid });
  });
