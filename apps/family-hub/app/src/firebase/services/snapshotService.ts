import { db, functions } from "@/firebase/config";
import type { Snapshot } from "@/firebase/interfaces";
import { doc, onSnapshot } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";

export function subscribeToday(uid: string, cb: (s: Snapshot | null) => void): () => void {
  return onSnapshot(doc(db, "users", uid, "snapshots", "today"), (snap) => cb(snap.exists() ? (snap.data() as Snapshot) : null));
}

/** Ask the functions to re-pull this person's Google + tasks. Needs a connection. */
export async function refreshToday(): Promise<{ dayKey: string; google: string }> {
  const fn = httpsCallable<void, { dayKey: string; google: string }>(functions, "refreshToday");
  return (await fn()).data;
}
