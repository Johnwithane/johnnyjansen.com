<script setup lang="ts">
import type { NuxtError } from "#app";
defineProps<{ error: NuxtError }>();
useHead({ title: "Not found", meta: [{ name: "robots", content: "noindex" }] });
</script>

<template>
  <div class="flex min-h-screen flex-col bg-bg">
    <SiteHeader />
    <main class="mx-auto flex max-w-3xl flex-1 flex-col justify-center px-5 py-20">
      <p class="eyebrow text-ink-3">{{ error.statusCode }}</p>
      <h1 class="mt-1 text-4xl font-bold">That page is not here</h1>
      <p class="mt-4 text-ink-2">The old site was one page of anchors, so a lot of links moved. The work is at <NuxtLink to="/work" class="text-accent">/work</NuxtLink>.</p>
      <NuxtLink to="/" class="mt-6 text-sm font-semibold text-accent" @click="clearError({ redirect: '/' })">Home</NuxtLink>
    </main>
    <SiteFooter />
  </div>
</template>
