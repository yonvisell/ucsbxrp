import { expect, test, type Page } from "@playwright/test";
import { csvRows, decodeCsvCell } from "../../apps/dashboard/src/csv-records";
import { expandingSpiralProject, seedWorkingFolder } from "./working-folder";

async function openMonitor(page: Page) {
  await seedWorkingFolder(page, {
    folderName: "Navigation-Cancellation",
    project: {
      ...expandingSpiralProject,
      files: {
        ...expandingSpiralProject.files,
        "main.py": `from course_setup import make_robot
from robot_config import ROBOT_CONFIG
from ucsb_xrp import MotionCommand, Pose

robot = make_robot(ROBOT_CONFIG)
try:
    robot.start(Pose(600.0, 600.0, 0.0))
    for sample_index in range(3000):
        robot.step(MotionCommand(60.0, 0.0))
finally:
    robot.stop()
`,
      },
    },
  });
  await page.goto("/monitor/");
  await expect(page.getByTestId("target-status")).toContainText("ready");
  await expect(
    page.getByRole("button", { name: "Run", exact: true }),
  ).toBeEnabled();
}

async function sampleCount(page: Page) {
  const text = await page.getByTestId("recording-count").textContent();
  return Number(text?.match(/([\d,]+) samples/)?.[1]?.replaceAll(",", "") ?? 0);
}

async function cancelDeparture(page: Page) {
  const originalUrl = page.url();
  const nextDialog = page.waitForEvent("dialog");
  const navigation = page.goto("/guide/").catch(() => undefined);
  const warning = await nextDialog;
  expect(warning.type()).toBe("beforeunload");
  await warning.dismiss();
  await navigation;
  expect(page.url()).toBe(originalUrl);
}

async function stoppedArchive(page: Page) {
  const archive = await page.evaluate(async () => {
    const working = await (
      await navigator.storage.getDirectory()
    ).getDirectoryHandle("Navigation-Cancellation");
    const project = await working.getDirectoryHandle("Expanding-Spiral");
    const autosaves = await project.getDirectoryHandle("UCSB_XRP_Autosaves");
    const read = async (name: string) =>
      (await (await autosaves.getFileHandle(name)).getFile()).text();
    return {
      metadata: JSON.parse(await read("run-1.json")),
      csv: await read("telemetry-1.csv"),
    };
  });
  const rows = csvRows(archive.csv).map((row) => row.cells.map(decodeCsvCell));
  const header = rows.shift()!;
  expect(rows.length).toBeGreaterThan(0);
  expect(archive.metadata.telemetrySamples).toBe(rows.length);
  expect(archive.metadata.finalState).toBe("ready");
  for (const name of ["left_drive_command", "right_drive_command"]) {
    const column = header.indexOf(name);
    expect(column).toBeGreaterThanOrEqual(0);
    expect(Number(rows.at(-1)![column])).toBe(0);
  }
  return archive.metadata.runId as string;
}

test("staying after a controller departure attempt stops, saves, and can run again", async ({
  page,
}) => {
  await openMonitor(page);
  await page.getByRole("button", { name: "Run", exact: true }).click();
  await expect.poll(() => sampleCount(page)).toBeGreaterThan(10);
  await cancelDeparture(page);
  await expect(page.getByTestId("target-status")).toContainText("ready");
  await expect(page.getByTestId("run-autosave-status")).toContainText(
    "Saved automatically",
  );
  const firstRunId = await stoppedArchive(page);
  await page.getByRole("button", { name: "Run", exact: true }).click();
  await expect(page.getByTestId("target-status")).toContainText("running");
  await page.getByRole("button", { name: "Stop", exact: true }).click();
  await expect(page.getByTestId("target-status")).toContainText("ready");
  await expect(page.getByTestId("run-autosave-status")).toContainText(
    "Saved automatically",
  );
  expect(await stoppedArchive(page)).not.toBe(firstRunId);
});

test("staying in an observing Monitor preserves live updates and the controller run", async ({
  page,
  context,
}) => {
  await openMonitor(page);
  await page.getByRole("button", { name: "Run", exact: true }).click();
  await expect.poll(() => sampleCount(page)).toBeGreaterThan(10);
  const observer = await context.newPage();
  await observer.goto("/monitor/");
  await expect(observer.getByTestId("target-status")).toContainText("running");
  await expect.poll(() => sampleCount(observer)).toBeGreaterThan(10);
  await observer.getByTestId("recording-count").click();
  await cancelDeparture(observer);
  const countAfterCancel = await sampleCount(observer);
  await expect(page.getByTestId("target-status")).toContainText("running");
  await expect
    .poll(() => sampleCount(observer))
    .toBeGreaterThan(countAfterCancel + 10);
  await page.getByRole("button", { name: "Stop", exact: true }).click();
  await expect(observer.getByTestId("target-status")).toContainText("ready");
  await expect(observer.getByTestId("run-autosave-status")).toContainText(
    "Saved automatically",
  );
  await expect(page.getByTestId("run-autosave-status")).toContainText(
    "Saved automatically",
  );
  await stoppedArchive(page);
});

test("staying in an IDE-only workspace preserves both recorders and the next Run", async ({
  page,
}) => {
  await openMonitor(page);
  await page.goto("/workspace/?mode=ide");
  const ide = page.frameLocator('iframe[title="UCSBXRP IDE"]');
  const monitor = page.frameLocator('iframe[title="UCSBXRP Monitor"]');
  await expect(ide.getByTestId("target-status")).toContainText("ready");
  await ide.getByRole("button", { name: "Run", exact: true }).click();
  await expect(monitor.getByTestId("target-status")).toContainText("running");
  await expect(ide.getByTestId("ide-run-save-state")).toHaveText(
    "Recording run…",
  );
  await cancelDeparture(page);
  await expect(ide.getByTestId("target-status")).toContainText("ready");
  await expect(ide.getByTestId("ide-run-save-state")).toHaveText("Run saved");
  await expect(monitor.getByTestId("target-status")).toContainText("ready");
  await expect(monitor.locator(".monitor-run-button")).toBeEnabled();
  const firstRunId = await stoppedArchive(page);
  await ide.getByRole("button", { name: "Run", exact: true }).click();
  await expect(ide.getByTestId("target-status")).toContainText("running");
  await ide.getByRole("button", { name: "Stop", exact: true }).click();
  await expect(ide.getByTestId("ide-run-save-state")).toHaveText("Run saved");
  await expect(monitor.getByTestId("target-status")).toContainText("ready");
  await expect(monitor.locator(".monitor-run-button")).toBeEnabled();
  expect(await stoppedArchive(page)).not.toBe(firstRunId);
});

test("staying after departure during a held Project read cancels that launch", async ({
  page,
}) => {
  await openMonitor(page);
  await page.evaluate(() => {
    const fixture = window as typeof window & {
      __navigationReadBlocked?: boolean;
      __navigationReadFinished?: boolean;
      __releaseNavigationRead?: () => void;
    };
    const original = FileSystemFileHandle.prototype.getFile;
    let held = false;
    FileSystemFileHandle.prototype.getFile = async function () {
      if (this.name === "main.py" && !held) {
        held = true;
        fixture.__navigationReadBlocked = true;
        await new Promise<void>((resolve) => {
          fixture.__releaseNavigationRead = resolve;
        });
        const file = await original.call(this);
        fixture.__navigationReadFinished = true;
        return file;
      }
      return original.call(this);
    };
  });
  await page.getByRole("button", { name: "Run", exact: true }).click();
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          (window as typeof window & { __navigationReadBlocked?: boolean })
            .__navigationReadBlocked,
      ),
    )
    .toBe(true);
  await cancelDeparture(page);
  await page.evaluate(() =>
    (
      window as typeof window & { __releaseNavigationRead?: () => void }
    ).__releaseNavigationRead?.(),
  );
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          (window as typeof window & { __navigationReadFinished?: boolean })
            .__navigationReadFinished,
      ),
    )
    .toBe(true);
  // Observe a bounded quiet interval after releasing the controlled read.
  // A stale launch would keep this 60-second program running and collecting data.
  await page.waitForTimeout(750);
  await expect(page.getByTestId("target-status")).toContainText("ready");
  await expect(page.getByTestId("recording-count")).toContainText(
    "Run a program to collect data.",
  );
  await expect(
    page.getByRole("button", { name: "Export run data as CSV", exact: true }),
  ).toBeDisabled();
  await page.getByRole("button", { name: "Run", exact: true }).click();
  await expect.poll(() => sampleCount(page)).toBeGreaterThan(10);
  await page.getByRole("button", { name: "Stop", exact: true }).click();
  await expect(page.getByTestId("run-autosave-status")).toContainText(
    "Saved automatically",
  );
  await stoppedArchive(page);
});

test("workspace departure cancels a Monitor Run waiting on its hidden IDE", async ({
  page,
}) => {
  await openMonitor(page);
  await page.goto("/workspace/?mode=ide");
  const ide = page.frameLocator('iframe[title="UCSBXRP IDE"]');
  const monitor = page.frameLocator('iframe[title="UCSBXRP Monitor"]');
  await expect(ide.getByTestId("project-save-state")).toHaveText("Saved");
  await page.getByRole("button", { name: "Monitor", exact: true }).click();
  await monitor
    .getByRole("button", { name: "Open monitor controls", exact: true })
    .click();
  await expect(
    monitor.getByRole("button", { name: "Run", exact: true }),
  ).toBeEnabled();
  await ide.locator("body").evaluate(() => {
    const fixture = window as typeof window & {
      __departureProviderBlocked?: boolean;
      __departureProviderFinished?: boolean;
      __releaseDepartureProvider?: () => void;
    };
    const original = FileSystemFileHandle.prototype.getFile;
    let held = false;
    FileSystemFileHandle.prototype.getFile = async function () {
      if (this.name === "main.py" && !held) {
        held = true;
        fixture.__departureProviderBlocked = true;
        await new Promise<void>((resolve) => {
          fixture.__releaseDepartureProvider = resolve;
        });
        const file = await original.call(this);
        fixture.__departureProviderFinished = true;
        return file;
      }
      return original.call(this);
    };
  });
  await monitor.getByRole("button", { name: "Run", exact: true }).click();
  await expect
    .poll(() =>
      ide
        .locator("body")
        .evaluate(
          () =>
            (window as typeof window & { __departureProviderBlocked?: boolean })
              .__departureProviderBlocked,
        ),
    )
    .toBe(true);
  await cancelDeparture(page);
  await ide
    .locator("body")
    .evaluate(() =>
      (
        window as typeof window & { __releaseDepartureProvider?: () => void }
      ).__releaseDepartureProvider?.(),
    );
  await expect
    .poll(() =>
      ide.locator("body").evaluate(
        () =>
          (
            window as typeof window & {
              __departureProviderFinished?: boolean;
            }
          ).__departureProviderFinished,
      ),
    )
    .toBe(true);
  await page.waitForTimeout(750);
  await expect(monitor.getByTestId("target-status")).toContainText("ready");
  await expect(monitor.getByTestId("recording-count")).toContainText(
    "Run a program to collect data.",
  );
  await monitor.getByRole("button", { name: "Run", exact: true }).click();
  await expect(monitor.getByTestId("target-status")).toContainText("running");
  await monitor.getByRole("button", { name: "Stop", exact: true }).click();
  await expect(monitor.getByTestId("run-autosave-status")).toContainText(
    "Saved automatically",
  );
  await expect(ide.getByTestId("ide-run-save-state")).toHaveText("Run saved");
  await stoppedArchive(page);
});
