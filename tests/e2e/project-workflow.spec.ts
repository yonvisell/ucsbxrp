import { expect, test } from "@playwright/test";

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

test("Open project rejects a working folder without flattening its child projects", async ({
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
    "Choose the project folder that contains .ucsb-xrp-project.json, not the working folder that contains your projects.",
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

test("creates the next challenge project and carries forward only earlier student modules", async ({
  page,
}) => {
  await page.goto("/ide/");
  await page.getByLabel("Project template").selectOption("challenge_1");
  await page.getByRole("button", { name: "Create", exact: true }).click();

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
    page.getByRole("heading", { name: "Name the project folder" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Create project", exact: true })
    .click();
  await expect(page.getByTestId("project-folder")).toContainText(
    "./1-Straight-Run",
  );
  await next.click();
  await expect(
    page.getByText(/carries sensor_model\.py, wheel_speed_controller\.py/),
  ).toBeVisible();
  await page.getByRole("button", { name: "Create project" }).click();

  await expect(
    page.getByRole("button", { name: "Open differential_drive.py" }),
  ).toBeVisible();
  const stored = await page.evaluate(() => {
    const recovered = JSON.parse(
      localStorage.getItem("ucsb-xrp-course-project-v1") ?? "{}",
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
    JSON.parse(localStorage.getItem("ucsb-xrp-course-project-v1") ?? "{}"),
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
