import { expect, test, type Page } from "@playwright/test";

const boundedVirtualMotionProgram = `from time import sleep_ms
from ucsb_xrp import DriveCommand, RobotConfig, XRPBot

bot = XRPBot(RobotConfig(max_drive_command=0.65))
try:
    bot.set_drive(DriveCommand(0.58, 0.52))
    sleep_ms(1800)
finally:
    bot.stop()

print("Late Monitor history run complete")
`;

function collectBrowserErrors(page: Page, errors: string[]): void {
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
}

test("a Monitor opened after a virtual run receives its path and strip history", async ({
  context,
  page: ide,
}) => {
  test.setTimeout(35_000);
  const errors: string[] = [];
  collectBrowserErrors(ide, errors);
  await ide.addInitScript((program: string) => {
    localStorage.setItem(
      "ucsb-xrp-course-project-v1",
      JSON.stringify({
        name: "late-monitor-history",
        entrypoint: "main.py",
        files: { "main.py": program },
      }),
    );
  }, boundedVirtualMotionProgram);

  await ide.goto("/ide/");
  await expect(ide.getByTestId("target-status")).toContainText(
    "Virtual XRP · ready",
  );
  await ide.getByRole("button", { name: "Run", exact: true }).click();
  await expect(ide.getByRole("log")).toContainText(
    "Late Monitor history run complete",
    { timeout: 20_000 },
  );
  await expect(ide.getByTestId("target-status")).toContainText(
    "Virtual XRP · ready",
  );

  const monitor = await context.newPage();
  collectBrowserErrors(monitor, errors);
  await monitor.goto("/monitor/");
  await expect(monitor.getByTestId("target-status")).toContainText(
    "Virtual XRP · ready",
  );
  await expect(monitor.getByTestId("world-view")).toHaveAttribute(
    "data-pose-state",
    "published",
  );
  await expect
    .poll(
      async () =>
        Number(
          (await monitor
            .getByTestId("world-view")
            .getAttribute("data-path-point-count")) ?? "0",
        ),
      { message: "late Monitor should reconstruct the completed world path" },
    )
    .toBeGreaterThan(2);
  await expect
    .poll(
      async () =>
        Number(
          (await monitor
            .getByTestId("wheel-speed-plot")
            .locator("xpath=..")
            .getAttribute("data-sample-count")) ?? "0",
        ),
      {
        message: "late Monitor should reconstruct the completed strip history",
      },
    )
    .toBeGreaterThan(2);
  await expect(monitor.getByTestId("x-mm")).not.toHaveText("0.0 mm");
  expect(errors).toEqual([]);
});
