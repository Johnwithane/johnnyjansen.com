# CLAUDE.md

> Read this first every session. `FAMILY_PLAN.md` is the master spec (modules, household model, phases, design system). `PORTAL_PLAN.md` is the Phase 0 record. `HUMANTASKS.md` is what only Johnny can do.

## What this repo is

Two things share one repo and one domain:

1. **The portfolio** at the repo root (`index.html`, `resume.html`, `PocketJams.html`, `css/`, `js/`, `static/`, `videos/`). Plain static files, no build step. Leave it alone unless the task is about the portfolio.
2. **The family portal**: `portal/` (Vue 3 + Vite + Tailwind, served at `/app`), `functions/` (Cloud Functions: households and invites, per-person daily digest, Google calendar + Gmail pull, the `me` endpoint), `scripts/me.mjs` (the CLI a Claude Code session uses), `firestore.rules` + `tests/rules/`.

Both ship as ONE Firebase Hosting site (project `familyhub-prod`): `scripts/build-site.mjs` copies the root static files into `dist/` and the portal build into `dist/app/`. GitHub Pages still serves the root until DNS moves (HUMANTASKS.md); the portfolio files stay at the root so that cutover is DNS only. Anything new at the repo root that is not site content must be added to the skip lists in `build-site.mjs`.

Nothing personal goes in the repo. It is public. Identity and credentials live in Firebase params and Secret Manager (`functions/src/lib/params.ts`).

## Session start

1. Read this file, then `FAMILY_PLAN.md` (phases + open questions), then `PORTAL_PLAN.md` for what Phase 0 built.
2. `git log -10`.
3. If `$ME_TOKEN` is set, `npm run me today` works from here and is the fastest way to see the real state.

## Principles

Same as bettertour and Wishbone, shortened:

- One feature at a time, fully shipped: lint, build, tests, committed.
- Consistency over cleverness. Match the existing pattern.
- Strict TS, no `any`. Zod at every boundary (`functions/src/me/schema.ts` is the model).
- Mobile first, 375px. Johnny uses this on his phone.
- Default deny in `firestore.rules`. Household claims `{ hid, role }` are set only by `createHousehold` / `acceptInvite`; rules check the claim first, then role, then ownership. `isMfa()` reads `sign_in_second_factor` for Phase 2 collections. Never add a doc-lookup rule. Every collection has allow, deny and cross-tenant deny tests in `tests/rules/` (`npm run test:rules`, emulator).
- Security is a requirement (FAMILY_PLAN.md section 9). Every document path starts with `households/{hid}/`; every rule checks the `hid` claim first; every collection has an allow, a deny and a cross-tenant deny test; Google tokens are KMS-encrypted; sensitive fields are encrypted client-side; App Check on; a security review pass before a phase ships.
- This is a product with one tenant so far (FAMILY_PLAN.md section 10). Nothing hardcodes the Jansens, the brand lives in two files, and system mail comes from the product domain, never a personal Gmail.
- Machines propose, people confirm. Anything AI or the laptop worker produces lands in the suggestions queue; a person accepts it through the normal service. Never write real data from an automation directly.
- Offline: the portal reads from Firestore's persistent cache. Never `await` a Firestore write in a UI handler (the ack never comes offline); `onSnapshot` already shows it. Anything that needs the network (callables) is guarded by `navigator.onLine` and says so.
- Firebase changes deploy before the commit that depends on them. A credential-less session writes "deploy owed" in the commit body and CI deploys on merge to `main` once `FIREBASE_DEPLOY_ENABLED` is on.
- The `me` endpoint is a closed menu of actions, not a query surface. Add an action to `schema.ts` + `me.ts` + `scripts/me.mjs` together, and keep write actions to what the portal can do by hand.
- Copy: terse, plain, no dashes, no AI voice. One short sentence per helper text.

## Layout

```
portal/src/
  seo/site.ts                brand (mirror of functions/src/lib/brand.ts)
  firebase/config.ts         Firebase init (persistent cache on)
  firebase/interfaces.ts     doc types (mirror of functions/src/types.ts, keep in step)
  firebase/services/         pure async functions per collection + callable wrappers
  composables/useAuth.ts     Google sign-in + { hid, role } claims, refreshClaims()
  views/                     Login, Onboarding (found a household), Setup (wizard spine), Invite (accept), Today, Tasks, Digests, Household
  utils/birthdays.ts         upcoming birthdays from member records (tested)
functions/src/
  lib/brand.ts               BRAND_NAME, BRAND_DOMAIN, APP_BASE_URL
  lib/tenant.ts              requireSignedIn / requireMember / requireAdult (household from the TOKEN)
  lib/claims.ts, audit.ts    claim stamping; server-written audit trail
  lib/tokens.ts              random token + sha256 hash + constant-time compare
  lib/dates.ts               zone-aware day math (tested)
  household/                 createHousehold, createInvite, acceptInvite, addChild, mintMeToken/revokeMeToken, schema (tested)
  lib/kms.ts                 seal/open a string with Cloud KMS (injectable, tested)
  google/                    oauth.ts (scopes, consent URL), connect.ts (start, callback, disconnect, calendars), per-person clients from the sealed grant, calendar, gmail (read + send)
  sync/collect.ts, people.ts one pull of today per person → users/{uid}/snapshots/today
  digest/                    pure builder (tested), runDigestFor(person), 06:30 schedule over every adult
  me/                        personal-token endpoint + schema (tested)
  auth/onUserCreated.ts      profile doc only; no claims until a household
tests/rules/                 Firestore rules tests (households, tasks, users), two households seeded
scripts/me.mjs               CLI over the me endpoint (token minted on the Household screen)
```

## Commands

```bash
npm run portal:dev        # Vite dev server (needs portal/.env, see portal/.env.example)
npm run lint              # portal eslint
npm run build             # portal build, site assembly into dist/, functions tsc
npm run test:run          # portal + functions vitest
npm run test:rules        # Firestore rules under the emulator (needs Java)
npm run me <cmd>          # today | calendar | inbox | tasks | add [--private] | done | rm | digest  (needs $ME_TOKEN)
npm run deploy:rules      # firestore rules + indexes
npm run deploy:functions  # all functions (10 today, quota is fine)
npm run deploy:hosting    # portal build + site build + hosting (portfolio + /app)
```

Before any commit: `npm run lint && npm run build && npm run test:run`, plus `npm run test:rules` when the rules or a service changed.

## Working with Johnny

Marketer, reads the diff, mobile first, short messages. Explain why when it matters. Questions go as numbered, lettered multiple choice he can answer in one line (`1A 2C`). Push back on scope or risk plainly.
