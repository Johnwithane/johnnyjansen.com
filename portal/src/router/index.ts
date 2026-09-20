import { createRouter, createWebHistory } from "vue-router";
import { useAuth } from "@/composables/useAuth";

// Three states: signed out (login), signed in with no household (onboarding
// or an invite link), member (everything else).
export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: "/login", name: "login", component: () => import("@/views/LoginView.vue") },
    { path: "/start", name: "start", component: () => import("@/views/OnboardingView.vue") },
    { path: "/invite/:hid/:inviteId", name: "invite", component: () => import("@/views/InviteView.vue") },
    { path: "/", name: "today", component: () => import("@/views/TodayView.vue") },
    { path: "/tasks", name: "tasks", component: () => import("@/views/TasksView.vue") },
    { path: "/digests", name: "digests", component: () => import("@/views/DigestsView.vue") },
    { path: "/household", name: "household", component: () => import("@/views/HouseholdView.vue") },
    { path: "/:pathMatch(.*)*", redirect: "/" },
  ],
});

router.beforeEach(async (to) => {
  const { ready, user, isMember } = useAuth();
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
  const signedIn = !!user.value;
  if (to.name === "invite") return signedIn ? true : { name: "login", query: { next: to.fullPath } };
  if (!signedIn) return to.name === "login" ? true : { name: "login", query: { next: to.fullPath } };
  if (!isMember.value) return to.name === "start" ? true : { name: "start" };
  if (to.name === "login" || to.name === "start") return { name: "today" };
  return true;
});
