# Human tasks

Steps only Johnny can do. Grouped by what they unblock. Tick them off in the commit that closes them.

## Before launch

- [ ] **Create the Firebase project** `johnnyjansen-com` (or rename in `.firebaserc` and `ci.yml`), enable Hosting, and add the service account JSON as the GitHub secret `FIREBASE_SERVICE_ACCOUNT`.
- [ ] **Create a GA4 property** and set the repo variable `NUXT_PUBLIC_GTAG_ID`. Empty means no analytics.
- [ ] **Set the repo variable `NUXT_PUBLIC_FORM_ENDPOINT`** to the Formspree endpoint (the old one is in `.env.example`) so the contact form works at launch.
- [ ] **Read `docs/ARCHITECTURE.md` § Cutover** before merging to `main`. The old site is served by GitHub Pages from `main`; merging without the Pages source switched to GitHub Actions takes the site down.
- [ ] **Google Search Console**: verify `johnnyjansen.com`, submit `/sitemap.xml`.

## Before the lab works (Firebase project)

- [ ] **Create the Firebase project** (`johnnyjansen-com`, or rename in `.firebaserc`). Enable **Authentication** with the Google and Anonymous providers, **Firestore**, **Storage**, and **Functions** (Blaze plan; the three functions idle at zero).
- [ ] **Add the web app** in the console and copy its config into the repo variables `NUXT_PUBLIC_FIREBASE_API_KEY`, `..._AUTH_DOMAIN`, `..._PROJECT_ID`, `..._STORAGE_BUCKET`, `..._APP_ID` (and a local `.env` for `pnpm dev`).
- [ ] **Set `ADMIN_EMAILS`** in `functions/.env` to your Google account (see `functions/.env.example`).
- [ ] **Deploy the backend once**: `pnpm deploy:backend`. Confirm the CLI prints the success line for rules, storage and the three functions. This has to be live before the lab branch merges.
- [ ] **Sign in at `/lab/admin`**, press **Publish registry**, and set a password for `sandbox`. Then open `/lab/sandbox` in a private window and try the password. That is the whole loop.

## After launch

- [ ] **LinkedIn headline** to match the site's headline: "A creative director who builds the software too."
- [ ] **Accelerate Okanagan Network Membership** (service-provider tier) and one devKL talk.
- [ ] **Kelowna Chamber** listing; look at the Level Up AI Summit and the AI Freedom Summit (26 to 27 October 2026) as rooms full of the buyer.
- [ ] **Earned media**: a launch story for one of the products that names you (Castanet, BetaKit, Accelerate Okanagan blog). LinkedIn and earned media are what AI search cites; the site alone is not.
