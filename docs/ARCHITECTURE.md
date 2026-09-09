# Architecture

## What this is

A prerendered static site. Nuxt 4 with `nuxt generate` bakes every route to HTML at build time. Firebase Hosting (GitHub Pages until the project exists) serves the files from a CDN. There is no server at runtime, no database, no auth, no admin.

## Why not the BetterTour / Pocket Jams shell

Johnny's other apps are logged-in, offline-first PWAs with role claims, admin consoles, Stripe and a Cloud Functions backend. Every one of those layers costs a portfolio something and gives its reader nothing. Two facts decided it (2026-09-09):

1. **No AI search crawler executes JavaScript** (GPTBot, ClaudeBot, PerplexityBot). A client-rendered SPA is invisible to ChatGPT and Perplexity retrieval. Google renders JS, with a delay. Prerendered HTML is read by all of them.
2. **The content changes a few times a year.** A commit is a perfectly good CMS for that. The moment editing from a phone without a commit becomes a real need, the Firebase project is there and an admin can be added. Not before.

The Wishbone public site (Nuxt, SSR) is the model. Same framework, same mental model, and the flagship case study and the page that sells it share a stack.

## Pieces

| Layer | Choice | Note |
| --- | --- | --- |
| Framework | Nuxt 4, `ssr: true`, fully prerendered | `nitro.prerender.routes` lists every route explicitly plus crawls links |
| Content | Typed TS in `app/data/` | `projects.ts` is the case-study CMS. `draft: true` = prerendered, noindex, out of sitemap, off home |
| Styling | Tailwind 4 + a token layer in `main.css` | Brand block is the only place a colour lives. Dark surfaces for hero, header, footer; light for reading |
| SEO | `useSeo()` composable | Title, description, canonical, OG, Twitter, JSON-LD (Person, ProfilePage, WebSite, SoftwareApplication, BreadcrumbList). `@nuxtjs/sitemap` for the sitemap. `server/routes/llms.txt.ts` for LLM crawlers |
| PWA | `@vite-pwa/nuxt`, manifest + install only | Precache is scoped to `_nuxt/**`. No page precache, no offline fallback: a stale cached portfolio page is worse than none |
| Analytics | `nuxt-gtag`, off when the id is empty | GA4 pairs with Search Console |
| Contact | Plain form posting to `NUXT_PUBLIC_FORM_ENDPOINT` | Formspree at launch. Phase two: a Cloud Function writing to SiteMason's `leads` collection |
| Video | `VideoEmbed` click-to-load facade | Nothing loads until asked. The old site loaded 56 iframes on one page |
| Quality | ESLint, `nuxt typecheck`, Vitest content tests, Playwright SEO smoke | CI runs all of it on every push |

## Legacy URLs

The old site was one page of anchors plus orphan tool pages. Fragments (`/#brand-storytelling`) cannot be redirected server-side; they land on the home page, which is fine. The standalone tools keep their files at the same paths inside `public/` (`/WishboneColours.html`, `/wishbone/Colours.html`, `/tools/*.html` with 301s from the old root paths in `firebase.json`). They are unlinked and disallowed in `robots.txt`. `docs/legacy/` holds the old `index.html`, CSS and JS for reference only.

## Cutover

The live domain is served by **GitHub Pages from `main`**. The new site does not put an `index.html` at the repo root, so merging this branch into `main` without changing the Pages source would take the site down.

Order of operations:

1. In the repo settings, switch GitHub Pages **Source** to **GitHub Actions**. The `pages` job in `ci.yml` then deploys `.output/public` (with `public/CNAME`) on every push to `main`. The domain keeps working with zero Firebase setup.
2. Merge to `main`. Confirm the site at johnnyjansen.com is the new one.
3. When the Firebase project exists and `FIREBASE_SERVICE_ACCOUNT` is set, the `firebase` job deploys the same output there. Point the domain at Firebase Hosting (add the custom domain in the console, update DNS), then remove the `pages` job.

Either host serves the same generated directory. Firebase adds the redirects and cache headers in `firebase.json`; GitHub Pages serves clean URLs but ignores that file.

## The lab (the one app layer, and why)

Decided 2026-09-09. Johnny kept starting a new repo and a new Firebase project for every small idea (Mazzaroth is the example), which meant most ideas never started. The lab is one place on johnnyjansen.com to build and share prototypes, so a prototype costs a folder and a registry entry, not a repo.

The portfolio stays exactly as above. The lab is additive:

| Piece | Where | Note |
| --- | --- | --- |
| Registry | `app/data/lab.ts` | slug, name, summary, `access` (public or private), `kind` (static HTML under `public/`, or a Vue component under `app/lab/<slug>/`) |
| Pages | `/lab` (index of public prototypes), `/lab/<slug>` (prerendered shell, noindex when private), `/lab/admin` (client-only owner console) | Shells prerender for SEO; the prototype body is `<ClientOnly>` |
| Host | `components/lab/LabHost.vue` | Static: iframe plus open link. Component: password gate when private, then the component. Feedback drawer on every one |
| Auth | Firebase Auth. Visitors are anonymous; the owner signs in with Google | `ensureAdmin` sets `admin: true` for emails in `ADMIN_EMAILS`. `unlockPrototype` trades a password for a `labs: [slug]` claim on the visitor's account, so the browser stays unlocked |
| Data | Firestore `labs/{slug}/data/**` (the prototype's own), `labs/{slug}/feedback` (create by anyone who can open, read by admin, never edited), `labMeta/{slug}` (public flag, admin written, world readable), `labAccess/{slug}` (scrypt hashes, functions only) | `firestore.rules`, tested in `tests/rules/lab.test.ts` against the emulator |
| Files | Storage `labs/{slug}/**` | 10 MB, images, PDF, audio, JSON, text |
| Functions | `functions/src/index.ts`: `ensureAdmin`, `unlockPrototype`, `setPrototypePassword` | Node 22, Zod at the boundary, structured logs |

The feedback drawer is the working method from the case studies, dogfooded: anyone using a prototype files an idea, bug or question from the page it is about, and the admin console lists them per prototype.

Rules for the lab, in order of importance:

1. The portfolio never imports Firebase. `useFirebase()` is lazy, client-only, and null when the project is not configured, so `pnpm generate` with no env produces the full site and a lab that says "not configured".
2. Rules and functions deploy before the commit that depends on them (`pnpm deploy:backend`), same discipline as every other repo. Until the project exists, note "deploy pending project setup" in the commit body.
3. A prototype that becomes a product graduates to its own repo. The lab is for things that are not products yet.

## Phase two: the SiteMason intake

The contact form asks for a website URL. A Cloud Function in the SiteMason project writes the submission into its `leads` collection; the operator app's crawl and research pipeline then produces a private "what I would fix first" page to send back before the first call. Not in the first release (decided 2026-09-09).
