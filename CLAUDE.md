# CLAUDE.md

> Read this first every session. This repo is two things: Johnny's portfolio, and an incubator for product prototypes. The full incubator system is in `docs/INCUBATOR.md`. Each app under `apps/<slug>/` has its own `CLAUDE.md`, `PLAN.md` and `HUMANTASKS.md`; when working on an app, read those.

## Layout

```
/                    the portfolio: index.html, resume.html, PocketJams.html, css/, js/, static/, videos/. Static, no build. Leave alone unless the task is about it.
apps/_template/      what `incubate new` copies
apps/family-hub/     Family Hub, the first prototype (mounted at /app, Firebase project familyhub-prod)
scripts/build-site.mjs   portfolio + every app's client -> dist/
scripts/incubate.mjs     new | check | list | eject
firebase.json        hosting ONLY, for the portfolio project johnnyjansen-site, one rewrite per app
.github/workflows/   site.yml (hosting), app-<slug>.yml (each app's checks + functions/rules deploy)
docs/INCUBATOR.md    the system
```

## The rules that hold the system together

- **The Firebase project is the product; hosting is the address.** An app's auth, data, functions and secrets live in its own project with a neutral id (never `johnnyjansen-*`). The portfolio project holds nothing but hosting.
- **An app is self-contained.** No import or path reaches outside `apps/<slug>/`. The brand (name, domain, base URL) lives only in the files the app's `incubator.json` names. `node scripts/incubate.mjs check` enforces both and runs in CI.
- **Ejecting is a subtree split.** `node scripts/incubate.mjs eject <slug>` produces the new repo with history and prints the checklist. Nothing in the data plane moves.
- **Nothing personal in the repo.** It is public. Names, dates, credentials go through the apps' own screens into their own projects.
- Commit format: `<slug>: short description` for app work (`family-hub: Phase 2 receipts`), `site:` for the portfolio, `incubator:` for the tooling.

## Commands (root)

```bash
npm run build                          # build every app's client and assemble dist/
npm run check                          # incubator invariants for every app
npm run apps -- new <slug> --name "X" --mount /x --project <id>
npm run apps -- eject <slug> [--remote <git url>]
npm run deploy:hosting                 # build + deploy hosting to johnnyjansen-site
npm run me <cmd>                       # shortcut to apps/family-hub/scripts/me.mjs (needs $ME_TOKEN)
```

App work runs inside the app folder: `cd apps/<slug> && npm run lint && npm run build && npm run test:run && npm run test:rules`.

## Working with Johnny

Marketer, reads the diff, mobile first, short messages. Explain why when it matters. Questions as a picker with a recommended first option. Push back on scope or risk plainly. No dashes, no AI voice in copy or commits.
