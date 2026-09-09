# Human tasks

Steps only Johnny can do. Grouped by what they unblock. Tick them off in the commit that closes them.

## Before the Wishbone case study can publish

- [ ] **Get written sign-off from Wishbone leadership** for a public case study naming the company, and a one or two sentence quote from them. Until then `draft: true` stays on the `wishbone` entry in `app/data/projects.ts`.
- [ ] **Gather three or four real numbers** and replace the `[Number to confirm]` lines in `projects.ts`: products synced from Ragic, quote requests since launch, staff using the admin, a page speed or organic search change.
- [ ] **A walkthrough video** of the public site, the configurator and the admin (60 to 90 seconds, no customer data on screen). Screenshots are done (`public/static/work/`); the video replaces the brand film on the case study when it exists.

## Before launch

- [ ] **Confirm the Platform Audit price** in `app/data/site.ts` (`OFFER.price`, currently $2,500 CAD). Also confirm the two-week duration.
- [ ] **Create the Firebase project** `johnnyjansen-com` (or rename in `.firebaserc` and `ci.yml`), enable Hosting, and add the service account JSON as the GitHub secret `FIREBASE_SERVICE_ACCOUNT`.
- [ ] **Create a GA4 property** and set the repo variable `NUXT_PUBLIC_GTAG_ID`. Empty means no analytics.
- [ ] **Set the repo variable `NUXT_PUBLIC_FORM_ENDPOINT`** to the Formspree endpoint (the old one is in `.env.example`) so the contact form works at launch. The SiteMason lead function replaces it later.
- [ ] **Read `docs/ARCHITECTURE.md` § Cutover** before merging to `main`. The old site is served by GitHub Pages from `main`; merging without the Pages source switched to GitHub Actions takes the site down.
- [ ] **Google Search Console**: verify `johnnyjansen.com`, submit `/sitemap.xml`.

## Before the lab works (Firebase project)

- [ ] **Create the Firebase project** (`johnnyjansen-com`, or rename in `.firebaserc`). Enable **Authentication** with the Google and Anonymous providers, **Firestore**, **Storage**, and **Functions** (Blaze plan; the three functions idle at zero).
- [ ] **Add the web app** in the console and copy its config into the repo variables `NUXT_PUBLIC_FIREBASE_API_KEY`, `..._AUTH_DOMAIN`, `..._PROJECT_ID`, `..._STORAGE_BUCKET`, `..._APP_ID` (and a local `.env` for `pnpm dev`).
- [ ] **Set `ADMIN_EMAILS`** in `functions/.env` to your Google account (see `functions/.env.example`).
- [ ] **Deploy the backend once**: `pnpm deploy:backend`. Confirm the CLI prints the success line for rules, storage and the three functions. This has to be live before the lab branch merges.
- [ ] **Sign in at `/lab/admin`**, press **Publish registry**, and set a password for `sandbox`. Then open `/lab/sandbox` in a private window and try the password. That is the whole loop.

## After launch

- [ ] **LinkedIn headline** to match the site's headline: "Fractional CTO for manufacturers and product businesses. I build it myself."
- [ ] **Accelerate Okanagan Network Membership** (service-provider tier) and one devKL talk.
- [ ] **Kelowna Chamber** listing; look at the Level Up AI Summit and the AI Freedom Summit (26 to 27 October 2026) as rooms full of the buyer.
- [ ] **Earned media**: a Wishbone launch story that names you (Castanet, BetaKit, Accelerate Okanagan blog). LinkedIn and earned media are what AI search cites; the site alone is not.
- [ ] **SiteMason intake**: decide when to wire the contact form's website URL into the SiteMason `leads` collection and the crawl. Phase two, by decision on 2026-09-09.
