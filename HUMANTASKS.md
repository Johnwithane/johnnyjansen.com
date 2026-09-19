# Human tasks

Things only Johnny can do. Tick them off in order; each phase's code assumes the ones above it.

## Phase 0: get the portal live

- [ ] **Answer the open questions** in `PORTAL_PLAN.md` (one line, `1A 2A 3A 4A`).
- [ ] **Create the Firebase project** `johnnyjansen-portal` on your personal Google account (Blaze plan, needed for scheduled functions and outbound Google API calls). Enable Firestore (production mode, `us-central1` or `nam5`), Authentication → Google provider, and Cloud Functions.
- [ ] **Register a web app** in the project and copy its config into a GitHub *variable* set: `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_APP_ID` (repo Settings → Secrets and variables → Actions → Variables). Same values into a local `portal/.env` for dev.
- [ ] **Set the owner params.** Locally: copy `functions/.env.example` to `functions/.env` and fill `OWNER_EMAIL` (the Google account you will sign in with) and `TIMEZONE`. This file is untracked.
- [ ] **Set the ME token.** `openssl rand -hex 32`, then `firebase functions:secrets:set ME_TOKEN` and paste it. Keep the value: it goes in the Claude Code environment next.
- [ ] **Google OAuth client for the functions.** Google Cloud console → APIs & Services → enable *Google Calendar API* and *Gmail API* → OAuth consent screen (External, add your own address as a test user; it can stay in Testing) → Credentials → OAuth client, type **Desktop app**. Then `firebase functions:secrets:set GOOGLE_OAUTH_CLIENT_ID` and `GOOGLE_OAUTH_CLIENT_SECRET`.
- [ ] **Mint the refresh token** locally: `GOOGLE_OAUTH_CLIENT_ID=... GOOGLE_OAUTH_CLIENT_SECRET=... npm run google:auth`, sign in as the owner account, then `firebase functions:secrets:set GOOGLE_OAUTH_REFRESH_TOKEN` with the printed value. Note: a consent screen left in Testing expires refresh tokens after 7 days; publish the app (it only ever has one user) to make it permanent.
- [ ] **First deploy** from a machine logged into Firebase: `npm run deploy:rules && npm run deploy:functions && npm run deploy:portal`. Then open the `.web.app` URL, sign in with the owner account, tap Refresh on Today.
- [ ] **Custom domain.** Firebase Hosting → Add custom domain `me.johnnyjansen.com`, add the DNS records it gives you where johnnyjansen.com's DNS lives. Then add `me.johnnyjansen.com` to Authentication → Settings → Authorized domains. (Change `PORTAL_URL` in `functions/src/digest/runDigest.ts` if you pick a different host.)
- [ ] **CI deploys.** Create a service account key with Firebase Admin + Cloud Functions Developer + Service Account User roles, store it as the GitHub secret `FIREBASE_SERVICE_ACCOUNT`, then set the GitHub variable `FIREBASE_DEPLOY_ENABLED=true`. Until then the workflow only checks.
- [ ] **Claude Code environment.** In claude.ai/code → Environments, create `johnnyjansen` (or reuse Default) with the env var `ME_TOKEN=<the token>`. Then in any session: `npm run me today`.
- [ ] **Optional:** if you would rather GitHub Pages not publish `portal/` and `functions/` source, switch Pages to "GitHub Actions" and add a workflow that uploads only the static files. Harmless as is; the repo is public anyway.

## Phase 1

- [ ] Decide the weekend rule for the digest (send / skip / shorter).
