import { assertFails, assertSucceeds, type RulesTestEnvironment } from "@firebase/rules-unit-testing";
import { ref, uploadBytes, getBytes } from "firebase/storage";
import { afterAll, beforeAll, beforeEach, describe, it } from "vitest";
import { ADULT_A, ADULT_A2, CHILD_A, HID_A, HID_B, adultA, adultA2, adultB, childA, seed, setupTestEnv } from "./setup";

let env: RulesTestEnvironment;
beforeAll(async () => { env = await setupTestEnv(); });
afterAll(async () => { await env.cleanup(); });
beforeEach(async () => {
  await env.clearFirestore();
  await env.clearStorage();
  await seed(env);
  await env.withSecurityRulesDisabled(async (ctx) => {
    await ctx.firestore().doc(`households/${HID_A}/feedback/r1`).set(report({ reporterUid: ADULT_A2 }));
    await ctx.firestore().doc(`households/${HID_B}/feedback/rb`).set(report({ reporterUid: "adult-b" }));
  });
});

function report(over: Partial<Record<string, unknown>> = {}) {
  return {
    type: "bug",
    description: "Grocery swipe drops items",
    route: "/tasks",
    url: "https://example.com/app/tasks",
    environment: "iPhone",
    appVersion: "dev",
    screenshotPaths: [],
    status: "open",
    notes: "",
    reporterUid: ADULT_A,
    reporterName: "A",
    createdAt: new Date(),
    updatedAt: new Date(),
    ...over,
  };
}
const path = (id: string) => `households/${HID_A}/feedback/${id}`;

describe("feedback", () => {
  it("every member reads the queue; other households do not", async () => {
    await assertSucceeds(childA(env).firestore().doc(path("r1")).get());
    await assertFails(adultB(env).firestore().doc(path("r1")).get());
  });
  it("a member files a report as themselves, status open", async () => {
    await assertSucceeds(childA(env).firestore().doc(path("r2")).set(report({ reporterUid: CHILD_A })));
    await assertFails(childA(env).firestore().doc(path("r3")).set(report({ reporterUid: ADULT_A })));
    await assertFails(adultA(env).firestore().doc(path("r3")).set(report({ status: "shipped" })));
    await assertFails(adultA(env).firestore().doc(path("r3")).set(report({ type: "rant" })));
    await assertFails(adultB(env).firestore().doc(path("r3")).set(report({ reporterUid: "adult-b" })));
  });
  it("adults triage status and notes; nobody sets shipped or edits the text", async () => {
    await assertSucceeds(adultA(env).firestore().doc(path("r1")).update({ status: "triaged", notes: "Reproduced" }));
    await assertFails(adultA(env).firestore().doc(path("r1")).update({ status: "shipped" }));
    await assertFails(adultA(env).firestore().doc(path("r1")).update({ description: "edited" }));
    await assertFails(childA(env).firestore().doc(path("r1")).update({ status: "triaged" }));
    await assertFails(adultB(env).firestore().doc(path("r1")).update({ status: "triaged" }));
    await assertFails(adultA(env).firestore().doc(path("r1")).delete());
  });
});

describe("feedback screenshots (storage)", () => {
  const png = new Uint8Array([137, 80, 78, 71]);
  it("a member uploads an image under their own uid; the household reads it", async () => {
    const mine = ref(adultA(env).storage(), `households/${HID_A}/feedback/${ADULT_A}/shot.png`);
    await assertSucceeds(uploadBytes(mine, png, { contentType: "image/png" }));
    await assertSucceeds(getBytes(ref(adultA2(env).storage(), `households/${HID_A}/feedback/${ADULT_A}/shot.png`)));
    await assertFails(getBytes(ref(adultB(env).storage(), `households/${HID_A}/feedback/${ADULT_A}/shot.png`)));
  });
  it("refuses another uid's folder, another household, and a non-image", async () => {
    await assertFails(uploadBytes(ref(adultA(env).storage(), `households/${HID_A}/feedback/${ADULT_A2}/x.png`), png, { contentType: "image/png" }));
    await assertFails(uploadBytes(ref(adultA(env).storage(), `households/${HID_B}/feedback/${ADULT_A}/x.png`), png, { contentType: "image/png" }));
    await assertFails(uploadBytes(ref(adultA(env).storage(), `households/${HID_A}/feedback/${ADULT_A}/x.txt`), png, { contentType: "text/plain" }));
    await assertFails(uploadBytes(ref(adultA(env).storage(), `public/x.png`), png, { contentType: "image/png" }));
  });
});
