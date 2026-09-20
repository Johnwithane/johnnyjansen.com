#!/usr/bin/env node
// Assemble the ONE Firebase Hosting site for johnnyjansen.com: the static
// portfolio from the repo root, plus every incubated app's client at its
// mountPath (from apps/<slug>/incubator.json). Output: dist/
//
//   dist/              <- every static file at the repo root
//   dist/<mountPath>/  <- apps/<slug>/app/dist, built here with npm run build
//
// The portfolio stays at the repo root (not in a site/ folder) so GitHub Pages
// keeps serving it until DNS moves. Repo plumbing is excluded by name.

import { execSync } from "node:child_process";
import { cp, mkdir, readdir, readFile, rm, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const out = path.join(root, "dist");
const skipBuild = process.argv.includes("--no-build");

const SKIP_DIRS = new Set(["apps", "docs", "scripts", "node_modules", "dist", ".git", ".github", ".firebase"]);
const SKIP_FILES = new Set(["CNAME", ".gitignore", ".firebaserc", "firebase.json", "package.json", "package-lock.json"]);
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

const appsDir = path.join(root, "apps");
const mounted = [];
for (const slug of (await readdir(appsDir)).filter((d) => !d.startsWith("_"))) {
  const manifestPath = path.join(appsDir, slug, "incubator.json");
  try {
    await stat(manifestPath);
  } catch {
    continue;
  }
  const m = JSON.parse(await readFile(manifestPath, "utf8"));
  const appDir = path.join(appsDir, slug, "app");
  if (!skipBuild) execSync("npm run build", { cwd: appDir, stdio: "inherit" });
  const built = path.join(appDir, "dist", "index.html");
  try {
    await stat(built);
  } catch {
    console.error(`${slug}: app/dist/index.html missing. Build it first.`);
    process.exit(1);
  }
  const mount = m.mountPath.replace(/^\//, "");
  await cp(path.join(appDir, "dist"), path.join(out, mount), { recursive: true });
  mounted.push(`${m.mountPath} <- ${slug}`);
}

console.log(`dist/: ${copied} root entries; apps: ${mounted.join(", ") || "none"}`);
