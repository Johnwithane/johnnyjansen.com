import { createRouter, createWebHistory } from "vue-router";
import { useAuth } from "@/composables/useAuth";

export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: "/login", name: "login", component: () => import("@/views/LoginView.vue") },
    { path: "/", name: "today", component: () => import("@/views/TodayView.vue") },
    { path: "/tasks", name: "tasks", component: () => import("@/views/TasksView.vue") },
    { path: "/digests", name: "digests", component: () => import("@/views/DigestsView.vue") },
    { path: "/:pathMatch(.*)*", redirect: "/" },
  ],
});

router.beforeEach(async (to) => {
  const { ready, isOwner } = useAuth();
  if (!ready.value) {
    await new Promise<void>((resolve) => {
      const stop = setInterval(() => {
        if (ready.value) {
          clearInterval(stop);
          resolve();
        }
      }, 50);
    });
  }
  if (to.name !== "login" && !isOwner.value) return { name: "login" };
  if (to.name === "login" && isOwner.value) return { name: "today" };
  return true;
});
