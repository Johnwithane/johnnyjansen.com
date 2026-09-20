import { google, type calendar_v3, type gmail_v1 } from "googleapis";

export interface GoogleClients {
  gmail: gmail_v1.Gmail;
  calendar: calendar_v3.Calendar;
}

/**
 * Gmail + Calendar clients for ONE person. Phase 1c stores each adult's
 * refresh token KMS-encrypted under users/{uid}/private/google and this
 * resolves it; until then no one is connected and every caller degrades to
 * "Google not connected", which the digest and Today both say out loud.
 */
export async function googleClientsFor(_uid: string): Promise<GoogleClients | null> {
  return null;
}

/** Build clients from a decrypted refresh token (used by Phase 1c). */
export function clientsFromRefreshToken(clientId: string, clientSecret: string, refreshToken: string): GoogleClients {
  const oauth2 = new google.auth.OAuth2(clientId, clientSecret);
  oauth2.setCredentials({ refresh_token: refreshToken });
  return {
    gmail: google.gmail({ version: "v1", auth: oauth2 }),
    calendar: google.calendar({ version: "v3", auth: oauth2 }),
  };
}
