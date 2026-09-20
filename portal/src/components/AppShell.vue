<script setup lang="ts">
import { ref } from "vue";
import { useAuth } from "@/composables/useAuth";
import { BRAND_NAME } from "@/seo/site";
import ReportDialog from "@/components/ReportDialog.vue";

const { logOut } = useAuth();
const reporting = ref(false);
const thanks = ref(false);
function filed() {
  thanks.value = true;
  setTimeout(() => (thanks.value = false), 2500);
}

const tabs = [
  { to: "/", label: "Today" },
  { to: "/tasks", label: "Tasks" },
  { to: "/digests", label: "Digests" },
  { to: "/household", label: "Household" },
];
</script>

<template>
  <div class="mx-auto flex min-h-dvh max-w-2xl flex-col px-4">
    <header class="flex items-center justify-between py-4">
      <RouterLink to="/" class="text-sm font-medium tracking-wide text-accent">{{ BRAND_NAME }}</RouterLink>
      <div class="flex items-center gap-4">
        <button type="button" class="text-sm text-muted" @click="reporting = true">Report</button>
        <button type="button" class="text-sm text-muted" @click="logOut">Sign out</button>
      </div>
    </header>

    <main class="flex-1 pb-24">
      <p v-if="thanks" class="mb-3 text-sm text-accent">Report sent. Thanks.</p>
      <slot />
    </main>
    <ReportDialog v-if="reporting" @close="reporting = false" @filed="filed" />

    <nav
      class="fixed inset-x-0 bottom-0 border-t border-line bg-ink/95 backdrop-blur"
      style="padding-bottom: env(safe-area-inset-bottom, 0px)"
    >
      <div class="mx-auto flex max-w-2xl">
        <RouterLink
          v-for="t in tabs"
          :key="t.to"
          :to="t.to"
          class="flex-1 py-3 text-center text-sm text-muted"
          active-class="text-accent"
          exact-active-class="text-accent"
        >
          {{ t.label }}
        </RouterLink>
      </div>
    </nav>
  </div>
</template>
