// The lab: prototypes hosted on johnnyjansen.com instead of a repo each.
// A `static` entry is a standalone HTML page under public/. A `component`
// entry is a Vue component under app/lab/<slug>/ rendered client-side with
// Firebase behind it. `private` entries are direct-link only, noindex, and
// need the password set in /lab/admin. Flip `access` to publish.
export interface Prototype {
  slug: string;
  name: string;
  summary: string;
  access: "public" | "private";
  kind: "static" | "component";
  href?: string; // static: the page under public/
  created: string; // YYYY-MM
  tags: string[];
}

export const prototypes: Prototype[] = [
  {
    slug: "wishbone-colours",
    name: "Powder coat colour catalogue",
    summary:
      "A 3D colour catalogue for site furniture: every powder coat finish rendered on a rounded sample, with a print-to-PDF view and the coating spec in the footer. Built as a one-file tool before the Wishbone platform existed.",
    access: "public",
    kind: "static",
    href: "/WishboneColours.html",
    created: "2026-01",
    tags: ["three.js", "product data", "print"],
  },
  {
    slug: "pocket-jams-hardware",
    name: "Pocket Jams hardware deck",
    summary:
      "A browser simulation of a credit-card sized handheld audio workstation: OLED readout, pads, a step sequencer and synth, all in one HTML file. The prototype that preceded the Pocket Jams app.",
    access: "public",
    kind: "static",
    href: "/tools/PocketJams.html",
    created: "2026-01",
    tags: ["web audio", "hardware", "sequencer"],
  },
  {
    slug: "collage-creator",
    name: "Collage creator",
    summary: "A full-view canvas scrapbook: drop images, arrange, export. A weekend tool.",
    access: "public",
    kind: "static",
    href: "/tools/CollageCreator.html",
    created: "2026-01",
    tags: ["canvas"],
  },
  {
    slug: "math-libs",
    name: "Mad Libs math worksheets",
    summary: "A worksheet generator that hides arithmetic inside a story. Made for my kids.",
    access: "public",
    kind: "static",
    href: "/tools/mathlibs.html",
    created: "2026-01",
    tags: ["kids", "print"],
  },
  {
    slug: "sandbox",
    name: "Sandbox",
    summary:
      "The reference prototype: a shared scratch board that proves sign-in, the password gate, Firestore rules and the feedback drawer all work. Copy this folder to start a new one.",
    access: "private",
    kind: "component",
    created: "2026-09",
    tags: ["reference"],
  },
];

export const publicPrototypes = () => prototypes.filter((p) => p.access === "public");
export const prototypeBySlug = (slug: string) => prototypes.find((p) => p.slug === slug);
