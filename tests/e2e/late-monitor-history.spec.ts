import { expect, test } from "@playwright/test";

import {
  replaceWorkspaceProject,
  seedWorkingFolder,
  type TestProject,
} from "./working-folder";

const completedRunProgram = `from time import sleep_ms
from ucsb_xrp import DriveCommand, RobotConfig, XRPBot

robot = XRPBot(RobotConfig(max_drive_command=0.55))
try:
    robot.set_drive(DriveCommand(0.45, 0.39))
    sleep_ms(2500)
finally:
    robot.stop()

print("Late Monitor run complete")
`;

const completedRunProject: TestProject = {
  name: "Late Monitor run",
  entrypoint: "main.py",
  files: {
    "main.py": completedRunProgram,
    "README.md": "# Late Monitor run\n",
  },
};

function recordedCount(text: string | null): number {
  const match = (text ?? "").match(/([\d,]+) samples/);
  return Number.parseInt((match?.[1] ?? "0").replaceAll(",", ""), 10);
}

test("a late Monitor restores one completed run and replaces it on direct Run", async ({
  context,
  page: ide,
}) => {
  test.setTimeout(45_000);

  await seedWorkingFolder(ide, { folderName: "Late-Monitor-Run" });
  await ide.goto("/ide/");
  await expect(ide.getByTestId("project-name")).toHaveText("Expanding spiral");
  await expect(ide.getByTestId("project-folder")).toHaveText(
    "Expanding-Spiral",
  );

  await replaceWorkspaceProject(ide, completedRunProject, {
    folderName: "Late-Monitor-Run",
  });
  await ide.reload();
  await expect(ide.getByTestId("project-name")).toHaveText("Late Monitor run");
  await ide.getByRole("button", { name: "Run", exact: true }).click();
  await expect(ide.getByTestId("target-status")).toContainText(
    "Virtual XRP · running",
    { timeout: 10_000 },
  );
  await expect(ide.getByRole("log")).toContainText(
    "Late Monitor run complete",
    { timeout: 15_000 },
  );
  await expect(ide.getByTestId("target-status")).toContainText(
    "Virtual XRP · ready",
  );

  const monitor = await context.newPage();
  await monitor.goto("/monitor/");
  await expect(monitor.getByTestId("target-status")).toContainText(
    "Virtual XRP · ready",
  );
  await expect(monitor.getByTestId("recording-count")).toContainText(
    "Late Monitor run ·",
  );
  await expect(monitor.getByTestId("recording-count")).not.toContainText(
    "Current run",
  );
  const firstRunCount = recordedCount(
    await monitor.getByTestId("recording-count").textContent(),
  );
  expect(firstRunCount).toBeGreaterThanOrEqual(10);
  await expect(
    monitor.getByRole("button", { name: "Clear run", exact: true }),
  ).toBeEnabled();
  await expect(
    monitor.getByRole("button", { name: "Export run data as CSV" }),
  ).toBeEnabled();
  await expect(
    monitor.getByRole("button", { name: "Export world animation as WebM" }),
  ).toBeEnabled();

  await monitor.getByRole("button", { name: "Run", exact: true }).click();
  await expect(monitor.getByTestId("recording-count")).toContainText(
    "Current run",
  );
  await expect
    .poll(
      async () =>
        recordedCount(
          await monitor.getByTestId("recording-count").textContent(),
        ),
      { message: "the second run should collect a new dataset" },
    )
    .toBeGreaterThan(4);
  await monitor.getByRole("button", { name: "Stop", exact: true }).click();
  await expect(monitor.getByTestId("recording-count")).toContainText(
    "Late Monitor run ·",
  );
  const secondRunCount = recordedCount(
    await monitor.getByTestId("recording-count").textContent(),
  );
  expect(secondRunCount).toBeGreaterThan(4);
  expect(secondRunCount).toBeLessThan(firstRunCount);
});
