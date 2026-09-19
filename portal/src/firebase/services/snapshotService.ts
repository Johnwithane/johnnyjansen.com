import { db, functions } from "@/firebase/config";
import type { Snapshot } from "@/firebase/interfaces";
import { doc, onSnapshot } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";

export function subscribeToday(cb: (s: Snapshot | null) => void): () => void {
  return onSnapshot(doc(db, "snapshots", "today"), (snap) => cb(snap.exists() ? (snap.data() as Snapshot) : null));
}

/** Ask the functions to re-pull Google + tasks. Needs a connection; callers guard with navigator.onLine. */
export async function refreshToday(): Promise<{ dayKey: string; google: string }> {
  const fn = httpsCallable<void, { dayKey: string; google: string }>(functions, "refreshToday");
  const res = await fn();
  return res.data;
}
