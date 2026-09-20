<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from "vue";
import { useRouter } from "vue-router";
import { useAuth } from "@/composables/useAuth";
import { CATEGORIES, CATEGORY_LABELS } from "@/data/categories";
import type { Account, Transaction, WithId } from "@/firebase/interfaces";
import { createTransaction, subscribeAccounts, subscribeTransactions } from "@/firebase/services/moneyService";
import { detectColumns, importKey, parseCsv, rowsToImport, type ImportRow } from "@/utils/csvImport";
import { addDays, dayKeyOf } from "@/utils/localTime";
import { money } from "@/utils/money";

// CSV statement import (PLAN.md 4.5). Parsed in the browser, previewed with
// a guessed category per line you can change, then written one transaction
// at a time through the normal service. Lines already recorded (same day,
// amount and merchant) are skipped, so importing twice is harmless.

const router = useRouter();
const { hid, uid } = useAuth();
const h = hid.value ?? "";
const me = uid.value ?? "";
const today = dayKeyOf(new Date());

const accounts = ref<WithId<Account>[]>([]);
const existing = ref<WithId<Transaction>[]>([]);
const stops: (() => void)[] = [];
onMounted(() => {
  stops.push(subscribeAccounts(h, me, (a) => (accounts.value = a)));
  stops.push(subscribeTransactions(h, me, addDays(today, -400), (t) => (existing.value = t)));
});
onUnmounted(() => stops.forEach((s) => s()));

const rows = ref<ImportRow[]>([]);
const skip = ref<Set<number>>(new Set());
const accountId = ref("");
const priv = ref(false);
const note = ref("");
const fileName = ref("");

async function pick(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (!file) return;
  note.value = "";
  fileName.value = file.name;
  const parsed = parseCsv(await file.text());
  const map = detectColumns(parsed);
  if (!map) {
    rows.value = [];
    note.value = "Could not find date, description and amount columns in that file.";
    return;
  }
  rows.value = rowsToImport(parsed, map);
  const seen = new Set(existing.value.map(importKey));
  skip.value = new Set(rows.value.map((r, i) => (seen.has(importKey(r)) ? i : -1)).filter((i) => i >= 0));
  if (!rows.value.length) note.value = "No transactions found in that file.";
}

const toImport = computed(() => rows.value.filter((_, i) => !skip.value.has(i)));
const total = computed(() => toImport.value.reduce((s, r) => s + (r.direction === "expense" ? r.amount : -r.amount), 0));
function toggle(i: number) {
  const s = new Set(skip.value);
  if (s.has(i)) s.delete(i);
  else s.add(i);
  skip.value = s;
}

function importAll() {
  for (const r of toImport.value) {
    createTransaction(h, me, { amount: r.amount, direction: r.direction, date: r.date, merchant: r.merchant, category: r.category, accountId: accountId.value || null, visibility: priv.value ? "private" : "household", source: "import" }).catch(() => undefined);
  }
  router.replace({ name: "money" });
}
</script>

<template>
  <div>
    <RouterLink to="/money" class="text-sm text-muted">‹ Money</RouterLink>
    <h1 class="mb-1 mt-2 text-xl font-medium">Import a statement</h1>
    <p class="mb-5 text-xs text-muted">A CSV from your bank. Lines already recorded are skipped.</p>

    <label class="mb-4 block">
      <input type="file" accept=".csv,text/csv" class="hidden" @change="pick" />
      <div class="flex h-14 items-center justify-center rounded-xl border border-line bg-panel text-sm text-muted">{{ fileName || "Tap to choose a CSV" }}</div>
    </label>
    <p v-if="note" class="mb-3 text-sm text-muted">{{ note }}</p>

    <template v-if="rows.length">
      <div class="mb-3 flex gap-2">
        <select v-model="accountId" class="h-11 flex-1 rounded-xl border border-line bg-panel px-3 text-sm outline-none focus:border-accent">
          <option value="">No account</option>
          <option v-for="a in accounts" :key="a.id" :value="a.id">{{ a.name }}</option>
        </select>
        <label class="flex items-center gap-2 text-sm"><input v-model="priv" type="checkbox" class="h-5 w-5 accent-accent" /> Only me</label>
      </div>
      <ul class="mb-4">
        <li v-for="(r, i) in rows" :key="i" class="flex items-center gap-3 border-b border-line py-2.5 text-sm" :class="{ 'opacity-40': skip.has(i) }">
          <input type="checkbox" class="h-5 w-5 shrink-0 accent-accent" :checked="!skip.has(i)" @change="toggle(i)" />
          <span class="min-w-0 flex-1">
            <span class="block truncate">{{ r.merchant }}</span>
            <span class="flex items-center gap-2 text-xs text-muted">
              {{ r.date }}
              <select v-model="r.category" class="h-7 rounded-lg border border-line bg-panel px-1.5 text-xs outline-none focus:border-accent">
                <option v-for="c in CATEGORIES" :key="c" :value="c">{{ CATEGORY_LABELS[c] }}</option>
              </select>
            </span>
          </span>
          <span class="shrink-0 tabular-nums" :class="r.direction === 'income' ? 'text-accent' : ''">{{ r.direction === "income" ? "+" : "" }}{{ money(r.amount) }}</span>
        </li>
      </ul>
      <button type="button" class="h-12 w-full rounded-full bg-accent font-medium text-ink disabled:opacity-50" :disabled="!toImport.length" @click="importAll">
        Import {{ toImport.length }} ({{ money(Math.abs(total)) }} {{ total >= 0 ? "out" : "in" }})
      </button>
      <p v-if="skip.size" class="mt-2 text-center text-xs text-muted">{{ skip.size }} skipped, already recorded or unticked.</p>
    </template>
  </div>
</template>
