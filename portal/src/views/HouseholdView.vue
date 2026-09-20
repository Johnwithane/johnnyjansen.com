<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from "vue";
import { useAuth } from "@/composables/useAuth";
import type { Household, PersonColour } from "@/firebase/interfaces";
import { addChild, createInvite, mintMeToken, revokeMeToken, subscribeHousehold } from "@/firebase/services/householdService";
import { ageOn } from "@/utils/format";
import ColourPicker from "@/components/ColourPicker.vue";

const { hid, uid, isAdult } = useAuth();
const household = ref<Household | null>(null);
let stop: (() => void) | null = null;
onMounted(() => {
  if (hid.value) stop = subscribeHousehold(hid.value, (h) => (household.value = h));
});
onUnmounted(() => stop?.());

const members = computed(() => {
  const m = household.value?.members ?? {};
  return Object.entries(m)
    .map(([id, v]) => ({ id, ...v }))
    .sort((a, b) => (a.role === b.role ? a.name.localeCompare(b.name) : a.role === "adult" ? -1 : 1));
});

// Invite
const inviteEmail = ref("");
const inviteName = ref("");
const inviteColour = ref<PersonColour>("#7fd0ff");
const inviteLink = ref("");
const inviteBusy = ref(false);
const note = ref("");

async function invite() {
  if (!navigator.onLine) return (note.value = "You need a connection to invite.");
  inviteBusy.value = true;
  note.value = "";
  try {
    const r = await createInvite({ email: inviteEmail.value.trim(), name: inviteName.value.trim(), colour: inviteColour.value });
    inviteLink.value = r.link;
    inviteEmail.value = "";
    inviteName.value = "";
  } catch (e) {
    note.value = e instanceof Error ? e.message.replace(/^.*?:\s*/, "") : "Could not create the invite";
  } finally {
    inviteBusy.value = false;
  }
}

async function shareLink() {
  const data = { title: "Join our household", text: "Tap to join our family portal.", url: inviteLink.value };
  try {
    if (navigator.share) await navigator.share(data);
    else {
      await navigator.clipboard.writeText(inviteLink.value);
      note.value = "Link copied.";
    }
  } catch {
    /* user dismissed the sheet */
  }
}

// Kids
const childName = ref("");
const childBirth = ref("");
const childColour = ref<PersonColour>("#f5c56b");
const childBusy = ref(false);

async function saveChild() {
  if (!navigator.onLine) return (note.value = "You need a connection for this.");
  childBusy.value = true;
  try {
    await addChild({ name: childName.value.trim(), birthDate: childBirth.value, colour: childColour.value });
    childName.value = "";
    childBirth.value = "";
  } catch (e) {
    note.value = e instanceof Error ? e.message.replace(/^.*?:\s*/, "") : "Could not add the child";
  } finally {
    childBusy.value = false;
  }
}

// Claude Code access
const token = ref("");
const tokenBusy = ref(false);
async function mint() {
  if (!navigator.onLine) return (note.value = "You need a connection for this.");
  tokenBusy.value = true;
  try {
    token.value = (await mintMeToken()).token;
  } catch {
    note.value = "Could not mint a token.";
  } finally {
    tokenBusy.value = false;
  }
}
async function revoke() {
  tokenBusy.value = true;
  try {
    await revokeMeToken();
    token.value = "";
    note.value = "Token revoked.";
  } catch {
    note.value = "Could not revoke.";
  } finally {
    tokenBusy.value = false;
  }
}
async function copyToken() {
  await navigator.clipboard.writeText(token.value);
  note.value = "Token copied. It is shown once.";
}
</script>

<template>
  <div>
    <h1 class="mb-1 text-xl font-medium">{{ household?.name ?? "Household" }}</h1>
    <p class="mb-6 text-xs text-muted">{{ household?.timeZone }}</p>
    <p v-if="note" class="mb-4 text-sm text-muted">{{ note }}</p>

    <section class="mb-8">
      <h2 class="mb-1 text-xs font-medium uppercase tracking-widest text-accent">Members</h2>
      <ul>
        <li v-for="m in members" :key="m.id" class="flex items-baseline justify-between gap-3 border-b border-line py-3">
          <div class="min-w-0">
            <p><span class="mr-2 inline-block h-2 w-2 rounded-full align-middle" :style="{ background: m.colour }"></span>{{ m.name }}<span v-if="m.uid === uid" class="text-muted"> (you)</span></p>
            <p class="text-xs text-muted">
              {{ m.role === "adult" ? "Adult" : `Child${m.birthDate ? `, ${ageOn(m.birthDate)}` : ""}` }}<span v-if="m.email"> · {{ m.email }}</span>
            </p>
          </div>
        </li>
      </ul>
    </section>

    <template v-if="isAdult">
      <section class="mb-8">
        <h2 class="mb-2 text-xs font-medium uppercase tracking-widest text-accent">Invite an adult</h2>
        <form class="flex flex-col gap-2" @submit.prevent="invite">
          <input v-model="inviteName" type="text" required placeholder="Their first name" class="h-12 rounded-xl border border-line bg-panel px-3.5 outline-none focus:border-accent" />
          <input v-model="inviteEmail" type="email" required placeholder="Their Gmail" class="h-12 rounded-xl border border-line bg-panel px-3.5 outline-none focus:border-accent" />
          <ColourPicker v-model="inviteColour" />
          <button type="submit" class="mt-1 h-12 rounded-full bg-accent font-medium text-ink disabled:opacity-50" :disabled="inviteBusy">
            {{ inviteBusy ? "Creating" : "Create invite link" }}
          </button>
        </form>
        <div v-if="inviteLink" class="mt-3 flex flex-col gap-2">
          <p class="break-all text-xs text-muted">{{ inviteLink }}</p>
          <button type="button" class="h-11 rounded-full border border-line text-sm" @click="shareLink">Share the link</button>
          <p class="text-xs text-muted">One use, seven days, works only for that address.</p>
        </div>
      </section>

      <section class="mb-8">
        <h2 class="mb-2 text-xs font-medium uppercase tracking-widest text-accent">Add a child</h2>
        <form class="flex flex-col gap-2" @submit.prevent="saveChild">
          <input v-model="childName" type="text" required placeholder="Name" class="h-12 rounded-xl border border-line bg-panel px-3.5 outline-none focus:border-accent" />
          <input v-model="childBirth" type="date" required class="h-12 rounded-xl border border-line bg-panel px-3.5 text-muted outline-none focus:border-accent" />
          <ColourPicker v-model="childColour" />
          <button type="submit" class="mt-1 h-12 rounded-full border border-line font-medium disabled:opacity-50" :disabled="childBusy || !childName.trim() || !childBirth">
            {{ childBusy ? "Adding" : "Add" }}
          </button>
        </form>
        <p class="mt-2 text-xs text-muted">Kids can sign in later. Nothing else about them is stored.</p>
      </section>

      <section class="mb-8">
        <h2 class="mb-2 text-xs font-medium uppercase tracking-widest text-accent">Claude Code access</h2>
        <p class="mb-3 text-sm text-muted">A personal token for the me endpoint. Shown once. Minting again replaces it.</p>
        <div v-if="token" class="mb-3 flex flex-col gap-2">
          <code class="break-all rounded-xl border border-line bg-panel p-3 text-xs">{{ token }}</code>
          <button type="button" class="h-11 rounded-full border border-line text-sm" @click="copyToken">Copy</button>
        </div>
        <div class="flex gap-2">
          <button type="button" class="h-11 flex-1 rounded-full bg-accent text-sm font-medium text-ink disabled:opacity-50" :disabled="tokenBusy" @click="mint">Mint token</button>
          <button type="button" class="h-11 flex-1 rounded-full border border-line text-sm disabled:opacity-50" :disabled="tokenBusy" @click="revoke">Revoke</button>
        </div>
      </section>
    </template>
  </div>
</template>
