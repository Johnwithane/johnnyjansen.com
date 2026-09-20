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
  it("a receipt path must be in this household and this person's folder, and cannot be swapped later", async () => {
    await assertSucceeds(mfaA(env).firestore().doc(txp("t5")).set(tx({ receiptPath: `households/${HID_A}/receipts/${ADULT_A}/1.jpg` })));
    await assertFails(mfaA(env).firestore().doc(txp("t6")).set(tx({ receiptPath: `households/${HID_B}/receipts/adult-b/1.jpg` })));
    await assertFails(mfaA(env).firestore().doc(txp("t6")).set(tx({ receiptPath: `households/${HID_A}/receipts/${ADULT_A2}/1.jpg` })));
    await assertFails(mfaA(env).firestore().doc(txp("t1")).update({ receiptPath: `households/${HID_A}/receipts/${ADULT_A}/x.jpg` }));
  });
  it("edits keep the owner; delete is adults only", async () => {
    await assertSucceeds(mfaA2(env).firestore().doc(txp("t1")).update({ category: "groceries" }));
    await assertFails(mfaA2(env).firestore().doc(txp("t1")).update({ ownerUid: ADULT_A2 }));
    await assertFails(mfaChildA(env).firestore().doc(txp("t1")).delete());
    await assertSucceeds(mfaA2(env).firestore().doc(txp("t1")).delete());
  });
});

describe("settings and rateLimits", () => {
  it("settings: members read, adults write, nobody deletes", async () => {
    await assertSucceeds(childA(env).firestore().doc(`households/${HID_A}/settings/budget`).get());
    await assertSucceeds(adultA(env).firestore().doc(`households/${HID_A}/settings/budget`).set({ envelopes: { groceries: 950 } }, { merge: true }));
    await assertFails(childA(env).firestore().doc(`households/${HID_A}/settings/budget`).set({ envelopes: {} }));
    await assertFails(adultB(env).firestore().doc(`households/${HID_A}/settings/budget`).get());
    await assertFails(adultA(env).firestore().doc(`households/${HID_A}/settings/budget`).delete());
  });
  it("rateLimits are invisible to every client", async () => {
    await assertFails(adultA(env).firestore().doc(`rateLimits/ai_${HID_A}_2026-09-20`).get());
    await assertFails(adultA(env).firestore().doc(`rateLimits/ai_${HID_A}_2026-09-20`).set({ count: 0 }));
  });
});

describe("receipt photos (storage)", () => {
  const jpg = new Uint8Array([255, 216, 255]);
  const mine = `households/${HID_A}/receipts/${ADULT_A}/1.jpg`;
  it("an MFA adult uploads under their own uid; MFA adults in the household read it", async () => {
    await assertSucceeds(uploadBytes(ref(mfaA(env).storage(), mine), jpg, { contentType: "image/jpeg" }));
    await assertSucceeds(getBytes(ref(mfaA2(env).storage(), mine)));
    await assertFails(getBytes(ref(mfaB(env).storage(), mine)));
  });
  it("no second factor, a child, another uid's folder, a non-image: all refused", async () => {
    await assertFails(uploadBytes(ref(adultA(env).storage(), mine), jpg, { contentType: "image/jpeg" }));
    await assertFails(getBytes(ref(adultA2(env).storage(), mine)));
    await assertFails(uploadBytes(ref(mfaChildA(env).storage(), `households/${HID_A}/receipts/${CHILD_A}/1.jpg`), jpg, { contentType: "image/jpeg" }));
    await assertFails(uploadBytes(ref(mfaA(env).storage(), `households/${HID_A}/receipts/${ADULT_A2}/1.jpg`), jpg, { contentType: "image/jpeg" }));
    await assertFails(uploadBytes(ref(mfaA(env).storage(), `households/${HID_A}/receipts/${ADULT_A}/1.txt`), jpg, { contentType: "text/plain" }));
  });
});
