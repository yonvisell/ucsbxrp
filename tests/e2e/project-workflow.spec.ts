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
  await expect(page.getByRole("button", { name: "Compile" })).toBeEnabled();
  await expect(page.getByRole("button", { name: "Compile" })).toHaveAttribute(
    "title",
    "Compile the recovered browser copy. Reconnect the Working folder before editing or saving.",
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
  await page.getByRole("button", { name: "Open project…" }).click();
  await page
    .getByRole("dialog", { name: "Open project" })
    .getByRole("button", { name: "Choose Working folder…" })
    .click();

  await expect(
    page.getByText(/not the UCSBXRP course software repository/),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: /Open AGENTS\.md/ }),
  ).toHaveCount(0);
  await expect(page.getByTestId("project-folder")).toHaveText("Not selected");
});
