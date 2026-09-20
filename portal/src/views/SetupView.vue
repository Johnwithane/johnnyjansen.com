<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from "vue";
import { useRouter } from "vue-router";
import { useAuth } from "@/composables/useAuth";
import type { Household, PersonColour, UserProfile } from "@/firebase/interfaces";
import { addChild, createInvite, googleConnectStart, setSetupDone, subscribeHousehold, subscribeProfile } from "@/firebase/services/householdService";
import ColourPicker from "@/components/ColourPicker.vue";

// The wizard's spine (FAMILY_PLAN.md 4.19): who lives here, connect Google,
// done. Every step is skippable and the whole thing is resumable: Today
// shows "Finish setup" until setSetupDone. The inbox scan lands in Phase 2.

const router = useRouter();
const { hid, uid } = useAuth();
const household = ref<Household | null>(null);
const profile = ref<UserProfile | null>(null);
const stops: (() => void)[] = [];
onMounted(() => {
  if (hid.value) stops.push(subscribeHousehold(hid.value, (h) => (household.value = h)));
  if (uid.value) stops.push(subscribeProfile(uid.value, (p) => (profile.value = p)));
});
onUnmounted(() => stops.forEach((s) => s()));

const step = ref<1 | 2 | 3>(1);
const note = ref("");
const busy = ref(false);

const kids = computed(() => Object.values(household.value?.members ?? {}).filter((m) => m.role === "child"));
const adults = computed(() => Object.values(household.value?.members ?? {}).filter((m) => m.role === "adult"));

// Step 1: people
const inviteEmail = ref("");
const inviteName = ref("");
const inviteColour = ref<PersonColour>("#7fd0ff");
const inviteLink = ref("");
const childName = ref("");
const childBirth = ref("");
const childColour = ref<PersonColour>("#f5c56b");

async function invite() {
  if (!navigator.onLine) return (note.value = "You need a connection to invite.");
  busy.value = true;
  try {
    inviteLink.value = (await createInvite({ email: inviteEmail.value.trim(), name: inviteName.value.trim(), colour: inviteColour.value })).link;
  } catch (e) {
    note.value = e instanceof Error ? e.message.replace(/^.*?:\s*/, "") : "Could not create the invite";
  } finally {
    busy.value = false;
  }
}
async function share() {
  try {
    if (navigator.share) await navigator.share({ title: "Join our household", url: inviteLink.value });
    else {
      await navigator.clipboard.writeText(inviteLink.value);
      note.value = "Link copied.";
    }
  } catch {
    /* dismissed */
  }
}
async function saveChild() {
  if (!navigator.onLine) return (note.value = "You need a connection for this.");
  busy.value = true;
  try {
    await addChild({ name: childName.value.trim(), birthDate: childBirth.value, colour: childColour.value });
    childName.value = "";
    childBirth.value = "";
  } catch (e) {
    note.value = e instanceof Error ? e.message.replace(/^.*?:\s*/, "") : "Could not add the child";
  } finally {
    busy.value = false;
  }
}

// Step 2: Google
async function connectGoogle() {
  if (!navigator.onLine) return (note.value = "You need a connection for this.");
  busy.value = true;
  try {
    // Come back to step 3 after Google.
    sessionStorage.setItem("setup-step", "3");
    window.location.assign((await googleConnectStart()).url);
  } catch (e) {
    note.value = e instanceof Error ? e.message.replace(/^.*?:\s*/, "") : "Google is not configured yet";
    busy.value = false;
  }
}

async function finish() {
  if (uid.value) setSetupDone(uid.value, true).catch(() => undefined);
  router.replace({ name: "today" });
}

onMounted(() => {
  const resume = sessionStorage.getItem("setup-step");
  if (resume === "3") {
    sessionStorage.removeItem("setup-step");
    step.value = 3;
  }
});
</script>

<template>
  <div class="mx-auto max-w-md pt-2">
    <p class="mb-1 text-sm text-muted">Step {{ step }} of 3</p>
    <div class="mb-6 flex gap-1.5">
      <span v-for="i in 3" :key="i" class="h-0.5 flex-1 rounded" :class="i <= step ? 'bg-accent' : 'bg-line'"></span>
    </div>
    <p v-if="note" class="mb-4 text-sm text-muted">{{ note }}</p>

    <template v-if="step === 1">
      <h1 class="mb-6 text-2xl font-medium">Who lives here</h1>

      <section class="mb-6">
        <h2 class="mb-1 text-xs font-medium uppercase tracking-widest text-accent">Adults</h2>
        <ul>
          <li v-for="a in adults" :key="a.name" class="border-b border-line py-2.5"><span class="mr-2 inline-block h-2 w-2 rounded-full align-middle" :style="{ background: a.colour }"></span>{{ a.name }}</li>
        </ul>
        <form v-if="!inviteLink" class="mt-3 flex flex-col gap-2" @submit.prevent="invite">
          <input v-model="inviteName" type="text" required placeholder="Their first name" class="h-12 rounded-xl border border-line bg-panel px-3.5 outline-none focus:border-accent" />
          <input v-model="inviteEmail" type="email" required placeholder="Their Gmail" class="h-12 rounded-xl border border-line bg-panel px-3.5 outline-none focus:border-accent" />
          <ColourPicker v-model="inviteColour" />
          <button type="submit" class="h-12 rounded-full border border-line font-medium disabled:opacity-50" :disabled="busy">Invite</button>
        </form>
        <div v-else class="mt-3 flex flex-col gap-2">
          <p class="text-sm text-muted">Invite ready. Send it and they can start while you finish.</p>
          <button type="button" class="h-11 rounded-full border border-line text-sm" @click="share">Share the link</button>
        </div>
      </section>

      <section class="mb-8">
        <h2 class="mb-1 text-xs font-medium uppercase tracking-widest text-accent">Kids</h2>
        <ul>
          <li v-for="k in kids" :key="k.name" class="border-b border-line py-2.5"><span class="mr-2 inline-block h-2 w-2 rounded-full align-middle" :style="{ background: k.colour }"></span>{{ k.name }}<span class="text-muted"> · {{ k.birthDate }}</span></li>
        </ul>
        <form class="mt-3 flex flex-col gap-2" @submit.prevent="saveChild">
          <input v-model="childName" type="text" placeholder="Name" class="h-12 rounded-xl border border-line bg-panel px-3.5 outline-none focus:border-accent" />
          <input v-model="childBirth" type="date" class="h-12 rounded-xl border border-line bg-panel px-3.5 text-muted outline-none focus:border-accent" />
          <ColourPicker v-model="childColour" />
          <button type="submit" class="h-12 rounded-full border border-line font-medium disabled:opacity-50" :disabled="busy || !childName.trim() || !childBirth">Add child</button>
        </form>
        <p class="mt-2 text-xs text-muted">They can sign in later. Nothing else about them is stored.</p>
      </section>

      <button type="button" class="h-12 w-full rounded-full bg-accent font-medium text-ink" @click="step = 2">Continue</button>
    </template>

    <template v-else-if="step === 2">
      <h1 class="mb-3 text-2xl font-medium">Connect Google</h1>
      <p class="mb-8 text-muted">Calendar read, mail read, and send for your digest. Your grant is encrypted and only you can disconnect it.</p>
      <p v-if="profile?.google?.connected" class="mb-4 text-sm text-accent">Connected as {{ profile.google.email }}.</p>
      <button v-if="!profile?.google?.connected" type="button" class="h-12 w-full rounded-full bg-accent font-medium text-ink disabled:opacity-50" :disabled="busy" @click="connectGoogle">Connect Google</button>
      <button type="button" class="mt-3 h-12 w-full rounded-full border border-line" @click="step = 3">{{ profile?.google?.connected ? "Continue" : "Skip for now" }}</button>
    </template>

    <template v-else>
      <h1 class="mb-3 text-2xl font-medium">Today is ready</h1>
      <ul class="mb-8 text-muted">
        <li class="border-b border-line py-2.5">{{ adults.length }} adult{{ adults.length === 1 ? "" : "s" }}, {{ kids.length }} kid{{ kids.length === 1 ? "" : "s" }}</li>
        <li class="border-b border-line py-2.5">Google {{ profile?.google?.connected ? "connected" : "not connected, from the Household screen any time" }}</li>
        <li class="border-b border-line py-2.5">Digest at 6:30 every morning</li>
      </ul>
      <button type="button" class="h-12 w-full rounded-full bg-accent font-medium text-ink" @click="finish">Open Today</button>
    </template>
  </div>
</template>
