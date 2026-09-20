<script setup lang="ts">
import { useAuth } from "@/composables/useAuth";

const { ready } = useAuth();
</script>

<template>
  <div v-if="!ready" class="flex min-h-dvh items-center justify-center text-muted">Loading</div>
  <RouterView v-else />
</template>
