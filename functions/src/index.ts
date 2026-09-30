import { initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { defineString } from "firebase-functions/params";
import { logger } from "firebase-functions/v2";
import { z } from "zod";
import { hashPassword, verifyPassword } from "./password.js";

initializeApp();

// Comma-separated list of Google account emails allowed to become admin.
// Set once: firebase functions:config is gone in v2, so this is a .env param
// (functions/.env: ADMIN_EMAILS=you@gmail.com).
const ADMIN_EMAILS = defineString("ADMIN_EMAILS", { default: "" });

const REGION = "us-central1";
const Slug = z.string().regex(/^[a-z0-9-]{2,40}$/);

// After a Google sign-in the client calls this. If the verified email is on
// the allowlist the account gets the admin claim. Idempotent.
export const ensureAdmin = onCall({ region: REGION }, async (request) => {
  if (!request.auth) throw new HttpsError("unauthenticated", "Sign in required");
  const { uid, token } = request.auth;
  const allowed = ADMIN_EMAILS.value()
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  const email = (token.email ?? "").toLowerCase();
  const isAllowed = Boolean(email) && token.email_verified === true && allowed.includes(email);
  if (!isAllowed) return { admin: false };
  if (token.admin !== true) {
    await getAuth().setCustomUserClaims(uid, { ...(token.labs ? { labs: token.labs } : {}), admin: true });
    logger.info("admin claim set", { fn: "ensureAdmin", uid });
  }
  return { admin: true };
});

// A visitor (anonymous or otherwise) trades a password for a `labs` claim
// naming the prototype. Claims persist with the account, so the browser stays
// unlocked until it signs out. Wrong password: a generic failure.
export const unlockPrototype = onCall({ region: REGION }, async (request) => {
  if (!request.auth) throw new HttpsError("unauthenticated", "Sign in required");
  const input = z.object({ slug: Slug, password: z.string().min(1).max(200) }).parse(request.data);
  const ctx = { fn: "unlockPrototype", uid: request.auth.uid, slug: input.slug };
  const snap = await getFirestore().doc(`labAccess/${input.slug}`).get();
  const hash = snap.get("passwordHash") as string | undefined;
  if (!hash || !verifyPassword(input.password, hash)) {
    logger.warn("unlock refused", ctx);
    throw new HttpsError("permission-denied", "That password did not work");
  }
  const existing = Array.isArray(request.auth.token.labs) ? (request.auth.token.labs as string[]) : [];
  const labs = Array.from(new Set([...existing, input.slug]));
  await getAuth().setCustomUserClaims(request.auth.uid, {
    ...(request.auth.token.admin === true ? { admin: true } : {}),
    labs,
  });
  await snap.ref.set({ unlocks: FieldValue.increment(1), lastUnlockAt: FieldValue.serverTimestamp() }, { merge: true });
  logger.info("unlocked", ctx);
  return { labs };
});

// Admin only. Stores a scrypt hash; the password itself is never kept.
export const setPrototypePassword = onCall({ region: REGION }, async (request) => {
  if (!request.auth) throw new HttpsError("unauthenticated", "Sign in required");
  if (request.auth.token.admin !== true) throw new HttpsError("permission-denied", "Admin only");
  const input = z.object({ slug: Slug, password: z.string().min(4).max(200) }).parse(request.data);
  await getFirestore()
    .doc(`labAccess/${input.slug}`)
    .set({ passwordHash: hashPassword(input.password), updatedAt: FieldValue.serverTimestamp() }, { merge: true });
  logger.info("password set", { fn: "setPrototypePassword", uid: request.auth.uid, slug: input.slug });
  return { ok: true };
});
