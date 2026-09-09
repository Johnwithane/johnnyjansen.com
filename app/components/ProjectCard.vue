<script setup lang="ts">
import type { Project } from "~/data/projects";
defineProps<{ project: Project; featured?: boolean }>();
</script>

<template>
  <NuxtLink
    :to="`/work/${project.slug}`"
    class="group flex flex-col overflow-hidden rounded-lg border border-line bg-surface transition-colors hover:border-accent"
  >
    <div
      class="dark-zone relative flex aspect-[16/9] items-end bg-dark-surface p-5"
      :class="featured ? 'md:aspect-[21/9]' : ''"
    >
      <img
        v-if="project.image"
        :src="project.image"
        alt=""
        loading="lazy"
        class="absolute inset-0 h-full w-full object-cover opacity-60"
      >
      <span class="relative font-display text-2xl font-semibold text-dark-ink">{{ project.name }}</span>
    </div>
    <div class="flex flex-1 flex-col gap-2 p-5">
      <p class="eyebrow text-ink-3">{{ project.years }} · {{ project.status }}</p>
      <p class="font-display text-lg font-semibold leading-snug">{{ project.tagline }}</p>
      <p class="line-clamp-3 text-[15px] text-ink-2">{{ project.summary }}</p>
      <span class="mt-auto pt-2 text-sm font-semibold text-accent group-hover:underline">Read the case study</span>
    </div>
  </NuxtLink>
</template>
