<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from "vue";
import { useRoute } from "vue-router";
import { useAuth } from "@/composables/useAuth";
import type { UserProfile } from "@/firebase/interfaces";
import { subscribeProfile } from "@/firebase/services/householdService";
import { LEGAL_VERSION } from "@/legal/version";
import AppShell from "@/components/AppShell.vue";
import LegalGate from "@/components/LegalGate.vue";

const route = useRoute();
const { ready, isMember, uid } = useAuth();
const profile = ref<UserProfile | null | undefined>(undefined);
let stop: (() => void) | null = null;
function follow() {
  stop?.();
  stop = null;
  profile.value = undefined;
  if (uid.value) stop = subscribeProfile(uid.value, (p) => (profile.value = p));
}
onMounted(follow);
watch(uid, follow);
onUnmounted(() => stop?.());
</script>

<template>
  <div v-if="!ready" class="flex min-h-dvh items-center justify-center text-muted">Loading</div>
  <RouterView v-else-if="route.name === 'legal'" />
  <div v-else-if="isMember && profile === undefined" class="flex min-h-dvh items-center justify-center text-muted">Loading</div>
  <LegalGate v-else-if="isMember && (profile?.legal?.version ?? 0) < LEGAL_VERSION" />
  <AppShell v-else-if="isMember">
    <RouterView />
  </AppShell>
  <RouterView v-else />
</template>
