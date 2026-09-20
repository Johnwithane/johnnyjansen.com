#!/usr/bin/env node
// Assemble the ONE Firebase Hosting site: the static portfolio from the repo
// root, plus the built portal under /app. Output: dist/
//
//   dist/              ← every static file at the repo root (index.html, css/, videos/ …)
//   dist/app/          ← portal/dist (Vite build with base "/app/")
//
// The portfolio files stay at the repo root (not in a site/ folder) so GitHub
// Pages keeps serving them unchanged until DNS moves to Firebase. Repo
// plumbing is excluded by name below; everything else at the root is site.

import { cp, mkdir, readdir, rm, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const out = path.join(root, "dist");

const SKIP_DIRS = new Set(["portal", "functions", "scripts", "tests", "node_modules", "dist", ".git", ".github", ".firebase"]);
const SKIP_FILES = new Set(["CNAME", ".gitignore", ".firebaserc", "firebase.json", "firestore.rules", "firestore.indexes.json", "storage.rules", "package.json", "package-lock.json", "vitest.rules.config.ts"]);
const SKIP_EXT = new Set([".md", ".log"]);

await rm(out, { recursive: true, force: true });
await mkdir(out, { recursive: true });

let copied = 0;
for (const name of await readdir(root)) {
  const src = path.join(root, name);
  const info = await stat(src);
  if (info.isDirectory() ? SKIP_DIRS.has(name) : SKIP_FILES.has(name) || SKIP_EXT.has(path.extname(name))) continue;
  await cp(src, path.join(out, name), { recursive: true });
  copied++;
}

const portal = path.join(root, "portal", "dist");
try {
  await stat(path.join(portal, "index.html"));
} catch {
  console.error("portal/dist/index.html missing. Run `npm run portal:build` first.");
  process.exit(1);
}
await cp(portal, path.join(out, "app"), { recursive: true });

console.log(`dist/: ${copied} root entries + portal at /app`);
