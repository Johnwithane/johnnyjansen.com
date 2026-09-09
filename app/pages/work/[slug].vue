<script setup lang="ts">
import { projectBySlug } from "~/data/projects";
import { SITE_URL } from "~/data/site";

const route = useRoute();
const project = projectBySlug(String(route.params.slug));
if (!project) throw createError({ statusCode: 404, statusMessage: "Project not found", fatal: true });

useSeo({
  title: `${project.name}: ${project.tagline}`,
  description: project.summary.slice(0, 158),
  path: `/work/${project.slug}`,
  type: "article",
  noindex: project.draft,
  image: `/og/${project.slug}.png`,
  jsonLd: [
    {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: project.name,
      description: project.tagline,
      url: project.url ?? `${SITE_URL}/work/${project.slug}`,
      applicationCategory: "WebApplication",
      operatingSystem: "Web",
      author: { "@id": `${SITE_URL}/#person` },
    },
    breadcrumbJsonLd([
      { name: "Home", path: "/" },
      { name: "Work", path: "/work" },
      { name: project.name, path: `/work/${project.slug}` },
    ]),
  ],
});
</script>

<template>
  <article v-if="project">
    <header class="dark-zone bg-dark-bg text-dark-ink">
      <div class="mx-auto max-w-6xl px-5 pb-12 pt-12 md:pb-16 md:pt-16">
        <p v-if="project.draft" class="mb-4 inline-block rounded bg-dark-surface px-2 py-1 font-mono text-xs text-mint">
          Draft. Not published. Awaiting client sign-off.
        </p>
        <p class="eyebrow text-mint">{{ project.years }} · {{ project.status }}</p>
        <h1 class="mt-3 font-display text-4xl font-bold md:text-5xl">{{ project.name }}</h1>
        <p class="mt-3 max-w-2xl text-xl text-dark-ink-2">{{ project.tagline }}</p>
        <dl class="mt-8 grid gap-6 text-sm sm:grid-cols-3">
          <div>
            <dt class="eyebrow text-dark-ink-2">Role</dt>
            <dd class="mt-1">{{ project.role }}</dd>
          </div>
          <div v-if="project.collaborators?.length">
            <dt class="eyebrow text-dark-ink-2">With</dt>
            <dd class="mt-1">{{ project.collaborators.join(", ") }}</dd>
          </div>
          <div v-if="project.url">
            <dt class="eyebrow text-dark-ink-2">Live</dt>
            <dd class="mt-1"><a :href="project.url" target="_blank" rel="noopener" class="text-mint">{{ project.url.replace("https://", "") }}</a></dd>
          </div>
        </dl>
      </div>
    </header>

    <div v-if="project.image" class="mx-auto max-w-6xl px-5 pt-10">
      <img
        :src="project.image"
        :alt="`${project.name} at desktop width`"
        width="1440"
        height="900"
        class="w-full rounded-lg border border-line"
      >
    </div>

    <div class="mx-auto grid max-w-6xl gap-12 px-5 py-12 md:grid-cols-[1fr_280px] md:py-16">
      <div class="prose-jj">
        <p class="text-lg">{{ project.summary }}</p>

        <h2>The problem</h2>
        <ul>
          <li v-for="line in project.problem" :key="line">{{ line }}</li>
        </ul>

        <h2>What I built</h2>
        <ul>
          <li v-for="line in project.built" :key="line">{{ line }}</li>
        </ul>

        <h2>{{ project.detail.title }}</h2>
        <p v-for="para in project.detail.body" :key="para">{{ para }}</p>

        <h2>Outcome</h2>
        <ul>
          <li v-for="line in project.outcome" :key="line">{{ line }}</li>
        </ul>

        <div v-if="project.video" class="mt-8">
          <VideoEmbed :id="project.video.id" :provider="project.video.provider" :title="project.video.title" />
        </div>
      </div>

      <aside class="md:sticky md:top-6 md:self-start">
        <div class="rounded-lg border border-line bg-surface p-5 text-sm">
          <p class="eyebrow text-ink-3">Stack</p>
          <p class="mt-2 text-ink-2">{{ project.stack }}</p>
          <p v-if="project.repo" class="mt-3"><a :href="project.repo" class="text-accent">Source</a></p>
        </div>
        <div class="mt-4 rounded-lg bg-dark-bg p-5 text-sm text-dark-ink-2 dark-zone">
          <p class="text-dark-ink">Want something like this?</p>
          <NuxtLink to="/contact" class="mt-2 block font-semibold text-mint">Book a 30 minute call</NuxtLink>
        </div>
      </aside>
    </div>
  </article>
</template>
