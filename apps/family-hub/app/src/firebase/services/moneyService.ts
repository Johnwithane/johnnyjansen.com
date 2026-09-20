import { app, db, functions } from "@/firebase/config";
import type { Account, AccountType, Budget, Transaction, Visibility, WithId } from "@/firebase/interfaces";
import { addDoc, collection, deleteDoc, doc, limit, onSnapshot, orderBy, query, serverTimestamp, setDoc, updateDoc, where } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { getStorage, ref, uploadBytes } from "firebase/storage";

const accounts = (hid: string) => collection(db, "households", hid, "accounts");
const transactions = (hid: string) => collection(db, "households", hid, "transactions");

/** Shared plus own private, merged. */
function twoWay<T>(hid: string, uid: string, base: (q: ReturnType<typeof collection>) => ReturnType<typeof query>, cb: (items: WithId<T>[]) => void, col: (h: string) => ReturnType<typeof collection>, sort: (a: WithId<T>, b: WithId<T>) => number): () => void {
  let shared: WithId<T>[] = [];
  let mine: WithId<T>[] = [];
  const emit = () => cb([...shared, ...mine].sort(sort));
  const s1 = onSnapshot(query(base(col(hid)), where("visibility", "==", "household")), (snap) => {
    shared = snap.docs.map((d) => ({ id: d.id, ...(d.data() as T) }));
    emit();
  });
  const s2 = onSnapshot(query(base(col(hid)), where("visibility", "==", "private"), where("ownerUid", "==", uid)), (snap) => {
    mine = snap.docs.map((d) => ({ id: d.id, ...(d.data() as T) }));
    emit();
  });
  return () => {
    s1();
    s2();
  };
}

export function subscribeAccounts(hid: string, uid: string, cb: (items: WithId<Account>[]) => void): () => void {
  return twoWay<Account>(hid, uid, (c) => query(c), cb, accounts, (a, b) => a.name.localeCompare(b.name));
}

/** Transactions with date >= fromDay, newest first. */
export function subscribeTransactions(hid: string, uid: string, fromDay: string, cb: (items: WithId<Transaction>[]) => void): () => void {
  return twoWay<Transaction>(hid, uid, (c) => query(c, where("date", ">=", fromDay), orderBy("date", "desc"), limit(500)), cb, transactions, (a, b) => b.date.localeCompare(a.date) || (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0));
}

export function subscribeBudget(hid: string, cb: (b: Budget | null) => void): () => void {
  return onSnapshot(doc(db, "households", hid, "settings", "budget"), (snap) => cb(snap.exists() ? (snap.data() as Budget) : null));
}

// Writes: not awaited by callers.

export function createAccount(hid: string, uid: string, input: { name: string; type: AccountType; visibility: Visibility; currency?: string }): Promise<unknown> {
  return addDoc(accounts(hid), { name: input.name, type: input.type, currency: input.currency ?? "CAD", visibility: input.visibility, ownerUid: uid, balance: null, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
}
export function deleteAccount(hid: string, id: string): Promise<void> {
  return deleteDoc(doc(db, "households", hid, "accounts", id));
}

export function createTransaction(
  hid: string,
  uid: string,
  input: { amount: number; direction: "expense" | "income"; date: string; merchant: string; category: string; taxCategory?: string; accountId?: string | null; businessId?: string | null; receiptPath?: string | null; notes?: string; visibility?: Visibility; source?: Transaction["source"] },
): Promise<unknown> {
  return addDoc(transactions(hid), {
    amount: Math.round(input.amount * 100) / 100,
    direction: input.direction,
    date: input.date,
    merchant: input.merchant,
    category: input.category,
    taxCategory: input.taxCategory ?? "none",
    accountId: input.accountId ?? null,
    businessId: input.businessId ?? null,
    receiptPath: input.receiptPath ?? null,
    notes: input.notes ?? "",
    visibility: input.visibility ?? "household",
    ownerUid: uid,
    source: input.source ?? "portal",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}
export function updateTransaction(hid: string, id: string, patch: Partial<Pick<Transaction, "amount" | "direction" | "date" | "merchant" | "category" | "taxCategory" | "accountId" | "notes">>): Promise<void> {
  return updateDoc(doc(db, "households", hid, "transactions", id), { ...patch, updatedAt: serverTimestamp() });
}
export function deleteTransaction(hid: string, id: string): Promise<void> {
  return deleteDoc(doc(db, "households", hid, "transactions", id));
}

export function saveBudget(hid: string, envelopes: Record<string, number>): Promise<void> {
  return setDoc(doc(db, "households", hid, "settings", "budget"), { envelopes, updatedAt: serverTimestamp() }, { merge: true });
}

/** Upload the receipt image (needs a connection). Returns the Storage path the rules accept. */
export async function uploadReceipt(hid: string, uid: string, blob: Blob, mimeType: string): Promise<string> {
  const path = `households/${hid}/receipts/${uid}/${Date.now()}.${mimeType === "application/pdf" ? "pdf" : "jpg"}`;
  await uploadBytes(ref(getStorage(app), path), blob, { contentType: mimeType });
  return path;
}

export interface ReceiptRead {
  merchant: string;
  date: string;
  currency: string;
  total: number;
  tax: number;
  category: string;
  taxCategory: string;
  business: string;
  confidence: "sure" | "likely" | "unsure";
  lines: { label: string; amount: number }[];
}

/** Ask Gemini to read a receipt. No writes happen server-side. */
export async function analyzeReceipt(input: { mimeType: string; dataBase64: string; businesses?: string[] }): Promise<ReceiptRead> {
  const fn = httpsCallable<typeof input, ReceiptRead>(functions, "analyzeReceipt");
  return (await fn(input)).data;
}
