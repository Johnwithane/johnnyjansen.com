<script setup lang="ts">
import { PERSON_COLOURS, type PersonColour } from "@/firebase/interfaces";

const model = defineModel<PersonColour>({ required: true });
</script>

<template>
  <div class="flex gap-3" role="radiogroup" aria-label="Colour">
    <button
      v-for="c in PERSON_COLOURS"
      :key="c"
      type="button"
      role="radio"
      :aria-checked="model === c"
      :aria-label="c"
      class="h-11 w-11 rounded-full border-2"
      :class="model === c ? 'border-fg' : 'border-transparent'"
      :style="{ background: c }"
      @click="model = c"
    ></button>
  </div>
</template>
