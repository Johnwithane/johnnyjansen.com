<script setup lang="ts">
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { signInAnonymously } from "firebase/auth";

// The feedback loop, built into every prototype: an idea, a bug or a
// question filed from the page it is about, with the path attached.
const props = defineProps<{ slug: string }>();
const fb = useFirebase();
const route = useRoute();
const open = ref(false);
const kind = ref<"idea" | "bug" | "question">("idea");
const text = ref("");
const state = ref<"idle" | "sending" | "sent" | "error">("idle");

async function send() {
  if (!fb) return;
  state.value = "sending";
  try {
    if (!fb.auth.currentUser) await signInAnonymously(fb.auth);
    await addDoc(collection(fb.db, `labs/${props.slug}/feedback`), {
      kind: kind.value,
      text: text.value.trim(),
      path: route.fullPath,
      uid: fb.auth.currentUser?.uid,
      createdAt: serverTimestamp(),
    });
    state.value = "sent";
    text.value = "";
  } catch {
    state.value = "error";
  }
}
</script>

<template>
  <div class="fixed bottom-4 right-4 z-40">
    <button
      v-if="!open"
      type="button"
      class="rounded-full bg-dark-bg px-4 py-2 text-sm font-semibold text-mint shadow-lg"
      @click="open = true; state = 'idle'"
    >
      Send feedback
    </button>
    <form v-else class="w-80 rounded-lg border border-line bg-surface p-4 shadow-xl" @submit.prevent="send">
      <div class="flex items-center justify-between">
        <p class="font-display font-semibold">Feedback</p>
        <button type="button" class="text-sm text-ink-3" @click="open = false">Close</button>
      </div>
      <div class="mt-3 flex gap-2 text-xs">
        <label v-for="k in ['idea', 'bug', 'question'] as const" :key="k" class="cursor-pointer">
          <input v-model="kind" type="radio" :value="k" class="sr-only">
          <span class="rounded-full border px-3 py-1" :class="kind === k ? 'border-accent text-accent' : 'border-line text-ink-2'">{{ k }}</span>
        </label>
      </div>
      <textarea v-model="text" rows="4" required maxlength="2000" class="mt-3 w-full rounded-md border border-line bg-bg px-3 py-2 text-sm" placeholder="What happened, or what would help?" />
      <button type="submit" :disabled="state === 'sending'" class="mt-3 w-full rounded-md bg-dark-bg py-2 text-sm font-semibold text-mint disabled:opacity-60">
        {{ state === "sending" ? "Sending" : "Send" }}
      </button>
      <p v-if="state === 'sent'" class="mt-2 text-xs text-ink-2">Got it. Thank you.</p>
      <p v-if="state === 'error'" class="mt-2 text-xs text-ink-2">That did not send. Try again in a moment.</p>
    </form>
  </div>
</template>
