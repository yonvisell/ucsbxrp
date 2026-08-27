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

test("Open project rejects a Projects folder without flattening its child projects", async ({
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
    Object.defineProperty(window, "showDirectoryPicker", {
      configurable: true,
      value: async () => workingFolder,
    });
  });

  const originalFolderLabel = await page
    .getByTestId("project-folder")
    .textContent();
  await page.getByRole("button", { name: "Open project" }).click();

  await expect(page.locator(".project-operation-detail")).toContainText(
    "This folder contains multiple project folders (alpha, beta). Choose one project folder rather than their parent folder.",
  );
  await expect(page.getByTestId("project-folder")).toHaveText(
    originalFolderLabel ?? "",
  );
  await expect(
    page.getByRole("button", { name: /Open alpha\/main\.py/ }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: /Open beta\/main\.py/ }),
  ).toHaveCount(0);
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

test("opens a valid project even when another Projects folder is remembered", async ({
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
  await expect(page.locator(".project-storage strong")).toHaveText(
    "remembered-projects",
  );
  await page.evaluate(() => {
    Object.defineProperty(window, "showDirectoryPicker", {
      configurable: true,
      value: async () =>
        (await navigator.storage.getDirectory()).getDirectoryHandle(
          "external-project",
        ),
    });
  });

  await page.getByRole("button", { name: "Open project" }).click();

  await expect(page.getByTestId("project-folder")).toHaveText(
    "./external-project",
  );
  await expect
    .poll(() =>
      page.evaluate(() => {
        const recovered = JSON.parse(
          localStorage.getItem("ucsb-xrp-course-project-v2") ?? "{}",
        );
        return (recovered.project ?? recovered).files?.["main.py"] ?? null;
      }),
    )
    .toBe('print("outside remembered parent")\n');
});

test("requires an explicit storage choice for a new project", async ({
  page,
}) => {
  await page.goto("/ide/");
  const originalProject = await page
    .getByTestId("project-folder")
    .textContent();

  await page
    .getByLabel("Project template")
    .selectOption("micropython_tutorial");
  await page.getByRole("button", { name: "Create", exact: true }).click();

  await expect(
    page.getByRole("heading", { name: "Create a project" }),
  ).toBeVisible();
  await expect(page.getByTestId("project-folder")).toHaveText(
    originalProject ?? "",
  );
  await page.getByRole("button", { name: "Continue without a folder" }).click();
  await expect(
    page.getByRole("button", {
      name: "Open 1_values_and_functions.py (main file)",
    }),
  ).toBeVisible();
  await expect(page.getByTestId("project-folder")).toContainText(
    "not saved to a folder",
  );
});

test("exposes the previous unsaved browser draft after creating a folder-backed project", async ({
  page,
}) => {
  await page.goto("/ide/");
  await page
    .getByLabel("Project template")
    .selectOption("micropython_tutorial");
  await page.getByRole("button", { name: "Create", exact: true }).click();
  await page
    .getByRole("button", { name: "Choose Projects folder and create" })
    .click();

  const previous = page.getByRole("button", {
    name: "Open previous draft · Expanding spiral",
  });
  await expect(previous).toBeVisible();
  await previous.click();

  await expect(page.getByTestId("project-folder")).toContainText(
    "Expanding spiral · not saved to a folder",
  );
  await expect(previous).toHaveCount(0);
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
  await page.getByRole("button", { name: "Open project" }).click();

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

test("changing Projects location keeps the current project attached and saving", async ({
  page,
}) => {
  await page.goto("/ide/");
  await page.evaluate(async () => {
    const root = await navigator.storage.getDirectory();
    for (const name of ["location-project-a", "projects-location-b"]) {
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
    const project = await root.getDirectoryHandle("location-project-a", {
      create: true,
    });
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
      value: async () => project,
    });
  });
  await page.getByRole("button", { name: "Open project" }).click();
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
  await page
    .getByRole("button", {
      name: "Change Projects folder",
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
        const project = await root.getDirectoryHandle("location-project-a");
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
  await page.getByLabel("Project template").selectOption("challenge_1");
  await page.getByRole("button", { name: "Create", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Create a project" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Choose Projects folder and create" })
    .click();

  const next = page.getByRole("button", {
    name: "Create Challenge 2 · Turn and Return project",
  });
  await expect(next).toBeVisible();
  await expect(next).toHaveAttribute(
    "title",
    "Create a separate Challenge 2 · Turn and Return project and copy your completed component files from this project.",
  );
  await next.click();

  await expect(
    page.getByRole("heading", { name: "Create a project" }),
  ).toBeVisible();
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
  const fileMenu = page.getByRole("button", { name: /File main\.py/ });
  await fileMenu.click();
  await expect(page.getByRole("button", { name: "Rename file" })).toBeVisible();

  await page
    .getByTestId("python-editor")
    .click({ position: { x: 300, y: 80 } });
  await expect(page.getByRole("button", { name: "Rename file" })).toHaveCount(
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

  await ide.getByLabel("Project template").selectOption("micropython_tutorial");
  await ide.getByRole("button", { name: "Create", exact: true }).click();
  await ide.getByRole("button", { name: "Continue without a folder" }).click();
  await expect(
    ide.getByRole("button", {
      name: "Open 1_values_and_functions.py (main file)",
    }),
  ).toBeVisible();
  await expect(monitor.getByRole("button", { name: "Run" })).toBeEnabled();

  await monitor.getByRole("button", { name: "Run" }).click();
  await ide.getByRole("tab", { name: /System log/ }).click();
  await expect(ide.getByRole("log")).toContainText(
    "Validating MicroPython foundations",
    { timeout: 15_000 },
  );
  await expect(ide.getByRole("log")).toContainText(
    "Starting MicroPython foundations",
  );
  await expect(ide.getByRole("log")).not.toContainText(
    "Starting Expanding spiral",
  );
});
