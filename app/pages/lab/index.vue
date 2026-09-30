<script setup lang="ts">
import { publicPrototypes } from "~/data/lab";
const items = publicPrototypes();

useSeo({
  title: "Lab",
  description:
    "Prototypes and small tools Johnny Jansen builds between projects: a 3D colour catalogue, a browser synth, worksheet generators. Some public, some by invitation.",
  path: "/lab",
  jsonLd: [breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Lab", path: "/lab" }])],
});
</script>

<template>
  <div class="mx-auto max-w-6xl px-5 py-14 md:py-20">
    <p class="eyebrow text-ink-3">Lab</p>
    <h1 class="mt-1 text-4xl font-bold">Prototypes</h1>
    <p class="prose-jj mt-4 text-lg text-ink-2">
      Small things built quickly to answer a question. Some are public. Some are private and shared by link with the
      people they are for. All of them live here so an idea never waits on a new repo.
    </p>
    <ul class="mt-10 grid gap-6 md:grid-cols-2">
      <li v-for="p in items" :key="p.slug" class="rounded-lg border border-line bg-surface p-5">
        <p class="eyebrow text-ink-3">{{ p.created }} · {{ p.tags.join(" · ") }}</p>
        <h2 class="mt-2 font-display text-xl font-semibold">
          <NuxtLink :to="`/lab/${p.slug}`" class="hover:text-accent">{{ p.name }}</NuxtLink>
        </h2>
        <p class="mt-2 text-[15px] text-ink-2">{{ p.summary }}</p>
        <NuxtLink :to="`/lab/${p.slug}`" class="mt-3 inline-block text-sm font-semibold text-accent">Open</NuxtLink>
      </li>
    </ul>
  </div>
</template>
