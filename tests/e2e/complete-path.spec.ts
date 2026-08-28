import { expect, test, type Page } from "@playwright/test";

import { seedWorkingFolder, type TestProject } from "./working-folder";

const boundedVirtualMotionProgram = `from time import sleep_ms
from ucsb_xrp import DriveCommand, RobotConfig, XRPBot

bot = XRPBot(RobotConfig(max_drive_command=0.65))
try:
    bot.set_drive(DriveCommand(0.58, 0.52))
    sleep_ms(1800)
finally:
    bot.stop()

print("Virtual run complete")
`;

const boundedMotionProject: TestProject = {
  name: "Virtual motion check",
  entrypoint: "main.py",
  files: {
    "main.py": boundedVirtualMotionProgram,
    "README.md": "# Virtual motion check\n",
  },
};

function numericValue(text: string | null): number {
  return Number.parseFloat(text ?? "NaN");
}

function collectBrowserErrors(page: Page, errors: string[] = []): string[] {
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  return errors;
}

test("edits, compiles, and runs one saved Project across IDE and Monitor", async ({
  context,
  page: ide,
}) => {
  const browserErrors = collectBrowserErrors(ide);
  await seedWorkingFolder(ide, {
    folderName: "Complete-Path",
    project: boundedMotionProject,
    projectFolderName: "Virtual-Motion-Check",
  });
  await ide.goto("/ide/");

  const monitor = await context.newPage();
  collectBrowserErrors(monitor, browserErrors);
  await monitor.goto("/monitor/");

  await expect(ide.getByTestId("project-name")).toHaveText(
    "Virtual motion check",
  );
  await expect(ide.getByTestId("project-folder")).toHaveText(
    "Virtual-Motion-Check",
  );
  await expect(ide.getByTestId("target-status")).toContainText(
    "Virtual XRP · ready",
  );
  await expect(monitor.getByTestId("target-status")).toContainText(
    "Virtual XRP · ready",
  );
  await expect(
    monitor.getByRole("button", { name: "Run", exact: true }),
  ).toHaveAttribute("title", /Virtual motion check/);

  await ide.getByRole("button", { name: "Compile" }).click();
  await expect(ide.getByTestId("check-result")).toContainText(
    /Python files? compiled with MicroPython/,
  );
  await ide.getByRole("button", { name: "Run", exact: true }).click();
  await expect(monitor.getByTestId("target-status")).toContainText(
    "Virtual XRP · running",
  );
  await expect
    .poll(
      async () => numericValue(await monitor.getByTestId("x-mm").textContent()),
      { message: "the virtual XRP should translate during the saved program" },
    )
    .toBeGreaterThan(10);
  await expect(ide.getByRole("log")).toContainText("Virtual run complete", {
    timeout: 10_000,
  });
  await expect(ide.getByTestId("target-status")).toContainText(
    "Virtual XRP · ready",
  );
  await expect(monitor.getByTestId("motor-effort")).toHaveText("0.00 / 0.00");

  await monitor.getByRole("button", { name: "Reset", exact: true }).click();
  await expect(monitor.getByTestId("x-mm")).toHaveText("0.0 mm");

  const guide = await context.newPage();
  collectBrowserErrors(guide, browserErrors);
  await guide.goto("/guide/");
  await expect(
    guide.getByRole("heading", { name: "Python project structure" }),
  ).toBeVisible();
  const reference = await context.newPage();
  collectBrowserErrors(reference, browserErrors);
  await reference.goto("/reference/#records");
  await expect(
    reference.getByText("DriveCommand(left, right)", { exact: true }),
  ).toBeVisible();

  expect(browserErrors).toEqual([]);
});

test("keeps the IDE workspace fitted while a window shrinks and expands", async ({
  page: ide,
}) => {
  await seedWorkingFolder(ide, { folderName: "Responsive-IDE" });
  await ide.setViewportSize({ width: 820, height: 400 });
  await ide.goto("/ide/");
  await expect(ide.locator(".ide-workspace")).toBeVisible();

  const verifyShell = async () => {
    const geometry = await ide.evaluate(() => {
      const rectangle = (selector: string) => {
        const element = document.querySelector<HTMLElement>(selector);
        if (!element) throw new Error(`Missing ${selector}`);
        const box = element.getBoundingClientRect();
        return { right: box.right, bottom: box.bottom };
      };
      return {
        viewport: { width: innerWidth, height: innerHeight },
        shell: rectangle(".app-shell"),
        workspace: rectangle(".ide-workspace"),
        editor: rectangle(".editor-stack"),
        documentWidth: document.documentElement.scrollWidth,
      };
    });
    expect(geometry.shell.right).toBeCloseTo(geometry.viewport.width, 0);
    expect(geometry.shell.bottom).toBeCloseTo(geometry.viewport.height, 0);
    expect(geometry.workspace.bottom).toBeCloseTo(geometry.viewport.height, 0);
    expect(geometry.editor.bottom).toBeLessThanOrEqual(
      geometry.viewport.height + 1,
    );
    expect(geometry.documentWidth).toBeLessThanOrEqual(geometry.viewport.width);
  };

  await verifyShell();
  await ide.getByRole("button", { name: "Expand output" }).click();
  await verifyShell();

  await ide.setViewportSize({ width: 1440, height: 700 });
  await verifyShell();
  await expect(ide.locator(".editor-frame")).toBeVisible();

  await ide.setViewportSize({ width: 375, height: 800 });
  await verifyShell();
  await expect(ide.getByRole("button", { name: "Project ›" })).toBeVisible();
});
