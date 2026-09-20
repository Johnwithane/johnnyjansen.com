import { assertFails, assertSucceeds, type RulesTestEnvironment } from "@firebase/rules-unit-testing";
import { afterAll, beforeAll, beforeEach, describe, it } from "vitest";
import { ADULT_A, HID_A, HID_B, NOBODY, adultA, adultB, childA, seed, setupTestEnv, stranger, unverified } from "./setup";

let env: RulesTestEnvironment;
beforeAll(async () => { env = await setupTestEnv(); });
afterAll(async () => { await env.cleanup(); });
beforeEach(async () => { await env.clearFirestore(); await seed(env); });

describe("households/{hid}", () => {
  it("a member reads their own household", async () => {
    await assertSucceeds(adultA(env).firestore().doc(`households/${HID_A}`).get());
    await assertSucceeds(childA(env).firestore().doc(`households/${HID_A}`).get());
  });
  it("cross-tenant: a member of A cannot read B", async () => {
    await assertFails(adultA(env).firestore().doc(`households/${HID_B}`).get());
  });
  it("no claim, no household", async () => {
    await assertFails(stranger(env, NOBODY).firestore().doc(`households/${HID_A}`).get());
  });
  it("an unverified email is not a member", async () => {
    await assertFails(unverified(env, ADULT_A, HID_A).firestore().doc(`households/${HID_A}`).get());
  });
  it("nobody writes the household doc from the client", async () => {
    await assertFails(adultA(env).firestore().doc(`households/${HID_A}`).update({ name: "Renamed" }));
    await assertFails(adultA(env).firestore().doc(`households/new`).set({ name: "New" }));
    await assertFails(adultA(env).firestore().doc(`households/${HID_A}`).delete());
  });
});

describe("households/{hid}/invites", () => {
  beforeEach(async () => {
    await env.withSecurityRulesDisabled(async (ctx) => {
      await ctx.firestore().doc(`households/${HID_A}/invites/i1`).set({ emailLower: "x@example.com", tokenHash: "h", role: "adult" });
    });
  });
  it("an adult reads invites, a child does not", async () => {
    await assertSucceeds(adultA(env).firestore().doc(`households/${HID_A}/invites/i1`).get());
    await assertFails(childA(env).firestore().doc(`households/${HID_A}/invites/i1`).get());
  });
  it("cross-tenant: B cannot read A's invites", async () => {
    await assertFails(adultB(env).firestore().doc(`households/${HID_A}/invites/i1`).get());
  });
  it("no client writes", async () => {
    await assertFails(adultA(env).firestore().doc(`households/${HID_A}/invites/i2`).set({ emailLower: "y@example.com" }));
    await assertFails(adultA(env).firestore().doc(`households/${HID_A}/invites/i1`).delete());
  });
});

describe("households/{hid}/audit", () => {
  beforeEach(async () => {
    await env.withSecurityRulesDisabled(async (ctx) => {
      await ctx.firestore().doc(`households/${HID_A}/audit/e1`).set({ action: "invite.create", actorUid: ADULT_A });
    });
  });
  it("adults read, children and other households do not", async () => {
    await assertSucceeds(adultA(env).firestore().doc(`households/${HID_A}/audit/e1`).get());
    await assertFails(childA(env).firestore().doc(`households/${HID_A}/audit/e1`).get());
    await assertFails(adultB(env).firestore().doc(`households/${HID_A}/audit/e1`).get());
  });
  it("no client writes, even by an adult", async () => {
    await assertFails(adultA(env).firestore().doc(`households/${HID_A}/audit/e2`).set({ action: "x" }));
  });
});

describe("meTokens", () => {
  it("is invisible to every client", async () => {
    await env.withSecurityRulesDisabled(async (ctx) => {
      await ctx.firestore().doc(`meTokens/abc`).set({ uid: ADULT_A, hid: HID_A });
    });
    await assertFails(adultA(env).firestore().doc(`meTokens/abc`).get());
    await assertFails(adultA(env).firestore().doc(`meTokens/def`).set({ uid: ADULT_A, hid: HID_A }));
  });
});

describe("oauthStates", () => {
  it("is invisible to every client", async () => {
    await env.withSecurityRulesDisabled(async (ctx) => {
      await ctx.firestore().doc(`oauthStates/abc`).set({ uid: ADULT_A, hid: HID_A });
    });
    await assertFails(adultA(env).firestore().doc(`oauthStates/abc`).get());
    await assertFails(adultA(env).firestore().doc(`oauthStates/def`).set({ uid: ADULT_A, hid: HID_A }));
  });
});
