<script setup lang="ts">
const props = defineProps<{ slug: string }>();
const { unlock } = useLabAuth();
const password = ref("");
const state = ref<"idle" | "checking" | "wrong">("idle");

async function submit() {
  state.value = "checking";
  const ok = await unlock(props.slug, password.value);
  state.value = ok ? "idle" : "wrong";
  if (!ok) password.value = "";
}
</script>

<template>
  <form class="max-w-sm rounded-lg border border-line bg-surface p-6" @submit.prevent="submit">
    <p class="font-display text-lg font-semibold">This one is private</p>
    <p class="mt-1 text-sm text-ink-2">Enter the word that came with the link.</p>
    <label class="mt-4 grid gap-1 text-sm">
      <span class="sr-only">Password</span>
      <input
        v-model="password"
        type="password"
        autocomplete="off"
        required
        class="rounded-md border border-line bg-bg px-3 py-2 text-base"
        placeholder="Password"
      >
    </label>
    <button type="submit" :disabled="state === 'checking'" class="mt-3 rounded-md bg-dark-bg px-4 py-2 text-sm font-semibold text-mint disabled:opacity-60">
      {{ state === "checking" ? "Checking" : "Open" }}
    </button>
    <p v-if="state === 'wrong'" class="mt-3 text-sm text-ink-2">That did not work. Check the word and try again.</p>
  </form>
</template>
