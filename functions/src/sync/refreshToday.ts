import { onCall, HttpsError } from "firebase-functions/v2/https";
import { logger } from "firebase-functions/v2";
import { GOOGLE_SECRETS, TIMEZONE } from "../lib/params";
import { collectToday, storeSnapshot } from "../sync/collect";

/** The portal's "Refresh" button: re-pull Google + tasks into snapshots/today. */
export const refreshToday = onCall(
  { region: "us-central1", secrets: GOOGLE_SECRETS, timeoutSeconds: 60 },
  async (request) => {
    if (!request.auth) throw new HttpsError("unauthenticated", "Sign in required");
    if (request.auth.token.owner !== true) throw new HttpsError("permission-denied", "Owner only");
    const ctx = { fn: "refreshToday", uid: request.auth.uid };
    try {
      const c = await collectToday(new Date(), TIMEZONE.value());
      await storeSnapshot(c);
      logger.info("refreshed", { ...ctx, events: c.events.length, unread: c.unreadTotal });
      return { dayKey: c.dayKey, google: c.sources.google };
    } catch (err) {
      logger.error("failed", { ...ctx, err });
      throw new HttpsError("internal", "Refresh failed");
    }
  },
);
