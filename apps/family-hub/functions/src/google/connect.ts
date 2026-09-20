import { onCall, onRequest, HttpsError, type Request } from "firebase-functions/v2/https";
import { errMeta } from "../lib/log";
import { callOpts } from "../lib/callOpts";
import { logger } from "firebase-functions/v2";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import type { Response } from "express";
import { google } from "googleapis";
import { z } from "zod";
import { db } from "../lib/admin";
import { writeAudit } from "../lib/audit";
import { sealString } from "../lib/kms";
import { GOOGLE_OAUTH_CLIENT_ID, GOOGLE_OAUTH_CLIENT_SECRET, GOOGLE_SECRETS } from "../lib/params";
import { requireMember } from "../lib/tenant";
import { hashToken, randomToken } from "../lib/tokens";
import { googleClientsFor } from "./client";
import { authUrl, oauthClient, returnUrl } from "./oauth";

// Per-person Google connect (FAMILY_PLAN.md 3, 9.3).
//
//   portal  -> googleConnectStart (callable)  : mints a state nonce bound to the uid, returns the consent URL
//   Google  -> googleOAuthCallback (request)  : state -> uid, code -> tokens, refresh token KMS-sealed to
//                                               users/{uid}/private/google, redirect back to the app
//   portal  -> googleDisconnect (callable)    : revoke at Google, delete the grant
//   portal  -> googleCalendars (callable)     : list the account's calendars; setCalendars picks the family ones
//
// The state nonce lives at oauthStates/{hash} for ten minutes and is deleted
// on use, so a callback can never attach a grant to the wrong person.

const STATE_TTL_MS = 10 * 60 * 1000;
const projectId = () => process.env.GCLOUD_PROJECT ?? process.env.GCP_PROJECT ?? "";

export const googleConnectStart = onCall(callOpts({ secrets: GOOGLE_SECRETS }), async (request) => {
  const caller = requireMember(request);
  if (caller.role !== "adult") throw new HttpsError("permission-denied", "Adults only");
  const ctx = { fn: "googleConnectStart", uid: caller.uid };
  const clientId = GOOGLE_OAUTH_CLIENT_ID.value();
  const clientSecret = GOOGLE_OAUTH_CLIENT_SECRET.value();
  if (!clientId || !clientSecret) throw new HttpsError("failed-precondition", "Google is not configured yet");
  try {
    const state = randomToken();
    await db.collection("oauthStates").doc(hashToken(state)).set({
      uid: caller.uid,
      hid: caller.hid,
      expiresAt: Timestamp.fromMillis(Date.now() + STATE_TTL_MS),
      createdAt: FieldValue.serverTimestamp(),
    });
    const url = authUrl(oauthClient(clientId, clientSecret, projectId()), state, caller.email);
    logger.info("started", ctx);
    return { url };
  } catch (err) {
    logger.error("failed", { ...ctx, err: errMeta(err) });
    throw new HttpsError("internal", "Could not start Google connect");
  }
});

const Callback = z.object({
  state: z.string().min(20).max(200).optional(),
  code: z.string().min(1).max(2000).optional(),
  error: z.string().max(200).optional(),
});

export const googleOAuthCallback = onRequest(
  { region: "us-central1", secrets: GOOGLE_SECRETS, timeoutSeconds: 60 },
  async (req: Request, res: Response) => {
    const q = Callback.safeParse(req.query);
    if (!q.success || !q.data.state) {
      res.redirect(302, returnUrl("error"));
      return;
    }
    const stateRef = db.collection("oauthStates").doc(hashToken(q.data.state));
    const stateSnap = await stateRef.get();
    const st = stateSnap.data() as { uid: string; hid: string; expiresAt: Timestamp } | undefined;
    // Burn the state whatever happens next.
    if (stateSnap.exists) await stateRef.delete();
    if (!st || st.expiresAt.toMillis() < Date.now()) {
      res.redirect(302, returnUrl("error"));
      return;
    }
    if (q.data.error || !q.data.code) {
      res.redirect(302, returnUrl("denied"));
      return;
    }
    const ctx = { fn: "googleOAuthCallback", uid: st.uid };
    try {
      const client = oauthClient(GOOGLE_OAUTH_CLIENT_ID.value(), GOOGLE_OAUTH_CLIENT_SECRET.value(), projectId());
      const { tokens } = await client.getToken(q.data.code);
      if (!tokens.refresh_token) throw new Error("no refresh token in the exchange");
      client.setCredentials(tokens);
      const me = await google.oauth2({ version: "v2", auth: client }).userinfo.get();
      const grantedEmail = (me.data.email ?? "").toLowerCase();
      const profile = (await db.collection("users").doc(st.uid).get()).data() as { email?: string } | undefined;
      // The grant must be for the account that signed in. A different Gmail
      // would put someone else's inbox on this person's Today.
      if (!grantedEmail || grantedEmail !== (profile?.email ?? "").toLowerCase()) {
        logger.warn("account mismatch", ctx);
        res.redirect(302, returnUrl("mismatch"));
        return;
      }
      const sealed = await sealString(tokens.refresh_token);
      await db.runTransaction(async (tx) => {
        tx.set(db.collection("users").doc(st.uid).collection("private").doc("google"), {
          sealedRefreshToken: sealed,
          email: grantedEmail,
          scopes: (tokens.scope ?? "").split(" ").filter(Boolean),
          connectedAt: FieldValue.serverTimestamp(),
        });
        tx.set(
          db.collection("users").doc(st.uid),
          { google: { connected: true, email: grantedEmail, calendarIds: [], familyCalendarIds: [] }, updatedAt: FieldValue.serverTimestamp() },
          { merge: true },
        );
      });
      await writeAudit(st.hid, { action: "google.connect", actorUid: st.uid });
      logger.info("connected", ctx);
      res.redirect(302, returnUrl("connected"));
    } catch (err) {
      logger.error("failed", { ...ctx, err: errMeta(err) });
      res.redirect(302, returnUrl("error"));
    }
  },
);

export const googleDisconnect = onCall(callOpts({ secrets: GOOGLE_SECRETS }), async (request) => {
  const caller = requireMember(request);
  const ctx = { fn: "googleDisconnect", uid: caller.uid };
  try {
    const clients = await googleClientsFor(caller.uid);
    if (clients) {
      // Best effort: Google may already have revoked it. Deleting our copy is what matters.
      try {
        // Revoking either token revokes the whole grant at Google.
        const { token } = await clients.auth.getAccessToken();
        if (token) await clients.auth.revokeToken(token);
      } catch (err) {
        logger.warn("revoke at Google failed", { ...ctx, err: errMeta(err) });
      }
    }
    await db.runTransaction(async (tx) => {
      tx.delete(db.collection("users").doc(caller.uid).collection("private").doc("google"));
      tx.set(db.collection("users").doc(caller.uid), { google: { connected: false, email: null, calendarIds: [], familyCalendarIds: [] }, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
    });
    await writeAudit(caller.hid, { action: "google.disconnect", actorUid: caller.uid });
    logger.info("disconnected", ctx);
    return { ok: true };
  } catch (err) {
    logger.error("failed", { ...ctx, err: errMeta(err) });
    throw new HttpsError("internal", "Could not disconnect");
  }
});

export const googleCalendars = onCall(callOpts({ secrets: GOOGLE_SECRETS }), async (request) => {
  const caller = requireMember(request);
  const clients = await googleClientsFor(caller.uid);
  if (!clients) throw new HttpsError("failed-precondition", "Google is not connected");
  try {
    const list = await clients.calendar.calendarList.list({ minAccessRole: "reader" });
    return {
      calendars: (list.data.items ?? [])
        .filter((c) => c.id)
        .map((c) => ({ id: c.id!, name: c.summary ?? c.id!, primary: !!c.primary, selected: c.selected !== false })),
    };
  } catch (err) {
    logger.error("googleCalendars failed", { uid: caller.uid, err: errMeta(err) });
    throw new HttpsError("internal", "Could not list calendars");
  }
});

const SetCalendars = z.object({
  calendarIds: z.array(z.string().min(1).max(300)).max(50),
  familyCalendarIds: z.array(z.string().min(1).max(300)).max(50).default([]),
});

/**
 * Which calendars feed the person's own Today (calendarIds; empty = all
 * selected in Google) and which of those the family may see (familyCalendarIds).
 * Family is always a subset of mine.
 */
export const setCalendars = onCall(callOpts(), async (request) => {
  const caller = requireMember(request);
  const input = SetCalendars.parse(request.data);
  const family = input.familyCalendarIds.filter((id) => input.calendarIds.length === 0 || input.calendarIds.includes(id));
  await db
    .collection("users")
    .doc(caller.uid)
    .set({ google: { calendarIds: input.calendarIds, familyCalendarIds: family }, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
  return { ok: true };
});
