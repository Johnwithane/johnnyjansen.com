import { google, type calendar_v3, type gmail_v1 } from "googleapis";
import { logger } from "firebase-functions/v2";
import {
  GOOGLE_OAUTH_CLIENT_ID,
  GOOGLE_OAUTH_CLIENT_SECRET,
  GOOGLE_OAUTH_REFRESH_TOKEN,
} from "../lib/params";

export interface GoogleClients {
  gmail: gmail_v1.Gmail;
  calendar: calendar_v3.Calendar;
}

/**
 * Gmail + Calendar clients for Johnny's own account, authenticated with the
 * refresh token from scripts/google-oauth.mjs. Returns null until the three
 * GOOGLE_* secrets exist so every caller degrades to "not connected" instead
 * of crashing. The functions that call this must list GOOGLE_SECRETS in
 * `secrets: [...]` or the values read as empty at runtime.
 */
export function googleClients(): GoogleClients | null {
  const clientId = GOOGLE_OAUTH_CLIENT_ID.value();
  const clientSecret = GOOGLE_OAUTH_CLIENT_SECRET.value();
  const refreshToken = GOOGLE_OAUTH_REFRESH_TOKEN.value();
  if (!clientId || !clientSecret || !refreshToken) {
    logger.warn("google: secrets not set, skipping");
    return null;
  }
  const oauth2 = new google.auth.OAuth2(clientId, clientSecret);
  oauth2.setCredentials({ refresh_token: refreshToken });
  return {
    gmail: google.gmail({ version: "v1", auth: oauth2 }),
    calendar: google.calendar({ version: "v3", auth: oauth2 }),
  };
}
