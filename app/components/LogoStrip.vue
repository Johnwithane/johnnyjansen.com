<script setup lang="ts">
import { clientLogos } from "~/data/film";
</script>

<template>
  <ul class="flex flex-wrap items-center gap-x-8 gap-y-4" aria-label="Past clients and employers">
    <li v-for="logo in clientLogos" :key="logo.name">
      <img :src="logo.src" :alt="logo.name" loading="lazy" class="h-7 w-auto opacity-80 md:h-8" >
    </li>
  </ul>
</template>
