import { db, functions } from "@/firebase/config";
import { doc, serverTimestamp, updateDoc } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";

/** Replace this person's approved senders (addresses or domains, lowercased, at most 30). */
export function setIntakeSenders(uid: string, senders: string[]): Promise<void> {
  const clean = [...new Set(senders.map((s) => s.trim().toLowerCase()).filter((s) => s.length >= 3))].slice(0, 30);
  return updateDoc(doc(db, "users", uid), { intake: { senders: clean }, updatedAt: serverTimestamp() });
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
