// Single source of truth for identity. Everything that names the site, the
// person, or the domain reads from here. Never hardcode the domain elsewhere.
export const SITE_NAME = "Johnny Jansen";
export const SITE_DOMAIN = "johnnyjansen.com";
export const SITE_URL = `https://${SITE_DOMAIN}`;
export const SITE_DESCRIPTION =
  "Johnny Jansen is a creative director who builds the software too: brand, campaigns, video and custom software. Kelowna, BC.";

export const PERSON = {
  name: "Johnny Jansen",
  givenName: "Johnny",
  familyName: "Jansen",
  jobTitle: "Creative director and software builder",
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

export const HEADLINE = "A creative director who builds the software too.";
export const SUBHEAD =
  "Fifteen years of brand and content for Disney, LEGO and Ocean Wise, and a shelf of music videos. Now I design and build custom software as well: products, platforms and the tools a team runs on.";

// The one next step. There is no price here: every project starts with a call.
export const OFFER = {
  name: "Work with me",
  summary:
    "Creative direction for a brand, a launch or a series. Custom software for a product, a platform or the internal tool your team keeps wishing for. Often both. It starts with a 30 minute call, and I will tell you straight whether I am the right person.",
  includes: [
    "Brand, campaigns and video, from concept to delivery",
    "Custom software: web apps, platforms and internal tools",
    "Both at once, so the product and the brand read as one",
    "Built with AI coding tools, with the tests and security rules to back it",
  ],
} as const;

// The kinds of work, shown on the home page.
export const ENGAGEMENT = [
  {
    step: "Creative direction",
    title: "Brand, campaigns, video",
    body: "Concept to delivery for brands with a story to tell. Fifteen years of it, from Club Penguin to Juno-nominated music videos.",
  },
  {
    step: "Custom software",
    title: "Products, platforms, tools",
    body: "Web apps and internal tools, designed and built by me. Typed, tested, and shipped with the team filing ideas from inside the app.",
  },
  {
    step: "Both",
    title: "One person, one voice",
    body: "When the same person makes the brand and the product, they read as one company. That is the rare part.",
  },
] as const;

export const NAV = [
  { label: "Work", to: "/work" },
  { label: "How I build", to: "/how-i-build" },
  { label: "Lab", to: "/lab" },
  { label: "About", to: "/about" },
  { label: "Contact", to: "/contact" },
] as const;

export const SOCIALS = [
  { label: "LinkedIn", href: PERSON.linkedin },
  { label: "GitHub", href: PERSON.github },
  { label: "YouTube", href: PERSON.youtube },
  { label: "Instagram", href: PERSON.instagram },
] as const;
