import { db } from "@/firebase/config";
import type { EventKind, HouseholdEvent, WithId } from "@/firebase/interfaces";
import { addDoc, collection, deleteDoc, doc, onSnapshot, orderBy, query, serverTimestamp, updateDoc, where } from "firebase/firestore";

const events = (hid: string) => collection(db, "households", hid, "events");

/** Household events with a start in [fromDay, toDay). Lexical on the wall-clock string. */
export function subscribeEvents(hid: string, fromDay: string, toDay: string, cb: (items: WithId<HouseholdEvent>[]) => void): () => void {
  const q = query(events(hid), where("start", ">=", fromDay), where("start", "<", toDay), orderBy("start"));
  return onSnapshot(q, (snap) => cb(snap.docs.map((d) => ({ id: d.id, ...(d.data() as HouseholdEvent) }))));
}

// Writes are not awaited by callers (offline-safe); the listener shows them.

export function createEvent(
  hid: string,
  uid: string,
  input: { title: string; start: string; end?: string; allDay: boolean; kind: EventKind; memberIds?: string[]; location?: string; notes?: string; source?: HouseholdEvent["source"] },
): Promise<unknown> {
  return addDoc(events(hid), {
    title: input.title,
    start: input.start,
    end: input.end ?? input.start,
    allDay: input.allDay,
    kind: input.kind,
    memberIds: input.memberIds ?? [],
    location: input.location ?? "",
    notes: input.notes ?? "",
    source: input.source ?? "portal",
    ownerUid: uid,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export function updateEvent(hid: string, id: string, patch: Partial<Pick<HouseholdEvent, "title" | "start" | "end" | "allDay" | "kind" | "memberIds" | "location" | "notes">>): Promise<void> {
  return updateDoc(doc(db, "households", hid, "events", id), { ...patch, updatedAt: serverTimestamp() });
}

export function deleteEvent(hid: string, id: string): Promise<void> {
  return deleteDoc(doc(db, "households", hid, "events", id));
}
