import { expect, test, type Page } from "@playwright/test";

const activeProjectFolderKey = "active-project-folder-v2";
const projectsLocationKey = "workspace-folder-v1";

async function readRememberedFolderName(page: Page, key: string) {
  return page.evaluate(async (key) => {
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
        const transaction = database.transaction("course-folders", "readonly");
        const request = transaction.objectStore("course-folders").get(key);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      },
    );
    database.close();
    return folder?.name ?? null;
  }, key);
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.clear();
    Object.defineProperty(window, "showDirectoryPicker", {
      configurable: true,
      value: async () => {
        const root = await navigator.storage.getDirectory();
        try {
          await root.removeEntry("student-course", { recursive: true });
        } catch (error) {
          if (
            !(error instanceof DOMException) ||
            error.name !== "NotFoundError"
          ) {
            throw error;
          }
        }
        return root.getDirectoryHandle("student-course", { create: true });
      },
    });
  });
});

test("groups folder actions separately from file creation and import", async ({
  page,
}) => {
  await page.goto("/ide/");

  const projectActions = page.getByRole("group", { name: "Project actions" });
  await expect(
    projectActions.getByRole("button", { name: "Open project…" }),
  ).toBeVisible();
  await expect(
    projectActions.getByRole("button", { name: "New project…" }),
  ).toBeVisible();
  await expect(
    projectActions.getByRole("button", { name: "Save project…" }),
  ).toBeVisible();

  const fileActions = page.getByRole("group", {
    name: "Create or import project files",
  });
  await expect(
    fileActions.getByRole("button", { name: "New file…" }),
  ).toBeVisible();
  await expect(
    fileActions.getByRole("button", { name: "Import files…" }),
  ).toBeVisible();
  await expect(
    fileActions.getByRole("button", { name: "Open project…" }),
  ).toHaveCount(0);
});

test("Open project lists project folders inside the selected Working folder", async ({
  page,
}) => {
  await page.goto("/ide/");
  await page.evaluate(async () => {
    const browserRoot = await navigator.storage.getDirectory();
    try {
      await browserRoot.removeEntry("strict-project-boundary", {
        recursive: true,
      });
    } catch (error) {
      if (!(error instanceof DOMException) || error.name !== "NotFoundError") {
        throw error;
      }
    }
    const workingFolder = await browserRoot.getDirectoryHandle(
      "strict-project-boundary",
      { create: true },
    );
    const write = async (
      folder: FileSystemDirectoryHandle,
      path: string,
      content: string,
    ) => {
      const file = await folder.getFileHandle(path, { create: true });
      const writable = await file.createWritable();
      await writable.write(content);
      await writable.close();
    };
    for (const name of ["alpha", "beta"]) {
      const project = await workingFolder.getDirectoryHandle(name, {
        create: true,
      });
      await write(
        project,
        ".ucsb-xrp-project.json",
        `${JSON.stringify({ name, entrypoint: "main.py" })}\n`,
      );
      await write(project, "main.py", `print("${name}")\n`);
    }
    (window as Window & { pickerCalls?: number }).pickerCalls = 0;
    Object.defineProperty(window, "showDirectoryPicker", {
      configurable: true,
      value: async () => {
        (window as Window & { pickerCalls?: number }).pickerCalls =
          ((window as Window & { pickerCalls?: number }).pickerCalls ?? 0) + 1;
        return workingFolder;
      },
    });
  });

  const originalFolderLabel = await page
    .getByTestId("project-folder")
    .textContent();
  await page.getByRole("button", { name: "Open project…" }).click();

  const dialog = page.getByRole("dialog", { name: "Open a project" });
  await expect(dialog).toContainText(
    "First choose the parent Working folder that contains your Project folders.",
  );
  expect(
    await page.evaluate(
      () => (window as Window & { pickerCalls?: number }).pickerCalls ?? 0,
    ),
  ).toBe(0);
  await dialog.getByRole("button", { name: "Choose Working folder…" }).click();
  expect(
    await page.evaluate(
      () => (window as Window & { pickerCalls?: number }).pickerCalls ?? 0,
    ),
  ).toBe(1);
  await expect(
    dialog.getByRole("button", { name: "Open alpha from alpha" }),
  ).toBeVisible();
  await expect(
    dialog.getByRole("button", { name: "Open beta from beta" }),
  ).toBeVisible();
  await expect(page.getByTestId("project-folder")).toHaveText(
    originalFolderLabel ?? "",
  );
  await dialog.getByRole("button", { name: "Open beta from beta" }).click();
  await expect(page.getByTestId("project-folder")).toHaveText("./beta");
  const childSources = await page.evaluate(async () => {
    const browserRoot = await navigator.storage.getDirectory();
    const workingFolder = await browserRoot.getDirectoryHandle(
      "strict-project-boundary",
    );
    const read = async (name: string) => {
      const project = await workingFolder.getDirectoryHandle(name);
      return (await (await project.getFileHandle("main.py")).getFile()).text();
    };
    return Promise.all([read("alpha"), read("beta")]);
  });
  expect(childSources).toEqual(['print("alpha")\n', 'print("beta")\n']);
});

test("Open uses the remembered Working folder rather than a direct project picker", async ({
  page,
}) => {
  await page.goto("/ide/");
  await page.evaluate(
    async ({ projectsLocationKey }) => {
      const root = await navigator.storage.getDirectory();
      for (const name of ["remembered-projects", "external-project"]) {
        try {
          await root.removeEntry(name, { recursive: true });
        } catch (error) {
          if (
            !(error instanceof DOMException) ||
            error.name !== "NotFoundError"
          ) {
            throw error;
          }
        }
      }
      const projects = await root.getDirectoryHandle("remembered-projects", {
        create: true,
      });
      const external = await root.getDirectoryHandle("external-project", {
        create: true,
      });
      const write = async (name: string, content: string) => {
        const file = await external.getFileHandle(name, { create: true });
        const writable = await file.createWritable();
        await writable.write(content);
        await writable.close();
      };
      await write(
        ".ucsb-xrp-project.json",
        `${JSON.stringify({ name: "External project", entrypoint: "main.py" })}\n`,
      );
      await write("main.py", 'print("outside remembered parent")\n');

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
          .put(projects, projectsLocationKey);
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
      });
      database.close();
    },
    { projectsLocationKey },
  );
  await page.reload();
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  const projectStorage = page
    .locator(".project-setting-state")
    .filter({ hasText: "Working folder" });
  await expect(projectStorage.locator("strong")).toHaveText(
    "remembered-projects",
  );
  await page.getByRole("button", { name: "Close settings" }).click();
  await page.evaluate(() => {
    (window as Window & { pickerCalls?: number }).pickerCalls = 0;
    Object.defineProperty(window, "showDirectoryPicker", {
      configurable: true,
      value: async () => {
        (window as Window & { pickerCalls?: number }).pickerCalls =
          ((window as Window & { pickerCalls?: number }).pickerCalls ?? 0) + 1;
        return (await navigator.storage.getDirectory()).getDirectoryHandle(
          "external-project",
        );
      },
    });
  });

  const originalProject = await page.getByTestId("project-name").textContent();
  await page.getByRole("button", { name: "Open project…" }).click();
  await expect(
    page.getByRole("heading", { name: "Open a project" }),
  ).toBeVisible();
  await expect(
    page.getByText(
      "No valid UCSBXRP project folders were found directly inside this Working folder.",
    ),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => (window as Window & { pickerCalls?: number }).pickerCalls ?? 0,
    ),
  ).toBe(0);
  await page.getByRole("button", { name: "Change Working folder…" }).click();

  await expect(page.getByTestId("project-name")).toHaveText(
    originalProject ?? "",
  );
  await expect(
    page.getByText(
      "No valid UCSBXRP project folders were found directly inside this Working folder.",
    ),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => (window as Window & { pickerCalls?: number }).pickerCalls ?? 0,
    ),
  ).toBe(1);
});

test("lists direct projects in the remembered Working folder and opens one without another picker", async ({
  page,
}) => {
  await page.goto("/ide/");
  await page.evaluate(
    async ({ projectsLocationKey }) => {
      const root = await navigator.storage.getDirectory();
      const projects = await root.getDirectoryHandle("listed-projects", {
        create: true,
      });
      const write = async (
        folder: FileSystemDirectoryHandle,
        name: string,
        content: string,
      ) => {
        const file = await folder.getFileHandle(name, { create: true });
        const writable = await file.createWritable();
        await writable.write(content);
        await writable.close();
      };
      for (const [folderName, projectName] of [
        ["alpha-folder", "Alpha drive"],
        ["beta-folder", "Beta turn"],
      ] as const) {
        const folder = await projects.getDirectoryHandle(folderName, {
          create: true,
        });
        await write(
          folder,
          ".ucsb-xrp-project.json",
          `${JSON.stringify({ name: projectName, entrypoint: "main.py" })}\n`,
        );
        await write(folder, "main.py", `print("${projectName}")\n`);
      }
      const notes = await projects.getDirectoryHandle("notes", {
        create: true,
      });
      await write(notes, "README.md", "Not a UCSBXRP project\n");

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
          .put(projects, projectsLocationKey);
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
      });
      database.close();
      (window as Window & { pickerCalls?: number }).pickerCalls = 0;
      Object.defineProperty(window, "showDirectoryPicker", {
        configurable: true,
        value: async () => {
          (window as Window & { pickerCalls?: number }).pickerCalls =
            ((window as Window & { pickerCalls?: number }).pickerCalls ?? 0) +
            1;
          return projects;
        },
      });
    },
    { projectsLocationKey },
  );
  await page.reload();

  await page.getByRole("button", { name: "Open project…" }).click();

  const dialog = page.getByRole("dialog", { name: "Open a project" });
  await expect(dialog).toContainText(
    "The IDE opens it with read-write access and saves changes to its folder automatically.",
  );
  await expect(
    dialog.getByRole("button", {
      name: "Open Alpha drive from alpha-folder",
    }),
  ).toBeVisible();
  await expect(
    dialog.getByRole("button", { name: "Open Beta turn from beta-folder" }),
  ).toBeVisible();
  await expect(dialog).not.toContainText("./notes");
  expect(
    await page.evaluate(
      () => (window as Window & { pickerCalls?: number }).pickerCalls ?? 0,
    ),
  ).toBe(0);

  await dialog
    .getByRole("button", { name: "Open Beta turn from beta-folder" })
    .click();
  await expect(page.getByTestId("project-name")).toHaveText("Beta turn");
  await expect(page.getByTestId("project-folder")).toHaveText("./beta-folder");

  const updated = 'print("saved automatically")\n';
  const editor = page.getByRole("textbox", { name: "main.py editor" });
  await editor.focus();
  await editor.press("ControlOrMeta+A");
  await page.keyboard.insertText(updated);
  await expect
    .poll(() =>
      page.evaluate(async () => {
        const root = await navigator.storage.getDirectory();
        const projects = await root.getDirectoryHandle("listed-projects");
        const project = await projects.getDirectoryHandle("beta-folder");
        return (
          await (await project.getFileHandle("main.py")).getFile()
        ).text();
      }),
    )
    .toBe(updated);
});

test("requires an explicit storage choice for a new project", async ({
  page,
}) => {
  await page.goto("/ide/");
  const originalProject = await page
    .getByTestId("project-folder")
    .textContent();

  await page.getByRole("button", { name: "New project…", exact: true }).click();
  await page
    .getByLabel("Project template")
    .selectOption("micropython_tutorial");

  await expect(
    page.getByRole("heading", { name: "Create a project" }),
  ).toBeVisible();
  await expect(page.getByTestId("project-folder")).toHaveText(
    originalProject ?? "",
  );
  await page.getByRole("button", { name: "Continue without a folder" }).click();
  await expect(
    page.getByRole("button", {
      name: "Open main.py (main file)",
    }),
  ).toBeVisible();
  await expect(page.getByTestId("project-folder")).toHaveText(
    "Not saved to a folder",
  );
});

test("cancelling Working folder selection leaves the current project unchanged", async ({
  page,
}) => {
  await page.goto("/ide/");
  const originalName = await page.getByTestId("project-name").textContent();
  const originalFolder = await page.getByTestId("project-folder").textContent();
  await page.evaluate(() => {
    Object.defineProperty(window, "showDirectoryPicker", {
      configurable: true,
      value: async () => {
        throw new DOMException("Folder selection cancelled", "AbortError");
      },
    });
  });

  await page.getByRole("button", { name: "Open project…" }).click();
  const openDialog = page.getByRole("dialog", { name: "Open a project" });
  await expect(openDialog).toContainText("The current project remains open");
  await openDialog
    .getByRole("button", { name: "Choose Working folder…" })
    .click();
  await expect(page.getByTestId("project-name")).toHaveText(originalName ?? "");
  await expect(page.getByTestId("project-folder")).toHaveText(
    originalFolder ?? "",
  );
  await expect(
    openDialog.getByText(
      "No Working folder was selected. The current project is unchanged.",
    ),
  ).toBeVisible();
  await openDialog.getByRole("button", { name: "Cancel" }).click();

  await page.getByRole("button", { name: "New project…", exact: true }).click();
  await page
    .getByLabel("Project template")
    .selectOption("micropython_tutorial");
  await page
    .getByRole("button", { name: "Choose Working folder and create…" })
    .click();
  await expect(page.getByTestId("project-name")).toHaveText(originalName ?? "");
  await expect(page.getByTestId("project-folder")).toHaveText(
    originalFolder ?? "",
  );
  await expect(
    page.getByText(
      "No Working folder was selected. The current project is unchanged.",
    ),
  ).toBeVisible();
});

test("exposes the previous unsaved browser draft after creating a folder-backed project", async ({
  page,
}) => {
  await page.goto("/ide/");
  await page.getByRole("button", { name: "New project…", exact: true }).click();
  await page
    .getByLabel("Project template")
    .selectOption("micropython_tutorial");
  await page
    .getByRole("button", { name: "Choose Working folder and create…" })
    .click();

  await page.getByRole("button", { name: "Settings", exact: true }).click();
  const previous = page.getByRole("button", {
    name: "Open previous unsaved project · Expanding spiral",
  });
  await expect(previous).toBeVisible();
  await previous.click();

  await expect(page.getByTestId("project-name")).toHaveText("Expanding spiral");
  await expect(page.getByTestId("project-folder")).toHaveText(
    "Not saved to a folder",
  );
  await expect(previous).toHaveCount(0);
});

test("does not retain an identical draft when saving the current project", async ({
  page,
}) => {
  await page.goto("/ide/");
  await page.getByRole("button", { name: "Save project…" }).click();
  await page
    .getByRole("button", { name: "Choose Working folder and save…" })
    .click();

  await expect(page.getByTestId("project-folder")).toHaveText(
    "./Expanding-spiral",
  );
  await expect(
    page.getByRole("button", { name: /Open previous unsaved project/ }),
  ).toHaveCount(0);
});

test("stale parent metadata cannot flatten legacy child project trees", async ({
  page,
}) => {
  await page.goto("/ide/");
  await page.evaluate(async () => {
    const browserRoot = await navigator.storage.getDirectory();
    try {
      await browserRoot.removeEntry("stale-projects-parent", {
        recursive: true,
      });
    } catch (error) {
      if (!(error instanceof DOMException) || error.name !== "NotFoundError") {
        throw error;
      }
    }
    const parent = await browserRoot.getDirectoryHandle(
      "stale-projects-parent",
      { create: true },
    );
    const write = async (
      folder: FileSystemDirectoryHandle,
      path: string,
      content: string,
    ) => {
      const file = await folder.getFileHandle(path, { create: true });
      const writable = await file.createWritable();
      await writable.write(content);
      await writable.close();
    };
    await write(
      parent,
      ".ucsb-xrp-project.json",
      `${JSON.stringify({
        name: "Stale projects parent",
        entrypoint: "main.py",
      })}\n`,
    );
    await write(parent, "main.py", 'print("stale root")\n');
    for (const name of ["legacy-alpha", "legacy-beta"]) {
      const child = await parent.getDirectoryHandle(name, { create: true });
      await write(child, "main.py", `print("${name}")\n`);
      await write(child, "notes.md", `${name} notes\n`);
    }
    Object.defineProperty(window, "showDirectoryPicker", {
      configurable: true,
      value: async () => parent,
    });
  });

  const originalProjectLabel = await page
    .getByTestId("project-folder")
    .textContent();
  await page.getByRole("button", { name: "Open project…" }).click();

  await expect(page.getByTestId("project-folder")).toHaveText(
    originalProjectLabel ?? "",
  );
  await expect(
    page.getByRole("button", { name: "Open legacy-alpha/main.py" }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Open legacy-beta/main.py" }),
  ).toHaveCount(0);
  const retainedSources = await page.evaluate(async () => {
    const root = await navigator.storage.getDirectory();
    const parent = await root.getDirectoryHandle("stale-projects-parent");
    const read = async (folder: FileSystemDirectoryHandle, name: string) =>
      (await (await folder.getFileHandle(name)).getFile()).text();
    const alpha = await parent.getDirectoryHandle("legacy-alpha");
    const beta = await parent.getDirectoryHandle("legacy-beta");
    return {
      parent: await read(parent, "main.py"),
      alpha: await read(alpha, "main.py"),
      beta: await read(beta, "main.py"),
    };
  });
  expect(retainedSources).toEqual({
    parent: 'print("stale root")\n',
    alpha: 'print("legacy-alpha")\n',
    beta: 'print("legacy-beta")\n',
  });
});

test("choosing a Working folder keeps the current project attached and saving", async ({
  page,
}) => {
  await page.goto("/ide/");
  await page.evaluate(async () => {
    const root = await navigator.storage.getDirectory();
    for (const name of ["projects-location-a", "projects-location-b"]) {
      try {
        await root.removeEntry(name, { recursive: true });
      } catch (error) {
        if (
          !(error instanceof DOMException) ||
          error.name !== "NotFoundError"
        ) {
          throw error;
        }
      }
    }
    const firstWorkingFolder = await root.getDirectoryHandle(
      "projects-location-a",
      {
        create: true,
      },
    );
    const project = await firstWorkingFolder.getDirectoryHandle(
      "location-project-a",
      {
        create: true,
      },
    );
    await root.getDirectoryHandle("projects-location-b", { create: true });
    const write = async (name: string, content: string) => {
      const file = await project.getFileHandle(name, { create: true });
      const writable = await file.createWritable();
      await writable.write(content);
      await writable.close();
    };
    await write(
      ".ucsb-xrp-project.json",
      `${JSON.stringify({
        name: "Location project A",
        entrypoint: "main.py",
        session: {
          projectId: "location-project-a-id",
          revision: 1,
          savedRevision: 1,
          updatedAt: 1_788_000_001_000,
        },
      })}\n`,
    );
    await write("main.py", 'print("LOCATION_A")\n');
    Object.defineProperty(window, "showDirectoryPicker", {
      configurable: true,
      value: async () => firstWorkingFolder,
    });
  });
  await page.getByRole("button", { name: "Open project…" }).click();
  const openDialog = page.getByRole("dialog", { name: "Open a project" });
  await openDialog
    .getByRole("button", { name: "Choose Working folder…" })
    .click();
  await openDialog
    .getByRole("button", {
      name: "Open Location project A from location-project-a",
    })
    .click();
  await expect(page.getByTestId("project-folder")).toHaveText(
    "./location-project-a",
  );
  await expect
    .poll(() => readRememberedFolderName(page, activeProjectFolderKey))
    .toBe("location-project-a");

  await page.evaluate(() => {
    Object.defineProperty(window, "showDirectoryPicker", {
      configurable: true,
      value: async () =>
        (await navigator.storage.getDirectory()).getDirectoryHandle(
          "projects-location-b",
        ),
    });
  });
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  await page
    .getByRole("button", {
      name: "Change Working folder…",
    })
    .click();

  await expect(page.getByTestId("project-folder")).toHaveText(
    "./location-project-a",
  );
  await expect
    .poll(() => readRememberedFolderName(page, projectsLocationKey))
    .toBe("projects-location-b");
  await expect
    .poll(() => readRememberedFolderName(page, activeProjectFolderKey))
    .toBe("location-project-a");

  const updatedSource = 'print("STILL_SAVES_TO_A")\n';
  const editor = page.getByRole("textbox", { name: "main.py editor" });
  await editor.focus();
  await editor.press("ControlOrMeta+A");
  await page.keyboard.insertText(updatedSource);
  await expect
    .poll(() =>
      page.evaluate(async () => {
        const root = await navigator.storage.getDirectory();
        const firstWorkingFolder = await root.getDirectoryHandle(
          "projects-location-a",
        );
        const project =
          await firstWorkingFolder.getDirectoryHandle("location-project-a");
        const main = await project.getFileHandle("main.py");
        return (await main.getFile()).text();
      }),
    )
    .toBe(updatedSource);
});

test("creates the next challenge project and carries forward only earlier student modules", async ({
  page,
}) => {
  await page.goto("/ide/");
  await page.getByRole("button", { name: "New project…", exact: true }).click();
  await page.getByLabel("Project template").selectOption("challenge_1");
  await expect(
    page.getByRole("heading", { name: "Create a project" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Choose Working folder and create…" })
    .click();

  await page.getByRole("button", { name: "New project…", exact: true }).click();
  await page.getByLabel("Project template").selectOption("challenge_2");
  await expect(page.getByLabel("Project template")).toHaveValue("challenge_2");
  await expect(
    page.getByText("Add differential-drive kinematics and planar odometry.", {
      exact: false,
    }),
  ).toBeVisible();
  await expect(page.getByText(/continue from 1 · Straight Run/i)).toBeVisible();
  await expect(page.getByText(/It carries sensor_model\.py/)).toHaveCount(0);
  await page.getByRole("button", { name: "Cancel", exact: true }).click();

  const next = page.getByRole("button", {
    name: "Continue to Challenge 2 · Turn and Return…",
  });
  await expect(next).toBeVisible();
  await expect(next).toHaveAttribute(
    "title",
    "Continue in a separate Challenge 2 · Turn and Return project. Copies sensor_model.py, wheel_speed_controller.py from this project; this project remains unchanged.",
  );
  await next.click();

  await expect(
    page.getByRole("heading", { name: "Create a project" }),
  ).toBeVisible();
  await expect(page.getByLabel("Project template")).toHaveCount(0);
  await expect(
    page.getByText(/carries sensor_model\.py, wheel_speed_controller\.py/),
  ).toBeVisible();
  await page.getByRole("button", { name: "Create project" }).click();

  await expect(
    page.getByRole("button", { name: "Open differential_drive.py" }),
  ).toBeVisible();
  const stored = await page.evaluate(() => {
    const recovered = JSON.parse(
      localStorage.getItem("ucsb-xrp-course-project-v2") ?? "{}",
    );
    return recovered.project ?? recovered;
  });
  expect(stored.templateId).toBe("challenge_2");
  expect(stored.files["course_setup.py"]).toContain(
    "USE_STUDENT_SENSOR_MODEL = False",
  );
  expect(stored.files["course_setup.py"]).toContain(
    "USE_STUDENT_WHEEL_SPEED_CONTROLLER = False",
  );
  expect(stored.files["course_setup.py"]).toContain(
    "USE_STUDENT_DIFFERENTIAL_DRIVE = False",
  );
  expect(stored.files).not.toHaveProperty("unrelated.py");
  const retainedSource = await page.evaluate(async () => {
    const root = await navigator.storage.getDirectory();
    const course = await root.getDirectoryHandle("student-course");
    const first = await course.getDirectoryHandle("1-Straight-Run");
    return (await (await first.getFileHandle("main.py")).getFile()).text();
  });
  expect(retainedSource).toContain("Challenge 1");
});

test("continues to the next challenge after saving a browser draft once", async ({
  page,
}) => {
  await page.goto("/ide/");
  await page.getByRole("button", { name: "New project…", exact: true }).click();
  await page.getByLabel("Project template").selectOption("challenge_1");
  await page.getByRole("button", { name: "Continue without a folder" }).click();

  await expect(page.getByTestId("project-name")).toHaveText("1 · Straight Run");
  await expect(page.getByTestId("project-folder")).toHaveText(
    "Not saved to a folder",
  );

  await page
    .getByRole("button", {
      name: "Continue to Challenge 2 · Turn and Return…",
    })
    .click();
  await expect(
    page.getByRole("heading", { name: "Save project" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Choose Working folder and save…" })
    .click();

  await expect(
    page.getByRole("heading", { name: "Create a project" }),
  ).toBeVisible();
  await expect(
    page.getByText(/carries sensor_model\.py, wheel_speed_controller\.py/),
  ).toBeVisible();
  await expect(page.getByTestId("project-folder")).toHaveText(
    "./1-Straight-Run",
  );
  await page.getByRole("button", { name: "Create project" }).click();
  await expect(page.getByTestId("project-folder")).toHaveText(
    "./2-Turn-and-Return",
  );
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  await expect(
    page.getByRole("button", {
      name: "Open previous unsaved project · Expanding spiral",
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: /Open previous unsaved project · 1/ }),
  ).toHaveCount(0);
});

test("continues between browser drafts when folder access is unavailable", async ({
  page,
}) => {
  await page.goto("/ide/");
  await page.evaluate(() => {
    Object.defineProperty(window, "showDirectoryPicker", {
      configurable: true,
      value: undefined,
    });
  });
  await page.getByRole("button", { name: "New project…", exact: true }).click();
  await page.getByLabel("Project template").selectOption("challenge_1");
  await page.getByRole("button", { name: "Create without a folder" }).click();

  await page
    .getByRole("button", {
      name: "Continue to Challenge 2 · Turn and Return…",
    })
    .click();
  await page.getByRole("button", { name: "Keep without a folder" }).click();

  await expect(
    page.getByRole("heading", { name: "Create a project" }),
  ).toBeVisible();
  await expect(
    page.getByText(/carries sensor_model\.py, wheel_speed_controller\.py/),
  ).toBeVisible();
  await page.getByRole("button", { name: "Create without a folder" }).click();
  await expect(page.getByTestId("project-name")).toHaveText(
    "2 · Turn and Return",
  );
  await expect(page.getByTestId("project-folder")).toHaveText(
    "Not saved to a folder",
  );
});

test("imports text files without overwriting an existing project file", async ({
  page,
}) => {
  await page.goto("/ide/");
  const chooser = page.locator('input[type="file"]');

  await chooser.setInputFiles({
    name: "observations.txt",
    mimeType: "text/plain",
    buffer: Buffer.from("wheel test notes\n"),
  });
  await expect(
    page.getByRole("button", { name: "Open observations.txt" }),
  ).toBeVisible();

  await chooser.setInputFiles({
    name: "main.py",
    mimeType: "text/x-python",
    buffer: Buffer.from("raise RuntimeError('must not replace project')\n"),
  });
  await expect(
    page.getByText(/main\.py is already in this project/),
  ).toBeVisible();
  const stored = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("ucsb-xrp-course-project-v2") ?? "{}"),
  );
  expect(stored.files["observations.txt"]).toBe("wheel test notes\n");
  expect(stored.files["main.py"]).not.toContain("must not replace project");
});

test("closes the active-file menu when the student clicks elsewhere", async ({
  page,
}) => {
  await page.goto("/ide/");
  const fileMenu = page.getByRole("button", { name: /Actions for main\.py/ });
  await fileMenu.click();
  await expect(
    page.getByRole("button", { name: "Rename file…" }),
  ).toBeVisible();

  await page
    .getByTestId("python-editor")
    .click({ position: { x: 300, y: 80 } });
  await expect(page.getByRole("button", { name: "Rename file…" })).toHaveCount(
    0,
  );
});

test("Monitor validates and runs the project currently open in the IDE", async ({
  context,
  page: ide,
}) => {
  await ide.goto("/ide/");
  await expect(ide.getByTestId("target-status")).toContainText(
    "Virtual XRP · ready",
  );
  const monitor = await context.newPage();
  await monitor.goto("/monitor/");
  await expect(monitor.getByTestId("target-status")).toContainText(
    "Virtual XRP · ready",
  );

  await ide.getByRole("button", { name: "New project…", exact: true }).click();
  await ide.getByLabel("Project template").selectOption("micropython_tutorial");
  await ide.getByRole("button", { name: "Continue without a folder" }).click();
  await expect(
    ide.getByRole("button", {
      name: "Open main.py (main file)",
    }),
  ).toBeVisible();
  await expect(monitor.getByRole("button", { name: "Run" })).toBeEnabled();

  await monitor.getByRole("button", { name: "Run" }).click();
  await ide.getByRole("tab", { name: /System log/ }).click();
  await expect(ide.getByRole("log")).toContainText(
    "Validating Tutorial 1 · Python essentials",
    { timeout: 15_000 },
  );
  await expect(ide.getByRole("log")).toContainText(
    "Starting Tutorial 1 · Python essentials",
  );
  await expect(ide.getByRole("log")).not.toContainText(
    "Starting Expanding spiral",
  );
});
