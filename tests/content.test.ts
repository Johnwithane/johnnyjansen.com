import { describe, it, expect } from "vitest";
import { projects } from "~/data/projects";
import { series, musicVideos, documentaries, reel } from "~/data/film";
import { career } from "~/data/career";
import { SITE_DESCRIPTION, HEADLINE, SUBHEAD, OFFER } from "~/data/site";

// The content files are the CMS. These tests are the editorial gate: they
// catch the things a reviewer would otherwise catch by eye.
const copyBlobs: string[] = [
  SITE_DESCRIPTION,
  HEADLINE,
  SUBHEAD,
  OFFER.summary,
  ...OFFER.includes,
  ...projects.flatMap((p) => [p.tagline, p.summary, ...p.problem, ...p.built, ...p.detail.body, ...p.outcome]),
  ...series.map((s) => s.description),
  ...career.map((r) => r.summary),
];

describe("copy", () => {
  it("never uses an em or en dash (house style: period, comma or parentheses)", () => {
    const offenders = copyBlobs.filter((t) => /[–—]/.test(t));
    expect(offenders).toEqual([]);
  });
  it("keeps the meta description under 160 characters", () => {
    expect(SITE_DESCRIPTION.length).toBeLessThanOrEqual(160);
  });
});

describe("projects", () => {
  it("have unique, url-safe slugs", () => {
    const slugs = projects.map((p) => p.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const s of slugs) expect(s).toMatch(/^[a-z0-9-]+$/);
  });
  it("each carry the full case-study shape", () => {
    for (const p of projects) {
      expect(p.problem.length, p.slug).toBeGreaterThan(0);
      expect(p.built.length, p.slug).toBeGreaterThan(0);
      expect(p.outcome.length, p.slug).toBeGreaterThan(0);
      expect(p.detail.body.length, p.slug).toBeGreaterThan(0);
      expect(p.stack.length, p.slug).toBeGreaterThan(10);
    }
  });
  it("have exactly one flagship", () => {
    expect(projects.filter((p) => p.kind === "flagship")).toHaveLength(1);
  });
  it("only leave placeholder numbers inside a draft", () => {
    for (const p of projects.filter((p) => !p.draft)) {
      const text = [...p.outcome, ...p.built].join(" ");
      expect(text, p.slug).not.toMatch(/\[Number to confirm\]/);
    }
  });
});

describe("videos", () => {
  it("use ids only, never full urls", () => {
    const all = [reel, ...musicVideos, ...documentaries, ...series.flatMap((s) => s.videos)];
    for (const v of all) {
      expect(v.id).not.toMatch(/https?:/);
      expect(v.id).toMatch(v.provider === "vimeo" ? /^\d+$/ : /^[A-Za-z0-9_-]{11}$/);
    }
  });
});

describe("lab registry", () => {
  it("has unique slugs, static entries point at real files, component entries have loaders", async () => {
    const { prototypes } = await import("~/data/lab");
    const { prototypeLoaders } = await import("~/lab/registry");
    const { existsSync } = await import("node:fs");
    const slugs = prototypes.map((p) => p.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const p of prototypes) {
      if (p.kind === "static") expect(existsSync(`public${p.href}`), p.slug).toBe(true);
      else expect(prototypeLoaders[p.slug], p.slug).toBeTypeOf("function");
      expect(p.slug).not.toBe("admin");
    }
  });
});
