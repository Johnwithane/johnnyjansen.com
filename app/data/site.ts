// Single source of truth for identity. Everything that names the site, the
// person, or the domain reads from here. Never hardcode the domain elsewhere.
export const SITE_NAME = "Johnny Jansen";
export const SITE_DOMAIN = "johnnyjansen.com";
export const SITE_URL = `https://${SITE_DOMAIN}`;
export const SITE_DESCRIPTION =
  "Johnny Jansen builds the digital platform behind product businesses: site, product data, ERP sync, configurator, quoting. Kelowna BC, Canada and US.";

export const PERSON = {
  name: "Johnny Jansen",
  givenName: "Johnny",
  familyName: "Jansen",
  jobTitle: "Fractional CTO and product builder",
  email: "johnnyajansen@gmail.com",
  location: { city: "Kelowna", region: "BC", country: "CA" },
  linkedin: "https://www.linkedin.com/in/johnnyjansen22",
  github: "https://github.com/Johnwithane",
  youtube: "https://www.youtube.com/@johnnyajansen",
  instagram: "https://www.instagram.com/johnnyajansen",
  x: "https://x.com/johnnyajansen",
  vimeo: "https://vimeo.com/johnnyjansen",
  headshot: "/static/johnny-about.jpg",
} as const;

export const HEADLINE = "The digital platform behind your product business.";
export const SUBHEAD =
  "Public site, product data, ERP sync, 3D configurator, quoting. Built by one person, AI-native, with senior guardrails. For manufacturers and product companies across Canada and the US.";

// The one purchasable first step. Everything ongoing starts after it.
// HUMAN: confirm the price before launch (HUMANTASKS.md).
export const OFFER = {
  name: "Platform Audit",
  price: "$2,500 CAD",
  duration: "Two weeks",
  summary:
    "I read your site, your product data and your quoting process, then hand you a written plan: what to build, in what order, what it costs, and what it earns. Fixed price. If we go on to build it, the audit fee comes off the first invoice.",
  includes: [
    "A walkthrough of how customers find, configure and buy from you today",
    "An inventory of your product data and where it lives (spreadsheets, ERP, the website)",
    "A prioritised build plan with an honest estimate",
    "Financing notes: BDC LIFT and PacifiCan eligibility, where they apply",
  ],
} as const;

// How an engagement runs. The retainer is the business model: build it,
// then stay on. The middle step is the working method behind every project.
export const ENGAGEMENT = [
  {
    step: "Audit",
    title: "Two weeks, a written plan",
    body: "I read the site, the product data and the quoting process, and hand back what to build, in what order, and what it costs. Fixed price. You keep the plan either way.",
  },
  {
    step: "Build",
    title: "Your team uses it while I build it",
    body: "A working platform in weeks, not a mockup. From then on your team works in it, and every idea, bug and request is filed from inside the app. That feedback loop is how one person ships fast without guessing what you need.",
  },
  {
    step: "Run",
    title: "I stay on",
    body: "After launch, a monthly retainer keeps the platform running and ships what your team files. You never need to hire a developer or brief an agency. The person who built it is the person who answers.",
  },
] as const;

export const NAV = [
  { label: "Work", to: "/work" },
  { label: "How I build", to: "/how-i-build" },
  { label: "About", to: "/about" },
  { label: "Contact", to: "/contact" },
] as const;

export const SOCIALS = [
  { label: "LinkedIn", href: PERSON.linkedin },
  { label: "GitHub", href: PERSON.github },
  { label: "YouTube", href: PERSON.youtube },
  { label: "Instagram", href: PERSON.instagram },
] as const;
