import { FieldValue } from "firebase-admin/firestore";
import { logger } from "firebase-functions/v2";
import { db } from "../lib/admin";
import { APP_BASE_URL } from "../lib/brand";
import { dayLabel } from "../lib/dates";
import { googleClientsFor } from "../google/client";
import { sendEmail } from "../google/gmail";
import { collectToday, storeSnapshot, type Person } from "../sync/collect";
import { buildDigest, type Digest } from "./buildDigest";

export interface DigestRun extends Digest {
  dayKey: string;
  emailed: boolean;
  emailError?: string;
}

/**
 * One person's digest: collect their day, build it, store it under their
 * own uid, refresh their snapshot, and send it from their own Gmail to
 * themselves. A send failure is recorded, never thrown: the digest is still
 * readable in the portal.
 */
export async function runDigestFor(p: Person & { email: string }, now = new Date()): Promise<DigestRun> {
  const collected = await collectToday(p, now);
  await storeSnapshot(p, collected);

  const digest = buildDigest({
    dayLabel: dayLabel(now, p.timeZone),
    timeZone: p.timeZone,
    events: collected.events,
    unread: collected.unread,
    unreadTotal: collected.unreadTotal,
    tasks: collected.tasks,
    googleConnected: collected.sources.google === "ok",
    portalUrl: APP_BASE_URL,
  });

  let emailed = false;
  let emailError: string | undefined;
  const clients = await googleClientsFor(p.uid);
  if (clients) {
    try {
      await sendEmail(clients.gmail, { to: p.email, subject: digest.subject, text: digest.text, html: digest.html });
      emailed = true;
    } catch (err) {
      emailError = err instanceof Error ? err.message : String(err);
      logger.error("digest: send failed", { uid: p.uid, err });
    }
  } else {
    emailError = "Google not connected";
  }

  await db
    .collection("users")
    .doc(p.uid)
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

  logger.info("digest: done", { uid: p.uid, dayKey: collected.dayKey, emailed, counts: digest.counts });
  return { ...digest, dayKey: collected.dayKey, emailed, ...(emailError ? { emailError } : {}) };
}
