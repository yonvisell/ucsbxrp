import { expect, test, type Page } from "@playwright/test";

async function installMemoryFolderPicker(page: Page) {
  await page.addInitScript(() => {
    const savedFiles: Record<string, string> = {};

    class MemoryFileHandle {
      readonly kind = "file";

      constructor(
        readonly name: string,
        private readonly path: string,
      ) {}

      async getFile() {
        const content = savedFiles[this.path] ?? "";
        return {
          size: new TextEncoder().encode(content).byteLength,
          text: async () => content,
        };
      }

      async createWritable() {
        return {
          write: async (content: string) => {
            savedFiles[this.path] = String(content);
          },
          close: async () => undefined,
        };
      }
    }

    class MemoryDirectoryHandle {
      readonly kind = "directory";

      constructor(
        readonly name: string,
        private readonly prefix = "",
      ) {}

      async *entries() {
        const directories = new Set<string>();
        for (const path of Object.keys(savedFiles).sort()) {
          if (!path.startsWith(this.prefix)) {
            continue;
          }
          const remainder = path.slice(this.prefix.length);
          const slash = remainder.indexOf("/");
          if (slash < 0) {
            yield [remainder, new MemoryFileHandle(remainder, path)] as const;
          } else {
            const directory = remainder.slice(0, slash);
            if (!directories.has(directory)) {
              directories.add(directory);
              yield [
                directory,
                new MemoryDirectoryHandle(
                  directory,
                  `${this.prefix}${directory}/`,
                ),
              ] as const;
            }
          }
        }
      }

      async getDirectoryHandle(name: string, options?: { create?: boolean }) {
        const prefix = `${this.prefix}${name}/`;
        if (
          !options?.create &&
          !Object.keys(savedFiles).some((path) => path.startsWith(prefix))
        ) {
          throw new DOMException("Directory not found", "NotFoundError");
        }
        return new MemoryDirectoryHandle(name, prefix);
      }

      async getFileHandle(name: string, options?: { create?: boolean }) {
        const path = `${this.prefix}${name}`;
        if (!options?.create && !(path in savedFiles)) {
          throw new DOMException("File not found", "NotFoundError");
        }
        return new MemoryFileHandle(name, path);
      }

      async removeEntry(name: string) {
        const path = `${this.prefix}${name}`;
        if (!(path in savedFiles)) {
          throw new DOMException("File not found", "NotFoundError");
        }
        delete savedFiles[path];
      }
    }

    Object.defineProperty(window, "__courseAutosaveFiles", {
      value: savedFiles,
    });
    Object.defineProperty(window, "showDirectoryPicker", {
      value: async () => new MemoryDirectoryHandle("student-course-project"),
    });
  });
}

async function seedRememberedProjectFolder(page: Page) {
  await page.goto("/");
  await page.evaluate(async () => {
    const root = await navigator.storage.getDirectory();
    try {
      await root.removeEntry("monitor-detach-project", { recursive: true });
    } catch (error) {
      if (!(error instanceof DOMException) || error.name !== "NotFoundError") {
        throw error;
      }
    }
    const project = await root.getDirectoryHandle("monitor-detach-project", {
      create: true,
    });
    const write = async (name: string, content: string) => {
      const file = await project.getFileHandle(name, { create: true });
      const writable = await file.createWritable();
      await writable.write(content);
      await writable.close();
    };
    await write(
      ".ucsb-xrp-project.json",
      `${JSON.stringify({ name: "Folder A", entrypoint: "main.py" })}\n`,
    );
    await write("main.py", 'print("Folder A")\n');

    const database = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open("ucsb-xrp-course-tools-v1", 1);
      request.onupgradeneeded = () => {
        if (!request.result.objectStoreNames.contains("course-folders")) {
          request.result.createObjectStore("course-folders");
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction("course-folders", "readwrite");
      transaction
        .objectStore("course-folders")
        .put(project, "project-folder-v1");
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(transaction.error);
    });
    database.close();
  });
}

test("creates the untouched default inside the selected course folder", async ({
  page: ide,
}) => {
  await installMemoryFolderPicker(ide);
  await ide.goto("/ide/");

  await ide.getByRole("button", { name: "Choose course folder" }).click();
  await expect(ide.getByTestId("project-folder")).toHaveText(
    "./Expanding-Spiral",
  );
  const files = await ide.evaluate(
    () =>
      (
        window as unknown as {
          __courseAutosaveFiles: Record<string, string>;
        }
      ).__courseAutosaveFiles,
  );
  expect(files["Expanding-Spiral/main.py"]).toContain(
    '"spiral_winding_turns_per_m"',
  );
  expect(
    JSON.parse(files["Expanding-Spiral/.ucsb-xrp-project.json"] ?? "{}"),
  ).toEqual({
    name: "Expanding spiral",
    entrypoint: "main.py",
    templateId: "demo_spiral",
  });
});

test("automatically saves project edits and retains four prior states", async ({
  page: ide,
}) => {
  await installMemoryFolderPicker(ide);
  await ide.goto("/ide/");
  await expect(ide.getByTestId("target-status")).toContainText(
    "Virtual XRP · ready",
  );
  await ide.getByRole("button", { name: "Choose course folder" }).click();
  await expect(ide.getByTestId("project-folder")).toHaveText(
    "./Expanding-Spiral",
  );

  for (let revision = 1; revision <= 5; revision += 1) {
    await ide.getByRole("button", { name: "New file", exact: true }).click();
    await ide
      .getByLabel("Project-relative path")
      .fill(`notes/revision_${revision}.txt`);
    await ide.getByRole("button", { name: "Create file" }).click();
    await expect(
      ide.getByText("Saved changes to ./Expanding-Spiral."),
    ).toBeVisible({ timeout: 5_000 });
  }

  const saved = await ide.evaluate(
    () =>
      (
        window as unknown as {
          __courseAutosaveFiles: Record<string, string>;
        }
      ).__courseAutosaveFiles,
  );
  expect(saved["Expanding-Spiral/notes/revision_5.txt"]).toBe("");
  const newestPrior = JSON.parse(
    saved["Expanding-Spiral/UCSB_XRP_Autosaves/project-1.json"] ?? "{}",
  ) as { project?: { files?: Record<string, string> } };
  const oldestPrior = JSON.parse(
    saved["Expanding-Spiral/UCSB_XRP_Autosaves/project-4.json"] ?? "{}",
  ) as { project?: { files?: Record<string, string> } };
  expect(newestPrior.project?.files?.["notes/revision_4.txt"]).toBe("");
  expect(newestPrior.project?.files?.["notes/revision_5.txt"]).toBeUndefined();
  expect(oldestPrior.project?.files?.["notes/revision_1.txt"]).toBe("");
  expect(oldestPrior.project?.files?.["notes/revision_2.txt"]).toBeUndefined();
});

test("automatically saves monitored run output and unit-labeled telemetry", async ({
  context,
  page: monitor,
}) => {
  test.setTimeout(40_000);
  await installMemoryFolderPicker(monitor);
  await monitor.goto("/monitor/");
  await expect(monitor.getByTestId("target-status")).toContainText(
    "Virtual XRP · ready",
  );

  const ide = await context.newPage();
  await ide.goto("/ide/");
  await expect(ide.getByTestId("target-status")).toContainText(
    "Virtual XRP · ready",
  );
  await ide.getByLabel("Project template").selectOption("challenge_1");
  await ide.getByRole("button", { name: "Create", exact: true }).click();
  await monitor.getByRole("button", { name: "Choose project folder" }).click();
  await expect(monitor.getByTestId("run-autosave-status")).toContainText(
    "Runs save to ./student-course-project",
  );
  await ide.getByRole("button", { name: "Run", exact: true }).click();
  await expect(ide.getByRole("log")).toContainText("Challenge 1 complete", {
    timeout: 20_000,
  });
  await expect(monitor.getByTestId("run-autosave-status")).toContainText(
    /Saved \d+ telemetry samples and program output/,
    { timeout: 10_000 },
  );

  const saved = await monitor.evaluate(
    () =>
      (
        window as unknown as {
          __courseAutosaveFiles: Record<string, string>;
        }
      ).__courseAutosaveFiles,
  );
  expect(saved["UCSB_XRP_Autosaves/run-1.txt"]).toContain(
    "Challenge 1 complete",
  );
  const csv = saved["UCSB_XRP_Autosaves/telemetry-1.csv"] ?? "";
  expect(csv.split("\n")[0]).toContain("left_wheel_speed_mm_s");
  expect(csv.split("\n").length).toBeGreaterThan(2);
  const metadata = JSON.parse(
    saved["UCSB_XRP_Autosaves/run-1.json"] ?? "{}",
  ) as {
    target?: string;
    project?: { name?: string };
    telemetrySamples?: number;
  };
  expect(metadata.target).toBe("virtual");
  expect(metadata.project?.name).toBeTruthy();
  expect(metadata.telemetrySamples).toBeGreaterThan(0);
});

test("detaches Monitor autosaves when the IDE opens a browser-only template", async ({
  context,
  page: monitor,
}) => {
  test.setTimeout(40_000);
  await seedRememberedProjectFolder(monitor);
  await monitor.goto("/monitor/");
  await expect(monitor.getByTestId("run-autosave-status")).toContainText(
    "Runs save to ./monitor-detach-project",
  );

  const ide = await context.newPage();
  await ide.goto("/ide/");
  await expect(ide.getByTestId("project-folder")).toHaveText(
    "./monitor-detach-project",
  );
  await ide.getByLabel("Project template").selectOption("micropython_tutorial");
  await ide.getByRole("button", { name: "Create", exact: true }).click();

  await expect(monitor.getByTestId("run-autosave-status")).toContainText(
    "No project folder is connected",
  );
  await expect(
    monitor.getByRole("button", { name: "Choose project folder" }),
  ).toBeVisible();

  await ide.getByRole("button", { name: "Run", exact: true }).click();
  await expect(ide.getByRole("log")).toContainText("Lesson 1 complete", {
    timeout: 20_000,
  });
  await expect(monitor.getByTestId("run-autosave-status")).toContainText(
    "Run finished; browser data remains visible, but no project folder is connected.",
    { timeout: 10_000 },
  );

  const oldFolderWasWritten = await monitor.evaluate(async () => {
    const root = await navigator.storage.getDirectory();
    const project = await root.getDirectoryHandle("monitor-detach-project");
    try {
      await project.getDirectoryHandle("UCSB_XRP_Autosaves");
      return true;
    } catch (error) {
      if (error instanceof DOMException && error.name === "NotFoundError") {
        return false;
      }
      throw error;
    }
  });
  expect(oldFolderWasWritten).toBe(false);
});
