import { FieldValue } from "firebase-admin/firestore";
import { logger } from "firebase-functions/v2";
import { db } from "../lib/admin";
import { dayLabel } from "../lib/dates";
import { OWNER_EMAIL, TIMEZONE } from "../lib/params";
import { googleClients } from "../google/client";
import { sendEmail } from "../google/gmail";
import { collectToday, storeSnapshot } from "../sync/collect";
import { buildDigest, type Digest } from "./buildDigest";

export const PORTAL_URL = "https://johnnyjansen.com/app";

export interface DigestRun extends Digest {
  dayKey: string;
  emailed: boolean;
  emailError?: string;
}

/**
 * Collect today, build the digest, store it at digests/{dayKey}, refresh the
 * portal snapshot, and email it to the owner from their own Gmail. Shared by
 * the 6:30am schedule and the `me digest run` action so both produce the same
 * document. A send failure is recorded on the doc, never thrown: the digest is
 * still readable in the portal, and a red scheduled job with nothing to show
 * is worse.
 */
export async function runDigest(now = new Date()): Promise<DigestRun> {
  const tz = TIMEZONE.value();
  const collected = await collectToday(now, tz);
  await storeSnapshot(collected);

  const digest = buildDigest({
    dayLabel: dayLabel(now, tz),
    timeZone: tz,
    events: collected.events,
    unread: collected.unread,
    unreadTotal: collected.unreadTotal,
    tasks: collected.tasks,
    googleConnected: collected.sources.google === "ok",
    portalUrl: PORTAL_URL,
  });

  let emailed = false;
  let emailError: string | undefined;
  const clients = googleClients();
  const to = OWNER_EMAIL.value();
  if (clients && to) {
    try {
      await sendEmail(clients.gmail, { to, subject: digest.subject, text: digest.text, html: digest.html });
      emailed = true;
    } catch (err) {
      emailError = err instanceof Error ? err.message : String(err);
      logger.error("digest: send failed", { err });
    }
  } else {
    emailError = clients ? "OWNER_EMAIL not set" : "Google not connected";
  }

  await db
    .collection("digests")
    .doc(collected.dayKey)
    .set({
      dayKey: collected.dayKey,
      subject: digest.subject,
      text: digest.text,
      html: digest.html,
      counts: digest.counts,
      emailed,
      ...(emailError ? { emailError } : {}),
      generatedAt: FieldValue.serverTimestamp(),
    });

  logger.info("digest: done", { dayKey: collected.dayKey, emailed, counts: digest.counts });
  return { ...digest, dayKey: collected.dayKey, emailed, ...(emailError ? { emailError } : {}) };
}
