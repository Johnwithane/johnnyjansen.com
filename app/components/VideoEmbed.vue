<script setup lang="ts">
// Click-to-load facade. Fifty iframes on one page was the old site's biggest
// performance problem; nothing loads until someone asks for it.
const props = defineProps<{ provider: "vimeo" | "youtube"; id: string; title?: string }>();
const playing = ref(false);
const src = computed(() =>
  props.provider === "youtube"
    ? `https://www.youtube-nocookie.com/embed/${props.id}?autoplay=1&rel=0`
    : `https://player.vimeo.com/video/${props.id}?autoplay=1`,
);
const poster = computed(() =>
  props.provider === "youtube" ? `https://i.ytimg.com/vi/${props.id}/hqdefault.jpg` : null,
);
const label = computed(() => props.title ?? `Play video`);
</script>

<template>
  <figure class="m-0">
    <div class="relative aspect-video overflow-hidden rounded-md bg-dark-surface">
      <iframe
        v-if="playing"
        :src="src"
        :title="label"
        class="absolute inset-0 h-full w-full"
        allow="autoplay; fullscreen; picture-in-picture"
        allowfullscreen
      />
      <button
        v-else
        type="button"
        class="group absolute inset-0 flex h-full w-full items-center justify-center"
        :aria-label="label"
        @click="playing = true"
      >
        <img
          v-if="poster"
          :src="poster"
          alt=""
          loading="lazy"
          class="absolute inset-0 h-full w-full object-cover opacity-80 transition-opacity group-hover:opacity-100"
        >
        <span
          class="relative flex h-16 w-16 items-center justify-center rounded-full bg-mint text-dark-bg shadow-lg transition-transform group-hover:scale-105"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M8 5v14l11-7z" />
          </svg>
        </span>
      </button>
    </div>
    <figcaption v-if="title" class="mt-2 text-sm text-ink-3">{{ title }}</figcaption>
  </figure>
</template>
