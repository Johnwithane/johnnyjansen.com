<script setup lang="ts">
import type { Task, WithId } from "@/firebase/interfaces";
import { dueLabel } from "@/utils/format";

defineProps<{ task: WithId<Task> }>();

const emit = defineEmits<{
  toggle: [id: string, done: boolean];
  remove: [id: string];
}>();
</script>

<template>
  <li class="flex items-start gap-3 border-b border-line py-3">
    <button
      type="button"
      class="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-line"
      :class="task.done ? 'border-accent bg-accent text-ink' : ''"
      :aria-label="task.done ? 'Reopen' : 'Done'"
      @click="emit('toggle', task.id, !task.done)"
    >
      <span v-if="task.done" class="text-xs font-bold">✓</span>
    </button>
    <div class="min-w-0 flex-1">
      <p class="break-words" :class="task.done ? 'text-muted line-through' : ''">{{ task.title }}</p>
      <p v-if="task.due || task.notes || task.visibility === 'private'" class="mt-0.5 text-xs text-muted">
        <span v-if="task.visibility === 'private'">Private</span>
        <span v-if="task.visibility === 'private' && (task.due || task.notes)"> · </span>
        <span v-if="task.due">Due {{ dueLabel(task.due) }}</span>
        <span v-if="task.due && task.notes"> · </span>
        <span v-if="task.notes">{{ task.notes }}</span>
      </p>
    </div>
    <button type="button" class="px-1 text-muted" aria-label="Delete" @click="emit('remove', task.id)">×</button>
  </li>
</template>
