import type { Component } from "vue";

// Component prototypes are loaded on demand so a prototype's code never
// lands in the portfolio bundle. Register new ones here, keyed by the slug
// in app/data/lab.ts. Lives here, not in data/, because nuxt.config imports
// data/ at build time and cannot resolve .vue modules.
export const prototypeLoaders: Record<string, () => Promise<{ default: Component }>> = {
  sandbox: () => import("~/lab/sandbox/index.vue"),
};
