<script setup lang="ts">
import { NAV, SITE_NAME } from "~/data/site";
const open = ref(false);
const route = useRoute();
watch(() => route.path, () => (open.value = false));
</script>

<template>
  <header class="dark-zone bg-dark-bg text-dark-ink">
    <div class="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
      <NuxtLink to="/" class="font-display text-lg font-semibold tracking-tight">{{ SITE_NAME }}</NuxtLink>
      <nav class="hidden gap-7 text-[15px] md:flex" aria-label="Primary">
        <NuxtLink
          v-for="item in NAV"
          :key="item.to"
          :to="item.to"
          class="text-dark-ink-2 transition-colors hover:text-dark-ink"
          active-class="text-mint!"
          >{{ item.label }}</NuxtLink
        >
      </nav>
      <button
        class="md:hidden rounded px-2 py-1 text-sm text-dark-ink-2"
        :aria-expanded="open"
        aria-controls="mobile-nav"
        @click="open = !open"
      >
        {{ open ? "Close" : "Menu" }}
      </button>
    </div>
    <nav v-show="open" id="mobile-nav" class="border-t border-dark-line px-5 pb-4 md:hidden" aria-label="Mobile">
      <NuxtLink
        v-for="item in NAV"
        :key="item.to"
        :to="item.to"
        class="block py-3 text-dark-ink-2"
        active-class="text-mint!"
        >{{ item.label }}</NuxtLink
      >
    </nav>
  </header>
</template>
