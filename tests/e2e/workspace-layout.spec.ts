import { expect, test, type Page } from "@playwright/test";

import { seedWorkingFolder } from "./working-folder";

test.beforeEach(async ({ page }) => {
  await seedWorkingFolder(page, { folderName: "Workspace-Layout" });
});

async function expectShellFillsViewport(page: Page, selector: string) {
  const geometry = await page.locator(selector).evaluate((element) => {
    const bounds = element.getBoundingClientRect();
    return {
      bottom: bounds.bottom,
      height: bounds.height,
      left: bounds.left,
      pageHeight: document.documentElement.scrollHeight,
      pageWidth: document.documentElement.scrollWidth,
      right: bounds.right,
      top: bounds.top,
      viewportHeight: window.innerHeight,
      viewportWidth: window.innerWidth,
    };
  });
  expect(geometry.left).toBe(0);
  expect(geometry.top).toBe(0);
  expect(geometry.right).toBeCloseTo(geometry.viewportWidth, 0);
  expect(geometry.bottom).toBeCloseTo(geometry.viewportHeight, 0);
  expect(geometry.height).toBeCloseTo(geometry.viewportHeight, 0);
  expect(geometry.pageWidth).toBe(geometry.viewportWidth);
  expect(geometry.pageHeight).toBe(geometry.viewportHeight);
}

test("IDE fills the window and reclaims editor width during live resizing", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1180, height: 820 });
  await page.goto("/ide/");
  await expect(page.getByTestId("target-status")).toContainText(
    "Virtual XRP · ready",
  );
  await page.reload();
  await expect(page.getByTestId("target-status")).toContainText(
    "Virtual XRP · ready",
  );
  await expect(
    page.getByRole("complementary", { name: "Project" }),
  ).toBeVisible();
  await expectShellFillsViewport(page, ".ide-app");

  await page.setViewportSize({ width: 850, height: 980 });
  await expect(
    page.getByRole("complementary", { name: "Project" }),
  ).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Project ›" })).toBeVisible();
  await expectShellFillsViewport(page, ".ide-app");

  const editorWidth = await page
    .locator(".editor-stack")
    .evaluate((element) => element.getBoundingClientRect().width);
  expect(editorWidth).toBeGreaterThan(840);

  const header = page.locator(".app-header");
  const headerGeometry = await header.evaluate((element) => ({
    right: element.getBoundingClientRect().right,
    scrollWidth: element.scrollWidth,
    viewportWidth: window.innerWidth,
  }));
  expect(headerGeometry.right).toBeCloseTo(headerGeometry.viewportWidth, 0);
  expect(headerGeometry.scrollWidth).toBeLessThanOrEqual(
    headerGeometry.viewportWidth,
  );
  await expect(
    page.getByRole("link", { name: "API", exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Settings" })).toBeVisible();
  const targetWidth = await page
    .getByLabel("Run on")
    .evaluate((element) => element.getBoundingClientRect().width);
  expect(targetWidth).toBeGreaterThanOrEqual(108);

  await page.getByRole("button", { name: "Expand output" }).click();

  await page.setViewportSize({ width: 1320, height: 900 });
  await expect(
    page.getByRole("complementary", { name: "Project" }),
  ).toBeVisible();
  await expectShellFillsViewport(page, ".ide-app");

  const expandedEditor = await page
    .locator(".editor-stack")
    .evaluate((element) => {
      const bounds = element.getBoundingClientRect();
      const monaco = element
        .querySelector(".monaco-editor")
        ?.getBoundingClientRect();
      return {
        consoleHeight:
          element.querySelector(".console-panel")?.getBoundingClientRect()
            .height ?? 0,
        height: bounds.height,
        monacoHeight: monaco?.height ?? 0,
        monacoWidth: monaco?.width ?? 0,
        width: bounds.width,
      };
    });
  expect(expandedEditor.width).toBeGreaterThan(1120);
  expect(expandedEditor.height).toBeGreaterThan(840);
  expect(expandedEditor.consoleHeight).toBeLessThanOrEqual(136);
  expect(expandedEditor.monacoWidth).toBeGreaterThan(1100);
  expect(expandedEditor.monacoHeight).toBeGreaterThan(650);

  for (const size of [
    { width: 600, height: 760 },
    { width: 1180, height: 840 },
    { width: 820, height: 900 },
    { width: 1320, height: 900 },
  ]) {
    await page.setViewportSize(size);
    await expectShellFillsViewport(page, ".ide-app");
    if (size.width <= 900) {
      await expect(
        page.getByRole("complementary", { name: "Project" }),
      ).toHaveCount(0);
    } else {
      await expect(
        page.getByRole("complementary", { name: "Project" }),
      ).toBeVisible();
    }
    await expect
      .poll(
        () =>
          page.locator(".editor-frame").evaluate((element) => {
            const frame = element.getBoundingClientRect();
            const monaco = element
              .querySelector(".monaco-editor")
              ?.getBoundingClientRect();
            if (!monaco) return Number.POSITIVE_INFINITY;
            return Math.max(
              Math.abs(monaco.width - frame.width),
              Math.abs(monaco.height - frame.height),
            );
          }),
        { timeout: 1_000 },
      )
      .toBeLessThanOrEqual(1);
  }
});

test("combined workspace shares Run and adapts between split and narrow layouts", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/workspace/");

  const ideFrame = page.frameLocator('iframe[title="UCSBXRP IDE"]');
  const monitorFrame = page.frameLocator('iframe[title="UCSBXRP Monitor"]');
  await expect(ideFrame.getByTestId("target-status")).toContainText(
    "Virtual XRP · ready",
  );
  await expect(monitorFrame.getByTestId("target-status")).toContainText(
    "Virtual XRP · ready",
  );
  await expectShellFillsViewport(page, ".workspace-app");
  await expect(ideFrame.locator(".brand")).toBeHidden();
  await expect(monitorFrame.locator(".brand")).toBeHidden();

  const idePane = page.getByRole("region", { name: "IDE pane" });
  const monitorPane = page.getByRole("region", { name: "Monitor pane" });
  const initialIdeBox = await idePane.boundingBox();
  const initialMonitorBox = await monitorPane.boundingBox();
  expect(initialIdeBox?.y).toBe(initialMonitorBox?.y);
  expect(initialIdeBox?.width).toBeGreaterThan(690);
  expect(initialMonitorBox?.width).toBeGreaterThan(690);

  const separator = page.getByRole("separator", {
    name: "Resize IDE and Monitor",
  });
  await separator.focus();
  await page.keyboard.press("End");
  const resizedIdeBox = await idePane.boundingBox();
  expect(resizedIdeBox?.width).toBeGreaterThan(initialIdeBox?.width ?? 0);

  const monitorRun = monitorFrame.getByRole("button", {
    name: "Run",
    exact: true,
  });
  await expect(monitorRun).toBeEnabled({ timeout: 20_000 });
  await monitorRun.click();
  await ideFrame.getByRole("tab", { name: "System log" }).click();
  await expect(ideFrame.getByRole("log")).toContainText(
    "Starting Expanding spiral",
    { timeout: 15_000 },
  );
  const monitorStop = monitorFrame.getByRole("button", {
    name: "Stop",
    exact: true,
  });
  await expect(monitorStop).toBeEnabled();
  await monitorStop.click();
  await expect(monitorFrame.getByTestId("target-status")).toContainText(
    "Virtual XRP · ready",
  );

  await page.setViewportSize({ width: 901, height: 900 });
  await separator.focus();
  await page.keyboard.press("Home");
  const minimumWideIdeBox = await idePane.boundingBox();
  const minimumWideMonitorBox = await monitorPane.boundingBox();
  expect(minimumWideIdeBox?.width).toBeGreaterThanOrEqual(320);
  expect(minimumWideMonitorBox?.width).toBeGreaterThanOrEqual(320);

  await page.setViewportSize({ width: 780, height: 920 });
  await expect(page.getByRole("button", { name: "Stacked" })).toBeVisible();
  const narrowIdeBox = await idePane.boundingBox();
  const narrowMonitorBox = await monitorPane.boundingBox();
  expect(narrowMonitorBox?.y).toBeGreaterThan(narrowIdeBox?.y ?? 0);
  expect(narrowIdeBox?.width).toBeCloseTo(780, 0);
  expect(narrowMonitorBox?.width).toBeCloseTo(780, 0);
  await expectShellFillsViewport(page, ".workspace-app");

  await page.getByRole("button", { name: "Monitor", exact: true }).click();
  await expect(idePane).toBeHidden();
  await expect(monitorPane).toBeVisible();
  await page.getByRole("button", { name: "IDE", exact: true }).click();
  await expect(idePane).toBeVisible();
  await expect(monitorPane).toBeHidden();
});
