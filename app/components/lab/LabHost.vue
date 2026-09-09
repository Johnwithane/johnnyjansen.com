<script setup lang="ts">
import type { Prototype } from "~/data/lab";
import { prototypeLoaders } from "~/lab/registry";

const props = defineProps<{ proto: Prototype }>();
const { configured, ready, canOpen } = useLabAuth();

const isStatic = computed(() => props.proto.kind === "static");
const allowed = computed(() => props.proto.access === "public" || canOpen(props.proto.slug));
const Component = computed(() => {
  const loader = prototypeLoaders[props.proto.slug];
  return loader ? defineAsyncComponent(loader) : null;
});
</script>

<template>
  <div>
    <!-- Static HTML prototypes need no backend: link out and embed. -->
    <div v-if="isStatic && proto.href">
      <a :href="proto.href" target="_blank" rel="noopener" class="text-sm font-semibold text-accent">Open full screen</a>
      <iframe :src="proto.href" :title="proto.name" class="mt-3 h-[70vh] w-full rounded-lg border border-line bg-surface" loading="lazy" />
    </div>

    <div v-else-if="!configured" class="rounded-lg border border-line bg-surface p-6 text-sm text-ink-2">
      This prototype needs the lab backend, which is not configured in this build.
    </div>

    <div v-else-if="!ready" class="rounded-lg border border-line bg-surface p-6 text-sm text-ink-3">Checking access</div>

    <LabPasswordGate v-else-if="!allowed" :slug="proto.slug" />

    <div v-else>
      <component :is="Component" v-if="Component" />
      <p v-else class="text-sm text-ink-3">No component is registered for this prototype.</p>
    </div>

    <LabFeedback v-if="configured && (isStatic || allowed)" :slug="proto.slug" />
  </div>
</template>
