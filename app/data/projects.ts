// Case studies. Order is the order they appear. `draft: true` prerenders the
// page (so a preview link works) but keeps it noindex, out of the sitemap and
// off the home page until the client has cleared it.
export interface Project {
  slug: string;
  name: string;
  tagline: string;
  kind: "flagship" | "product";
  years: string;
  status: string;
  role: string;
  url?: string;
  repo?: string;
  collaborators?: string[];
  summary: string;
  problem: string[];
  built: string[];
  detail: { title: string; body: string[] };
  outcome: string[];
  stack: string;
  video?: { provider: "vimeo" | "youtube"; id: string; title: string };
  image?: string;
  before?: { image: string; caption: string; afterCaption: string };
  draft?: boolean;
}

export const projects: Project[] = [
  {
    slug: "wishbone",
    name: "Wishbone Site Furnishings",
    tagline: "A 30 year manufacturer gets its first digital platform",
    kind: "flagship",
    years: "2025 to 2026",
    status: "Launched September 2026, in daily use",
    role: "Marketing Director. Brand refresh, then the whole platform, designed and built in-house, solo",
    url: "https://wishboneltd.com",
    summary:
      "Wishbone has made site furniture in Langley, BC since 1995: benches, tables, waste receptacles, bike racks, for parks and campuses across North America. My father founded it. When it changed hands I joined as Marketing Director, and found a company with an ERP, a catalogue in spreadsheets and PDFs, a website nobody could edit, and no system of record for products. I built that system, and the public site on top of it, in-house from Kelowna, with the team using it and filing ideas from inside the admin the whole way.",
    problem: [
      "Product information lived in the ERP, in spreadsheets, in InDesign files and in staff heads. The website copied some of it by hand and drifted.",
      "Quoting meant a phone call and a PDF. There was no way for a landscape architect to configure a bench in the finish they wanted and ask for a price.",
      "The site could not be edited by the team, and thirty years of installation photography sat on hard drives.",
    ],
    built: [
      "A public site that is tag-routed and tile-composed: a URL like /bamboo/bench/park becomes a page assembled from products, installation photos, stories and video, ranked by what visitors actually respond to",
      "Product information management: one record per product, owned by the team in an admin, with the ERP as the source of truth for price and status",
      "Two-way ERP sync with Ragic every six hours, so the site can never disagree with the books",
      "A CAD to web pipeline: engineering files become 3D models automatically, then a configurator, poster renders in every finish, and spec sheets generated on demand",
      "Quoting and a design studio: a 3D space planner, mood boards, and a quote request that lands in the sales inbox with the exact configuration attached",
      "Price behind login by design, with security rules and tests that keep it there",
      "An admin with over a hundred screens, an AI assistant that looks data up instead of guessing, analytics, and a bug reporting loop from the public site",
      "A tightened brand system: one typeface, one palette, enforced as tokens in code so the site cannot drift off-brand",
    ],
    detail: {
      title: "The tile engine",
      body: [
        "Most manufacturer sites are a catalogue with a filter. Wishbone's public site is a feed. Every URL resolves to a set of tags, and a composer builds the page from tiles: product carousels, installation photography, ambient video, stories, calls to action. Each tile carries an importance rank set by the team, a click ratio per visitor persona, and a count of how often this visitor has already seen it. The page is different for a parks manager on a return visit than for a landscape architect on a first one.",
        "It is server rendered, so search engines and AI crawlers read the same HTML a person does. Photos are geotagged, so someone browsing from Kelowna sees Kelowna installations first.",
      ],
    },
    outcome: [
      "Launched on the production domain in September 2026, replacing the old site with redirects for every legacy URL",
      "[Number to confirm] products synced from the ERP with price and status owned by the books",
      "[Number to confirm] quote requests in the first weeks, each arriving with the exact configuration",
      "[Number to confirm] staff editing the site and product data without a developer",
    ],
    stack: "Nuxt 3 (SSR), Vue 3, TypeScript, Tailwind, Firebase (Firestore, Functions, Hosting), Ragic ERP, three.js, Vertex AI, Playwright, Vitest",
    video: { provider: "youtube", id: "oopMUokWKD8", title: "Wishbone brand film" },
    image: "/static/work/wishbone.jpg",
    before: {
      image: "/static/work/wishbone-before.jpg",
      caption: "Before: the site the company had, editable by nobody, with the catalogue in PDFs.",
      afterCaption: "After: the platform, launched September 2026. Search, a tile feed ranked by what visitors respond to, the Studio, and quoting.",
    },
    draft: true,
  },
  {
    slug: "remoose",
    name: "Remoose",
    tagline: "The startup where I learned to build",
    kind: "product",
    years: "2022 to today",
    status: "Live, rebuilt on a new stack in 2026",
    role: "Co-founder. Brand, product, design and front end",
    url: "https://remoose.com",
    collaborators: ["Lance Priebe, co-creator of Club Penguin", "Nicole Thompson"],
    summary:
      "Remoose is a remix tool for four second looping animations. Pick a character, a background, an effect and some text, choose how each one moves, and you get a loop with a URL. Someone else opens that URL, swaps a layer, and publishes their own. The remix tree grows. It came out of user generated content work I did for LEGO, was prototyped in 2022, became a company in 2024, and ran out of funding just as AI coding tools arrived. Rebuilding it with those tools is how I became a developer.",
    problem: [
      "Kids want to make and share, but every UGC system is either a blank canvas nobody fills or a moderation nightmare.",
      "The original stack (Django, FastAPI, Kong, Postgres, AWS Lambda) rendered video on servers. Every publish cost money and every renderer improvement meant re-encoding the archive.",
    ],
    built: [
      "A recipe architecture: a published scene is a few kilobytes of ids and numbers, rendered deterministically on the viewer's device. No server renders anything",
      "A versioned canvas renderer, so old scenes keep looking the way their creator saw them while new ones get improvements",
      "The remix tree, with tombstones so removing a parent never breaks its children",
      "A CMS in Firestore for compositions, assets and packs, edited by the team without a deploy",
      "Report and moderation paths for every surface where a user can put something in front of another user",
      "Migration off the AWS stack onto Firebase, with the old backend deleted only once every feature was reproduced",
    ],
    detail: {
      title: "A scene is a recipe, not a video",
      body: [
        "Because the animation is derived from the recipe on every view, twenty animating scenes on a grid cost about what one costs, publishing is one database write plus a poster image, and improving the renderer improves ten thousand old scenes with no backfill. A bug report from a stranger's phone carries the recipe, so it reproduces exactly on my machine.",
      ],
    },
    outcome: [
      "Per-publish server cost went from a Lambda render to zero",
      "Every scene ever published renders on the current engine, and old scenes are pinned to the renderer version they were made on",
    ],
    stack: "Vue 3, TypeScript, Canvas 2D, WebCodecs, Firebase, Zod, Vitest",
    video: { provider: "vimeo", id: "1102400408", title: "Remoose product demo" },
    image: "/static/work/remoose.jpg",
  },
  {
    slug: "blue-seal",
    name: "Blue Seal",
    tagline: "A marketplace for verified trades, built with my brother",
    kind: "product",
    years: "2025 to 2026",
    status: "Live",
    role: "Brand, design and everything technical; my brother James, a Red Seal tradesperson, on the product",
    url: "https://blueseal.app",
    collaborators: ["James Jansen, Red Seal tradesperson"],
    summary:
      "Blue Seal is a two-sided app where clients hire verified tradespeople and tradespeople run their book of business. Every tradesperson passes certification and ID vetting before they go live, which is the whole point: it is a curated compare and choose between vetted professionals, not a race to the lowest bid.",
    problem: [
      "Homeowners cannot tell a certified tradesperson from someone with a truck. Tradespeople doing it right lose work to people who are not.",
      "Small trades businesses run on texts and paper. Quotes, invoices and reviews live nowhere.",
    ],
    built: [
      "Three roles (client, tradesperson, admin) with trade-specific intake forms and an admin vetting queue for certifications, insurance and ID",
      "Per-job kanban with chat, quotes, and AI tools: receipt OCR for everyone, an assistant for Pro",
      "Mutual reviews, auto-invoicing, and Stripe Connect payouts",
      "A job board where verified tradespeople answer an open post with a full itemised quote",
      "Default-deny security rules with an allow and a deny test for every collection: over 150 rules tests",
      "Offline-first PWA with a help centre and a QA toolkit built in",
    ],
    detail: {
      title: "The payout maths",
      body: [
        "When a client pays by card, the processing fee is grossed up so the tradesperson nets the full invoice and the platform fee stays whole. Getting that right in every refund and partial-payment case is the kind of detail a marketplace lives or dies on, and it has tests.",
      ],
    },
    outcome: ["Payments shipped to a test-mode Stripe account; live launch is gated on legal sign-off"],
    stack: "Vue 3, TypeScript, PrimeVue, Tailwind, Firebase, Stripe Connect, Vertex AI, Playwright, Vitest",
    image: "/static/work/blue-seal.jpg",
  },
  {
    slug: "bettertour",
    name: "BetterTour",
    tagline: "Tour management for the live music industry",
    kind: "product",
    years: "2026",
    status: "In active development, tested on real tours",
    role: "Brand, design and build",
    url: "https://bettertour.app",
    collaborators: ["Drew McTaggart, Dear Rouge", "James Butler, tour manager"],
    summary:
      "Every touring act runs on one incumbent tool that the industry has outgrown. BetterTour is a clone-and-beat: bands, tours, days as the spine, shows, schedule, travel, guest lists, advance, budget and settlement, with AI import of posters and receipts. Built with a touring artist and a working tour manager who use it on the road.",
    problem: [
      "Tour data lives in a desktop app, a group chat and a spreadsheet. The crew member in a loading dock with no signal has none of it.",
      "Importing a run of dates means retyping every poster and email.",
    ],
    built: [
      "Offline-first PWA: the app shell, the session and every previously opened tour work with no signal, and writes queue until it returns",
      "Data shapes compatible with the incumbent's export, so a tour imports in one step",
      "AI import: photograph a poster or a receipt and the day or the expense fills itself in",
      "An in-app assistant that proposes actions and never runs them: the user confirms, and their own permissions execute",
      "Shared venue database across tours, public day-sheet share links, budget and settlement",
      "A browser test that cuts the network and proves the app still boots",
    ],
    detail: {
      title: "Offline is proven, not assumed",
      body: [
        "An early version shipped with a document that said offline reads worked. They did not. A tour manager filed a bug that read 'loading spinner forever, I have never accessed a tour offline'. Now every feature is run in an offline browser before it is called done, and the boot path has an automated test that cuts the network and asserts the app paints. The rule is written down in the repo's operating manual, with the bug id.",
      ],
    },
    outcome: ["In use on real tours by the collaborators who designed it", "Monetisation built and dormant: free for the whole crew until the paywall is switched on"],
    stack: "Vue 3, TypeScript, Firebase, Vertex AI (Gemini), FlightAware, Stripe, Playwright, Vitest",
    image: "/static/work/bettertour.jpg",
  },
  {
    slug: "pocket-jams",
    name: "Pocket Jams",
    tagline: "A music-making world for kids, designed with my son",
    kind: "product",
    years: "2025 to 2026",
    status: "Live, in development",
    role: "Brand and build; my son Forest, co-designer and lead tester",
    collaborators: ["Forest Jansen, co-designer"],
    summary:
      "Pocket Jams is a web-based social music platform for kids and families. Make beats with a hardware-style deck and step sequencer, then hang out in pixel-art multiplayer rooms with avatars, jam stations and missions. Music is saved, published to a feed, remixed with attribution, and arranged in a simple studio. My son Forest designs it with me and tests every build on his phone.",
    problem: [
      "Music apps for kids are either toys or intimidating DAWs. Social apps for kids are either lonely or unsafe.",
      "Real-time audio in a browser on a mid-range phone, with six people in a room, is genuinely hard.",
    ],
    built: [
      "A step sequencer and synth engine on the Web Audio API, with loops saved as re-editable configuration, not just audio",
      "Multiplayer rooms on Realtime Database sharing one sequencer and one master loop, in time across devices",
      "Remix with attribution chains, a community feed, and a points and stamps economy computed on the server",
      "Kid-safety by default: anonymous sign-in, curated cover art only, no user image uploads, profanity and moderation pipeline, private rooms for child accounts",
      "Runs fully offline with no backend configured; ships to iOS and Android through Capacitor and as a Discord activity",
    ],
    detail: {
      title: "Six people, one beat, no audio over the wire",
      body: [
        "A live jam is a few kilobytes of pattern data plus a shared clock epoch. Every phone renders the sound itself. That is what makes it a family project and not a streaming company: the multiplayer costs almost nothing to run.",
      ],
    },
    outcome: ["Playable today by a kid on a phone, which is the only metric that has ever mattered on this one"],
    stack: "Vue 3, TypeScript, Web Audio, Tone.js, Firebase (Firestore, RTDB, Functions), Capacitor, Discord SDK, Vitest",
    image: "/static/work/pocket-jams.jpg",
  },
  {
    slug: "waldetree",
    name: "WaldeTree",
    tagline: "A private family archive, built after a hundred-year reunion",
    kind: "product",
    years: "2026",
    status: "In development",
    role: "Brand, design and build, with the family",
    summary:
      "My wife's family gathered to mark a hundred years since immigrating to Canada. A pile of cousins met for the first time and wanted the same thing: everyone on one tree, with the photos and stories attached. WaldeTree is that. A private social network where the tree is the home screen, built from their GEDCOM files.",
    problem: [
      "Genealogy tools are research products for one person. Families want a shared, private, living tree.",
      "Living people's data is sensitive. The privacy wall has to be the first thing built, not the last.",
    ],
    built: [
      "The tree as the app: pannable, zoomable, touch-first, with every control a real touch target",
      "A living-person privacy wall enforced in security rules, with tests",
      "Proposals and admin approval for lineage edits, so nobody rewrites the family by accident",
      "A family album: photos and documents tagged to people and dates",
      "GEDCOM import and export, invites by link, offline-first",
    ],
    detail: {
      title: "The scaffold is the product",
      body: [
        "WaldeTree is a stripped fork of BetterTour, which is a fork of Blue Seal. Each one keeps the operating manual, the security rule patterns, the offline layer, the help centre and the QA toolkit, and strips the previous product's domain. A new full-stack app with auth, admin and tests starts from a working scaffold in one session.",
      ],
    },
    outcome: ["Phase 6 of the plan shipped: tree, people, relationships, proposals, album, invites"],
    stack: "Vue 3, TypeScript, Firebase, Playwright, Vitest",
  },
];

export const publishedProjects = () => projects.filter((p) => !p.draft);
export const flagship = () => projects.find((p) => p.kind === "flagship");
export const projectBySlug = (slug: string) => projects.find((p) => p.slug === slug);
