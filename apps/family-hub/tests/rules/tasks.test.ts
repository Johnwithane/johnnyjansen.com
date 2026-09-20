import { assertFails, assertSucceeds, type RulesTestEnvironment } from "@firebase/rules-unit-testing";
import { afterAll, beforeAll, beforeEach, describe, it } from "vitest";
import { ADULT_A, ADULT_A2, CHILD_A, HID_A, HID_B, adultA, adultA2, adultB, childA, seed, setupTestEnv } from "./setup";

let env: RulesTestEnvironment;
beforeAll(async () => { env = await setupTestEnv(); });
afterAll(async () => { await env.cleanup(); });
beforeEach(async () => {
  await env.clearFirestore();
  await seed(env);
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    await db.doc(`households/${HID_A}/tasks/shared`).set(task({ ownerUid: ADULT_A, visibility: "household" }));
    await db.doc(`households/${HID_A}/tasks/mine`).set(task({ ownerUid: ADULT_A, visibility: "private" }));
    await db.doc(`households/${HID_B}/tasks/b-shared`).set(task({ ownerUid: "adult-b", visibility: "household" }));
  });
});

function task(over: Partial<Record<string, unknown>> = {}) {
  return {
    title: "Renew car insurance",
    done: false,
    doneAt: null,
    due: null,
    notes: "",
    visibility: "household",
    ownerUid: ADULT_A,
    assigneeUid: null,
    source: "portal",
    createdAt: new Date(),
    updatedAt: new Date(),
    ...over,
  };
}

const path = (id: string) => `households/${HID_A}/tasks/${id}`;

describe("tasks: read", () => {
  it("every member reads a shared task, including a child", async () => {
    await assertSucceeds(adultA2(env).firestore().doc(path("shared")).get());
    await assertSucceeds(childA(env).firestore().doc(path("shared")).get());
  });
  it("a private task is readable by its owner only", async () => {
    await assertSucceeds(adultA(env).firestore().doc(path("mine")).get());
    await assertFails(adultA2(env).firestore().doc(path("mine")).get());
  });
  it("cross-tenant: B cannot read A's shared task", async () => {
    await assertFails(adultB(env).firestore().doc(path("shared")).get());
    await assertFails(adultA(env).firestore().doc(`households/${HID_B}/tasks/b-shared`).get());
  });
});

describe("tasks: create", () => {
  it("a member creates a task they own", async () => {
    await assertSucceeds(adultA2(env).firestore().doc(path("t1")).set(task({ ownerUid: ADULT_A2 })));
    await assertSucceeds(childA(env).firestore().doc(path("t2")).set(task({ ownerUid: CHILD_A, visibility: "private" })));
  });
  it("cannot create a task owned by someone else", async () => {
    await assertFails(adultA2(env).firestore().doc(path("t1")).set(task({ ownerUid: ADULT_A })));
  });
  it("cross-tenant: cannot create in another household", async () => {
    await assertFails(adultB(env).firestore().doc(path("t1")).set(task({ ownerUid: "adult-b" })));
  });
  it("rejects a bad shape", async () => {
    await assertFails(adultA(env).firestore().doc(path("t1")).set(task({ title: "" })));
    await assertFails(adultA(env).firestore().doc(path("t1")).set(task({ visibility: "public" })));
    await assertFails(adultA(env).firestore().doc(path("t1")).set(task({ source: "cli" })));
    await assertFails(adultA(env).firestore().doc(path("t1")).set({ ...task(), extra: 1 }));
  });
});

describe("tasks: update and delete", () => {
  it("any member completes a shared task; ownership stays", async () => {
    await assertSucceeds(adultA2(env).firestore().doc(path("shared")).update({ done: true }));
    await assertFails(adultA2(env).firestore().doc(path("shared")).update({ ownerUid: ADULT_A2 }));
    await assertFails(adultA2(env).firestore().doc(path("shared")).update({ source: "digest" }));
  });
  it("only the owner edits a private task", async () => {
    await assertSucceeds(adultA(env).firestore().doc(path("mine")).update({ title: "Mine, edited" }));
    await assertFails(adultA2(env).firestore().doc(path("mine")).update({ done: true }));
  });
  it("delete: owner always, an adult for shared, never a child for others' tasks", async () => {
    await assertSucceeds(adultA2(env).firestore().doc(path("shared")).delete());
    await assertFails(childA(env).firestore().doc(path("mine")).delete());
    await env.withSecurityRulesDisabled(async (ctx) => {
      await ctx.firestore().doc(path("kid-shared")).set(task({ ownerUid: ADULT_A, visibility: "household" }));
    });
    await assertFails(childA(env).firestore().doc(path("kid-shared")).delete());
    await assertSucceeds(adultA(env).firestore().doc(path("mine")).delete());
  });
  it("cross-tenant: B cannot touch A's tasks", async () => {
    await assertFails(adultB(env).firestore().doc(path("shared")).update({ done: true }));
    await assertFails(adultB(env).firestore().doc(path("shared")).delete());
  });
});
