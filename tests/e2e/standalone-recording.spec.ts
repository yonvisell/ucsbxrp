import { expect, test, type Page } from "@playwright/test";
import { expandingSpiralProject, seedWorkingFolder } from "./working-folder";

const workspaceName = "Standalone-recording-work";
const projectName = "Standalone-trial";
const main = `from course_setup import make_robot
from robot_config import ROBOT_CONFIG
from ucsb_xrp import MotionCommand, Pose, live

robot = make_robot(ROBOT_CONFIG)
try:
    state = robot.start(Pose(0.0, 0.0, 0.0))
    for sample_index in range(20):
        state = robot.step(MotionCommand(80.0, 0.0))
        live.plot("distance_to_finish_mm", 100.0 - state.pose.x_mm)
    print("standalone trial completed", state.pose.x_mm)
finally:
    robot.stop()
`;

async function openTrial(page: Page) {
  await seedWorkingFolder(page, {
    folderName: workspaceName,
    projectFolderName: projectName,
    project: {
      ...expandingSpiralProject,
      name: projectName,
      files: { ...expandingSpiralProject.files, "main.py": main },
    },
  });
  await page.goto("/ide/");
  await expect(page.getByTestId("project-save-state")).toHaveText("Saved");
  await expect(
    page.getByRole("button", { name: "Run", exact: true }),
  ).toBeEnabled();
}

async function readArchive(page: Page) {
  return page.evaluate(
    async ({ workspaceName, projectName }) => {
      const workspace = await (
        await navigator.storage.getDirectory()
      ).getDirectoryHandle(workspaceName);
      const project = await workspace.getDirectoryHandle(projectName);
      const directory = await project.getDirectoryHandle("UCSB_XRP_Autosaves");
      const read = async (name: string) =>
        (await (await directory.getFileHandle(name)).getFile()).text();
      return {
        run: JSON.parse(await read("run-1.json")),
        telemetry: await read("telemetry-1.csv"),
        output: await read("run-1.txt"),
        identity: JSON.parse(
          await (
            await (
              await project.getFileHandle(".ucsb-xrp-project.json")
            ).getFile()
          ).text(),
        ).session.projectId,
      };
    },
    { workspaceName, projectName },
  );
}

async function denyArchiveWrites(page: Page) {
  await page.evaluate(() => {
    const original = FileSystemDirectoryHandle.prototype.getFileHandle;
    FileSystemDirectoryHandle.prototype.getFileHandle = async function (
      name,
      options,
    ) {
      if (name === "pending-run.json" && options?.create)
        throw new DOMException("Test disk write denied", "NotAllowedError");
      return original.call(this, name, options);
    };
  });
}

test("standalone IDE natural completion retains exact trial data without a Monitor", async ({
  page,
}) => {
  await openTrial(page);
  await page.getByRole("button", { name: "Run", exact: true }).click();
  await expect(page.getByTestId("ide-run-save-state")).toHaveText("Run saved");
  const archive = await readArchive(page);
  expect(archive.run.project).toMatchObject({
    projectId: archive.identity,
    name: projectName,
    entrypoint: "main.py",
  });
  expect(archive.run.project.revision).toMatch(/^[a-f0-9]{64}$/);
  expect(archive.run.telemetrySamples).toBeGreaterThan(20);
  expect(archive.run.finalState).toBe("ready");
  expect(archive.output).toContain("standalone trial completed");
  expect(archive.telemetry).toContain("program_distance_to_finish_mm");
  expect(page.context().pages()).toHaveLength(1);
  await page.reload();
  await expect(page.getByTestId("project-save-state")).toHaveText("Saved");
  const reopened = await readArchive(page);
  expect(reopened).toEqual(archive);
});

test("failed standalone archive stays protected until the student confirms saving its recovery file", async ({
  page,
}) => {
  await openTrial(page);
  await denyArchiveWrites(page);
  await page.getByRole("button", { name: "Run", exact: true }).click();
  await expect(page.getByTestId("ide-run-save-state")).toHaveText(
    "Run not saved",
  );
  const recoveryNotice = page.locator(
    "section.connection-recovery[role=alert]",
  );
  await expect(recoveryNotice).toContainText("Test disk write denied");
  await expect(
    page.getByRole("button", { name: "Run", exact: true }),
  ).toBeDisabled();
  await page
    .getByRole("button", { name: "Retry run save", exact: true })
    .click();
  await expect(recoveryNotice).toContainText("Test disk write denied");
  const downloaded = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Download unsaved run data", exact: true })
    .click();
  const download = await downloaded;
  const stream = await download.createReadStream();
  if (!stream) throw new Error("The complete run recovery was not downloaded.");
  const chunks: Buffer[] = [];
  for await (const chunk of stream) chunks.push(Buffer.from(chunk));
  const recovery = JSON.parse(Buffer.concat(chunks).toString("utf8"));
  expect(recovery.kind).toBe("ucsb-xrp-run-recovery");
  expect(recovery.runs).toHaveLength(1);
  expect(recovery.runs[0].output).toContain("standalone trial completed");
  expect(recovery.runs[0].telemetry).toContain("program_distance_to_finish_mm");
  expect(
    JSON.parse(recovery.runs[0].metadata).telemetrySamples,
  ).toBeGreaterThan(20);
  await expect(page.getByTestId("ide-run-save-state")).toHaveText(
    "Run not saved",
  );
  await expect(
    page.getByRole("button", { name: "Run", exact: true }),
  ).toBeDisabled();
  await page
    .getByRole("button", { name: "I saved the recovery file", exact: true })
    .click();
  await expect(page.getByTestId("ide-run-save-state")).toHaveText(
    "Recovery file confirmed",
  );
  await expect(
    page.getByRole("button", { name: "Run", exact: true }),
  ).toBeEnabled();
});

test("a browser-canceled recovery download retains the unsaved run and unload protection", async ({
  page,
  context,
}) => {
  await openTrial(page);
  await denyArchiveWrites(page);
  await page.getByRole("button", { name: "Run", exact: true }).click();
  await expect(page.getByTestId("ide-run-save-state")).toHaveText(
    "Run not saved",
  );
  const cdp = await context.newCDPSession(page);
  const { targetInfo } = await cdp.send("Target.getTargetInfo");
  await cdp.send("Browser.setDownloadBehavior", {
    behavior: "deny",
    browserContextId: targetInfo.browserContextId,
    eventsEnabled: true,
  });
  const downloading = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Download unsaved run data", exact: true })
    .click();
  const canceled = await downloading;
  expect(await canceled.failure()).not.toBeNull();
  await expect(page.getByTestId("ide-run-save-state")).toHaveText(
    "Run not saved",
  );
  await expect(
    page.getByRole("button", { name: "Run", exact: true }),
  ).toBeDisabled();
  await expect(
    page.getByRole("button", {
      name: "Download unsaved run data",
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", {
      name: "I saved the recovery file",
      exact: true,
    }),
  ).toBeVisible();
  const protectedFromUnload = await page.evaluate(() => {
    const event = new Event("beforeunload", { cancelable: true });
    window.dispatchEvent(event);
    return event.defaultPrevented;
  });
  expect(protectedFromUnload).toBe(true);
  await expect(
    page.locator("section.connection-recovery[role=alert]"),
  ).toContainText("1 unsaved run");
  await cdp.detach();
});
