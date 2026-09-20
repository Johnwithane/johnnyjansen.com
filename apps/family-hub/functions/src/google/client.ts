import { google, type Auth, type calendar_v3, type gmail_v1 } from "googleapis";
import { logger } from "firebase-functions/v2";
import { db } from "../lib/admin";
import { openString } from "../lib/kms";
import { GOOGLE_OAUTH_CLIENT_ID, GOOGLE_OAUTH_CLIENT_SECRET } from "../lib/params";

export interface GoogleClients {
  gmail: gmail_v1.Gmail;
  calendar: calendar_v3.Calendar;
  auth: Auth.OAuth2Client;
}

/** users/{uid}/private/google, as written by googleOAuthCallback. */
export interface GoogleGrantDoc {
  sealedRefreshToken: string;
  email: string;
  scopes: string[];
}

export function clientsFromRefreshToken(clientId: string, clientSecret: string, refreshToken: string): GoogleClients {
  const oauth2 = new google.auth.OAuth2(clientId, clientSecret);
  oauth2.setCredentials({ refresh_token: refreshToken });
  return {
    gmail: google.gmail({ version: "v1", auth: oauth2 }),
    calendar: google.calendar({ version: "v3", auth: oauth2 }),
    auth: oauth2,
  };
}

/**
 * Gmail + Calendar clients for ONE person, from their KMS-sealed grant.
 * Null when they have not connected. The function that calls this must list
 * GOOGLE_SECRETS in `secrets: [...]` or the client id reads as empty.
 */
export async function googleClientsFor(uid: string): Promise<GoogleClients | null> {
  const snap = await db.collection("users").doc(uid).collection("private").doc("google").get();
  const grant = snap.data() as GoogleGrantDoc | undefined;
  if (!grant?.sealedRefreshToken) return null;
  const clientId = GOOGLE_OAUTH_CLIENT_ID.value();
  const clientSecret = GOOGLE_OAUTH_CLIENT_SECRET.value();
  if (!clientId || !clientSecret) {
    logger.warn("google: OAuth client secrets not set", { uid });
    return null;
  }
  const refreshToken = await openString(grant.sealedRefreshToken);
  return clientsFromRefreshToken(clientId, clientSecret, refreshToken);
}
