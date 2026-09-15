import { expect, test, type BrowserContext, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";

import {
  expandingSpiralProject,
  readWorkspaceManifest,
  seedWorkingFolder,
} from "./working-folder";

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

async function readProjectPersistenceState(
  page: Page,
  workspaceName: string,
  projectName: string,
) {
  return page.evaluate(
    async ({ workspaceName, projectName }) => {
      const workspace = await (
        await navigator.storage.getDirectory()
      ).getDirectoryHandle(workspaceName);
      const project = await workspace.getDirectoryHandle(projectName);
      const read = async (name: string, directory = project) => {
        try {
          return await (
            await (await directory.getFileHandle(name)).getFile()
          ).text();
        } catch (error) {
          if (error instanceof DOMException && error.name === "NotFoundError")
            return null;
          throw error;
        }
      };
      const writers: string[] = [];
      for await (const [name] of project.entries()) {
        if (
          name === ".ucsb-xrp-writer.json" ||
          (name.startsWith(".ucsb-xrp-writer-") && name.endsWith(".json"))
        )
          writers.push(name);
      }
      let pendingRun: string | null = null;
      try {
        pendingRun = await read(
          "pending-run.json",
          await project.getDirectoryHandle("UCSB_XRP_Autosaves"),
        );
      } catch (error) {
        if (!(error instanceof DOMException && error.name === "NotFoundError"))
          throw error;
      }
      return {
        writers: writers.sort(),
        pendingRun,
        pendingProject: await read(".ucsb-xrp-commit.json"),
        metadata: await read(".ucsb-xrp-project.json"),
        main: await read("main.py"),
        notes: await read("run_notes.md"),
      };
    },
    { workspaceName, projectName },
  );
}

/**
 * Seed one saved project whose IndexedDB lookup is released by the test.
 * This models a real folder restore without adding arbitrary timing sleeps.
 */
async function installDelayedRememberedProject(page: Page) {
  await page.addInitScript(() => {
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
    const workspaceFiles: Record<string, string> = {
      ".ucsbxrp.json": `${JSON.stringify({
        schemaVersion: 1,
        activeProject: "Folder-Authority",
        settings: { target: "virtual" },
      })}\n`,
    };

    class MemoryFileHandle {
      readonly kind = "file";

      constructor(
        readonly name: string,
        private readonly files: Record<string, string>,
      ) {}

      async getFile() {
        return new File([this.files[this.name] ?? ""], this.name);
      }

      async createWritable() {
        return {
          write: async (content: string | Blob) => {
            this.files[this.name] =
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
            ".ucsbxrp.json",
            new MemoryFileHandle(".ucsbxrp.json", workspaceFiles),
          ] as const;
          yield [
            "Folder-Authority",
            new MemoryDirectoryHandle("Folder-Authority", ["Folder-Authority"]),
          ] as const;
          return;
        }
        for (const name of Object.keys(projectFiles).sort()) {
          yield [name, new MemoryFileHandle(name, projectFiles)] as const;
        }
      }

      async getDirectoryHandle(name: string) {
        if (this.path.length === 0 && name === "Folder-Authority") {
          return new MemoryDirectoryHandle(name, [name]);
        }
        throw new DOMException("Directory not found", "NotFoundError");
      }

      async getFileHandle(name: string, options?: { create?: boolean }) {
        const files = this.path.length === 0 ? workspaceFiles : projectFiles;
        if (!(name in files) && !options?.create) {
          throw new DOMException("File not found", "NotFoundError");
        }
        if (!(name in files)) files[name] = "";
        return new MemoryFileHandle(name, files);
      }

      async removeEntry(name: string) {
        const files = this.path.length === 0 ? workspaceFiles : projectFiles;
        if (!(name in files)) {
          throw new DOMException("File not found", "NotFoundError");
        }
        delete files[name];
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
    const retained = new Map<string, unknown>([
      ["workspace-folder-capability-v1", workspace],
    ]);
    const pendingWorkspaceReads: (() => void)[] = [];
    let workspaceReadsReleased = false;

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
            if (
              String(key) === "workspace-folder-capability-v1" &&
              !workspaceReadsReleased
            ) {
              pendingWorkspaceReads.push(resolve);
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
        workspaceReadsReleased = true;
        for (const resolve of pendingWorkspaceReads.splice(0)) resolve();
      },
    });
  });
}

async function installMockPhysicalXrp(context: BrowserContext) {
  await context.addInitScript((currentRelease: typeof release) => {
    Reflect.deleteProperty(globalThis, "SharedWorker");
    if (localStorage.getItem("ucsb-xrp-stress-profile-seeded") === null) {
      localStorage.setItem("ucsb-xrp-stress-profile-seeded", "true");
      localStorage.setItem("ucsb-xrp-stress-robot-id", "robot-a");
    }

    const originalFetch = window.fetch.bind(window);
    let controlOwner: string | null = null;
    let controlGeneration = 0;
    const control = () => ({
      sessionId: controlOwner,
      generation: controlGeneration,
      leaseRemainingMs: 6000,
      runId: 0,
    });
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
        runId: 0,
        control: control(),
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
              "project.prepare",
              "logs.poll",
              "control.session-v1",
              "program.run",
              "program.stop",
              "target.reset",
              "telemetry.poll",
            ],
          }),
          { headers: { "Content-Type": "application/json" } },
        );
      }
      if (
        url.pathname.endsWith("/telemetry") ||
        url.pathname.endsWith("/state")
      ) {
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
      const body = JSON.parse(String(init?.body ?? "{}")) as {
        requestId?: string;
        sessionId?: string;
        bootId?: string;
        controlGeneration?: number;
        runId?: number;
        takeover?: boolean;
      };
      const claim = url.pathname.endsWith("/control");
      const code =
        body.bootId !== common.bootId
          ? "boot_changed"
          : claim
            ? controlOwner && controlOwner !== body.sessionId && !body.takeover
              ? "control_owned"
              : null
            : body.runId !== 0
              ? "stale_run"
              : body.sessionId !== controlOwner ||
                  body.controlGeneration !== controlGeneration
                ? "control_required"
                : null;
      if (claim && !code && body.sessionId !== controlOwner) {
        controlOwner = body.sessionId ?? null;
        controlGeneration += 1;
      }
      return new Response(
        JSON.stringify({
          protocol: currentRelease.service.protocol_version,
          requestId: body.requestId,
          ok: !code,
          ...(code
            ? { error: { code, detail: code } }
            : {
                result: {
                  detail: "accepted",
                  reconnecting: false,
                  control: control(),
                },
              }),
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
  await seedWorkingFolder(monitor, { folderName: "Virtual-Stress-Test" });

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
  // required compilation and must start the newly opened project, not the old one.
  await ide.getByRole("button", { name: "New project…", exact: true }).click();
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
    "Compile requested · Obstacle, left, obstacle",
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

  await ide.getByRole("button", { name: "New file…", exact: true }).click();
  await ide.getByLabel("Project-relative path").fill("run_notes.md");
  await ide.getByRole("button", { name: "Create file" }).click();
  await expect(runButton(monitor)).toHaveAttribute(
    "title",
    /Compile and run the current IDE project/,
  );
  await runButton(monitor).click();
  await expectVirtualState(ide, monitor, "running");
  await stopButton(ide).click();
  await expectVirtualState(ide, monitor, "ready");

  // Ready means motor execution stopped. The separate completed-run archive
  // must finish before this ordinary, uninterrupted reload assertion.
  await expect(ide.getByTestId("project-save-state")).toHaveText("Saved");
  await expect(monitor.getByTestId("run-autosave-status")).toHaveText(
    "Saved automatically to Obstacle-left-obstacle.",
  );
  await expect
    .poll(async () => {
      const state = await readProjectPersistenceState(
        ide,
        "Virtual-Stress-Test",
        "Obstacle-left-obstacle",
      );
      return {
        writers: state.writers,
        pendingRun: state.pendingRun,
        pendingProject: state.pendingProject,
      };
    })
    .toEqual({ writers: [], pendingRun: null, pendingProject: null });
  const savedBeforeReload = await readProjectPersistenceState(
    ide,
    "Virtual-Stress-Test",
    "Obstacle-left-obstacle",
  );
  expect(savedBeforeReload.notes).toBe("");
  const navigationWarnings: string[] = [];
  for (const app of [monitor, ide]) {
    app.on("dialog", async (dialog) => {
      navigationWarnings.push(dialog.type());
      await dialog.accept();
    });
  }
  await monitor.reload();
  await ide.reload();
  expect(navigationWarnings).toEqual([]);
  await expectVirtualState(ide, monitor, "ready");
  await expect(ide.getByTestId("project-name")).toHaveText(
    "Obstacle, left, obstacle",
  );
  await expect(ide.getByTestId("project-folder")).toHaveText(
    "Obstacle-left-obstacle",
  );
  await expect(runButton(monitor)).toHaveAttribute(
    "title",
    /Obstacle, left, obstacle/,
  );
  expect(
    await readProjectPersistenceState(
      ide,
      "Virtual-Stress-Test",
      "Obstacle-left-obstacle",
    ),
  ).toEqual(savedBeforeReload);
  await runButton(monitor).click();
  await expectVirtualState(ide, monitor, "running");
  await stopButton(monitor).click();
  await expectVirtualState(ide, monitor, "ready");

  expect(browserErrors).toEqual([]);
});

test("accepted reload during a first run archive retains its journal and requires writer recovery", async ({
  context,
  page: ide,
}) => {
  // Either the IDE's headless recorder or Monitor can win the archive lock.
  // Interrupt the first CSV close in both participants, after pending-run.json
  // has been fully committed, rather than depending on which page writes first.
  await context.addInitScript(() => {
    const createWritable = FileSystemFileHandle.prototype.createWritable;
    FileSystemFileHandle.prototype.createWritable = async function (options) {
      const writable = await createWritable.call(this, options);
      if (
        this.name === "telemetry-1.csv" &&
        sessionStorage.getItem("pause-first-run-archive") === "armed"
      ) {
        writable.close = () =>
          new Promise<void>(() => {
            sessionStorage.removeItem("pause-first-run-archive");
            sessionStorage.setItem("first-run-archive-paused", "yes");
          });
      }
      return writable;
    };
  });
  await seedWorkingFolder(ide, { folderName: "Interrupted-Archive" });
  await ide.goto("/ide/");
  await expect(ide.getByTestId("project-save-state")).toHaveText("Saved");
  const savedProject = await readProjectPersistenceState(
    ide,
    "Interrupted-Archive",
    "Expanding-Spiral",
  );
  const readProtectedFiles = () =>
    ide.evaluate(async (sourcePaths) => {
      const workspace = await (
        await navigator.storage.getDirectory()
      ).getDirectoryHandle("Interrupted-Archive");
      const project = await workspace.getDirectoryHandle("Expanding-Spiral");
      const read = async (name: string) =>
        (await (await project.getFileHandle(name)).getFile()).text();
      const sources = Object.fromEntries(
        await Promise.all(
          sourcePaths.map(async (name) => [name, await read(name)]),
        ),
      );
      const writers: Record<string, string> = {};
      for await (const [name] of project.entries()) {
        if (
          name === ".ucsb-xrp-writer.json" ||
          (name.startsWith(".ucsb-xrp-writer-") && name.endsWith(".json"))
        ) {
          writers[name] = await read(name);
        }
      }
      return { sources, writers };
    }, Object.keys(expandingSpiralProject.files));
  const savedFiles = await readProtectedFiles();
  expect(savedFiles.sources).toEqual(expandingSpiralProject.files);
  expect(savedFiles.writers).toEqual({});
  const monitor = await context.newPage();
  await monitor.goto("/monitor/");
  await expectVirtualState(ide, monitor, "ready");
  await runButton(ide).click();
  await expectVirtualState(ide, monitor, "running");
  await expect(monitor.getByTestId("recording-count")).toContainText(
    /[1-9][\d,]* samples/,
  );
  const recorders = [ide, monitor];
  await Promise.all(
    recorders.map((page) =>
      page.evaluate(() =>
        sessionStorage.setItem("pause-first-run-archive", "armed"),
      ),
    ),
  );
  await stopButton(ide).click();
  await expectVirtualState(ide, monitor, "ready");
  const pausedRecorders = () =>
    Promise.all(
      recorders.map((page) =>
        page.evaluate(
          () => sessionStorage.getItem("first-run-archive-paused") === "yes",
        ),
      ),
    );
  await expect
    .poll(async () => (await pausedRecorders()).some(Boolean))
    .toBe(true);
  const paused = await pausedRecorders();
  expect(paused.filter(Boolean)).toHaveLength(1);
  const interruptedRecorder = recorders[paused.findIndex(Boolean)]!;
  const interrupted = await readProjectPersistenceState(
    ide,
    "Interrupted-Archive",
    "Expanding-Spiral",
  );
  const interruptedFiles = await readProtectedFiles();
  const retainedWriters = Object.keys(interruptedFiles.writers).sort();
  expect(retainedWriters.length).toBeGreaterThan(0);
  expect(interrupted.writers).toEqual(retainedWriters);
  expect(interruptedFiles.sources).toEqual(savedFiles.sources);
  expect(interrupted.pendingProject).toBeNull();
  expect(interrupted.pendingRun).not.toBeNull();
  expect(interrupted.metadata).toBe(savedProject.metadata);
  expect(interrupted.main).toBe(savedProject.main);
  const recovery = JSON.parse(interrupted.pendingRun!);
  expect(recovery.runId).toEqual(expect.any(String));
  expect(recovery.projectId).toBe(
    JSON.parse(savedProject.metadata!).session.projectId,
  );
  expect(recovery.telemetry).toContain("source,pose_available,seq");

  const navigationWarnings: string[] = [];
  for (const page of recorders) {
    page.on("dialog", async (dialog) => {
      navigationWarnings.push(dialog.type());
      await dialog.accept();
    });
  }
  const beforeUnload = interruptedRecorder.waitForEvent("dialog");
  const reload = interruptedRecorder.reload();
  const warning = await beforeUnload;
  expect(warning.type()).toBe("beforeunload");
  await reload;
  expect(navigationWarnings).toContain("beforeunload");
  await expect(monitor.getByTestId("recording-count")).toContainText(
    /[1-9][\d,]* samples/,
  );
  await expect(
    monitor.getByRole("button", {
      name: "Export run data as CSV",
      exact: true,
    }),
  ).toBeEnabled();
  // Reload releases the first recorder's browser lock. The other recorder (or
  // a reopened IDE replay) may briefly create its own ticket, then must reject
  // the interrupted writer without changing its journal. Wait for this actual
  // completion boundary, rather than sampling the temporary admission record.
  await expect(ide.getByTestId("ide-run-save-state")).toHaveText(
    "Run not saved",
    { timeout: 10_000 },
  );
  const waitForWriteAttempts = () =>
    expect
      .poll(
        async () => {
          const locks = await ide.evaluate(() => navigator.locks.query());
          return [...(locks.held ?? []), ...(locks.pending ?? [])]
            .filter((lock) => lock.name?.startsWith("ucsb-xrp-project:"))
            .map((lock) => lock.name);
        },
        { timeout: 10_000 },
      )
      .toEqual([]);
  await waitForWriteAttempts();
  expect(
    await readProjectPersistenceState(
      ide,
      "Interrupted-Archive",
      "Expanding-Spiral",
    ),
  ).toEqual(interrupted);
  expect(await readProtectedFiles()).toEqual(interruptedFiles);

  await monitor.close();
  await ide.reload();
  await expect(ide.getByTestId("project-folder")).toHaveText("Not selected");
  await waitForWriteAttempts();
  await ide
    .getByRole("button", {
      name: "Review pending writers in Expanding-Spiral",
      exact: true,
    })
    .click();
  const recoveryDialog = ide.getByRole("dialog", {
    name: "Project writer recovery",
  });
  const release = recoveryDialog.getByRole("button", {
    name: "Release selected writer records",
  });
  await expect(recoveryDialog).toContainText(
    `${retainedWriters.length} pending writer records`,
  );
  await recoveryDialog
    .getByText("Selected writer records", { exact: true })
    .click();
  await expect(recoveryDialog.locator("code")).toHaveText(retainedWriters);
  await expect(release).toBeDisabled();
  await recoveryDialog
    .getByLabel("All other editors of this folder are closed.")
    .check();
  await release.click();
  await expect(recoveryDialog).toHaveCount(0);
  await expect(
    ide.getByRole("button", {
      name: "Open Expanding spiral from Expanding-Spiral",
      exact: true,
    }),
  ).toBeVisible();
  const afterRelease = await readProjectPersistenceState(
    ide,
    "Interrupted-Archive",
    "Expanding-Spiral",
  );
  expect(afterRelease).toEqual({ ...interrupted, writers: [] });
  expect(await readProtectedFiles()).toEqual({
    ...interruptedFiles,
    writers: {},
  });
});

test("does not enable Run before the Working folder finishes opening", async ({
  context,
  page: ide,
}) => {
  await installDelayedRememberedProject(ide);
  await ide.goto("/ide/");
  await expect(
    ide.getByText("Opening the saved project and XRP settings…"),
  ).toBeVisible();

  const monitor = await context.newPage();
  await installDelayedRememberedProject(monitor);
  await monitor.goto("/monitor/");
  await expect(runButton(monitor)).toBeDisabled();
  await expect(runButton(monitor)).toHaveAttribute(
    "title",
    /Choose a Working folder and create or open a project/i,
  );

  await ide.evaluate(() =>
    (
      window as unknown as { __releaseRememberedProject: () => void }
    ).__releaseRememberedProject(),
  );
  await monitor.evaluate(() =>
    (
      window as unknown as { __releaseRememberedProject: () => void }
    ).__releaseRememberedProject(),
  );
  await expect(ide.getByTestId("project-folder")).toHaveText(
    "Folder-Authority",
  );
  await expect(runButton(monitor)).toBeEnabled();
  await expect(runButton(monitor)).toHaveAttribute("title", /Folder authority/);

  await runButton(monitor).click();
  await ide.getByRole("tab", { name: "Program output" }).click();
  await expect(ide.getByRole("log")).toContainText("FOLDER AUTHORITY RAN");
  await ide.getByRole("tab", { name: /System log/ }).click();
  await expect(ide.getByRole("log")).toContainText(
    "Starting Folder authority (main.py)",
  );
});

test("preserves the commissioned robot across reloads and rejects another XRP", async ({
  context,
  page: ide,
}) => {
  const settledProject = async () => {
    await expect(ide.getByTestId("project-folder")).toHaveText(
      "Expanding-Spiral",
    );
    await expect(ide.getByTestId("project-save-state")).toHaveText("Saved");
    await expect
      .poll(async () => {
        const state = await readProjectPersistenceState(
          ide,
          "Physical-Stress-Test",
          "Expanding-Spiral",
        );
        return {
          writers: state.writers,
          pendingProject: state.pendingProject,
          pendingRun: state.pendingRun,
        };
      })
      .toEqual({ writers: [], pendingProject: null, pendingRun: null });
    await expect(ide.getByRole("dialog")).toHaveCount(0);
    return readProjectPersistenceState(
      ide,
      "Physical-Stress-Test",
      "Expanding-Spiral",
    );
  };
  await installMockPhysicalXrp(context);
  await seedWorkingFolder(ide, {
    folderName: "Physical-Stress-Test",
    robot: {
      id: "robot-a",
      name: "ucsb-xrp-robot-a",
      networkMode: "station",
      ssid: "COURSE-NETWORK",
      address: "192.168.7.44",
    },
    target: "physical",
  });
  await ide.goto("/ide/");
  await expect(ide.getByTestId("target-status")).toContainText(
    "Physical XRP · ready",
  );
  await ide.getByRole("button", { name: "Settings", exact: true }).click();
  const settings = ide.getByTestId("settings-panel");
  const physical = settings.getByRole("group", { name: "Physical XRP" });
  await expect(physical).toContainText("COURSE-NETWORK");
  await expect(physical).toContainText("http://192.168.7.44");

  await expect
    .poll(() =>
      readWorkspaceManifest<{
        settings?: { target?: string };
        robot?: {
          id?: string;
          networkMode?: string;
          address?: string;
          ssid?: string;
        };
      }>(ide, "Physical-Stress-Test"),
    )
    .toMatchObject({
      schemaVersion: 1,
      settings: { target: "physical" },
      robot: {
        id: "robot-a",
        networkMode: "station",
        address: "192.168.7.44",
        ssid: "COURSE-NETWORK",
      },
    });
  // Physical ready and the workspace settings do not establish that the first
  // Project metadata save has finished. These reloads exercise an uninterrupted
  // saved session; interrupted-writer recovery is covered separately above.
  const savedProject = await settledProject();
  expect(savedProject.main).toBe(expandingSpiralProject.files["main.py"]);
  expect(JSON.parse(savedProject.metadata!).session.projectId).toEqual(
    expect.any(String),
  );
  await ide.reload();
  await expect(ide.getByTestId("target-status")).toContainText(
    "Physical XRP · ready",
  );
  expect(await settledProject()).toEqual(savedProject);
  await ide.getByRole("button", { name: "Settings", exact: true }).click();
  const reloadedSettings = ide.getByTestId("settings-panel");
  const reloadedPhysical = reloadedSettings.getByRole("group", {
    name: "Physical XRP",
  });
  await expect(reloadedPhysical).toContainText("http://192.168.7.44");

  expect(await settledProject()).toEqual(savedProject);
  await ide.evaluate(() =>
    localStorage.setItem("ucsb-xrp-stress-robot-id", "robot-b"),
  );
  await ide.reload();
  await expect(ide.getByTestId("target-status")).toContainText(
    "Physical XRP · error",
  );
  await expect(ide.getByTestId("target-status")).toHaveAttribute(
    "title",
    /robot-b.*robot-a|configured for robot-a/i,
  );
  await expect(runButton(ide)).toBeDisabled();
  expect(await settledProject()).toEqual(savedProject);

  const monitor = await context.newPage();
  await monitor.goto("/monitor/");
  await expect(monitor.getByTestId("target-status")).toContainText(
    "Physical XRP · error",
  );
  await expect(runButton(monitor)).toBeDisabled();
  await expect
    .poll(() =>
      readWorkspaceManifest<{
        robot?: { id?: string };
      }>(monitor, "Physical-Stress-Test"),
    )
    .toMatchObject({
      robot: { id: "robot-a" },
    });

  expect(await settledProject()).toEqual(savedProject);
  await ide.evaluate(() =>
    localStorage.setItem("ucsb-xrp-stress-robot-id", "robot-a"),
  );
  await ide.reload();
  await monitor.reload();
  await expect(ide.getByTestId("target-status")).toContainText(
    "Physical XRP · ready",
  );
  await expect(monitor.getByTestId("target-status")).toContainText(
    "Physical XRP · ready",
  );
  expect(await settledProject()).toEqual(savedProject);
});
