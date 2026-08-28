import { expect, test } from "@playwright/test";

import {
  readWorkspaceTextFile,
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

test("two open Monitors save one copy of the same run", async ({
  context,
  page: ide,
}) => {
  test.setTimeout(45_000);
  const folderName = "Shared-Monitor-Run";
  await seedWorkingFolder(ide, { folderName });
  await ide.goto("/ide/");

  const firstMonitor = await context.newPage();
  const secondMonitor = await context.newPage();
  await firstMonitor.goto("/monitor/");
  await secondMonitor.goto("/monitor/");
  await expect(firstMonitor.getByTestId("target-status")).toContainText(
    "Virtual XRP · ready",
  );
  await expect(secondMonitor.getByTestId("target-status")).toContainText(
    "Virtual XRP · ready",
  );

  await ide.getByRole("button", { name: "Run", exact: true }).click();
  await expect(firstMonitor.getByTestId("recording-count")).toContainText(
    "Current run",
  );
  await expect(secondMonitor.getByTestId("recording-count")).toContainText(
    "Current run",
  );
  await firstMonitor.getByRole("button", { name: "Stop", exact: true }).click();
  await expect(firstMonitor.getByTestId("recording-count")).toContainText(
    "Expanding spiral ·",
  );
  await expect(secondMonitor.getByTestId("recording-count")).toContainText(
    "Expanding spiral ·",
  );

  const autosaveNames = await firstMonitor.evaluate(async (selectedFolder) => {
    const root = await navigator.storage.getDirectory();
    const workspace = await root.getDirectoryHandle(selectedFolder);
    const project = await workspace.getDirectoryHandle("Expanding-Spiral");
    const autosaves = await project.getDirectoryHandle("UCSB_XRP_Autosaves");
    const names: string[] = [];
    for await (const [name] of autosaves.entries()) names.push(name);
    return names.sort();
  }, folderName);
  expect(autosaveNames).toContain("telemetry-1.csv");
  expect(autosaveNames).not.toContain("telemetry-2.csv");

  const diagnostic = await readWorkspaceTextFile(
    firstMonitor,
    "UCSBXRP_diagnostic.log",
    folderName,
  );
  expect(diagnostic.match(/event="run\.finished"/g)).toHaveLength(1);
});
