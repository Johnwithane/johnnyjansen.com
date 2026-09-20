import { defineConfig } from "vitest/config";

// Firestore rules tests. Separate config: Node environment, a live emulator
// on 127.0.0.1:8080, and no file parallelism because every spec clears the
// same emulator. Run via `npm run test:rules` (wraps emulators:exec).
export default defineConfig({
  test: {
    include: ["tests/rules/**/*.test.ts"],
    environment: "node",
    fileParallelism: false,
    testTimeout: 15_000,
    hookTimeout: 20_000,
  },
});
