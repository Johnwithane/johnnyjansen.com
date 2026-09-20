import { onCall, HttpsError } from "firebase-functions/v2/https";
import { onSchedule } from "firebase-functions/v2/scheduler";
import { logger } from "firebase-functions/v2";
import { db } from "../lib/admin";
import { callOpts } from "../lib/callOpts";
import { DEFAULT_TIMEZONE, GOOGLE_SECRETS } from "../lib/params";
import { requireAdult } from "../lib/tenant";
import { personFor } from "../sync/people";
import type { UserDoc } from "../types";
import { scanIntakeFor } from "./scan";

/** The Intake screen's "Scan now". Adults, their own inbox, their own approved senders. */
export const scanInbox = onCall(callOpts({ secrets: GOOGLE_SECRETS, timeoutSeconds: 120 }), async (request) => {
  const caller = requireAdult(request);
  const ctx = { fn: "scanInbox", uid: caller.uid };
  try {
    const p = await personFor(caller.uid);
    if (!p) throw new HttpsError("failed-precondition", "Not in a household");
    const r = await scanIntakeFor(p, new Date());
    logger.info("ok", { ...ctx, ...r });
    return r;
  } catch (err) {
    logger.error("failed", { ...ctx, err });
    if (err instanceof HttpsError) throw err;
    throw new HttpsError("internal", "Scan failed");
  }
});

/**
 * The standing scan, 06:00 Pacific, before the 06:30 digest so the morning
 * email can count what is waiting on Review. Only adults with approved
 * senders; a person whose scan fails does not stop the others.
 */
export const dailyIntake = onSchedule(
  { schedule: "0 6 * * *", timeZone: "America/Vancouver", region: "us-central1", secrets: GOOGLE_SECRETS, timeoutSeconds: 540, memory: "256MiB" },
  async () => {
    const snap = await db.collection("users").where("role", "==", "adult").limit(1000).get();
    let people = 0;
    let failed = 0;
    for (const d of snap.docs) {
      const u = d.data() as UserDoc;
      if (!u.hid || !u.intake?.senders?.length) continue;
      people++;
      try {
        await scanIntakeFor({ uid: d.id, hid: u.hid, role: "adult", timeZone: u.timeZone || DEFAULT_TIMEZONE.value(), calendarIds: [], familyCalendarIds: [], name: u.name, colour: u.colour });
      } catch (err) {
        failed++;
        logger.error("dailyIntake: person failed", { uid: d.id, err });
      }
    }
    logger.info("dailyIntake: done", { people, failed });
  },
);
