<script setup lang="ts">
import { useAuth } from "@/composables/useAuth";
import AppShell from "@/components/AppShell.vue";

const { ready, isMember } = useAuth();
</script>

<template>
  <div v-if="!ready" class="flex min-h-dvh items-center justify-center text-muted">Loading</div>
  <AppShell v-else-if="isMember">
    <RouterView />
  </AppShell>
  <RouterView v-else />
</template>
