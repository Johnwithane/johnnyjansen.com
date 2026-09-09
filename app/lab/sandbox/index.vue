<script setup lang="ts">
// The reference prototype. A shared scratch board: one document, everyone
// who can open the lab can edit it, live. Copy this folder to start a new
// prototype and register it in app/data/lab.ts.
import { doc, onSnapshot, setDoc, serverTimestamp } from "firebase/firestore";

const fb = useFirebase();
const text = ref("");
const saved = ref(true);
let unsub: (() => void) | undefined;
let timer: ReturnType<typeof setTimeout> | undefined;

onMounted(() => {
  if (!fb) return;
  unsub = onSnapshot(doc(fb.db, "labs/sandbox/data/board"), (snap) => {
    const remote = (snap.data()?.text as string | undefined) ?? "";
    if (saved.value) text.value = remote;
  });
});
onUnmounted(() => unsub?.());

watch(text, () => {
  saved.value = false;
  clearTimeout(timer);
  timer = setTimeout(async () => {
    if (!fb) return;
    await setDoc(doc(fb.db, "labs/sandbox/data/board"), { text: text.value, updatedAt: serverTimestamp() }, { merge: true });
    saved.value = true;
  }, 600);
});
</script>

<template>
  <div class="rounded-lg border border-line bg-surface p-5">
    <div class="flex items-center justify-between">
      <p class="font-display font-semibold">Shared board</p>
      <span class="font-mono text-xs text-ink-3">{{ saved ? "Saved" : "Saving" }}</span>
    </div>
    <textarea v-model="text" rows="10" class="mt-3 w-full rounded-md border border-line bg-bg p-3 font-mono text-sm" placeholder="Type. Anyone with the link sees it live." />
  </div>
</template>
