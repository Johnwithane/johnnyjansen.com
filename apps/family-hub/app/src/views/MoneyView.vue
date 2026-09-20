<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from "vue";
import { useAuth } from "@/composables/useAuth";
import { CATEGORIES, CATEGORY_LABELS, type Category } from "@/data/categories";
import type { Account, Budget, Transaction, WithId } from "@/firebase/interfaces";
import { deleteTransaction, saveBudget, subscribeAccounts, subscribeBudget, subscribeTransactions } from "@/firebase/services/moneyService";
import { addDays, dayKeyOf } from "@/utils/localTime";
import { money, monthLabel, monthOf, spendByCategory, totalSpend } from "@/utils/money";

const { hid, uid, isAdult } = useAuth();
const h = hid.value ?? "";
const me = uid.value ?? "";
const today = dayKeyOf(new Date());
const ym = monthOf(today);

const txs = ref<WithId<Transaction>[]>([]);
const accounts = ref<WithId<Account>[]>([]);
const budget = ref<Budget | null>(null);
const stops: (() => void)[] = [];
onMounted(() => {
  stops.push(subscribeTransactions(h, me, addDays(today, -62), (t) => (txs.value = t)));
  stops.push(subscribeAccounts(h, me, (a) => (accounts.value = a)));
  stops.push(subscribeBudget(h, (b) => (budget.value = b)));
});
onUnmounted(() => stops.forEach((s) => s()));

const byCat = computed(() => spendByCategory(txs.value, ym));
const spent = computed(() => totalSpend(byCat.value));
const envelopes = computed(() => budget.value?.envelopes ?? {});
const budgetTotal = computed(() => Math.round(Object.values(envelopes.value).reduce((a, b) => a + b, 0) * 100) / 100);
const dayOfMonth = Number(today.slice(8, 10));
const rows = computed(() =>
  (CATEGORIES as readonly Category[])
    .filter((c) => c !== "income" && c !== "transfer")
    .map((c) => ({ c, label: CATEGORY_LABELS[c], spent: byCat.value[c] ?? 0, cap: envelopes.value[c] ?? 0 }))
    .filter((r) => r.spent > 0 || r.cap > 0)
    .sort((a, b) => b.spent - a.spent),
);
const recent = computed(() => txs.value.slice(0, 8));
const accountName = (id: string | null) => accounts.value.find((a) => a.id === id)?.name ?? "";

// Envelope editing
const editing = ref(false);
const draft = ref<Record<string, string>>({});
function startEdit() {
  draft.value = Object.fromEntries((CATEGORIES as readonly Category[]).filter((c) => c !== "income" && c !== "transfer").map((c) => [c, envelopes.value[c] ? String(envelopes.value[c]) : ""]));
  editing.value = true;
}
function saveEnvelopes() {
  const out: Record<string, number> = {};
  for (const [k, v] of Object.entries(draft.value)) {
    const n = Number(v);
    if (n > 0) out[k] = Math.round(n * 100) / 100;
  }
  saveBudget(h, out).catch(() => undefined);
  editing.value = false;
}
function remove(id: string) {
  deleteTransaction(h, id).catch(() => undefined);
}
</script>

<template>
  <div>
    <div class="mb-4 flex items-baseline justify-between">
      <h1 class="text-xl font-medium">Money</h1>
      <span class="text-sm text-muted">{{ monthLabel(ym) }}</span>
    </div>

    <p class="text-3xl font-medium tabular-nums">{{ money(spent) }}</p>
    <p class="mb-1 text-sm text-muted">
      <template v-if="budgetTotal">of {{ money(budgetTotal) }} budget, {{ dayOfMonth }} days in</template>
      <template v-else>spent, {{ dayOfMonth }} days in. No budget set.</template>
    </p>
    <div v-if="budgetTotal" class="mb-6 mt-2 h-0.5 rounded bg-line"><div class="h-0.5 rounded bg-accent" :style="{ width: `${Math.min(100, (spent / budgetTotal) * 100)}%` }"></div></div>

    <section class="mb-8">
      <div class="mb-2 flex items-baseline justify-between">
        <h2 class="text-xs font-medium uppercase tracking-widest text-accent">Envelopes</h2>
        <button v-if="isAdult && !editing" type="button" class="text-xs text-muted" @click="startEdit">{{ budgetTotal ? "Edit" : "Set budget" }}</button>
      </div>
      <template v-if="editing">
        <ul>
          <li v-for="(_v, c) in draft" :key="c" class="flex items-center justify-between gap-3 border-b border-line py-2">
            <span class="text-sm">{{ CATEGORY_LABELS[c as Category] }}</span>
            <input v-model="draft[c]" type="number" inputmode="decimal" min="0" step="10" placeholder="0" class="h-10 w-28 rounded-lg border border-line bg-panel px-3 text-right tabular-nums outline-none focus:border-accent" />
          </li>
        </ul>
        <div class="mt-3 flex gap-2">
          <button type="button" class="h-11 flex-1 rounded-full border border-line text-sm" @click="editing = false">Cancel</button>
          <button type="button" class="h-11 flex-1 rounded-full bg-accent text-sm font-medium text-ink" @click="saveEnvelopes">Save</button>
        </div>
      </template>
      <p v-else-if="rows.length === 0" class="text-muted">Nothing spent yet this month.</p>
      <ul v-else>
        <li v-for="r in rows" :key="r.c" class="flex items-baseline justify-between border-b border-line py-2.5">
          <span>{{ r.label }}</span>
          <span class="text-sm tabular-nums" :class="r.cap && r.spent > r.cap ? 'text-danger' : 'text-muted'">{{ money(r.spent) }}<span v-if="r.cap"> / {{ money(r.cap) }}</span></span>
        </li>
      </ul>
    </section>

    <section class="mb-8">
      <h2 class="mb-2 text-xs font-medium uppercase tracking-widest text-accent">Recent</h2>
      <p v-if="recent.length === 0" class="text-muted">No transactions yet. Snap a receipt.</p>
      <ul v-else>
        <li v-for="t in recent" :key="t.id" class="flex items-baseline justify-between gap-3 border-b border-line py-2.5">
          <div class="min-w-0">
            <p class="truncate">{{ t.merchant || CATEGORY_LABELS[t.category as Category] || t.category }}</p>
            <p class="text-xs text-muted">{{ CATEGORY_LABELS[t.category as Category] ?? t.category }} · {{ t.date.slice(5) }}<span v-if="accountName(t.accountId)"> · {{ accountName(t.accountId) }}</span><span v-if="t.visibility === 'private'"> · private</span><span v-if="t.taxCategory !== 'none'"> · tax</span></p>
          </div>
          <span class="flex items-center gap-2">
            <span class="tabular-nums" :class="t.direction === 'income' ? 'text-accent' : ''">{{ t.direction === "income" ? "+" : "" }}{{ money(t.amount) }}</span>
            <button v-if="isAdult" type="button" class="px-1 text-muted" aria-label="Delete" @click="remove(t.id)">×</button>
          </span>
        </li>
      </ul>
    </section>

    <section class="mb-8">
      <h2 class="mb-2 text-xs font-medium uppercase tracking-widest text-accent">Accounts</h2>
      <p v-if="accounts.length === 0" class="text-sm text-muted">None yet. Add them under Accounts.</p>
      <ul v-else>
        <li v-for="a in accounts" :key="a.id" class="flex items-baseline justify-between border-b border-line py-2 text-sm">
          <span>{{ a.name }}<span class="text-muted"> · {{ a.type }}</span></span>
          <span class="tabular-nums text-muted">{{ a.balance != null ? money(a.balance, a.currency) : "" }}</span>
        </li>
      </ul>
    </section>

    <div class="flex gap-2">
      <RouterLink to="/money/add" class="flex h-12 flex-1 items-center justify-center rounded-full border border-line">Add by hand</RouterLink>
      <RouterLink to="/money/receipt" class="flex h-12 flex-1 items-center justify-center rounded-full bg-accent font-medium text-ink">Snap receipt</RouterLink>
    </div>
  </div>
</template>
