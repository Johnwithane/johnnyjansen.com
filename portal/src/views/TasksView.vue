<script setup lang="ts">
import { onMounted, onUnmounted, ref } from "vue";
import type { Task, WithId } from "@/firebase/interfaces";
import { createTask, deleteTask, setTaskDone, subscribeTasks } from "@/firebase/services/tasksService";
import TaskRow from "@/components/TaskRow.vue";

const open = ref<WithId<Task>[]>([]);
const done = ref<WithId<Task>[]>([]);
const showDone = ref(false);
const title = ref("");
const due = ref("");
const note = ref("");
const stops: (() => void)[] = [];

onMounted(() => {
  stops.push(subscribeTasks(false, (items) => (open.value = items)));
  stops.push(subscribeTasks(true, (items) => (done.value = items)));
});
onUnmounted(() => stops.forEach((s) => s()));

function fail(e: unknown) {
  note.value = e instanceof Error ? e.message : "Something failed";
}

function add() {
  const t = title.value.trim();
  if (!t) return;
  // Not awaited: offline, the ack never comes but the list already shows it.
  createTask({ title: t, due: due.value || null }).catch(fail);
  title.value = "";
  due.value = "";
}

function toggle(id: string, isDone: boolean) {
  setTaskDone(id, isDone).catch(fail);
}

function remove(id: string) {
  deleteTask(id).catch(fail);
}
</script>

<template>
  <div>
    <h1 class="mb-4 text-xl font-medium">Tasks</h1>

    <form class="mb-6 flex flex-col gap-2" @submit.prevent="add">
      <input
        v-model="title"
        type="text"
        placeholder="Add a task"
        enterkeyhint="done"
        class="w-full rounded-lg border border-line bg-panel px-3 py-2 outline-none focus:border-accent"
      />
      <div class="flex gap-2">
        <input
          v-model="due"
          type="date"
          class="flex-1 rounded-lg border border-line bg-panel px-3 py-2 text-muted outline-none focus:border-accent"
        />
        <button type="submit" class="rounded-lg bg-accent px-4 font-medium text-ink" :disabled="!title.trim()">Add</button>
      </div>
    </form>

    <p v-if="note" class="mb-3 text-sm text-danger">{{ note }}</p>

    <p v-if="open.length === 0" class="text-muted">No open tasks.</p>
    <ul v-else>
      <TaskRow v-for="t in open" :key="t.id" :task="t" @toggle="toggle" @remove="remove" />
    </ul>

    <button type="button" class="mt-6 text-sm text-muted" @click="showDone = !showDone">
      {{ showDone ? "Hide" : "Show" }} done ({{ done.length }})
    </button>
    <ul v-if="showDone" class="mt-2">
      <TaskRow v-for="t in done" :key="t.id" :task="t" @toggle="toggle" @remove="remove" />
    </ul>
  </div>
</template>
