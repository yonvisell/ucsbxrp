import { expect, test } from "@playwright/test";

import { seedWorkingFolder, type TestProject } from "./working-folder";

const currentProject: TestProject = {
  name: "Current folder project",
  entrypoint: "main.py",
  files: { "main.py": 'print("CURRENT_FOLDER_PROJECT")\n' },
};

test("the Working-folder manifest ignores obsolete project recovery records", async ({
  page: ide,
}) => {
  await seedWorkingFolder(ide, {
    folderName: "Manifest-Authority",
    project: currentProject,
    projectFolderName: "Current-Project",
  });
  await ide.evaluate(async () => {
    const root = await navigator.storage.getDirectory();
    const obsoleteProject = await root.getDirectoryHandle("Obsolete-Project", {
      create: true,
    });
    const obsoleteWorkspace = await root.getDirectoryHandle(
      "Obsolete-Workspace",
      { create: true },
    );
    const database = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open("ucsb-xrp-course-tools-v1", 1);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction("course-folders", "readwrite");
      const store = transaction.objectStore("course-folders");
      store.put(obsoleteProject, "active-project-folder-v2");
      store.put(obsoleteWorkspace, "workspace-folder-v1");
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(transaction.error);
    });
    database.close();
    localStorage.setItem(
      "ucsb-xrp-unsaved-project-v3",
      JSON.stringify({
        name: "Obsolete browser project",
        entrypoint: "main.py",
        files: { "main.py": 'print("OBSOLETE_BROWSER_PROJECT")\n' },
      }),
    );
  });

  await ide.goto("/ide/");
  await expect(ide.getByTestId("project-name")).toHaveText(
    "Current folder project",
  );
  await expect(ide.getByTestId("project-folder")).toHaveText("Current-Project");
  await expect(
    ide.getByRole("button", { name: "Open main.py (main file)" }),
  ).toBeVisible();
});

test("denied Working-folder permission remains a visible reconnect action", async ({
  page: ide,
}) => {
  await ide.addInitScript(() => {
    const testWindow = window as typeof window & { __pickerCalls?: number };
    testWindow.__pickerCalls = 0;
    Object.defineProperties(FileSystemDirectoryHandle.prototype, {
      queryPermission: {
        configurable: true,
        value: async () => "prompt",
      },
      requestPermission: {
        configurable: true,
        value: async () => "denied",
      },
    });
    Object.defineProperty(window, "showDirectoryPicker", {
      configurable: true,
      value: async () => {
        testWindow.__pickerCalls = (testWindow.__pickerCalls ?? 0) + 1;
        throw new DOMException("No folder selected", "AbortError");
      },
    });
  });
  await seedWorkingFolder(ide, {
    folderName: "Permission-Workspace",
    project: currentProject,
    projectFolderName: "Current-Project",
  });

  await ide.goto("/ide/");
  await ide.getByRole("button", { name: "Open project…" }).click();
  const dialog = ide.getByRole("dialog", { name: "Open project" });
  await expect(dialog).toContainText(
    "Reconnect Permission-Workspace to see its projects.",
  );
  await dialog
    .getByRole("button", { name: "Reconnect Working folder…" })
    .click();

  await expect(dialog).toContainText(
    "Access to the Working folder Permission-Workspace was not granted.",
  );
  expect(
    await ide.evaluate(
      () =>
        (window as typeof window & { __pickerCalls?: number }).__pickerCalls ??
        0,
    ),
  ).toBe(0);
  await expect(ide.getByTestId("project-folder")).toHaveText("Not selected");
});

test("a retained folder that rejects its background read recovers from the project rail", async ({
  page: ide,
}) => {
  await seedWorkingFolder(ide, {
    folderName: "Sleep-Recovery-Workspace",
    project: currentProject,
    projectFolderName: "Current-Project",
    robot: {
      id: "robot-after-sleep",
      name: "ucsb-xrp-after-sleep",
      networkMode: "station",
      ssid: "Course Wi-Fi",
      address: "127.0.0.1:65534",
    },
  });
  await ide.addInitScript(() => {
    const testWindow = window as typeof window & { __pickerCalls?: number };
    testWindow.__pickerCalls = 0;
    const originalGetFileHandle =
      FileSystemDirectoryHandle.prototype.getFileHandle;
    Object.defineProperties(FileSystemDirectoryHandle.prototype, {
      queryPermission: {
        configurable: true,
        value: async () => "granted",
      },
      requestPermission: {
        configurable: true,
        value: async () => "granted",
      },
      getFileHandle: {
        configurable: true,
        value: function (
          this: FileSystemDirectoryHandle,
          ...args: Parameters<FileSystemDirectoryHandle["getFileHandle"]>
        ) {
          if (
            this.name === "Sleep-Recovery-Workspace" &&
            !navigator.userActivation.isActive
          ) {
            return Promise.reject(
              new DOMException(
                "The request is not allowed in the current context",
                "NotAllowedError",
              ),
            );
          }
          return originalGetFileHandle.apply(this, args);
        },
      },
    });
    Object.defineProperty(window, "showDirectoryPicker", {
      configurable: true,
      value: async () => {
        testWindow.__pickerCalls = (testWindow.__pickerCalls ?? 0) + 1;
        throw new DOMException("No folder selected", "AbortError");
      },
    });
  });

  await ide.goto("/ide/");
  await expect(ide.getByTestId("project-folder")).toHaveText("Not selected");
  const reconnect = ide.getByRole("button", {
    name: "Reconnect Working folder…",
  });
  await expect(reconnect).toBeVisible();
  await expect(
    ide.getByRole("option", { name: "Physical XRP · reconnect folder" }),
  ).toBeDisabled();

  await reconnect.click();

  await expect(ide.getByTestId("project-folder")).toHaveText("Current-Project");
  await expect(ide.getByLabel("Run on")).toContainText("Physical XRP");
  await expect(
    ide.getByRole("option", { name: "Physical XRP", exact: true }),
  ).toBeEnabled();
  expect(
    await ide.evaluate(
      () =>
        (window as typeof window & { __pickerCalls?: number }).__pickerCalls ??
        0,
    ),
  ).toBe(0);
});
