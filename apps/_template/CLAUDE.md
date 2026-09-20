# CLAUDE.md

> Read this first every session in `apps/__SLUG__/`. `PLAN.md` is the spec. `HUMANTASKS.md` is what only Johnny can do. Repo-level rules: the root `CLAUDE.md` and `docs/INCUBATOR.md`.

## What this app is

**__NAME__**, a prototype incubated in johnnyjansen.com at `__MOUNT__`, backed by its own Firebase project `__PROJECT__`. Everything lives in this folder: `app/` (Vue 3 + Vite + Tailwind), `functions/`, rules + `tests/rules/`. It ejects into its own repo with `node ../../scripts/incubate.mjs eject __SLUG__`; the Firebase project never moves.

## Principles

- One feature at a time, fully shipped: lint, build, tests, rules tests, committed.
- Strict TS, no `any`. Zod at every boundary.
- Default deny in `firestore.rules` and `storage.rules`; every rule gets an allow and a deny test.
- Mobile first, 375px. Offline: reads from the persistent cache, writes never awaited in UI handlers.
- Firebase changes deploy before the commit that depends on them; a credential-less session writes "deploy owed".
- The brand lives in `app/src/seo/site.ts` and `functions/src/lib/brand.ts` only.
- Copy: terse, plain, no dashes, no AI voice.

## Commands (from this folder)

```bash
npm run dev | lint | build | test:run | test:rules | deploy:rules | deploy:functions
```

Hosting deploys from the repo root.
