import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  test: { include: ["tests/**/*.test.ts"], exclude: ["tests/rules/**", "**/node_modules/**"], environment: "node" },
  resolve: { alias: { "~": fileURLToPath(new URL("./app", import.meta.url)) } },
});
