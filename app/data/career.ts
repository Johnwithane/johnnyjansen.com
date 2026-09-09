export interface Role {
  years: string;
  title: string;
  org: string;
  summary: string;
}

// Newest first. Kept short on purpose; the case studies carry the detail.
export const career: Role[] = [
  {
    years: "2025 to today",
    title: "Marketing Director",
    org: "Wishbone Site Furnishings",
    summary:
      "Marketing for the company my father founded, and the whole digital platform built in-house: public site, product information system, ERP sync, configurator and quoting. Launched September 2026.",
  },
  {
    years: "2024 to today",
    title: "Co-founder and Chief Creative Officer",
    org: "Remoose",
    summary:
      "Prototyped from 2022, incorporated 2024 with Lance Priebe and Nicole Thompson. Product, design, and front end. Rebuilt the platform on Firebase in 2026.",
  },
  {
    years: "2021 to 2024",
    title: "Content Director",
    org: "RocketSnail Games",
    summary: "Content systems and strategy for a games studio, alongside the LEGO work.",
  },
  {
    years: "2021 to 2023",
    title: "Content Specialist",
    org: "LEGO Group",
    summary:
      "Created the Build Your Own Adventure series on LEGO Life: two seasons of community-driven storytelling with voting and UGC features.",
  },
  {
    years: "2014 to today",
    title: "Director and motion designer",
    org: "Freelance",
    summary:
      "Music videos, a feature funded by Blumhouse Productions, commercials for Corus and Disney Interactive. Juno nomination, Leo Award, WCMA Director of the Year, Prism Prize.",
  },
  {
    years: "2017 to 2019",
    title: "Creative Producer and motion designer",
    org: "Ocean Wise",
    summary: "Ocean Kitchen, Brain Waves and Ocean Explainers series; exhibit screen content for the Vancouver Aquarium.",
  },
  {
    years: "2013 to 2014",
    title: "Community Manager and videographer",
    org: "Hyper Hippo",
    summary: "Game trailers, studio video blogs, and the social channels for every title.",
  },
  {
    years: "2010 to 2013",
    title: "Online Community Videographer",
    org: "Disney Interactive",
    summary:
      "Businesmoose on Club Penguin. 61 videos, over 14 million views, TV spots on Cartoon Network and Nickelodeon.",
  },
];
