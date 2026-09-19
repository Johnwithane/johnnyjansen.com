import * as functionsV1 from "firebase-functions/v1";
import { logger } from "firebase-functions/v2";
import { auth } from "../lib/admin";
import { OWNER_EMAIL } from "../lib/params";

// The portal has exactly one user. Google sign-in will happily create an
// account for anyone who finds the login page, so this trigger is the gate:
// the owner's address gets the `owner` custom claim the Firestore rules key
// on; every other account is deleted on the spot and never sees a document.
//
// v1 because v2 has no plain auth.onCreate (its blocking functions need
// Identity Platform). Runs once per account, on creation.
export const onUserCreated = functionsV1
  .region("us-central1")
  .auth.user()
  .onCreate(async (user) => {
    const owner = OWNER_EMAIL.value().trim().toLowerCase();
    const email = (user.email ?? "").toLowerCase();
    if (owner && email === owner && user.emailVerified) {
      await auth.setCustomUserClaims(user.uid, { owner: true });
      logger.info("owner claim set", { uid: user.uid });
      return;
    }
    await auth.deleteUser(user.uid);
    logger.warn("non-owner sign-in deleted", { uid: user.uid, email });
  });
