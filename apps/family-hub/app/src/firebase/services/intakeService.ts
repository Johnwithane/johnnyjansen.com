import { db, functions } from "@/firebase/config";
import { doc, serverTimestamp, updateDoc } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";

/** An address, or a domain with a dot in it. Mirrors functions/src/intake/scan.ts SENDER_RE. */
export const SENDER_RE = /^(?:[a-z0-9._%+-]+@)?[a-z0-9-]+(?:\.[a-z0-9-]+)*\.[a-z]{2,}$/i;

/** Replace this person's approved senders (addresses or domains, lowercased, at most 30). */
export function setIntakeSenders(uid: string, senders: string[]): Promise<void> {
  const clean = [...new Set(senders.map((s) => s.trim().toLowerCase()).filter((s) => s.length <= 120 && SENDER_RE.test(s)))].slice(0, 30);
  // Field path, not the whole map: intake.lastScanAt is function-written and the rules refuse a write that erases it.
  return updateDoc(doc(db, "users", uid), { "intake.senders": clean, updatedAt: serverTimestamp() });
}

export interface ScanResult {
  scanned: number;
  proposed: number;
  skipped?: "no_senders" | "google_unconfigured" | "cap_reached";
}

/** Run the approved-sender scan now (needs a connection). Proposals land on Review. */
export async function scanInbox(): Promise<ScanResult> {
  const fn = httpsCallable<void, ScanResult>(functions, "scanInbox");
  return (await fn()).data;
}

export interface SetupScanResult {
  scanned: number;
  proposed: number;
  skipped?: "google_unconfigured";
}

/** The wizard's one-time 90-day scan (senders and subjects only). Proposals land on Review. Two runs a day. */
export async function setupScanInbox(): Promise<SetupScanResult> {
  const fn = httpsCallable<void, SetupScanResult>(functions, "setupScanInbox");
  return (await fn()).data;
}
