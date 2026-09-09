import { describe, it, beforeAll, beforeEach, afterAll } from "vitest";
import { readFileSync } from "node:fs";
import {
  initializeTestEnvironment,
  assertSucceeds,
  assertFails,
  type RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import { doc, getDoc, setDoc, addDoc, collection, serverTimestamp, updateDoc } from "firebase/firestore";

let env: RulesTestEnvironment;
const ADMIN = { uid: "admin-uid", token: { admin: true } };
const UNLOCKED = { uid: "guest-uid", token: { labs: ["sandbox"] } };
const STRANGER = { uid: "stranger-uid", token: {} };

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: "demo-jj-rules",
    firestore: { rules: readFileSync("firestore.rules", "utf8"), host: "127.0.0.1", port: 8080 },
  });
});
beforeEach(async () => {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async (ctx) => {
    await setDoc(doc(ctx.firestore(), "labMeta/wishbone-colours"), { public: true, name: "Colours" });
    await setDoc(doc(ctx.firestore(), "labMeta/sandbox"), { public: false, name: "Sandbox" });
    await setDoc(doc(ctx.firestore(), "labAccess/sandbox"), { passwordHash: "scrypt$00$00" });
  });
});
afterAll(async () => {
  await env.cleanup();
});

const as = (who: { uid: string; token: Record<string, unknown> }) =>
  env.authenticatedContext(who.uid, who.token).firestore();
const anon = () => env.unauthenticatedContext().firestore();

describe("labAccess", () => {
  it("is closed to everyone, admin included", async () => {
    await assertFails(getDoc(doc(as(ADMIN), "labAccess/sandbox")));
    await assertFails(getDoc(doc(as(UNLOCKED), "labAccess/sandbox")));
  });
});

describe("labMeta", () => {
  it("is world readable", async () => {
    await assertSucceeds(getDoc(doc(anon(), "labMeta/sandbox")));
  });
  it("is written by the admin with the declared shape only", async () => {
    await assertSucceeds(setDoc(doc(as(ADMIN), "labMeta/new"), { public: true, name: "New" }));
    await assertFails(setDoc(doc(as(ADMIN), "labMeta/new"), { public: "yes", name: "New" }));
    await assertFails(setDoc(doc(as(ADMIN), "labMeta/new"), { public: true, name: "New", extra: 1 }));
    await assertFails(setDoc(doc(as(UNLOCKED), "labMeta/new"), { public: true, name: "New" }));
  });
});

describe("labs/{slug}/data", () => {
  it("opens to the admin, the unlocked visitor, and anyone on a public lab", async () => {
    await assertSucceeds(setDoc(doc(as(ADMIN), "labs/sandbox/data/a"), { v: 1 }));
    await assertSucceeds(setDoc(doc(as(UNLOCKED), "labs/sandbox/data/b"), { v: 1 }));
    await assertSucceeds(setDoc(doc(as(STRANGER), "labs/wishbone-colours/data/c"), { v: 1 }));
    await assertSucceeds(getDoc(doc(as(STRANGER), "labs/wishbone-colours/data/c")));
  });
  it("denies a stranger on a private lab, and an unlocked visitor on a different lab", async () => {
    await assertFails(setDoc(doc(as(STRANGER), "labs/sandbox/data/x"), { v: 1 }));
    await assertFails(getDoc(doc(as(STRANGER), "labs/sandbox/data/x")));
    await assertFails(setDoc(doc(as(UNLOCKED), "labs/other/data/x"), { v: 1 }));
    await assertFails(setDoc(doc(anon(), "labs/sandbox/data/x"), { v: 1 }));
  });
});

describe("labs/{slug}/feedback", () => {
  const good = (uid: string) => ({ kind: "idea", text: "Add a dark mode", path: "/lab/sandbox", uid, createdAt: serverTimestamp() });
  it("lets whoever can open the lab file a report, once, unedited", async () => {
    await assertSucceeds(addDoc(collection(as(UNLOCKED), "labs/sandbox/feedback"), good(UNLOCKED.uid)));
    await assertSucceeds(addDoc(collection(as(STRANGER), "labs/wishbone-colours/feedback"), good(STRANGER.uid)));
    await assertFails(addDoc(collection(as(STRANGER), "labs/sandbox/feedback"), good(STRANGER.uid)));
  });
  it("rejects the wrong shape", async () => {
    const db = as(UNLOCKED);
    await assertFails(addDoc(collection(db, "labs/sandbox/feedback"), { ...good(UNLOCKED.uid), kind: "rant" }));
    await assertFails(addDoc(collection(db, "labs/sandbox/feedback"), { ...good(UNLOCKED.uid), uid: "someone-else" }));
    await assertFails(addDoc(collection(db, "labs/sandbox/feedback"), { ...good(UNLOCKED.uid), text: "" }));
    await assertFails(addDoc(collection(db, "labs/sandbox/feedback"), { ...good(UNLOCKED.uid), createdAt: new Date() }));
  });
  it("is read by the admin only and never edited", async () => {
    let id = "";
    await env.withSecurityRulesDisabled(async (ctx) => {
      const ref = await addDoc(collection(ctx.firestore(), "labs/sandbox/feedback"), good(UNLOCKED.uid));
      id = ref.id;
    });
    await assertSucceeds(getDoc(doc(as(ADMIN), `labs/sandbox/feedback/${id}`)));
    await assertFails(getDoc(doc(as(UNLOCKED), `labs/sandbox/feedback/${id}`)));
    await assertFails(updateDoc(doc(as(ADMIN), `labs/sandbox/feedback/${id}`), { text: "edited" }));
  });
});
