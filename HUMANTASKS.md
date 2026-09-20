# Human tasks

Things only Johnny can do. Tick them off in order; each phase's code assumes the ones above it.

## Phase 0: get the portal live

- [x] Answer the open questions (2026-09-19: Gmail, everything on Firebase, 6:30am, new environment).
- [ ] **Create the Firebase project** `johnnyjansen-portal` on your personal Google account (Blaze plan, needed for scheduled functions and outbound Google API calls). Enable Firestore (production mode, `us-central1` or `nam5`), Authentication → Google provider, and Cloud Functions.
- [ ] **Register a web app** in the project and copy its config into a GitHub *variable* set: `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_APP_ID` (repo Settings → Secrets and variables → Actions → Variables). Same values into a local `portal/.env` for dev.
- [ ] **Set the owner params.** Locally: copy `functions/.env.example` to `functions/.env` and fill `OWNER_EMAIL` (the Google account you will sign in with) and `TIMEZONE`. This file is untracked.
- [ ] **Set the ME token.** `openssl rand -hex 32`, then `firebase functions:secrets:set ME_TOKEN` and paste it. Keep the value: it goes in the Claude Code environment next.
- [ ] **Google OAuth client for the functions.** Google Cloud console → APIs & Services → enable *Google Calendar API* and *Gmail API* → OAuth consent screen (External, add your own address as a test user; it can stay in Testing) → Credentials → OAuth client, type **Desktop app**. Then `firebase functions:secrets:set GOOGLE_OAUTH_CLIENT_ID` and `GOOGLE_OAUTH_CLIENT_SECRET`.
- [ ] **Mint the refresh token** locally: `GOOGLE_OAUTH_CLIENT_ID=... GOOGLE_OAUTH_CLIENT_SECRET=... npm run google:auth`, sign in as the owner account, then `firebase functions:secrets:set GOOGLE_OAUTH_REFRESH_TOKEN` with the printed value. Note: a consent screen left in Testing expires refresh tokens after 7 days; publish the app (it only ever has one user) to make it permanent.
- [ ] **First deploy** from a machine logged into Firebase: `npm run deploy:rules && npm run deploy:functions && npm run deploy:hosting`. Open `https://johnnyjansen-portal.web.app` (the portfolio) and `/app` (the portal), sign in with the owner account, tap Refresh on Today.
- [ ] **DNS cutover.** Firebase Hosting → Add custom domain `johnnyjansen.com` (and `www`), then replace the GitHub Pages A/CNAME records at the registrar with the ones Firebase gives you. Add `johnnyjansen.com` to Authentication → Settings → Authorized domains. Once it resolves to Firebase: turn off GitHub Pages in the repo settings and delete the root `CNAME` file (a later commit can also move the portfolio into `site/`). `PORTAL_URL` in `functions/src/digest/runDigest.ts` already says `https://johnnyjansen.com/app`.
- [ ] **CI deploys.** Create a service account key with Firebase Admin + Cloud Functions Developer + Service Account User roles, store it as the GitHub secret `FIREBASE_SERVICE_ACCOUNT`, then set the GitHub variable `FIREBASE_DEPLOY_ENABLED=true`. Until then the workflow only checks.
- [ ] **Claude Code environment.** In claude.ai/code → Environments, create `johnnyjansen` with the env var `ME_TOKEN=<the token>`. Then in any session: `npm run me today`.

## Phase 1

- [ ] **Enter the family in the wizard**, not in the repo. Names, birth dates and colours for both adults and both kids go in through the setup screens once the project is live (the repo is public, so they are never written here; the private mockups already show them).
- [ ] Decide the weekend rule for the digest (send / skip / shorter).
