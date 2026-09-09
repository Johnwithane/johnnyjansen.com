<script setup lang="ts">
import { HEADLINE, SUBHEAD, SITE_DESCRIPTION, PERSON, ENGAGEMENT } from "~/data/site";
import { projects, flagship } from "~/data/projects";

const lead = computed(() => {
  const f = flagship();
  return f && !f.draft ? f : undefined;
});
const rest = computed(() => projects.filter((p) => !p.draft && p.slug !== lead.value?.slug).slice(0, 3));

useSeo({
  title: "Johnny Jansen, fractional CTO and product builder",
  description: SITE_DESCRIPTION,
  path: "/",
  type: "profile",
  jsonLd: [
    {
      "@context": "https://schema.org",
      "@type": "ProfilePage",
      "@id": `${useRuntimeConfig().public.siteUrl}/#profile`,
      mainEntity: personJsonLd(),
    },
    websiteJsonLd(),
  ],
});
</script>

<template>
  <div>
    <section class="dark-zone bg-dark-bg text-dark-ink">
      <div class="mx-auto max-w-6xl px-5 pb-16 pt-14 md:pb-24 md:pt-20">
        <p class="eyebrow text-mint">Fractional CTO · Kelowna, BC · Canada and US</p>
        <h1 class="mt-4 max-w-4xl font-display text-4xl font-bold leading-[1.05] md:text-6xl">{{ HEADLINE }}</h1>
        <p class="mt-6 max-w-2xl text-lg text-dark-ink-2 md:text-xl">{{ SUBHEAD }}</p>
        <div class="mt-8 flex flex-wrap gap-3">
          <NuxtLink to="/contact" class="rounded-md bg-mint px-5 py-3 text-sm font-semibold text-dark-bg">Book a 30 minute call</NuxtLink>
          <NuxtLink to="/work" class="rounded-md border border-dark-line px-5 py-3 text-sm font-semibold text-dark-ink hover:border-dark-ink-2">See the work</NuxtLink>
        </div>
      </div>
    </section>

    <section class="mx-auto max-w-6xl px-5 py-14 md:py-20">
      <div class="grid gap-10 md:grid-cols-[1.2fr_1fr] md:items-start">
        <div class="prose-jj">
          <p class="eyebrow text-ink-3">What I do</p>
          <h2 class="mt-1 text-3xl font-semibold">One builder for the whole platform</h2>
          <p>
            A product business needs a public site that sells, a single source of truth for its products, a link to
            the books, a way for customers to configure and ask for a price, and an admin the team can run without a
            developer. Usually that is four vendors and a year. I build all of it, myself, in months.
          </p>
          <p>
            I spent fifteen years as the person who needed the software: brand, content and product for Disney, LEGO
            and Ocean Wise. Now I build it, so the site, the product data and the quote flow are designed around how
            customers actually buy.
          </p>
          <p>
            The brand is part of the build. Every product on this site carries an identity I designed, and the
            Wishbone platform started with a brand refresh, so the site, the print and the product photography
            all read as one company.
          </p>
          <p>
            <strong>AI-native with senior guardrails.</strong> I build with AI coding tools and I say so. Every project
            ships typed, linted, tested, with default-deny security rules and a CI that refuses a red build.
            <NuxtLink to="/how-i-build">Here is exactly how.</NuxtLink>
          </p>
        </div>
        <img
          :src="PERSON.headshot"
          alt="Johnny Jansen"
          width="600"
          height="750"
          class="w-full max-w-sm justify-self-center rounded-lg object-cover md:justify-self-end"
        >
      </div>
    </section>

    <section class="border-t border-line">
      <div class="mx-auto max-w-6xl px-5 py-14 md:py-20">
        <p class="eyebrow text-ink-3">How it works</p>
        <h2 class="mt-1 text-3xl font-semibold">Audit, build, run</h2>
        <ol class="mt-8 grid gap-6 md:grid-cols-3">
          <li v-for="(e, i) in ENGAGEMENT" :key="e.step" class="rounded-lg border border-line bg-surface p-6">
            <p class="font-mono text-xs text-accent">{{ i + 1 }} · {{ e.step }}</p>
            <h3 class="mt-2 font-display text-xl font-semibold">{{ e.title }}</h3>
            <p class="mt-2 text-[15px] text-ink-2">{{ e.body }}</p>
          </li>
        </ol>
      </div>
    </section>

    <section class="border-y border-line bg-surface-2">
      <div class="mx-auto max-w-6xl px-5 py-14 md:py-20">
        <div class="mb-8 flex items-end justify-between gap-4">
          <div>
            <p class="eyebrow text-ink-3">Work</p>
            <h2 class="mt-1 text-3xl font-semibold">Platforms and products I have shipped</h2>
          </div>
          <NuxtLink to="/work" class="hidden text-sm font-semibold text-accent md:block">All work</NuxtLink>
        </div>
        <div v-if="lead" class="mb-6">
          <ProjectCard :project="lead" featured />
        </div>
        <div class="grid gap-6 md:grid-cols-3">
          <ProjectCard v-for="p in rest" :key="p.slug" :project="p" />
        </div>
      </div>
    </section>

    <section class="mx-auto max-w-6xl px-5 py-14 md:py-20">
      <OfferBand />
    </section>

    <section class="dark-zone bg-dark-bg">
      <div class="mx-auto max-w-6xl px-5 py-12">
        <p class="eyebrow mb-6 text-dark-ink-2">Before this: brand and content for</p>
        <LogoStrip />
      </div>
    </section>
  </div>
</template>
