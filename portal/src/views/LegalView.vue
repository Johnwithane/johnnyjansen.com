<script setup lang="ts">
import { computed } from "vue";
import { useRoute } from "vue-router";
import { PRIVACY } from "@/legal/privacy";
import { TERMS } from "@/legal/terms";
import { LEGAL_UPDATED } from "@/legal/version";

const route = useRoute();
const text = computed(() => (route.params.doc === "privacy" ? PRIVACY : TERMS));

/** Tiny Markdown: # and ## headings, paragraphs. Enough for our own text. */
const blocks = computed(() =>
  text.value
    .trim()
    .split(/\n{2,}/)
    .map((b) => (b.startsWith("## ") ? { h: 2, t: b.slice(3) } : b.startsWith("# ") ? { h: 1, t: b.slice(2) } : { h: 0, t: b })),
);
</script>

<template>
  <div class="mx-auto max-w-md px-5 pt-14 pb-16">
    <template v-for="(b, i) in blocks" :key="i">
      <h1 v-if="b.h === 1" class="mb-1 text-2xl font-medium">{{ b.t }}</h1>
      <h2 v-else-if="b.h === 2" class="mt-6 mb-1 text-xs font-medium uppercase tracking-widest text-accent">{{ b.t }}</h2>
      <p v-else class="text-sm leading-relaxed text-muted">{{ b.t }}</p>
    </template>
    <p class="mt-8 text-xs text-muted">Updated {{ LEGAL_UPDATED }}</p>
    <p class="mt-2 text-sm"><RouterLink to="/legal/terms" class="text-accent">Terms</RouterLink> · <RouterLink to="/legal/privacy" class="text-accent">Privacy</RouterLink></p>
  </div>
</template>
