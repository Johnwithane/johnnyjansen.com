import { assertFails, assertSucceeds, type RulesTestEnvironment } from "@firebase/rules-unit-testing";
import { afterAll, beforeAll, beforeEach, describe, it } from "vitest";
import { ADULT_A, ADULT_A2, adultA, adultA2, adultB, mfaA, seed, setupTestEnv } from "./setup";

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
    await db.doc(`users/${ADULT_A}/digests/2026-09-21`).set({ subject: "with bills", counts: { events: 0, unread: 0, tasks: 0, bills: 2, review: 0 } });
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
    await assertSucceeds(adultA(env).firestore().doc(`users/${ADULT_A}`).update({ setup: { done: true } }));
    await assertSucceeds(adultA(env).firestore().doc(`users/${ADULT_A}`).update({ legal: { version: 1 } }));
    await assertFails(adultA(env).firestore().doc(`users/${ADULT_A}`).update({ google: { connected: true } }));
    // Intake senders are the person's own; the scan timestamp is not.
    await assertSucceeds(adultA(env).firestore().doc(`users/${ADULT_A}`).update({ intake: { senders: ["school@example.org", "kelownaswim.ca"] } }));
    await assertFails(adultA(env).firestore().doc(`users/${ADULT_A}`).update({ intake: { senders: "school@example.org" } }));
    await assertFails(adultA(env).firestore().doc(`users/${ADULT_A}`).update({ intake: { senders: [42] } }));
    await assertFails(adultA(env).firestore().doc(`users/${ADULT_A}`).update({ intake: { senders: ["x".repeat(121)] } }));
    await assertFails(adultA(env).firestore().doc(`users/${ADULT_A}`).update({ intake: { senders: [], lastScanAt: new Date() } }));
    await assertFails(adultA(env).firestore().doc(`users/${ADULT_A}`).update({ intake: { senders: Array.from({ length: 31 }, (_, i) => `s${i}@x.co`) } }));
    // name and colour are rendered for everyone: bounded, and colour is a hex.
    await assertFails(adultA(env).firestore().doc(`users/${ADULT_A}`).update({ colour: "url(https://evil/x)" }));
    await assertFails(adultA(env).firestore().doc(`users/${ADULT_A}`).update({ name: "" }));
    await assertFails(adultA(env).firestore().doc(`users/${ADULT_A}`).update({ name: "x".repeat(61) }));
  });
  it("a function-written lastScanAt survives: the field path write works, replacing the map does not", async () => {
    await env.withSecurityRulesDisabled(async (ctx) => {
      await ctx.firestore().doc(`users/${ADULT_A2}`).set({ intake: { senders: ["a@b.co"], lastScanAt: new Date() } }, { merge: true });
    });
    await assertSucceeds(adultA2(env).firestore().doc(`users/${ADULT_A2}`).update({ "intake.senders": ["a@b.co", "c@d.co"] }));
    await assertFails(adultA2(env).firestore().doc(`users/${ADULT_A2}`).update({ intake: { senders: ["a@b.co"] } }));
    await assertFails(adultA2(env).firestore().doc(`users/${ADULT_A2}`).update({ "intake.lastScanAt": new Date(0) }));
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

  it("a digest that lists bills needs the second factor; one without does not", async () => {
    await assertSucceeds(adultA(env).firestore().doc(`users/${ADULT_A}/digests/2026-09-20`).get());
    await assertFails(adultA(env).firestore().doc(`users/${ADULT_A}/digests/2026-09-21`).get());
    await assertSucceeds(mfaA(env).firestore().doc(`users/${ADULT_A}/digests/2026-09-21`).get());
  });
});
