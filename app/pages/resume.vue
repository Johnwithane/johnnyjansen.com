<script setup lang="ts">
import { PERSON } from "~/data/site";
import { career } from "~/data/career";
import { awards } from "~/data/film";

useSeo({
  title: "Resume",
  description: "Johnny Jansen's resume: fractional CTO and product builder, formerly creative director and filmmaker. Kelowna, BC.",
  path: "/resume",
  type: "profile",
  jsonLd: [breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Resume", path: "/resume" }])],
});

const skills = [
  { group: "Build", items: "Vue 3, Nuxt, TypeScript, Tailwind, Firebase (Firestore, Functions, Hosting, Auth), Node, Playwright, Vitest" },
  { group: "Systems", items: "Product information management, ERP integration (Ragic), Stripe and Stripe Connect, 3D on the web (three.js), PWA and offline-first" },
  { group: "AI", items: "Claude Code and agentic development, Vertex AI and Gemini in production, guardrailed assistants" },
  { group: "Product and brand", items: "Product strategy, UX, design systems, content strategy, copywriting, brand identity" },
  { group: "Film", items: "Directing, motion design, video production, post-production" },
];
</script>

<template>
  <div class="mx-auto max-w-4xl px-5 py-14 md:py-20">
    <div class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <p class="eyebrow text-ink-3">Resume</p>
        <h1 class="mt-1 text-4xl font-bold">{{ PERSON.name }}</h1>
        <p class="mt-1 text-lg text-ink-2">{{ PERSON.jobTitle }} · {{ PERSON.location.city }}, {{ PERSON.location.region }}</p>
      </div>
      <a href="/JohnnyJansen-Resume.pdf" class="rounded-md border border-line px-4 py-2 text-sm font-semibold text-accent">Download PDF</a>
    </div>

    <div class="prose-jj mt-8">
      <p>
        Full-stack builder who came up through brand, content and product. Shipped a 30 year manufacturer's complete
        digital platform solo in 2026, and five full-stack products before it. Fifteen years leading creative for
        Disney, LEGO and Ocean Wise. Award-winning director.
      </p>
    </div>

    <h2 class="mt-10 font-display text-2xl font-semibold">Skills</h2>
    <dl class="mt-4 divide-y divide-line">
      <div v-for="s in skills" :key="s.group" class="grid gap-1 py-3 md:grid-cols-[160px_1fr]">
        <dt class="font-mono text-xs text-ink-3 md:pt-1">{{ s.group }}</dt>
        <dd class="text-[15px] text-ink-2">{{ s.items }}</dd>
      </div>
    </dl>

    <h2 class="mt-10 font-display text-2xl font-semibold">Experience</h2>
    <ol class="mt-4 divide-y divide-line">
      <li v-for="r in career" :key="r.org + r.years" class="grid gap-1 py-4 md:grid-cols-[160px_1fr]">
        <p class="font-mono text-xs text-ink-3 md:pt-1">{{ r.years }}</p>
        <div>
          <p class="font-display font-semibold">{{ r.title }}, {{ r.org }}</p>
          <p class="text-[15px] text-ink-2">{{ r.summary }}</p>
        </div>
      </li>
    </ol>

    <h2 class="mt-10 font-display text-2xl font-semibold">Recognition</h2>
    <ul class="mt-4 list-disc pl-5 text-[15px] text-ink-2">
      <li v-for="a in awards" :key="a">{{ a }}</li>
    </ul>
  </div>
</template>
