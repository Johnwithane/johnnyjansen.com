<script setup lang="ts">
import { onMounted, ref, shallowRef } from "vue";
import { useRoute } from "vue-router";
import { multiFactor, TotpMultiFactorGenerator, type TotpSecret } from "firebase/auth";
import { useAuth } from "@/composables/useAuth";
import { BRAND_NAME } from "@/seo/site";

// Second factor: an authenticator app (TOTP). Adults enrol here; Money,
// Taxes and the Vault (Phase 2+) require a session that passed it. The
// secret is shown as a key to type, and as an otpauth link for phones that
// open it directly. No SMS, by design (FAMILY_PLAN.md 9.2).

const { user, isAdult, isMfa, logOut } = useAuth();
const route = useRoute();
// Sent here by the router from a screen that needs the second factor.
const sentFrom = typeof route.query.next === "string" ? route.query.next : "";
const enrolled = ref<{ id: string; name: string }[]>([]);
const secret = shallowRef<TotpSecret | null>(null);
const otpauth = ref("");
const code = ref("");
const busy = ref(false);
const note = ref("");

function refresh() {
  const u = user.value;
  enrolled.value = u ? multiFactor(u).enrolledFactors.map((f) => ({ id: f.uid, name: f.displayName ?? "Authenticator" })) : [];
}
onMounted(refresh);

async function start() {
  const u = user.value;
  if (!u) return;
  if (!navigator.onLine) return (note.value = "You need a connection for this.");
  busy.value = true;
  note.value = "";
  try {
    const session = await multiFactor(u).getSession();
    const s = await TotpMultiFactorGenerator.generateSecret(session);
    secret.value = s;
    otpauth.value = s.generateQrCodeUrl(u.email ?? "", BRAND_NAME);
  } catch (e) {
    note.value = e instanceof Error ? e.message.replace(/^.*?:\s*/, "") : "Could not start enrolment";
  } finally {
    busy.value = false;
  }
}

async function finish() {
  const u = user.value;
  if (!u || !secret.value) return;
  busy.value = true;
  note.value = "";
  try {
    const assertion = TotpMultiFactorGenerator.assertionForEnrollment(secret.value, code.value.trim());
    await multiFactor(u).enroll(assertion, "Authenticator app");
    secret.value = null;
    code.value = "";
    note.value = "Second factor on. Sign in again to use it in this session.";
    refresh();
  } catch (e) {
    note.value = e instanceof Error ? e.message.replace(/^.*?:\s*/, "") : "That code did not match";
  } finally {
    busy.value = false;
  }
}

async function remove(id: string) {
  const u = user.value;
  if (!u) return;
  busy.value = true;
  try {
    await multiFactor(u).unenroll(id);
    note.value = "Second factor off.";
    refresh();
  } catch (e) {
    note.value = e instanceof Error ? e.message.replace(/^.*?:\s*/, "") : "Could not remove it. Sign in again and retry.";
  } finally {
    busy.value = false;
  }
}
</script>

<template>
  <div>
    <h1 class="mb-1 text-xl font-medium">Security</h1>
    <p class="mb-6 text-xs text-muted">Sign-in is Google only. A second factor protects money, taxes and the vault.</p>
    <p v-if="note" class="mb-4 text-sm text-muted">{{ note }}</p>
    <p v-if="sentFrom && !enrolled.length" class="mb-4 rounded-xl border border-line bg-panel p-3 text-sm">Money needs a second factor. Turn it on below, then sign in again.</p>
    <div v-else-if="sentFrom && enrolled.length && !isMfa" class="mb-4 rounded-xl border border-line bg-panel p-3 text-sm">
      <p class="mb-2">Your second factor is on. Sign in again and Money opens.</p>
      <button type="button" class="h-10 rounded-full bg-accent px-4 text-sm font-medium text-ink" @click="logOut">Sign out</button>
    </div>

    <section class="mb-8">
      <h2 class="mb-2 text-xs font-medium uppercase tracking-widest text-accent">Second factor</h2>
      <ul v-if="enrolled.length">
        <li v-for="f in enrolled" :key="f.id" class="flex items-center justify-between border-b border-line py-3 text-sm">
          <span>{{ f.name }}</span>
          <button type="button" class="text-muted" :disabled="busy" @click="remove(f.id)">Remove</button>
        </li>
      </ul>
      <template v-else-if="!secret">
        <p class="mb-3 text-sm text-muted">{{ isAdult ? "Use Google Authenticator, 1Password or any authenticator app." : "Adults only." }}</p>
        <button v-if="isAdult" type="button" class="h-12 w-full rounded-full bg-accent font-medium text-ink disabled:opacity-50" :disabled="busy" @click="start">Turn on</button>
      </template>
      <template v-else>
        <p class="mb-2 text-sm text-muted">Add this key to your authenticator app, then enter the code it shows.</p>
        <a :href="otpauth" class="mb-2 block text-sm text-accent">Open in an authenticator app</a>
        <code class="mb-3 block break-all rounded-xl border border-line bg-panel p-3 text-xs">{{ secret.secretKey }}</code>
        <input v-model="code" inputmode="numeric" autocomplete="one-time-code" placeholder="6-digit code" class="mb-2 h-12 w-full rounded-xl border border-line bg-panel px-3.5 outline-none focus:border-accent" />
        <button type="button" class="h-12 w-full rounded-full bg-accent font-medium text-ink disabled:opacity-50" :disabled="busy || code.trim().length < 6" @click="finish">Confirm</button>
      </template>
    </section>
  </div>
</template>
