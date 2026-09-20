<script setup lang="ts">
import { useAuth } from "@/composables/useAuth";
import { BRAND_NAME } from "@/seo/site";

const { signIn, error } = useAuth();
</script>

<template>
  <div class="flex min-h-dvh flex-col items-center justify-center px-6 text-center">
    <p class="mb-2 text-sm tracking-wide text-accent">{{ BRAND_NAME }}</p>
    <h1 class="mb-8 text-2xl font-medium">Sign in</h1>
    <button type="button" class="rounded-full bg-accent px-6 py-3 font-medium text-ink" @click="signIn">Sign in with Google</button>
    <p v-if="error" class="mt-4 text-sm text-danger">{{ error }}</p>
  </div>
</template>
