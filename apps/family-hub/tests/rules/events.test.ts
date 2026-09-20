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
    await db.doc(`households/${HID_A}/events/e1`).set(event({ ownerUid: ADULT_A2 }));
    await db.doc(`households/${HID_B}/events/eb`).set(event({ ownerUid: "adult-b" }));
    await db.doc(`households/${HID_A}/suggestions/s1`).set(suggestion({ visibility: "household", ownerUid: ADULT_A }));
    await db.doc(`households/${HID_A}/suggestions/s2`).set(suggestion({ visibility: "private", ownerUid: ADULT_A }));
    await db.doc(`households/${HID_A}/suggestions/s3`).set(suggestion({ status: "accepted", resolvedBy: ADULT_A }));
  });
});

function event(over: Partial<Record<string, unknown>> = {}) {
  return {
    title: "Rent",
    start: "2026-09-22",
    end: "2026-09-22",
    allDay: true,
    kind: "bill",
    memberIds: [],
    location: "",
    notes: "",
    source: "portal",
    ownerUid: ADULT_A,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...over,
  };
}
function suggestion(over: Partial<Record<string, unknown>> = {}) {
  return {
    kind: "event",
    source: "scan",
    summary: "Dentist, Oct 3 at 2:30 pm",
    payload: { title: "Dentist", start: "2026-10-03T14:30:00-07:00", end: "2026-10-03T15:15:00-07:00", allDay: false },
    status: "pending",
    visibility: "household",
    ownerUid: ADULT_A,
    createdAt: new Date(),
    resolvedAt: null,
    resolvedBy: null,
    ...over,
  };
}
const ev = (id: string) => `households/${HID_A}/events/${id}`;
const sg = (id: string) => `households/${HID_A}/suggestions/${id}`;

describe("events", () => {
  it("every member reads; other households do not", async () => {
    await assertSucceeds(childA(env).firestore().doc(ev("e1")).get());
    await assertFails(adultB(env).firestore().doc(ev("e1")).get());
  });
  it("a member creates an event they own, with a valid shape", async () => {
    await assertSucceeds(childA(env).firestore().doc(ev("e2")).set(event({ ownerUid: CHILD_A, kind: "event" })));
    await assertFails(adultA2(env).firestore().doc(ev("e3")).set(event({ ownerUid: ADULT_A })));
    await assertFails(adultA(env).firestore().doc(ev("e3")).set(event({ kind: "party" })));
    await assertFails(adultA(env).firestore().doc(ev("e3")).set(event({ title: "" })));
    await assertFails(adultA(env).firestore().doc(ev("e3")).set({ ...event(), extra: 1 }));
    await assertFails(adultB(env).firestore().doc(ev("e3")).set(event({ ownerUid: "adult-b" })));
  });
  it("anyone in the household edits; ownership never changes; delete is owner or adult", async () => {
    await assertSucceeds(adultA(env).firestore().doc(ev("e1")).update({ title: "Rent, moved" }));
    await assertFails(adultA(env).firestore().doc(ev("e1")).update({ ownerUid: ADULT_A }));
    await assertFails(childA(env).firestore().doc(ev("e1")).delete());
    await assertSucceeds(adultA(env).firestore().doc(ev("e1")).delete());
  });
});

describe("suggestions", () => {
  it("household ones read by all; private ones by their owner only; never another household", async () => {
    await assertSucceeds(childA(env).firestore().doc(sg("s1")).get());
    await assertSucceeds(adultA(env).firestore().doc(sg("s2")).get());
    await assertFails(adultA2(env).firestore().doc(sg("s2")).get());
    await assertFails(adultB(env).firestore().doc(sg("s1")).get());
  });
  it("a member accepts or dismisses as themselves, nothing else", async () => {
    await assertSucceeds(adultA2(env).firestore().doc(sg("s1")).update({ status: "accepted", resolvedAt: new Date(), resolvedBy: ADULT_A2 }));
    await assertFails(adultA(env).firestore().doc(sg("s1")).update({ status: "dismissed", resolvedBy: ADULT_A2 }));
    await assertFails(adultA(env).firestore().doc(sg("s1")).update({ status: "pending", resolvedBy: ADULT_A }));
    await assertFails(adultA(env).firestore().doc(sg("s1")).update({ summary: "edited", status: "accepted", resolvedBy: ADULT_A }));
    await assertFails(adultA(env).firestore().doc(sg("s3")).update({ status: "dismissed", resolvedBy: ADULT_A }));
  });
  it("no client creates or deletes a suggestion", async () => {
    await assertFails(adultA(env).firestore().doc(sg("s9")).set(suggestion()));
    await assertFails(adultA(env).firestore().doc(sg("s1")).delete());
  });
});
