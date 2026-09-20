import { db } from "@/firebase/config";
import type { Suggestion, WithId } from "@/firebase/interfaces";
import { collection, doc, onSnapshot, query, serverTimestamp, updateDoc, where } from "firebase/firestore";

const col = (hid: string) => collection(db, "households", hid, "suggestions");

/** Pending suggestions this person can see: the household's plus their own private ones. */
export function subscribePending(hid: string, uid: string, cb: (items: WithId<Suggestion>[]) => void): () => void {
  let shared: WithId<Suggestion>[] = [];
  let mine: WithId<Suggestion>[] = [];
  const emit = () => cb([...shared, ...mine].sort((a, b) => (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0)));
  const s1 = onSnapshot(query(col(hid), where("status", "==", "pending"), where("visibility", "==", "household")), (snap) => {
    shared = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Suggestion) }));
    emit();
  });
  const s2 = onSnapshot(query(col(hid), where("status", "==", "pending"), where("visibility", "==", "private"), where("ownerUid", "==", uid)), (snap) => {
    mine = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Suggestion) }));
    emit();
  });
  return () => {
    s1();
    s2();
  };
}

/** Mark accepted or dismissed. The caller applies the payload through the normal service first. */
export function resolveSuggestion(hid: string, id: string, status: "accepted" | "dismissed", uid: string): Promise<void> {
  return updateDoc(doc(db, "households", hid, "suggestions", id), { status, resolvedAt: serverTimestamp(), resolvedBy: uid });
}
