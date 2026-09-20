import { onSchedule } from "firebase-functions/v2/scheduler";
import { logger } from "firebase-functions/v2";
import { GOOGLE_SECRETS } from "../lib/params";
import { rollBills } from "../money/bills";
import { dayKey } from "../lib/dates";
import { digestRecipients } from "../sync/people";
import { runDigestFor } from "./runDigest";

/**
 * The morning email, one per adult. Runs at 06:30 Pacific for everyone for
 * now; per-person send times come with the digest settings screen.
 */
export const dailyDigest = onSchedule(
  {
    schedule: "30 6 * * *",
    timeZone: "America/Vancouver",
    region: "us-central1",
    secrets: GOOGLE_SECRETS,
    timeoutSeconds: 300,
    memory: "256MiB",
  },
  async () => {
    const people = await digestRecipients();
    // Bills whose due day passed move to the next one, once per household,
    // before anyone's email reads them.
    for (const hid of new Set(people.map((p) => p.hid))) {
      const tz = people.find((p) => p.hid === hid)?.timeZone ?? "America/Vancouver";
      await rollBills(hid, dayKey(new Date(), tz)).catch((err) => logger.error("dailyDigest: roll failed", { hid, err }));
    }
    let failed = 0;
    for (const p of people) {
      try {
        await runDigestFor(p);
      } catch (err) {
        failed++;
        logger.error("dailyDigest: person failed", { uid: p.uid, err });
      }
    }
    logger.info("dailyDigest: done", { people: people.length, failed });
    if (failed && failed === people.length) throw new Error("every digest failed");
  },
);
