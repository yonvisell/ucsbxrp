import { expect, test, type Page } from "@playwright/test";

const recoveryKey = "ucsb-xrp-course-project-v1";

async function replaceMain(page: Page, source: string): Promise<void> {
  const editor = page.getByRole("textbox", { name: "main.py editor" });
  await editor.focus();
  await editor.press("ControlOrMeta+A");
  await page.keyboard.insertText(source);
}

async function openProgramOutput(page: Page): Promise<void> {
  await page.getByRole("tab", { name: "Program output" }).click();
}

test("an explicit IDE owns Run across tabs and releases it when closed", async ({
  context,
  page: firstIde,
}) => {
  test.setTimeout(45_000);
  await firstIde.addInitScript(
    ({ key }) => {
      localStorage.clear();
      localStorage.setItem(
        key,
        JSON.stringify({
          name: "Project ownership test",
          entrypoint: "main.py",
          files: { "main.py": 'print("INITIAL")\n' },
        }),
      );
    },
    { key: recoveryKey },
  );
  await firstIde.goto("/ide/");
  await expect(firstIde.getByTestId("target-status")).toContainText(
    "Virtual XRP · ready",
  );
  await expect(firstIde.getByTestId("project-owner-state")).toContainText(
    "Active project",
  );

  const secondIde = await context.newPage();
  await secondIde.goto("/ide/");
  await expect(secondIde.getByTestId("target-status")).toContainText(
    "Virtual XRP · ready",
  );
  await expect(secondIde.getByTestId("project-owner-state")).toContainText(
    "Another IDE tab controls Run",
  );
  await expect(
    secondIde.getByRole("button", { name: "Run", exact: true }),
  ).toBeDisabled();

  const monitor = await context.newPage();
  await monitor.goto("/monitor/");
  const monitorRun = monitor
    .locator(".app-header")
    .getByRole("button", { name: "Run", exact: true });
  await expect(monitorRun).toBeEnabled();

  await replaceMain(firstIde, 'print("OWNER_A_FIRST")\n');
  await monitorRun.click();
  await openProgramOutput(firstIde);
  await expect(
    firstIde.getByText("OWNER_A_FIRST", { exact: true }),
  ).toHaveCount(1);
  await expect(monitor.getByTestId("target-status")).toContainText(
    "Virtual XRP · ready",
  );

  await replaceMain(secondIde, 'print("STANDBY_MUST_NOT_RUN")\n');
  await monitorRun.click();
  await expect(
    firstIde.getByText("OWNER_A_FIRST", { exact: true }),
  ).toHaveCount(2);
  await expect(firstIde.getByRole("log")).not.toContainText(
    "STANDBY_MUST_NOT_RUN",
  );
  await expect(monitor.getByTestId("target-status")).toContainText(
    "Virtual XRP · ready",
  );

  await secondIde.getByRole("button", { name: "Use this project" }).click();
  await expect(secondIde.getByTestId("project-owner-state")).toContainText(
    "Active project",
  );
  await expect(firstIde.getByTestId("project-owner-state")).toContainText(
    "Another IDE tab controls Run",
  );
  await replaceMain(secondIde, 'print("OWNER_B_AFTER_TAKEOVER")\n');
  await monitorRun.click();
  await openProgramOutput(secondIde);
  await expect(secondIde.getByRole("log")).toContainText(
    "OWNER_B_AFTER_TAKEOVER",
  );
  await expect(monitor.getByTestId("target-status")).toContainText(
    "Virtual XRP · ready",
  );

  // A normal browser tab close runs beforeunload. Playwright bypasses that
  // lifecycle by default, so request the real browser behavior explicitly.
  await secondIde.close({ runBeforeUnload: true });
  await expect(firstIde.getByTestId("project-owner-state")).toContainText(
    "No active IDE project",
  );
  await expect(monitorRun).toBeEnabled();
  await expect(monitorRun).toHaveAttribute(
    "title",
    /Validate and run Expanding spiral/,
  );
  await monitorRun.click();
  await expect(monitor.getByTestId("target-status")).toContainText(
    "Virtual XRP · running",
  );
  await monitor
    .locator(".app-header")
    .getByRole("button", { name: "Stop", exact: true })
    .click();
  await expect(monitor.getByTestId("target-status")).toContainText(
    "Virtual XRP · ready",
  );

  await firstIde.getByRole("button", { name: "Use this project" }).click();
  await expect(firstIde.getByTestId("project-owner-state")).toContainText(
    "Active project",
  );
  await replaceMain(firstIde, 'print("OWNER_A_RECLAIMED")\n');
  await expect(monitorRun).toBeEnabled();
  await monitorRun.click();
  await expect(firstIde.getByRole("log")).toContainText("OWNER_A_RECLAIMED");
  await expect(monitor.getByTestId("target-status")).toContainText(
    "Virtual XRP · ready",
  );
});
