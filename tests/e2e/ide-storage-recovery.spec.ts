import { expect, test, type Page } from "@playwright/test";

interface RememberedFolderOptions {
  workspacePermission?: PermissionState;
  rememberRepositoryAsProject?: boolean;
  rememberExternalProject?: boolean;
}

async function installRememberedFolders(
  page: Page,
  options: RememberedFolderOptions,
) {
  await page.addInitScript((configuration: RememberedFolderOptions) => {
    const probe = {
      pickerCount: 0,
      permissionRequestCount: 0,
      writeCount: 0,
      projectHandleRetained:
        configuration.rememberRepositoryAsProject === true ||
        configuration.rememberExternalProject === true,
    };

    class MemoryFileHandle {
      readonly kind = "file";

      constructor(
        readonly name: string,
        private readonly content: string,
      ) {}

      async getFile() {
        return new File([this.content], this.name);
      }

      async createWritable() {
        probe.writeCount += 1;
        return {
          write: async () => undefined,
          close: async () => undefined,
        };
      }
    }

    class MemoryDirectoryHandle {
      readonly kind = "directory";

      constructor(
        readonly name: string,
        private readonly files: Record<string, string>,
        private readonly permission: PermissionState,
        private readonly rootId: string,
        private readonly path: string[] = [],
      ) {}

      async *entries() {
        for (const [name, content] of Object.entries(this.files)) {
          yield [name, new MemoryFileHandle(name, content)] as const;
        }
      }

      async getDirectoryHandle() {
        throw new DOMException("Directory not found", "NotFoundError");
      }

      async getFileHandle(name: string) {
        const content = this.files[name];
        if (content === undefined) {
          throw new DOMException("File not found", "NotFoundError");
        }
        return new MemoryFileHandle(name, content);
      }

      async removeEntry() {
        throw new DOMException("File not found", "NotFoundError");
      }

      async isSameEntry(other: MemoryDirectoryHandle) {
        return (
          other instanceof MemoryDirectoryHandle &&
          other.rootId === this.rootId &&
          other.path.join("/") === this.path.join("/")
        );
      }

      async resolve(
        possibleDescendant: MemoryDirectoryHandle,
      ): Promise<string[] | null> {
        if (
          !(possibleDescendant instanceof MemoryDirectoryHandle) ||
          possibleDescendant.rootId !== this.rootId ||
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
        return this.permission;
      }

      async requestPermission() {
        probe.permissionRequestCount += 1;
        return "granted" as const;
      }
    }

    const workspace = new MemoryDirectoryHandle(
      "xrp_test_2",
      {},
      configuration.workspacePermission ?? "prompt",
      "workspace",
    );
    const repository = new MemoryDirectoryHandle(
      "Coursemobilerobotics",
      {
        "AGENTS.md": "project instructions\n",
        "CODEX_IMPLEMENTATION_PROMPT.md": "implementation prompt\n",
        "PROJECT_CONTEXT.md": "course repository\n",
        "device_service.py": "print('service')\n",
      },
      "granted",
      "repository",
    );
    const externalProject = new MemoryDirectoryHandle(
      "Previous-Project",
      {
        ".ucsb-xrp-project.json": `${JSON.stringify({ name: "Previous project", entrypoint: "main.py" })}\n`,
        "main.py": 'print("previous course folder")\n',
      },
      "granted",
      "previous-workspace",
    );
    const retainedHandles = new Map<string, unknown>();
    retainedHandles.set("workspace-folder-v1", workspace);
    if (configuration.rememberRepositoryAsProject) {
      retainedHandles.set("project-folder-v1", repository);
      localStorage.setItem(
        "ucsb-xrp-course-project-v2",
        JSON.stringify({
          name: "Coursemobilerobotics",
          entrypoint: "device_service.py",
          files: {
            "AGENTS.md": "project instructions\n",
            "CODEX_IMPLEMENTATION_PROMPT.md": "implementation prompt\n",
            "PROJECT_CONTEXT.md": "course repository\n",
            "device_service.py": "print('service')\n",
          },
        }),
      );
    }
    if (configuration.rememberExternalProject) {
      retainedHandles.set("project-folder-v1", externalProject);
    }

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
          window.setTimeout(() => {
            const handler = transaction.oncomplete;
            if (typeof handler === "function") handler(new Event("complete"));
          }, 0);
        transaction.objectStore = () => ({
          get: (key: IDBValidKey) => {
            const request: Record<string, unknown> = {
              result: undefined,
              error: null,
              onsuccess: null,
              onerror: null,
            };
            window.setTimeout(() => {
              request.result = retainedHandles.get(String(key));
              const handler = request.onsuccess;
              if (typeof handler === "function") handler(new Event("success"));
              complete();
            }, 0);
            return request;
          },
          put: (value: unknown, key: IDBValidKey) => {
            retainedHandles.set(String(key), value);
            complete();
          },
          delete: (key: IDBValidKey) => {
            retainedHandles.delete(String(key));
            if (String(key) === "project-folder-v1") {
              probe.projectHandleRetained = false;
            }
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
        window.setTimeout(() => {
          request.result = database;
          const handler = request.onsuccess;
          if (typeof handler === "function") handler(new Event("success"));
        }, 0);
        return request;
      },
    };

    Object.defineProperty(window, "indexedDB", {
      configurable: true,
      value: indexedDb,
    });
    Object.defineProperty(window, "showDirectoryPicker", {
      configurable: true,
      value: async () => {
        probe.pickerCount += 1;
        return workspace;
      },
    });
    Object.defineProperty(window, "__folderRecoveryProbe", {
      configurable: true,
      value: probe,
    });
  }, options);
}

test("does not restore a remembered repository as a student project", async ({
  page: ide,
}) => {
  await installRememberedFolders(ide, {
    rememberRepositoryAsProject: true,
  });

  await ide.goto("/ide/");

  await expect(ide.getByTestId("project-folder")).toContainText(
    "Expanding spiral",
  );
  await expect(
    ide.getByRole("button", { name: /Open AGENTS\.md/ }),
  ).toHaveCount(0);
  await expect(
    ide.getByText(
      "The remembered folder is not a UCSBXRP project, so it was not opened or modified.",
    ),
  ).toBeVisible();
  await expect
    .poll(() =>
      ide.evaluate(
        () =>
          (
            window as unknown as {
              __folderRecoveryProbe: {
                projectHandleRetained: boolean;
                writeCount: number;
              };
            }
          ).__folderRecoveryProbe,
      ),
    )
    .toMatchObject({ projectHandleRetained: false, writeCount: 0 });
});

test("migrates a valid v1 project independently of the Projects location", async ({
  page: ide,
}) => {
  await installRememberedFolders(ide, {
    rememberExternalProject: true,
    workspacePermission: "granted",
  });

  await ide.goto("/ide/");

  await expect(ide.getByTestId("project-folder")).toHaveText(
    "./Previous-Project",
  );
  await expect(ide.getByRole("button", { name: /Open main\.py/ })).toHaveCount(
    1,
  );
  await expect
    .poll(() =>
      ide.evaluate(async () => {
        const database = await new Promise<IDBDatabase>((resolve, reject) => {
          const request = indexedDB.open("ucsb-xrp-course-tools-v1", 1);
          request.onsuccess = () => resolve(request.result);
          request.onerror = () => reject(request.error);
        });
        const read = (key: string) =>
          new Promise<FileSystemDirectoryHandle | undefined>(
            (resolve, reject) => {
              const transaction = database.transaction(
                "course-folders",
                "readonly",
              );
              const request = transaction
                .objectStore("course-folders")
                .get(key);
              request.onsuccess = () => resolve(request.result);
              request.onerror = () => reject(request.error);
            },
          );
        const current = await read("active-project-folder-v2");
        const previous = await read("project-folder-v1");
        database.close();
        const recovered = JSON.parse(
          localStorage.getItem("ucsb-xrp-course-project-v2") ?? "null",
        ) as {
          name?: string;
          files?: Record<string, string>;
          project?: { name?: string; files?: Record<string, string> };
        } | null;
        return {
          currentFolder: current?.name ?? null,
          previousFolder: previous?.name ?? null,
          recoveryName: recovered?.project?.name ?? recovered?.name ?? null,
          recoverySource:
            recovered?.project?.files?.["main.py"] ??
            recovered?.files?.["main.py"] ??
            null,
        };
      }),
    )
    .toEqual({
      currentFolder: "Previous-Project",
      previousFolder: "Previous-Project",
      recoveryName: "Previous project",
      recoverySource: 'print("previous course folder")\n',
    });
});

test("opens a template in browser recovery without requesting an old folder", async ({
  page: ide,
}) => {
  await installRememberedFolders(ide, { workspacePermission: "prompt" });
  await ide.goto("/ide/");

  await ide.getByLabel("Project template").selectOption("micropython_tutorial");
  await ide.getByRole("button", { name: "Create", exact: true }).click();

  await expect(
    ide.getByRole("button", {
      name: "Open 1_values_and_functions.py (main file)",
    }),
  ).toBeVisible();
  await expect(ide.getByRole("dialog")).toHaveCount(0);
  await expect
    .poll(() =>
      ide.evaluate(
        () =>
          (
            window as unknown as {
              __folderRecoveryProbe: {
                permissionRequestCount: number;
                pickerCount: number;
              };
            }
          ).__folderRecoveryProbe,
      ),
    )
    .toMatchObject({ permissionRequestCount: 0, pickerCount: 0 });
});
