import { expect, test, type Page } from "@playwright/test";
import { seedWorkingFolder } from "./working-folder";
import { csvRows } from "../../apps/dashboard/src/csv-records";

test("a cold Monitor exposes the remembered Project's saved trials before Run", async ({
  page,
}) => {
  const folderName = "Saved-Run-Cold-Monitor";
  await seedWorkingFolder(page, { folderName });
  // Model an existing Project before the student uses IDE or Run. Its durable
  // identity belongs to the folder, not the workspace's embedded target.
  await page.evaluate(async (name) => {
    const workspace = await (
      await navigator.storage.getDirectory()
    ).getDirectoryHandle(name);
    const project = await workspace.getDirectoryHandle("Expanding-Spiral");
    const file = await project.getFileHandle(".ucsb-xrp-project.json");
    const metadata = JSON.parse(await (await file.getFile()).text());
    metadata.session = {
      projectId: crypto.randomUUID(),
      revision: 1,
      savedRevision: 1,
      updatedAt: Date.now(),
    };
    const writer = await file.createWritable();
    await writer.write(JSON.stringify(metadata));
    await writer.close();
  }, folderName);
  await page.goto("/workspace/?mode=monitor");
  const monitor = page.frameLocator('iframe[title="UCSBXRP Monitor"]');
  await expect(monitor.getByTestId("run-autosave-status")).toContainText(
    "Runs save automatically to Expanding-Spiral.",
  );
  const open = monitor.getByRole("button", {
    name: "Open saved run…",
    exact: true,
  });
  await expect(open).toBeEnabled();
  await open.click();
  await expect(
    monitor.getByText("No completed runs have been saved in this Project yet."),
  ).toBeVisible();
  await expect(monitor.getByTestId("recording-count")).toHaveText(
    "Run a program to collect data.",
  );
});

async function archive(page: Page, name: string) {
  return page.evaluate(async (name) => {
    const root = await navigator.storage.getDirectory();
    const folder = await (
      await root.getDirectoryHandle(name)
    ).getDirectoryHandle("Expanding-Spiral");
    const saved = await folder.getDirectoryHandle("UCSB_XRP_Autosaves");
    const text = async (path: string) =>
      (await (await saved.getFileHandle(path)).getFile()).text();
    return {
      metadata: JSON.parse(await text("run-1.json")),
      csv: await text("telemetry-1.csv"),
    };
  }, name);
}

test("standalone IDE saves a trial that Monitor can reopen and annotate after navigation", async ({
  page,
}) => {
  const folderName = "Saved-Run-Reopen";
  await seedWorkingFolder(page, { folderName });
  await page.goto("/ide/");
  await expect(page.getByTestId("target-status")).toContainText("ready");
  await page.getByRole("button", { name: "Run", exact: true }).click();
  await expect(page.getByTestId("target-status")).toContainText("running");
  // A student watches the project begin, then stops it before opening Monitor.
  await page.getByRole("tab", { name: /^System log/ }).click();
  await page.getByRole("button", { name: "Stop", exact: true }).click();
  await expect(page.getByTestId("target-status")).toContainText("ready");
  await expect(page.getByTestId("ide-run-save-state")).toHaveText("Run saved");
  await expect
    .poll(
      async () =>
        (await archive(page, folderName).catch(() => null))?.metadata
          .telemetrySamples ?? 0,
    )
    .toBeGreaterThan(0);
  const before = await archive(page, folderName);
  await page.goto("/");
  await page.goto("/monitor/");
  await expect(
    page.getByRole("button", { name: "Open saved run…", exact: true }),
  ).toBeEnabled();
  await page
    .getByRole("button", { name: "Open saved run…", exact: true })
    .click();
  await expect(page.getByLabel("Saved trial")).toHaveValue(
    before.metadata.runId,
  );
  await page.getByRole("button", { name: "Open trial", exact: true }).click();
  await expect(page.locator(".saved-run-banner")).toContainText("Saved trial");
  await expect(page.getByTestId("recording-count")).toContainText(
    `${before.metadata.telemetrySamples.toLocaleString()} samples`,
  );
  await expect(page.getByTestId("motor-effort")).toHaveText("0.00 / 0.00");
  await expect(page.getByTestId("world-view")).toBeVisible();
  await page.getByRole("button", { name: "Add note", exact: true }).click();
  await page
    .getByLabel("Note label")
    .fill('Reopened trial: "compare" wheel speeds, then plan the next run.');
  await page.getByRole("button", { name: "Add", exact: true }).click();
  await expect(page.getByTestId("run-autosave-status")).toContainText(
    "Saved notes",
  );
  const after = await archive(page, folderName);
  expect(after.metadata.runId).toBe(before.metadata.runId);
  expect(after.metadata.annotations).toHaveLength(1);
  expect(after.metadata.telemetrySamples).toBe(
    before.metadata.telemetrySamples,
  );
  // Annotation changes only the final CSV field; numerical bytes remain intact.
  expect(csvRows(after.csv).map((row) => row.cells.slice(0, -1))).toEqual(
    csvRows(before.csv).map((row) => row.cells.slice(0, -1)),
  );
  const world = page.getByTestId("world-view");
  await expect(world).toHaveAttribute("data-visible-note-labels", "1");
  const savedWorld = await world.locator("canvas").screenshot();
  // Header Reset acts on the current XRP. The opened trial remains the same
  // recorded world, path and notes while its independent live pane resets.
  await page.getByRole("button", { name: "Reset", exact: true }).click();
  await expect(page.getByTestId("target-status")).toContainText("ready");
  await expect(page.getByTestId("x-mm")).toHaveText("0.0 mm");
  await expect(page.locator(".saved-run-banner")).toContainText("Saved trial");
  await expect(world).toHaveAttribute("data-visible-note-labels", "1");
  await expect(page.getByTestId("recording-count")).toContainText(
    `${before.metadata.telemetrySamples.toLocaleString()} samples`,
  );
  expect(await world.locator("canvas").screenshot()).toEqual(savedWorld);
  expect(await archive(page, folderName)).toEqual(after);
  await page
    .getByRole("button", { name: "Return to current XRP", exact: true })
    .click();
  await expect(page.locator(".saved-run-banner")).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Run", exact: true }),
  ).toBeEnabled();
});
