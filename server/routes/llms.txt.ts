import { SITE_NAME, SITE_URL, SITE_DESCRIPTION } from "~~/app/data/site";
import { projects } from "~~/app/data/projects";

// Plain-text index for LLM crawlers. No proven ranking effect, costs nothing.
export default defineEventHandler((event) => {
  setHeader(event, "content-type", "text/plain; charset=utf-8");
  const work = projects
    .filter((p) => !p.draft)
    .map((p) => `- [${p.name}](${SITE_URL}/work/${p.slug}): ${p.tagline}`)
    .join("\n");
  return `# ${SITE_NAME}

> ${SITE_DESCRIPTION}

## Pages
- [Home](${SITE_URL}/)
- [Work](${SITE_URL}/work)
- [How I build](${SITE_URL}/how-i-build)
- [About](${SITE_URL}/about)
- [Contact](${SITE_URL}/contact)

## Case studies
${work}
`;
});
