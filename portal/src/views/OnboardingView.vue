<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useAuth } from "@/composables/useAuth";
import { createHousehold } from "@/firebase/services/householdService";
import type { PersonColour } from "@/firebase/interfaces";
import ColourPicker from "@/components/ColourPicker.vue";

// The founder's first screen. Name and photo are already on the Google
// account; this asks for the household name, what to call you, a colour, and
// an optional birthday. Anyone arriving by invite never sees this: the invite
// link routes to InviteView instead.

const router = useRouter();
const { user, refreshClaims, logOut } = useAuth();

const surname = (user.value?.displayName ?? "").trim().split(" ").slice(-1)[0] ?? "";
const name = ref(surname ? `The ${surname}s` : "");
const yourName = ref((user.value?.displayName ?? "").trim().split(" ")[0] ?? "");
const colour = ref<PersonColour>("#37ff8b");
const birthDate = ref("");
const busy = ref(false);
const error = ref("");

async function submit() {
  if (!navigator.onLine) {
    error.value = "You need a connection for this step.";
    return;
  }
  busy.value = true;
  error.value = "";
  try {
    await createHousehold({
      name: name.value.trim(),
      yourName: yourName.value.trim(),
      colour: colour.value,
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      ...(birthDate.value ? { birthDate: birthDate.value } : {}),
    });
    await refreshClaims();
    router.replace({ name: "today" });
  } catch (e) {
    error.value = e instanceof Error ? e.message : "Could not create the household";
  } finally {
    busy.value = false;
  }
}
</script>

<template>
  <div class="mx-auto flex min-h-dvh max-w-md flex-col px-5 pt-14 pb-10">
    <p class="mb-1 text-sm text-muted">Step 1</p>
    <h1 class="mb-6 text-2xl font-medium">Start a household</h1>

    <form class="flex flex-col gap-5" @submit.prevent="submit">
      <label class="flex flex-col gap-1.5">
        <span class="text-sm text-muted">Household name</span>
        <input v-model="name" type="text" required maxlength="80" class="h-12 rounded-xl border border-line bg-panel px-3.5 outline-none focus:border-accent" />
      </label>
      <label class="flex flex-col gap-1.5">
        <span class="text-sm text-muted">What we call you</span>
        <input v-model="yourName" type="text" required maxlength="60" class="h-12 rounded-xl border border-line bg-panel px-3.5 outline-none focus:border-accent" />
      </label>
      <div class="flex flex-col gap-1.5">
        <span class="text-sm text-muted">Your colour</span>
        <ColourPicker v-model="colour" />
      </div>
      <label class="flex flex-col gap-1.5">
        <span class="text-sm text-muted">Birthday, optional</span>
        <input v-model="birthDate" type="date" class="h-12 rounded-xl border border-line bg-panel px-3.5 text-muted outline-none focus:border-accent" />
      </label>

      <p v-if="error" class="text-sm text-danger">{{ error }}</p>

      <button type="submit" class="mt-2 h-12 rounded-full bg-accent font-medium text-ink disabled:opacity-50" :disabled="busy || !name.trim() || !yourName.trim()">
        {{ busy ? "Creating" : "Continue" }}
      </button>
    </form>

    <p class="mt-8 text-sm text-muted">Got an invite? Open the link you were sent.</p>
    <button type="button" class="mt-6 self-start text-sm text-muted" @click="logOut">Sign out</button>
  </div>
</template>
