// Renders the PWA icons and the default Open Graph image from HTML with the
// Playwright Chromium. Re-run after changing the headline or the mark:
//   node scripts/render-brand-assets.mjs
import { chromium } from "@playwright/test";
const mark = (size, radius) => `<!doctype html><html><body style="margin:0;background:#050505">
<div style="width:${size}px;height:${size}px;display:flex;align-items:center;justify-content:center;background:#050505;border-radius:${radius}px;font-family:'DejaVu Sans',Arial,sans-serif;font-weight:700;color:#37FF8B;font-size:${size*0.46}px;letter-spacing:-0.06em">JJ</div></body></html>`;
const og = `<!doctype html><html><body style="margin:0"><div style="width:1200px;height:630px;background:#050505;color:#f1f4f2;font-family:'DejaVu Sans',Arial,sans-serif;padding:72px;box-sizing:border-box;display:flex;flex-direction:column;justify-content:space-between">
<div style="font-family:'DejaVu Sans Mono',monospace;font-size:20px;letter-spacing:.1em;color:#37FF8B">FRACTIONAL CTO · KELOWNA, BC</div>
<div style="font-size:64px;font-weight:700;line-height:1.08;letter-spacing:-.02em;max-width:1000px">The digital platform behind your product business.</div>
<div style="display:flex;justify-content:space-between;align-items:flex-end;font-size:26px;color:#aab5ae"><span>Johnny Jansen</span><span>johnnyjansen.com</span></div></div></body></html>`;
const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const page = await browser.newPage();
for (const [size, file] of [[192, "public/icons/icon-192.png"], [512, "public/icons/icon-512.png"]]) {
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(mark(size, 0));
  await page.screenshot({ path: file, omitBackground: false });
}
await page.setViewportSize({ width: 1200, height: 630 });
await page.setContent(og);
await page.screenshot({ path: "public/og-default.png" });

// One share image per case study, same frame, the project's own words.
const { projects } = await import("../app/data/projects.ts");
const { readFile } = await import("node:fs/promises");
const { existsSync } = await import("node:fs");
for (const p of projects) {
  // The screenshot rides along as a data URI so the page needs no server.
  const shot = p.image && existsSync(`public${p.image}`) ? `data:image/jpeg;base64,${(await readFile(`public${p.image}`)).toString("base64")}` : null;
  const picture = shot
    ? `<div style="position:absolute;right:-40px;top:96px;width:560px;height:560px;border-radius:14px;overflow:hidden;box-shadow:0 30px 80px rgba(0,0,0,.6);transform:rotate(-3deg)"><img src="${shot}" style="width:100%;height:100%;object-fit:cover;object-position:top left"></div>`
    : "";
  const card = `<!doctype html><html><body style="margin:0"><div style="position:relative;width:1200px;height:630px;background:#050505;color:#f1f4f2;font-family:'DejaVu Sans',Arial,sans-serif;padding:72px;box-sizing:border-box;display:flex;flex-direction:column;justify-content:space-between;overflow:hidden">
${picture}
<div style="position:relative;font-family:'DejaVu Sans Mono',monospace;font-size:20px;letter-spacing:.1em;color:#37FF8B">CASE STUDY · ${p.years.toUpperCase()}${shot ? "" : " · JOHNNYJANSEN.COM"}</div>
<div style="position:relative;max-width:${shot ? 560 : 1000}px"><div style="font-size:${shot ? 60 : 72}px;font-weight:700;line-height:1.05;letter-spacing:-.02em">${p.name}</div><div style="font-size:${shot ? 28 : 34}px;color:#aab5ae;margin-top:18px;line-height:1.25">${p.tagline}</div></div>
<div style="position:relative;display:flex;gap:28px;align-items:flex-end;font-size:26px;color:#aab5ae"><span style="color:#f1f4f2">Johnny Jansen</span><span>${shot ? "johnnyjansen.com" : ""}</span></div></div></body></html>`;
  await page.setContent(card);
  await page.screenshot({ path: `public/og/${p.slug}.png` });
}
await browser.close();
console.log("rendered");
