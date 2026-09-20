<script setup lang="ts">
defineProps<{ active: "calendar" | "tasks" }>();
</script>

<template>
  <div class="mb-5 flex gap-5 text-[15px]">
    <RouterLink to="/calendar" class="pb-1" :class="active === 'calendar' ? 'border-b border-accent text-accent' : 'text-muted'">Calendar</RouterLink>
    <RouterLink to="/tasks" class="pb-1" :class="active === 'tasks' ? 'border-b border-accent text-accent' : 'text-muted'">Tasks</RouterLink>
  </div>
</template>
