<script setup lang="ts">
import { OFFER } from "~/data/site";
</script>

<template>
  <section class="rounded-lg border border-line bg-surface p-6 md:p-8">
    <div class="grid gap-6 md:grid-cols-[1fr_auto] md:items-start">
      <div class="prose-jj">
        <p class="eyebrow text-ink-3">Start here</p>
        <h2 class="mt-1 text-2xl font-semibold">{{ OFFER.name }}</h2>
        <p class="mt-2">{{ OFFER.summary }}</p>
        <ul>
          <li v-for="item in OFFER.includes" :key="item">{{ item }}</li>
        </ul>
      </div>
      <div class="flex flex-col items-start gap-3 md:items-end md:text-right">
        <p class="font-display text-3xl font-semibold">{{ OFFER.price }}</p>
        <p class="text-sm text-ink-3">{{ OFFER.duration }}, fixed price</p>
        <NuxtLink
          to="/contact"
          class="rounded-md bg-dark-bg px-5 py-3 text-sm font-semibold text-mint transition-opacity hover:opacity-90"
          >Book a 30 minute call</NuxtLink
        >
      </div>
    </div>
  </section>
</template>
