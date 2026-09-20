# Family portal: the plan

The master spec for `johnnyjansen.com/app`. Started as Johnny's own back office (`PORTAL_PLAN.md`, Phase 0, shipped 2026-09-19) and now designed as the one tool the household runs on: two adults, shared and private spaces, money, taxes, side businesses, photos, records, and the automations that keep it all moving. Mockups: the "Jansen Family Portal" design canvas (link in the session that made it).

Design brief from Johnny (2026-09-19): invite my wife; sort our photos; manage finance; do taxes; small-business invoicing; everything a family needs; minimalist.

## 0. Two things decided on 2026-09-20 that shape everything below

**Security is a requirement, not a phase.** Section 9 is the security model. Every phase ships against it, and a feature that cannot meet it does not ship.

**This becomes a product.** Johnny's household is the first tenant of a family manager hub other families will pay for. So the code is multi-tenant from the first commit of Phase 1, the brand is centralised for a rename, system email comes from a product domain, and the free versus paid line follows BetterTour's model (the core is free, the tools that cost money to run are paid). Section 10 is the product track.

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

### 4.4 Meals, recipes and pantry
The kitchen module. Three connected things, all feeding the grocery list.

- **Recipes.** A household recipe database: title, photo, source (URL or "Mum"), servings, time, ingredients (quantity, unit, item), steps, tags (weeknight, kids, batch, vegetarian), rating, notes, "last cooked". Three ways in: type it; paste a URL (a function fetches the page and Gemini pulls the recipe out of it); photograph a cookbook page or a handwritten card (Gemini reads it). Every import lands in the suggestions queue for a confirm. Scale servings on the fly. A cook log: when a planned meal is marked cooked, the recipe's history and rating update, and the family's favourites surface.
- **Pantry.** What is in the house. Items with a rough quantity ("some", "half", "lots" beats grams), a location (fridge, freezer, pantry), and an optional best-before. Two ways in: tick things off a grocery trip as bought, or **photograph the fridge or pantry shelf**. Gemini lists what it sees with a confidence per item; the confirm screen shows the photo beside the list so a wrong guess is one tap to drop. "Used up" from a recipe's ingredients or from the list. The pantry is deliberately fuzzy: it exists to answer "do we have onions", not to count them.
- **What can we make.** Rank recipes by how much of their ingredient list the pantry covers, weight by rating, recency (not last week's dinner), tags in play (weeknight on a Tuesday), and who is cooking. Each result says what is missing; one tap adds the missing items to groceries and the recipe to a day on the plan. A second mode takes a free-text ask ("something with the chicken thighs, 30 minutes") and lets Gemini pick from OUR recipes first, and suggest a new one only if nothing fits, which then lands as a draft recipe to confirm.
- **Meal plan.** The seven-day grid, one recipe (or a plain note like "leftovers") per slot, who cooks. "Add to grocery" pushes the week's ingredients minus what the pantry says we have, deduped and grouped by aisle. Kids can rate a meal later (a thumbs up in the child role).
- **Grocery list.** A task list with aisles and a bought swipe. Bought items can be ticked into the pantry in one motion.

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

### 4.18 Feedback: bugs, ideas, improvements (the BetterTour loop, ported)
The same loop BetterTour runs, because it is how a two-person household keeps a tool honest. Every screen has a small **Report** control (More → Feedback, and a long-press on the tab bar). A report is: type (bug, idea, improvement), one line of description, optional screenshots, and an automatic environment dump (route, build, device, online state). For adults, Gemini asks two to four multiple-choice questions at submit time so the report arrives sharp (`aiClarifyFeedback`, capped per day).

Reports live in `households/{hid}/feedback/{id}` with status open → triaged → in progress → shipped or won't. The queue is visible to both adults at More → Feedback as a board. From a Claude Code session: `npm run me feedback` lists the queue with screenshots downloaded, `npm run me feedback triage <id> <status> "note"` writes back, and `npm run me feedback brief <id>` asks Gemini for a developer brief (what is asked, how we know it is done, where to look). Dispatch turns a report into a GitHub issue on this repo with the `claude` label. A fix commit carries the trailer `Feedback-Id: <id>`; after a hosting deploy, CI calls `markFeedbackShipped` with the ids it found in the pushed commits, which is the only honest moment for "shipped". That status change notifies the reporter in the app and by email. Shipped items also appear in a "What's new" line on Today for a week.

### 4.19 Setup wizard (two flows, one household)
The first ten minutes decide whether a family tool gets used. The wizard's job is to make the app feel already set up, by reading what Google already knows and asking only what it cannot know. Two flows share one engine.

**Principles.**
- **Ask nothing we can read.** Names and photos come from the Google account. Calendars come from the calendar list. Bills, subscriptions, bank and card accounts, bookings, tax slips and client invoices are found by a one-time Gemini pass over the last 90 days of inbox subjects and senders (never bodies, and never stored: the scan returns candidates, the candidates land in the suggestions queue, the mail stays in Gmail).
- **Every step is skippable and every step is resumable.** Progress lives in `households/{hid}/setup` per person. Closing the app mid-way costs nothing; Today shows a "Finish setup, 3 steps left" line until it is done, and each unfinished step can also be reached later from More.
- **Nothing is written until the person taps it.** Every found thing is a suggestion. The wizard is the suggestions queue with a nicer face.
- **Two minutes to first value.** The order is chosen so the first useful screen (Today with both calendars and tomorrow's bills) appears before the long tail (businesses, taxes, photos).
- **It is smart about who you are.** The founder gets the household questions; the invited adult gets a shorter path with the answers the founder already gave shown as facts to confirm, not questions to re-answer. A child never sees the wizard; an adult sets them up.

**Founder flow (Johnny).**
1. **Sign in with Google.** Name and photo read; time zone from the phone. One question: household name (default "The <surname>s") and city.
2. **Who lives here.** Add your wife by email now (the invite goes out immediately, from your Gmail, so she can start while you continue). Kids: names, birth years, whether they will sign in later. Each person picks a colour from the short list.
3. **Connect Google.** Calendar and Gmail scopes, one consent. Then the calendar list: tick which calendars are family (school, work, personal), which stay private. The household calendar is created here.
4. **What we found.** The 90-day scan, grouped: bills and subscriptions (sender, cadence, amount guess), accounts (bank and card senders), bookings coming up (flights, hotels, appointments), tax slips and receipts already in the inbox, clients you have invoiced from this address. Each group is a list with a tick per row; ticked rows become bills, accounts, calendar events, vault items and clients. Untick, or skip the whole group.
5. **Money starter.** The accounts found plus any you add by name. Currency CAD. A default budget proposed from the found bills (rent, utilities, subscriptions) with envelopes for groceries and eating out left for you to size. Skip and the Money tab starts empty but working.
6. **Businesses.** If step 4 found invoices you sent, they are grouped by the business name on them; confirm names, add GST numbers if registered, pick invoice numbering to continue from. If nothing was found, one screen: how many, names, registered or not.
7. **Digest and quiet hours.** 6:30 default, weekend on or off, which sections. A test email lands immediately so the first one is not a surprise.
8. **Done.** Today, populated. The photo worker, the vault and taxes are offered as "later" cards on Today rather than steps.

**Invited flow (your wife).** The invite email says who invited her and what is already there. She signs in with Google; the invite token binds her to the household and her role.
1. **You are in.** Her name and photo from Google; her colour preselected by the founder, changeable.
2. **Connect Google.** Same consent, her calendars, her inbox scan. Her scan is what makes the app hers: her subscriptions, her bookings, her clients if she has any.
3. **What we found.** Same screen, her results. Anything that duplicates a thing the founder already confirmed (the same Hydro bill from a shared address) is shown as "already in, from Johnny" and skipped.
4. **Her private space.** Her own task list, digest time, and which of her calendars stay private. One line reminds her that private stays private, and the rules make it true.
5. **Done.** Today, showing both people's day.

**What "smart" means in code.** One callable, `setupScanInbox`, runs the Gemini pass (subjects, senders, dates; a Zod schema per group; a daily cap of two runs per person). One pure function, `planSetup(person, household)`, decides which steps show for whom, so the flow is testable without a browser. The wizard writes only through the normal services and the suggestions queue, so the rules gate it exactly like the rest of the app. Re-running the wizard later is allowed and only proposes what is new.

## 5. Suggestions queue (the pattern that ties it together)

`households/{hid}/suggestions/{id}`: `{ kind, source: "gemini" | "laptop" | "rule", payload, status: pending | accepted | dismissed, createdAt }`. Receipts read, slips read, photo albums proposed, duplicates found, inbox items that look like bills or bookings, expiries found on documents. One screen ("Review", reachable from Today) shows them newest first with accept and dismiss. Accepting applies the payload through the normal service, so the rules gate it like a hand-made write. Nothing automated writes real data directly.

## 5b. AI: Vertex AI, the BetterTour pattern

All image and document reading runs on **Vertex AI (Gemini 2.5 Flash)** inside Cloud Functions, exactly as BetterTour's `analyze*Document` callables do, so nothing is new to operate:

- The client uploads to Storage (or sends base64 for small images), calls an `analyze` callable, gets back structured JSON validated by a Zod schema with null-tolerant coercions (Gemini emits nulls and numeric strings; the schema absorbs them). **The callable writes nothing.** The result becomes a suggestion; the person confirms; the normal service writes.
- Per-purpose functions, one prompt each, one schema each: `analyzeReceipt` (merchant, date, lines, totals, tax, category guess, business guess), `analyzeTaxSlip` (slip type, issuer, boxes), `analyzeDocument` (type, expiry, people, numbers to mask), `analyzeRecipe` (from a URL's text or a photo), `analyzePantryPhoto` (items with confidence and location guess), `analyzeBooking` (dates, provider, confirmation number). Categories in a prompt come from the same constant the app uses, so the model can only answer inside the app's vocabulary.
- A daily cap per household per purpose (`rateLimit`, the BetterTour helper) so a runaway loop cannot run up a bill. `VERTEX_MODEL` and `VERTEX_LOCATION` are env params so a model bump is a redeploy, not a code change.
- The laptop's local model is the offline sibling for the heavy, private, repeatable jobs (photo library sorting, inbox triage). Vertex is for the on-demand reads where the phone camera is the input.

## 6. Design system (minimalist)

- Ground `#050505`, panel `#121212`, line `#222222`, text `#ffffff`, muted `#9a9a9a` (7.5:1 on the ground), accent `#37ff8b` (the site's green), danger `#ff5c5c`. Person colours: Johnny green, partner `#7fd0ff`, each child from a short fixed list.
- Type: Helvetica Neue, Helvetica, sans-serif. Sizes 22 (screen title), 16 (body), 13 (meta), 11 uppercase tracked (section labels). Weights 400 and 500 only.
- Layout: 20px side gutter, lists with 1px dividers, no cards inside cards, 44px touch targets, bottom tab bar with five tabs: Today, Plan, Money, Photos, More. Everything else lives under More.
- Interaction: one primary button per screen, green on black. Swipes only where universal (done, bought). Sheets over modals. Amounts right-aligned, tabular figures.
- Light theme is one token swap; dark is default because the site is dark.

## 7. Phases

Phase 1 progress (2026-09-20): **1a shipped** (household model, `{ hid, role }` claims, one-time hashed invites, child records, per-person me tokens, audit log, brand files, per-person digests and snapshots, rules with 27 emulator tests incl. cross-tenant denies, portal onboarding / invite / Household screens, shared + private tasks). **1c shipped**: per-person Google connect (state nonce bound to the uid, callback exchanges the code, refresh token sealed with Cloud KMS before it touches Firestore, account-mismatch refusal, revoke on disconnect, calendar picker). **1b shipped**: setup wizard spine (who lives here with invite + kids, connect Google, done; resumable, Today shows Finish setup), family agenda (each person's family-marked calendars written to households/{hid}/agenda/{uid}, private calendars never leave users/{uid}), birthdays from member records on Today. **1d shipped**: the feedback loop (Report control on every screen with type, screenshots to household-scoped Storage, environment dump; queue at /feedback with adult triage; `me feedback list/get/triage/dispatch`; GitHub issue dispatch labelled claude; CI marks shipped from `Feedback-Id:` trailers; What's new on Today for a week). Gemini clarifying questions arrive with Vertex in Phase 2. **1e shipped**: App Check client init behind a site key with enforcement behind a functions param, TOTP second factor (enrol at Household → Security, code step on sign-in, `isMfa()` in rules for Phase 2 collections), Terms and Privacy pages with a versioned accept gate, a real build id on feedback reports. Phase 1 code is complete pending the Firebase project, the first deploy, and the offline pass on a phone.

Each phase ships fully (lint, build, tests, rules tests, offline pass, QA path, `me` actions, digest section) before the next starts.

| Phase | Ships | Notes |
|---|---|---|
| 0 | Single-owner portal: tasks, digest, `me`, Google pull | Done 2026-09-19, not yet deployed |
| 1 | **Household + invite + feedback + wizard.** Household model, claims (adult, child), invite by email, per-person Google, merged family calendar, shared and private tasks, Today rebuilt for two, per-person digest, the feedback loop (report control, queue, `me feedback`, GitHub dispatch, shipped trailer), and the setup wizard's spine (sign in, people, connect Google, calendars, digest, done; the inbox scan lands with Phase 2 when there is somewhere for bills and accounts to go) | Replaces the owner-only rules. Feedback goes in first so every later phase is reported on from day one |
| 2 | **Money.** Accounts, CSV import, receipt capture with Gemini, categories mapped to tax lines, budgets, bills and subscriptions, suggestions queue, and the wizard's "What we found" inbox scan (bills, subscriptions, accounts, bookings) | Gemini via Vertex, same as Wishbone |
| 3 | **Businesses.** Clients, invoices with PDF and email, mark paid, expenses and mileage, yearly summary | Invoice PDF rendered client-side |
| 4 | **Taxes.** Year workspace, slip vault with reading, lines rollup, T2125-shaped statement, checklist, accountant package | Report over Phase 2 and 3 data |
| 5 | **Meals, recipes and pantry.** Recipe database with URL and photo import, pantry with fridge and shelf photos, what can we make, meal plan to grocery minus pantry | Johnny's pick to come early; the module a family opens weekly |
| 6 | **Vault, home and vehicles, people and occasions.** Documents with expiry reading, maintenance, contacts, birthdays and gifts | Storage rules per household |
| 7 | **Photos.** Laptop worker (index, dedupe across iCloud, Google Photos and the NAS; tags; albums), portal timeline, albums, people, duplicates queue, print picks | Needs the laptop's GPU; local vision model |
| 8 | **Travel, health, goals and reviews.** Weekly and monthly review emails | |
| 9 | **Automations and the local worker.** Rules engine, inbox triage on the laptop, `me` coverage of every module, in-app assistant | |
| later | Kids module, bank sync connector, light theme, Microsoft 365 for the work mailbox | Decisions for Johnny when they come up |

## 9. Security model

The threat model is plain: this holds a family's money, tax slips, passports, children's names and photos, and a standing grant to two Gmail accounts. A breach is not a bug; it is the end of the product. These are the rules, in the order they bite.

### 9.1 Tenant isolation, by construction
- **Every document lives under `households/{hid}/…`.** No top-level collection holds tenant data. A query that could span households cannot be written, because there is no path for it.
- **Every rule checks the claim first.** `request.auth.token.hid == hid` on every read and write, then the role, then ownership for private items. No doc lookups in rules. Custom claims are set by one function (`acceptInvite` / `createChild`), audited, and never by the client.
- **Private items are private in the rules, not the UI.** `visibility: "private"` items also require `ownerUid == request.auth.uid`. The private inbox snapshot and personal task list live under `users/{uid}/private/…`, readable by exactly one uid.
- **Functions re-check the claim server-side.** A callable never trusts a `hid` in the payload; it reads it off the token. The `me` endpoint is per household and per person: each adult mints their own token, and the token record carries `{ hid, uid }`, so a leaked token reaches one person's view of one household.
- **Rules tests are required, not aspirational.** `tests/rules/` under the emulator, one allow and one deny per rule, plus a cross-tenant deny for every collection (a member of household A reading household B). CI fails without them.

### 9.2 Identity
- **Google sign-in only, verified email required.** No password accounts (nothing to phish or stuff). `email_verified` is checked in rules and functions.
- **Second factor for adults.** Firebase Auth multi-factor (TOTP) required before an adult can reach Money, Taxes or the Vault; enforced by a claim `mfa: true` set by a blocking function, checked in rules on those collections. Kids never see those collections, so the child role has no MFA.
- **Invites are one-time, expiring, bound to an email.** The token is a random 32-byte value stored hashed; accepting compares hashes, checks the signed-in email matches, and burns the token. Seven-day expiry.
- **Child accounts** are created by an adult and hold no email of their own until the adult adds one. Under-13 accounts are a legal matter for the product track (section 10.4); for this household the adults are the parents and consent is theirs.
- **Sessions**: the app signs out after 30 days idle; the Vault re-prompts for MFA after 15 minutes.

### 9.3 Secrets and tokens
- **Google refresh tokens are encrypted at rest** with Cloud KMS (one key per environment, envelope encryption per household) before they touch Firestore. A Firestore dump does not yield working Gmail access. Decryption happens only inside the function that uses the token, and the plaintext never leaves the function.
- **Scopes are the minimum**: calendar read, gmail read, gmail send. Nothing that modifies mail or calendars beyond sending the digest and the invite. If a feature needs a write scope later, it is a separate consent the person sees.
- **The one-time inbox scan** reads subjects and senders only, returns candidates, stores none of the mail, and is capped at two runs per person per day.
- **Every other secret** (ME tokens, API keys, GitHub token) is in Secret Manager, referenced by functions that declare it, and rotatable without a deploy. `ME_TOKEN` per person is revocable from the Household screen.
- **App Check enforced** on every callable and on Firestore, with reCAPTCHA Enterprise for the web app. The BetterTour rollout order applies: ship the client init, then flip enforcement.

### 9.4 Data
- **Sensitive fields are encrypted client-side before write**: passport and ID numbers, account numbers, SIN. The key is derived per household and held in the adults' devices (WebCrypto, non-exportable) with a recovery code shown once at setup. Firestore holds ciphertext; the rules cannot leak what they cannot read. Displayed masked, revealed on tap behind MFA.
- **Storage rules mirror Firestore**: every object path starts with `households/{hid}/`, read and write gated on the claim, size and content-type limits per path, and no public reads anywhere (thumbnails included). Signed URLs, one hour, for anything shown in email.
- **Backups**: PITR seven days, daily exports kept fourteen weeks, delete protection on the database, Storage soft delete 30 days. The BetterTour `DISASTER_RECOVERY` runbook is ported.
- **Export and delete are features, not tickets.** An adult can export the household (JSON plus files) and delete it. Delete is a two-step with a seven-day cooling period, then a function removes Firestore, Storage, KMS keys, Google grants (token revocation), and the members' claims.
- **AI calls carry no more than they need.** A receipt image goes to Vertex; a fridge photo goes to Vertex; the household's name and members do not. Vertex is used with data-use settings that keep inputs out of training. The laptop worker sees the photo library because it is the family's laptop; nothing from it leaves except the index.

### 9.5 Application
- **Zod at every boundary**, including every `me` action and every AI response.
- **Rate limits** per person on every callable that costs money or sends mail (the BetterTour `rateLimit` helper).
- **Audit log**: `households/{hid}/audit/{id}` written server-side for sign-ins, invites, role changes, MFA changes, exports, deletes, token mints, Google connections and disconnections, and any Vault reveal. Readable by adults, written by nobody but functions.
- **Error and usage logs** without PII (the BetterTour `errorLogs` pattern, with a scrubber for emails and numbers).
- **Headers**: strict CSP, HSTS preload, COOP, no framing. Already in `firebase.json`; extended when the product domain lands.
- **Dependencies**: Dependabot on, `npm audit` in CI, lockfiles committed, no post-install scripts from unknown packages.
- **Security review before every phase ships**: the `security-review` pass on the branch, findings fixed or documented, and the phase's rules tests green.

### 9.6 What we will not do
- No password auth. No SMS as a second factor. No public Storage paths. No cross-household features (sharing between families) until there is a design for consent on both sides. No storing mail bodies. No selling or analysing tenant data.

## 10. Product track: a family manager hub for others

### 10.1 Multi-tenant from the first commit
Section 9.1 already makes every household a tenant. The remaining product plumbing goes in during Phase 1 so nothing is retrofitted:
- `households/{hid}` carries `plan` (`free` | `pro`), `createdAt`, `region`, `locale`, and a `limits` map read by functions (AI calls per day, members, storage).
- A person can belong to more than one household in the data model (a separated parent, a grandparent), with one active household in the claim and a switcher. Not built for the Jansens; not blocked either.
- Nothing hardcodes the Jansens. Time zone, currency, tax country and the list of tax lines are household settings. Canada ships first; the line mapping is a data file per country.

### 10.2 Brand and domains
- The product name is not settled. Two files own the brand, exactly as in BetterTour (`src/seo/site.ts` and `functions/src/lib/brand.ts`), and a test fails on any hardcoded domain. Everything derives: titles, email footers, invite links, support address.
- **System email leaves from a product domain through Resend**, not from a personal Gmail. The digest still sends from each person's own Gmail (it is their email to themselves), but invites, receipts, verification and notifications come from `hello@<product>`. The Wishbone `emailTemplate` and `mail` libraries are ported.
- johnnyjansen.com stays a portfolio. The app moves to the product domain when it has one; the Jansens' household is simply the first row. Until then it runs at `/app` on the portfolio domain as the private beta.

### 10.3 Free and paid
The BetterTour rule: the core is free for the whole family; what costs us money to run is Pro. Free: household, calendar, tasks, meals, vault, feedback, one adult's daily digest. Pro: AI reads (receipts, slips, documents, recipes, pantry, inbox scan), invoicing, tax package, the photo worker's cloud index, every adult's digest. Stripe Checkout and the customer portal, the BetterTour `billing/` pattern, with the paywall dormant behind an admin switch until launch. Pricing lives in Stripe, never in copy.

### 10.4 Legal and trust
- Terms and a privacy policy in `src/legal/` with a version constant and a re-accept prompt on change (BetterTour pattern). Written for PIPEDA first; GDPR readiness (export, delete, data-processing terms) is section 9.4 already.
- **Children.** A product with child sign-ins needs verifiable parental consent for under-13s (COPPA if any US family joins) and a clear rule that a child's data is the parents' to export and delete. The child role is designed so that a child account holds the minimum: a name, a colour, chores, allowance, their own calendar view. No email, no photos of them beyond what the parents put in the family library, no analytics on children.
- A security page for customers: what is encrypted, what is not, how to report a vulnerability, how to export and delete.
- Status and incident process: a status page, an incident log, and the disaster recovery runbook kept current.

### 10.5 Operations
- Separate Firebase projects for dev, staging and prod, with CI promoting through them. The Jansens live on prod from day one, so staging is where risky migrations rehearse.
- Monitoring: error logs, function failure alerts, budget alerts on Vertex and Stripe, a weekly usage digest to Johnny.
- Support: the feedback module is the support channel for beta families; an admin console is a later phase and, like Wishbone's, is a separate app that reads through the same rules.

### 10.6 What this changes in the phases
- Phase 1 gains: KMS encryption for Google tokens, MFA for adults, App Check init, rules tests with cross-tenant denies, audit log, brand centralisation, Resend for system mail, the `plan` and `limits` fields, and the legal pages.
- Phase 2 (Money) gains: client-side field encryption and the Vault reveal flow.
- Every phase ends with the security review pass.
- A "Product" phase before public beta: staging project, Stripe, status page, security page, second household in testing (a friend's family), and the rename.

## 8. Decisions and open questions

Decided 2026-09-19: personal Gmail; everything on Firebase Hosting at `/app`; digest 06:30 Pacific; a `johnnyjansen` Claude Code environment carries `ME_TOKEN`.

Decided 2026-09-19, after the mockups:
- **Kids: yes, and they may sign in later.** The `child` role is part of the Phase 1 claims and rules from the start (own chores, allowance, family calendar, no money, no vault numbers). Child accounts are created by an adult, not by invite email.
- **Photos live in three places: iPhone/iCloud, Google Photos, and a drive or NAS folder.** The Phase 6 worker scans a folder set (the NAS path, an iCloud Photos download, a Google Takeout or synced folder) and dedupes ACROSS sources by perceptual hash, since the same shot will exist in more than one. Each index entry records every source path. "Open original" prefers the cloud link when one exists.
- **Two or more side businesses, GST/HST status per business.** `businesses/{id}` carries `gstNumber?`; invoices show tax lines only when the business is registered; the yearly summary is per business and the T2125 statement is one per business. Names still needed.
- **Taxes are a mix: accountant for the business year, self-filed for the rest.** The package therefore has two shapes: a per-business bundle for the accountant (PDF statement, expense CSV, receipts folder) and a personal bundle shaped for typing into filing software (slips, line totals, receipts).

Decided 2026-09-19, later: image and document reading is Vertex AI (Gemini), the BetterTour pattern (section 5b). The BetterTour feedback loop is ported as module 4.18 and ships in Phase 1. Recipes, pantry photos and "what can we make" are a full module (4.4), Phase 5.

Decided 2026-09-19, later still: a setup wizard for both adults (module 4.19), founder and invited flows, driven by a one-time Gemini scan of inbox subjects and senders. Spine ships in Phase 1, the scan in Phase 2.

Decided 2026-09-20: security is a standing requirement (section 9) and the app is built as a multi-tenant product from Phase 1 (section 10). Johnny's household is tenant one. MFA for adults is on (authenticator app) before Money, Taxes and the Vault.

Decided 2026-09-20: **prototype in this repo, migrate later.** Johnny: no time to name it, and he wants to prototype the flow first. Agreed, on three conditions that make the later move a `git subtree split` plus a DNS change rather than a rewrite:
1. The Firebase project id is neutral (`familyhub-prod`, never `johnnyjansen-*`), because a project id cannot be renamed and it will outlive the repo.
2. The app is only ever `portal/`, `functions/`, `scripts/`, the rules and the workflow. The portfolio never imports from them and they never import from the portfolio. Moving the app is moving those directories with their history.
3. The brand is in two files from Phase 1 (section 10.2), so the rename is a two-line change plus DNS.
The migration itself is its own checklist when the name lands: new repo from the subtree, custom domain on the same Firebase project, Resend domain, Stripe, and a redirect from `johnnyjansen.com/app`.

Still open:
- Product name (needed before Resend and the domain; not before Phase 1).
- The businesses' names and which are GST registered (Phase 3).
- Bank sync: worth paying for later, or is CSV import enough? (Phase 2 scope.)
