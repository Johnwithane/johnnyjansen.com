<script setup lang="ts">
import { ref } from "vue";
import { useAuth } from "@/composables/useAuth";
import { acceptLegal } from "@/firebase/services/householdService";
import { LEGAL_VERSION } from "@/legal/version";

const { uid } = useAuth();
const busy = ref(false);

function accept() {
  if (!uid.value) return;
  busy.value = true;
  // Not awaited past the click: offline it queues and the gate lifts on the
  // local write through the profile listener.
  acceptLegal(uid.value, LEGAL_VERSION).catch(() => (busy.value = false));
}
</script>

<template>
  <div class="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-5">
    <h1 class="mb-3 text-2xl font-medium">Before you start</h1>
    <p class="mb-6 text-muted">Two short pages say what we keep, who can see it, and how to leave with your data.</p>
    <p class="mb-8 text-sm"><RouterLink to="/legal/terms" class="text-accent">Terms</RouterLink> · <RouterLink to="/legal/privacy" class="text-accent">Privacy</RouterLink></p>
    <button type="button" class="h-12 rounded-full bg-accent font-medium text-ink disabled:opacity-50" :disabled="busy" @click="accept">I agree</button>
  </div>
</template>
