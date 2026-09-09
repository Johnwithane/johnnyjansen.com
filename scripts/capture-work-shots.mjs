// Screenshots the live products for the case-study cards. Re-run whenever a
// site changes materially:   node --experimental-strip-types scripts/capture-work-shots.mjs
// Writes public/static/work/<slug>.jpg (1440x900) and <slug>-phone.jpg (390x844).
//
// Every request the page makes is fetched by curl and handed to the browser.
// That is deliberate: the sandbox this runs in only lets curl out, and a
// browser TLS handshake is refused. On a normal machine set DIRECT=1 to skip it.
import { chromium } from "@playwright/test";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { projects } from "../app/data/projects.ts";

const run = promisify(execFile);
const executablePath = process.env.PW_CHROMIUM || undefined;
// Where to point the camera when the case-study URL is not the best frame:
// an apex domain not cut over yet, or a landing page that is not the product.
const urlOverride = {
  wishbone: "https://new.wishboneltd.com",
  remoose: "https://remoose.com/studio",
  bettertour: "https://bettertour.web.app",
  "pocket-jams": "https://pocket-jams.web.app",
};
// Per-site steps before the shutter: dismiss a cookie banner, skip a gate.
const prepare = {
  wishbone: async (page) => {
    for (const label of ["Decline", "Skip for now"]) {
      const el = page.getByText(label, { exact: true }).first();
      if (await el.isVisible().catch(() => false)) await el.click().catch(() => {});
    }
    await page.waitForTimeout(6000);
  },
  "pocket-jams": async (page) => {
    const el = page.getByText("Decline", { exact: true }).first();
    if (await el.isVisible().catch(() => false)) await el.click().catch(() => {});
    await page.waitForTimeout(1000);
  },
};
// Sites whose product view needs a live Firestore stream cannot render through
// the curl relay; their card image is placed by hand and never overwritten.
const manual = new Set(["remoose"]);
// Optional slugs on the command line limit the run.
const only = process.argv.slice(2);
const direct = process.env.DIRECT === "1";

async function curlFetch(url) {
  const dir = await mkdtemp(join(tmpdir(), "shot-"));
  const body = join(dir, "body");
  const head = join(dir, "head");
  try {
    await run("curl", ["-sS", "-L", "--max-time", "25", "--compressed", "-A", "Mozilla/5.0 (X11; Linux x86_64) Chrome/128 Safari/537.36", "-D", head, "-o", body, url]);
    const headers = (await readFile(head, "utf8")).split(/\r?\n\r?\n/).filter(Boolean).pop() ?? "";
    const status = Number(/^HTTP\/[\d.]+ (\d+)/m.exec(headers)?.[1] ?? 200);
    const contentType = /^content-type:\s*(.+)$/im.exec(headers)?.[1]?.trim() ?? "application/octet-stream";
    return { status, contentType, body: await readFile(body) };
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

const browser = await chromium.launch({ executablePath });
for (const p of projects.filter((p) => (p.url || urlOverride[p.slug]) && (only.length === 0 || only.includes(p.slug)) && !manual.has(p.slug))) {
  const url = urlOverride[p.slug] ?? p.url;
  for (const [suffix, viewport] of [["", { width: 1440, height: 900 }], ["-phone", { width: 390, height: 844 }]]) {
    const context = await browser.newContext({ viewport, deviceScaleFactor: 1, ignoreHTTPSErrors: true });
    const page = await context.newPage();
    if (!direct) {
      await page.route("**/*", async (route) => {
        const req = route.request();
        if (req.method() !== "GET") return route.fulfill({ status: 204 });
        try {
          const res = await curlFetch(req.url());
          await route.fulfill({ status: res.status, headers: { "content-type": res.contentType }, body: res.body });
        } catch {
          await route.abort();
        }
      });
    }
    try {
      await page.goto(url, { waitUntil: "load", timeout: 90_000 });
      await page.waitForTimeout(6000);
      await prepare[p.slug]?.(page);
      await page.screenshot({ path: `public/static/work/${p.slug}${suffix}.jpg`, type: "jpeg", quality: 82 });
      console.log("captured", p.slug + suffix);
    } catch (err) {
      console.log("failed", p.slug + suffix, String(err).split("\n")[0]);
    }
    await context.close();
  }
}
await browser.close();
