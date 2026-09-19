<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from "vue";
import type { Snapshot } from "@/firebase/interfaces";
import { refreshToday, subscribeToday } from "@/firebase/services/snapshotService";
import { ago, senderName, timeOf } from "@/utils/format";

const snap = ref<Snapshot | null>(null);
const refreshing = ref(false);
const note = ref("");
let stop: (() => void) | null = null;

onMounted(() => {
  stop = subscribeToday((s) => (snap.value = s));
});
onUnmounted(() => stop?.());

const updated = computed(() => ago(snap.value?.generatedAt?.toDate?.() ?? null));
const googleState = computed(() => snap.value?.sources.google ?? "unconfigured");

async function refresh() {
  if (!navigator.onLine) {
    note.value = "Offline. Showing the last pull.";
    return;
  }
  refreshing.value = true;
  note.value = "";
  try {
    await refreshToday();
  } catch {
    note.value = "Refresh failed.";
  } finally {
    refreshing.value = false;
  }
}
</script>

<template>
  <div>
    <div class="mb-4 flex items-center justify-between">
      <h1 class="text-xl font-medium">Today</h1>
      <button
        type="button"
        class="rounded-full border border-line px-3 py-1 text-sm text-muted disabled:opacity-50"
        :disabled="refreshing"
        @click="refresh"
      >
        {{ refreshing ? "Pulling" : "Refresh" }}
      </button>
    </div>
    <p v-if="note" class="mb-3 text-sm text-muted">{{ note }}</p>
    <p v-if="snap" class="mb-6 text-xs text-muted">Updated {{ updated }}</p>

    <p v-if="!snap" class="text-muted">Nothing pulled yet. Tap Refresh.</p>

    <template v-else>
      <section class="mb-8">
        <h2 class="mb-2 text-xs font-medium uppercase tracking-widest text-accent">Calendar</h2>
        <p v-if="googleState !== 'ok'" class="text-muted">
          {{ googleState === "error" ? "Google failed on the last pull." : "Google not connected yet." }}
        </p>
        <p v-else-if="snap.events.length === 0" class="text-muted">Nothing on the calendar.</p>
        <ul v-else>
          <li v-for="e in snap.events" :key="e.id" class="flex gap-3 border-b border-line py-2">
            <span class="w-24 shrink-0 text-sm text-muted">
              {{ e.allDay ? "All day" : timeOf(e.start) }}
            </span>
            <span class="min-w-0">
              <a v-if="e.link" :href="e.link" target="_blank" rel="noopener">{{ e.title }}</a>
              <span v-else>{{ e.title }}</span>
              <span v-if="e.location" class="block text-xs text-muted">{{ e.location }}</span>
            </span>
          </li>
        </ul>
      </section>

      <section class="mb-8">
        <h2 class="mb-2 text-xs font-medium uppercase tracking-widest text-accent">
          Inbox<span v-if="googleState === 'ok'"> · {{ snap.unreadTotal }} unread</span>
        </h2>
        <p v-if="googleState !== 'ok'" class="text-muted">Google not connected yet.</p>
        <p v-else-if="snap.unread.length === 0" class="text-muted">Inbox zero.</p>
        <ul v-else>
          <li v-for="m in snap.unread" :key="m.id" class="border-b border-line py-2">
            <p class="text-sm"><span class="font-medium">{{ senderName(m.from) }}</span>: {{ m.subject }}</p>
            <p v-if="m.snippet" class="truncate text-xs text-muted">{{ m.snippet }}</p>
          </li>
        </ul>
      </section>

      <section>
        <h2 class="mb-2 text-xs font-medium uppercase tracking-widest text-accent">
          Tasks · {{ snap.tasks.length }} open
        </h2>
        <p v-if="snap.tasks.length === 0" class="text-muted">No open tasks.</p>
        <ul v-else>
          <li v-for="t in snap.tasks" :key="t.id" class="border-b border-line py-2 text-sm">
            {{ t.title }}<span v-if="t.due" class="text-muted"> · due {{ t.due }}</span>
          </li>
        </ul>
        <RouterLink to="/tasks" class="mt-3 inline-block text-sm text-accent">Manage tasks</RouterLink>
      </section>
    </template>
  </div>
</template>
