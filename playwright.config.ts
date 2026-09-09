import { defineConfig } from "@playwright/test";

// Runs against the generated static output, exactly what Firebase Hosting serves.
export default defineConfig({
  testDir: "e2e",
  timeout: 30_000,
  use: {
    baseURL: "http://localhost:4173",
    // CI installs Chromium; a sandbox with a preinstalled build sets PW_CHROMIUM.
    launchOptions: { executablePath: process.env.PW_CHROMIUM || undefined },
  },
  webServer: {
    command: "python3 -m http.server 4173 -d .output/public",
    url: "http://localhost:4173",
    reuseExistingServer: true,
    timeout: 60_000,
  },
});
