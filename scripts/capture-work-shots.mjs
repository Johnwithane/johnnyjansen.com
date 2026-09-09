// Screenshots the live products for the case-study cards. Re-run whenever a
// site changes materially:   node scripts/capture-work-shots.mjs
// Writes public/static/work/<slug>.jpg (1440x900 desktop) and <slug>-phone.jpg.
import { chromium } from "@playwright/test";
import { projects } from "../app/data/projects.ts";

const executablePath = process.env.PW_CHROMIUM || undefined;
// A sandbox that routes egress through a proxy sets HTTPS_PROXY; pass it on.
const proxy = process.env.HTTPS_PROXY ? { server: process.env.HTTPS_PROXY } : undefined;
const browser = await chromium.launch({ executablePath, proxy });
// A product whose apex domain is not live yet is captured at its hosting URL.
const urlOverride = { bettertour: "https://bettertour.web.app", "pocket-jams": "https://pocket-jams.web.app" };
const targets = projects.filter((p) => p.url || urlOverride[p.slug]);
for (const p of targets) {
  for (const [suffix, viewport] of [["", { width: 1440, height: 900 }], ["-phone", { width: 390, height: 844 }]]) {
    const page = await browser.newPage({ viewport, deviceScaleFactor: 1, ignoreHTTPSErrors: true });
    try {
      await page.goto(urlOverride[p.slug] ?? p.url, { waitUntil: "networkidle", timeout: 45_000 });
      await page.waitForTimeout(2500);
      await page.screenshot({ path: `public/static/work/${p.slug}${suffix}.jpg`, type: "jpeg", quality: 82 });
      console.log("captured", p.slug + suffix);
    } catch (err) {
      console.log("failed", p.slug + suffix, String(err).split("\n")[0]);
    }
    await page.close();
  }
}
await browser.close();
