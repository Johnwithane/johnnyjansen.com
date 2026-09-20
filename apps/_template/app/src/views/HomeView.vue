<script setup lang="ts">
import { ref } from "vue";
import { httpsCallable } from "firebase/functions";
import { functions } from "@/firebase/config";
import { useAuth } from "@/composables/useAuth";
import { BRAND_NAME } from "@/seo/site";

const { user, logOut } = useAuth();
const reply = ref("");

async function ping() {
  if (!navigator.onLine) return (reply.value = "Offline.");
  const fn = httpsCallable<{ text: string }, { echo: string; at: string }>(functions, "ping");
  const r = await fn({ text: "hello" });
  reply.value = `${r.data.echo} at ${r.data.at}`;
}
</script>

<template>
  <div class="mx-auto max-w-2xl px-4 pt-6">
    <header class="mb-8 flex items-center justify-between">
      <span class="text-sm text-accent">{{ BRAND_NAME }}</span>
      <button type="button" class="text-sm text-muted" @click="logOut">Sign out</button>
    </header>
    <h1 class="mb-2 text-xl font-medium">Hello {{ user?.displayName }}</h1>
    <p class="mb-6 text-muted">The template works. Replace this screen.</p>
    <button type="button" class="h-11 rounded-full border border-line px-5 text-sm" @click="ping">Ping the functions</button>
    <p v-if="reply" class="mt-3 text-sm text-muted">{{ reply }}</p>
  </div>
</template>
