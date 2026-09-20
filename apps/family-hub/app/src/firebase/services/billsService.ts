import { db } from "@/firebase/config";
import type { Bill, BillCadence, Visibility, WithId } from "@/firebase/interfaces";
import { addDoc, collection, deleteDoc, doc, onSnapshot, query, serverTimestamp, updateDoc, where } from "firebase/firestore";

const bills = (hid: string) => collection(db, "households", hid, "bills");

/** Shared bills plus this person's private ones, soonest due first. */
export function subscribeBills(hid: string, uid: string, cb: (items: WithId<Bill>[]) => void): () => void {
  let shared: WithId<Bill>[] = [];
  let mine: WithId<Bill>[] = [];
  const emit = () => cb([...shared, ...mine].sort((a, b) => a.nextDue.localeCompare(b.nextDue) || a.name.localeCompare(b.name)));
  const s1 = onSnapshot(query(bills(hid), where("visibility", "==", "household")), (snap) => {
    shared = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Bill) }));
    emit();
  });
  const s2 = onSnapshot(query(bills(hid), where("visibility", "==", "private"), where("ownerUid", "==", uid)), (snap) => {
    mine = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Bill) }));
    emit();
  });
  return () => {
    s1();
    s2();
  };
}

export interface BillInput {
  name: string;
  amount: number;
  cadence: BillCadence;
  nextDue: string;
  category?: string;
  accountId?: string | null;
  responsibleUid?: string | null;
  autopay?: boolean;
  notes?: string;
  visibility?: Visibility;
  source?: Bill["source"];
}

// Writes: not awaited by callers (offline-safe); the listener shows them.

export function createBill(hid: string, uid: string, input: BillInput): Promise<unknown> {
  return addDoc(bills(hid), {
    name: input.name.trim(),
    amount: Math.round(input.amount * 100) / 100,
    currency: "CAD",
    cadence: input.cadence,
    nextDue: input.nextDue,
    accountId: input.accountId ?? null,
    category: input.category ?? "subscriptions",
    responsibleUid: input.responsibleUid ?? null,
    autopay: input.autopay ?? false,
    notes: input.notes ?? "",
    visibility: input.visibility ?? "household",
    ownerUid: uid,
    source: input.source ?? "portal",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export function updateBill(hid: string, id: string, patch: Partial<Pick<Bill, "name" | "amount" | "cadence" | "nextDue" | "accountId" | "category" | "responsibleUid" | "autopay" | "notes">>): Promise<void> {
  return updateDoc(doc(db, "households", hid, "bills", id), { ...patch, updatedAt: serverTimestamp() });
}

export function deleteBill(hid: string, id: string): Promise<void> {
  return deleteDoc(doc(db, "households", hid, "bills", id));
}
