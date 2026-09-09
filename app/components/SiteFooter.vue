<script setup lang="ts">
import { SITE_NAME, PERSON, SOCIALS } from "~/data/site";
const year = new Date().getFullYear();
</script>

<template>
  <footer class="dark-zone bg-dark-bg text-dark-ink-2">
    <div class="mx-auto grid max-w-6xl gap-8 px-5 py-12 md:grid-cols-3">
      <div>
        <p class="font-display text-lg font-semibold text-dark-ink">{{ SITE_NAME }}</p>
        <p class="mt-1 max-w-xs text-sm">
          Fractional CTO and product builder. Kelowna, BC. Working across Canada and the US, on site or remote.
        </p>
      </div>
      <div class="text-sm">
        <p class="eyebrow mb-2 text-dark-ink-2">Contact</p>
        <a :href="`mailto:${PERSON.email}`" class="block hover:text-dark-ink">{{ PERSON.email }}</a>
        <NuxtLink to="/contact" class="mt-1 block text-mint">Book a 30 minute call</NuxtLink>
      </div>
      <div class="text-sm">
        <p class="eyebrow mb-2 text-dark-ink-2">Elsewhere</p>
        <ul class="space-y-1">
          <li v-for="s in SOCIALS" :key="s.href">
            <a :href="s.href" rel="me noopener" target="_blank" class="hover:text-dark-ink">{{ s.label }}</a>
          </li>
        </ul>
      </div>
    </div>
    <div class="border-t border-dark-line">
      <p class="mx-auto max-w-6xl px-5 py-4 font-mono text-xs">
        &copy; {{ year }} {{ SITE_NAME }}. Built with Nuxt, prerendered, no tracking beyond page views.
      </p>
    </div>
  </footer>
</template>
