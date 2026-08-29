import { expect, test, type Page } from "@playwright/test";

import { seedWorkingFolder, type TestProject } from "./working-folder";

async function readDiagnosticLog(page: Page, folderName: string) {
  return page.evaluate(async (name) => {
    const root = await navigator.storage.getDirectory();
    const workingFolder = await root.getDirectoryHandle(name);
    try {
      const handle = await workingFolder.getFileHandle(
        "UCSBXRP_diagnostic.log",
      );
      return (await handle.getFile()).text();
    } catch (error) {
      if (error instanceof DOMException && error.name === "NotFoundError") {
        return "";
      }
      throw error;
    }
  }, folderName);
}

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

  await expect(
    page.getByRole("tab", { name: /Problems \(1\)/ }),
  ).toHaveAttribute("aria-selected", "true");
  await expect(page.getByRole("tabpanel")).toContainText("main.py:1:1");
  await expect(page.getByRole("tabpanel")).toContainText(/syntax/i);
  await expect(page.locator(".squiggly-error")).toHaveCount(1);
  await page.getByText("Raw compiler output").click();
  await expect(page.getByRole("tabpanel")).toContainText("main.py");
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

test("keeps an unchanged compilation current across a Guide round trip", async ({
  page,
}) => {
  await seedWorkingFolder(page, { folderName: "Compilation-Round-Trip" });
  await page.goto("/ide/");
  await expect(page.getByTestId("target-status")).toContainText(
    "Virtual XRP · ready",
  );
  await page.getByRole("button", { name: "Compile", exact: true }).click();
  await expect(page.getByTestId("check-result")).toContainText(
    /compiled with MicroPython/i,
  );
  const compilationMarker = await page.evaluate(() =>
    sessionStorage.getItem("ucsb-xrp-ide-compiled-digest-v1"),
  );
  expect(compilationMarker).not.toBeNull();

  await page
    .getByRole("navigation", { name: "Course applications" })
    .getByRole("link", { name: "Guide", exact: true })
    .click();
  await page
    .getByRole("navigation", { name: "Course applications" })
    .getByRole("link", { name: "IDE", exact: true })
    .click();
  expect(
    await page.evaluate(() =>
      sessionStorage.getItem("ucsb-xrp-ide-compiled-digest-v1"),
    ),
  ).toBe(compilationMarker);

  const ide = page.frameLocator('iframe[title="UCSBXRP IDE"]');
  await ide.getByRole("button", { name: "Expand output" }).click();
  await ide.getByRole("tab", { name: "Status", exact: true }).click();
  await expect(ide.getByTestId("check-result")).toContainText(
    /compiled with MicroPython|passed earlier in this browser tab/i,
  );
  await expect(ide.getByTestId("check-result")).not.toContainText(
    /files changed|not been compiled/i,
  );
});

test("writes IDE troubleshooting events only to the Working folder log", async ({
  page,
}) => {
  const folderName = "IDE-Diagnostic-Log";
  const projectFolderName = "Diagnostic-Project";
  await seedWorkingFolder(page, {
    folderName,
    projectFolderName,
    project: {
      name: "Diagnostic project",
      entrypoint: "main.py",
      files: {
        "main.py":
          "# source-only-marker-must-not-appear-in-log\nprint('diagnostic run completed')\n",
      },
    },
  });

  await page.goto("/ide/");
  await expect(page.getByTestId("target-status")).toContainText(
    "Virtual XRP · ready",
  );
  await page.getByRole("button", { name: "Settings" }).click();
  await expect(page.getByTestId("settings-panel")).toContainText(
    "Troubleshooting log: UCSBXRP_diagnostic.log",
  );
  await page.getByRole("button", { name: "Close settings" }).click();

  await page.getByRole("button", { name: "Run", exact: true }).click();
  await expect(page.getByRole("log")).toContainText("diagnostic run completed");
  await expect(page.getByTestId("target-status")).toContainText(
    "Virtual XRP · ready",
  );

  await expect
    .poll(() => readDiagnosticLog(page, folderName))
    .toContain('event="target.console"');
  const log = await readDiagnosticLog(page, folderName);
  expect(log.match(/event="session\.start"/g)).toHaveLength(1);
  expect(log).toContain('app="IDE"');
  expect(log).toContain('event="target.status"');
  expect(log).toContain('event="target.project"');
  expect(log).toContain("event_id=");
  expect(log).not.toContain("diagnostic run completed");
  expect(log).not.toContain("source-only-marker-must-not-appear-in-log");
  expect(log).not.toContain('event="telemetry.sample"');

  const projectContainsDiagnosticLog = await page.evaluate(
    async ({ folderName, projectFolderName }) => {
      const root = await navigator.storage.getDirectory();
      const workingFolder = await root.getDirectoryHandle(folderName);
      const projectFolder =
        await workingFolder.getDirectoryHandle(projectFolderName);
      try {
        await projectFolder.getFileHandle("UCSBXRP_diagnostic.log");
        return true;
      } catch (error) {
        if (error instanceof DOMException && error.name === "NotFoundError") {
          return false;
        }
        throw error;
      }
    },
    { folderName, projectFolderName },
  );
  expect(projectContainsDiagnosticLog).toBe(false);
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
  await expect(ide.getByTestId("project-folder")).toHaveText(
    "Immediate-Monitor-Run",
  );
  await expect(ide.getByTestId("project-save-state")).toHaveText("Saved");

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
  const problems = page.getByRole("tabpanel");
  await expect(problems).toContainText("Project");
  await expect(problems).toContainText("This project has 49 files");
  await expect(problems).toContainText("at most 48");
  await expect(problems).toContainText("project_too_large");

  await page.getByRole("button", { name: "Run", exact: true }).click();
  await page.getByRole("tab", { name: /System log/ }).click();
  await expect(page.getByRole("log")).toContainText("Compilation failed");
  await page.getByRole("tab", { name: /Program output/ }).click();
  await expect(page.getByRole("log")).not.toContainText("not run");
  await expect(page.getByTestId("target-status")).toContainText(
    "Virtual XRP · ready",
  );
});
