import { defineConfig } from "@playwright/test";

const previewPort = Number.parseInt(
  process.env.COURSE_PREVIEW_PORT ?? "4175",
  10,
);
if (
  !Number.isInteger(previewPort) ||
  previewPort < 1024 ||
  previewPort > 65535
) {
  throw new Error("COURSE_PREVIEW_PORT must be an available user port");
}
const previewOrigin = `http://127.0.0.1:${previewPort}`;

export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: false,
  workers: 1,
  reporter: [["list"]],
  use: {
    baseURL: previewOrigin,
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "stable-chrome",
      use: {
        browserName: "chromium",
        channel: "chrome",
        viewport: { width: 1440, height: 900 },
      },
    },
  ],
  webServer: {
    command: `npm run preview -- --port ${previewPort}`,
    url: previewOrigin,
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
