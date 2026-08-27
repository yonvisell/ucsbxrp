import { expect, test, type BrowserContext, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";

const release = JSON.parse(
  readFileSync(
    new URL("../../vendor/current/release.json", import.meta.url),
    "utf8",
  ),
) as {
  release_id: string;
  release_sequence: number;
  course_api_revision: string;
  service: {
    version: string;
    protocol_version: number;
    protocol_revision: number;
    bootstrap_version: number;
  };
  ucsb_xrp: { version: string };
};

function collectBrowserErrors(page: Page, errors: string[]) {
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
}

function runButton(page: Page) {
  return page
    .locator(".app-header")
    .getByRole("button", { name: "Run", exact: true });
}

function stopButton(page: Page) {
  return page
    .locator(".app-header")
    .getByRole("button", { name: "Stop", exact: true });
}

async function expectVirtualState(
  ide: Page,
  monitor: Page,
  state: "ready" | "running",
) {
  await expect(ide.getByTestId("target-status")).toContainText(
    `Virtual XRP · ${state}`,
  );
  await expect(monitor.getByTestId("target-status")).toContainText(
    `Virtual XRP · ${state}`,
  );
}

/**
 * Seed one saved project whose IndexedDB lookup is released by the test.
 * This models a real folder restore without adding arbitrary timing sleeps.
 */
async function installDelayedRememberedProject(page: Page) {
  await page.addInitScript(() => {
    const recoveryKey = "ucsb-xrp-course-project-v1";
    if (sessionStorage.getItem("ucsb-xrp-stress-folder-seeded") === null) {
      sessionStorage.setItem("ucsb-xrp-stress-folder-seeded", "true");
      localStorage.clear();
      localStorage.setItem(
        recoveryKey,
        JSON.stringify({
          name: "Wrong browser draft",
          entrypoint: "main.py",
          files: { "main.py": 'print("WRONG BROWSER PROJECT RAN")\n' },
          session: {
            projectId: "wrong-browser-project",
            revision: 2,
            savedRevision: 1,
            updatedAt: 1_000,
          },
        }),
      );
    }

    const projectFiles: Record<string, string> = {
      ".ucsb-xrp-project.json": `${JSON.stringify({
        name: "Folder authority",
        entrypoint: "main.py",
        session: {
          projectId: "folder-authority",
          revision: 5,
          savedRevision: 5,
          updatedAt: 2_000,
        },
      })}\n`,
      "main.py": 'print("FOLDER AUTHORITY RAN")\n',
    };

    class MemoryFileHandle {
      readonly kind = "file";

      constructor(readonly name: string) {}

      async getFile() {
        return new File([projectFiles[this.name] ?? ""], this.name);
      }

      async createWritable() {
        return {
          write: async (content: string | Blob) => {
            projectFiles[this.name] =
              typeof content === "string" ? content : await content.text();
          },
          close: async () => undefined,
        };
      }
    }

    class MemoryDirectoryHandle {
      readonly kind = "directory";

      constructor(
        readonly name: string,
        private readonly path: string[],
      ) {}

      async *entries() {
        if (this.path.length === 0) {
          yield [
            "Folder-Authority",
            new MemoryDirectoryHandle("Folder-Authority", ["Folder-Authority"]),
          ] as const;
          return;
        }
        for (const name of Object.keys(projectFiles).sort()) {
          yield [name, new MemoryFileHandle(name)] as const;
        }
      }

      async getDirectoryHandle(name: string) {
        if (this.path.length === 0 && name === "Folder-Authority") {
          return new MemoryDirectoryHandle(name, [name]);
        }
        throw new DOMException("Directory not found", "NotFoundError");
      }

      async getFileHandle(name: string, options?: { create?: boolean }) {
        if (this.path.length !== 1) {
          throw new DOMException("File not found", "NotFoundError");
        }
        if (!(name in projectFiles) && !options?.create) {
          throw new DOMException("File not found", "NotFoundError");
        }
        if (!(name in projectFiles)) projectFiles[name] = "";
        return new MemoryFileHandle(name);
      }

      async removeEntry(name: string) {
        if (!(name in projectFiles)) {
          throw new DOMException("File not found", "NotFoundError");
        }
        delete projectFiles[name];
      }

      async isSameEntry(other: MemoryDirectoryHandle) {
        return (
          other instanceof MemoryDirectoryHandle &&
          other.path.join("/") === this.path.join("/")
        );
      }

      async resolve(possibleDescendant: MemoryDirectoryHandle) {
        if (
          !(possibleDescendant instanceof MemoryDirectoryHandle) ||
          possibleDescendant.path.length < this.path.length ||
          !this.path.every(
            (part, index) => possibleDescendant.path[index] === part,
          )
        ) {
          return null;
        }
        return possibleDescendant.path.slice(this.path.length);
      }

      async queryPermission() {
        return "granted" as const;
      }

      async requestPermission() {
        return "granted" as const;
      }
    }

    const workspace = new MemoryDirectoryHandle("XRP Course", []);
    const project = new MemoryDirectoryHandle("Folder-Authority", [
      "Folder-Authority",
    ]);
    const retained = new Map<string, unknown>([
      ["workspace-folder-v1", workspace],
      ["project-folder-v1", project],
    ]);
    const pendingProjectReads: (() => void)[] = [];

    const database = {
      objectStoreNames: { contains: () => true },
      close: () => undefined,
      transaction: () => {
        const transaction: Record<string, unknown> = {
          oncomplete: null,
          onabort: null,
          onerror: null,
          error: null,
        };
        const complete = () =>
          queueMicrotask(() => {
            const handler = transaction.oncomplete;
            if (typeof handler === "function") handler(new Event("complete"));
          });
        transaction.objectStore = () => ({
          get: (key: IDBValidKey) => {
            const request: Record<string, unknown> = {
              result: undefined,
              error: null,
              onsuccess: null,
              onerror: null,
            };
            const resolve = () => {
              request.result = retained.get(String(key));
              const handler = request.onsuccess;
              if (typeof handler === "function") handler(new Event("success"));
              complete();
            };
            if (String(key) === "project-folder-v1") {
              pendingProjectReads.push(resolve);
            } else {
              queueMicrotask(resolve);
            }
            return request;
          },
          put: (value: unknown, key: IDBValidKey) => {
            retained.set(String(key), value);
            complete();
          },
          delete: (key: IDBValidKey) => {
            retained.delete(String(key));
            complete();
          },
        });
        return transaction;
      },
    };
    const indexedDb = {
      open: () => {
        const request: Record<string, unknown> = {
          result: undefined,
          error: null,
          onsuccess: null,
          onerror: null,
          onupgradeneeded: null,
        };
        queueMicrotask(() => {
          request.result = database;
          const handler = request.onsuccess;
          if (typeof handler === "function") handler(new Event("success"));
        });
        return request;
      },
    };

    Object.defineProperty(window, "indexedDB", {
      configurable: true,
      value: indexedDb,
    });
    Object.defineProperty(window, "showDirectoryPicker", {
      configurable: true,
      value: async () => workspace,
    });
    Object.defineProperty(window, "__releaseRememberedProject", {
      configurable: true,
      value: () => {
        for (const resolve of pendingProjectReads.splice(0)) resolve();
      },
    });
  });
}

async function installMockPhysicalXrp(context: BrowserContext) {
  await context.addInitScript((currentRelease: typeof release) => {
    Reflect.deleteProperty(globalThis, "SharedWorker");
    const profileKey = "ucsb-xrp-robot-profile-v2";
    if (localStorage.getItem("ucsb-xrp-stress-profile-seeded") === null) {
      localStorage.clear();
      localStorage.setItem("ucsb-xrp-stress-profile-seeded", "true");
      localStorage.setItem("ucsb-xrp-stress-robot-id", "robot-a");
      localStorage.setItem(
        profileKey,
        JSON.stringify({
          schemaVersion: 2,
          kind: "physical",
          robotId: "robot-a",
          physicalConnection: "station",
          stationEndpoint: "http://192.168.7.44",
          accessPointEndpoint: "http://192.168.4.1",
          lastObservedNetwork: {
            mode: "station",
            address: "http://192.168.7.44",
            ssid: "COURSE-NETWORK",
            requestedMode: "station",
            fallback: false,
            observedAtMs: 1,
          },
        }),
      );
    }

    const originalFetch = window.fetch.bind(window);
    window.fetch = async (input, init) => {
      const url = new URL(
        typeof input === "string"
          ? input
          : input instanceof URL
            ? input.href
            : input.url,
      );
      if (
        url.origin !== "http://192.168.7.44" &&
        url.origin !== "http://192.168.4.1"
      ) {
        return originalFetch(input, init);
      }
      const hotspot = url.origin === "http://192.168.4.1";
      const mode = hotspot ? "access_point" : "station";
      const ssid = hotspot ? "UCSB-XRP-ROBOT-A" : "COURSE-NETWORK";
      const robotId =
        localStorage.getItem("ucsb-xrp-stress-robot-id") ?? "robot-a";
      const common = {
        bootId: `mock-${mode}-boot`,
        courseRelease: currentRelease.release_id,
        runtimeRelease: currentRelease.release_id,
        runtimeReleaseSequence: currentRelease.release_sequence,
        courseApiRevision: currentRelease.course_api_revision,
        serviceVersion: currentRelease.service.version,
        protocol: currentRelease.service.protocol_version,
        protocolRevision: currentRelease.service.protocol_revision,
        bootstrapVersion: currentRelease.service.bootstrap_version,
        courseLibraryVersion: currentRelease.ucsb_xrp.version,
        runtimeJson: '{"revision":0,"parameters":[],"watches":[],"plots":[]}',
        project: null,
      };
      if (url.pathname.endsWith("/info")) {
        return new Response(
          JSON.stringify({
            ...common,
            robotId,
            robotName: "UCSB-XRP-ROBOT-A",
            address: url.origin,
            network: {
              mode,
              requested_mode: mode,
              fallback: false,
              ssid,
              address: url.origin,
            },
            capabilities: [
              "project.check",
              "project.sync",
              "program.run",
              "program.stop",
              "target.reset",
              "telemetry.poll",
            ],
          }),
          { headers: { "Content-Type": "application/json" } },
        );
      }
      if (url.pathname.endsWith("/telemetry")) {
        return new Response(
          JSON.stringify({
            ...common,
            state: "ready",
            detail: "Physical XRP ready",
            runId: 0,
            logs: [],
            samples: [],
            sample: null,
          }),
          { headers: { "Content-Type": "application/json" } },
        );
      }
      return new Response(
        JSON.stringify({
          protocol: currentRelease.service.protocol_version,
          requestId: "mock-command",
          ok: true,
          result: { detail: "accepted", reconnecting: false },
        }),
        { headers: { "Content-Type": "application/json" } },
      );
    };
  }, release);
}

test("survives a repeated virtual edit, run, stop, and reload session", async ({
  context,
  page: monitor,
}) => {
  test.setTimeout(45_000);
  const browserErrors: string[] = [];
  collectBrowserErrors(monitor, browserErrors);
  await monitor.addInitScript(() => {
    if (sessionStorage.getItem("ucsb-xrp-stress-fresh-session") === null) {
      sessionStorage.setItem("ucsb-xrp-stress-fresh-session", "true");
      localStorage.clear();
    }
  });

  // A student can start from Monitor before ever opening the IDE.
  await monitor.goto("/monitor/");
  await expect(monitor.getByTestId("target-status")).toContainText(
    "Virtual XRP · ready",
  );
  await runButton(monitor).click();
  await expect(monitor.getByTestId("target-status")).toContainText(
    "Virtual XRP · running",
  );

  const ide = await context.newPage();
  collectBrowserErrors(ide, browserErrors);
  await ide.goto("/ide/");
  await expectVirtualState(ide, monitor, "running");
  await stopButton(ide).click();
  await expectVirtualState(ide, monitor, "ready");
  await expect(monitor.getByTestId("motor-effort")).toHaveText("0.00 / 0.00");

  // Changing projects marks the retained target stale. Monitor Run owns the
  // required validation and must start the newly opened project, not the old one.
  await ide.getByLabel("Project template").selectOption("demo_obstacle_turn");
  await ide.getByRole("button", { name: "Create", exact: true }).click();
  await expect(runButton(monitor)).toHaveAttribute(
    "title",
    /Obstacle, left, obstacle/,
  );
  await runButton(monitor).click();
  await expectVirtualState(ide, monitor, "running");
  await ide.getByRole("tab", { name: /System log/ }).click();
  await expect(ide.getByRole("log")).toContainText(
    "Validating Obstacle, left, obstacle",
  );
  await stopButton(monitor).click();
  await expectVirtualState(ide, monitor, "ready");

  // Repeat the ordinary lifecycle from both applications. The loop is small
  // enough to stay fast while still detecting one-shot state assumptions.
  for (const owner of [ide, monitor, ide]) {
    await runButton(owner).click();
    await expectVirtualState(ide, monitor, "running");
    const stopper = owner === ide ? monitor : ide;
    await stopButton(stopper).click();
    await expectVirtualState(ide, monitor, "ready");
    await expect(monitor.getByTestId("motor-effort")).toHaveText("0.00 / 0.00");
  }

  await ide.getByRole("button", { name: "New file", exact: true }).click();
  await ide.getByLabel("Project-relative path").fill("run_notes.md");
  await ide.getByRole("button", { name: "Create file" }).click();
  await expect(runButton(monitor)).toHaveAttribute(
    "title",
    /Validate and run the current IDE project/,
  );
  await runButton(monitor).click();
  await expectVirtualState(ide, monitor, "running");
  await stopButton(ide).click();
  await expectVirtualState(ide, monitor, "ready");

  await monitor.reload();
  await ide.reload();
  await expectVirtualState(ide, monitor, "ready");
  await expect(ide.getByTestId("project-folder")).toContainText(
    "Obstacle, left, obstacle",
  );
  await expect(runButton(monitor)).toHaveAttribute(
    "title",
    /Obstacle, left, obstacle/,
  );
  await runButton(monitor).click();
  await expectVirtualState(ide, monitor, "running");
  await stopButton(monitor).click();
  await expectVirtualState(ide, monitor, "ready");

  expect(browserErrors).toEqual([]);
});

test("does not expose the browser draft while a remembered project is restoring", async ({
  context,
  page: ide,
}) => {
  await installDelayedRememberedProject(ide);
  await ide.goto("/ide/");
  await expect(ide.getByText("Opening the saved project…")).toBeVisible();

  const monitor = await context.newPage();
  await monitor.goto("/monitor/");
  await expect(runButton(monitor)).toBeDisabled();
  await expect(runButton(monitor)).toHaveAttribute(
    "title",
    /saved project|opening|preparing/i,
  );

  await ide.evaluate(() =>
    (
      window as unknown as { __releaseRememberedProject: () => void }
    ).__releaseRememberedProject(),
  );
  await expect(ide.getByTestId("project-folder")).toHaveText(
    "./Folder-Authority",
  );
  await expect(runButton(monitor)).toBeEnabled();
  await expect(runButton(monitor)).toHaveAttribute("title", /Folder authority/);

  await runButton(monitor).click();
  await ide.getByRole("tab", { name: "Program output" }).click();
  await expect(ide.getByRole("log")).toContainText("FOLDER AUTHORITY RAN");
  await expect(ide.getByRole("log")).not.toContainText(
    "WRONG BROWSER PROJECT RAN",
  );
  await ide.getByRole("tab", { name: /System log/ }).click();
  await expect(ide.getByRole("log")).toContainText(
    "Starting Folder authority (main.py)",
  );
});

test("preserves the commissioned robot through network cycles and rejects another XRP", async ({
  context,
  page: ide,
}) => {
  await installMockPhysicalXrp(context);
  await ide.goto("/ide/");
  await expect(ide.getByTestId("target-status")).toContainText(
    "Physical XRP · ready",
  );
  await ide.getByRole("button", { name: "Settings", exact: true }).click();
  const settings = ide.getByTestId("settings-panel");
  const network = settings.getByLabel("Network", { exact: true });

  for (let cycle = 0; cycle < 3; cycle += 1) {
    await network.selectOption("access_point");
    await expect(ide.getByTestId("target-status")).toContainText(
      "Physical XRP · ready",
    );
    await network.selectOption("station");
    await expect(ide.getByTestId("target-status")).toContainText(
      "Physical XRP · ready",
    );
  }

  await expect
    .poll(() =>
      ide.evaluate(() =>
        JSON.parse(localStorage.getItem("ucsb-xrp-robot-profile-v2") ?? "{}"),
      ),
    )
    .toMatchObject({
      schemaVersion: 2,
      kind: "physical",
      robotId: "robot-a",
      physicalConnection: "station",
      stationEndpoint: "http://192.168.7.44",
      accessPointEndpoint: "http://192.168.4.1",
      lastObservedNetwork: {
        mode: "station",
        address: "http://192.168.7.44",
      },
    });

  await ide.reload();
  await expect(ide.getByTestId("target-status")).toContainText(
    "Physical XRP · ready",
  );
  await ide.getByRole("button", { name: "Settings", exact: true }).click();
  const reloadedSettings = ide.getByTestId("settings-panel");
  await expect(
    reloadedSettings.getByLabel("Network", { exact: true }),
  ).toHaveValue("station");
  await expect(reloadedSettings.getByLabel("XRP address")).toHaveValue(
    "http://192.168.7.44",
  );

  await ide.evaluate(() =>
    localStorage.setItem("ucsb-xrp-stress-robot-id", "robot-b"),
  );
  await reloadedSettings
    .getByLabel("Network", { exact: true })
    .selectOption("access_point");
  await expect(ide.getByTestId("target-status")).toContainText(
    "Physical XRP · error",
  );
  await expect(ide.getByTestId("target-status")).toHaveAttribute(
    "title",
    /robot-b.*robot-a|configured for robot-a/i,
  );
  await expect(runButton(ide)).toBeDisabled();

  const monitor = await context.newPage();
  await monitor.goto("/monitor/");
  await expect(monitor.getByTestId("target-status")).toContainText(
    "Physical XRP · error",
  );
  await expect(runButton(monitor)).toBeDisabled();
  await expect
    .poll(() =>
      monitor.evaluate(() =>
        JSON.parse(localStorage.getItem("ucsb-xrp-robot-profile-v2") ?? "{}"),
      ),
    )
    .toMatchObject({
      robotId: "robot-a",
      stationEndpoint: "http://192.168.7.44",
      accessPointEndpoint: "http://192.168.4.1",
    });

  await ide.evaluate(() =>
    localStorage.setItem("ucsb-xrp-stress-robot-id", "robot-a"),
  );
  await reloadedSettings
    .getByLabel("Network", { exact: true })
    .selectOption("station");
  await expect(ide.getByTestId("target-status")).toContainText(
    "Physical XRP · ready",
  );
  await expect(monitor.getByTestId("target-status")).toContainText(
    "Physical XRP · ready",
  );
});
