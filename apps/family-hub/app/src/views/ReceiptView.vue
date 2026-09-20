<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from "vue";
import { useRouter } from "vue-router";
import { useAuth } from "@/composables/useAuth";
import { CATEGORIES, CATEGORY_LABELS, TAX_CATEGORIES, TAX_LABELS, type Category, type TaxCategory } from "@/data/categories";
import type { Account, WithId } from "@/firebase/interfaces";
import { analyzeReceipt, createTransaction, subscribeAccounts, uploadReceipt, type ReceiptRead } from "@/firebase/services/moneyService";
import { dayKeyOf } from "@/utils/localTime";
import { money, shrinkImage } from "@/utils/money";

// Snap a receipt: shrink on the device, ask Gemini, show what it read next
// to the photo, confirm. Nothing is saved until Confirm. Offline, the photo
// can be kept as a hand-entered transaction without the read.

const router = useRouter();
const { hid, uid } = useAuth();
const h = hid.value ?? "";
const me = uid.value ?? "";
const accounts = ref<WithId<Account>[]>([]);
let stop: (() => void) | null = null;
onMounted(() => (stop = subscribeAccounts(h, me, (a) => (accounts.value = a))));
onUnmounted(() => stop?.());

const preview = ref("");
const busy = ref(false);
const note = ref("");
const read = ref<ReceiptRead | null>(null);
let blob: Blob | null = null;
let base64 = "";

const merchant = ref("");
const date = ref(dayKeyOf(new Date()));
const total = ref("");
const category = ref<Category>("other");
const taxCategory = ref<TaxCategory>("none");
const accountId = ref<string>("");
const priv = ref(false);

async function pick(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (!file) return;
  note.value = "";
  read.value = null;
  busy.value = true;
  try {
    const shrunk = await shrinkImage(file);
    blob = shrunk.blob;
    base64 = shrunk.base64;
    preview.value = URL.createObjectURL(shrunk.blob);
    if (!navigator.onLine) {
      note.value = "Offline. Fill it in by hand and the photo stays with it.";
      return;
    }
    const r = await analyzeReceipt({ mimeType: "image/jpeg", dataBase64: base64 });
    read.value = r;
    merchant.value = r.merchant;
    date.value = r.date || date.value;
    total.value = r.total ? String(r.total) : "";
    category.value = (CATEGORIES as readonly string[]).includes(r.category) ? (r.category as Category) : "other";
    taxCategory.value = (TAX_CATEGORIES as readonly string[]).includes(r.taxCategory) ? (r.taxCategory as TaxCategory) : "none";
  } catch (err) {
    note.value = err instanceof Error ? err.message.replace(/^.*?:\s*/, "") : "Could not read the receipt. Fill it in by hand.";
  } finally {
    busy.value = false;
  }
}

const canSave = computed(() => merchant.value.trim() && Number(total.value) > 0 && /^\d{4}-\d{2}-\d{2}$/.test(date.value));

async function confirm() {
  if (!canSave.value) return;
  busy.value = true;
  try {
    let receiptPath: string | null = null;
    if (blob && navigator.onLine) {
      try {
        receiptPath = await uploadReceipt(h, me, blob, "image/jpeg");
      } catch {
        note.value = "Saved without the photo (upload failed).";
      }
    }
    createTransaction(h, me, {
      amount: Number(total.value),
      direction: category.value === "income" ? "income" : "expense",
      date: date.value,
      merchant: merchant.value.trim(),
      category: category.value,
      taxCategory: taxCategory.value,
      accountId: accountId.value || null,
      receiptPath,
      visibility: priv.value ? "private" : "household",
      source: read.value ? "receipt" : "portal",
    }).catch(() => undefined);
    router.replace({ name: "money" });
  } finally {
    busy.value = false;
  }
}
</script>

<template>
  <div>
    <RouterLink to="/money" class="text-sm text-muted">‹ Money</RouterLink>
    <h1 class="mb-1 mt-2 text-xl font-medium">Receipt</h1>
    <p class="mb-5 text-xs text-muted">{{ read ? `Read by Gemini · ${read.confidence}` : "Photo first. Nothing is saved until you confirm." }}</p>

    <label class="mb-4 block">
      <span class="sr-only">Take or choose a photo</span>
      <input type="file" accept="image/*" capture="environment" class="hidden" @change="pick" />
      <div class="flex h-44 items-center justify-center overflow-hidden rounded-xl border border-line bg-panel text-sm text-muted">
        <img v-if="preview" :src="preview" alt="Receipt" class="h-full w-full object-cover" />
        <span v-else>{{ busy ? "Reading" : "Tap to take a photo" }}</span>
      </div>
    </label>
    <p v-if="note" class="mb-3 text-sm text-muted">{{ note }}</p>

    <form class="flex flex-col gap-3" @submit.prevent="confirm">
      <label class="flex flex-col gap-1"><span class="text-xs text-muted">Merchant</span><input v-model="merchant" type="text" class="h-12 rounded-xl border border-line bg-panel px-3.5 outline-none focus:border-accent" /></label>
      <div class="flex gap-2">
        <label class="flex flex-1 flex-col gap-1"><span class="text-xs text-muted">Date</span><input v-model="date" type="date" class="h-12 rounded-xl border border-line bg-panel px-3.5 outline-none focus:border-accent" /></label>
        <label class="flex flex-1 flex-col gap-1"><span class="text-xs text-muted">Total</span><input v-model="total" type="number" inputmode="decimal" step="0.01" min="0" class="h-12 rounded-xl border border-line bg-panel px-3.5 text-right tabular-nums outline-none focus:border-accent" /></label>
      </div>
      <label class="flex flex-col gap-1"><span class="text-xs text-muted">Category</span>
        <select v-model="category" class="h-12 rounded-xl border border-line bg-panel px-3.5 outline-none focus:border-accent"><option v-for="c in CATEGORIES" :key="c" :value="c">{{ CATEGORY_LABELS[c] }}</option></select>
      </label>
      <label class="flex flex-col gap-1"><span class="text-xs text-muted">For taxes</span>
        <select v-model="taxCategory" class="h-12 rounded-xl border border-line bg-panel px-3.5 outline-none focus:border-accent"><option v-for="t in TAX_CATEGORIES" :key="t" :value="t">{{ TAX_LABELS[t] }}</option></select>
      </label>
      <label v-if="accounts.length" class="flex flex-col gap-1"><span class="text-xs text-muted">Account</span>
        <select v-model="accountId" class="h-12 rounded-xl border border-line bg-panel px-3.5 outline-none focus:border-accent"><option value="">Not set</option><option v-for="a in accounts" :key="a.id" :value="a.id">{{ a.name }}</option></select>
      </label>
      <label class="flex items-center gap-3 py-1 text-sm"><input v-model="priv" type="checkbox" class="h-5 w-5 accent-accent" /> Only I see this</label>
      <p v-if="read && read.tax" class="text-xs text-muted">Tax on the receipt: {{ money(read.tax) }}<span v-if="read.business"> · looks like {{ read.business }}</span></p>
      <button type="submit" class="h-12 rounded-full bg-accent font-medium text-ink disabled:opacity-50" :disabled="busy || !canSave">Confirm</button>
    </form>
  </div>
</template>
