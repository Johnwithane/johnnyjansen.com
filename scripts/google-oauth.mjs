#!/usr/bin/env node
// One-time: mint the Google refresh token the functions use to read Johnny's
// calendar + inbox and send the digest. Run it LOCALLY (it opens a browser
// and listens on localhost), then store the printed value:
//
//   GOOGLE_OAUTH_CLIENT_ID=... GOOGLE_OAUTH_CLIENT_SECRET=... npm run google:auth
//   firebase functions:secrets:set GOOGLE_OAUTH_REFRESH_TOKEN   (paste it)
//
// The client id/secret come from a "Desktop app" OAuth client in the Google
// Cloud console of the familyhub-prod project (see HUMANTASKS.md). Scopes
// are the minimum the functions use: read calendars, read mail, send mail.
// No deps: node's http server + fetch.

import http from "node:http";
import { exec } from "node:child_process";

const CLIENT_ID = process.env.GOOGLE_OAUTH_CLIENT_ID || "";
const CLIENT_SECRET = process.env.GOOGLE_OAUTH_CLIENT_SECRET || "";
const PORT = 8765;
const REDIRECT = `http://127.0.0.1:${PORT}/`;
const SCOPES = [
  "https://www.googleapis.com/auth/calendar.readonly",
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/gmail.send",
];

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error("Set GOOGLE_OAUTH_CLIENT_ID and GOOGLE_OAUTH_CLIENT_SECRET first.");
  process.exit(1);
}

const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
url.searchParams.set("client_id", CLIENT_ID);
url.searchParams.set("redirect_uri", REDIRECT);
url.searchParams.set("response_type", "code");
url.searchParams.set("scope", SCOPES.join(" "));
url.searchParams.set("access_type", "offline");
url.searchParams.set("prompt", "consent"); // forces a refresh token even if previously granted

const server = http.createServer(async (req, res) => {
  const code = new URL(req.url, REDIRECT).searchParams.get("code");
  if (!code) {
    res.end("No code in the callback.");
    return;
  }
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      redirect_uri: REDIRECT,
      grant_type: "authorization_code",
    }),
  });
  const tokens = await tokenRes.json();
  if (!tokens.refresh_token) {
    res.end("No refresh token came back. See the terminal.");
    console.error("Token response had no refresh_token:", tokens);
    server.close();
    return;
  }
  res.end("Done. You can close this tab.");
  console.log("\nGOOGLE_OAUTH_REFRESH_TOKEN=" + tokens.refresh_token);
  console.log("\nNow: firebase functions:secrets:set GOOGLE_OAUTH_REFRESH_TOKEN");
  server.close();
});

server.listen(PORT, "127.0.0.1", () => {
  console.log("Open this in the browser signed in as the OWNER account:\n\n" + url.toString() + "\n");
  const opener = process.platform === "win32" ? "start" : process.platform === "darwin" ? "open" : "xdg-open";
  exec(`${opener} "${url.toString()}"`, () => undefined);
});
