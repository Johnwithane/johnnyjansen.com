import { createRouter, createWebHistory } from "vue-router";
import { useAuth } from "@/composables/useAuth";

export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: "/login", name: "login", component: () => import("@/views/LoginView.vue") },
    { path: "/", name: "home", component: () => import("@/views/HomeView.vue") },
    { path: "/:pathMatch(.*)*", redirect: "/" },
  ],
});

router.beforeEach(async (to) => {
  const { ready, user } = useAuth();
  if (!ready.value) await new Promise<void>((r) => { const t = setInterval(() => { if (ready.value) { clearInterval(t); r(); } }, 50); });
  if (!user.value) return to.name === "login" ? true : { name: "login" };
  if (to.name === "login") return { name: "home" };
  return true;
});
