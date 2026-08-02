import { expect, test, type Page } from "@playwright/test";

const xrpAddress = process.env.XRP_ADDRESS?.trim();

const retainedZeroOutputProject = {
  name: "Physical service probe",
  entrypoint: "main.py",
  files: {
    "main.py": `import time
from ucsb_xrp import RobotConfig, XRPBot

bot = XRPBot(RobotConfig())
try:
    while True:
        time.sleep_ms(100)
finally:
    bot.stop()
`,
    "probe-note.md": "Zero-output lifecycle probe.\n",
  },
};

function collectBrowserErrors(page: Page, errors: string[]): void {
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") {
      errors.push(message.text());
    }
  });
}

test("IDE and Monitor share the retained physical XRP project lifecycle", async ({
  context,
}) => {
  test.skip(!xrpAddress, "Set XRP_ADDRESS to run the attached-hardware proof");
  test.setTimeout(90_000);
  await context.addInitScript(
    ({ address, project }) => {
      localStorage.setItem(
        "ucsb-xrp-target-v1",
        JSON.stringify({
          kind: "physical",
          physicalEndpoint: `http://${address}`,
        }),
      );
      localStorage.setItem(
        "ucsb-xrp-course-project-v1",
        JSON.stringify(project),
      );
    },
    { address: xrpAddress!, project: retainedZeroOutputProject },
  );

  const errors: string[] = [];
  const ide = await context.newPage();
  const monitor = await context.newPage();
  collectBrowserErrors(ide, errors);
  collectBrowserErrors(monitor, errors);
  await ide.goto("/ide/");
  await monitor.goto("/dashboard/");

  const ideStatus = ide.getByTestId("target-status");
  const monitorStatus = monitor.getByTestId("target-status");
  await expect(ideStatus).toContainText("Physical XRP · ready", {
    timeout: 30_000,
  });
  await expect(monitorStatus).toContainText("Physical XRP · ready");

  const monitorRun = monitor
    .locator(".app-header")
    .getByRole("button", { name: "Run", exact: true });
  await ide.getByRole("button", { name: "Sync project" }).click();
  await expect(
    ide.getByText("The complete project is current on the XRP."),
  ).toBeVisible({ timeout: 20_000 });
  await expect(monitorRun).toBeEnabled();
  await monitorRun.click();
  await expect(ideStatus).toContainText("Physical XRP · running", {
    timeout: 15_000,
  });
  await monitor
    .locator(".app-header")
    .getByRole("button", { name: "Stop", exact: true })
    .click();
  await expect(ideStatus).toContainText("Physical XRP · ready", {
    timeout: 30_000,
  });

  await ide.getByRole("button", { name: "New file", exact: true }).click();
  await ide.getByLabel("Project-relative path").fill("notes.md");
  await ide.getByRole("button", { name: "Create file" }).click();
  await expect(monitorRun).toBeDisabled();
  await expect(monitorRun).toHaveAttribute("title", /IDE project changed/);

  await ide.getByRole("button", { name: "Sync project" }).click();
  await expect(
    ide.getByText("The complete project is current on the XRP."),
  ).toBeVisible({
    timeout: 20_000,
  });
  await expect(monitorRun).toBeEnabled();
  await ide.getByRole("button", { name: "Run", exact: true }).click();
  await expect(monitorStatus).toContainText("Physical XRP · running", {
    timeout: 15_000,
  });
  await monitor
    .locator(".app-header")
    .getByRole("button", { name: "Stop", exact: true })
    .click();
  await expect(ideStatus).toContainText("Physical XRP · ready", {
    timeout: 30_000,
  });
  await expect(monitor.getByTestId("motor-effort")).toHaveText("0.00 / 0.00");
  expect(errors).toEqual([]);
});
