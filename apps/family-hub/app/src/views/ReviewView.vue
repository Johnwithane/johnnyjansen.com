<script setup lang="ts">
import { onMounted, onUnmounted, ref } from "vue";
import { useAuth } from "@/composables/useAuth";
import { useSuggestionAppliers } from "@/composables/useSuggestionAppliers";
import type { Suggestion, WithId } from "@/firebase/interfaces";
import { subscribePending } from "@/firebase/services/suggestionsService";
import { ago } from "@/utils/format";

// The suggestions queue (PLAN.md section 5). Accept applies through the
// normal services (useSuggestionAppliers), so the rules gate it exactly like
// a button press. Kinds this phase cannot hold yet can only be dismissed.

const { hid, uid } = useAuth();
const { canApply, whyNot, accept, dismiss } = useSuggestionAppliers();
const items = ref<WithId<Suggestion>[]>([]);
const note = ref("");
let stop: (() => void) | null = null;
onMounted(() => {
  stop = subscribePending(hid.value ?? "", uid.value ?? "", (i) => (items.value = i));
});
onUnmounted(() => stop?.());

const SOURCE: Record<Suggestion["source"], string> = { gemini: "Gemini", laptop: "Laptop", rule: "Rule", scan: "Inbox scan", forward: "Forwarded" };
</script>

<template>
  <div>
    <h1 class="mb-1 text-xl font-medium">Review</h1>
    <p class="mb-6 text-xs text-muted">Machines propose. Nothing is saved until you accept.</p>
    <p v-if="note" class="mb-3 text-sm text-danger">{{ note }}</p>
    <p v-if="items.length === 0" class="text-muted">Nothing waiting.</p>
    <ul>
      <li v-for="s in items" :key="s.id" class="flex flex-col gap-2.5 border-b border-line py-3.5">
        <div class="flex justify-between gap-3">
          <span>{{ s.summary }}</span>
          <span class="shrink-0 text-xs text-muted">{{ SOURCE[s.source] }}</span>
        </div>
        <span class="text-xs text-muted">{{ s.kind }}<span v-if="s.visibility === 'private'"> · only you</span> · {{ ago(s.createdAt?.toDate?.()) }}</span>
        <div class="flex gap-2">
          <button v-if="canApply(s)" type="button" class="h-10 rounded-full bg-accent px-4 text-sm font-medium text-ink" @click="accept(s, (m) => (note = m))">Accept</button>
          <span v-else class="self-center text-xs text-muted">{{ whyNot(s) }}</span>
          <button type="button" class="h-10 rounded-full border border-line px-4 text-sm" @click="dismiss(s)">Dismiss</button>
        </div>
      </li>
    </ul>
  </div>
</template>
