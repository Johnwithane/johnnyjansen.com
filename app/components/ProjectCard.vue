<script setup lang="ts">
import type { Project } from "~/data/projects";
const props = defineProps<{ project: Project; featured?: boolean }>();
// A real screenshot when one exists, else the share image, which carries the name.
const image = computed(() => props.project.image ?? `/og/${props.project.slug}.png`);
</script>

<template>
  <NuxtLink
    :to="`/work/${project.slug}`"
    class="group flex flex-col overflow-hidden rounded-lg border border-line bg-surface transition-colors hover:border-accent"
  >
    <div class="relative aspect-[16/9] overflow-hidden bg-dark-surface" :class="featured ? 'md:aspect-[21/9]' : ''">
      <img
        :src="image"
        :alt="`${project.name} screenshot`"
        loading="lazy"
        class="absolute inset-0 h-full w-full object-cover object-top transition-transform duration-500 group-hover:scale-[1.02]"
      >
    </div>
    <div class="flex flex-1 flex-col gap-2 p-5">
      <p class="eyebrow text-ink-3">{{ project.years }} · {{ project.status }}</p>
      <p class="font-display text-xl font-semibold leading-snug">{{ project.name }}</p>
      <p class="text-[15px] text-ink-2">{{ project.tagline }}</p>
      <span class="mt-auto pt-2 text-sm font-semibold text-accent group-hover:underline">Read the case study</span>
    </div>
  </NuxtLink>
</template>
