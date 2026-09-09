# CLAUDE.md

> **Read this first every session.** This file defines *how* we build. [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) defines *what* this site is and why it is shaped this way. [`docs/POSITIONING.md`](docs/POSITIONING.md) is the voice and the offer. If anything below contradicts those, they win. Flag it.

---

## Session start checklist

1. Read this file end to end
2. Read `docs/POSITIONING.md` before writing any copy
3. Check `git log -10`
4. Check `HUMANTASKS.md` for anything blocking (client sign-off, DNS, secrets)
5. Confirm which page or case study you are touching

---

## Project context

**johnnyjansen.com** is Johnny Jansen's portfolio and the front door of his consultancy. It sells one thing to one buyer: the digital platform behind a product business (public site, product data, ERP sync, configurator, quoting) for manufacturers and product companies across Canada and the US. Everything else on the site is evidence for that.

It is a **prerendered static site** with one app layer bolted on the side. The portfolio (Nuxt 4, every route baked to HTML, served from Firebase Hosting, GitHub Pages until the project exists) has no server, no database and no login; content is typed data in `app/data/` and a commit is the CMS. That was a deliberate decision against the app shells in Johnny's other repos, because no AI search crawler runs JavaScript.

The **lab** (`/lab`) is the app layer: prototypes hosted here instead of a repo each, with Firebase Auth, Firestore, Storage and three Cloud Functions behind them. Visitors are anonymous and unlock a private prototype with a password; Johnny signs in with Google as admin. The reason and the shape are in `docs/ARCHITECTURE.md` § The lab. The portfolio never imports Firebase; `useFirebase()` is lazy and null when unconfigured.

---

## Core principles

1. **The site has one job.** Every page exists to make a manufacturer's GM book a call. If a change does not serve that, it does not ship. The film work lives under About as background, never as a service.
2. **Content is data.** Case studies, career, film, offer and identity live in `app/data/*.ts`. Pages render data; they do not hold copy. A new project is a new entry in `projects.ts`, not a new page.
3. **Every route ships the SEO essentials.** Title, description under 160 characters, canonical, Open Graph, JSON-LD, and a place in the sitemap. `useSeo()` is the only way to set them. `e2e/seo-smoke.spec.ts` fails the build without them.
4. **Drafts are real pages nobody can find.** A project with `draft: true` prerenders (so a preview link works) but is noindex, out of the sitemap, and off the home page. Wishbone ships as a draft until its leadership has signed off. Flipping the flag is the publish step.
5. **Nothing personal, nothing internal.** No client pricing, customer data, security audits, kids' content, family data or competitor screenshots from the other repos. The redaction list is in `docs/POSITIONING.md`. When in doubt, describe the mechanism, not the data.
6. **No `any`.** Strict TypeScript. `nuxt typecheck` runs in CI.
7. **Mobile first.** 375px is the floor. The e2e suite checks the home page there.
8. **Minimal by default.** Fewer words, fewer sections, fewer dependencies. A new npm package needs a reason in the commit body.
9. **Default deny in the lab.** Every Firestore and Storage path has an explicit rule, and every rule has an allow test and a deny test in `tests/rules/`. Password hashes are functions-only. Feedback is never editable.
10. **Firebase changes deploy before the commit that depends on them.** `pnpm deploy:backend` (rules, storage, functions), confirm the CLI's success line, then commit. Suspended while no project exists: write "deploy pending project setup" in the commit body instead.

---

## Workflow

```
Read POSITIONING.md (if touching copy) and the last 10 commits
  ↓
Plan: files you will touch, one line
  ↓
Build: data → components → pages → tests
  ↓
Verify: pnpm verify   (lint, typecheck, unit tests, generate)
  ↓
Browser verify: pnpm preview, look at it at 375px and desktop
  ↓
E2E: pnpm test:e2e   (needs a generate first)
  ↓
Commit: "Site: short description"
  ↓
Push. CI deploys main.
```

**Before any commit:** `pnpm verify` passes, `pnpm test:e2e` passes, and `pnpm test:rules` passes if the rules changed.

---

## Architecture conventions

```
app/
├── assets/css/main.css   # Design tokens. The only place a colour is defined.
├── components/           # SiteHeader, SiteFooter, VideoEmbed, ProjectCard, OfferBand, LogoStrip
├── composables/useSeo.ts # Title, meta, canonical, OG, JSON-LD builders
├── data/                 # THE CONTENT. site.ts, projects.ts, film.ts, career.ts
├── layouts/default.vue
├── pages/                # index, work/index, work/[slug], how-i-build, about, contact, resume, lab/*
├── lab/<slug>/index.vue  # Component prototypes. Register in app/data/lab.ts
├── components/lab/       # LabHost (static iframe or gated component), LabPasswordGate, LabFeedback
├── composables/useFirebase.ts, useLabAuth.ts   # Lazy client Firebase; shared auth + claims
└── error.vue
functions/src/            # ensureAdmin, unlockPrototype, setPrototypePassword. Node 22, Zod
firestore.rules, storage.rules, tests/rules/   # Default deny. Emulator tests via pnpm test:rules
server/routes/llms.txt.ts # Plain-text index for LLM crawlers
public/                   # Static assets. static/ (logos, photos), videos/, icons/, og-default.png
public/wishbone, public/WishboneColours.html, public/tools/   # Legacy standalone tools kept at their old URLs. Not linked. Disallowed in robots.txt.
docs/legacy/              # The old single-page site, for reference only
scripts/render-brand-assets.mjs   # Renders icons + OG image from HTML with Playwright's Chromium
tests/                    # Vitest. Content integrity: slugs, dashes, description length, placeholders
e2e/                      # Playwright against .output/public. SEO essentials, drafts, sitemap, 375px
```

Rules:
- `<script setup lang="ts">` only. Typed props. Tailwind for layout; tokens from `main.css` for colour. Never a hex in a component.
- Video embeds go through `VideoEmbed` (click to load). Never a raw iframe: fifty of them was the old site's biggest problem.
- The domain is read from `app/data/site.ts`. Never hardcoded.
- `app/data/site.ts` `OFFER` is the one purchasable first step. Change the price there and nowhere else.
- **A new prototype**: a folder under `app/lab/<slug>/` (copy `sandbox`), an entry in `app/data/lab.ts` with a loader, and its own data under `labs/<slug>/data/**`. Private by default. Set its password in `/lab/admin`, then send the link and the word. Nothing else.

---

## Copy rules

- **No em or en dashes**, anywhere: copy, commits, docs. Use a period, comma or parentheses. `tests/content.test.ts` fails on one.
- Short sentences, plain words, first person. Write like a person, not a brochure.
- Avoid: seamlessly, effortlessly, elevate, unlock, robust, leverage, "not just X but Y", rule-of-three flourishes.
- Canadian spelling. Numbers only when real. A placeholder is written `[Number to confirm]` and is only allowed inside a draft (the test enforces it).
- One H1 per page. Helper text under 12 words.

---

## Commands

```bash
pnpm dev             # Nuxt dev server
pnpm generate        # Prerender everything to .output/public
pnpm preview         # Serve the generated output
pnpm lint / lint:fix
pnpm typecheck
pnpm test:run        # Vitest
pnpm test:e2e        # Playwright against .output/public (run generate first)
pnpm verify          # lint + typecheck + test:run + functions build + generate
pnpm test:rules      # Firestore rules against the emulator (needs Java)
pnpm deploy:backend  # rules + storage + functions, BEFORE the commit that needs them
node scripts/render-brand-assets.mjs   # Regenerate icons and OG images
firebase emulators:start   # Auth, Firestore, Storage, Functions locally for lab work
```

pnpm, not npm: npm 10's resolver fails on this dependency graph.

---

## Deployment

CI (`.github/workflows/ci.yml`) runs verify and e2e on every push. On `main` it deploys the generated output to Firebase Hosting when `FIREBASE_SERVICE_ACCOUNT` is set. Until the Firebase project exists (HUMANTASKS.md), the domain stays on GitHub Pages; see `docs/ARCHITECTURE.md` § Cutover for the order of operations, and do not merge to `main` before reading it.

Environment (build time, all optional):
- `NUXT_PUBLIC_GTAG_ID` GA4 id. Empty disables analytics.
- `NUXT_PUBLIC_FORM_ENDPOINT` where the contact form posts. Empty renders a mailto fallback.
- `NUXT_PUBLIC_FIREBASE_*` the lab's client config. All empty = lab says "not configured", portfolio unaffected.
- `functions/.env` `ADMIN_EMAILS` the Google accounts that become admin.

---

## Upkeep

- **A new project** → an entry in `app/data/projects.ts`, a screenshot in `public/static/work/`, a line in `docs/POSITIONING.md` redaction list if it has sensitive data. Nothing else.
- **A copy change** → re-read `docs/POSITIONING.md`; the tests catch dashes and length, not tone.
- **A headline change** → re-run `scripts/render-brand-assets.mjs` (the OG image carries it) and update `SUBHEAD` and the LinkedIn headline together.
- **A step only Johnny can do** → `HUMANTASKS.md`, same commit.

---

## Working with Johnny

- Marketer with Vue and Firebase experience. Reviews commits in GitHub. Reads diffs, does not write them. Explain the why in the commit body when it is not obvious.
- Messages are short, often voice transcribed. Read for intent, ask if ambiguous.
- Terse UI copy, no dashes, no AI voice. Say the thing in the fewest plain words.
- When something is out of scope or risky, say so.

---

## After every change

- [ ] `pnpm verify` passes
- [ ] `pnpm test:e2e` passes
- [ ] Copy has no dashes and no placeholder outside a draft
- [ ] Looked at it at 375px
- [ ] If a project changed, its `draft` flag is correct
- [ ] If rules or functions changed: rules tests pass, and it is deployed (or the commit body says the deploy is pending project setup)
- [ ] If a human step is needed, it is in `HUMANTASKS.md`
- [ ] Commit message: `Site: short description`, no dashes
