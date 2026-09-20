<script setup lang="ts">
import { useAuth } from "@/composables/useAuth";
import { BRAND_NAME } from "@/seo/site";

import { ref } from "vue";

const { signIn, completeMfa, needsMfa, busy, error } = useAuth();
const code = ref("");
</script>

<template>
  <div class="flex min-h-dvh flex-col items-center justify-center px-6 text-center">
    <p class="mb-2 text-sm tracking-wide text-accent">{{ BRAND_NAME }}</p>
    <h1 class="mb-8 text-2xl font-medium">Your family, in one place</h1>
    <template v-if="needsMfa">
      <p class="mb-3 text-sm text-muted">Enter the code from your authenticator app.</p>
      <input v-model="code" inputmode="numeric" autocomplete="one-time-code" placeholder="6-digit code" class="mb-3 h-12 w-56 rounded-xl border border-line bg-panel px-3.5 text-center outline-none focus:border-accent" />
      <button type="button" class="rounded-full bg-accent px-6 py-3 font-medium text-ink disabled:opacity-50" :disabled="busy || code.trim().length < 6" @click="completeMfa(code)">
        {{ busy ? "Checking" : "Continue" }}
      </button>
    </template>
    <button
      v-else
      type="button"
      class="rounded-full bg-accent px-6 py-3 font-medium text-ink disabled:opacity-50"
      :disabled="busy"
      @click="signIn"
    >
      {{ busy ? "Signing in" : "Sign in with Google" }}
    </button>
    <p class="mt-10 text-xs text-muted"><RouterLink to="/legal/terms">Terms</RouterLink> · <RouterLink to="/legal/privacy">Privacy</RouterLink></p>
    <p v-if="error" class="mt-4 text-sm text-danger">{{ error }}</p>
  </div>
</template>
