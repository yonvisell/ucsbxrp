import { expect, test, type Page } from "@playwright/test";
import { readFile } from "node:fs/promises";
import {
  expandingSpiralProject,
  readWorkspaceExports,
  seedWorkingFolder,
} from "./working-folder";

async function savedRun(page: Page, folderName: string) {
  return page.evaluate(async (folderName) => {
    const root = await navigator.storage.getDirectory();
    const project = await (
      await root.getDirectoryHandle(folderName)
    ).getDirectoryHandle("Expanding-Spiral");
    const autosaves = await project.getDirectoryHandle("UCSB_XRP_Autosaves");
    return JSON.parse(
      await (
        await (await autosaves.getFileHandle("run-1.json")).getFile()
      ).text(),
    );
  }, folderName);
}

async function savedTelemetry(page: Page, folderName: string, generation = 1) {
  return page.evaluate(
    async ({ folderName, generation }) => {
      const root = await navigator.storage.getDirectory();
      const project = await (
        await root.getDirectoryHandle(folderName)
      ).getDirectoryHandle("Expanding-Spiral");
      const autosaves = await project.getDirectoryHandle("UCSB_XRP_Autosaves");
      return (
        await (
          await autosaves.getFileHandle(`telemetry-${generation}.csv`)
        ).getFile()
      ).text();
    },
    { folderName, generation },
  );
}

async function addNote(page: Page, label: string) {
  await page.getByRole("button", { name: "Add note", exact: true }).click();
  const anchor = await page.getByTestId("note-anchor").textContent();
  await page.getByLabel("Note label").fill(label);
  await page.getByRole("button", { name: "Add", exact: true }).click();
  await expect(page.getByRole("list", { name: "Run notes" })).toContainText(
    label,
  );
  return anchor;
}

test("keeps failed note-save recovery actions legible and usable in a compact Monitor", async ({
  page,
  context,
}) => {
  const folderName = "Monitor-Compact-Note-Recovery";
  await seedWorkingFolder(page, { folderName });
  await page.goto("/ide/");
  const monitor = await context.newPage();
  await monitor.setViewportSize({ width: 1000, height: 580 });
  await monitor.goto("/monitor/");
  await monitor.locator(".monitor-run-button").click();
  await expect(monitor.getByTestId("target-status")).toContainText("running");
  await expect(
    monitor.getByRole("button", { name: "Add note", exact: true }),
  ).toBeEnabled();
  await monitor.getByRole("button", { name: "Stop", exact: true }).click();
  await expect(monitor.getByTestId("run-autosave-status")).toContainText(
    "Saved automatically",
  );
  await monitor.evaluate(() => {
    const original = FileSystemDirectoryHandle.prototype.getFileHandle;
    FileSystemDirectoryHandle.prototype.getFileHandle = function (
      name,
      options,
    ) {
      if (name === "pending-run.json" && options?.create)
        return Promise.reject(
          new DOMException(
            "Review fixture: archive destination denied",
            "NotAllowedError",
          ),
        );
      return original.call(this, name, options);
    };
  });
  const label = "Preserve this note after the folder denies its save.";
  await addNote(monitor, label);
  await expect(monitor.getByTestId("run-autosave-status")).toContainText(
    "archive destination denied",
  );
  const controls = monitor.getByTestId("monitor-controls");
  for (const name of ["Download retained notes", "Discard retained notes"]) {
    const action = monitor.getByRole("button", { name, exact: true });
    await action.scrollIntoViewIfNeeded();
    await expect(action).toBeVisible();
    const rail = await controls.boundingBox();
    const box = await action.boundingBox();
    expect(box!.x).toBeGreaterThanOrEqual(rail!.x);
    expect(box!.x + box!.width).toBeLessThanOrEqual(rail!.x + rail!.width);
    expect(
      await action.evaluate(
        (element) => element.scrollWidth <= element.clientWidth,
      ),
    ).toBe(true);
  }
  const recovery = monitor.getByRole("button", {
    name: "Download retained notes",
    exact: true,
  });
  const [download] = await Promise.all([
    monitor.waitForEvent("download"),
    recovery.click(),
  ]);
  const contents = JSON.parse(await readFile((await download.path())!, "utf8"));
  expect(
    contents.annotations.some(
      (note: { label: string }) => note.label === label,
    ),
  ).toBe(true);
  await expect(monitor.getByRole("list", { name: "Run notes" })).toContainText(
    label,
  );
});

test("merges notes added by two Monitors during one active run into its archive and late replay", async ({
  page,
  context,
}) => {
  const folderName = "Monitor-Concurrent-Active-Notes";
  await seedWorkingFolder(page, { folderName });
  await page.goto("/ide/");
  const first = await context.newPage();
  const second = await context.newPage();
  await first.goto("/monitor/");
  await second.goto("/monitor/");
  await expect(first.locator(".monitor-run-button")).toBeEnabled();
  await first.locator(".monitor-run-button").click();
  for (const monitor of [first, second]) {
    await expect(monitor.getByTestId("target-status")).toContainText("running");
    await expect(
      monitor.getByRole("button", { name: "Add note", exact: true }),
    ).toBeEnabled();
  }
  const labels = [
    "First observer: left wheel began accelerating.",
    "Second observer: the path curved near this point.",
  ];
  // Both windows hold their own note before either can archive the run.
  const anchors = await Promise.all([
    addNote(first, labels[0]!),
    addNote(second, labels[1]!),
  ]);
  for (const monitor of [first, second])
    await expect(monitor.getByTestId("target-status")).toContainText("running");
  await first.getByRole("button", { name: "Stop", exact: true }).click();
  for (const monitor of [first, second]) {
    await expect(monitor.getByTestId("target-status")).toContainText("ready");
    await expect(monitor.getByTestId("run-autosave-status")).toContainText(
      "Saved automatically",
    );
  }
  await expect
    .poll(async () => {
      const run = await savedRun(first, folderName).catch(() => null);
      return run?.annotations
        .map((note: { label: string }) => note.label)
        .sort();
    })
    .toEqual([...labels].sort());
  const archived = await savedRun(first, folderName);
  const csv = await savedTelemetry(first, folderName);
  expect(archived.telemetrySamples).toBeGreaterThan(0);
  expect(
    new Set(archived.annotations.map((note: { id: string }) => note.id)).size,
  ).toBe(2);
  for (const label of labels) expect(csv).toContain(label);

  const late = await context.newPage();
  await late.goto("/monitor/");
  const notes = late.getByRole("list", { name: "Run notes" });
  await expect(notes.getByRole("button")).toHaveCount(2);
  for (const label of labels) await expect(notes).toContainText(label);
  await late.getByRole("button", { name: "Export run data as CSV" }).click();
  await expect
    .poll(async () => {
      const files = await readWorkspaceExports(late, { folderName });
      return files.find((file) => file.name.endsWith(".csv"))?.text ?? "";
    })
    .toContain(labels[0]!);
  const exported = (await readWorkspaceExports(late, { folderName })).find(
    (file) => file.name.endsWith(".csv"),
  )!.text!;
  for (const label of labels) expect(exported).toContain(label);
  expect((await savedRun(late, folderName)).annotations).toEqual(
    archived.annotations,
  );
  await test.info().attach("concurrent-monitor-note-identities", {
    body: JSON.stringify(
      { runId: archived.runId, anchors, annotations: archived.annotations },
      null,
      2,
    ),
    contentType: "application/json",
  });
});

test("stops a virtual allocation-heavy run at its memory limit and preserves notes and data for a normal restart", async ({
  page: ide,
  context,
}) => {
  test.setTimeout(90_000);
  const folderName = "Monitor-Virtual-Memory-Limit";
  const source = `from time import sleep_ms
from ucsb_xrp import DriveCommand, RobotConfig, XRPBot, live

grow = live.toggle("grow", False, label="Start allocation loop")
robot = XRPBot(RobotConfig())
try:
    raw = robot.read(include_range=True, include_reflectance=True)
    print("RAW_READY", raw.time_ms, raw.left_encoder_count, raw.right_encoder_count)
    robot.set_drive(DriveCommand(0.25, 0.25))
    while not grow.value:
        live.apply_updates()
        robot.read()
        sleep_ms(20)
    print("ALLOCATION_LOOP_STARTED")
    while True:
        transient_values = list(range(2000))
        sleep_ms(0)
finally:
    robot.stop()
`;
  await seedWorkingFolder(ide, {
    folderName,
    project: {
      ...expandingSpiralProject,
      files: { ...expandingSpiralProject.files, "main.py": source },
    },
  });
  await ide.goto("/ide/");
  await ide.getByRole("button", { name: "Expand output", exact: true }).click();
  const monitor = await context.newPage();
  await monitor.goto("/monitor/");
  await expect(monitor.locator(".monitor-run-button")).toBeEnabled();
  await monitor.locator(".monitor-run-button").click();
  await expect(monitor.getByTestId("target-status")).toContainText("running");
  await expect(ide.getByRole("log")).toContainText("RAW_READY");
  await expect(monitor.getByTestId("motor-effort")).toHaveText("0.25 / 0.25");
  const label = "Recorded before allocating repeated temporary lists.";
  const anchor = await addNote(monitor, label);
  const allocationStartedAt = Date.now();
  await monitor
    .getByRole("checkbox", { name: "Start allocation loop", exact: true })
    .check();
  await expect(ide.getByRole("log")).toContainText("ALLOCATION_LOOP_STARTED");
  await expect(
    monitor.locator(".header-statuses .operation-status"),
  ).toContainText("memory limit", { timeout: 45_000 });
  const elapsedToLimitMs = Date.now() - allocationStartedAt;
  await expect(monitor.getByTestId("target-status")).toContainText("error");
  await expect(ide.getByRole("log")).toContainText(
    /Virtual run stopped at \d+ MiB/,
  );
  await expect(ide.getByRole("log")).toContainText(
    "Collected telemetry and notes remain available",
  );
  await expect(monitor.getByTestId("motor-effort")).toHaveText("0.00 / 0.00");
  await expect(monitor.getByRole("list", { name: "Run notes" })).toContainText(
    label,
  );
  await expect(monitor.getByTestId("run-autosave-status")).toContainText(
    "Saved automatically",
  );
  const archived = await savedRun(monitor, folderName);
  expect(archived.finalState).toBe("error");
  expect(archived.finalDetail).toContain("memory limit");
  expect(archived.annotations).toHaveLength(1);
  expect(archived.annotations[0].label).toBe(label);
  expect(archived.telemetrySamples).toBeGreaterThan(3);
  const csv = await savedTelemetry(monitor, folderName);
  expect(csv).toContain(label);
  const [header, ...rows] = csv
    .trimEnd()
    .split("\n")
    .map((line) => line.split(","));
  const column = (name: string) => {
    const index = header!.indexOf(name);
    expect(index, `CSV column ${name}`).toBeGreaterThanOrEqual(0);
    return index;
  };
  const acquired = column("acquired_at_s");
  expect(rows.some((row) => row[acquired] !== "")).toBe(true);
  const left = column("left_drive_command");
  const right = column("right_drive_command");
  expect(
    rows.some(
      (row) => Number(row[left]) === 0.25 && Number(row[right]) === 0.25,
    ),
  ).toBe(true);
  expect(Number(rows.at(-1)![left])).toBe(0);
  expect(Number(rows.at(-1)![right])).toBe(0);
  expect(rows.at(-1)![column("observation_kind")]).toBe("stop");
  expect(rows).toHaveLength(archived.telemetrySamples);
  await monitor.getByRole("button", { name: "Export run data as CSV" }).click();
  await expect
    .poll(async () => {
      const files = await readWorkspaceExports(monitor, { folderName });
      return files.find((file) => file.name.endsWith(".csv"))?.text ?? "";
    })
    .toBe(csv);

  const editor = ide.getByRole("textbox", { name: "main.py editor" });
  const restartAddition = "\n# Restart after saving the memory-limited run.\n";
  await editor.focus();
  // A comment delimited on both sides is valid at the initial file boundary;
  // named End shortcuts do not place Monaco's cursor consistently on macOS.
  await ide.keyboard.insertText(restartAddition);
  await expect(ide.getByTestId("project-save-state")).toHaveText("Saved");
  let restartSource = "";
  await expect
    .poll(async () => {
      restartSource = await ide.evaluate(async (folderName) => {
        const workspace = await (
          await navigator.storage.getDirectory()
        ).getDirectoryHandle(folderName);
        const project = await workspace.getDirectoryHandle("Expanding-Spiral");
        return (
          await (await project.getFileHandle("main.py")).getFile()
        ).text();
      }, folderName);
      return restartSource.includes(restartAddition);
    })
    .toBe(true);
  expect(restartSource.replace(restartAddition, "")).toBe(source);
  await monitor.locator(".monitor-run-button").click();
  await expect(
    monitor.getByRole("checkbox", {
      name: "Start allocation loop",
      exact: true,
    }),
  ).not.toBeChecked();
  await expect
    .poll(async () => ({
      effort: await monitor.getByTestId("motor-effort").textContent(),
      status: await monitor.getByTestId("target-status").textContent(),
      output: await ide.getByRole("log").textContent(),
    }))
    .toEqual(
      expect.objectContaining({
        effort: "0.25 / 0.25",
        status: expect.stringContaining("running"),
      }),
    );
  await monitor.getByRole("button", { name: "Stop", exact: true }).click();
  await expect(monitor.getByTestId("target-status")).toContainText("ready");
  await expect(monitor.getByTestId("run-autosave-status")).toContainText(
    "Saved automatically",
  );
  await expect
    .poll(async () => (await savedRun(monitor, folderName)).runId)
    .not.toBe(archived.runId);
  expect(await savedTelemetry(monitor, folderName, 2)).toBe(csv);
  await test.info().attach("virtual-memory-limit-workflow", {
    body: JSON.stringify(
      {
        workload: "repeated transient list(range(2000)) and sleep_ms(0)",
        restart:
          "fresh worker; allocation toggle remains off; normal raw-sensor loop",
        restartSourcePreservedExceptComment:
          restartSource.replace(restartAddition, "") === source,
        elapsedToLimitMs,
        runId: archived.runId,
        finalState: archived.finalState,
        finalDetail: archived.finalDetail,
        telemetrySamples: archived.telemetrySamples,
        droppedTelemetrySamples: archived.droppedTelemetrySamples,
        anchor,
        annotation: archived.annotations[0],
        restartRunId: (await savedRun(monitor, folderName)).runId,
      },
      null,
      2,
    ),
    contentType: "application/json",
  });
});

test("inspects exact observations, edits notes, and restores them in a late Monitor", async ({
  page,
  context,
}) => {
  const folderName = "Monitor-Notes-Revision";
  await seedWorkingFolder(page, { folderName });
  await page.goto("/ide/");
  const monitor = await context.newPage();
  await monitor.goto("/monitor/");
  await expect(monitor.locator(".monitor-run-button")).toBeEnabled();
  await monitor.locator(".monitor-run-button").click();
  await expect(monitor.getByTestId("target-status")).toContainText("running");
  const plot = monitor.getByTestId("wheel-speed-plot");
  await expect
    .poll(async () =>
      Number(await plot.locator("..").getAttribute("data-sample-count")),
    )
    .toBeGreaterThan(100);
  const chart = await plot.boundingBox();
  await monitor.mouse.move(
    chart!.x + chart!.width - 24,
    chart!.y + chart!.height / 2,
  );
  await expect(monitor.locator(".signal-inspection")).toBeVisible();
  await expect(monitor.locator(".signal-inspection-row")).toHaveCount(2);
  const selectedObservation = await monitor
    .locator(".signal-inspection")
    .textContent();
  const countAtInspection = Number(
    await plot.locator("..").getAttribute("data-sample-count"),
  );
  await expect
    .poll(async () =>
      Number(await plot.locator("..").getAttribute("data-sample-count")),
    )
    .toBeGreaterThan(countAtInspection + 100);
  await expect(monitor.locator(".signal-inspection")).toBeVisible();
  await expect(monitor.locator(".signal-inspection")).toHaveText(
    selectedObservation!,
  );
  await plot.locator("..").focus();
  await monitor.keyboard.press("ArrowLeft");
  await monitor.keyboard.press("Enter");
  const anchor = await monitor.getByTestId("note-anchor").textContent();
  await monitor
    .getByLabel("Note label")
    .fill(
      "A full note about this wheel-speed change, kept while incoming data advances.",
    );
  await expect(monitor.getByTestId("note-anchor")).toHaveText(anchor!);
  await monitor
    .getByRole("dialog")
    .getByRole("button", { name: "Stop", exact: true })
    .click();
  await expect(monitor.getByTestId("target-status")).toContainText("ready");
  await expect(monitor.getByLabel("Note label")).toHaveValue(
    "A full note about this wheel-speed change, kept while incoming data advances.",
  );
  await expect(monitor.getByTestId("note-anchor")).toHaveText(anchor!);
  await monitor.getByRole("button", { name: "Add", exact: true }).click();
  await expect(
    monitor.getByRole("button", { name: /^Review note 1:/ }),
  ).toBeVisible();
  await expect(monitor.getByTestId("world-view")).toHaveAttribute(
    "data-visible-note-labels",
    "1",
  );
  await expect
    .poll(
      async () =>
        (await savedRun(monitor, folderName).catch(() => null))?.annotations
          .length ?? 0,
    )
    .toBe(1);
  const original = await savedRun(monitor, folderName);
  const first = original.annotations[0];
  await monitor.getByRole("button", { name: /^Review note 1:/ }).click();
  await monitor
    .getByLabel("Note label")
    .fill("Corrected note\nwith a second line");
  await monitor.getByRole("button", { name: "Save note", exact: true }).click();
  await expect
    .poll(
      async () => (await savedRun(monitor, folderName)).annotations[0].label,
    )
    .toBe("Corrected note\nwith a second line");
  const updated = (await savedRun(monitor, folderName)).annotations[0];
  expect(updated.id).toBe(first.id);
  expect(updated.observationSeq).toBe(first.observationSeq);
  expect(updated.tMs).toBe(first.tMs);
  const late = await context.newPage();
  await late.goto("/monitor/");
  await expect(
    late.getByRole("button", { name: /^Review note 1: Corrected note/ }),
  ).toBeVisible();
  await late.getByRole("button", { name: "Export run data as CSV" }).click();
  // Inspect the file after the same completion message a student relies on.
  await expect(late.locator(".export-detail")).toHaveText(
    /^Saved \.\/Expanding-Spiral\/exports\/xrp-telemetry-.*\.csv$/,
  );
  await expect
    .poll(
      async () =>
        (await readWorkspaceExports(late, { folderName })).filter((file) =>
          file.name.endsWith(".csv"),
        ).length,
    )
    .toBeGreaterThan(0);
  expect(
    (await readWorkspaceExports(late, { folderName })).find((file) =>
      file.name.endsWith(".csv"),
    )?.text,
  ).toContain('"Corrected note\nwith a second line"');
  await late.getByRole("button", { name: "Reset", exact: true }).click();
  await expect(
    late.getByRole("button", { name: /^Review note 1: Corrected note/ }),
  ).toBeVisible();
  await expect(late.getByTestId("world-view")).toHaveAttribute(
    "data-visible-note-labels",
    "",
  );
});

test("waits for an active note commit before restoring its exact note in a late Monitor", async ({
  page,
  context,
}) => {
  const folderName = "Monitor-Note-Commit-Read";
  await seedWorkingFolder(page, { folderName });
  await page.goto("/ide/");
  const monitor = await context.newPage();
  await monitor.goto("/monitor/");
  await expect(monitor.locator(".monitor-run-button")).toBeEnabled();
  await monitor.locator(".monitor-run-button").click();
  await expect(monitor.getByTestId("target-status")).toContainText("running");
  await expect(
    monitor.getByRole("button", { name: "Add note", exact: true }),
  ).toBeEnabled();
  const anchor = await addNote(monitor, "Original note before commit");
  await monitor.getByRole("button", { name: "Stop", exact: true }).click();
  await expect(monitor.getByTestId("run-autosave-status")).toContainText(
    "Saved automatically",
  );
  const original = (await savedRun(monitor, folderName)).annotations[0];
  await monitor.evaluate(() => {
    const originalRemove = FileSystemDirectoryHandle.prototype.removeEntry;
    const state = { waiting: false, release: () => {} };
    (
      window as typeof window & { __monitorNoteCommit: typeof state }
    ).__monitorNoteCommit = state;
    FileSystemDirectoryHandle.prototype.removeEntry = async function (
      name,
      options,
    ) {
      if (name === "pending-run.json") {
        state.waiting = true;
        await new Promise<void>((resolve) => {
          state.release = resolve;
        });
      }
      return originalRemove.call(this, name, options);
    };
  });
  await monitor.getByRole("button", { name: /^Review note 1:/ }).click();
  await monitor
    .getByLabel("Note label")
    .fill("Committed note\nwith original observation");
  await monitor.getByRole("button", { name: "Save note", exact: true }).click();
  await expect
    .poll(() =>
      monitor.evaluate(
        () =>
          (
            window as typeof window & {
              __monitorNoteCommit: { waiting: boolean };
            }
          ).__monitorNoteCommit.waiting,
      ),
    )
    .toBe(true);
  // The metadata is visible before the transaction commits. Opening the late
  // Monitor at this boundary must wait, not classify the active write as damage.
  const pending = await savedRun(monitor, folderName);
  expect(pending.annotations[0].label).toBe(
    "Committed note\nwith original observation",
  );
  const late = await context.newPage();
  await late.goto("/monitor/");
  await expect(late.getByTestId("run-autosave-status")).toContainText(
    "finish saving before reading this run",
  );
  await expect(
    late.getByRole("button", { name: /^Review note 1:/ }),
  ).toHaveCount(0);
  await expect(late.locator(".monitor-run-button")).toBeDisabled();
  await expect(late.locator(".monitor-notices")).not.toContainText(
    "needs recovery",
  );
  await monitor.evaluate(() =>
    (
      window as typeof window & { __monitorNoteCommit: { release(): void } }
    ).__monitorNoteCommit.release(),
  );
  await expect(monitor.getByTestId("run-autosave-status")).toContainText(
    "Saved notes",
  );
  const note = late.getByRole("button", {
    name: /^Review note 1: Committed note/,
  });
  await expect(note).toBeVisible();
  await expect(late.locator(".monitor-run-button")).toBeEnabled();
  await expect(late.getByTestId("run-autosave-status")).toContainText(
    "Showing the most recent XRP run saved in Expanding-Spiral",
  );
  await note.click();
  await expect(late.getByTestId("note-anchor")).toHaveText(anchor!);
  await expect(late.getByLabel("Note label")).toHaveValue(
    "Committed note\nwith original observation",
  );
  const committed = (await savedRun(monitor, folderName)).annotations[0];
  expect(committed.id).toBe(original.id);
  expect(committed.observationSeq).toBe(original.observationSeq);
  expect(committed.tMs).toBe(original.tMs);
  await test.info().attach("late-note-commit-identity", {
    body: JSON.stringify(
      { runId: pending.runId, original, committed, anchor },
      null,
      2,
    ),
    contentType: "application/json",
  });
});

test("keeps sixteen live controls and telemetry reachable in a short viewport", async ({
  page,
  context,
}) => {
  const folderName = "Monitor-Maximum-Controls";
  const source = `from course_setup import make_robot
from robot_config import ROBOT_CONFIG
from ucsb_xrp import live, Pose, STOP_COMMAND
parameters = [live.number("control_%d" % index, 10, 0, 100, 1, label="Test control %d" % index) for index in range(16)]
robot = make_robot(ROBOT_CONFIG)
try:
    robot.start(Pose(0, 0, 0))
    while True:
        robot.step(STOP_COMMAND)
finally:
    robot.stop()
`;
  await seedWorkingFolder(page, {
    folderName,
    project: {
      ...expandingSpiralProject,
      files: { ...expandingSpiralProject.files, "main.py": source },
    },
  });
  await page.goto("/ide/");
  const monitor = await context.newPage();
  await monitor.setViewportSize({ width: 1000, height: 580 });
  await monitor.goto("/monitor/");
  await expect(monitor.locator(".monitor-run-button")).toBeEnabled();
  await monitor.locator(".monitor-run-button").click();
  await expect(
    monitor.locator(".runtime-parameters [data-runtime-parameter]"),
  ).toHaveCount(16);
  const headings = await monitor
    .getByRole("heading", { name: /^Live (controls|telemetry)$/ })
    .evaluateAll((elements) =>
      elements.map((element) => {
        const style = getComputedStyle(element);
        return [
          style.fontFamily,
          style.fontSize,
          style.fontWeight,
          style.color,
        ];
      }),
    );
  expect(headings[0]).toEqual(headings[1]);
  const geometry = await monitor.evaluate(() => {
    const controls = document.querySelector<HTMLElement>(
      ".live-program-content",
    )!;
    const telemetry = document.querySelector<HTMLElement>(".values-content")!;
    return {
      controlsHeight: controls.clientHeight,
      controlsContent: controls.scrollHeight,
      telemetryHeight: telemetry.clientHeight,
    };
  });
  expect(geometry.controlsHeight).toBeGreaterThan(25);
  expect(geometry.controlsContent).toBeGreaterThan(geometry.controlsHeight);
  expect(geometry.telemetryHeight).toBeGreaterThan(45);
  const last = monitor.getByRole("slider", {
    name: "Test control 15",
    exact: true,
  });
  await last.scrollIntoViewIfNeeded();
  await last.fill("12");
  await expect(
    monitor.locator('[data-runtime-parameter="control_15"]'),
  ).toHaveAttribute("data-runtime-value", "12");
  await expect(
    monitor.locator('[data-runtime-parameter="control_15"]'),
  ).toHaveAttribute("data-pending", "false");
  await expect(monitor.getByTestId("world-view")).toHaveAttribute(
    "data-y-axis-ticks",
    /(?:^|,)0(?:,|$)/,
  );
  await expect(
    monitor.getByRole("button", { name: "Fit arena", exact: true }),
  ).toBeVisible();
  await expect(
    monitor.getByRole("button", { name: "Center XRP", exact: true }),
  ).toHaveText("Center XRP");
  await monitor.getByRole("button", { name: "Stop", exact: true }).click();
});
