# Personal management portal (Phase 0 record)

> Superseded as the plan by `FAMILY_PLAN.md` (2026-09-19). Kept as the record of what Phase 0 built and why.

Johnny's own back office at `johnnyjansen.com/app`: a phone-first dashboard, a daily email that rounds up calendar + inbox + tasks, and a token endpoint so a Claude Code session on any machine (including the phone) can read and act on the same data. Started 2026-09-19.

## Architecture

```
Phone / laptop                     Claude Code (remote, any machine)
  portal (Vue, Firebase Auth)        npm run me ...   ($ME_TOKEN)
        │ owner claim                        │ x-me-token
        ▼                                    ▼
  Firestore  ◄────── functions ──────►  `me` (onRequest)
  tasks/          refreshToday (call)
  snapshots/      dailyDigest (06:30)  ──► Gmail send (the digest email)
  digests/              │
                        ▼
              Google APIs (refresh token in Secret Manager)
              Calendar read, Gmail read + send
```

Decisions, and why:

- **Firebase, separate project (`familyhub-prod`).** Same stack as bettertour and Wishbone so nothing is new to maintain, and its own project because it holds personal credentials and must never share a project with a company app.
- **Everything on Firebase Hosting, one site (Johnny, 2026-09-19).** `scripts/build-site.mjs` assembles `dist/` from the static portfolio at the repo root plus the portal build at `/app`. The portfolio files stay at the repo root, not in a `site/` folder, on purpose: GitHub Pages keeps serving them unchanged until DNS moves to Firebase, so the cutover is one DNS change with nothing to coordinate. After cutover, Pages gets turned off and the files can move.
- **One user, by claim.** Google sign-in creates accounts for anyone, so `onUserCreated` stamps `owner: true` on the OWNER_EMAIL account and deletes every other account on creation. Rules check the claim only.
- **Google via a refresh token, not the sign-in session.** The scheduled job runs with nobody logged in, so it needs its own long-lived grant. `scripts/google-oauth.mjs` mints it once; it lives in Secret Manager.
- **The digest sends from Johnny's own Gmail.** No Resend, no domain verification, no third party. It appears in Sent like any message.
- **The `me` endpoint is the bettertour `feedbackQueue` pattern.** One shared secret, a closed list of actions, no admin API. A Claude Code environment with `ME_TOKEN` set can do everything the CLI can, and nothing else.
- **Portal reads snapshots, not Google.** The browser never holds Google scopes. Functions pull into `snapshots/today`; the portal subscribes to it and works from cache offline. "Refresh" is a callable.

## Phases

### Phase 0: foundation (this commit)
- [x] Repo layout, root scripts, `.gitignore`, CI workflow (check on PR, deploy on main behind a flag)
- [x] One-site hosting build (`scripts/build-site.mjs`): portfolio at `/`, portal at `/app`
- [x] `firestore.rules` (owner claim, four collections, task shape validated)
- [x] Functions: params/secrets, zone-aware dates (tested), Google client + calendar + gmail, collector, digest builder (tested), 06:30 schedule, `me` endpoint + schema (tested), `refreshToday` callable, `onUserCreated` gate
- [x] Portal: Google sign-in gated on the claim, Today / Tasks / Digests views, offline-safe task writes, 375px layout with bottom tabs
- [x] `scripts/me.mjs` CLI, `scripts/google-oauth.mjs`
- [ ] HUMAN: create the Firebase project, OAuth client, secrets, DNS, GitHub secrets (HUMANTASKS.md)
- [ ] First deploy, first sign-in, first `npm run me today`, first digest received

### Phase 1: the daily email earns its keep
- Tasks in the email link back to the portal; "done" links that complete a task from the email (signed one-click URLs)
- Digest settings doc (`settings/digest`): send time, which calendars, mail filters, quiet on weekends
- Overdue and due-today tasks called out first
- A "what happened yesterday" section: completed tasks, sent mail count
- Firestore rules tests (emulator) for all four collections

### Phase 2: act, not just read
- `me` gains `mail.draft` (Gmail draft, never send) and `mail.archive` / `mail.label`, plus `calendar.add`
- Portal inbox view with archive / snooze-to-task
- Quick capture: share sheet / PWA install so a task can be added from the phone in two taps

### Phase 3: automations
- Rules like "email from X → task", "event with 'flight' → checklist", run inside `dailyDigest` or a second schedule
- Weekly review email (Sunday evening)
- Optional: second account (work) as a second connector module with its own secrets

### Later
- Code-split Firebase out of the main chunk (665 kB today; fine for one user, ugly on 3G)
- Microsoft 365 connector if the work mailbox should join (Graph API, same shape as `google/`)

## Decisions log

2026-09-19, Johnny:
- Email account: personal Gmail. (The Wishbone M365 mailbox can join later as a Graph connector, Phase 3.)
- Hosting: everything on Firebase, portal at `johnnyjansen.com/app`.
- Digest: 6:30am Pacific.
- Claude Code: a new environment `johnnyjansen` carrying `ME_TOKEN`.

## Open questions

None right now.
