<script setup lang="ts">
import { useAuth } from "@/composables/useAuth";

const { signIn, busy, error } = useAuth();
</script>

<template>
  <div class="flex min-h-dvh flex-col items-center justify-center px-6 text-center">
    <p class="mb-2 text-sm tracking-wide text-accent">johnnyjansen.com</p>
    <h1 class="mb-8 text-2xl font-medium">Portal</h1>
    <button
      type="button"
      class="rounded-full bg-accent px-6 py-3 font-medium text-ink disabled:opacity-50"
      :disabled="busy"
      @click="signIn"
    >
      {{ busy ? "Signing in" : "Sign in with Google" }}
    </button>
    <p v-if="error" class="mt-4 text-sm text-danger">{{ error }}</p>
  </div>
</template>
