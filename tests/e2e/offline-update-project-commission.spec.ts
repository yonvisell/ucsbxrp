import { expect, test, type Page } from "@playwright/test";

const folderDatabaseName = "ucsb-xrp-course-tools-v1";
const folderStoreName = "course-folders";
const workspaceFolderKey = "workspace-folder-capability-v1";

async function waitForOfflineShell(page: Page) {
  await expect(page.locator("html")).toHaveAttribute(
    "data-offline-shell-state",
    "ready",
  );
}

async function announceCourseUpdate(page: Page, version: string) {
  await page.evaluate(async (nextVersion) => {
    const registration = await navigator.serviceWorker.ready;
    const scopePath = new URL(registration.scope).pathname;
    const channel = new BroadcastChannel(`ucsb-xrp-release-ready:${scopePath}`);
    channel.postMessage({ type: "release-ready", version: nextVersion });
    channel.close();
  }, version);
  await expect(page.locator("html")).toHaveAttribute(
    "data-offline-shell-update-version",
    version,
  );
}

async function readRememberedWorkingFolderName(page: Page) {
  return page.evaluate(
    async ({ folderDatabaseName, folderStoreName, workspaceFolderKey }) => {
      const database = await new Promise<IDBDatabase>((resolve, reject) => {
        const request = indexedDB.open(folderDatabaseName, 1);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
      const folder = await new Promise<FileSystemDirectoryHandle | undefined>(
        (resolve, reject) => {
          const transaction = database.transaction(folderStoreName, "readonly");
          const request = transaction
            .objectStore(folderStoreName)
            .get(workspaceFolderKey);
          request.onsuccess = () => resolve(request.result);
          request.onerror = () => reject(request.error);
        },
      );
      database.close();
      return folder?.name ?? null;
    },
    { folderDatabaseName, folderStoreName, workspaceFolderKey },
  );
}

test("commissioning finishes its Working-folder choice before applying an app update", async ({
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
  await page.getByRole("button", { name: "Choose Working folder" }).click();
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
    page.getByRole("heading", { name: "Choose a Working folder" }),
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
    page.getByRole("heading", { name: "Connect the XRP by USB-C" }),
  ).toBeVisible();
  await expect
    .poll(() => readRememberedWorkingFolderName(page))
    .toBe("commission-workspace");
});
