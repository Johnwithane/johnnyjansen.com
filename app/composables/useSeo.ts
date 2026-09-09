import { SITE_NAME, SITE_URL, PERSON } from "~/data/site";

interface SeoInput {
  title: string;
  description: string;
  path: string;
  image?: string;
  noindex?: boolean;
  type?: "website" | "article" | "profile";
  jsonLd?: Record<string, unknown>[];
}

// One call per page. Emits title, description, canonical, Open Graph, Twitter
// and JSON-LD. Keyed so hydration adopts the server tags instead of duplicating.
export function useSeo(input: SeoInput) {
  const url = `${SITE_URL}${input.path === "/" ? "" : input.path}`;
  const image = `${SITE_URL}${input.image ?? "/og-default.png"}`;
  const robots = input.noindex ? "noindex, nofollow" : "index, follow, max-image-preview:large";

  useHead({
    title: input.title,
    link: [{ rel: "canonical", href: url, key: "canonical" }],
    meta: [
      { name: "description", content: input.description, key: "description" },
      { name: "robots", content: robots, key: "robots" },
      { property: "og:type", content: input.type ?? "website", key: "og:type" },
      { property: "og:site_name", content: SITE_NAME, key: "og:site_name" },
      { property: "og:locale", content: "en_CA", key: "og:locale" },
      { property: "og:url", content: url, key: "og:url" },
      { property: "og:title", content: input.title, key: "og:title" },
      { property: "og:description", content: input.description, key: "og:description" },
      { property: "og:image", content: image, key: "og:image" },
      { property: "og:image:width", content: "1200", key: "og:image:width" },
      { property: "og:image:height", content: "630", key: "og:image:height" },
      { name: "twitter:card", content: "summary_large_image", key: "twitter:card" },
      { name: "twitter:site", content: "@johnnyajansen", key: "twitter:site" },
      { name: "twitter:title", content: input.title, key: "twitter:title" },
      { name: "twitter:description", content: input.description, key: "twitter:description" },
      { name: "twitter:image", content: image, key: "twitter:image" },
    ],
    script: (input.jsonLd ?? []).map((data, i) => ({
      type: "application/ld+json",
      key: `ld-${i}`,
      innerHTML: JSON.stringify(data),
    })),
  });
}

export const personJsonLd = () => ({
  "@context": "https://schema.org",
  "@type": "Person",
  "@id": `${SITE_URL}/#person`,
  name: PERSON.name,
  givenName: PERSON.givenName,
  familyName: PERSON.familyName,
  jobTitle: PERSON.jobTitle,
  url: SITE_URL,
  image: `${SITE_URL}${PERSON.headshot}`,
  email: `mailto:${PERSON.email}`,
  address: {
    "@type": "PostalAddress",
    addressLocality: PERSON.location.city,
    addressRegion: PERSON.location.region,
    addressCountry: PERSON.location.country,
  },
  sameAs: [PERSON.linkedin, PERSON.github, PERSON.youtube, PERSON.instagram, PERSON.x],
  knowsAbout: [
    "Nuxt",
    "Vue.js",
    "Firebase",
    "Product information management",
    "ERP integration",
    "3D product configurators",
    "Progressive web apps",
    "AI-assisted software development",
    "Brand storytelling",
    "Video production",
  ],
});

export const websiteJsonLd = () => ({
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": `${SITE_URL}/#website`,
  url: SITE_URL,
  name: SITE_NAME,
  publisher: { "@id": `${SITE_URL}/#person` },
});

export const breadcrumbJsonLd = (items: { name: string; path: string }[]) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: items.map((item, i) => ({
    "@type": "ListItem",
    position: i + 1,
    name: item.name,
    item: `${SITE_URL}${item.path === "/" ? "" : item.path}`,
  })),
});
