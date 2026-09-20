<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from "vue";
import { useAuth } from "@/composables/useAuth";
import type { UserProfile } from "@/firebase/interfaces";
import { subscribeProfile } from "@/firebase/services/householdService";
import { SENDER_RE, scanInbox, setIntakeSenders } from "@/firebase/services/intakeService";
import { ago } from "@/utils/format";

// Intake (PLAN.md 4.20): senders you approve get read once a day, and what
// they contain (events, forms, money owed, a new contact, a document) shows
// up on Review. Nothing is saved until you accept it there. Bodies are never
// stored. Only you can approve senders for your own inbox.

const { uid, isAdult } = useAuth();
const me = uid.value ?? "";
const profile = ref<UserProfile | null>(null);
let stop: (() => void) | null = null;
onMounted(() => (stop = subscribeProfile(me, (p) => (profile.value = p))));
onUnmounted(() => stop?.());

const senders = computed(() => profile.value?.intake?.senders ?? []);
const lastScan = computed(() => profile.value?.intake?.lastScanAt?.toDate?.() ?? null);
const connected = computed(() => !!profile.value?.google?.connected);

const draft = ref("");
const note = ref("");
const busy = ref(false);

function add() {
  const v = draft.value.trim().toLowerCase();
  if (!SENDER_RE.test(v)) return (note.value = "An address, or a domain like sd23.bc.ca.");
  if (senders.value.includes(v)) return;
  setIntakeSenders(me, [...senders.value, v]).catch(() => (note.value = "Could not save."));
  draft.value = "";
}
function remove(s: string) {
  setIntakeSenders(
    me,
    senders.value.filter((x) => x !== s),
  ).catch(() => (note.value = "Could not save."));
}
async function scan() {
  if (!navigator.onLine) return (note.value = "You need a connection to scan.");
  busy.value = true;
  note.value = "";
  try {
    const r = await scanInbox();
    if (r.skipped === "google_unconfigured") note.value = "Connect Google on the Household screen first.";
    else if (r.skipped === "no_senders") note.value = "Add a sender first.";
    else if (r.skipped === "cap_reached") note.value = `Read ${r.scanned}, proposed ${r.proposed}. Daily AI limit reached; the rest runs tomorrow.`;
    else note.value = r.scanned ? `Read ${r.scanned} new email${r.scanned === 1 ? "" : "s"}, proposed ${r.proposed}. See Review.` : "Nothing new from these senders.";
  } catch (e) {
    note.value = e instanceof Error ? e.message.replace(/^.*?:\s*/, "") : "Scan failed.";
  } finally {
    busy.value = false;
  }
}
</script>

<template>
  <div>
    <RouterLink to="/household" class="text-sm text-muted">‹ More</RouterLink>
    <h1 class="mb-1 mt-2 text-xl font-medium">Intake</h1>
    <p class="mb-5 text-xs text-muted">Approve senders. Their emails become things to review, once a day.</p>
    <p v-if="!isAdult" class="text-sm text-muted">Adults only.</p>
    <template v-else>
      <p v-if="note" class="mb-3 text-sm text-muted">{{ note }}</p>

      <form class="mb-3 flex gap-2" @submit.prevent="add">
        <input v-model="draft" type="text" inputmode="email" autocapitalize="off" placeholder="school@sd23.bc.ca or sd23.bc.ca" class="h-12 min-w-0 flex-1 rounded-xl border border-line bg-panel px-3.5 outline-none focus:border-accent" />
        <button type="submit" class="h-12 rounded-full border border-line px-4 text-sm" :disabled="draft.trim().length < 3">Add</button>
      </form>
      <p v-if="!senders.length" class="py-3 text-sm text-muted">No senders yet. The school, the daycare, the swim club, the dentist.</p>
      <ul class="mb-6">
        <li v-for="s in senders" :key="s" class="flex items-center justify-between gap-3 border-b border-line py-3 text-sm">
          <span class="break-all">{{ s }}</span>
          <button type="button" class="shrink-0 text-xs text-muted" @click="remove(s)">Remove</button>
        </li>
      </ul>

      <button type="button" class="h-12 w-full rounded-full bg-accent font-medium text-ink disabled:opacity-50" :disabled="busy || !senders.length || !connected" @click="scan">{{ busy ? "Reading" : "Scan now" }}</button>
      <p class="mt-2 text-center text-xs text-muted">
        <template v-if="!connected">Connect Google first (Household).</template>
        <template v-else-if="lastScan">Last scan {{ ago(lastScan) }}. Runs daily at 6am.</template>
        <template v-else>Runs daily at 6am once a sender is approved.</template>
      </p>
      <p class="mt-6 text-xs text-muted">Only new mail from these senders is read, once, and the text is never stored. What it proposes shows on Review for the whole household.</p>
    </template>
  </div>
</template>
