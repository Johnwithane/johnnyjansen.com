<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from "vue";
import { useAuth } from "@/composables/useAuth";
import type { Household, PersonColour } from "@/firebase/interfaces";
import { useRoute } from "vue-router";
import type { UserProfile } from "@/firebase/interfaces";
import {
  addChild,
  createInvite,
  googleCalendars,
  googleConnectStart,
  googleDisconnect,
  mintMeToken,
  revokeMeToken,
  setCalendars,
  subscribeHousehold,
  subscribeProfile,
  type CalendarChoice,
} from "@/firebase/services/householdService";
import { ageOn } from "@/utils/format";
import ColourPicker from "@/components/ColourPicker.vue";

const { hid, uid, isAdult } = useAuth();
const route = useRoute();
const household = ref<Household | null>(null);
const profile = ref<UserProfile | null>(null);
const stops: (() => void)[] = [];
onMounted(() => {
  if (hid.value) stops.push(subscribeHousehold(hid.value, (h) => (household.value = h)));
  if (uid.value) stops.push(subscribeProfile(uid.value, (p) => (profile.value = p)));
  const outcome = route.query.google;
  if (outcome === "connected") note.value = "Google connected.";
  else if (outcome === "denied") note.value = "Google connect was cancelled.";
  else if (outcome === "mismatch") note.value = "That was a different Google account. Connect the one you signed in with.";
  else if (outcome === "error") note.value = "Google connect failed. Try again.";
});
onUnmounted(() => stops.forEach((s) => s()));

// Google
const googleBusy = ref(false);
const calendars = ref<CalendarChoice[] | null>(null);
const picked = ref<string[]>([]);
const family = ref<string[]>([]);
async function connectGoogle() {
  if (!navigator.onLine) return (note.value = "You need a connection for this.");
  googleBusy.value = true;
  try {
    const { url } = await googleConnectStart();
    window.location.assign(url);
  } catch (e) {
    note.value = e instanceof Error ? e.message.replace(/^.*?:\s*/, "") : "Could not start Google connect";
    googleBusy.value = false;
  }
}
async function disconnectGoogle() {
  if (!navigator.onLine) return (note.value = "You need a connection for this.");
  googleBusy.value = true;
  try {
    await googleDisconnect();
    calendars.value = null;
    note.value = "Google disconnected.";
  } catch {
    note.value = "Could not disconnect.";
  } finally {
    googleBusy.value = false;
  }
}
async function loadCalendars() {
  if (!navigator.onLine) return (note.value = "You need a connection for this.");
  googleBusy.value = true;
  try {
    calendars.value = await googleCalendars();
    const chosen = profile.value?.google?.calendarIds ?? [];
    picked.value = chosen.length ? chosen : calendars.value.filter((c) => c.selected).map((c) => c.id);
    family.value = profile.value?.google?.familyCalendarIds ?? [];
  } catch {
    note.value = "Could not list calendars.";
  } finally {
    googleBusy.value = false;
  }
}
function togglePick(id: string) {
  picked.value = picked.value.includes(id) ? picked.value.filter((x) => x !== id) : [...picked.value, id];
  if (!picked.value.includes(id)) family.value = family.value.filter((x) => x !== id);
}
function toggleFamily(id: string) {
  family.value = family.value.includes(id) ? family.value.filter((x) => x !== id) : [...family.value, id];
  if (family.value.includes(id) && !picked.value.includes(id)) picked.value = [...picked.value, id];
}
async function saveCalendars() {
  googleBusy.value = true;
  try {
    await setCalendars(picked.value, family.value);
    note.value = "Calendars saved.";
    calendars.value = null;
  } catch {
    note.value = "Could not save calendars.";
  } finally {
    googleBusy.value = false;
  }
}

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

    <RouterLink v-if="isAdult" to="/intake" class="block border-b border-line py-3 text-sm">Intake, approved senders <span class="text-accent">→</span></RouterLink>
    <RouterLink v-if="isAdult" to="/money/accounts" class="block border-b border-line py-3 text-sm">Accounts <span class="text-accent">→</span></RouterLink>
    <RouterLink to="/digests" class="block border-b border-line py-3 text-sm">Digests <span class="text-accent">→</span></RouterLink>
    <RouterLink to="/security" class="block border-b border-line py-3 text-sm">Security, second factor <span class="text-accent">→</span></RouterLink>
    <RouterLink to="/feedback" class="mb-6 block border-b border-line py-3 text-sm">Feedback queue <span class="text-accent">→</span></RouterLink>

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
        <h2 class="mb-2 text-xs font-medium uppercase tracking-widest text-accent">Your Google</h2>
        <template v-if="profile?.google?.connected">
          <p class="mb-3 text-sm text-muted">Connected as {{ profile.google.email }}. Calendar and inbox feed your Today and digest.</p>
          <div class="flex gap-2">
            <button type="button" class="h-11 flex-1 rounded-full border border-line text-sm disabled:opacity-50" :disabled="googleBusy" @click="loadCalendars">Choose calendars</button>
            <button type="button" class="h-11 flex-1 rounded-full border border-line text-sm text-muted disabled:opacity-50" :disabled="googleBusy" @click="disconnectGoogle">Disconnect</button>
          </div>
          <div v-if="calendars" class="mt-3">
            <ul>
              <li v-for="c in calendars" :key="c.id" class="flex items-center gap-3 border-b border-line py-2.5">
                <input :id="`cal-${c.id}`" type="checkbox" class="h-5 w-5 accent-accent" :checked="picked.includes(c.id)" @change="togglePick(c.id)" />
                <label :for="`cal-${c.id}`" class="flex-1 text-sm">{{ c.name }}<span v-if="c.primary" class="text-muted"> · primary</span></label>
                <label class="flex items-center gap-1.5 text-xs text-muted">
                  <input type="checkbox" class="h-4 w-4 accent-accent" :checked="family.includes(c.id)" @change="toggleFamily(c.id)" />
                  Family
                </label>
              </li>
            </ul>
            <p class="mt-2 text-xs text-muted">Ticked calendars feed your Today. Family ones also show on everyone&#39;s.</p>
            <button type="button" class="mt-3 h-11 w-full rounded-full bg-accent text-sm font-medium text-ink disabled:opacity-50" :disabled="googleBusy" @click="saveCalendars">Save</button>
          </div>
        </template>
        <template v-else>
          <p class="mb-3 text-sm text-muted">Calendar read, mail read, and send. Your grant is encrypted and only you can disconnect it.</p>
          <button type="button" class="h-11 w-full rounded-full bg-accent text-sm font-medium text-ink disabled:opacity-50" :disabled="googleBusy" @click="connectGoogle">Connect Google</button>
        </template>
      </section>

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
