import { test, expect } from "@playwright/test";

// Runs against the generated output. A page that ships without a title,
// description, canonical or JSON-LD fails the build. Drafts must be noindex.
const indexed = ["/", "/work", "/how-i-build", "/about", "/contact", "/resume", "/work/remoose"];

for (const path of indexed) {
  test(`${path} carries the SEO essentials`, async ({ page }) => {
    const res = await page.goto(path);
    expect(res?.status()).toBe(200);
    await expect(page).toHaveTitle(/Johnny Jansen/);
    const canonical = await page.locator('link[rel="canonical"]').getAttribute("href");
    expect(canonical).toBe(`https://johnnyjansen.com${path === "/" ? "" : path}`);
    const description = await page.locator('meta[name="description"]').getAttribute("content");
    expect(description?.length ?? 0).toBeGreaterThan(50);
    const robots = await page.locator('meta[name="robots"]').getAttribute("content");
    expect(robots).toContain("index");
    expect(robots).not.toContain("noindex");
    expect(await page.locator('script[type="application/ld+json"]').count()).toBeGreaterThan(0);
    expect(await page.locator("h1").count()).toBe(1);
  });
}

test("a draft case study is prerendered but noindex", async ({ page }) => {
  const res = await page.goto("/work/wishbone");
  expect(res?.status()).toBe(200);
  const robots = await page.locator('meta[name="robots"]').getAttribute("content");
  expect(robots).toContain("noindex");
});

test("sitemap excludes drafts and includes the work pages", async ({ request }) => {
  const xml = await (await request.get("/sitemap.xml")).text();
  expect(xml).toContain("/work/remoose");
  expect(xml).not.toContain("/work/wishbone");
});

test("llms.txt is served as text", async ({ request }) => {
  const res = await request.get("/llms.txt");
  expect(res.headers()["content-type"]).toContain("text/plain");
  expect(await res.text()).toContain("# Johnny Jansen");
});

test("the home page is usable at phone width", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 740 });
  await page.goto("/");
  const width = await page.evaluate(() => document.documentElement.scrollWidth);
  expect(width).toBeLessThanOrEqual(375);
  await page.getByRole("button", { name: "Menu" }).click();
  await expect(page.locator("#mobile-nav")).toBeVisible();
});

test("the lab index lists public prototypes and is indexable", async ({ page }) => {
  await page.goto("/lab");
  const robots = await page.locator('meta[name="robots"]').getAttribute("content");
  expect(robots).toContain("index");
  await expect(page.getByRole("link", { name: "Powder coat colour catalogue" })).toBeVisible();
  await expect(page.getByText("Sandbox")).toHaveCount(0);
});

test("a static prototype embeds its page", async ({ page }) => {
  await page.goto("/lab/wishbone-colours");
  await expect(page.locator('iframe[title="Powder coat colour catalogue"]')).toHaveAttribute("src", "/WishboneColours.html");
});

test("a private prototype is noindex and degrades without Firebase", async ({ page }) => {
  const res = await page.goto("/lab/sandbox");
  expect(res?.status()).toBe(200);
  const robots = await page.locator('meta[name="robots"]').getAttribute("content");
  expect(robots).toContain("noindex");
  await expect(page.getByText("not configured")).toBeVisible();
});

test("the sitemap excludes private prototypes and the admin", async ({ request }) => {
  const xml = await (await request.get("/sitemap.xml")).text();
  expect(xml).toContain("/lab/wishbone-colours");
  expect(xml).not.toContain("/lab/sandbox");
  expect(xml).not.toContain("/lab/admin");
});
