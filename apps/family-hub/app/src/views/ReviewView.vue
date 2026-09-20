<script setup lang="ts">
import { onMounted, onUnmounted, ref } from "vue";
import { useAuth } from "@/composables/useAuth";
import type { Suggestion, WithId } from "@/firebase/interfaces";
import { createEvent } from "@/firebase/services/eventsService";
import { resolveSuggestion, subscribePending } from "@/firebase/services/suggestionsService";
import { createTask } from "@/firebase/services/tasksService";
import { ago } from "@/utils/format";

// The suggestions queue (PLAN.md section 5). Accept applies the payload
// through the SAME service a hand-made write uses, so the rules gate it
// exactly the same way; then the suggestion is marked accepted. Kinds this
// phase cannot hold yet can only be dismissed, and say so.

const { hid, uid } = useAuth();
const h = hid.value ?? "";
const me = uid.value ?? "";
const items = ref<WithId<Suggestion>[]>([]);
const note = ref("");
let stop: (() => void) | null = null;
onMounted(() => {
  stop = subscribePending(h, me, (i) => (items.value = i));
});
onUnmounted(() => stop?.());

const APPLIERS: Partial<Record<Suggestion["kind"], (p: Record<string, unknown>) => Promise<unknown>>> = {
  event: (p) =>
    createEvent(h, me, {
      title: String(p.title ?? "Event"),
      start: String(p.start ?? ""),
      end: p.end ? String(p.end) : undefined,
      allDay: !String(p.start ?? "").includes("T"),
      kind: (["event", "bill", "birthday", "renewal", "trip", "school"].includes(String(p.kind)) ? String(p.kind) : "event") as "event",
      memberIds: Array.isArray(p.memberIds) ? (p.memberIds as string[]) : [],
      location: p.location ? String(p.location) : undefined,
      notes: p.notes ? String(p.notes) : undefined,
      source: "intake",
    }),
  task: (p) => createTask(h, me, { title: String(p.title ?? "Task"), visibility: p.visibility === "private" ? "private" : "household", due: p.due ? String(p.due) : null, notes: p.notes ? String(p.notes) : undefined }),
};

function canApply(s: Suggestion): boolean {
  return !!APPLIERS[s.kind];
}

function accept(s: WithId<Suggestion>) {
  const apply = APPLIERS[s.kind];
  if (!apply) return;
  apply(s.payload).catch((e) => (note.value = e instanceof Error ? e.message : "Could not apply"));
  resolveSuggestion(h, s.id, "accepted", me).catch(() => undefined);
}
function dismiss(s: WithId<Suggestion>) {
  resolveSuggestion(h, s.id, "dismissed", me).catch(() => undefined);
}
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
          <button v-if="canApply(s)" type="button" class="h-10 rounded-full bg-accent px-4 text-sm font-medium text-ink" @click="accept(s)">Accept</button>
          <span v-else class="self-center text-xs text-muted">Lands in a later phase</span>
          <button type="button" class="h-10 rounded-full border border-line px-4 text-sm" @click="dismiss(s)">Dismiss</button>
        </div>
      </li>
    </ul>
  </div>
</template>
