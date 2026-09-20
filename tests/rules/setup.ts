import {
  initializeTestEnvironment,
  type RulesTestContext,
  type RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
export const PROJECT_ID = "demo-familyhub-rules";

export async function setupTestEnv(): Promise<RulesTestEnvironment> {
  return initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: {
      rules: readFileSync(resolve(here, "..", "..", "firestore.rules"), "utf8"),
      host: "127.0.0.1",
      port: 8080,
    },
  });
}

// Two households, so every collection gets a cross-tenant deny.
export const HID_A = "hh-a";
export const HID_B = "hh-b";
export const ADULT_A = "adult-a";
export const ADULT_A2 = "adult-a2";
export const CHILD_A = "child-a";
export const ADULT_B = "adult-b";
export const NOBODY = "no-household";

type Role = "adult" | "child";

/** A signed-in, verified member of `hid` with `role`. */
export function member(env: RulesTestEnvironment, uid: string, hid: string, role: Role): RulesTestContext {
  return env.authenticatedContext(uid, { email: `${uid}@example.com`, email_verified: true, hid, role });
}

/** Signed in and verified, but no household claim yet. */
export function stranger(env: RulesTestEnvironment, uid: string): RulesTestContext {
  return env.authenticatedContext(uid, { email: `${uid}@example.com`, email_verified: true });
}

/** A household member whose email is NOT verified. */
export function unverified(env: RulesTestEnvironment, uid: string, hid: string): RulesTestContext {
  return env.authenticatedContext(uid, { email: `${uid}@example.com`, email_verified: false, hid, role: "adult" });
}

export function adultA(env: RulesTestEnvironment) { return member(env, ADULT_A, HID_A, "adult"); }
export function adultA2(env: RulesTestEnvironment) { return member(env, ADULT_A2, HID_A, "adult"); }
export function childA(env: RulesTestEnvironment) { return member(env, CHILD_A, HID_A, "child"); }
export function adultB(env: RulesTestEnvironment) { return member(env, ADULT_B, HID_B, "adult"); }

/** Seed both households and a user doc per member, rules off. */
export async function seed(env: RulesTestEnvironment): Promise<void> {
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    await db.doc(`households/${HID_A}`).set({ name: "A", members: {}, memberUids: [ADULT_A, ADULT_A2, CHILD_A] });
    await db.doc(`households/${HID_B}`).set({ name: "B", members: {}, memberUids: [ADULT_B] });
    for (const [uid, hid, role] of [[ADULT_A, HID_A, "adult"], [ADULT_A2, HID_A, "adult"], [CHILD_A, HID_A, "child"], [ADULT_B, HID_B, "adult"]] as const) {
      await db.doc(`users/${uid}`).set({ hid, role, name: uid, colour: "#37ff8b" });
    }
    await db.doc(`users/${NOBODY}`).set({ name: "nobody" });
  });
}
