import { expect, test } from "@playwright/test";
import { seedWorkingFolder } from "./working-folder";

test("rename persists the project title and retains its folder and source", async ({
  page,
}) => {
  await seedWorkingFolder(page, { folderName: "Rename-Student-Project" });
  await page.goto("/ide/");
  await expect(page.getByTestId("target-status")).toContainText("ready");
  const folder = await page.getByTestId("project-folder").textContent();
  const originalFiles = await page
    .locator(".file-list .file-path")
    .allTextContents();
  const readProject = () =>
    page.evaluate(async () => {
      const root = await navigator.storage.getDirectory();
      const workspace = await root.getDirectoryHandle("Rename-Student-Project");
      const project = await workspace.getDirectoryHandle("Expanding-Spiral");
      const contents = async (name: string) =>
        (await (await project.getFileHandle(name)).getFile()).text();
      return {
        metadata: JSON.parse(await contents(".ucsb-xrp-project.json")),
        main: await contents("main.py"),
      };
    });
  await expect(page.getByTestId("project-save-state")).toHaveText("Saved");
  const before = await readProject();
  const addition = "\n# Student observation retained while renaming.\n";
  const editor = page.getByRole("textbox", { name: "main.py editor" });
  await editor.focus();
  await editor.press("ControlOrMeta+End");
  await page.keyboard.insertText(addition);
  await page
    .getByRole("button", { name: "Rename project…", exact: true })
    .click();
  await page
    .getByLabel("Project display name")
    .fill("Wheel calibration, trial 2");
  await page.getByRole("button", { name: "Save name", exact: true }).click();
  await expect(page.getByTestId("project-name")).toHaveText(
    "Wheel calibration, trial 2",
  );
  await expect(page.getByTestId("project-save-state")).toHaveText("Saved");
  await page.reload();
  await expect(page.getByTestId("project-name")).toHaveText(
    "Wheel calibration, trial 2",
  );
  await expect(page.getByTestId("project-folder")).toHaveText(folder!);
  const after = await readProject();
  expect(after.main).toContain(addition);
  expect(after.main.replace(addition, "")).toBe(before.main);
  expect(before.metadata.session.projectId).toBeTruthy();
  expect(after.metadata.session.projectId).toBe(
    before.metadata.session.projectId,
  );
  expect(await page.locator(".file-list .file-path").allTextContents()).toEqual(
    originalFiles,
  );
  await page.getByRole("button", { name: "Run", exact: true }).click();
  await expect(page.getByTestId("target-status")).toContainText("running");
  await page.getByRole("button", { name: "Stop", exact: true }).click();
  await expect(page.getByTestId("target-status")).toContainText("ready");
});

test("student documentation search, Python guidance and troubleshooting preserve reference access", async ({
  page,
}) => {
  await page.goto("/reference/");
  const toc = page.getByRole("navigation", { name: "API sections" });
  await page.getByLabel("Find a class or function").fill("robot.step");
  await expect(
    toc.getByRole("link", { name: "Robot", exact: true }),
  ).toBeVisible();
  await page.getByLabel("Find a class or function").fill("sample_period_ms");
  await expect(
    toc.getByRole("link", { name: "RobotConfig", exact: true }),
  ).toBeVisible();
  await page.getByLabel("Find a class or function").fill("wheel");
  await expect(
    toc.getByRole("link", { name: "WheelSpeedController", exact: true }),
  ).toBeVisible();
  await toc
    .getByRole("link", { name: "WheelSpeedController", exact: true })
    .click();
  await expect(page.locator("#wheel-speed-controller")).toBeVisible();
  await page.getByLabel("Find a class or function").fill("no_such_component");
  await expect(toc.getByRole("status")).toContainText("No matching entry");
  await expect(page.locator("#wheel-speed-controller")).toBeVisible();
  await page.goto("/guide/#python-basics");
  await expect(page.locator("#python-basics")).toHaveAttribute("open", "");
  await expect(page.locator("#python-basics")).toContainText("MATLAB");
  await page.goto("/guide/#recovery");
  await expect(page.locator("#troubleshooting #recovery")).toBeVisible();
  await page.goto("/guide/#class-router");
  await expect(page.locator("#class-router")).toHaveAttribute("open", "");
  await expect(page.locator("#class-router")).toContainText("V5.46");
  await page.goto("/guide/#telemetry-files");
  await expect(page.locator("#telemetry-files")).toHaveAttribute("open", "");
  await expect(
    page.getByRole("button", { name: "Copy MATLAB example" }),
  ).toBeVisible();
  await expect(page.locator("#telemetry-files")).toContainText("acquired_at_s");
  await page.setViewportSize({ width: 570, height: 750 });
  await page.goto("/reference/");
  await page.getByLabel("Find a class or function").fill("Measurements");
  await expect(
    page
      .getByRole("navigation", { name: "API sections" })
      .getByRole("link", { name: "Measurements", exact: true }),
  ).toBeVisible();
});
