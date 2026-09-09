import tailwindcss from "@tailwindcss/vite";
import { SITE_URL, SITE_NAME, SITE_DESCRIPTION } from "./app/data/site";
import { projects } from "./app/data/projects";
import { prototypes } from "./app/data/lab";

// Prerendered static site. Every route is baked to HTML at build time so
// Google and the AI crawlers (none of which run JavaScript) read the same
// page a visitor does. There is no server at runtime. See docs/ARCHITECTURE.md.
const projectRoutes = projects.map((p) => `/work/${p.slug}`);
const labRoutes = prototypes.map((p) => `/lab/${p.slug}`);
const publicRoutes = ["/", "/work", "/how-i-build", "/about", "/contact", "/resume", "/lab"];

export default defineNuxtConfig({
  compatibilityDate: "2026-09-01",
  devtools: { enabled: false },
  ssr: true,
  modules: ["@nuxt/eslint", "@nuxtjs/sitemap", "@vite-pwa/nuxt", "nuxt-gtag"],
  css: ["~/assets/css/main.css"],
  vite: { plugins: [tailwindcss()] },
  site: { url: SITE_URL, name: SITE_NAME },
  runtimeConfig: {
    public: {
      siteUrl: SITE_URL,
      formEndpoint: process.env.NUXT_PUBLIC_FORM_ENDPOINT ?? "",
      // The lab's Firebase project. All empty = the lab shows "not configured"
      // and the portfolio is unaffected.
      firebase: {
        apiKey: process.env.NUXT_PUBLIC_FIREBASE_API_KEY ?? "",
        authDomain: process.env.NUXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? "",
        projectId: process.env.NUXT_PUBLIC_FIREBASE_PROJECT_ID ?? "",
        storageBucket: process.env.NUXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? "",
        appId: process.env.NUXT_PUBLIC_FIREBASE_APP_ID ?? "",
      },
    },
  },
  routeRules: {
    // The admin console is an app, not a page: client rendered, never indexed.
    "/lab/admin": { ssr: false, robots: false },
  },
  app: {
    head: {
      htmlAttrs: { lang: "en-CA" },
      titleTemplate: `%s | ${SITE_NAME}`,
      meta: [
        { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
        { name: "theme-color", content: "#050505" },
        { name: "description", content: SITE_DESCRIPTION },
      ],
      link: [
        { rel: "icon", href: "/favicon.ico" },
        { rel: "apple-touch-icon", href: "/icons/icon-192.png" },
        {
          rel: "stylesheet",
          href: "https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500;12..96,600;12..96,700&family=Source+Sans+3:ital,wght@0,400;0,600;1,400&family=JetBrains+Mono:wght@400;500&display=swap",
        },
      ],
    },
  },
  nitro: {
    prerender: {
      crawlLinks: true,
      routes: [...publicRoutes, ...projectRoutes, ...labRoutes, "/llms.txt"],
    },
  },
  sitemap: {
    // Draft projects are prerendered (so a preview link works) but stay out
    // of the sitemap and carry noindex until they are cleared to publish.
    exclude: [
      ...projects.filter((p) => p.draft).map((p) => `/work/${p.slug}`),
      ...prototypes.filter((p) => p.access === "private").map((p) => `/lab/${p.slug}`),
      "/lab/admin",
    ],
  },
  gtag: {
    // Empty id disables the module entirely. Set NUXT_PUBLIC_GTAG_ID at build.
    id: process.env.NUXT_PUBLIC_GTAG_ID ?? "",
    enabled: Boolean(process.env.NUXT_PUBLIC_GTAG_ID),
  },
  pwa: {
    // Installable, nothing more. No offline precache of pages: a portfolio has
    // nothing to do offline, and a stale precached page is worse than none.
    registerType: "autoUpdate",
    manifest: {
      name: SITE_NAME,
      short_name: "Johnny Jansen",
      description: SITE_DESCRIPTION,
      theme_color: "#050505",
      background_color: "#050505",
      display: "standalone",
      start_url: "/",
      icons: [
        { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
        { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
        { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
      ],
    },
    workbox: {
      globPatterns: ["_nuxt/**/*.{js,css}"],
      globIgnores: ["wishbone/**", "tools/**", "videos/**", "**/*.mp4"],
      navigateFallback: undefined,
      runtimeCaching: [],
    },
  },
  eslint: { config: { stylistic: false } },
  typescript: { strict: true, typeCheck: false },
});
