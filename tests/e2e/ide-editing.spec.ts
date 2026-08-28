import { expect, test, type Page } from "@playwright/test";

import { seedWorkingFolder, type TestProject } from "./working-folder";

async function replaceVisibleEditorSource(
  page: Page,
  source: string,
  folderName: string,
  projectFolderName: string,
) {
  const editor = page.getByRole("textbox", { name: "main.py editor" });
  await expect(page.getByTestId("python-editor")).toBeVisible();
  await editor.focus();
  await editor.press("ControlOrMeta+A");
  await page.keyboard.insertText(source);

  await expect
    .poll(() =>
      page.evaluate(
        async ({ folderName, projectFolderName }) => {
          const root = await navigator.storage.getDirectory();
          const workingFolder = await root.getDirectoryHandle(folderName);
          const projectFolder =
            await workingFolder.getDirectoryHandle(projectFolderName);
          const main = await projectFolder.getFileHandle("main.py");
          return (await main.getFile()).text();
        },
        { folderName, projectFolderName },
      ),
    )
    .toBe(source);
}

test("edits, compiles, runs, and recovers main.py through Monaco", async ({
  page,
}) => {
  const folderName = "IDE-Editing";
  const projectFolderName = "Editor-Regression";
  await seedWorkingFolder(page, {
    folderName,
    projectFolderName,
    project: {
      name: "Editor regression",
      entrypoint: "main.py",
      files: {
        "main.py": 'print("Original program output")\n',
        "README.md": "# Editor regression\n",
      },
    },
  });

  await page.goto("/ide/");
  await expect(page.getByRole("tab", { name: "main.py" })).toHaveAttribute(
    "aria-selected",
    "true",
  );

  const invalidSource = "def broken:";
  await replaceVisibleEditorSource(
    page,
    invalidSource,
    folderName,
    projectFolderName,
  );
  await page.getByRole("button", { name: "Run", exact: true }).click();

  await expect(page.getByRole("log")).toContainText("Compilation failed");
  await page.getByRole("tab", { name: "Status" }).click();
  await expect(page.getByTestId("check-result")).toContainText(/main\.py/i);
  await expect(page.getByTestId("check-result")).toContainText(
    /syntax|line\s*1/i,
  );
  await expect(page.getByTestId("target-status")).toContainText(
    "Virtual XRP · ready",
  );

  const editedSource = 'print("Edited source ran")';
  await replaceVisibleEditorSource(
    page,
    editedSource,
    folderName,
    projectFolderName,
  );
  await page.getByRole("button", { name: "Run", exact: true }).click();

  await expect(page.getByRole("log")).toContainText("Edited source ran");
  await expect(page.getByRole("log")).not.toContainText(
    "Original program output",
  );
  await expect(page.getByTestId("target-status")).toContainText(
    "Virtual XRP · ready",
  );

  await page.reload();
  await expect(page.getByRole("tab", { name: "main.py" })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  await expect(
    page.getByTestId("python-editor").locator(".view-lines"),
  ).toContainText("Edited source ran");
});

test("Monitor Run executes an IDE edit without waiting for stale publication", async ({
  context,
  page: ide,
}) => {
  await seedWorkingFolder(ide, {
    folderName: "Immediate-Monitor-Run",
    projectFolderName: "Immediate-Monitor-Run",
    project: {
      name: "Immediate Monitor run",
      entrypoint: "main.py",
      files: { "main.py": 'print("old source")\n' },
    },
  });
  await ide.goto("/ide/");
  await expect(ide.getByTestId("target-status")).toContainText(
    "Virtual XRP · ready",
  );

  const monitor = await context.newPage();
  await monitor.goto("/monitor/");
  await expect(monitor.getByTestId("target-status")).toContainText(
    "Virtual XRP · ready",
  );

  const editor = ide.getByRole("textbox", { name: "main.py editor" });
  await editor.focus();
  await editor.press("ControlOrMeta+A");
  await ide.keyboard.insertText('print("exact current source")\n');
  const monitorRun = monitor
    .locator(".app-header")
    .getByRole("button", { name: "Run", exact: true });
  await expect(monitorRun).toHaveAttribute(
    "title",
    /Compile and run the current IDE project/,
  );
  await monitorRun.click();

  await ide.getByRole("tab", { name: "Program output" }).click();
  await expect(ide.getByRole("log")).toContainText("exact current source");
  await expect(ide.getByRole("log")).not.toContainText("old source");
});

test("opens an oversized folder but prevents compilation and virtual execution", async ({
  page,
}) => {
  const oversizedProject: TestProject = {
    name: "Oversized folder",
    entrypoint: "main.py",
    files: { "main.py": "print('not run')\n" },
  };
  for (let index = 0; index < 48; index += 1) {
    oversizedProject.files[`notes_${index}.txt`] = "";
  }
  await seedWorkingFolder(page, {
    folderName: "Oversized-Folder-Test",
    projectFolderName: "Oversized-Folder",
    project: oversizedProject,
  });

  await page.goto("/ide/");
  await expect(
    page.getByRole("button", { name: "Open notes_47.txt" }),
  ).toBeVisible();

  await page.getByRole("button", { name: "Compile" }).click();
  await expect(page.getByTestId("check-result")).toContainText(
    "This project has 49 files",
  );
  await expect(page.getByTestId("check-result")).toContainText("at most 48");

  await page.getByRole("button", { name: "Run", exact: true }).click();
  await page.getByRole("tab", { name: /System log/ }).click();
  await expect(page.getByRole("log")).toContainText("Compilation failed");
  await page.getByRole("tab", { name: /Program output/ }).click();
  await expect(page.getByRole("log")).not.toContainText("not run");
  await expect(page.getByTestId("target-status")).toContainText(
    "Virtual XRP · ready",
  );
});
