import { expect, test, type Page } from "@playwright/test";

const recoveryKey = "ucsb-xrp-course-project-v2";
const activeProjectFolderKey = "active-project-folder-v2";

async function createProjectFolder(
  page: Page,
  folderName: string,
  projectName: string,
  source: string,
  projectId: string,
): Promise<void> {
  await page.evaluate(
    async ({ folderName, projectName, source, projectId }) => {
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
      const folder = await root.getDirectoryHandle(folderName, {
        create: true,
      });
      const write = async (name: string, content: string) => {
        const handle = await folder.getFileHandle(name, { create: true });
        const writable = await handle.createWritable();
        await writable.write(content);
        await writable.close();
      };
      await write(
        ".ucsb-xrp-project.json",
        `${JSON.stringify({
          name: projectName,
          entrypoint: "main.py",
          session: {
            projectId,
            revision: 1,
            savedRevision: 1,
            updatedAt: 1_788_000_000_000,
          },
        })}\n`,
      );
      await write("main.py", source);
    },
    { folderName, projectName, source, projectId },
  );
}

async function openProject(
  page: Page,
  folderName: string,
  projectName: string,
): Promise<void> {
  await page.evaluate(() => {
    Object.defineProperty(window, "showDirectoryPicker", {
      configurable: true,
      value: async () => navigator.storage.getDirectory(),
    });
  });
  await page.getByRole("button", { name: "Open project…" }).click();
  const dialog = page.getByRole("dialog", { name: "Open a project" });
  if (
    await dialog
      .getByRole("button", { name: "Choose Working folder…" })
      .isVisible()
  ) {
    await dialog
      .getByRole("button", { name: "Choose Working folder…" })
      .click();
  }
  await dialog
    .getByRole("button", {
      name: `Open ${projectName} from ${folderName}`,
    })
    .click();
}

async function readActiveProjectAuthority(page: Page): Promise<{
  recoveryName: string | null;
  folderName: string | null;
}> {
  return page.evaluate(
    async ({ activeProjectFolderKey, recoveryKey }) => {
      const recovered = JSON.parse(
        localStorage.getItem(recoveryKey) ?? "null",
      ) as { name?: string; project?: { name?: string } } | null;
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
      const folder = await new Promise<FileSystemDirectoryHandle | undefined>(
        (resolve, reject) => {
          const transaction = database.transaction(
            "course-folders",
            "readonly",
          );
          const request = transaction
            .objectStore("course-folders")
            .get(activeProjectFolderKey);
          request.onsuccess = () => resolve(request.result);
          request.onerror = () => reject(request.error);
        },
      );
      database.close();
      return {
        recoveryName: recovered?.project?.name ?? recovered?.name ?? null,
        folderName: folder?.name ?? null,
      };
    },
    { activeProjectFolderKey, recoveryKey },
  );
}

async function replaceMain(page: Page, source: string): Promise<void> {
  const editor = page.getByRole("textbox", { name: "main.py editor" });
  await editor.focus();
  await editor.press("ControlOrMeta+A");
  await page.keyboard.insertText(source);
}

async function openProgramOutput(page: Page): Promise<void> {
  await page.getByRole("tab", { name: "Program output" }).click();
}

test("an explicit IDE owns Run across tabs and releases it when closed", async ({
  context,
  page: firstIde,
}) => {
  test.setTimeout(45_000);
  await firstIde.addInitScript(
    ({ key }) => {
      localStorage.clear();
      localStorage.setItem(
        key,
        JSON.stringify({
          name: "Project ownership test",
          entrypoint: "main.py",
          files: { "main.py": 'print("INITIAL")\n' },
        }),
      );
    },
    { key: recoveryKey },
  );
  await firstIde.goto("/ide/");
  await expect(firstIde.getByTestId("target-status")).toContainText(
    "Virtual XRP · ready",
  );
  await expect(firstIde.getByTestId("project-owner-state")).toHaveCount(0);

  const secondIde = await context.newPage();
  await secondIde.goto("/ide/");
  await expect(secondIde.getByTestId("target-status")).toContainText(
    "Virtual XRP · ready",
  );
  await expect(secondIde.getByTestId("project-owner-state")).toContainText(
    "Run uses another IDE tab",
  );
  await expect(
    secondIde.getByRole("button", { name: "Run", exact: true }),
  ).toBeDisabled();

  const monitor = await context.newPage();
  await monitor.goto("/monitor/");
  const monitorRun = monitor
    .locator(".app-header")
    .getByRole("button", { name: "Run", exact: true });
  await expect(monitorRun).toBeEnabled();

  await replaceMain(firstIde, 'print("OWNER_A_FIRST")\n');
  await monitorRun.click();
  await openProgramOutput(firstIde);
  await expect(
    firstIde.getByText("OWNER_A_FIRST", { exact: true }),
  ).toHaveCount(1);
  await expect(monitor.getByTestId("target-status")).toContainText(
    "Virtual XRP · ready",
  );

  await replaceMain(secondIde, 'print("STANDBY_MUST_NOT_RUN")\n');
  await monitorRun.click();
  await expect(
    firstIde.getByText("OWNER_A_FIRST", { exact: true }),
  ).toHaveCount(2);
  await expect(firstIde.getByRole("log")).not.toContainText(
    "STANDBY_MUST_NOT_RUN",
  );
  await expect(monitor.getByTestId("target-status")).toContainText(
    "Virtual XRP · ready",
  );

  await secondIde
    .getByRole("button", { name: "Use for Run + Monitor" })
    .click();
  await expect(secondIde.getByTestId("project-owner-state")).toHaveCount(0);
  await expect(firstIde.getByTestId("project-owner-state")).toContainText(
    "Run uses another IDE tab",
  );
  await replaceMain(secondIde, 'print("OWNER_B_AFTER_TAKEOVER")\n');
  await monitorRun.click();
  await openProgramOutput(secondIde);
  await expect(secondIde.getByRole("log")).toContainText(
    "OWNER_B_AFTER_TAKEOVER",
  );
  await expect(monitor.getByTestId("target-status")).toContainText(
    "Virtual XRP · ready",
  );

  // A normal browser tab close runs beforeunload. Playwright bypasses that
  // lifecycle by default, so request the real browser behavior explicitly.
  await secondIde.close({ runBeforeUnload: true });
  await expect(firstIde.getByTestId("project-owner-state")).toContainText(
    "Run has no IDE project",
  );
  await expect(monitorRun).toBeEnabled();
  await expect(monitorRun).toHaveAttribute(
    "title",
    /Compile and run Expanding spiral/,
  );
  await firstIde.getByRole("tab", { name: "Status", exact: true }).click();
  const status = firstIde.locator(".status-grid");
  await expect(status).toContainText("Expanding spiral · Virtual XRP");
  await expect(status).toContainText("Compilation");
  await expect(status).toContainText("Passed");
  await expect(status).not.toContainText(
    /revision|another IDE|built-in default/,
  );
  await monitorRun.click();
  await expect(monitor.getByTestId("target-status")).toContainText(
    "Virtual XRP · running",
  );
  await monitor
    .locator(".app-header")
    .getByRole("button", { name: "Stop", exact: true })
    .click();
  await expect(monitor.getByTestId("target-status")).toContainText(
    "Virtual XRP · ready",
  );

  await firstIde.getByRole("button", { name: "Use for Run + Monitor" }).click();
  await expect(firstIde.getByTestId("project-owner-state")).toHaveCount(0);
  await replaceMain(firstIde, 'print("OWNER_A_RECLAIMED")\n');
  await expect(monitorRun).toBeEnabled();
  await monitorRun.click();
  await openProgramOutput(firstIde);
  await expect(firstIde.getByRole("log")).toContainText("OWNER_A_RECLAIMED");
  await expect(monitor.getByTestId("target-status")).toContainText(
    "Virtual XRP · ready",
  );
});

test("standby project changes preserve reopen authority until explicit takeover", async ({
  context,
  page: firstIde,
}) => {
  test.setTimeout(30_000);
  await firstIde.addInitScript(() => localStorage.clear());
  await firstIde.goto("/ide/");
  await expect(firstIde.getByTestId("target-status")).toContainText(
    "Virtual XRP · ready",
  );
  await createProjectFolder(
    firstIde,
    "owner-project-a",
    "Owner project A",
    'print("OWNER_A")\n',
    "owner-project-a-id",
  );
  await createProjectFolder(
    firstIde,
    "standby-project-b",
    "Standby project B",
    'print("STANDBY_B")\n',
    "standby-project-b-id",
  );
  await openProject(firstIde, "owner-project-a", "Owner project A");
  await expect(firstIde.getByTestId("project-folder")).toHaveText(
    "./owner-project-a",
  );
  await expect
    .poll(() => readActiveProjectAuthority(firstIde))
    .toEqual({
      recoveryName: "Owner project A",
      folderName: "owner-project-a",
    });

  const standbyIde = await context.newPage();
  await standbyIde.goto("/ide/");
  await expect(standbyIde.getByTestId("project-owner-state")).toContainText(
    "Run uses another IDE tab",
  );
  await openProject(standbyIde, "standby-project-b", "Standby project B");
  await expect(standbyIde.getByTestId("project-folder")).toHaveText(
    "./standby-project-b",
  );

  await expect
    .poll(() => readActiveProjectAuthority(firstIde))
    .toEqual({
      recoveryName: "Owner project A",
      folderName: "owner-project-a",
    });

  await standbyIde
    .getByRole("button", { name: "Use for Run + Monitor" })
    .click();
  await expect(standbyIde.getByTestId("project-owner-state")).toHaveCount(0);
  await expect(firstIde.getByTestId("project-owner-state")).toContainText(
    "Run uses another IDE tab",
  );
  await expect
    .poll(() => readActiveProjectAuthority(standbyIde))
    .toEqual({
      recoveryName: "Standby project B",
      folderName: "standby-project-b",
    });
});

test("Monitor cannot replace active project authority with stale archive metadata", async ({
  context,
  page: ide,
}) => {
  test.setTimeout(30_000);
  await ide.addInitScript(() => localStorage.clear());
  await ide.goto("/ide/");
  await expect(ide.getByTestId("target-status")).toContainText(
    "Virtual XRP · ready",
  );
  await createProjectFolder(
    ide,
    "monitor-owner-project",
    "Monitor owner project",
    'print("MONITOR_OWNER")\n',
    "monitor-owner-project-id",
  );
  await createProjectFolder(
    ide,
    "monitor-archive-choice",
    "Monitor archive choice",
    'print("ARCHIVE_ONLY")\n',
    "monitor-archive-choice-id",
  );
  await openProject(ide, "monitor-owner-project", "Monitor owner project");
  await expect
    .poll(() => readActiveProjectAuthority(ide))
    .toEqual({
      recoveryName: "Monitor owner project",
      folderName: "monitor-owner-project",
    });

  await ide.evaluate(async () => {
    localStorage.setItem(
      "ucsb-xrp-course-project-v1",
      JSON.stringify({
        name: "Monitor archive choice",
        entrypoint: "main.py",
        files: { "main.py": 'print("ARCHIVE_ONLY")\n' },
      }),
    );
    const root = await navigator.storage.getDirectory();
    const staleFolder = await root.getDirectoryHandle("monitor-archive-choice");
    const database = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open("ucsb-xrp-course-tools-v1", 1);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction("course-folders", "readwrite");
      transaction
        .objectStore("course-folders")
        .put(staleFolder, "project-folder-v1");
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(transaction.error);
    });
    database.close();
  });

  const monitor = await context.newPage();
  await monitor.goto("/monitor/");
  await expect(monitor.getByTestId("run-autosave-status")).toContainText(
    "Runs save to ./monitor-owner-project",
  );
  await expect(
    monitor.getByRole("button", {
      name: /Change project|Choose project folder/,
    }),
  ).toHaveCount(0);

  await expect
    .poll(() => readActiveProjectAuthority(ide))
    .toEqual({
      recoveryName: "Monitor owner project",
      folderName: "monitor-owner-project",
    });
});
