import { google } from "googleapis";
import { APP_BASE_URL } from "../lib/brand";

// The minimum scopes (section 9.3): read calendars, read mail, send mail.
export const GOOGLE_SCOPES = [
  "https://www.googleapis.com/auth/calendar.readonly",
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/gmail.send",
  "openid",
  "email",
];

/** The callback function's own URL. Firebase gives every v2 function a stable one per project + region. */
export function callbackUrl(projectId: string): string {
  return `https://us-central1-${projectId}.cloudfunctions.net/googleOAuthCallback`;
}

export function oauthClient(clientId: string, clientSecret: string, projectId: string) {
  return new google.auth.OAuth2(clientId, clientSecret, callbackUrl(projectId));
}

/** Where the browser lands after the callback, with a one-word outcome. */
export function returnUrl(outcome: "connected" | "denied" | "error" | "mismatch"): string {
  return `${APP_BASE_URL}/household?google=${outcome}`;
}

export function authUrl(client: ReturnType<typeof oauthClient>, state: string, loginHint: string): string {
  return client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent", // forces a refresh token even on a re-connect
    scope: GOOGLE_SCOPES,
    state,
    login_hint: loginHint,
    include_granted_scopes: false,
  });
}
