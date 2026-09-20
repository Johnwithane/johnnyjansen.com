# CLAUDE.md

> Read this first every session in `apps/family-hub/`. `PLAN.md` is the master spec (modules, household model, phases, security model, design system). `PLAN-phase0.md` is the Phase 0 record. `HUMANTASKS.md` is what only Johnny can do. The repo-level rules are in the root `CLAUDE.md` and `docs/INCUBATOR.md`.

## What this app is

**Family Hub**, a prototype incubated in johnnyjansen.com and served at `/app`, backed by its own Firebase project `familyhub-prod` (auth, Firestore, Storage, functions, secrets). Everything about it lives in this folder: `app/` (Vue 3 + Vite + Tailwind), `functions/` (households and invites, per-person digest, Google connect with KMS, the `me` endpoint, feedback), `firestore.rules` + `storage.rules` + `tests/rules/`, `scripts/me.mjs`. It ejects into its own repo with `node ../../scripts/incubate.mjs eject family-hub` (see the incubator doc); the Firebase project never moves.

Nothing personal goes in the repo. It is public. Identity and credentials live in Firebase params and Secret Manager (`functions/src/lib/params.ts`).

## Session start

1. Read this file, then `PLAN.md` (phases + open questions), then `PLAN-phase0.md` for what Phase 0 built.
2. `git log -10`.
3. If `$ME_TOKEN` is set, `npm run me today` works from here and is the fastest way to see the real state.

## Principles

Same as bettertour and Wishbone, shortened:

- One feature at a time, fully shipped: lint, build, tests, committed.
- Consistency over cleverness. Match the existing pattern.
- Strict TS, no `any`. Zod at every boundary (`functions/src/me/schema.ts` is the model).
- Mobile first, 375px. Johnny uses this on his phone.
- Default deny in `firestore.rules`. Household claims `{ hid, role }` are set only by `createHousehold` / `acceptInvite`; rules check the claim first, then role, then ownership. `isMfa()` reads `sign_in_second_factor` for Phase 2 collections. Never add a doc-lookup rule for access (see the one value check below). Every collection has allow, deny and cross-tenant deny tests in `tests/rules/` (`npm run test:rules`, emulator).
- Security is a requirement (PLAN.md section 9). Every document path starts with `households/{hid}/`; every rule checks the `hid` claim first; every collection has an allow, a deny and a cross-tenant deny test; Google tokens are KMS-encrypted; sensitive fields are encrypted client-side; App Check on; a security review pass before a phase ships.
- This is a product with one tenant so far (PLAN.md section 10). Nothing hardcodes the Jansens, the brand lives in two files, and system mail comes from the product domain, never a personal Gmail.
- Money, Taxes and the Vault are behind the second factor at every layer: `isMfa()` in both rules files, `requireMfaAdult` in callables, `meta: { mfa: true }` in the router. Add a money-class collection to all four or the weakest one is the real gate. The `me` token reaches bills, so `mintMeToken` needs a second-factor session too; the token itself is then the credential.
- Rules never look a document up to decide ACCESS (claims do that). The one lookup that exists, `resource_household_uids(h)` on a bill write, checks a VALUE (the responsible adult is a member) and costs one read; keep it to that use.
- Intake reads mail from senders the person approved, once, and stores only what it proposed plus the message id (`users/{uid}/private/intakeSeen`). Never store a body, never widen the scan past `intake.senders`. A sender is an address or a dotted domain (`SENDER_RE`, mirrored in the portal and the me schema); `scanQuery` returns "" for nothing valid and the scan must bail on "", because an empty from-list would match the whole mailbox. The email goes to the model fenced as data. What it proposes is household-visible by design: approving a sender is the consent.
- Logs never get an error OBJECT: `errMeta(err)` from `lib/log.ts`, always. A googleapis or Vertex error serialises its request (the Gmail query, the raw MIME of a digest, the prompt with an email body). `intake/scan.ts` logs only the code for a failed read, for the same reason.
- The `me` endpoint bypasses the rules (admin SDK), so every action re-implements its rule by hand: role, visibility, owner-or-adult on delete, member check on `responsibleUid`. When a rule changes, grep `me.ts` for the same collection. The token is bound to the household it was minted in (`meTokens/{hash}.hid` must equal the person's current hid).
- `users/{uid}/snapshots` and `digests` are first-factor readable. Bills never go into the stored snapshot; a stored digest that counts bills is gated on `isMfa()` in the rules.
- A security review pass (two read-only reviewers, rules and functions, findings fixed or recorded in PLAN.md 9.7) closes every phase. Phase 2's is in commit history as "Phase 2 security review".
- Machines propose, people confirm. Anything AI or the laptop worker produces lands in `households/{hid}/suggestions` (function-written; a member may only accept or dismiss); ReviewView applies the payload through the normal service. Never write real data from an automation directly.
- The household calendar (`households/{hid}/events`) stores wall-clock strings with no zone. Never format them through `new Date()` on the server; use `clockLabel`.
- Offline: the portal reads from Firestore's persistent cache. Never `await` a Firestore write in a UI handler (the ack never comes offline); `onSnapshot` already shows it. Anything that needs the network (callables) is guarded by `navigator.onLine` and says so.
- Firebase changes deploy before the commit that depends on them. A credential-less session writes "deploy owed" in the commit body and CI deploys on merge to `main` once `FIREBASE_DEPLOY_ENABLED` is on.
- The `me` endpoint is a closed menu of actions, not a query surface. Add an action to `schema.ts` + `me.ts` + `scripts/me.mjs` together, and keep write actions to what the portal can do by hand.
- Copy: terse, plain, no dashes, no AI voice. One short sentence per helper text.
- Fixing a feedback report? Add the trailer `Feedback-Id: <id>` to the commit body. CI marks it shipped after the deploy; that is the only honest "shipped". `npm run me feedback` lists the queue with screenshots downloaded.

## Layout

```
app/src/
  seo/site.ts                brand (mirror of functions/src/lib/brand.ts)
  firebase/config.ts         Firebase init (persistent cache on)
  firebase/interfaces.ts     doc types (mirror of functions/src/types.ts, keep in step)
  firebase/services/         pure async functions per collection + callable wrappers
  composables/useAuth.ts     Google sign-in + { hid, role, mfa } claims, refreshClaims()
  composables/useSuggestionAppliers.ts  accept = apply through the normal service, then mark accepted; shared by Review and the wizard
  utils/setupPlan.ts         which wizard steps show for whom (tested)
  views/                     Login (MFA code step), Onboarding, Setup (wizard: people, Google, what we found, money starter, done), Invite, Today, Calendar (week strip, household + Google), Tasks, Review (suggestions queue), Money (envelopes, due this week, recent), Receipt (snap or type a transaction), Accounts, Bills (subscriptions audit, load ledger, creep flags), Import (bank CSV), Intake (approved senders, scan now), Digests, Household (the More hub), Feedback, Security (TOTP enrol), Legal
  router/index.ts            routes with meta.mfa go to Security until the session passed the second factor; children never reach them
  data/categories.ts         spend categories + tax categories (mirror of functions/src/money/categories.ts, keep in step)
  utils/money.ts             month math, envelope sums, shrinkImage for receipt photos (tested)
  utils/bills.ts             cadence roll (mirror of functions money/cadence.ts), yearly cost, creep detection, load split (tested)
  utils/csvImport.ts         bank statement CSV → rows: column guessing (headered or not), dates, signs, category keywords, dedupe key (tested)
  utils/localTime.ts         wall-clock strings for the household calendar (YYYY-MM-DD or YYYY-MM-DDTHH:mm, no zone; tested)
  legal/                     terms.ts, privacy.ts, version.ts (bump LEGAL_VERSION to re-prompt); LegalGate.vue blocks members until accepted
  components/ReportDialog    the Report control (type, one line, screenshots, environment dump)
  utils/birthdays.ts         upcoming birthdays from member records (tested)
functions/src/
  lib/brand.ts               BRAND_NAME, BRAND_DOMAIN, APP_BASE_URL
  lib/callOpts.ts            shared onCall options: region + App Check per ENFORCE_APP_CHECK
  lib/tenant.ts              requireSignedIn / requireMember / requireAdult / requireMfaAdult (household from the TOKEN)
  lib/vertex.ts              generateJson over Vertex AI Gemini + salvageJson for truncated output (tested)
  lib/rateLimit.ts           per-household daily caps in rateLimits/ (function-only); key = action|hid|subject|localDay; actions: receipt, intake, setupScan, me.digest
  lib/log.ts                 errMeta(err): the only shape an error may take in a log line
  money/                     categories.ts (spend + CRA tax lines, tested), analyzeReceipt (image or PDF in, proposal out, writes nothing), cadence.ts (tested), bills.ts (due this week, daily roll)
  intake/                    prompt.ts (the closed vocabulary + toProposal, tested), mailText.ts (plain text from a Gmail payload, tested), scan.ts (approved senders → suggestions, bodies never stored), callables.ts (scanInbox + the 06:00 dailyIntake), setupPrompt.ts + setupScan.ts (the wizard's 90-day senders-and-subjects pass, grouped proposals, tested)
  sync/review.ts             pending-suggestion count for the digest
  lib/claims.ts, audit.ts    claim stamping; server-written audit trail
  lib/tokens.ts              random token + sha256 hash + constant-time compare
  lib/dates.ts               zone-aware day math (tested)
  household/                 createHousehold, createInvite, acceptInvite, addChild, mintMeToken/revokeMeToken, schema (tested)
  lib/kms.ts                 seal/open a string with Cloud KMS (injectable, tested)
  google/                    oauth.ts (scopes, consent URL), connect.ts (start, callback, disconnect, calendars), per-person clients from the sealed grant, calendar, gmail (read + send)
  sync/collect.ts, people.ts one pull of today per person → users/{uid}/snapshots/today
  digest/                    pure builder (tested), runDigestFor(person), 06:30 schedule over every adult
  me/                        personal-token endpoint + schema (tested), incl. feedback.list/get/triage/dispatch
  feedback/                  trailers.ts (Feedback-Id parsing, tested), markShipped.ts (CI endpoint), dispatch.ts (GitHub issue)
  auth/onUserCreated.ts      profile doc only; no claims until a household
tests/rules/                 Firestore + Storage rules tests (households, tasks, users, feedback, events, money), two households seeded; mfaA() is an adult who passed TOTP
scripts/me.mjs               CLI over the me endpoint (token minted on the Household screen)
```

## Commands

All from `apps/family-hub/` (or `npm --prefix apps/family-hub run ...` from the root):

```bash
npm run dev               # Vite dev server (needs app/.env, see app/.env.example)
npm run lint              # app eslint
npm run build             # app build (base /app/), functions tsc
npm run test:run          # app + functions vitest
npm run test:rules        # Firestore + Storage rules under the emulators (needs Java)
npm run me <cmd>          # today | calendar | inbox | tasks | add | done | rm | events | event | review | dismiss | digest | feedback | bills | bill | scan | senders  (needs $ME_TOKEN)
npm run deploy:rules      # firestore rules + indexes + storage, to familyhub-prod
npm run deploy:functions  # all functions, to familyhub-prod
```

Hosting is deployed from the repo root (`npm run build && npm run deploy:hosting` there), because the portfolio site serves every incubated app.

Before any commit: `npm run lint && npm run build && npm run test:run`, plus `npm run test:rules` when the rules or a service changed, and `node ../../scripts/incubate.mjs check family-hub` when files moved or a URL was added.

## Working with Johnny

Marketer, reads the diff, mobile first, short messages. Explain why when it matters. Questions go as numbered, lettered multiple choice he can answer in one line (`1A 2C`). Push back on scope or risk plainly.
