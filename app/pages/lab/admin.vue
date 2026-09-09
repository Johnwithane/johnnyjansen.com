<script setup lang="ts">
import { collection, doc, getDocs, limit, orderBy, query, setDoc, serverTimestamp, type Timestamp } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { prototypes } from "~/data/lab";

definePageMeta({ layout: "default" });
useSeo({ title: "Lab admin", description: "Owner console for the lab.", path: "/lab/admin", noindex: true });

const fb = useFirebase();
const { configured, ready, user, isAdmin, signInWithGoogle, signOut } = useLabAuth();

interface Feedback { id: string; kind: string; text: string; path: string; createdAt?: Timestamp }
const feedback = ref<Record<string, Feedback[]>>({});
const passwords = reactive<Record<string, string>>({});
const note = ref("");

async function loadFeedback(slug: string) {
  if (!fb) return;
  const snap = await getDocs(query(collection(fb.db, `labs/${slug}/feedback`), orderBy("createdAt", "desc"), limit(50)));
  feedback.value[slug] = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Feedback, "id">) }));
}

async function publishRegistry() {
  if (!fb) return;
  for (const p of prototypes) {
    await setDoc(doc(fb.db, `labMeta/${p.slug}`), { public: p.access === "public", name: p.name, updatedAt: serverTimestamp() });
  }
  note.value = "Registry published. Rules now know which prototypes are public.";
}

async function setPassword(slug: string) {
  if (!fb || !passwords[slug]) return;
  await httpsCallable(fb.functions, "setPrototypePassword")({ slug, password: passwords[slug] });
  passwords[slug] = "";
  note.value = `Password set for ${slug}.`;
}

watch(isAdmin, (v) => v && prototypes.forEach((p) => loadFeedback(p.slug)), { immediate: true });
</script>

<template>
  <div class="mx-auto max-w-4xl px-5 py-14">
    <p class="eyebrow text-ink-3">Lab</p>
    <h1 class="mt-1 text-3xl font-bold">Admin</h1>

    <ClientOnly>
      <div v-if="!configured" class="mt-6 text-sm text-ink-2">Firebase is not configured in this build.</div>
      <div v-else-if="!ready" class="mt-6 text-sm text-ink-3">Loading</div>
      <div v-else-if="!isAdmin" class="mt-6">
        <p class="text-sm text-ink-2">
          {{ user && !user.isAnonymous ? "This account is not an admin." : "Owner sign-in." }}
        </p>
        <button type="button" class="mt-3 rounded-md bg-dark-bg px-4 py-2 text-sm font-semibold text-mint" @click="signInWithGoogle">Sign in with Google</button>
      </div>
      <div v-else class="mt-6 space-y-8">
        <div class="flex flex-wrap items-center gap-3 text-sm">
          <span class="text-ink-2">{{ user?.email }}</span>
          <button type="button" class="rounded-md border border-line px-3 py-1" @click="publishRegistry">Publish registry</button>
          <button type="button" class="text-ink-3" @click="signOut">Sign out</button>
          <span v-if="note" class="text-accent">{{ note }}</span>
        </div>

        <section v-for="p in prototypes" :key="p.slug" class="rounded-lg border border-line bg-surface p-5">
          <div class="flex flex-wrap items-baseline justify-between gap-2">
            <h2 class="font-display text-lg font-semibold">{{ p.name }} <span class="ml-2 font-mono text-xs text-ink-3">{{ p.slug }} · {{ p.access }}</span></h2>
            <NuxtLink :to="`/lab/${p.slug}`" class="text-sm text-accent">Open</NuxtLink>
          </div>
          <form v-if="p.access === 'private'" class="mt-3 flex gap-2" @submit.prevent="setPassword(p.slug)">
            <input v-model="passwords[p.slug]" type="text" placeholder="New password" class="rounded-md border border-line bg-bg px-3 py-1.5 text-sm" >
            <button type="submit" class="rounded-md border border-line px-3 py-1.5 text-sm">Set</button>
          </form>
          <div class="mt-4">
            <p class="eyebrow text-ink-3">Feedback ({{ feedback[p.slug]?.length ?? 0 }})</p>
            <ul class="mt-2 divide-y divide-line text-sm">
              <li v-for="f in feedback[p.slug] ?? []" :key="f.id" class="py-2">
                <span class="font-mono text-xs text-accent">{{ f.kind }}</span>
                <span class="ml-2 text-ink-2">{{ f.text }}</span>
                <span class="ml-2 font-mono text-xs text-ink-3">{{ f.path }}</span>
              </li>
            </ul>
          </div>
        </section>
      </div>
    </ClientOnly>
  </div>
</template>
