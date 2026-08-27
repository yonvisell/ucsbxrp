import { expect, test, type Page } from "@playwright/test";

const folderDatabaseName = "ucsb-xrp-course-tools-v1";
const folderStoreName = "course-folders";
const activeProjectFolderKey = "active-project-folder-v2";
const workspaceFolderKey = "workspace-folder-v1";
const projectRecoveryKey = "ucsb-xrp-course-project-v2";

interface StoredProject {
  name: string;
  projectId: string;
  source: string;
}

async function waitForOfflineShell(page: Page) {
  await expect(page.locator("html")).toHaveAttribute(
    "data-offline-shell-state",
    "ready",
  );
}

/** Signal a peer-tab release without changing the preview server itself. */
async function announceCourseUpdate(page: Page, version: string) {
  await page.evaluate(async (nextVersion) => {
    const registration = await navigator.serviceWorker.ready;
    const scopePath = new URL(registration.scope).pathname;
    const channel = new BroadcastChannel(`ucsb-xrp-release-ready:${scopePath}`);
    channel.postMessage({ type: "release-ready", version: nextVersion });
    channel.close();
  }, version);
  await expect(page.getByTestId("offline-readiness")).toContainText(
    "Course update ready",
  );
}

async function writeProject(
  page: Page,
  folderName: string,
  project: StoredProject,
) {
  await page.evaluate(
    async ({ folderName, project }) => {
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
        const file = await folder.getFileHandle(name, { create: true });
        const writable = await file.createWritable();
        await writable.write(content);
        await writable.close();
      };
      await write(
        ".ucsb-xrp-project.json",
        `${JSON.stringify({
          name: project.name,
          entrypoint: "main.py",
          session: {
            projectId: project.projectId,
            revision: 1,
            savedRevision: 1,
            updatedAt: 1_788_000_004_000,
          },
        })}\n`,
      );
      await write("main.py", project.source);
    },
    { folderName, project },
  );
}

async function rememberFolder(page: Page, folderName: string, key: string) {
  await page.evaluate(
    async ({ folderDatabaseName, folderStoreName, folderName, key }) => {
      const root = await navigator.storage.getDirectory();
      const folder = await root.getDirectoryHandle(folderName);
      const database = await new Promise<IDBDatabase>((resolve, reject) => {
        const request = indexedDB.open(folderDatabaseName, 1);
        request.onupgradeneeded = () => {
          if (!request.result.objectStoreNames.contains(folderStoreName)) {
            request.result.createObjectStore(folderStoreName);
          }
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
      await new Promise<void>((resolve, reject) => {
        const transaction = database.transaction(folderStoreName, "readwrite");
        transaction.objectStore(folderStoreName).put(folder, key);
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
        transaction.onabort = () => reject(transaction.error);
      });
      database.close();
    },
    {
      folderDatabaseName,
      folderStoreName,
      folderName,
      key,
    },
  );
}

async function readRememberedFolderName(page: Page, key: string) {
  return page.evaluate(
    async ({ folderDatabaseName, folderStoreName, key }) => {
      const database = await new Promise<IDBDatabase>((resolve, reject) => {
        const request = indexedDB.open(folderDatabaseName, 1);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
      const folder = await new Promise<FileSystemDirectoryHandle | undefined>(
        (resolve, reject) => {
          const transaction = database.transaction(folderStoreName, "readonly");
          const request = transaction.objectStore(folderStoreName).get(key);
          request.onsuccess = () => resolve(request.result);
          request.onerror = () => reject(request.error);
        },
      );
      database.close();
      return folder?.name ?? null;
    },
    { folderDatabaseName, folderStoreName, key },
  );
}

async function storeBrowserRecovery(page: Page, project: StoredProject) {
  await page.evaluate(
    ({ projectRecoveryKey, project }) => {
      localStorage.setItem(
        projectRecoveryKey,
        JSON.stringify({
          name: project.name,
          entrypoint: "main.py",
          files: { "main.py": project.source },
          session: {
            projectId: project.projectId,
            revision: 1,
            savedRevision: 1,
            updatedAt: 1_788_000_004_000,
          },
        }),
      );
    },
    { projectRecoveryKey, project },
  );
}

test("an IDE update waits for Open Project and reopens the newly remembered project", async ({
  page,
}) => {
  const oldProject: StoredProject = {
    name: "Prior project",
    projectId: "prior-project-id",
    source: 'print("PRIOR_PROJECT")\n',
  };
  const nextProject: StoredProject = {
    name: "Newly opened project",
    projectId: "newly-opened-project-id",
    source: 'print("NEWLY_OPENED_PROJECT")\n',
  };

  await page.goto("/ide/");
  await waitForOfflineShell(page);
  await writeProject(page, "prior-project", oldProject);
  await writeProject(page, "newly-opened-project", nextProject);
  await rememberFolder(page, "prior-project", activeProjectFolderKey);
  await storeBrowserRecovery(page, oldProject);
  await page.reload();
  await expect(page.getByTestId("project-folder")).toHaveText(
    "./prior-project",
  );

  await page.evaluate(() => {
    const testWindow = window as typeof window & {
      __resolveProjectPicker?: () => void;
      __projectPickerPending?: boolean;
    };
    Object.defineProperty(window, "showDirectoryPicker", {
      configurable: true,
      value: () =>
        new Promise<FileSystemDirectoryHandle>((resolve) => {
          testWindow.__projectPickerPending = true;
          testWindow.__resolveProjectPicker = () => {
            void navigator.storage
              .getDirectory()
              .then((root) => root.getDirectoryHandle("newly-opened-project"))
              .then(resolve);
          };
        }),
    });
  });
  await page.getByRole("button", { name: "Open project" }).click();
  await expect
    .poll(() =>
      page.evaluate(() =>
        Boolean(
          (window as typeof window & { __projectPickerPending?: boolean })
            .__projectPickerPending,
        ),
      ),
    )
    .toBe(true);

  await announceCourseUpdate(page, "test-release-open-project");
  await expect(page.getByTestId("project-folder")).toHaveText(
    "./prior-project",
  );

  const reloaded = page.waitForEvent("load");
  await page.evaluate(() => {
    const testWindow = window as typeof window & {
      __resolveProjectPicker?: () => void;
    };
    testWindow.__resolveProjectPicker?.();
  });
  await reloaded;

  await expect(page.getByTestId("project-folder")).toHaveText(
    "./newly-opened-project",
  );
  expect(
    await page.evaluate((key) => {
      const stored = JSON.parse(localStorage.getItem(key) ?? "null") as {
        project?: { files?: Record<string, string> };
        files?: Record<string, string>;
      } | null;
      if (stored === null) return undefined;
      return (stored.project ?? stored).files?.["main.py"];
    }, projectRecoveryKey),
  ).toBe(nextProject.source);
  await expect
    .poll(() => readRememberedFolderName(page, activeProjectFolderKey))
    .toBe("newly-opened-project");
});

test("an IDE update waits for Create Project and reopens the created folder", async ({
  page,
}) => {
  const oldProject: StoredProject = {
    name: "Prior project",
    projectId: "prior-create-project-id",
    source: 'print("PRIOR_CREATE_PROJECT")\n',
  };

  await page.goto("/ide/");
  await waitForOfflineShell(page);
  await writeProject(page, "prior-create-project", oldProject);
  await page.evaluate(async () => {
    const root = await navigator.storage.getDirectory();
    try {
      await root.removeEntry("project-workspace", { recursive: true });
    } catch (error) {
      if (!(error instanceof DOMException) || error.name !== "NotFoundError") {
        throw error;
      }
    }
    await root.getDirectoryHandle("project-workspace", { create: true });
  });
  await rememberFolder(page, "prior-create-project", activeProjectFolderKey);
  await rememberFolder(page, "project-workspace", workspaceFolderKey);
  await storeBrowserRecovery(page, oldProject);
  await page.reload();
  await expect(page.getByTestId("project-folder")).toHaveText(
    "./prior-create-project",
  );

  await page.getByLabel("Project template").selectOption("challenge_1");
  await page.getByRole("button", { name: "Create", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Name the project folder" }),
  ).toBeVisible();
  await page.getByLabel("Folder name").fill("Created-During-Update");

  await announceCourseUpdate(page, "test-release-create-project");
  await expect(
    page.getByRole("heading", { name: "Name the project folder" }),
  ).toBeVisible();

  const reloaded = page.waitForEvent("load");
  await page.getByRole("button", { name: "Create project" }).click();
  await reloaded;

  await expect(page.getByTestId("project-folder")).toHaveText(
    "./Created-During-Update",
  );
  await expect(
    page.getByRole("button", { name: "Open sensor_model.py" }),
  ).toBeVisible();
  await expect
    .poll(() => readRememberedFolderName(page, activeProjectFolderKey))
    .toBe("Created-During-Update");
});

test("commissioning defers a course update until the folder picker and write check finish", async ({
  page,
}) => {
  await page.goto("/commission/");
  await waitForOfflineShell(page);
  await page.evaluate(() => {
    const testWindow = window as typeof window & {
      __resolveWorkingFolderPicker?: () => void;
      __workingFolderPickerPending?: boolean;
    };
    Object.defineProperty(window, "showDirectoryPicker", {
      configurable: true,
      value: () =>
        new Promise<FileSystemDirectoryHandle>((resolve) => {
          testWindow.__workingFolderPickerPending = true;
          testWindow.__resolveWorkingFolderPicker = () => {
            void navigator.storage
              .getDirectory()
              .then((root) =>
                root.getDirectoryHandle("commission-workspace", {
                  create: true,
                }),
              )
              .then(resolve);
          };
        }),
    });
  });
  await page.getByRole("button", { name: "Choose Projects folder" }).click();
  await expect
    .poll(() =>
      page.evaluate(() =>
        Boolean(
          (
            window as typeof window & {
              __workingFolderPickerPending?: boolean;
            }
          ).__workingFolderPickerPending,
        ),
      ),
    )
    .toBe(true);

  await announceCourseUpdate(page, "test-release-commission-folder");
  await expect(
    page.getByRole("heading", { name: "Choose a Projects folder" }),
  ).toBeVisible();

  const reloaded = page.waitForEvent("load");
  await page.evaluate(() => {
    const testWindow = window as typeof window & {
      __resolveWorkingFolderPicker?: () => void;
    };
    testWindow.__resolveWorkingFolderPicker?.();
  });
  await reloaded;

  await expect(
    page.getByRole("button", { name: "Use commission-workspace" }),
  ).toBeVisible();
  await expect
    .poll(() => readRememberedFolderName(page, workspaceFolderKey))
    .toBe("commission-workspace");
});

test("commissioning defers a course update until the serial picker closes", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "serial", {
      configurable: true,
      value: {
        getPorts: async () => [],
        requestPort: () =>
          new Promise((_, reject) => {
            const testWindow = window as typeof window & {
              __cancelSerialPicker?: () => void;
              __serialPickerPending?: boolean;
            };
            testWindow.__serialPickerPending = true;
            testWindow.__cancelSerialPicker = () =>
              reject(
                new DOMException(
                  "No port selected by the user.",
                  "NotFoundError",
                ),
              );
          }),
      },
    });
  });
  await page.goto("/commission/");
  await waitForOfflineShell(page);
  await page.getByRole("button", { name: "Continue without folder" }).click();
  await expect(
    page.getByRole("heading", { name: "Connect the XRP by USB-C" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Choose connected XRP" }).click();
  await expect
    .poll(() =>
      page.evaluate(() =>
        Boolean(
          (window as typeof window & { __serialPickerPending?: boolean })
            .__serialPickerPending,
        ),
      ),
    )
    .toBe(true);

  await announceCourseUpdate(page, "test-release-commission-serial");
  await expect(
    page.getByRole("heading", { name: "Connect the XRP by USB-C" }),
  ).toBeVisible();

  const reloaded = page.waitForEvent("load");
  await page.evaluate(() => {
    const testWindow = window as typeof window & {
      __cancelSerialPicker?: () => void;
    };
    testWindow.__cancelSerialPicker?.();
  });
  await reloaded;
  await expect(
    page.getByRole("heading", { name: "Choose a Projects folder" }),
  ).toBeVisible();
});
