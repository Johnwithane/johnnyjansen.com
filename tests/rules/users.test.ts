import { assertFails, assertSucceeds, type RulesTestEnvironment } from "@firebase/rules-unit-testing";
import { afterAll, beforeAll, beforeEach, describe, it } from "vitest";
import { ADULT_A, ADULT_A2, adultA, adultA2, adultB, seed, setupTestEnv } from "./setup";

let env: RulesTestEnvironment;
beforeAll(async () => { env = await setupTestEnv(); });
afterAll(async () => { await env.cleanup(); });
beforeEach(async () => {
  await env.clearFirestore();
  await seed(env);
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    await db.doc(`users/${ADULT_A}/private/google`).set({ encryptedRefreshToken: "..." });
    await db.doc(`users/${ADULT_A}/snapshots/today`).set({ dayKey: "2026-09-20", events: [] });
    await db.doc(`users/${ADULT_A}/digests/2026-09-20`).set({ subject: "x" });
  });
});

describe("users/{uid}", () => {
  it("reads own profile, nobody else's, even in the same household", async () => {
    await assertSucceeds(adultA(env).firestore().doc(`users/${ADULT_A}`).get());
    await assertFails(adultA2(env).firestore().doc(`users/${ADULT_A}`).get());
    await assertFails(adultB(env).firestore().doc(`users/${ADULT_A}`).get());
  });
  it("edits display fields only; hid and role are function-owned", async () => {
    await assertSucceeds(adultA(env).firestore().doc(`users/${ADULT_A}`).update({ name: "J", colour: "#7fd0ff" }));
    await assertFails(adultA(env).firestore().doc(`users/${ADULT_A}`).update({ hid: "hh-b" }));
    await assertFails(adultA(env).firestore().doc(`users/${ADULT_A}`).update({ role: "child" }));
    await assertFails(adultA2(env).firestore().doc(`users/${ADULT_A}`).update({ name: "hacked" }));
  });
  it("cannot create or delete a user doc", async () => {
    await assertFails(adultA(env).firestore().doc(`users/${ADULT_A2}-x`).set({ name: "new" }));
    await assertFails(adultA(env).firestore().doc(`users/${ADULT_A}`).delete());
  });
  it("private subcollection is invisible to its own owner from the client", async () => {
    await assertFails(adultA(env).firestore().doc(`users/${ADULT_A}/private/google`).get());
    await assertFails(adultA(env).firestore().doc(`users/${ADULT_A}/private/google`).set({ x: 1 }));
  });
  it("snapshots and digests: own uid reads, nobody writes", async () => {
    await assertSucceeds(adultA(env).firestore().doc(`users/${ADULT_A}/snapshots/today`).get());
    await assertSucceeds(adultA(env).firestore().doc(`users/${ADULT_A}/digests/2026-09-20`).get());
    await assertFails(adultA2(env).firestore().doc(`users/${ADULT_A}/snapshots/today`).get());
    await assertFails(adultB(env).firestore().doc(`users/${ADULT_A}/digests/2026-09-20`).get());
    await assertFails(adultA(env).firestore().doc(`users/${ADULT_A}/snapshots/today`).set({ events: [] }));
  });
});
