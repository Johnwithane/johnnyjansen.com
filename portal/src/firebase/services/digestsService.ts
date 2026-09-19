import { db } from "@/firebase/config";
import type { Digest, WithId } from "@/firebase/interfaces";
import { collection, limit, onSnapshot, orderBy, query } from "firebase/firestore";

export function subscribeDigests(cb: (items: WithId<Digest>[]) => void, max = 30): () => void {
  const q = query(collection(db, "digests"), orderBy("dayKey", "desc"), limit(max));
  return onSnapshot(q, (snap) => cb(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Digest) }))));
}
