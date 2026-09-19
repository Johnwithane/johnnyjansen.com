import { onSchedule } from "firebase-functions/v2/scheduler";
import { logger } from "firebase-functions/v2";
import { GOOGLE_SECRETS, TIMEZONE } from "../lib/params";
import { runDigest } from "./runDigest";

/** The morning email. Runs in the owner's zone, so 6:30 means 6:30 there. */
export const dailyDigest = onSchedule(
  {
    schedule: "30 6 * * *",
    timeZone: TIMEZONE,
    region: "us-central1",
    secrets: GOOGLE_SECRETS,
    timeoutSeconds: 120,
    memory: "256MiB",
  },
  async () => {
    try {
      await runDigest();
    } catch (err) {
      logger.error("dailyDigest failed", { err });
      throw err;
    }
  },
);
