<script setup lang="ts">
import { onMounted, onUnmounted, ref } from "vue";
import type { Digest, WithId } from "@/firebase/interfaces";
import { subscribeDigests } from "@/firebase/services/digestsService";

const digests = ref<WithId<Digest>[]>([]);
const openId = ref<string | null>(null);
let stop: (() => void) | null = null;

onMounted(() => {
  stop = subscribeDigests((items) => {
    digests.value = items;
    if (!openId.value && items[0]) openId.value = items[0].id;
  });
});
onUnmounted(() => stop?.());
</script>

<template>
  <div>
    <h1 class="mb-4 text-xl font-medium">Digests</h1>
    <p v-if="digests.length === 0" class="text-muted">No digests yet. The first one lands at 6:30 tomorrow.</p>
    <ul v-else>
      <li v-for="d in digests" :key="d.id" class="border-b border-line py-3">
        <button type="button" class="w-full text-left" @click="openId = openId === d.id ? null : d.id">
          <p class="text-sm">{{ d.subject }}</p>
          <p class="text-xs text-muted">
            {{ d.dayKey }} · {{ d.emailed ? "emailed" : d.emailError ? `not emailed: ${d.emailError}` : "not emailed" }}
          </p>
        </button>
        <pre v-if="openId === d.id" class="mt-3 whitespace-pre-wrap font-sans text-sm text-muted">{{ d.text }}</pre>
      </li>
    </ul>
  </div>
</template>
