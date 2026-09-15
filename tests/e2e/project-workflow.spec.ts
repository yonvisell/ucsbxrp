import { expect, test, type Page } from "@playwright/test";

import {
  readWorkspaceManifest,
  seedWorkingFolder,
  type TestProject,
} from "./working-folder";

async function provideEmptyWorkingFolder(
  page: Page,
  folderName: string,
): Promise<void> {
  await page.addInitScript((selectedFolderName) => {
    Object.defineProperty(window, "showDirectoryPicker", {
      configurable: true,
      value: async () =>
        (await navigator.storage.getDirectory()).getDirectoryHandle(
          selectedFolderName,
          { create: true },
        ),
    });
  }, folderName);
  await page.goto("/");
  await page.evaluate(async (selectedFolderName) => {
    const root = await navigator.storage.getDirectory();
    try {
      await root.removeEntry(selectedFolderName, { recursive: true });
    } catch (error) {
      if (!(error instanceof DOMException) || error.name !== "NotFoundError") {
        throw error;
      }
    }
  }, folderName);
}

test("shows one clear folder-backed project model on first IDE use", async ({
  page,
}) => {
  await page.goto("/ide/");

  const firstProject = page.getByRole("dialog", {
    name: "Create your first Project",
  });
  await expect(firstProject).toBeVisible();
  await firstProject
    .getByRole("button", { name: "Use read-only preview" })
    .click();

  await expect(page.getByTestId("project-name")).toHaveText("Expanding spiral");
  await expect(page.getByTestId("project-folder")).toHaveText("Not selected");
  await expect(page.getByTestId("project-save-state")).toHaveText(
    "Working folder required",
  );
  await expect(
    page.getByRole("option", { name: "Physical XRP · set up first" }),
  ).toBeDisabled();

  const projectActions = page.getByRole("group", { name: "Project actions" });
  await expect(
    projectActions.getByRole("button", { name: "Open project…" }),
  ).toBeVisible();
  await expect(
    projectActions.getByRole("button", { name: "New project…" }),
  ).toBeVisible();
  await expect(projectActions).toContainText(
    "New project: Open challenges, demos, or tutorials",
  );
  await expect(
    projectActions.getByRole("button", { name: "Save project…" }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Choose Working folder…" }),
  ).toBeVisible();

  const fileActions = page.getByRole("group", {
    name: "Create or import project files",
  });
  await expect(
    fileActions.getByRole("button", { name: "New file…" }),
  ).toBeDisabled();
  await expect(
    fileActions.getByRole("button", { name: "Import files…" }),
  ).toBeDisabled();
  await expect(
    page.getByRole("button", { name: "Test components" }),
  ).toBeDisabled();
  await expect(page.locator("#component-check-help")).toHaveText(
    "Test the class implementations for this project",
  );
  await expect(page.getByTestId("current-file")).toHaveText("main.py");
  await expect(page.getByRole("tablist", { name: "Open files" })).toHaveCount(
    0,
  );
  await expect(page.getByRole("button", { name: "Compile" })).toBeEnabled();
  await expect(page.getByRole("button", { name: "Compile" })).toHaveAttribute(
    "title",
    "Compile the supplied preview. Create a Project to edit, save, and run it.",
  );
  await expect(
    page.getByRole("button", { name: "Run", exact: true }),
  ).toBeDisabled();

  await page.getByRole("button", { name: "New project…" }).click();
  await expect(
    page.getByRole("heading", { name: "New project" }),
  ).toBeVisible();
  await expect(page.getByLabel("Project template")).toHaveValue("");
});

test("creates, saves, and remembers a named project in a new Working folder", async ({
  page,
}) => {
  await provideEmptyWorkingFolder(page, "First-Use-Work");
  await page.goto("/ide/");

  await page
    .getByRole("dialog", { name: "Create your first Project" })
    .getByRole("button", { name: "Use read-only preview" })
    .click();

  await page.getByRole("button", { name: "New project…" }).click();
  await page.getByLabel("Project template").selectOption("demo_spiral");
  await page.getByLabel("Name").fill("Team-Spiral");
  await page
    .getByRole("button", { name: "Choose Working folder and create" })
    .click();

  await expect(page.getByTestId("project-name")).toHaveText("Expanding spiral");
  await expect(page.getByTestId("project-folder")).toHaveText("Team-Spiral");
  await expect(page.getByTestId("project-save-state")).toHaveText("Saved");
  await page.getByRole("button", { name: "Change Working folder…" }).click();
  await expect(page.getByTestId("project-folder")).toHaveText("Team-Spiral");
  await expect(page.getByTestId("project-save-state")).toHaveText("Saved");

  const editor = page.getByRole("textbox", { name: "main.py editor" });
  const replacement = 'print("saved from the IDE")\n';
  await editor.focus();
  await editor.press("ControlOrMeta+A");
  await page.keyboard.insertText(replacement);
  await expect(page.getByTestId("project-save-state")).toHaveText("Saved");
  await expect
    .poll(() =>
      page.evaluate(async () => {
        const root = await navigator.storage.getDirectory();
        const workspace = await root.getDirectoryHandle("First-Use-Work");
        const project = await workspace.getDirectoryHandle("Team-Spiral");
        return (
          await (await project.getFileHandle("main.py")).getFile()
        ).text();
      }),
    )
    .toBe(replacement);

  expect(
    await readWorkspaceManifest<{ activeProject: string }>(
      page,
      "First-Use-Work",
    ),
  ).toMatchObject({ activeProject: "Team-Spiral" });
});

test("Open project lists only direct UCSBXRP projects and remembers the selection", async ({
  page,
}) => {
  const alpha: TestProject = {
    name: "Alpha drive",
    entrypoint: "main.py",
    files: { "main.py": 'print("alpha")\n' },
  };
  await seedWorkingFolder(page, {
    folderName: "Project-Collection",
    project: alpha,
    projectFolderName: "alpha-folder",
  });
  await page.evaluate(async () => {
    const root = await navigator.storage.getDirectory();
    const workspace = await root.getDirectoryHandle("Project-Collection");
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

    const beta = await workspace.getDirectoryHandle("beta-folder", {
      create: true,
    });
    await write(
      beta,
      ".ucsb-xrp-project.json",
      `${JSON.stringify({ name: "Beta turn", entrypoint: "main.py" })}\n`,
    );
    await write(beta, "main.py", 'print("beta")\n');

    const notes = await workspace.getDirectoryHandle("notes", { create: true });
    await write(notes, "README.md", "Not a UCSBXRP project\n");
  });

  await page.goto("/ide/");
  await expect(page.getByTestId("project-name")).toHaveText("Alpha drive");
  await page.getByRole("button", { name: "Open project…" }).click();

  const dialog = page.getByRole("dialog", { name: "Open project" });
  await expect(
    dialog.getByRole("button", { name: "Open Alpha drive from alpha-folder" }),
  ).toBeVisible();
  await expect(
    dialog.getByRole("button", { name: "Open Beta turn from beta-folder" }),
  ).toBeVisible();
  await expect(dialog).not.toContainText("notes");

  await dialog
    .getByRole("button", { name: "Open Beta turn from beta-folder" })
    .click();
  await expect(page.getByTestId("project-name")).toHaveText("Beta turn");
  await expect(page.getByTestId("project-folder")).toHaveText("beta-folder");
  await page.getByRole("tab", { name: "Status" }).click();
  await expect(page.getByRole("tabpanel")).not.toContainText("Unsaved copy");
  expect(
    await readWorkspaceManifest<{ activeProject: string }>(
      page,
      "Project-Collection",
    ),
  ).toMatchObject({ activeProject: "beta-folder" });
});

test("Open project waits for its own commit and refreshes completed foreign writers", async ({
  page,
}) => {
  await seedWorkingFolder(page, {
    folderName: "Chooser-Commit",
    projectFolderName: "alpha-folder",
    project: {
      name: "Alpha drive",
      entrypoint: "main.py",
      files: { "main.py": 'print("alpha")\n' },
    },
  });
  await page.addInitScript(() => {
    const pause: {
      armed: boolean;
      waiting: boolean;
      release: () => void;
    } = { armed: true, waiting: false, release: () => undefined };
    (
      window as unknown as {
        projectCommitPause: {
          armed: boolean;
          waiting: boolean;
          release: () => void;
        };
      }
    ).projectCommitPause = pause;
    const createWritable = FileSystemFileHandle.prototype.createWritable;
    FileSystemFileHandle.prototype.createWritable = async function (options) {
      const writable = await createWritable.call(this, options);
      if (this.name === ".ucsb-xrp-project.json" && pause.armed) {
        pause.armed = false;
        const close = writable.close.bind(writable);
        writable.close = async () => {
          pause.waiting = true;
          await new Promise<void>((resolve) => {
            pause.release = resolve;
          });
          try {
            await close();
          } finally {
            pause.waiting = false;
          }
        };
      }
      return writable;
    };
  });
  const waitForCommit = () =>
    expect
      .poll(() =>
        page.evaluate(
          () =>
            (
              window as unknown as {
                projectCommitPause: { waiting: boolean };
              }
            ).projectCommitPause.waiting,
        ),
      )
      .toBe(true);
  const releaseCommit = () =>
    page.evaluate(() =>
      (
        window as unknown as {
          projectCommitPause: { release: () => void };
        }
      ).projectCommitPause.release(),
    );
  const dialog = page.getByRole("dialog", { name: "Open project" });
  const alpha = dialog.getByRole("button", {
    name: "Open Alpha drive from alpha-folder",
  });
  const pendingWriter = dialog.getByRole("button", {
    name: "Review pending writers in alpha-folder",
  });

  await page.goto("/ide/");
  await expect(page.getByTestId("project-name")).toHaveText("Alpha drive");
  await waitForCommit();
  await page.getByRole("button", { name: "Open project…" }).click();
  await expect(dialog).toContainText("Finishing the current Project save…");
  await expect(pendingWriter).toHaveCount(0);
  await dialog.getByRole("button", { name: "Cancel", exact: true }).click();
  await releaseCommit();
  await expect(page.getByTestId("project-save-state")).toHaveText("Saved");
  await expect(dialog).toBeHidden();

  await page.evaluate(() => {
    (
      window as unknown as { projectCommitPause: { armed: boolean } }
    ).projectCommitPause.armed = true;
  });
  const savedSource = 'print("alpha after the held commit")\n';
  const editor = page.getByRole("textbox", { name: "main.py editor" });
  await editor.focus();
  await editor.press("ControlOrMeta+A");
  await page.keyboard.insertText(savedSource);
  await waitForCommit();
  await page.getByRole("button", { name: "Open project…" }).click();
  await expect(dialog).toContainText("Finishing the current Project save…");
  await releaseCommit();
  await expect(alpha).toBeVisible();
  await expect(pendingWriter).toHaveCount(0);
  await expect(dialog.getByText("Needs recovery", { exact: true })).toHaveCount(
    0,
  );
  const retained = await page.evaluate(async () => {
    const root = await navigator.storage.getDirectory();
    const workspace = await root.getDirectoryHandle("Chooser-Commit");
    const folder = await workspace.getDirectoryHandle("alpha-folder");
    const names: string[] = [];
    for await (const name of folder.keys()) names.push(name);
    const source = await (
      await (await folder.getFileHandle("main.py")).getFile()
    ).text();
    const writer = {
      schemaVersion: 1,
      owner: "fixture-foreign-writer",
      choosing: false,
      ticket: 1,
      createdAt: Date.now(),
    };
    const writerText = JSON.stringify(writer) + "\n";
    const handle = await folder.getFileHandle(
      ".ucsb-xrp-writer-fixture-foreign-writer.json",
      { create: true },
    );
    const writable = await handle.createWritable();
    await writable.write(writerText);
    await writable.close();
    return { names, source, writerText };
  });
  expect(retained.source).toBe(savedSource);
  expect(retained.names).not.toContain(".ucsb-xrp-commit.json");
  expect(
    retained.names.filter(
      (name) => name.startsWith(".ucsb-xrp-writer-") && name.endsWith(".json"),
    ),
  ).toEqual([]);
  await dialog.getByRole("button", { name: "Refresh projects" }).click();
  await expect(pendingWriter).toBeVisible();
  await expect(alpha).toHaveCount(0);
  const foreign = await page.evaluate(async () => {
    const root = await navigator.storage.getDirectory();
    const workspace = await root.getDirectoryHandle("Chooser-Commit");
    const folder = await workspace.getDirectoryHandle("alpha-folder");
    const name = ".ucsb-xrp-writer-fixture-foreign-writer.json";
    const text = await (
      await (await folder.getFileHandle(name)).getFile()
    ).text();
    // Simulate the other writer completing normally; the chooser never owns
    // permission to clear this record itself merely because time has elapsed.
    await folder.removeEntry(name);
    return text;
  });
  expect(foreign).toBe(retained.writerText);
  await dialog.getByRole("button", { name: "Refresh projects" }).click();
  await expect(alpha).toBeVisible();
  await expect(pendingWriter).toHaveCount(0);
});

test("cancelling Working-folder selection leaves the current project unchanged", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, "showDirectoryPicker", {
      configurable: true,
      value: async () => {
        throw new DOMException("Selection cancelled", "AbortError");
      },
    });
  });
  await page.goto("/ide/");
  await page
    .getByRole("dialog", { name: "Create your first Project" })
    .getByRole("button", { name: "Use read-only preview" })
    .click();
  await page.getByRole("button", { name: "New project…" }).click();
  await page.getByLabel("Project template").selectOption("demo_spiral");
  await page.getByLabel("Name").fill("Cancelled-Spiral");
  await page
    .getByRole("button", { name: "Choose Working folder and create" })
    .click();

  await expect(
    page.getByRole("heading", { name: "New project" }),
  ).toBeVisible();
  await expect(page.getByText(/No Working folder was selected/)).toBeVisible();
  await expect(page.getByTestId("project-name")).toHaveText("Expanding spiral");
  await expect(page.getByTestId("project-folder")).toHaveText("Not selected");
});

test("rejects the course repository without exposing its source files", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, "showDirectoryPicker", {
      configurable: true,
      value: async () => {
        const root = await navigator.storage.getDirectory();
        const repository = await root.getDirectoryHandle("Course-Repository", {
          create: true,
        });
        const write = async (name: string) => {
          const file = await repository.getFileHandle(name, { create: true });
          const writable = await file.createWritable();
          await writable.write(`${name}\n`);
          await writable.close();
        };
        await write("AGENTS.md");
        await write("PROJECT_CONTEXT.md");
        return repository;
      },
    });
  });
  await page.goto("/ide/");
  await page
    .getByRole("dialog", { name: "Create your first Project" })
    .getByRole("button", { name: "Use read-only preview" })
    .click();
  await page.getByRole("button", { name: "Open project…" }).click();
  await page
    .getByRole("dialog", { name: "Open project" })
    .getByRole("button", { name: "Choose Working folder…" })
    .click();

  await expect(
    page.getByRole("dialog", { name: "Open project" }).getByRole("alert"),
  ).toContainText("not the course software repository");
  await expect(
    page.getByRole("button", { name: /Open AGENTS\.md/ }),
  ).toHaveCount(0);
  await expect(page.getByTestId("project-folder")).toHaveText("Not selected");
});
