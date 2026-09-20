#!/usr/bin/env node
// The incubator's tooling. See docs/INCUBATOR.md.
//
//   node scripts/incubate.mjs list
//   node scripts/incubate.mjs check [slug]
//   node scripts/incubate.mjs new <slug> --name "Product" --mount /path --project <id>
//   node scripts/incubate.mjs eject <slug> [--remote <git url>] [--branch main]
//
// No dependencies. Node 20+.

import { execSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const APPS = path.join(ROOT, "apps");

function die(msg) {
  console.error(`incubate: ${msg}`);
  process.exit(1);
}
function sh(cmd, opts = {}) {
  return execSync(cmd, { cwd: ROOT, stdio: ["ignore", "pipe", "pipe"], encoding: "utf8", ...opts }).trim();
}
function readJson(p) {
  return JSON.parse(readFileSync(p, "utf8"));
}
function flag(args, name) {
  const i = args.indexOf(name);
  if (i === -1) return undefined;
  const v = args[i + 1];
  args.splice(i, 2);
  return v;
}

function apps() {
  if (!existsSync(APPS)) return [];
  return readdirSync(APPS)
    .filter((d) => !d.startsWith("_") && existsSync(path.join(APPS, d, "incubator.json")))
    .map((d) => ({ slug: d, dir: path.join(APPS, d), manifest: readJson(path.join(APPS, d, "incubator.json")) }));
}

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    if (["node_modules", "dist", ".git", "coverage"].includes(name)) continue;
    const p = path.join(dir, name);
    // functions/lib is tsc output; src/lib is source and must be walked.
    if (name === "lib" && path.basename(dir) === "functions") continue;
    if (statSync(p).isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}

// ---------------------------------------------------------------- check

function check(app) {
  const { slug, dir, manifest: m } = app;
  const problems = [];
  const need = ["incubator.json", "firebase.json", ".firebaserc", "package.json", "CLAUDE.md", "PLAN.md", "HUMANTASKS.md", "firestore.rules", "app", "functions", "tests/rules"];
  for (const f of need) if (!existsSync(path.join(dir, f))) problems.push(`missing ${f}`);

  for (const k of ["slug", "name", "mountPath", "firebaseProject", "brandFiles"]) if (!m[k]) problems.push(`manifest missing ${k}`);
  if (m.slug !== slug) problems.push(`manifest slug ${m.slug} != folder ${slug}`);
  if (/^johnnyjansen/i.test(m.firebaseProject ?? "")) problems.push(`firebaseProject ${m.firebaseProject} is not neutral (never johnnyjansen-*)`);
  if (!/^\/[a-z0-9-]+$/.test(m.mountPath ?? "")) problems.push(`mountPath must look like /slug`);

  const rc = existsSync(path.join(dir, ".firebaserc")) ? readJson(path.join(dir, ".firebaserc")) : {};
  if (rc.projects?.default !== m.firebaseProject) problems.push(`.firebaserc default ${rc.projects?.default} != manifest ${m.firebaseProject}`);

  const fj = existsSync(path.join(dir, "firebase.json")) ? readJson(path.join(dir, "firebase.json")) : {};
  if (fj.hosting) problems.push(`app firebase.json must not carry hosting while incubated (root hosts it)`);
  if (!fj.functions) problems.push(`app firebase.json has no functions block`);
  if (!fj.firestore) problems.push(`app firebase.json has no firestore block`);

  // Brand: the domain appears only in the brand files.
  const brandFiles = new Set((m.brandFiles ?? []).map((b) => path.join(dir, b)));
  for (const b of brandFiles) if (!existsSync(b)) problems.push(`brand file missing: ${path.relative(dir, b)}`);
  const textExt = new Set([".ts", ".vue", ".js", ".mjs", ".json", ".html", ".css", ".yml", ".yaml", ".md", ".rules"]);
  for (const f of walk(dir)) {
    if (!textExt.has(path.extname(f)) || brandFiles.has(f)) continue;
    const rel = path.relative(dir, f);
    if (/\.test\.(ts|js|mjs)$/.test(rel) || rel.endsWith("package-lock.json") || rel.endsWith(".md")) continue;
    const text = readFileSync(f, "utf8");
    if (/johnnyjansen\.com/.test(text)) problems.push(`hardcoded domain in ${rel} (only brand files may name it)`);
    // Imports that escape the app folder.
    for (const mth of text.matchAll(/from\s+["']((?:\.\.\/)+[^"']*)["']/g)) {
      const target = path.resolve(path.dirname(f), mth[1]);
      if (!target.startsWith(dir + path.sep)) problems.push(`${rel} imports outside the app: ${mth[1]}`);
    }
  }

  // Root wiring.
  const rootFj = readJson(path.join(ROOT, "firebase.json"));
  const rewrites = rootFj.hosting?.rewrites ?? [];
  if (!rewrites.some((r) => r.source === `${m.mountPath}/**` && r.destination === `${m.mountPath}/index.html`)) {
    problems.push(`root firebase.json has no rewrite ${m.mountPath}/** -> ${m.mountPath}/index.html`);
  }
  if (!existsSync(path.join(ROOT, ".github", "workflows", `app-${slug}.yml`))) problems.push(`missing .github/workflows/app-${slug}.yml`);

  return problems;
}

function cmdCheck(args) {
  const only = args[0];
  const list = apps().filter((a) => !only || a.slug === only);
  if (only && !list.length) die(`no app ${only}`);
  let bad = 0;
  for (const app of list) {
    const problems = check(app);
    console.log(`${problems.length ? "✗" : "✓"} ${app.slug} (${app.manifest.name}) at ${app.manifest.mountPath} -> ${app.manifest.firebaseProject}`);
    for (const p of problems) console.log(`    ${p}`);
    bad += problems.length;
  }
  if (bad) process.exit(1);
}

// ---------------------------------------------------------------- list

function cmdList() {
  for (const a of apps()) console.log(`${a.slug}\t${a.manifest.mountPath}\t${a.manifest.firebaseProject}\t${a.manifest.status ?? "prototype"}`);
}

// ---------------------------------------------------------------- new

function cmdNew(args) {
  const slug = args[0];
  if (!slug || !/^[a-z][a-z0-9-]{1,40}$/.test(slug)) die("usage: new <slug> --name 'Product' --mount /path --project <firebase-project-id>");
  const name = flag(args, "--name") ?? slug;
  const mount = flag(args, "--mount") ?? `/${slug}`;
  const project = flag(args, "--project") ?? `${slug.replace(/-/g, "")}-prod`;
  if (/^johnnyjansen/i.test(project)) die("the Firebase project id must be neutral: it is the product's forever");
  const env = slug.toUpperCase().replace(/-/g, "_");
  const dir = path.join(APPS, slug);
  if (existsSync(dir)) die(`apps/${slug} exists`);
  const tpl = path.join(APPS, "_template");
  if (!existsSync(tpl)) die("apps/_template is missing");

  cpSync(tpl, dir, { recursive: true });
  // Fill placeholders in every text file.
  for (const f of walk(dir)) {
    // Dotfiles like .firebaserc have no extension; they carry placeholders too.
    if (![".ts", ".vue", ".js", ".mjs", ".json", ".html", ".css", ".yml", ".md", ".rules", ".example", ""].includes(path.extname(f))) continue;
    let t = readFileSync(f, "utf8");
    t = t.replaceAll("__SLUG__", slug).replaceAll("__NAME__", name).replaceAll("__MOUNT__", mount).replaceAll("__PROJECT__", project).replaceAll("__ENV__", env);
    writeFileSync(f, t);
  }
  writeFileSync(
    path.join(dir, "incubator.json"),
    JSON.stringify({ slug, name, mountPath: mount, firebaseProject: project, status: "prototype", created: new Date().toISOString().slice(0, 10), brandFiles: ["app/src/seo/site.ts", "functions/src/lib/brand.ts"] }, null, 2) + "\n",
  );

  // Root wiring: rewrite + workflow.
  const rootFjPath = path.join(ROOT, "firebase.json");
  const rootFj = readJson(rootFjPath);
  rootFj.hosting.rewrites = [{ source: `${mount}/**`, destination: `${mount}/index.html` }, ...(rootFj.hosting.rewrites ?? []).filter((r) => r.source !== `${mount}/**`)];
  writeFileSync(rootFjPath, JSON.stringify(rootFj, null, 2) + "\n");
  const wfTpl = readFileSync(path.join(ROOT, ".github", "workflows", "app-_template.yml.txt"), "utf8");
  writeFileSync(path.join(ROOT, ".github", "workflows", `app-${slug}.yml`), wfTpl.replaceAll("__SLUG__", slug).replaceAll("__PROJECT__", project).replaceAll("__NAME__", name).replaceAll("__ENV__", env));

  console.log(`created apps/${slug} (${name}) at ${mount} -> ${project}\n`);
  console.log("Human steps:");
  console.log(`  1. Create the Firebase project "${project}" (Blaze), enable Auth (Google), Firestore, Storage, Functions.`);
  console.log(`  2. Register a web app; put its config in GitHub variables ${env}_FIREBASE_* (see the workflow).`);
  console.log(`  3. cd apps/${slug} && npm install --prefix app && npm install --prefix functions && npm install`);
  console.log(`  4. node scripts/incubate.mjs check ${slug}`);
}

// ---------------------------------------------------------------- eject

function cmdEject(args) {
  const slug = args[0];
  const app = apps().find((a) => a.slug === slug);
  if (!app) die(`no app ${slug}`);
  const remote = flag(args, "--remote");
  const branchName = flag(args, "--branch") ?? "main";
  if (sh("git status --porcelain")) die("working tree is not clean");
  const problems = check(app);
  if (problems.length) die(`check failed:\n  ${problems.join("\n  ")}`);

  const m = app.manifest;
  const split = `eject/${slug}`;
  console.log(`splitting apps/${slug} into branch ${split} (full history) ...`);
  sh(`git branch -D ${split} 2>/dev/null || true`, { shell: "/bin/bash" });
  sh(`git subtree split --prefix=apps/${slug} -b ${split}`);

  // The per-app workflow, rewritten for a repo where the app is the root.
  const wf = readFileSync(path.join(ROOT, ".github", "workflows", `app-${slug}.yml`), "utf8")
    .replaceAll(`apps/${slug}/`, "")
    .replaceAll(`--prefix apps/${slug}`, "")
    .replace(/\n\s+paths:\n(\s+- .*\n)+/g, "\n");
  const out = path.join(ROOT, `eject-${slug}-ci.yml`);
  writeFileSync(out, wf);

  if (remote) {
    console.log(`pushing ${split} to ${remote} as ${branchName} ...`);
    sh(`git push ${remote} ${split}:${branchName}`);
  }

  console.log(`
Ejected. Branch ${split} holds apps/${slug} as a repo root with its history.${remote ? ` Pushed to ${remote} (${branchName}).` : ` Push it: git push <new-remote> ${split}:${branchName}`}

In the new repo:
  1. Add .github/workflows/ci.yml from ${path.relative(ROOT, out)} (already rewritten for the new root) and a hosting deploy to ${m.firebaseProject}.
  2. Add "hosting": { "public": "app/dist", "rewrites": [{ "source": "**", "destination": "/index.html" }] } to firebase.json; set the client's Vite base to "/".
  3. Move GitHub secrets/variables: FIREBASE_SERVICE_ACCOUNT, CI tokens, the ${slug.toUpperCase().replace(/-/g, "_")}_FIREBASE_* variables.
  4. Rename the brand in: ${m.brandFiles.join(", ")} (name, domain, base URL). Redeploy functions and hosting.

In Firebase (${m.firebaseProject}):
  5. Hosting -> add the custom domain; Auth -> authorized domains; Google Cloud OAuth client -> add the new origin and redirect URI.

Back here, one commit:
  6. git rm -r apps/${slug}; delete .github/workflows/app-${slug}.yml and ${path.relative(ROOT, out)}; replace the rewrite for ${m.mountPath} with a 301 redirect to the new domain in firebase.json.
  7. Retire or repoint the Claude Code environment variables that belonged to it (e.g. ME_TOKEN).

Nothing in the data plane moves: accounts, data, grants and tokens stay in ${m.firebaseProject}.`);
}

// ---------------------------------------------------------------- main

const [cmd, ...rest] = process.argv.slice(2);
switch (cmd) {
  case "list":
    cmdList();
    break;
  case "check":
    cmdCheck(rest);
    break;
  case "new":
    cmdNew(rest);
    break;
  case "eject":
    cmdEject(rest);
    break;
  default:
    die("commands: list | check [slug] | new <slug> ... | eject <slug> [--remote url]");
}
