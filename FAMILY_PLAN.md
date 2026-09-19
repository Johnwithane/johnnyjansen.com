# Family portal: the plan

The master spec for `johnnyjansen.com/app`. Started as Johnny's own back office (`PORTAL_PLAN.md`, Phase 0, shipped 2026-09-19) and now designed as the one tool the household runs on: two adults, shared and private spaces, money, taxes, side businesses, photos, records, and the automations that keep it all moving. Mockups: the "Jansen Family Portal" design canvas (link in the session that made it).

Design brief from Johnny (2026-09-19): invite my wife; sort our photos; manage finance; do taxes; small-business invoicing; everything a family needs; minimalist.

## 1. Principles

1. **Two people, one place, honest privacy.** Everything is shared by default except what is personal by nature (your own inbox, your own private tasks). Every item carries `visibility: household | private`, and the rules enforce it, not the UI.
2. **Minimalist.** Black ground, white type, one accent (the site's green), one colour per person for "whose". Text lists over cards. One primary action per screen. Helper copy is one short sentence. No icons where a word works. Empty states are one line.
3. **Phone first, offline first.** 375px is the target. Reads come from the Firestore cache; writes never block on the network.
4. **Capture is two taps.** Add a task, snap a receipt, drop a document. Sorting happens later, often by a machine (see 6).
5. **Tax-ready every day, not in April.** Every dollar and document is categorised when it lands. The tax module is a report over data that already exists.
6. **Machines propose, people confirm.** AI (Gemini in functions for receipts and slips, the laptop's local model for photos and inbox triage) only ever creates suggestions. A human taps confirm.
7. **One user model.** A household. Members. Roles. No admin panel, no second app.

## 2. What it is not

- **Not a tax filer.** Filing in Canada needs NETFILE-certified software. We produce the numbers and the slips, organised by CRA line, plus a clean package for the accountant or for typing into Wealthsimple Tax. We never submit.
- **Not a photo host.** Originals stay where they live (phone, Google Photos, a drive). We keep an index, thumbnails, tags and albums, and the laptop does the sorting. Storing every original in Firebase Storage is possible but is a cost decision for later.
- **Not a bank aggregator, at first.** Canadian bank sync (Plaid, Flinks) costs money and needs a business account. Phase 2 imports CSV statements and receipt photos; a sync connector is a later add.
- **Not a chat app, not a social feed, not multi-family.**

## 3. Household model (replaces the single-owner model)

Phase 0 had one owner by custom claim. A family needs:

```
households/{hid}
  name, timeZone, currency: "CAD", createdAt
  members: { [uid]: { role: "adult" | "child", name, colour, email } }   (denormalised for rules + display)
  invites/{inviteId}: { email, role, token, createdBy, expiresAt, acceptedAt? }
  settings/{doc}: digest, budget, categories, businesses list...

users/{uid}
  householdId, name, colour, google: { connected, calendars[] }, digest prefs
  private/{...}: personal tasks, inbox snapshot (never readable by another member)

households/{hid}/<collection>/{id}      every shared thing lives under the household
```

**Claims.** On accepting an invite, a function sets `{ hid, role }` on the user's token. Rules check `request.auth.token.hid == hid` and, for private items, `resource.data.ownerUid == request.auth.uid`. No doc lookups in rules, same as before.

**Invite flow.** Johnny taps Invite, types her email. A one-time link goes out from his Gmail. She signs in with Google, the link's token is redeemed by a callable, claims are set, she lands on Today. Until she accepts, nothing is shared. `onUserCreated` no longer deletes strangers; it leaves them claimless, and a claimless user sees only "Ask Johnny for an invite".

**Roles.** `adult` sees and edits everything shared. `child` (later) sees own chores, allowance, family calendar; no money. `child` is designed in, not built in Phase 1.

**Google per person.** Each adult connects their own Gmail + Calendar (the refresh-token flow, per user, stored under `users/{uid}/private/google`, secrets-encrypted with a household KMS key). The family calendar merges both people's calendars plus a household calendar the app owns.

## 4. Modules

Each module is a folder under `portal/src/features/<module>/` with its own service, views and Zod schemas; a set of `me` actions; a digest section; and a row in the QA checklist. Listed in build order.

### 4.1 Today
The one screen that answers "what is today". Family agenda (both calendars merged, colour per person), tasks due today and overdue, bills due this week, a money glance (spent this month vs budget), and the latest suggestions waiting for confirmation (receipts read, photos sorted, inbox triage). Refresh pulls Google for the signed-in person.

### 4.2 Calendar
Week strip plus a day list. Sources: each adult's Google calendars, the household calendar (events the app creates: bills, renewals, birthdays, trips), and school/activity feeds by ICS URL. Add an event, assign a person, optional "needs a sitter" flag. Writes go to the household calendar; editing someone's Google event opens Google.

### 4.3 Tasks and chores
Shared lists (Home, Errands, Reno, Groceries) and a private list per person. Assign, due date, repeat (weekly chores), notes, checklist. Grocery list is a task list with aisles and a "bought" swipe, and the meal plan feeds it. Chores can be assigned to a child later with allowance credits.

### 4.4 Meals and grocery
A seven-day grid. Tap a day, pick a recipe (a recipe is a title, a link, ingredients). "Add to grocery" pushes ingredients into the Groceries list, deduped. Deliberately small: this is what keeps most families using a tool weekly.

### 4.5 Money
- **Accounts**: chequing, savings, credit cards, cash, each shared or personal. Balances are entered or come from imports.
- **Transactions**: CSV statement import (every Canadian bank exports one), receipt photo capture (Gemini reads merchant, date, total, tax, suggests a category), manual entry. Each transaction: amount, date, merchant, category, account, `business?` (which side business, if any), `taxCategory?`, receipt image, notes, split.
- **Categories**: a family list mapped to CRA tax lines where relevant (childcare, medical, donations, home office share, vehicle). The mapping is what makes taxes a report.
- **Budgets**: monthly envelopes per category, rollover on or off. The Money screen shows the month in one line per envelope.
- **Bills and subscriptions**: recurring items with amount, cadence, account, next due. They appear on the calendar and in the digest a few days out. A yearly "subscriptions audit" view: everything recurring, sorted by cost.
- **Goals**: savings targets with a monthly contribution and a date.
- **Net worth**: sum of accounts and any assets or debts entered by hand (home, mortgage, vehicles). One number, one sparkline, monthly.

### 4.6 Businesses
One record per side business: name, GST/HST number (optional), logo, invoice numbering, default terms, payment instructions (e-transfer email).
- **Clients**: name, email, address, notes.
- **Invoices**: line items, tax on or off per line, status draft → sent → paid → overdue. PDF rendered in the browser (the spec-sheet approach from Wishbone), emailed from your Gmail with the PDF attached, "Mark paid" records the income transaction against the business. Reminders for overdue.
- **Expenses**: any transaction tagged to a business, plus mileage log entries (date, from, to, km, purpose) at the CRA per-km rate.
- **Summary**: income, expenses by category, net, GST collected vs paid, per calendar year. This is the T2125 feed.

### 4.7 Taxes
A workspace per tax year per person, with a household view.
- **Deadlines**: RRSP deadline, April 30, June 15 (self-employed), instalment dates, on the calendar and in the digest.
- **Slip vault**: T4, T4A, T5, T3, RRSP receipts, tuition, donation receipts, medical receipts, childcare receipts, property tax. Drop a photo or PDF; Gemini reads slip type, issuer, boxes and amounts; you confirm.
- **Categories to lines**: the year's transactions rolled up by tax category (medical, donations, childcare, moving, home office, vehicle, union dues).
- **Business statement**: each business's summary shaped like the T2125 sections (income, expenses by line, capital cost items, home office share, vehicle share).
- **Checklist**: what is usually needed, ticked as it lands. Missing slips are listed by name.
- **Package**: one export, per person: a PDF summary plus a folder of the slips and a CSV of categorised transactions. Sent to the accountant or used to type into filing software.

### 4.8 Photos
The laptop is the sorter; the portal is the index.
- **Worker** (`worker/photos`): runs on the laptop over the library folder. Reads EXIF, computes a perceptual hash, detects near-duplicates and burst shots, runs a local vision model for scene and people tags (faces are matched into named people only on the laptop; names never leave it unless you choose), proposes albums by trip, event and month. Writes an index (path, hash, taken-at, tags, people, album suggestions) and 400px thumbnails to the portal.
- **Portal**: timeline by month, albums, favourites, people (names you gave), "on this day", the duplicates queue (keep or delete, applied by the worker on its next run), a "print picks" list for a yearbook. Originals open through whatever hosts them (a Google Photos link, or a local path shown for the laptop).
- Sharing an album is a link to a read-only page, expiring.

### 4.9 Vault
Documents that families lose: passports and IDs (with expiry reminders), insurance policies, mortgage and property tax, vehicle registration and insurance, warranties and receipts for big purchases, medical records and immunisations, wills and emergency info, school records. Each item: type, people, expiry, files, notes. Gemini reads the expiry and the type from the upload; you confirm. Expiries become calendar events 90 and 30 days out. Encrypted at rest in Storage with household-only rules; sensitive fields (numbers) shown masked with tap to reveal.

### 4.10 Home and vehicles
Maintenance schedules (furnace filter, gutters, tires, oil), each a repeating task with a history. Warranty and service records link to the Vault. A "who to call" list: plumber, electrician, mechanic, vet, sitter, doctors.

### 4.11 People and occasions
Family and friends with birthdays and anniversaries, gift ideas, gift budget per occasion, thank-you tracking. Occasions land on the calendar and in the digest a couple of weeks out.

### 4.12 Travel
Trips with dates, people, bookings (paste a confirmation email, Gemini extracts), packing list (templates), documents pulled from the Vault, a per-trip budget. BetterTour DNA, family size.

### 4.13 Health
Appointments (on the calendar), medications with refill reminders, providers, records in the Vault. Kept small on purpose.

### 4.14 Kids (optional module, designed in)
School calendar feed, activities, chores with allowance credits, milestones, a child role that sees only their things.

### 4.15 Goals and reviews
Yearly goals per person and for the household. A Sunday evening weekly review email: what got done, what slipped, money this week, next week's calendar, three questions to answer in the app. A monthly money review: budget vs actual, net worth change, subscriptions to reconsider.

### 4.16 Digest and automations
- Daily email per adult at 06:30 (personal inbox, family calendar, own tasks, bills due).
- Weekly family review (Sunday 18:00), monthly money review (1st).
- Rules, stored as documents, run inside the scheduled job: "receipt from a business email → tag that business", "event containing 'flight' → packing list", "bill due in 3 days → task for whoever owns the account", "document expiring → reminder".
- The laptop worker (photos, inbox triage with a local model) reports through the same suggestions queue.

### 4.17 Assistant
The `me` endpoint grows per-household actions (every module gets list/add/update/done). A Claude Code session on the phone with `ME_TOKEN` can do anything either adult can do by hand. Later, an in-app chat over the same actions with confirmation cards, the BetterTour pattern.

## 5. Suggestions queue (the pattern that ties it together)

`households/{hid}/suggestions/{id}`: `{ kind, source: "gemini" | "laptop" | "rule", payload, status: pending | accepted | dismissed, createdAt }`. Receipts read, slips read, photo albums proposed, duplicates found, inbox items that look like bills or bookings, expiries found on documents. One screen ("Review", reachable from Today) shows them newest first with accept and dismiss. Accepting applies the payload through the normal service, so the rules gate it like a hand-made write. Nothing automated writes real data directly.

## 6. Design system (minimalist)

- Ground `#050505`, panel `#121212`, line `#222222`, text `#ffffff`, muted `#9a9a9a` (7.5:1 on the ground), accent `#37ff8b` (the site's green), danger `#ff5c5c`. Person colours: Johnny green, partner `#7fd0ff`, each child from a short fixed list.
- Type: Helvetica Neue, Helvetica, sans-serif. Sizes 22 (screen title), 16 (body), 13 (meta), 11 uppercase tracked (section labels). Weights 400 and 500 only.
- Layout: 20px side gutter, lists with 1px dividers, no cards inside cards, 44px touch targets, bottom tab bar with five tabs: Today, Plan, Money, Photos, More. Everything else lives under More.
- Interaction: one primary button per screen, green on black. Swipes only where universal (done, bought). Sheets over modals. Amounts right-aligned, tabular figures.
- Light theme is one token swap; dark is default because the site is dark.

## 7. Phases

Each phase ships fully (lint, build, tests, rules tests, offline pass, QA path, `me` actions, digest section) before the next starts.

| Phase | Ships | Notes |
|---|---|---|
| 0 | Single-owner portal: tasks, digest, `me`, Google pull | Done 2026-09-19, not yet deployed |
| 1 | **Household + invite.** Household model, claims, invite by email, per-person Google, merged family calendar, shared and private tasks, Today rebuilt for two, per-person digest | Replaces the owner-only rules. First thing after the Firebase project exists |
| 2 | **Money.** Accounts, CSV import, receipt capture with Gemini, categories mapped to tax lines, budgets, bills and subscriptions, suggestions queue | Gemini via Vertex, same as Wishbone |
| 3 | **Businesses.** Clients, invoices with PDF and email, mark paid, expenses and mileage, yearly summary | Invoice PDF rendered client-side |
| 4 | **Taxes.** Year workspace, slip vault with reading, lines rollup, T2125-shaped statement, checklist, accountant package | Report over Phase 2 and 3 data |
| 5 | **Vault, home and vehicles, people and occasions.** Documents with expiry reading, maintenance, contacts, birthdays and gifts | Storage rules per household |
| 6 | **Photos.** Laptop worker (index, dedupe, tags, albums), portal timeline, albums, people, duplicates queue, print picks | Needs the laptop's GPU; local vision model |
| 7 | **Meals and grocery, travel, health, goals and reviews.** Weekly and monthly review emails | |
| 8 | **Automations and the local worker.** Rules engine, inbox triage on the laptop, `me` coverage of every module, in-app assistant | |
| later | Kids module, bank sync connector, light theme, Microsoft 365 for the work mailbox | Decisions for Johnny when they come up |

## 8. Decisions and open questions

Decided 2026-09-19: personal Gmail; everything on Firebase Hosting at `/app`; digest 06:30 Pacific; a `johnnyjansen` Claude Code environment carries `ME_TOKEN`; two adults now, child role designed in.

Open, to settle before the phase that needs them:
- Kids: are there children to plan for, and should they ever sign in? (Phase 1 shapes roles.)
- Photos: where do the originals live today (phone, Google Photos, a drive)? (Phase 6 worker input.)
- Businesses: how many, and is either GST/HST registered? (Phase 3 invoice tax lines.)
- Taxes: an accountant files, or you file yourselves? (Phase 4 package format.)
- Bank sync: worth paying for later, or is CSV import enough? (Phase 2 scope.)
