import { defineConfig } from "vitest/config";

// Rules tests talk to the Firestore emulator on 8080 and share one instance,
// so spec files run one at a time. `pnpm test:rules` wraps this in
// `firebase emulators:exec`.
export default defineConfig({
  test: {
    include: ["tests/rules/**/*.test.ts"],
    environment: "node",
    fileParallelism: false,
    testTimeout: 15_000,
    hookTimeout: 30_000,
  },
});
