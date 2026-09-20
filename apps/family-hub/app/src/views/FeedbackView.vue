<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from "vue";
import { useAuth } from "@/composables/useAuth";
import type { Feedback, FeedbackStatus, WithId } from "@/firebase/interfaces";
import { subscribeFeedback, triageReport } from "@/firebase/services/feedbackService";
import { ago } from "@/utils/format";

const { hid, isAdult } = useAuth();
const items = ref<WithId<Feedback>[]>([]);
let stop: (() => void) | null = null;
onMounted(() => {
  if (hid.value) stop = subscribeFeedback(hid.value, (i) => (items.value = i));
});
onUnmounted(() => stop?.());

const LABEL: Record<FeedbackStatus, string> = { open: "Open", triaged: "Triaged", in_progress: "In progress", shipped: "Shipped", wontfix: "Won't do" };
const openItems = computed(() => items.value.filter((i) => i.status !== "shipped" && i.status !== "wontfix"));
const closedItems = computed(() => items.value.filter((i) => i.status === "shipped" || i.status === "wontfix"));
const showClosed = ref(false);

function setStatus(id: string, status: Exclude<FeedbackStatus, "shipped">) {
  if (hid.value) triageReport(hid.value, id, status).catch(() => undefined);
}
</script>

<template>
  <div>
    <h1 class="mb-1 text-xl font-medium">Feedback</h1>
    <p class="mb-6 text-xs text-muted">Bugs, ideas and improvements from anyone in the house. Shipped means it is live.</p>

    <p v-if="openItems.length === 0" class="text-muted">Nothing open.</p>
    <ul>
      <li v-for="r in openItems" :key="r.id" class="border-b border-line py-3">
        <p class="text-sm">{{ r.description }}</p>
        <p class="mt-1 text-xs text-muted">
          {{ r.type }} · {{ r.reporterName }} · {{ ago(r.createdAt?.toDate?.()) }} · {{ LABEL[r.status] }}<span v-if="r.screenshotPaths.length"> · {{ r.screenshotPaths.length }} screenshot{{ r.screenshotPaths.length === 1 ? "" : "s" }}</span>
          <a v-if="r.githubIssueUrl" :href="r.githubIssueUrl" target="_blank" rel="noopener" class="text-accent"> · issue</a>
        </p>
        <p v-if="r.notes" class="mt-1 text-xs text-muted">Notes: {{ r.notes }}</p>
        <div v-if="isAdult" class="mt-2 flex flex-wrap gap-2">
          <button v-for="s in (['open', 'triaged', 'in_progress', 'wontfix'] as const)" :key="s" type="button" class="rounded-full border border-line px-3 py-1 text-xs" :class="r.status === s ? 'text-accent' : 'text-muted'" @click="setStatus(r.id, s)">
            {{ LABEL[s] }}
          </button>
        </div>
      </li>
    </ul>

    <button v-if="closedItems.length" type="button" class="mt-6 text-sm text-muted" @click="showClosed = !showClosed">{{ showClosed ? "Hide" : "Show" }} done ({{ closedItems.length }})</button>
    <ul v-if="showClosed" class="mt-2">
      <li v-for="r in closedItems" :key="r.id" class="border-b border-line py-3">
        <p class="text-sm text-muted">{{ r.description }}</p>
        <p class="mt-1 text-xs text-muted">{{ LABEL[r.status] }}<span v-if="r.shippedAt"> {{ ago(r.shippedAt.toDate()) }}</span><span v-if="r.shippedVersion"> · build {{ r.shippedVersion }}</span></p>
      </li>
    </ul>
  </div>
</template>
