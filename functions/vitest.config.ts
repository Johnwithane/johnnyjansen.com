import { defineConfig } from "vitest/config";

// Pure logic only (digest building, date math, request schemas). Nothing here
// touches Firestore or Google; those seams are passed in as plain data.
export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    clearMocks: true,
  },
});
