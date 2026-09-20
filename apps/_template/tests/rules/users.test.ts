import { assertFails, assertSucceeds, type RulesTestEnvironment } from "@firebase/rules-unit-testing";
import { afterAll, beforeAll, beforeEach, describe, it } from "vitest";
import { setupTestEnv, verified } from "./setup";

let env: RulesTestEnvironment;
beforeAll(async () => { env = await setupTestEnv(); });
afterAll(async () => { await env.cleanup(); });
beforeEach(async () => {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async (ctx) => {
    await ctx.firestore().doc("users/a").set({ name: "A" });
  });
});

describe("users/{uid}", () => {
  it("reads and edits own profile only", async () => {
    await assertSucceeds(verified(env, "a").firestore().doc("users/a").get());
    await assertFails(verified(env, "b").firestore().doc("users/a").get());
    await assertSucceeds(verified(env, "a").firestore().doc("users/a").update({ name: "A2" }));
    await assertFails(verified(env, "a").firestore().doc("users/a").update({ role: "admin" }));
  });
});
