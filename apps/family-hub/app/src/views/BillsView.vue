<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from "vue";
import { useAuth } from "@/composables/useAuth";
import { CATEGORIES, CATEGORY_LABELS, type Category } from "@/data/categories";
import type { Bill, BillCadence, Household, Transaction, WithId } from "@/firebase/interfaces";
import { createBill, deleteBill, updateBill } from "@/firebase/services/billsService";
import { subscribeBills } from "@/firebase/services/billsService";
import { subscribeHousehold } from "@/firebase/services/householdService";
import { subscribeTransactions } from "@/firebase/services/moneyService";
import { detectCreep, dueLabel, loadSplit, monthlyCost, yearlyCost } from "@/utils/bills";
import { addDays, dayKeyOf } from "@/utils/localTime";
import { money } from "@/utils/money";

// Bills and subscriptions (PLAN.md 4.5) with the load ledger field (4.23):
// every recurring item names the adult who carries it. Sorted by what it
// costs a year, so the subscriptions audit is the screen itself. Creep flags
// come from recorded transactions and are display only.

const { hid, uid } = useAuth();
const h = hid.value ?? "";
const me = uid.value ?? "";
const today = dayKeyOf(new Date());

const bills = ref<WithId<Bill>[]>([]);
const txs = ref<WithId<Transaction>[]>([]);
const household = ref<Household | null>(null);
const stops: (() => void)[] = [];
onMounted(() => {
  stops.push(subscribeBills(h, me, (b) => (bills.value = b)));
  stops.push(subscribeTransactions(h, me, addDays(today, -120), (t) => (txs.value = t)));
  stops.push(subscribeHousehold(h, (x) => (household.value = x)));
});
onUnmounted(() => stops.forEach((s) => s()));

const adults = computed(() =>
  Object.values(household.value?.members ?? {})
    .filter((m) => m.role === "adult" && m.uid)
    .map((m) => ({ uid: m.uid as string, name: m.name, colour: m.colour })),
);
const nameOf = (u: string | null) => adults.value.find((a) => a.uid === u)?.name ?? "";
const colourOf = (u: string | null) => adults.value.find((a) => a.uid === u)?.colour ?? "#222";

const recurring = computed(() => bills.value.filter((b) => b.cadence !== "once").sort((a, b) => yearlyCost(b) - yearlyCost(a)));
const oneOffs = computed(() => bills.value.filter((b) => b.cadence === "once"));
const dueSoon = computed(() => bills.value.filter((b) => b.nextDue <= addDays(today, 7)).sort((a, b) => a.nextDue.localeCompare(b.nextDue)));
const yearTotal = computed(() => Math.round(recurring.value.reduce((s, b) => s + yearlyCost(b), 0) * 100) / 100);
const monthTotal = computed(() => Math.round(recurring.value.reduce((s, b) => s + monthlyCost(b), 0) * 100) / 100);
const flags = computed(() => detectCreep(bills.value, txs.value, today));
const flagFor = (id: string) => flags.value.find((f) => f.billId === id);
const split = computed(() => loadSplit(bills.value));

// Add / edit
const CADENCES: { v: BillCadence; label: string }[] = [
  { v: "monthly", label: "Monthly" },
  { v: "yearly", label: "Yearly" },
  { v: "weekly", label: "Weekly" },
  { v: "quarterly", label: "Quarterly" },
  { v: "once", label: "One time" },
];
const editing = ref<string | "new" | null>(null);
const name = ref("");
const amount = ref("");
const cadence = ref<BillCadence>("monthly");
const nextDue = ref(today);
const category = ref<Category>("subscriptions");
const responsibleUid = ref("");
const autopay = ref(false);
const priv = ref(false);
const note = ref("");

function startNew() {
  editing.value = "new";
  name.value = "";
  amount.value = "";
  cadence.value = "monthly";
  nextDue.value = today;
  category.value = "subscriptions";
  responsibleUid.value = me;
  autopay.value = false;
  priv.value = false;
}
function startEdit(b: WithId<Bill>) {
  editing.value = b.id;
  name.value = b.name;
  amount.value = String(b.amount);
  cadence.value = b.cadence;
  nextDue.value = b.nextDue;
  category.value = (CATEGORIES as readonly string[]).includes(b.category) ? (b.category as Category) : "subscriptions";
  responsibleUid.value = b.responsibleUid ?? "";
  autopay.value = b.autopay;
  priv.value = b.visibility === "private";
}
const canSave = computed(() => name.value.trim() && Number(amount.value) >= 0 && /^\d{4}-\d{2}-\d{2}$/.test(nextDue.value));
function save() {
  if (!canSave.value || !editing.value) return;
  const patch = { name: name.value.trim(), amount: Number(amount.value), cadence: cadence.value, nextDue: nextDue.value, category: category.value, responsibleUid: responsibleUid.value || null, autopay: autopay.value };
  const p = editing.value === "new" ? createBill(h, me, { ...patch, visibility: priv.value ? "private" : "household" }) : updateBill(h, editing.value, patch);
  p.catch((e) => (note.value = e instanceof Error ? e.message.replace(/^.*?:\s*/, "") : "Could not save"));
  editing.value = null;
}
function remove(id: string) {
  deleteBill(h, id).catch(() => undefined);
  editing.value = null;
}
</script>

<template>
  <div>
    <RouterLink to="/money" class="text-sm text-muted">‹ Money</RouterLink>
    <div class="mb-1 mt-2 flex items-baseline justify-between">
      <h1 class="text-xl font-medium">Bills</h1>
      <button v-if="editing !== 'new'" type="button" class="text-sm text-accent" @click="startNew">Add</button>
    </div>
    <p class="mb-5 text-xs text-muted">{{ recurring.length ? `${money(monthTotal)} a month, ${money(yearTotal)} a year, sorted by cost.` : "Everything recurring, sorted by cost." }}</p>
    <p v-if="note" class="mb-3 text-sm text-danger">{{ note }}</p>

    <form v-if="editing" class="mb-6 flex flex-col gap-2 rounded-xl border border-line bg-panel p-3" @submit.prevent="save">
      <input v-model="name" type="text" required placeholder="Name (Netflix, Rent, Hydro)" class="h-12 rounded-xl border border-line bg-ink px-3.5 outline-none focus:border-accent" />
      <div class="flex gap-2">
        <input v-model="amount" type="number" inputmode="decimal" min="0" step="0.01" required placeholder="Amount" class="h-12 w-1/2 rounded-xl border border-line bg-ink px-3.5 outline-none focus:border-accent" />
        <select v-model="cadence" class="h-12 w-1/2 rounded-xl border border-line bg-ink px-3 outline-none focus:border-accent">
          <option v-for="c in CADENCES" :key="c.v" :value="c.v">{{ c.label }}</option>
        </select>
      </div>
      <label class="flex flex-col gap-1"><span class="text-xs text-muted">Next due</span><input v-model="nextDue" type="date" class="h-12 rounded-xl border border-line bg-ink px-3.5 outline-none focus:border-accent" /></label>
      <div class="flex gap-2">
        <select v-model="category" class="h-12 w-1/2 rounded-xl border border-line bg-ink px-3 outline-none focus:border-accent">
          <option v-for="c in CATEGORIES.filter((x) => x !== 'income' && x !== 'transfer')" :key="c" :value="c">{{ CATEGORY_LABELS[c] }}</option>
        </select>
        <select v-model="responsibleUid" class="h-12 w-1/2 rounded-xl border border-line bg-ink px-3 outline-none focus:border-accent">
          <option value="">Nobody yet</option>
          <option v-for="a in adults" :key="a.uid" :value="a.uid">{{ a.name }} carries it</option>
        </select>
      </div>
      <div class="flex gap-4 text-sm">
        <label class="flex items-center gap-2"><input v-model="autopay" type="checkbox" class="h-5 w-5 accent-accent" /> Autopay</label>
        <label v-if="editing === 'new'" class="flex items-center gap-2"><input v-model="priv" type="checkbox" class="h-5 w-5 accent-accent" /> Only me</label>
      </div>
      <div class="mt-1 flex gap-2">
        <button type="submit" class="h-11 flex-1 rounded-full bg-accent text-sm font-medium text-ink disabled:opacity-50" :disabled="!canSave">Save</button>
        <button type="button" class="h-11 rounded-full border border-line px-4 text-sm" @click="editing = null">Cancel</button>
        <button v-if="editing !== 'new'" type="button" class="h-11 rounded-full border border-line px-4 text-sm text-danger" @click="remove(editing)">Delete</button>
      </div>
    </form>

    <section v-if="dueSoon.length" class="mb-8">
      <h2 class="mb-1 text-xs font-medium uppercase tracking-widest text-accent">Due this week</h2>
      <ul>
        <li v-for="b in dueSoon" :key="b.id" class="flex items-center justify-between gap-3 border-b border-line py-2.5 text-sm">
          <span><span class="mr-2 inline-block h-2 w-2 rounded-full align-middle" :style="{ background: colourOf(b.responsibleUid) }"></span>{{ b.name }}<span class="text-muted"> · {{ dueLabel(b.nextDue, today) }}</span></span>
          <span class="tabular-nums">{{ money(b.amount) }}</span>
        </li>
      </ul>
    </section>

    <section v-if="flags.length" class="mb-8">
      <h2 class="mb-1 text-xs font-medium uppercase tracking-widest text-accent">Worth a look</h2>
      <ul>
        <li v-for="f in flags" :key="f.billId" class="border-b border-line py-2.5 text-sm">
          <span>{{ bills.find((b) => b.id === f.billId)?.name }}</span>
          <span class="block text-xs text-muted">{{ f.detail }}</span>
        </li>
      </ul>
    </section>

    <section class="mb-8">
      <div class="mb-1 flex items-baseline justify-between">
        <h2 class="text-xs font-medium uppercase tracking-widest text-accent">Recurring</h2>
        <span v-if="adults.length" class="text-xs text-muted">
          <span v-for="a in adults" :key="a.uid" class="ml-2">{{ a.name }} {{ split.byUid[a.uid] ?? 0 }}</span><span v-if="split.unowned" class="ml-2">nobody {{ split.unowned }}</span>
        </span>
      </div>
      <p v-if="!recurring.length" class="py-3 text-sm text-muted">No bills yet. Add rent, utilities and subscriptions, or import a statement.</p>
      <ul>
        <li v-for="b in recurring" :key="b.id" class="border-b border-line">
          <button type="button" class="flex w-full items-center justify-between gap-3 py-3 text-left text-sm" @click="startEdit(b)">
            <span class="min-w-0">
              <span class="mr-2 inline-block h-2 w-2 rounded-full align-middle" :style="{ background: colourOf(b.responsibleUid) }"></span>{{ b.name }}<span v-if="flagFor(b.id)" class="ml-2 text-xs text-accent">{{ flagFor(b.id)?.kind === "up" ? "up" : "unused?" }}</span>
              <span class="block text-xs text-muted">{{ money(b.amount) }} {{ b.cadence }} · {{ dueLabel(b.nextDue, today) }}<span v-if="nameOf(b.responsibleUid)"> · {{ nameOf(b.responsibleUid) }}</span><span v-if="b.visibility === 'private'"> · only you</span></span>
            </span>
            <span class="shrink-0 tabular-nums text-muted">{{ money(yearlyCost(b)) }}<span class="text-xs">/yr</span></span>
          </button>
        </li>
      </ul>
    </section>

    <section v-if="oneOffs.length" class="mb-8">
      <h2 class="mb-1 text-xs font-medium uppercase tracking-widest text-accent">One time</h2>
      <ul>
        <li v-for="b in oneOffs" :key="b.id" class="border-b border-line">
          <button type="button" class="flex w-full items-center justify-between gap-3 py-3 text-left text-sm" @click="startEdit(b)">
            <span>{{ b.name }}<span class="block text-xs text-muted">{{ dueLabel(b.nextDue, today) }}<span v-if="nameOf(b.responsibleUid)"> · {{ nameOf(b.responsibleUid) }}</span></span></span>
            <span class="tabular-nums">{{ money(b.amount) }}</span>
          </button>
        </li>
      </ul>
    </section>
  </div>
</template>
