import { assertFails, assertSucceeds, type RulesTestEnvironment } from "@firebase/rules-unit-testing";
import { getBytes, ref, uploadBytes } from "firebase/storage";
import { afterAll, beforeAll, beforeEach, describe, it } from "vitest";
import { ADULT_A, ADULT_A2, CHILD_A, HID_A, HID_B, adultA, adultA2, adultB, childA, mfaA, mfaA2, mfaB, mfaChildA, seed, setupTestEnv } from "./setup";

// Money is behind the second factor (PLAN.md 9.2): mfaA / mfaA2 / mfaB are
// adults whose session passed TOTP; adultA / adultA2 / adultB have not.

let env: RulesTestEnvironment;
beforeAll(async () => { env = await setupTestEnv(); });
afterAll(async () => { await env.cleanup(); });
beforeEach(async () => {
  await env.clearFirestore();
  await seed(env);
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    await db.doc(`households/${HID_A}/accounts/chq`).set(account());
    await db.doc(`households/${HID_A}/accounts/mine`).set(account({ visibility: "private", name: "Mine" }));
    await db.doc(`households/${HID_A}/transactions/t1`).set(tx());
    await db.doc(`households/${HID_A}/transactions/t2`).set(tx({ visibility: "private" }));
    await db.doc(`households/${HID_B}/transactions/tb`).set(tx({ ownerUid: "adult-b" }));
    await db.doc(`households/${HID_A}/settings/budget`).set({ envelopes: { groceries: 900 } });
    await db.doc(`households/${HID_A}/bills/rent`).set(bill());
    await db.doc(`households/${HID_A}/bills/mine`).set(bill({ visibility: "private", name: "Gym" }));
    await db.doc(`households/${HID_B}/bills/rb`).set(bill({ ownerUid: "adult-b" }));
    await db.doc(`rateLimits/ai_${HID_A}_2026-09-20`).set({ count: 3 });
  });
});

function account(over: Partial<Record<string, unknown>> = {}) {
  return { name: "TD chequing", type: "chequing", currency: "CAD", visibility: "household", ownerUid: ADULT_A, balance: null, createdAt: new Date(), updatedAt: new Date(), ...over };
}
function tx(over: Partial<Record<string, unknown>> = {}) {
  return {
    amount: 68.4,
    direction: "expense",
    date: "2026-09-18",
    merchant: "Canadian Tire",
    category: "home",
    taxCategory: "none",
    accountId: "chq",
    businessId: null,
    receiptPath: null,
    notes: "",
    visibility: "household",
    ownerUid: ADULT_A,
    source: "portal",
    createdAt: new Date(),
    updatedAt: new Date(),
    ...over,
  };
}
function bill(over: Partial<Record<string, unknown>> = {}) {
  return { name: "Rent", amount: 1850, currency: "CAD", cadence: "monthly", nextDue: "2026-10-01", accountId: "chq", category: "home", responsibleUid: ADULT_A, autopay: false, notes: "", visibility: "household", ownerUid: ADULT_A, source: "portal", createdAt: new Date(), updatedAt: new Date(), ...over };
}
const bl = (id: string) => `households/${HID_A}/bills/${id}`;
const acc = (id: string) => `households/${HID_A}/accounts/${id}`;
const txp = (id: string) => `households/${HID_A}/transactions/${id}`;

describe("accounts", () => {
  it("needs an adult who passed the second factor: no MFA, no read or write; a child never", async () => {
    await assertFails(adultA(env).firestore().doc(acc("chq")).get());
    await assertFails(adultA(env).firestore().doc(acc("sav")).set(account({ type: "savings" })));
    await assertFails(adultA(env).firestore().doc(acc("chq")).update({ balance: 1 }));
    await assertFails(adultA(env).firestore().doc(acc("chq")).delete());
    await assertFails(mfaChildA(env).firestore().doc(acc("chq")).get());
    await assertFails(childA(env).firestore().doc(acc("chq")).get());
  });
  it("shared accounts read by every MFA adult; private by owner only; never another household", async () => {
    await assertSucceeds(mfaA2(env).firestore().doc(acc("chq")).get());
    await assertSucceeds(mfaA(env).firestore().doc(acc("mine")).get());
    await assertFails(mfaA2(env).firestore().doc(acc("mine")).get());
    await assertFails(mfaB(env).firestore().doc(acc("chq")).get());
  });
  it("adults create and edit; children cannot; shape enforced", async () => {
    await assertSucceeds(mfaA2(env).firestore().doc(acc("sav")).set(account({ ownerUid: ADULT_A2, type: "savings" })));
    await assertFails(mfaChildA(env).firestore().doc(acc("kid")).set(account({ ownerUid: CHILD_A })));
    await assertFails(mfaA(env).firestore().doc(acc("bad")).set(account({ type: "crypto" })));
    await assertFails(mfaA(env).firestore().doc(acc("bad")).set(account({ currency: "CAD$" })));
    await assertSucceeds(mfaA2(env).firestore().doc(acc("chq")).update({ balance: 1200.5 }));
    await assertFails(mfaA2(env).firestore().doc(acc("chq")).update({ ownerUid: ADULT_A2 }));
  });
});

describe("transactions", () => {
  it("needs the second factor too", async () => {
    await assertFails(adultA(env).firestore().doc(txp("t1")).get());
    await assertFails(adultA(env).firestore().doc(txp("t9")).set(tx()));
    await assertFails(adultA(env).firestore().doc(txp("t1")).update({ category: "groceries" }));
    await assertFails(adultA(env).firestore().doc(txp("t1")).delete());
    await assertFails(mfaChildA(env).firestore().doc(txp("t1")).get());
  });
  it("visibility works like tasks; other households denied", async () => {
    await assertSucceeds(mfaA2(env).firestore().doc(txp("t1")).get());
    await assertFails(mfaA2(env).firestore().doc(txp("t2")).get());
    await assertFails(mfaB(env).firestore().doc(txp("t1")).get());
  });
  it("an adult records a transaction they own with a valid shape", async () => {
    await assertSucceeds(mfaA2(env).firestore().doc(txp("t3")).set(tx({ ownerUid: ADULT_A2, source: "receipt" })));
    await assertFails(mfaChildA(env).firestore().doc(txp("t4")).set(tx({ ownerUid: CHILD_A })));
    await assertFails(mfaA(env).firestore().doc(txp("t4")).set(tx({ amount: -5 })));
    await assertFails(mfaA(env).firestore().doc(txp("t4")).set(tx({ date: "Sep 18" })));
    await assertFails(mfaA(env).firestore().doc(txp("t4")).set(tx({ direction: "refund" })));
    await assertFails(mfaA(env).firestore().doc(txp("t4")).set(tx({ source: "hacker" })));
    await assertFails(mfaB(env).firestore().doc(txp("t4")).set(tx({ ownerUid: "adult-b" })));
  });
  it("a receipt path must be in this household and this person's folder", async () => {
    await assertSucceeds(mfaA(env).firestore().doc(txp("t5")).set(tx({ receiptPath: `households/${HID_A}/receipts/${ADULT_A}/1.jpg` })));
    await assertFails(mfaA(env).firestore().doc(txp("t6")).set(tx({ receiptPath: `households/${HID_B}/receipts/adult-b/1.jpg` })));
    await assertFails(mfaA(env).firestore().doc(txp("t6")).set(tx({ receiptPath: `households/${HID_A}/receipts/${ADULT_A2}/1.jpg` })));
  });
  it("edits keep the owner; delete is adults only", async () => {
    await assertSucceeds(mfaA2(env).firestore().doc(txp("t1")).update({ category: "groceries" }));
    await assertFails(mfaA2(env).firestore().doc(txp("t1")).update({ ownerUid: ADULT_A2 }));
    await assertFails(mfaChildA(env).firestore().doc(txp("t1")).delete());
    await assertSucceeds(mfaA2(env).firestore().doc(txp("t1")).delete());
  });
});

describe("bills", () => {
  it("MFA adults read shared bills and their own private ones; no MFA, a child, another household: denied", async () => {
    await assertSucceeds(mfaA2(env).firestore().doc(bl("rent")).get());
    await assertSucceeds(mfaA(env).firestore().doc(bl("mine")).get());
    await assertFails(mfaA2(env).firestore().doc(bl("mine")).get());
    await assertFails(adultA(env).firestore().doc(bl("rent")).get());
    await assertFails(mfaChildA(env).firestore().doc(bl("rent")).get());
    await assertFails(mfaB(env).firestore().doc(bl("rent")).get());
  });
  it("shape enforced; the responsible person must be a member; owner never changes", async () => {
    await assertSucceeds(mfaA2(env).firestore().doc(bl("hydro")).set(bill({ ownerUid: ADULT_A2, name: "Hydro", cadence: "monthly", responsibleUid: ADULT_A2 })));
    await assertSucceeds(mfaA(env).firestore().doc(bl("fee")).set(bill({ name: "Swim fee", cadence: "once", responsibleUid: null, source: "intake" })));
    await assertFails(mfaA(env).firestore().doc(bl("bad")).set(bill({ cadence: "sometimes" })));
    await assertFails(mfaA(env).firestore().doc(bl("bad")).set(bill({ nextDue: "Oct 1" })));
    await assertFails(mfaA(env).firestore().doc(bl("bad")).set(bill({ responsibleUid: "adult-b" })));
    await assertFails(mfaA(env).firestore().doc(bl("bad")).set(bill({ ownerUid: ADULT_A2 })));
    await assertFails(mfaA(env).firestore().doc(bl("bad")).set({ ...bill(), extra: 1 }));
    await assertFails(adultA(env).firestore().doc(bl("bad")).set(bill()));
    await assertSucceeds(mfaA2(env).firestore().doc(bl("rent")).update({ amount: 1900, nextDue: "2026-11-01" }));
    await assertFails(mfaA2(env).firestore().doc(bl("rent")).update({ ownerUid: ADULT_A2 }));
    await assertFails(mfaChildA(env).firestore().doc(bl("rent")).delete());
    await assertSucceeds(mfaA2(env).firestore().doc(bl("rent")).delete());
  });
});

describe("settings and rateLimits", () => {
  it("settings/budget is Money: MFA adults only, shaped, only that id, never deleted", async () => {
    await assertSucceeds(mfaA2(env).firestore().doc(`households/${HID_A}/settings/budget`).get());
    await assertSucceeds(mfaA(env).firestore().doc(`households/${HID_A}/settings/budget`).set({ envelopes: { groceries: 950 }, updatedAt: new Date() }, { merge: true }));
    await assertFails(childA(env).firestore().doc(`households/${HID_A}/settings/budget`).get());
    await assertFails(mfaChildA(env).firestore().doc(`households/${HID_A}/settings/budget`).get());
    await assertFails(adultA(env).firestore().doc(`households/${HID_A}/settings/budget`).get());
    await assertFails(adultA(env).firestore().doc(`households/${HID_A}/settings/budget`).set({ envelopes: { groceries: 950 } }, { merge: true }));
    await assertFails(mfaA(env).firestore().doc(`households/${HID_A}/settings/budget`).set({ envelopes: "x" }));
    await assertFails(mfaA(env).firestore().doc(`households/${HID_A}/settings/budget`).set({ envelopes: {}, extra: 1 }));
    await assertFails(mfaA(env).firestore().doc(`households/${HID_A}/settings/other`).set({ envelopes: {} }));
    await assertFails(mfaB(env).firestore().doc(`households/${HID_A}/settings/budget`).get());
    await assertFails(mfaA(env).firestore().doc(`households/${HID_A}/settings/budget`).delete());
  });
  it("cross-tenant writes on accounts and bills are denied, MFA or not", async () => {
    await assertFails(mfaB(env).firestore().doc(acc("x")).set(account({ ownerUid: "adult-b" })));
    await assertFails(mfaB(env).firestore().doc(bl("x")).set(bill({ ownerUid: "adult-b", responsibleUid: null })));
    await assertFails(mfaB(env).firestore().doc(acc("chq")).update({ balance: 0 }));
    await assertFails(mfaB(env).firestore().doc(bl("rent")).delete());
  });
  it("money field types are checked; a receipt can be attached once, never swapped", async () => {
    await assertFails(mfaA(env).firestore().doc(acc("bad")).set(account({ balance: "lots" })));
    await assertFails(mfaA(env).firestore().doc(txp("bad")).set(tx({ notes: "x".repeat(1001) })));
    await assertFails(mfaA(env).firestore().doc(txp("bad")).set(tx({ accountId: 5 })));
    await assertSucceeds(mfaA(env).firestore().doc(txp("t1")).update({ receiptPath: `households/${HID_A}/receipts/${ADULT_A}/late.jpg` }));
    await assertFails(mfaA(env).firestore().doc(txp("t1")).update({ receiptPath: `households/${HID_A}/receipts/${ADULT_A}/other.jpg` }));
    await assertFails(mfaA(env).firestore().doc(txp("t1")).update({ receiptPath: null }));
  });
  it("rateLimits are invisible to every client", async () => {
    await assertFails(adultA(env).firestore().doc(`rateLimits/ai_${HID_A}_2026-09-20`).get());
    await assertFails(adultA(env).firestore().doc(`rateLimits/ai_${HID_A}_2026-09-20`).set({ count: 0 }));
  });
});

describe("receipt photos (storage)", () => {
  const jpg = new Uint8Array([255, 216, 255]);
  const mine = `households/${HID_A}/receipts/${ADULT_A}/1.jpg`;
  it("an MFA adult uploads under their own uid and reads their own folder only", async () => {
    await assertSucceeds(uploadBytes(ref(mfaA(env).storage(), mine), jpg, { contentType: "image/jpeg" }));
    await assertSucceeds(getBytes(ref(mfaA(env).storage(), mine)));
    await assertFails(getBytes(ref(mfaA2(env).storage(), mine)));
    await assertFails(getBytes(ref(mfaB(env).storage(), mine)));
  });
  it("no second factor, a child, another uid's folder, another household, a non-image, an SVG: all refused", async () => {
    await assertFails(uploadBytes(ref(adultA(env).storage(), mine), jpg, { contentType: "image/jpeg" }));
    await assertFails(getBytes(ref(adultA(env).storage(), mine)));
    await assertFails(uploadBytes(ref(mfaA(env).storage(), `households/${HID_B}/receipts/${ADULT_A}/1.jpg`), jpg, { contentType: "image/jpeg" }));
    await assertFails(uploadBytes(ref(mfaA(env).storage(), `households/${HID_A}/receipts/${ADULT_A}/x.svg`), jpg, { contentType: "image/svg+xml" }));
    await assertFails(uploadBytes(ref(mfaChildA(env).storage(), `households/${HID_A}/receipts/${CHILD_A}/1.jpg`), jpg, { contentType: "image/jpeg" }));
    await assertFails(uploadBytes(ref(mfaA(env).storage(), `households/${HID_A}/receipts/${ADULT_A2}/1.jpg`), jpg, { contentType: "image/jpeg" }));
    await assertFails(uploadBytes(ref(mfaA(env).storage(), `households/${HID_A}/receipts/${ADULT_A}/1.txt`), jpg, { contentType: "text/plain" }));
  });
});
