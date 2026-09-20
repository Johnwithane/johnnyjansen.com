# The incubator: prototype here, ship as its own product

johnnyjansen.com is a portfolio and an incubator. A product idea is prototyped
as a self-contained app under `apps/<slug>/`, served at a path on the portfolio
domain, backed by its own Firebase project from day one. When it is ready to be
a product it is ejected: its folder becomes a repo with full history, its
Firebase project stays exactly where it is, and only the address changes.

The whole system rests on one rule: **the Firebase project is the product;
hosting is just the address.** Nothing about an app's data, auth, functions or
secrets ever lives in a project it will have to leave.

## Layout

```
/                          the portfolio (static, unchanged)
apps/
  _template/               what `incubate new` copies
  family-hub/              the first product (mounted at /app)
    incubator.json         manifest: slug, name, mountPath, firebaseProject, brand files
    app/                   the client (Vite + Vue), builds to app/dist
    functions/             Cloud Functions for THIS project
    firebase.json          THIS app's functions + firestore + storage (no hosting while incubated)
    .firebaserc            THIS app's Firebase project
    firestore.rules, storage.rules, firestore.indexes.json
    tests/rules/           rules tests against the emulator
    scripts/               the app's own CLIs (me.mjs)
    CLAUDE.md, PLAN.md, HUMANTASKS.md
    package.json           the app's scripts: lint, build, test, test:rules, deploy:*
scripts/
  build-site.mjs           portfolio + every app's build (at its mountPath) -> dist/
  incubate.mjs             new | check | list | eject
firebase.json              ROOT: hosting only, for the portfolio site project, with a rewrite per app
.github/workflows/
  site.yml                 builds dist/ and deploys hosting for the portfolio project
  app-<slug>.yml           per app: lint, build, tests, rules tests, deploy functions + rules to ITS project
docs/INCUBATOR.md          this file
```

Two Firebase projects are involved for every prototype:

| Project | Holds | Owner of the name |
|---|---|---|
| `johnnyjansen-site` | Hosting for johnnyjansen.com (portfolio + every prototype's built client) | The portfolio, forever |
| `<product>-prod` (e.g. `familyhub-prod`) | Auth, Firestore, Storage, Functions, secrets, KMS for that product | The product, forever |

The client bundle is served from the site project but talks to the product
project (its Firebase config names the product project). Auth popups work
because `authDomain` is the product project's. Callables and the OAuth
callback are product-project URLs. So the day the product gets its own domain,
nothing in its data plane moves.

## Invariants (what `incubate check` enforces)

1. The app is self-contained: no import or path reaches outside `apps/<slug>/`.
2. The Firebase project id is neutral (never `johnnyjansen-*`) and cannot be renamed, so pick it as if it is the product's forever. `.firebaserc` matches the manifest.
3. The brand (name, domain, base URL) lives in the files the manifest lists and nowhere else; a bare `johnnyjansen.com` anywhere else in the app is a failure.
4. The app has its own `firebase.json` (functions, firestore, storage; no hosting), rules, rules tests, `CLAUDE.md`, `PLAN.md`, `HUMANTASKS.md`.
5. The root `firebase.json` has a rewrite for the app's `mountPath`, and `.github/workflows/app-<slug>.yml` exists.
6. Every URL the app hands out (invite links, OAuth return URLs, email footers) derives from the brand file's base URL.

## Starting a prototype

```
node scripts/incubate.mjs new <slug> --name "Product Name" --mount /<path> --project <slug>-prod
```

That copies `apps/_template/`, fills in the manifest, brand files and `.firebaserc`, adds the hosting rewrite and the per-app workflow, and prints the human steps: create the Firebase project with that id, register a web app, put its config in the workflow variables. Then `node scripts/incubate.mjs check <slug>`.

## Working on a prototype

Everything runs from the app folder: `npm --prefix apps/<slug> run lint|build|test:run|test:rules|deploy:rules|deploy:functions`. Hosting is deployed from the root (`npm run build && npm run deploy:hosting`) because it is one site. Claude Code reads the app's own `CLAUDE.md` when working under `apps/<slug>/`.

## Ejecting a product

When the product gets a name and a domain:

```
node scripts/incubate.mjs eject <slug> --remote git@github.com:Johnwithane/<new-repo>.git
```

What it does:
1. Refuses on a dirty tree or a failing `check`.
2. `git subtree split --prefix=apps/<slug>` into a branch: the folder's full history, rewritten so the app folder is the repo root.
3. Pushes that branch as `main` of the new repo (if `--remote` is given), and writes `.github/workflows/ci.yml` there from the incubator's `app-<slug>.yml` with the `apps/<slug>/` path prefixes removed, plus a hosting deploy to the product project.

What you then do, in order (the script prints this list with the real values):
1. In the product's Firebase project: add Hosting, add the custom domain, add it to Auth authorized domains, add the OAuth redirect and JavaScript origin for the new domain in the Google Cloud OAuth client.
2. Rename the brand in the two brand files (name, domain, base URL). Redeploy functions (return URLs, email footers) and hosting.
3. Move the secrets that live in GitHub (service account, CI tokens, web config variables) to the new repo.
4. Back in the incubator: `git rm -r apps/<slug>`, remove the rewrite and the workflow, and add a 301 from the old mountPath to the new domain in the root `firebase.json`. One commit, so the old links keep working.
5. Retire the incubator's Claude Code environment variables for that app (e.g. `ME_TOKEN`) or point them at the new repo's environment.

Nothing in the data plane moves. Users keep their accounts, data, Google grants and tokens; the only thing that changes for them is the URL.

## Why not a monorepo with workspaces

Because the point is leaving. Workspaces hoist dependencies and share lockfiles, and pulling one package out means untangling that. A plain folder with its own lockfiles is boring on the way in and free on the way out. `git subtree split` is the one piece of git that does exactly this job and nothing else.
