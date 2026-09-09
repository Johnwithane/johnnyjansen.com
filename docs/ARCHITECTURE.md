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

## Phase two: the SiteMason intake

The contact form asks for a website URL. A Cloud Function in the SiteMason project writes the submission into its `leads` collection; the operator app's crawl and research pipeline then produces a private "what I would fix first" page to send back before the first call. Not in the first release (decided 2026-09-09).
