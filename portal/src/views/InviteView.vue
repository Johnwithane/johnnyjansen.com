<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useAuth } from "@/composables/useAuth";
import { acceptInvite } from "@/firebase/services/householdService";

// The invited adult lands here from the link. The token lives in the URL
// fragment, so it never reached a server log. One tap, then Today.

const route = useRoute();
const router = useRouter();
const { user, isMember, refreshClaims, logOut } = useAuth();

const busy = ref(false);
const error = ref("");
const token = ref("");

onMounted(() => {
  token.value = (window.location.hash || "").replace(/^#/, "");
  if (isMember.value) router.replace({ name: "today" });
});

async function accept() {
  if (!navigator.onLine) {
    error.value = "You need a connection for this step.";
    return;
  }
  busy.value = true;
  error.value = "";
  try {
    await acceptInvite({ hid: String(route.params.hid), inviteId: String(route.params.inviteId), token: token.value });
    await refreshClaims();
    router.replace({ name: "today" });
  } catch (e) {
    error.value = e instanceof Error ? e.message.replace(/^.*?:\s*/, "") : "Could not accept the invite";
  } finally {
    busy.value = false;
  }
}
</script>

<template>
  <div class="mx-auto flex min-h-dvh max-w-md flex-col px-5 pt-14 pb-10">
    <p class="mb-1 text-sm text-muted">Invite</p>
    <h1 class="mb-3 text-2xl font-medium">You are in</h1>
    <p class="mb-8 text-muted">Signed in as {{ user?.email }}. This has to be the address the invite was sent to.</p>

    <p v-if="!token" class="mb-4 text-sm text-danger">This link is missing its key. Ask for a new one.</p>
    <p v-if="error" class="mb-4 text-sm text-danger">{{ error }}</p>

    <button type="button" class="h-12 rounded-full bg-accent font-medium text-ink disabled:opacity-50" :disabled="busy || !token" @click="accept">
      {{ busy ? "Joining" : "Join the household" }}
    </button>
    <button type="button" class="mt-6 self-start text-sm text-muted" @click="logOut">Not you? Sign out</button>
  </div>
</template>
