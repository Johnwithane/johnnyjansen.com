<script setup lang="ts">
import { ref } from "vue";
import { useRoute } from "vue-router";
import { useAuth } from "@/composables/useAuth";
import type { FeedbackType } from "@/firebase/interfaces";
import { fileReport, uploadScreenshots } from "@/firebase/services/feedbackService";
import { environmentDump } from "@/utils/environment";

// The report control (FAMILY_PLAN.md 4.18). One line, a type, up to three
// screenshots. Screen, build and device ride along. Offline, the report
// itself queues; screenshots need a connection, so they are refused then.

const emit = defineEmits<{ close: []; filed: [] }>();
const route = useRoute();
const { hid, uid, user } = useAuth();

const type = ref<FeedbackType>("bug");
const description = ref("");
const files = ref<File[]>([]);
const busy = ref(false);
const note = ref("");

const TYPES: { id: FeedbackType; label: string }[] = [
  { id: "bug", label: "Bug" },
  { id: "idea", label: "Idea" },
  { id: "improvement", label: "Improvement" },
];

function pick(e: Event) {
  const input = e.target as HTMLInputElement;
  files.value = Array.from(input.files ?? []).slice(0, 3);
}

async function send() {
  if (!hid.value || !uid.value) return;
  const text = description.value.trim();
  if (!text) return;
  busy.value = true;
  note.value = "";
  try {
    let paths: string[] = [];
    if (files.value.length) {
      if (!navigator.onLine) {
        note.value = "Screenshots need a connection. Send without, or try again online.";
        busy.value = false;
        return;
      }
      paths = await uploadScreenshots(hid.value, uid.value, files.value);
    }
    fileReport(hid.value, uid.value, {
      type: type.value,
      description: text,
      route: route.fullPath,
      url: window.location.href,
      environment: environmentDump(),
      appVersion: import.meta.env.VITE_APP_VERSION ?? "dev",
      screenshotPaths: paths,
      reporterName: user.value?.displayName?.split(" ")[0] ?? "",
    }).catch(() => undefined);
    emit("filed");
    emit("close");
  } catch {
    note.value = "Could not upload the screenshot.";
  } finally {
    busy.value = false;
  }
}
</script>

<template>
  <div class="fixed inset-0 z-50 flex items-end justify-center bg-ink/80" @click.self="emit('close')">
    <div class="w-full max-w-2xl rounded-t-2xl border-t border-line bg-ink px-5 pt-5" style="padding-bottom: calc(20px + env(safe-area-inset-bottom, 0px))">
      <div class="mb-4 flex items-center justify-between">
        <h2 class="text-lg font-medium">Report</h2>
        <button type="button" class="px-2 text-muted" aria-label="Close" @click="emit('close')">×</button>
      </div>
      <div class="mb-3 flex gap-2">
        <button
          v-for="t in TYPES"
          :key="t.id"
          type="button"
          class="rounded-full border border-line px-3.5 py-2 text-sm"
          :class="type === t.id ? 'bg-accent text-ink' : 'text-muted'"
          @click="type = t.id"
        >
          {{ t.label }}
        </button>
      </div>
      <label for="report-text" class="mb-1 block text-sm text-muted">What happened</label>
      <textarea
        id="report-text"
        v-model="description"
        rows="3"
        maxlength="4000"
        class="mb-3 w-full resize-none rounded-xl border border-line bg-panel px-3.5 py-3 outline-none focus:border-accent"
      ></textarea>
      <label class="mb-3 block text-sm text-muted">
        Screenshots, up to three
        <input type="file" accept="image/*" multiple class="mt-1 block w-full text-sm" @change="pick" />
      </label>
      <p class="mb-3 text-xs text-muted">Screen, build and device ride along.</p>
      <p v-if="note" class="mb-3 text-sm text-danger">{{ note }}</p>
      <button type="button" class="h-12 w-full rounded-full bg-accent font-medium text-ink disabled:opacity-50" :disabled="busy || !description.trim()" @click="send">
        {{ busy ? "Sending" : "Send report" }}
      </button>
    </div>
  </div>
</template>
