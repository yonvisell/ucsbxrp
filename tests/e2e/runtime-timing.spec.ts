import { expect, test, type Page } from "@playwright/test";
import { readdirSync, writeFileSync } from "node:fs";
import { readWorkspaceExports, seedWorkingFolder } from "./working-folder";

async function runExactRuntime(page: Page, program: string) {
  const asset = readdirSync(
    new URL("../../dist/assets/", import.meta.url),
  ).find((name) => /^micropython\.worker-.*\.js$/.test(name));
  if (!asset) throw new Error("Build the production MicroPython worker first");
  return page.evaluate(
    ({ asset, program }) =>
      new Promise<{
        lines: string[];
        tMs: number;
        leftEncoderCount: number;
        pose: { xMm: number; yMm: number; headingRad: number };
        startupMs: number;
        wallMs: number;
        sampleCount: number;
        outputLines: number;
        omittedLines: number;
      }>((resolve, reject) => {
        const worker = new Worker(
          new URL(`/assets/${asset}`, location.origin),
          { type: "module" },
        );
        const lines: string[] = [];
        const started = performance.now();
        let startupMs = 0;
        let sampleCount = 0;
        let outputLines = 0;
        let omittedLines = 0;
        let state = {
          tMs: 0,
          leftEncoderCount: 0,
          pose: { xMm: 0, yMm: 0, headingRad: 0 },
        };
        const timeout = setTimeout(() => {
          worker.terminate();
          reject(new Error("Runtime probe did not complete"));
        }, 20_000);
        const finish = () => {
          clearTimeout(timeout);
          worker.terminate();
        };
        worker.onmessage = ({ data }) => {
          if (data.type === "runtime-ready")
            startupMs = performance.now() - started;
          if (data.type === "simulator-state") {
            state = data.state;
            sampleCount += 1;
          }
          if (data.type === "console") {
            lines.push(data.line);
            outputLines += 1;
          }
          if (data.type === "console-batch") {
            lines.push(
              ...data.lines.map((line: { line: string }) => line.line),
            );
            outputLines += data.lines.length;
            omittedLines += data.omitted;
          }
          if (data.type === "run-complete") {
            finish();
            resolve({
              ...state,
              lines,
              startupMs,
              wallMs: performance.now() - started,
              sampleCount,
              outputLines,
              omittedLines,
            });
          }
          if (data.type === "error") {
            finish();
            reject(new Error(data.detail));
          }
        };
        worker.onerror = (error) => {
          finish();
          reject(new Error(error.message));
        };
        worker.postMessage({
          mode: "run",
          project: { entrypoint: "main.py", files: { "main.py": program } },
        });
      }),
    { asset, program },
  );
}

test("the exact browser runtime preserves elapsed physics across long sleep, short sleeps, and computation", async ({
  page,
}) => {
  test.setTimeout(60_000);
  await page.goto("/");
  const header = `from time import sleep_ms, ticks_ms, ticks_diff\nfrom XRPLib.encoded_motor import EncodedMotor\nleft = EncodedMotor.get_default_encoded_motor(1)\nright = EncodedMotor.get_default_encoded_motor(2)\nleft.set_effort(0.30)\nright.set_effort(0.30)\nstart = ticks_ms()\n`;
  const footer = `\nprint("CLOCK_RESULT", ticks_diff(ticks_ms(), start), left.get_position_counts())\nleft.set_effort(0)\nright.set_effort(0)\n`;
  const variants = [
    "sleep_ms(6200)",
    "for i in range(62):\n    sleep_ms(100)",
    // Batch small-integer computation between clock reads. Polling the JS clock
    // bridge on every iteration measures allocation pressure instead of timing.
    "sleep_ms(20)\naccumulator = 0\nwhile ticks_diff(ticks_ms(), start) < 6200:\n    for value in range(10000):\n        accumulator = (accumulator + value) & 1023",
  ];
  const samples = [];
  for (const variant of variants)
    samples.push(await runExactRuntime(page, header + variant + footer));
  const measurement = test.info().outputPath("runtime-clock-measurements.json");
  writeFileSync(
    measurement,
    JSON.stringify(
      {
        clock: "monotonic elapsed program time, fixed 20 ms physics",
        variants,
        samples,
      },
      null,
      2,
    ),
  );
  await test.info().attach("runtime-clock-measurements", {
    path: measurement,
    contentType: "application/json",
  });
  const counts = samples.map((sample) => {
    const result = sample.lines.find((line) => line.startsWith("CLOCK_RESULT"));
    expect(result).toBeDefined();
    const [, milliseconds, count] = result!.split(/\s+/).map(Number);
    expect(milliseconds).toBeGreaterThanOrEqual(6200);
    expect(milliseconds).toBeLessThan(6600);
    expect(sample.tMs).toBeGreaterThanOrEqual(6200);
    expect(count).toBeGreaterThan(10);
    return count!;
  });
  expect(Math.max(...counts) / Math.min(...counts)).toBeLessThan(1.07);
  const reference = samples[0]!.pose;
  for (const sample of samples.slice(1)) {
    expect(
      Math.hypot(
        sample.pose.xMm - reference.xMm,
        sample.pose.yMm - reference.yMm,
      ),
    ).toBeLessThan(20);
    expect(
      Math.abs(sample.pose.headingRad - reference.headingRad),
    ).toBeLessThan(0.05);
  }
});

test("sustained output remains interruptible and a late Monitor retains the completed run", async ({
  page: ide,
  context,
}) => {
  test.setTimeout(35_000);
  await seedWorkingFolder(ide, {
    folderName: "Output-Pressure",
    projectFolderName: "Output-Pressure",
    project: {
      name: "Output pressure",
      entrypoint: "main.py",
      files: {
        "main.py": `from time import sleep_ms\nfrom ucsb_xrp import DriveCommand, RobotConfig, XRPBot\nrobot = XRPBot(RobotConfig())\nrobot.set_drive(DriveCommand(0.30, 0.30))\nwhile True:\n    for i in range(3000):\n        print(i)\n    sleep_ms(20)\n`,
      },
    },
  });
  await ide.goto("/ide/");
  const launchRequestedAt = Date.now();
  await ide
    .locator(".app-header")
    .getByRole("button", { name: "Run", exact: true })
    .click();
  await expect(ide.getByTestId("target-status")).toContainText(
    "Virtual XRP · running",
  );
  const startupToRunningMs = Date.now() - launchRequestedAt;
  await expect(ide.getByRole("log")).toContainText(
    /output.*omitted|omitted.*output/i,
  );
  const start = Date.now();
  await ide
    .locator(".app-header")
    .getByRole("button", { name: "Stop", exact: true })
    .click();
  await expect(ide.getByTestId("target-status")).toContainText(
    "Virtual XRP · ready",
  );
  const stopLatencyMs = Date.now() - start;
  expect(stopLatencyMs).toBeLessThan(2500);
  const monitor = await context.newPage();
  // A late Monitor may need a chosen export destination before resolving its
  // retained Project capability. Exercise the normal file-save path in OPFS.
  await monitor.addInitScript(() => {
    Object.defineProperty(window, "showSaveFilePicker", {
      configurable: true,
      value: async ({ suggestedName }: { suggestedName: string }) => {
        const root = await navigator.storage.getDirectory();
        const workspace = await root.getDirectoryHandle("Output-Pressure");
        const project = await workspace.getDirectoryHandle("Output-Pressure");
        const exports = await project.getDirectoryHandle("exports", {
          create: true,
        });
        return exports.getFileHandle(suggestedName, { create: true });
      },
    });
  });
  await monitor.goto("/monitor/");
  await expect(monitor.getByTestId("recording-count")).toContainText(
    "Output pressure ·",
  );
  await expect(
    monitor.getByRole("button", { name: "Export run data as CSV" }),
  ).toBeEnabled();
  await monitor.getByRole("button", { name: "Export run data as CSV" }).click();
  await expect(
    monitor.getByText(/Saved .*xrp-telemetry-.*\.csv$/),
  ).toBeVisible();
  const exported = (
    await readWorkspaceExports(monitor, {
      folderName: "Output-Pressure",
      projectFolderName: "Output-Pressure",
    })
  ).find((file) => /^xrp-telemetry-.*\.csv$/.test(file.name));
  expect(exported?.text).toBeTruthy();
  const csv = exported!.text!.trimEnd().split("\n");
  const header = csv[0]!.split(",");
  const rows = csv.slice(1).map((row) => row.split(","));
  const column = (name: string) => {
    const index = header.indexOf(name);
    expect(index).toBeGreaterThanOrEqual(0);
    return index;
  };
  const observationColumn = column("observation_seq");
  const physicsColumn = column("physics_step_seq");
  const kindColumn = column("observation_kind");
  const observations = rows.map((row) => Number(row[observationColumn]));
  expect(new Set(observations).size).toBe(rows.length);
  expect(
    observations.every(
      (value, index) => index === 0 || value > observations[index - 1]!,
    ),
  ).toBe(true);
  expect(new Set(rows.map((row) => row[physicsColumn])).size).toBeLessThan(
    rows.length,
  );
  expect(rows.some((row) => row[kindColumn] === "actuator")).toBe(true);
  expect(rows.at(-1)![kindColumn]).toBe("stop");
  expect(rows.at(-1)![physicsColumn]).toBe(rows.at(-2)![physicsColumn]);
  // Stop opens the System log; inspect the retained Program output explicitly.
  await ide.getByRole("tab", { name: /Program output/ }).click();
  await expect(ide.getByRole("log")).toContainText(/\d+ output lines omitted/);
  const measurement = test
    .info()
    .outputPath("runtime-output-stop-measurements.json");
  const recorded = await monitor.getByTestId("recording-count").textContent();
  const retainedLogText = await ide.getByRole("log").innerText();
  const reportedOmittedLines = [
    ...retainedLogText.matchAll(/(\d+) output lines omitted/g),
  ].reduce((total, match) => total + Number(match[1]), 0);
  expect(reportedOmittedLines).toBeGreaterThan(0);
  writeFileSync(
    measurement,
    JSON.stringify(
      {
        stopLatencyMs,
        startupToRunningMs,
        recorded,
        retainedProgramOutputEntries: await ide
          .getByRole("log")
          .locator(".console-line")
          .count(),
        reportedOmittedLines,
        retainedObservationCount: rows.length,
        distinctPhysicsSteps: new Set(rows.map((row) => row[physicsColumn]))
          .size,
        firstObservationSeq: observations[0],
        lastObservationSeq: observations.at(-1),
        retainedLogText,
      },
      null,
      2,
    ),
  );
  await test.info().attach("runtime-output-stop-measurements", {
    path: measurement,
    contentType: "application/json",
  });
});

test("Stop terminates a non-yielding Python loop while ordinary UI input remains available", async ({
  page,
}) => {
  await seedWorkingFolder(page, {
    folderName: "Non-Yielding-Run",
    projectFolderName: "Non-Yielding-Run",
    project: {
      name: "Non-yielding run",
      entrypoint: "main.py",
      files: { "main.py": "while True:\n    pass\n" },
    },
  });
  await page.goto("/ide/");
  await page
    .locator(".app-header")
    .getByRole("button", { name: "Run", exact: true })
    .click();
  await expect(page.getByTestId("target-status")).toContainText(
    "Virtual XRP · running",
  );
  const started = Date.now();
  await page
    .locator(".app-header")
    .getByRole("button", { name: "Stop", exact: true })
    .click();
  await expect(page.getByTestId("target-status")).toContainText(
    "Virtual XRP · ready",
  );
  const stopLatencyMs = Date.now() - started;
  expect(stopLatencyMs).toBeLessThan(2500);
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  await expect(page.getByTestId("settings-panel")).toBeVisible();
  const measurement = test.info().outputPath("non-yielding-stop.json");
  writeFileSync(measurement, JSON.stringify({ stopLatencyMs }, null, 2));
  await test.info().attach("non-yielding-stop", {
    path: measurement,
    contentType: "application/json",
  });
});
