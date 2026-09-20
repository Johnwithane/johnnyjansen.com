<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from "vue";
import { useAuth } from "@/composables/useAuth";
import type { Agenda, EventKind, Household, HouseholdEvent, Snapshot, WithId } from "@/firebase/interfaces";
import { createEvent, deleteEvent, subscribeEvents } from "@/firebase/services/eventsService";
import { subscribeAgenda, subscribeHousehold } from "@/firebase/services/householdService";
import { subscribeToday } from "@/firebase/services/snapshotService";
import { addDays, clockOf, dayKeyOf, dayOf, longDay, stripLabel } from "@/utils/localTime";
import { timeOf } from "@/utils/format";
import PlanTabs from "@/components/PlanTabs.vue";

// A week strip and one day's list. Three sources merge: the household's
// own calendar (all seven days), my Google events (today only, from my
// snapshot), and the family's Google events (today only, from the agenda
// slices). Google beyond today arrives with the weekly pull in a later phase.

const { hid, uid } = useAuth();
const h = hid.value ?? "";
const me = uid.value ?? "";
const today = dayKeyOf(new Date());
const selected = ref(today);
const days = computed(() => Array.from({ length: 7 }, (_, i) => addDays(today, i)));

const events = ref<WithId<HouseholdEvent>[]>([]);
const snap = ref<Snapshot | null>(null);
const agenda = ref<Agenda[]>([]);
const household = ref<Household | null>(null);
const stops: (() => void)[] = [];
onMounted(() => {
  stops.push(subscribeEvents(h, today, addDays(today, 7), (items) => (events.value = items)));
  stops.push(subscribeToday(me, (s) => (snap.value = s)));
  stops.push(subscribeAgenda(h, (a) => (agenda.value = a)));
  stops.push(subscribeHousehold(h, (x) => (household.value = x)));
});
onUnmounted(() => stops.forEach((s) => s()));

interface Row {
  id: string;
  when: string;
  allDay: boolean;
  title: string;
  sub: string;
  colour: string | null;
  own: boolean;
  sortKey: string;
}

const members = computed(() => household.value?.members ?? {});
function memberColour(id: string): string | null {
  return members.value[id]?.colour ?? null;
}

const rows = computed<Row[]>(() => {
  const out: Row[] = [];
  for (const e of events.value.filter((e) => dayOf(e.start) === selected.value)) {
    const who = e.memberIds.map((id) => members.value[id]?.name).filter(Boolean).join(", ");
    out.push({ id: e.id, when: e.allDay ? "All day" : clockOf(e.start), allDay: e.allDay, title: e.title, sub: [e.kind !== "event" ? e.kind : "", who, e.location].filter(Boolean).join(" · "), colour: memberColour(e.memberIds[0] ?? ""), own: true, sortKey: e.start });
  }
  if (selected.value === today) {
    for (const g of snap.value?.events ?? []) {
      out.push({ id: `g-${g.id}`, when: g.allDay ? "All day" : timeOf(g.start), allDay: g.allDay, title: g.title, sub: ["My calendar", g.location].filter(Boolean).join(" · "), colour: members.value[me]?.colour ?? null, own: false, sortKey: g.allDay ? g.start : new Date(g.start).toISOString() });
    }
    for (const a of agenda.value.filter((a) => a.uid !== me && a.dayKey === today)) {
      for (const g of a.events) out.push({ id: `a-${a.uid}-${g.id}`, when: g.allDay ? "All day" : timeOf(g.start), allDay: g.allDay, title: g.title, sub: [a.name, g.location].filter(Boolean).join(" · "), colour: a.colour, own: false, sortKey: g.allDay ? g.start : new Date(g.start).toISOString() });
    }
  }
  return out.sort((a, b) => (a.allDay !== b.allDay ? (a.allDay ? -1 : 1) : a.when.localeCompare(b.when)));
});

const countByDay = computed(() => {
  const m: Record<string, number> = {};
  for (const e of events.value) m[dayOf(e.start)] = (m[dayOf(e.start)] ?? 0) + 1;
  return m;
});

// Add
const adding = ref(false);
const title = ref("");
const date = ref(today);
const time = ref("");
const kind = ref<EventKind>("event");
const who = ref<string[]>([]);
const note = ref("");
watch(selected, (d) => (date.value = d));

function toggleWho(id: string) {
  who.value = who.value.includes(id) ? who.value.filter((x) => x !== id) : [...who.value, id];
}
function save() {
  const t = title.value.trim();
  if (!t || !date.value) return;
  const allDay = !time.value;
  createEvent(h, me, { title: t, start: allDay ? date.value : `${date.value}T${time.value}`, allDay, kind: kind.value, memberIds: who.value }).catch((e) => (note.value = e instanceof Error ? e.message : "Could not save"));
  title.value = "";
  time.value = "";
  who.value = [];
  kind.value = "event";
  adding.value = false;
}
function remove(id: string) {
  deleteEvent(h, id).catch(() => (note.value = "Could not delete"));
}
</script>

<template>
  <div>
    <PlanTabs active="calendar" />
    <div class="mb-4 grid grid-cols-7 gap-1 text-center">
      <button
        v-for="d in days"
        :key="d"
        type="button"
        class="flex flex-col items-center gap-1 rounded-lg py-2"
        :class="d === selected ? 'bg-accent text-ink' : ''"
        @click="selected = d"
      >
        <span class="text-[11px]" :class="d === selected ? '' : 'text-muted'">{{ stripLabel(d).dow }}</span>
        <span class="text-base">{{ stripLabel(d).day }}</span>
        <span class="h-1 w-1 rounded-full" :class="countByDay[d] ? (d === selected ? 'bg-ink' : 'bg-accent') : 'bg-transparent'"></span>
      </button>
    </div>

    <h2 class="mb-2 text-xs font-medium uppercase tracking-widest text-accent">{{ longDay(selected) }}</h2>
    <p v-if="note" class="mb-2 text-sm text-danger">{{ note }}</p>
    <p v-if="rows.length === 0" class="text-muted">Nothing on.</p>
    <ul v-else>
      <li v-for="r in rows" :key="r.id" class="flex items-start gap-3 border-b border-line py-2.5">
        <span class="w-20 shrink-0 text-sm text-muted">{{ r.when }}</span>
        <span class="min-w-0 flex-1">
          <span v-if="r.colour" class="mr-2 inline-block h-2 w-2 rounded-full align-middle" :style="{ background: r.colour }"></span>{{ r.title }}
          <span v-if="r.sub" class="block text-xs text-muted">{{ r.sub }}</span>
        </span>
        <button v-if="r.own" type="button" class="px-1 text-muted" aria-label="Delete" @click="remove(r.id)">×</button>
      </li>
    </ul>
    <p v-if="selected !== today" class="mt-3 text-xs text-muted">Google events show for today. The week view of Google comes with the weekly pull.</p>

    <button v-if="!adding" type="button" class="mt-6 h-12 w-full rounded-full bg-accent font-medium text-ink" @click="adding = true">Add event</button>
    <form v-else class="mt-6 flex flex-col gap-2" @submit.prevent="save">
      <input v-model="title" type="text" required placeholder="What" class="h-12 rounded-xl border border-line bg-panel px-3.5 outline-none focus:border-accent" />
      <div class="flex gap-2">
        <input v-model="date" type="date" required class="h-12 flex-1 rounded-xl border border-line bg-panel px-3.5 text-muted outline-none focus:border-accent" />
        <input v-model="time" type="time" class="h-12 flex-1 rounded-xl border border-line bg-panel px-3.5 text-muted outline-none focus:border-accent" />
      </div>
      <div class="flex flex-wrap gap-2">
        <button v-for="k in (['event', 'bill', 'renewal', 'trip', 'school'] as EventKind[])" :key="k" type="button" class="rounded-full border border-line px-3 py-1.5 text-sm" :class="kind === k ? 'bg-accent text-ink' : 'text-muted'" @click="kind = k">{{ k }}</button>
      </div>
      <div class="flex flex-wrap gap-2">
        <button v-for="(m, id) in members" :key="id" type="button" class="rounded-full border border-line px-3 py-1.5 text-sm" :class="who.includes(String(id)) ? 'border-fg' : 'text-muted'" @click="toggleWho(String(id))">
          <span class="mr-1.5 inline-block h-2 w-2 rounded-full align-middle" :style="{ background: m.colour }"></span>{{ m.name }}
        </button>
      </div>
      <div class="flex gap-2">
        <button type="button" class="h-12 flex-1 rounded-full border border-line" @click="adding = false">Cancel</button>
        <button type="submit" class="h-12 flex-1 rounded-full bg-accent font-medium text-ink disabled:opacity-50" :disabled="!title.trim()">Save</button>
      </div>
      <p class="text-xs text-muted">No time means all day. Saved offline too.</p>
    </form>
  </div>
</template>
