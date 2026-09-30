<script setup lang="ts">
import { prototypeBySlug } from "~/data/lab";

const route = useRoute();
const proto = prototypeBySlug(String(route.params.slug));
if (!proto) throw createError({ statusCode: 404, statusMessage: "Prototype not found", fatal: true });

useSeo({
  title: proto.name,
  description: proto.summary.slice(0, 158),
  path: `/lab/${proto.slug}`,
  noindex: proto.access === "private",
  jsonLd: [
    breadcrumbJsonLd([
      { name: "Home", path: "/" },
      { name: "Lab", path: "/lab" },
      { name: proto.name, path: `/lab/${proto.slug}` },
    ]),
  ],
});
</script>

<template>
  <div v-if="proto" class="mx-auto max-w-6xl px-5 py-10 md:py-14">
    <p class="eyebrow text-ink-3">
      <NuxtLink to="/lab" class="hover:text-accent">Lab</NuxtLink> · {{ proto.created }}
      <span v-if="proto.access === 'private'"> · Private</span>
    </p>
    <h1 class="mt-1 text-3xl font-bold md:text-4xl">{{ proto.name }}</h1>
    <p class="prose-jj mt-3 text-ink-2">{{ proto.summary }}</p>
    <div class="mt-8">
      <ClientOnly>
        <LabHost :proto="proto" />
        <template #fallback>
          <div class="rounded-lg border border-line bg-surface p-6 text-sm text-ink-3">Loading</div>
        </template>
      </ClientOnly>
    </div>
  </div>
</template>
