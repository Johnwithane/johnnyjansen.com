import * as functionsV1 from "firebase-functions/v1";
import { FieldValue } from "firebase-admin/firestore";
import { db } from "../lib/admin";

/** A new Google sign-in gets a profile doc and nothing else. */
export const onUserCreated = functionsV1
  .region("us-central1")
  .auth.user()
  .onCreate(async (user) => {
    await db.collection("users").doc(user.uid).set(
      { email: (user.email ?? "").toLowerCase(), name: user.displayName ?? "", createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() },
      { merge: true },
    );
  });
