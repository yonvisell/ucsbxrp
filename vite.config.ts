import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

import react from "@vitejs/plugin-react";
import type { Plugin } from "vite";
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

function developmentCourseFiles(): Plugin {
  const commissioningRoot = path.resolve(
    projectRoot,
    ".vite/course/commissioning",
  );
  const currentReleaseRoot = path.resolve(projectRoot, "vendor/current");
  const commissioningRoute = `${basePath}course/commissioning/`;
  const currentReleaseRoute = `${basePath}course/current/`;

  return {
    name: "ucsb-xrp-development-course-files",
    configureServer(server) {
      execFileSync(
        "python3",
        [
          path.resolve(projectRoot, "scripts/build_commissioning_bundle.py"),
          commissioningRoot,
        ],
        { cwd: projectRoot, stdio: "inherit" },
      );

      server.middlewares.use((request, response, next) => {
        const pathname = new URL(request.url ?? "/", "http://127.0.0.1")
          .pathname;
        const route = pathname.startsWith(commissioningRoute)
          ? commissioningRoute
          : pathname.startsWith(currentReleaseRoute)
            ? currentReleaseRoute
            : null;
        if (route === null) {
          next();
          return;
        }
        const root =
          route === commissioningRoute ? commissioningRoot : currentReleaseRoot;
        const relativePath = decodeURIComponent(pathname.slice(route.length));
        const filePath = path.resolve(root, relativePath);
        if (!filePath.startsWith(`${root}${path.sep}`)) {
          response.statusCode = 400;
          response.setHeader("Content-Type", "text/plain; charset=utf-8");
          response.end("Invalid course file path");
          return;
        }
        void stat(filePath)
          .then((file) => {
            if (!file.isFile()) {
              next();
              return;
            }
            const extension = path.extname(filePath).toLowerCase();
            response.setHeader(
              "Content-Type",
              extension === ".json"
                ? "application/json; charset=utf-8"
                : extension === ".py" || extension === ".md"
                  ? "text/plain; charset=utf-8"
                  : "application/octet-stream",
            );
            response.setHeader("Cache-Control", "no-store");
            createReadStream(filePath).pipe(response);
          })
          .catch(() => next());
      });
    },
  };
}

export default defineConfig({
  base: basePath,
  plugins: [react(), developmentCourseFiles()],
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
        reference: path.resolve(projectRoot, "reference/index.html"),
        commission: path.resolve(projectRoot, "commission/index.html"),
        author: path.resolve(projectRoot, "author/index.html"),
        overview: path.resolve(projectRoot, "overview/index.html"),
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
