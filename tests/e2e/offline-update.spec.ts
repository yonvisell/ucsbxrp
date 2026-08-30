import { expect, test, type BrowserContext, type Page } from "@playwright/test";
import {
  cp,
  mkdir,
  mkdtemp,
  readFile,
  rm,
  stat,
  writeFile,
} from "node:fs/promises";
import { createServer, type Server } from "node:http";
import { tmpdir } from "node:os";
import { extname, join, resolve, sep } from "node:path";

interface OfflineAsset {
  path: string;
  url: string;
  bytes: number;
  sha256: string;
}

interface OfflineManifest {
  version: string;
  cache_name: string;
  assets: OfflineAsset[];
}

interface OfflineBuildModule {
  collectBuildAssets(
    outputDirectory: string,
    basePath: string,
  ): Promise<OfflineAsset[]>;
  createOfflineManifest(
    assets: OfflineAsset[],
    basePath: string,
  ): OfflineManifest;
  renderServiceWorker(manifest: OfflineManifest): string;
}

const reloadVersionKey = "ucsb-xrp-offline-shell-reload-v1";
const isolationVersionKey = "ucsb-xrp-isolation-reload-v1";
const pagehideCountKey = "ucsb-xrp-test-pagehide-count";

function contentType(pathname: string) {
  switch (extname(pathname)) {
    case ".css":
      return "text/css; charset=utf-8";
    case ".html":
      return "text/html; charset=utf-8";
    case ".js":
    case ".mjs":
      return "text/javascript; charset=utf-8";
    case ".json":
    case ".webmanifest":
      return "application/json; charset=utf-8";
    case ".png":
      return "image/png";
    case ".svg":
      return "image/svg+xml";
    case ".wasm":
      return "application/wasm";
    default:
      return "application/octet-stream";
  }
}

async function generateRelease(
  outputDirectory: string,
  basePath: string,
  markerName: string,
  markerText: string,
) {
  await mkdir(join(outputDirectory, "assets"), { recursive: true });
  await writeFile(
    join(outputDirectory, "assets", markerName),
    markerText,
    "utf8",
  );

  const moduleUrl = new URL("../../scripts/offline-build.mjs", import.meta.url)
    .href;
  const offlineBuild = (await import(moduleUrl)) as OfflineBuildModule;
  const assets = await offlineBuild.collectBuildAssets(
    outputDirectory,
    basePath,
  );
  const manifest = offlineBuild.createOfflineManifest(assets, basePath);
  await writeFile(
    join(outputDirectory, "offline-manifest.json"),
    `${JSON.stringify(manifest, null, 2)}\n`,
    "utf8",
  );
  await writeFile(
    join(outputDirectory, "service-worker.js"),
    offlineBuild.renderServiceWorker(manifest),
    "utf8",
  );
  return manifest;
}

async function closeServer(server: Server) {
  await new Promise<void>((resolveClose, rejectClose) => {
    server.close((error) => (error ? rejectClose(error) : resolveClose()));
  });
}

async function startReleaseServer(activeRoot: () => string, basePath: string) {
  const server = createServer(async (request, response) => {
    try {
      const requestUrl = new URL(request.url ?? "/", "http://127.0.0.1");
      if (!requestUrl.pathname.startsWith(basePath)) {
        response.writeHead(404).end("Not found");
        return;
      }
      const relativePath = decodeURIComponent(
        requestUrl.pathname.slice(basePath.length),
      ).replace(/^\/+/, "");
      let filePath = resolve(activeRoot(), relativePath || "index.html");
      const root = resolve(activeRoot());
      if (filePath !== root && !filePath.startsWith(`${root}${sep}`)) {
        response.writeHead(400).end("Invalid path");
        return;
      }
      const file = await stat(filePath).catch(() => null);
      if (file?.isDirectory()) {
        filePath = join(filePath, "index.html");
      }
      const contents = await readFile(filePath);
      response.writeHead(200, {
        "Cache-Control": "no-store",
        "Content-Type": contentType(filePath),
        "Cross-Origin-Embedder-Policy": "require-corp",
        "Cross-Origin-Opener-Policy": "same-origin",
        "Cross-Origin-Resource-Policy": "same-origin",
      });
      response.end(contents);
    } catch {
      response.writeHead(404, {
        "Content-Type": "text/plain; charset=utf-8",
        "Cross-Origin-Embedder-Policy": "require-corp",
        "Cross-Origin-Opener-Policy": "same-origin",
        "Cross-Origin-Resource-Policy": "same-origin",
      });
      response.end("Not found");
    }
  });
  await new Promise<void>((resolveListen, rejectListen) => {
    server.once("error", rejectListen);
    server.listen(0, "127.0.0.1", () => {
      server.off("error", rejectListen);
      resolveListen();
    });
  });
  const address = server.address();
  if (address === null || typeof address === "string") {
    await closeServer(server);
    throw new Error("Temporary release server did not obtain a TCP port");
  }
  return {
    origin: `http://127.0.0.1:${address.port}`,
    server,
  };
}

interface TwoReleaseHarness {
  basePath: string;
  origin: string;
  releaseA: OfflineManifest;
  releaseB: OfflineManifest;
  selectReleaseB(): void;
  close(): Promise<void>;
}

async function startTwoReleaseHarness(): Promise<TwoReleaseHarness> {
  const temporaryRoot = await mkdtemp(
    join(tmpdir(), "ucsbxrp-offline-update-"),
  );
  const releaseARoot = join(temporaryRoot, "release-a");
  const releaseBRoot = join(temporaryRoot, "release-b");
  let server: Server | null = null;
  try {
    const builtManifest = JSON.parse(
      await readFile(resolve("dist/offline-manifest.json"), "utf8"),
    ) as { base_path: string };
    const basePath = builtManifest.base_path;
    expect(basePath).toMatch(/^\/(?:[^/?#]+\/)*$/);
    await cp(resolve("dist"), releaseARoot, { recursive: true });
    await cp(resolve("dist"), releaseBRoot, { recursive: true });
    const releaseA = await generateRelease(
      releaseARoot,
      basePath,
      "test-release-a.txt",
      "release A retained asset\n",
    );
    const releaseB = await generateRelease(
      releaseBRoot,
      basePath,
      "test-release-b.txt",
      "release B current asset\n",
    );
    expect(releaseB.version).not.toBe(releaseA.version);

    let selectedRoot = releaseARoot;
    const releaseServer = await startReleaseServer(
      () => selectedRoot,
      basePath,
    );
    server = releaseServer.server;
    return {
      basePath,
      origin: releaseServer.origin,
      releaseA,
      releaseB,
      selectReleaseB() {
        selectedRoot = releaseBRoot;
      },
      async close() {
        await closeServer(releaseServer.server).catch(() => undefined);
        await rm(temporaryRoot, { recursive: true, force: true });
      },
    };
  } catch (error) {
    if (server !== null) {
      await closeServer(server).catch(() => undefined);
    }
    await rm(temporaryRoot, { recursive: true, force: true });
    throw error;
  }
}

async function expectShellVersion(page: Page, version: string) {
  await expect(page.locator("html")).toHaveAttribute(
    "data-offline-shell-state",
    "ready",
  );
  await expect(page.locator("html")).toHaveAttribute(
    "data-offline-shell-version",
    version,
  );
}

async function installPagehideCounter(context: BrowserContext) {
  await context.addInitScript((storageKey) => {
    window.addEventListener("pagehide", () => {
      const previous = Number.parseInt(
        window.sessionStorage.getItem(storageKey) ?? "0",
        10,
      );
      window.sessionStorage.setItem(storageKey, String(previous + 1));
    });
  }, pagehideCountKey);
}

async function createSavedSpiralProject(
  page: Page,
  ideUrl: string,
  workingFolderName: string,
) {
  await page.addInitScript((folderName) => {
    Object.defineProperty(window, "showDirectoryPicker", {
      configurable: true,
      value: async () => {
        const root = await navigator.storage.getDirectory();
        try {
          await root.removeEntry(folderName, { recursive: true });
        } catch (error) {
          if (
            !(error instanceof DOMException) ||
            error.name !== "NotFoundError"
          ) {
            throw error;
          }
        }
        return root.getDirectoryHandle(folderName, { create: true });
      },
    });
  }, workingFolderName);
  await page.goto(ideUrl);
  await page.getByRole("button", { name: "New project…", exact: true }).click();
  await page.getByLabel("Project template").selectOption("demo_spiral");
  await page
    .getByRole("button", { name: "Choose Working folder and create" })
    .click();
  await expect(page.getByTestId("project-save-state")).toHaveText("Saved");
}

test("defers a cancelled A-to-B course update until the next safe IDE operation", async ({
  context,
}) => {
  test.setTimeout(120_000);
  const harness = await startTwoReleaseHarness();
  let offline = false;

  try {
    await installPagehideCounter(context);

    const ide = await context.newPage();
    await createSavedSpiralProject(
      ide,
      `${harness.origin}${harness.basePath}ide/`,
      "Update-IDE-Work",
    );
    await expect(ide.getByTestId("target-status")).toContainText(
      "Virtual XRP · ready",
    );
    await expectShellVersion(ide, harness.releaseA.version);

    await ide.evaluate(
      ({ reloadKey, isolationKey }) => {
        window.sessionStorage.removeItem(reloadKey);
        window.sessionStorage.removeItem(isolationKey);
      },
      { reloadKey: reloadVersionKey, isolationKey: isolationVersionKey },
    );

    // Compile supplies the sticky user activation Chrome requires before it
    // will display a beforeunload confirmation dialog.
    await ide.getByRole("button", { name: "Compile" }).click();
    await expect(ide.getByTestId("check-result")).toContainText(
      "compiled successfully",
    );
    const pagehideBaseline = await ide.evaluate(
      (storageKey) =>
        Number.parseInt(window.sessionStorage.getItem(storageKey) ?? "0", 10),
      pagehideCountKey,
    );
    await ide.evaluate(() => {
      const testWindow = window as typeof window & {
        __cancelCourseUpdate?: (event: BeforeUnloadEvent) => void;
      };
      testWindow.__cancelCourseUpdate = (event: BeforeUnloadEvent) => {
        event.preventDefault();
        event.returnValue = "";
      };
      window.addEventListener("beforeunload", testWindow.__cancelCourseUpdate);
    });

    const cancelledDialog = new Promise<void>((resolveDialog, rejectDialog) => {
      ide.once("dialog", (dialog) => {
        if (dialog.type() !== "beforeunload") {
          rejectDialog(
            new Error(`Expected beforeunload, received ${dialog.type()}`),
          );
          return;
        }
        void dialog.dismiss().then(resolveDialog, rejectDialog);
      });
    });

    harness.selectReleaseB();
    const updater = await context.newPage();
    await updater.goto(`${harness.origin}${harness.basePath}`);
    await expectShellVersion(updater, harness.releaseB.version);
    await cancelledDialog;

    // A cancelled reload must not be recorded as having navigated. Otherwise
    // the still-running A page would suppress the next B reload request.
    await expect
      .poll(() =>
        ide.evaluate(
          ({ countKey, reloadKey }) => ({
            pagehideCount: Number.parseInt(
              window.sessionStorage.getItem(countKey) ?? "0",
              10,
            ),
            reloadedVersion: window.sessionStorage.getItem(reloadKey),
          }),
          { countKey: pagehideCountKey, reloadKey: reloadVersionKey },
        ),
      )
      .toEqual({
        pagehideCount: pagehideBaseline,
        reloadedVersion: null,
      });

    await ide.evaluate(() => {
      const testWindow = window as typeof window & {
        __cancelCourseUpdate?: (event: BeforeUnloadEvent) => void;
      };
      if (testWindow.__cancelCourseUpdate !== undefined) {
        window.removeEventListener(
          "beforeunload",
          testWindow.__cancelCourseUpdate,
        );
        delete testWindow.__cancelCourseUpdate;
      }
    });

    // Compile is a normal bounded IDE operation. Its completion retries the
    // pending update, which should now produce one genuine pagehide and reload.
    const reloaded = ide.waitForEvent("load");
    await ide.getByRole("button", { name: "Compile" }).click();
    await reloaded;
    await expect(ide.getByTestId("target-status")).toContainText(
      "Virtual XRP · ready",
    );
    await expectShellVersion(ide, harness.releaseB.version);
    expect(
      await ide.evaluate(
        ({ countKey, reloadKey }) => ({
          pagehideCount: Number.parseInt(
            window.sessionStorage.getItem(countKey) ?? "0",
            10,
          ),
          reloadedVersion: window.sessionStorage.getItem(reloadKey),
        }),
        { countKey: pagehideCountKey, reloadKey: reloadVersionKey },
      ),
    ).toEqual({
      pagehideCount: pagehideBaseline + 1,
      reloadedVersion: harness.releaseB.version,
    });

    const retainedCaches = await ide.evaluate(
      async ({ cacheA, cacheB }) => ({
        releaseA: await window.caches.has(cacheA),
        releaseB: await window.caches.has(cacheB),
      }),
      {
        cacheA: harness.releaseA.cache_name,
        cacheB: harness.releaseB.cache_name,
      },
    );
    expect(retainedCaches).toEqual({ releaseA: true, releaseB: true });

    // The new worker must continue serving a content-addressed asset requested
    // by an already-loaded A page from the retained A cache.
    await context.setOffline(true);
    offline = true;
    expect(
      await ide.evaluate(async (assetUrl) => {
        const response = await fetch(assetUrl);
        return response.text();
      }, `${harness.basePath}assets/test-release-a.txt`),
    ).toBe("release A retained asset\n");
    expect(
      await ide.evaluate(async (assetUrl) => {
        const response = await fetch(assetUrl);
        return response.text();
      }, `${harness.basePath}assets/test-release-b.txt`),
    ).toBe("release B current asset\n");
  } finally {
    if (offline) {
      await context.setOffline(false).catch(() => undefined);
    }
    await harness.close();
  }
});

test("keeps an A-to-B update pending for a completed Monitor run and note", async ({
  context,
}) => {
  test.setTimeout(120_000);
  const harness = await startTwoReleaseHarness();
  await installPagehideCounter(context);

  try {
    const setupIde = await context.newPage();
    await createSavedSpiralProject(
      setupIde,
      `${harness.origin}${harness.basePath}ide/`,
      "Update-Monitor-Work",
    );
    await setupIde.close();

    const monitor = await context.newPage();
    await monitor.goto(`${harness.origin}${harness.basePath}monitor/`);
    await expect(monitor.getByTestId("target-status")).toContainText(
      "Virtual XRP · ready",
    );
    await expectShellVersion(monitor, harness.releaseA.version);

    await monitor
      .locator(".app-header")
      .getByRole("button", { name: "Run", exact: true })
      .click();
    await expect
      .poll(async () => {
        const text = await monitor.getByTestId("recording-count").textContent();
        const match = (text ?? "").match(/([\d,]+) samples/);
        return Number.parseInt((match?.[1] ?? "0").replaceAll(",", ""), 10);
      })
      .toBeGreaterThan(3);

    await monitor
      .getByTestId("wheel-speed-plot")
      .click({ button: "right", position: { x: 160, y: 60 } });
    await monitor.getByLabel("Note label").fill("retain this note");
    await monitor.getByRole("button", { name: "Add", exact: true }).click();
    await expect(
      monitor.getByRole("button", { name: "Hide notes · 1" }),
    ).toBeVisible();

    await monitor
      .locator(".app-header")
      .getByRole("button", { name: "Stop", exact: true })
      .click();
    await expect(monitor.getByTestId("recording-count")).toContainText(
      /Expanding spiral · [\d,]+ samples/,
    );

    const pagehideBaseline = await monitor.evaluate(
      (storageKey) =>
        Number.parseInt(window.sessionStorage.getItem(storageKey) ?? "0", 10),
      pagehideCountKey,
    );
    harness.selectReleaseB();
    const updater = await context.newPage();
    await updater.goto(`${harness.origin}${harness.basePath}`);
    await expectShellVersion(updater, harness.releaseB.version);

    await expectShellVersion(monitor, harness.releaseA.version);
    await expect
      .poll(() =>
        monitor.evaluate(
          (storageKey) =>
            Number.parseInt(
              window.sessionStorage.getItem(storageKey) ?? "0",
              10,
            ),
          pagehideCountKey,
        ),
      )
      .toBe(pagehideBaseline);

    const reloaded = monitor.waitForEvent("load");
    await monitor.getByRole("button", { name: "Clear run" }).click();
    await reloaded;
    await expectShellVersion(monitor, harness.releaseB.version);
    expect(
      await monitor.evaluate(
        (storageKey) =>
          Number.parseInt(window.sessionStorage.getItem(storageKey) ?? "0", 10),
        pagehideCountKey,
      ),
    ).toBe(pagehideBaseline + 1);
  } finally {
    await harness.close();
  }
});

test("keeps an A-to-B update pending for invalid Author JSON", async ({
  context,
}) => {
  test.setTimeout(120_000);
  const harness = await startTwoReleaseHarness();
  await installPagehideCounter(context);

  try {
    const author = await context.newPage();
    await author.goto(`${harness.origin}${harness.basePath}author/`);
    await expectShellVersion(author, harness.releaseA.version);

    await author.getByText("Project-file overrides · 1 file").click();
    await author.getByLabel("Project file overrides as JSON").fill("{");
    await expect(author.getByText(/^Project file overrides:/)).toBeVisible();

    const pagehideBaseline = await author.evaluate(
      (storageKey) =>
        Number.parseInt(window.sessionStorage.getItem(storageKey) ?? "0", 10),
      pagehideCountKey,
    );
    harness.selectReleaseB();
    const updater = await context.newPage();
    await updater.goto(`${harness.origin}${harness.basePath}`);
    await expectShellVersion(updater, harness.releaseB.version);

    await expectShellVersion(author, harness.releaseA.version);
    await expect
      .poll(() =>
        author.evaluate(
          (storageKey) =>
            Number.parseInt(
              window.sessionStorage.getItem(storageKey) ?? "0",
              10,
            ),
          pagehideCountKey,
        ),
      )
      .toBe(pagehideBaseline);

    const reloaded = author.waitForEvent("load");
    await author
      .getByRole("button", { name: "Load working slalom example" })
      .click();
    await reloaded;
    await expectShellVersion(author, harness.releaseB.version);
    expect(
      await author.evaluate(
        (storageKey) =>
          Number.parseInt(window.sessionStorage.getItem(storageKey) ?? "0", 10),
        pagehideCountKey,
      ),
    ).toBe(pagehideBaseline + 1);
  } finally {
    await harness.close();
  }
});
