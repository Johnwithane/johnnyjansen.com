# Personal management portal

Johnny's own back office at `me.johnnyjansen.com`: a phone-first dashboard, a daily email that rounds up calendar + inbox + tasks, and a token endpoint so a Claude Code session on any machine (including the phone) can read and act on the same data. Started 2026-09-19.

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

- **Firebase, separate project (`johnnyjansen-portal`).** Same stack as bettertour and Wishbone so nothing is new to maintain, and its own project because it holds personal credentials and must never share a project with a company app.
- **Portfolio stays on GitHub Pages at the root.** Zero risk to the live site. The portal ships from Firebase Hosting on a subdomain. (GitHub Pages will also publish `portal/` and `functions/` source as static files; harmless in a public repo, and HUMANTASKS has the one-line fix if it bothers you.)
- **One user, by claim.** Google sign-in creates accounts for anyone, so `onUserCreated` stamps `owner: true` on the OWNER_EMAIL account and deletes every other account on creation. Rules check the claim only.
- **Google via a refresh token, not the sign-in session.** The scheduled job runs with nobody logged in, so it needs its own long-lived grant. `scripts/google-oauth.mjs` mints it once; it lives in Secret Manager.
- **The digest sends from Johnny's own Gmail.** No Resend, no domain verification, no third party. It appears in Sent like any message.
- **The `me` endpoint is the bettertour `feedbackQueue` pattern.** One shared secret, a closed list of actions, no admin API. A Claude Code environment with `ME_TOKEN` set can do everything the CLI can, and nothing else.
- **Portal reads snapshots, not Google.** The browser never holds Google scopes. Functions pull into `snapshots/today`; the portal subscribes to it and works from cache offline. "Refresh" is a callable.

## Phases

### Phase 0: foundation (this commit)
- [x] Repo layout, root scripts, `.gitignore`, CI workflow (check on PR, deploy on main behind a flag)
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

## Open questions for Johnny

Answer in one line, like `1A 2B 3A 4A`.

```
1. Which email account is the portal for?
   A) My personal Gmail
   B) marketing@wishboneltd.com (Microsoft 365, needs a Graph connector instead of Gmail)
   C) Both, personal first

2. Where should the portal live?
   A) me.johnnyjansen.com on Firebase Hosting, portfolio stays on GitHub Pages (current plan)
   B) johnnyjansen.com/portal on GitHub Pages, no Firebase Hosting
   C) Move the whole site to Firebase Hosting, portal at /app

3. When should the daily email arrive?
   A) 6:30am Pacific (current)
   B) 7:30am Pacific
   C) Two a day, morning and 5pm

4. Claude Code access from the phone: how should the token get there?
   A) A new Claude Code environment "johnnyjansen" with ME_TOKEN set as an env var (current plan)
   B) Add ME_TOKEN to the existing Default environment
```
