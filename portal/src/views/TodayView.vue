<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from "vue";
import type { Agenda, Household, Snapshot, UserProfile } from "@/firebase/interfaces";
import { subscribeAgenda, subscribeHousehold, subscribeProfile } from "@/firebase/services/householdService";
import { birthdayLine, upcomingBirthdays } from "@/utils/birthdays";
import { refreshToday, subscribeToday } from "@/firebase/services/snapshotService";
import { ago, senderName, timeOf } from "@/utils/format";
import { useAuth } from "@/composables/useAuth";

const { uid, hid } = useAuth();
const snap = ref<Snapshot | null>(null);
const agenda = ref<Agenda[]>([]);
const household = ref<Household | null>(null);
const profile = ref<UserProfile | null>(null);
const stops: (() => void)[] = [];
const refreshing = ref(false);
const note = ref("");
let stop: (() => void) | null = null;

onMounted(() => {
  if (uid.value) stop = subscribeToday(uid.value, (s) => (snap.value = s));
  if (uid.value) stops.push(subscribeProfile(uid.value, (p) => (profile.value = p)));
  if (hid.value) {
    stops.push(subscribeAgenda(hid.value, (a) => (agenda.value = a)));
    stops.push(subscribeHousehold(hid.value, (h) => (household.value = h)));
  }
});
onUnmounted(() => {
  stop?.();
  stops.forEach((s) => s());
});

/** Other members' family events for today, flattened with the person's colour. */
const familyEvents = computed(() =>
  agenda.value
    .filter((a) => a.uid !== uid.value && a.dayKey === snap.value?.dayKey)
    .flatMap((a) => a.events.map((e) => ({ ...e, who: a.name, colour: a.colour })))
    .sort((a, b) => (a.allDay !== b.allDay ? (a.allDay ? -1 : 1) : a.start.localeCompare(b.start))),
);
const birthdays = computed(() => upcomingBirthdays(household.value?.members ?? {}, new Date(), 14));
const setupPending = computed(() => !!profile.value && profile.value.setup?.done !== true);

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

    <RouterLink v-if="setupPending" to="/setup" class="mb-6 block border-b border-line py-3 text-sm">Finish setup <span class="text-accent">→</span></RouterLink>

    <section v-if="birthdays.length" class="mb-8">
      <h2 class="mb-2 text-xs font-medium uppercase tracking-widest text-accent">Coming up</h2>
      <p v-for="b in birthdays" :key="b.name + b.on" class="border-b border-line py-2 text-sm">
        <span class="mr-2 inline-block h-2 w-2 rounded-full align-middle" :style="{ background: b.colour }"></span>{{ birthdayLine(b) }}
      </p>
    </section>

    <section v-if="familyEvents.length" class="mb-8">
      <h2 class="mb-2 text-xs font-medium uppercase tracking-widest text-accent">Family</h2>
      <ul>
        <li v-for="e in familyEvents" :key="e.who + e.id" class="flex gap-3 border-b border-line py-2">
          <span class="w-24 shrink-0 text-sm text-muted">{{ e.allDay ? "All day" : timeOf(e.start) }}</span>
          <span class="min-w-0"><span class="mr-2 inline-block h-2 w-2 rounded-full align-middle" :style="{ background: e.colour }"></span>{{ e.title }}<span class="block text-xs text-muted">{{ e.who }}<span v-if="e.location"> · {{ e.location }}</span></span></span>
        </li>
      </ul>
    </section>

    <p v-if="!snap" class="text-muted">Nothing pulled yet. Tap Refresh.</p>

    <template v-else>
      <section class="mb-8">
        <h2 class="mb-2 text-xs font-medium uppercase tracking-widest text-accent">My calendar</h2>
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
            {{ t.title }}<span v-if="t.due" class="text-muted"> · due {{ t.due }}</span><span v-if="t.visibility === 'private'" class="text-muted"> · private</span>
          </li>
        </ul>
        <RouterLink to="/tasks" class="mt-3 inline-block text-sm text-accent">Manage tasks</RouterLink>
      </section>
    </template>
  </div>
</template>
