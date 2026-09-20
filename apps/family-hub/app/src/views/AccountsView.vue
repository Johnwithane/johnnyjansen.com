<script setup lang="ts">
import { onMounted, onUnmounted, ref } from "vue";
import { useAuth } from "@/composables/useAuth";
import type { Account, AccountType, WithId } from "@/firebase/interfaces";
import { createAccount, deleteAccount, subscribeAccounts } from "@/firebase/services/moneyService";

const { hid, uid, isAdult } = useAuth();
const h = hid.value ?? "";
const me = uid.value ?? "";
const accounts = ref<WithId<Account>[]>([]);
let stop: (() => void) | null = null;
onMounted(() => (stop = subscribeAccounts(h, me, (a) => (accounts.value = a))));
onUnmounted(() => stop?.());

const name = ref("");
const type = ref<AccountType>("chequing");
const priv = ref(false);
const TYPES: AccountType[] = ["chequing", "savings", "credit", "cash", "loan"];
function add() {
  if (!name.value.trim()) return;
  createAccount(h, me, { name: name.value.trim(), type: type.value, visibility: priv.value ? "private" : "household" }).catch(() => undefined);
  name.value = "";
}
</script>

<template>
  <div>
    <RouterLink to="/money" class="text-sm text-muted">‹ Money</RouterLink>
    <h1 class="mb-1 mt-2 text-xl font-medium">Accounts</h1>
    <p class="mb-5 text-xs text-muted">Names only. Balances come from imports or by hand.</p>
    <ul>
      <li v-for="a in accounts" :key="a.id" class="flex items-center justify-between border-b border-line py-3">
        <span>{{ a.name }}<span class="text-xs text-muted"> · {{ a.type }}<span v-if="a.visibility === 'private'"> · private</span></span></span>
        <button v-if="isAdult" type="button" class="px-1 text-muted" aria-label="Delete" @click="deleteAccount(h, a.id)">×</button>
      </li>
    </ul>
    <form v-if="isAdult" class="mt-6 flex flex-col gap-2" @submit.prevent="add">
      <input v-model="name" type="text" placeholder="TD chequing" class="h-12 rounded-xl border border-line bg-panel px-3.5 outline-none focus:border-accent" />
      <div class="flex flex-wrap gap-2">
        <button v-for="t in TYPES" :key="t" type="button" class="rounded-full border border-line px-3 py-1.5 text-sm" :class="type === t ? 'bg-accent text-ink' : 'text-muted'" @click="type = t">{{ t }}</button>
      </div>
      <label class="flex items-center gap-3 py-1 text-sm"><input v-model="priv" type="checkbox" class="h-5 w-5 accent-accent" /> Only I see this</label>
      <button type="submit" class="h-12 rounded-full bg-accent font-medium text-ink disabled:opacity-50" :disabled="!name.trim()">Add account</button>
    </form>
  </div>
</template>
