<script setup lang="ts">
import { projects } from "~/data/projects";
const visible = computed(() => projects.filter((p) => !p.draft));

useSeo({
  title: "Work",
  description:
    "Case studies: a manufacturer's full digital platform, a remix animation tool, a trades marketplace, a tour management app, a kids' music world and a family archive. All built by Johnny Jansen.",
  path: "/work",
  jsonLd: [breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Work", path: "/work" }])],
});
</script>

<template>
  <div class="mx-auto max-w-6xl px-5 py-14 md:py-20">
    <p class="eyebrow text-ink-3">Work</p>
    <h1 class="mt-1 text-4xl font-bold">Products I have shipped</h1>
    <p class="prose-jj mt-4 text-lg text-ink-2">
      Every one of these is a full-stack application with accounts, an admin and tests, built on the same
      methodology. The first is the flagship. The rest are the breadth.
    </p>
    <div class="mt-10 grid gap-6 md:grid-cols-2">
      <ProjectCard v-for="p in visible" :key="p.slug" :project="p" />
    </div>
  </div>
</template>
