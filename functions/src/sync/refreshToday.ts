import { onCall, HttpsError } from "firebase-functions/v2/https";
import { logger } from "firebase-functions/v2";
import { requireMember } from "../lib/tenant";
import { collectToday, storeSnapshot } from "../sync/collect";
import { personFor } from "../sync/people";

/** The portal's "Refresh" button: re-pull this person's Google + tasks. */
export const refreshToday = onCall({ region: "us-central1", timeoutSeconds: 60 }, async (request) => {
  const caller = requireMember(request);
  const ctx = { fn: "refreshToday", uid: caller.uid };
  try {
    const p = await personFor(caller.uid);
    if (!p) throw new HttpsError("failed-precondition", "Not in a household");
    const c = await collectToday(p, new Date());
    await storeSnapshot(p, c);
    logger.info("refreshed", { ...ctx, events: c.events.length, unread: c.unreadTotal });
    return { dayKey: c.dayKey, google: c.sources.google };
  } catch (err) {
    logger.error("failed", { ...ctx, err });
    if (err instanceof HttpsError) throw err;
    throw new HttpsError("internal", "Refresh failed");
  }
});
