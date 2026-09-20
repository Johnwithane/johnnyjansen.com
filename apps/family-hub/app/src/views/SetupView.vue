<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from "vue";
import { useRouter } from "vue-router";
import { useAuth } from "@/composables/useAuth";
import { useSuggestionAppliers } from "@/composables/useSuggestionAppliers";
import { CATEGORY_LABELS, type Category } from "@/data/categories";
import type { Account, Bill, Household, PersonColour, Suggestion, UserProfile, WithId } from "@/firebase/interfaces";
import { subscribeBills } from "@/firebase/services/billsService";
import { addChild, createInvite, googleConnectStart, setSetupDone, subscribeHousehold, subscribeProfile } from "@/firebase/services/householdService";
import { setupScanInbox } from "@/firebase/services/intakeService";
import { createAccount, saveBudget, subscribeAccounts } from "@/firebase/services/moneyService";
import { subscribePending } from "@/firebase/services/suggestionsService";
import { monthlyCost } from "@/utils/bills";
import { money } from "@/utils/money";
import { planSetup, type SetupStepId } from "@/utils/setupPlan";
import ColourPicker from "@/components/ColourPicker.vue";

// The wizard (PLAN.md 4.19). planSetup decides which steps show for whom;
// every step is skippable and the whole thing resumable (Today shows
// "Finish setup" until setSetupDone). "What we found" is the suggestions
// queue with a nicer face: the same appliers as Review, so a tick is
// rule-gated exactly like a button press.

const router = useRouter();
const { hid, uid, isMfa } = useAuth();
const h = hid.value ?? "";
const me = uid.value ?? "";
const household = ref<Household | null>(null);
const profile = ref<UserProfile | null>(null);
const pending = ref<WithId<Suggestion>[]>([]);
const accounts = ref<WithId<Account>[]>([]);
const bills = ref<WithId<Bill>[]>([]);
const stops: (() => void)[] = [];
onMounted(() => {
  stops.push(subscribeHousehold(h, (x) => (household.value = x)));
  stops.push(subscribeProfile(me, (p) => (profile.value = p)));
  stops.push(subscribePending(h, me, (s) => (pending.value = s)));
  if (isMfa.value) {
    stops.push(subscribeAccounts(h, me, (a) => (accounts.value = a)));
    stops.push(subscribeBills(h, me, (b) => (bills.value = b)));
  }
});
onUnmounted(() => stops.forEach((s) => s()));

const steps = computed(() => planSetup({ role: "adult", founder: household.value?.createdBy === me, googleConnected: !!profile.value?.google?.connected }));
const stepId = ref<SetupStepId>("people");
const index = computed(() => Math.max(0, steps.value.findIndex((s) => s.id === stepId.value)));
// If the plan changes under us (Google just connected), stay on a real step.
watch(steps, (list) => {
  if (list.length && !list.some((s) => s.id === stepId.value)) stepId.value = list[0].id;
});
function next() {
  const list = steps.value;
  stepId.value = list[Math.min(index.value + 1, list.length - 1)]?.id ?? "done";
}
const note = ref("");
const busy = ref(false);

const kids = computed(() => Object.values(household.value?.members ?? {}).filter((m) => m.role === "child"));
const adults = computed(() => Object.values(household.value?.members ?? {}).filter((m) => m.role === "adult"));

// People
const inviteEmail = ref("");
const inviteName = ref("");
const inviteColour = ref<PersonColour>("#7fd0ff");
const inviteLink = ref("");
const childName = ref("");
const childBirth = ref("");
const childColour = ref<PersonColour>("#f5c56b");

async function invite() {
  if (!navigator.onLine) return (note.value = "You need a connection to invite.");
  busy.value = true;
  try {
    inviteLink.value = (await createInvite({ email: inviteEmail.value.trim(), name: inviteName.value.trim(), colour: inviteColour.value })).link;
  } catch (e) {
    note.value = e instanceof Error ? e.message.replace(/^.*?:\s*/, "") : "Could not create the invite";
  } finally {
    busy.value = false;
  }
}
async function share() {
  try {
    if (navigator.share) await navigator.share({ title: "Join our household", url: inviteLink.value });
    else {
      await navigator.clipboard.writeText(inviteLink.value);
      note.value = "Link copied.";
    }
  } catch {
    /* dismissed */
  }
}
async function saveChild() {
  if (!navigator.onLine) return (note.value = "You need a connection for this.");
  busy.value = true;
  try {
    await addChild({ name: childName.value.trim(), birthDate: childBirth.value, colour: childColour.value });
    childName.value = "";
    childBirth.value = "";
  } catch (e) {
    note.value = e instanceof Error ? e.message.replace(/^.*?:\s*/, "") : "Could not add the child";
  } finally {
    busy.value = false;
  }
}

// Google
async function connectGoogle() {
  if (!navigator.onLine) return (note.value = "You need a connection for this.");
  busy.value = true;
  try {
    sessionStorage.setItem("setup-step", "found");
    window.location.assign((await googleConnectStart()).url);
  } catch (e) {
    note.value = e instanceof Error ? e.message.replace(/^.*?:\s*/, "") : "Google is not configured yet";
    busy.value = false;
  }
}

// What we found
const { canApply, whyNot, accept, dismiss } = useSuggestionAppliers();
const scanned = ref(false);
async function scan() {
  if (!navigator.onLine) return (note.value = "You need a connection to scan.");
  busy.value = true;
  note.value = "";
  try {
    const r = await setupScanInbox();
    scanned.value = true;
    if (r.skipped) note.value = "Connect Google first.";
    else note.value = r.proposed ? `Found ${r.proposed} thing${r.proposed === 1 ? "" : "s"} in ${r.scanned} emails. Tick what is real.` : `Read ${r.scanned} emails, nothing new to propose.`;
  } catch (e) {
    note.value = e instanceof Error ? e.message.replace(/^.*?:\s*/, "") : "The scan did not finish.";
  } finally {
    busy.value = false;
  }
}
const KIND_LABEL: Record<string, string> = { bill: "Bills and subscriptions", account: "Accounts", event: "Coming up", contact: "Clients and contacts", task: "To do", document: "Documents", transaction: "Transactions", recipe: "Recipes", pantry: "Pantry" };
const groups = computed(() => {
  const by = new Map<string, WithId<Suggestion>[]>();
  for (const s of pending.value) by.set(s.kind, [...(by.get(s.kind) ?? []), s]);
  return ["bill", "account", "event", "contact", "task", "document"].filter((k) => by.has(k)).map((k) => ({ kind: k, label: KIND_LABEL[k], items: by.get(k) ?? [] }));
});
function acceptAll(items: WithId<Suggestion>[]) {
  for (const s of items) if (canApply(s)) accept(s, (m) => (note.value = m));
}

// Money starter
const newAccount = ref("");
function addAccount() {
  const name = newAccount.value.trim();
  if (!name) return;
  createAccount(h, me, { name, type: /credit|card|visa|amex|mastercard/i.test(name) ? "credit" : /saving/i.test(name) ? "savings" : "chequing", visibility: "household" }).catch((e) => (note.value = e instanceof Error ? e.message : "Could not add"));
  newAccount.value = "";
}
const ENVELOPES: Category[] = ["groceries", "eating_out", "kids", "car", "fun"];
const envelope = ref<Record<string, string>>({});
/** A default budget proposed from the bills: what recurs is known; the rest is left for you to size. */
const fromBills = computed(() => {
  const out: Record<string, number> = {};
  for (const b of bills.value) {
    if (b.cadence === "once") continue;
    out[b.category] = Math.round(((out[b.category] ?? 0) + monthlyCost(b)) * 100) / 100;
  }
  return out;
});
function saveStarter() {
  const env: Record<string, number> = { ...fromBills.value };
  for (const c of ENVELOPES) {
    const n = Number(envelope.value[c]);
    if (n > 0) env[c] = Math.round(n * 100) / 100;
  }
  if (Object.keys(env).length) saveBudget(h, env).catch(() => undefined);
  next();
}

async function finish() {
  setSetupDone(me, true).catch(() => undefined);
  router.replace({ name: "today" });
}

onMounted(() => {
  const resume = sessionStorage.getItem("setup-step");
  if (resume) {
    sessionStorage.removeItem("setup-step");
    stepId.value = resume as SetupStepId;
  } else if (household.value?.createdBy && household.value.createdBy !== me) stepId.value = "google";
});
watch(household, (hh) => {
  if (hh && hh.createdBy !== me && stepId.value === "people") stepId.value = "google";
});
</script>

<template>
  <div class="mx-auto max-w-md pt-2">
    <p class="mb-1 text-sm text-muted">Step {{ index + 1 }} of {{ steps.length || 1 }}</p>
    <div class="mb-6 flex gap-1.5">
      <span v-for="(s, i) in steps" :key="s.id" class="h-0.5 flex-1 rounded" :class="i <= index ? 'bg-accent' : 'bg-line'"></span>
    </div>
    <p v-if="note" class="mb-4 text-sm text-muted">{{ note }}</p>

    <template v-if="stepId === 'people'">
      <h1 class="mb-6 text-2xl font-medium">Who lives here</h1>
      <section class="mb-6">
        <h2 class="mb-1 text-xs font-medium uppercase tracking-widest text-accent">Adults</h2>
        <ul>
          <li v-for="a in adults" :key="a.name" class="border-b border-line py-2.5"><span class="mr-2 inline-block h-2 w-2 rounded-full align-middle" :style="{ background: a.colour }"></span>{{ a.name }}</li>
        </ul>
        <form v-if="!inviteLink" class="mt-3 flex flex-col gap-2" @submit.prevent="invite">
          <input v-model="inviteName" type="text" required placeholder="Their first name" class="h-12 rounded-xl border border-line bg-panel px-3.5 outline-none focus:border-accent" />
          <input v-model="inviteEmail" type="email" required placeholder="Their Gmail" class="h-12 rounded-xl border border-line bg-panel px-3.5 outline-none focus:border-accent" />
          <ColourPicker v-model="inviteColour" />
          <button type="submit" class="h-12 rounded-full border border-line font-medium disabled:opacity-50" :disabled="busy">Invite</button>
        </form>
        <div v-else class="mt-3 flex flex-col gap-2">
          <p class="text-sm text-muted">Invite ready. Send it and they can start while you finish.</p>
          <button type="button" class="h-11 rounded-full border border-line text-sm" @click="share">Share the link</button>
        </div>
      </section>
      <section class="mb-8">
        <h2 class="mb-1 text-xs font-medium uppercase tracking-widest text-accent">Kids</h2>
        <ul>
          <li v-for="k in kids" :key="k.name" class="border-b border-line py-2.5"><span class="mr-2 inline-block h-2 w-2 rounded-full align-middle" :style="{ background: k.colour }"></span>{{ k.name }}<span class="text-muted"> · {{ k.birthDate }}</span></li>
        </ul>
        <form class="mt-3 flex flex-col gap-2" @submit.prevent="saveChild">
          <input v-model="childName" type="text" placeholder="Name" class="h-12 rounded-xl border border-line bg-panel px-3.5 outline-none focus:border-accent" />
          <input v-model="childBirth" type="date" class="h-12 rounded-xl border border-line bg-panel px-3.5 text-muted outline-none focus:border-accent" />
          <ColourPicker v-model="childColour" />
          <button type="submit" class="h-12 rounded-full border border-line font-medium disabled:opacity-50" :disabled="busy || !childName.trim() || !childBirth">Add child</button>
        </form>
        <p class="mt-2 text-xs text-muted">They can sign in later. Nothing else about them is stored.</p>
      </section>
      <button type="button" class="h-12 w-full rounded-full bg-accent font-medium text-ink" @click="next">Continue</button>
    </template>

    <template v-else-if="stepId === 'google'">
      <h1 class="mb-3 text-2xl font-medium">Connect Google</h1>
      <p class="mb-8 text-muted">Calendar read, mail read, and send for your digest. Your grant is encrypted and only you can disconnect it.</p>
      <p v-if="profile?.google?.connected" class="mb-4 text-sm text-accent">Connected as {{ profile.google.email }}.</p>
      <button v-if="!profile?.google?.connected" type="button" class="h-12 w-full rounded-full bg-accent font-medium text-ink disabled:opacity-50" :disabled="busy" @click="connectGoogle">Connect Google</button>
      <button type="button" class="mt-3 h-12 w-full rounded-full border border-line" @click="next">{{ profile?.google?.connected ? "Continue" : "Skip for now" }}</button>
    </template>

    <template v-else-if="stepId === 'found'">
      <h1 class="mb-3 text-2xl font-medium">What we found</h1>
      <p class="mb-5 text-muted">Ninety days of senders and subjects, nothing else. Tick what is real; nothing is saved until you do.</p>
      <button v-if="!scanned && !pending.length" type="button" class="mb-6 h-12 w-full rounded-full bg-accent font-medium text-ink disabled:opacity-50" :disabled="busy" @click="scan">{{ busy ? "Reading your inbox" : "Scan the last 90 days" }}</button>
      <p v-if="!isMfa && pending.some((s) => ['bill', 'account'].includes(s.kind))" class="mb-4 rounded-xl border border-line bg-panel p-3 text-sm">
        Bills and accounts need your second factor. <RouterLink to="/security?next=/setup" class="text-accent">Turn it on</RouterLink>, sign in again, and they will be waiting on Review.
      </p>
      <section v-for="g in groups" :key="g.kind" class="mb-6">
        <div class="mb-1 flex items-baseline justify-between">
          <h2 class="text-xs font-medium uppercase tracking-widest text-accent">{{ g.label }}</h2>
          <button v-if="g.items.some((s) => canApply(s))" type="button" class="text-xs text-muted" @click="acceptAll(g.items)">Keep all</button>
        </div>
        <ul>
          <li v-for="s in g.items" :key="s.id" class="flex items-center justify-between gap-3 border-b border-line py-2.5 text-sm">
            <span class="min-w-0">{{ s.summary }}<span v-if="!canApply(s)" class="block text-xs text-muted">{{ whyNot(s) }}</span></span>
            <span class="flex shrink-0 gap-1.5">
              <button v-if="canApply(s)" type="button" class="h-9 rounded-full bg-accent px-3 text-xs font-medium text-ink" @click="accept(s, (m) => (note = m))">Keep</button>
              <button type="button" class="h-9 rounded-full border border-line px-3 text-xs" @click="dismiss(s)">No</button>
            </span>
          </li>
        </ul>
      </section>
      <p v-if="scanned && !pending.length" class="mb-6 text-sm text-muted">Nothing left to decide.</p>
      <button type="button" class="h-12 w-full rounded-full border border-line" @click="next">{{ pending.length ? "Decide the rest later" : "Continue" }}</button>
    </template>

    <template v-else-if="stepId === 'money'">
      <h1 class="mb-3 text-2xl font-medium">Money starter</h1>
      <template v-if="!isMfa">
        <p class="mb-6 text-muted">Money needs your second factor. Turn it on at Household → Security whenever you are ready; the Money tab works from then on.</p>
        <button type="button" class="h-12 w-full rounded-full border border-line" @click="next">Skip for now</button>
      </template>
      <template v-else>
        <section class="mb-6">
          <h2 class="mb-1 text-xs font-medium uppercase tracking-widest text-accent">Accounts</h2>
          <ul>
            <li v-for="a in accounts" :key="a.id" class="border-b border-line py-2.5 text-sm">{{ a.name }}<span class="text-muted"> · {{ a.type }}</span></li>
          </ul>
          <form class="mt-2 flex gap-2" @submit.prevent="addAccount">
            <input v-model="newAccount" type="text" placeholder="Add one by name (TD chequing)" class="h-12 min-w-0 flex-1 rounded-xl border border-line bg-panel px-3.5 outline-none focus:border-accent" />
            <button type="submit" class="h-12 rounded-full border border-line px-4 text-sm" :disabled="!newAccount.trim()">Add</button>
          </form>
        </section>
        <section class="mb-8">
          <h2 class="mb-1 text-xs font-medium uppercase tracking-widest text-accent">Monthly envelopes</h2>
          <ul>
            <li v-for="(v, c) in fromBills" :key="c" class="flex items-center justify-between border-b border-line py-2.5 text-sm"><span>{{ CATEGORY_LABELS[c as Category] ?? c }}<span class="text-muted"> · from your bills</span></span><span class="tabular-nums">{{ money(v) }}</span></li>
            <li v-for="c in ENVELOPES" :key="c" class="flex items-center justify-between gap-3 border-b border-line py-2 text-sm">
              <span>{{ CATEGORY_LABELS[c] }}</span>
              <input v-model="envelope[c]" type="number" inputmode="decimal" min="0" step="10" placeholder="0" class="h-10 w-28 rounded-lg border border-line bg-panel px-3 text-right tabular-nums outline-none focus:border-accent" />
            </li>
          </ul>
          <p class="mt-2 text-xs text-muted">Leave blank what you do not want to track. Change it any time on Money.</p>
        </section>
        <button type="button" class="h-12 w-full rounded-full bg-accent font-medium text-ink" @click="saveStarter">Continue</button>
      </template>
    </template>

    <template v-else>
      <h1 class="mb-3 text-2xl font-medium">Today is ready</h1>
      <ul class="mb-8 text-muted">
        <li class="border-b border-line py-2.5">{{ adults.length }} adult{{ adults.length === 1 ? "" : "s" }}, {{ kids.length }} kid{{ kids.length === 1 ? "" : "s" }}</li>
        <li class="border-b border-line py-2.5">Google {{ profile?.google?.connected ? "connected" : "not connected, from the Household screen any time" }}</li>
        <li v-if="pending.length" class="border-b border-line py-2.5">{{ pending.length }} thing{{ pending.length === 1 ? "" : "s" }} waiting on Review</li>
        <li class="border-b border-line py-2.5">Digest at 6:30 every morning</li>
      </ul>
      <button type="button" class="h-12 w-full rounded-full bg-accent font-medium text-ink" @click="finish">Open Today</button>
    </template>
  </div>
</template>
