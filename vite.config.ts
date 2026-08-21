import path from "node:path";
import { fileURLToPath } from "node:url";

import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));
const requestedBasePath = process.env.COURSE_BASE_PATH?.trim() || "/";
if (
  requestedBasePath.includes(":") ||
  requestedBasePath.includes("?") ||
  requestedBasePath.includes("#")
) {
  throw new Error("COURSE_BASE_PATH must be a URL path, not a full URL");
}
const basePath =
  requestedBasePath === "/"
    ? "/"
    : `/${requestedBasePath.replace(/^\/+|\/+$/g, "")}/`;
const isolationHeaders = {
  "Cross-Origin-Opener-Policy": "same-origin",
  "Cross-Origin-Embedder-Policy": "require-corp",
  "Cross-Origin-Resource-Policy": "same-origin",
};

export default defineConfig({
  base: basePath,
  plugins: [react()],
  assetsInclude: ["**/*.wasm"],
  optimizeDeps: {
    exclude: ["@micropython/micropython-webassembly-pyscript"],
  },
  worker: {
    format: "es",
  },
  server: {
    port: 5173,
    strictPort: true,
    headers: isolationHeaders,
  },
  preview: {
    port: 4173,
    strictPort: true,
    headers: isolationHeaders,
  },
  build: {
    target: "es2022",
    rollupOptions: {
      input: {
        home: path.resolve(projectRoot, "index.html"),
        ide: path.resolve(projectRoot, "ide/index.html"),
        monitor: path.resolve(projectRoot, "monitor/index.html"),
        dashboard: path.resolve(projectRoot, "dashboard/index.html"),
        guide: path.resolve(projectRoot, "guide/index.html"),
        commission: path.resolve(projectRoot, "commission/index.html"),
      },
    },
  },
  test: {
    environment: "node",
    include: ["apps/**/*.test.ts", "packages/**/*.test.ts"],
    coverage: {
      reporter: ["text", "html"],
    },
  },
});
