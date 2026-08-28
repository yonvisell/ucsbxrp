import {
  expect,
  test,
  type APIRequestContext,
  type Page,
} from "@playwright/test";
import { readFileSync } from "node:fs";

import { replaceWorkspaceProject, seedWorkingFolder } from "./working-folder";

const xrpAddress = process.env.XRP_ADDRESS?.trim();
const physicalAllowed =
  process.env.XRP_E2E_PHYSICAL === "1" ||
  process.env.XRP_E2E_ALLOW_FLASH === "1";
const motionAllowed = process.env.XRP_E2E_MOTION === "raised_wheels";

const noMotionSentinel = "PHYSICAL_E2E_PROBE_READY";
const motionSentinel = "PHYSICAL_E2E_MOTION_STARTED";

function readVendorFile(path: string): string {
  return readFileSync(
    new URL(`../../vendor/current/${path}`, import.meta.url),
    "utf8",
  );
}

const retainedZeroOutputProject = {
  name: "Physical service probe",
  entrypoint: "main.py",
  files: {
    "main.py": `import time
from ucsb_xrp import RobotConfig, XRPBot

bot = XRPBot(RobotConfig())
print("${noMotionSentinel}")
try:
    while True:
        bot.read()
        time.sleep_ms(100)
finally:
    bot.stop()
`,
    "README.md":
      "Test-owned zero-output project for the physical browser workflow.\n",
  },
};

const boundedMotionProject = {
  name: "Bounded physical motion proof",
  entrypoint: "main.py",
  files: {
    "main.py": `from course_setup import make_robot
from robot_config import ROBOT_CONFIG
from ucsb_xrp import MotionCommand, Pose

robot = make_robot(ROBOT_CONFIG)
try:
    robot.start(Pose(0.0, 0.0, 0.0))
    print("${motionSentinel}")
    # The 200-sample bound limits motion to four seconds even if the browser
    # disappears before sending Stop. The test normally stops much earlier.
    for _ in range(200):
        robot.step(MotionCommand(80.0, 0.0))
finally:
    robot.stop()
`,
    "course_setup.py": readVendorFile("templates/demo_spiral/course_setup.py"),
    "robot_config.py": readVendorFile("templates/demo_spiral/robot_config.py"),
    "README.md":
      "Test-owned, four-second maximum motion project for raised wheels.\n",
  },
};

const defaultSpiralProject = {
  name: "Expanding spiral",
  entrypoint: "main.py",
  files: Object.fromEntries(
    [
      "main.py",
      "course_setup.py",
      "robot_config.py",
      "README.md",
      "world.json",
    ].map((path) => [path, readVendorFile(`templates/demo_spiral/${path}`)]),
  ),
};

function collectBrowserErrors(page: Page, errors: string[]): void {
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") {
      errors.push(message.text());
    }
  });
}

function numericPair(text: string | null): number[] {
  return (text ?? "")
    .split("/")
    .map((part) => Number.parseFloat(part))
    .filter(Number.isFinite);
}

async function robotInfo(request: APIRequestContext, endpoint: string) {
  let lastError: unknown;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const response = await request.get(`${endpoint}/api/v1/info`, {
        timeout: 1_000,
      });
      expect(response.ok()).toBe(true);
      return (await response.json()) as {
        bootId: string;
        courseRelease: string;
        robotId: string;
        project?: {
          name?: string;
          revision?: string;
          lifetime?: string;
        } | null;
      };
    } catch (error) {
      lastError = error;
      // This diagnostic client is independent of the shared browser transport.
      // A request can collide with its active telemetry socket on Phew; retry
      // immediately, but keep the total bound far below a controller restart.
      if (attempt < 2) await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }
  throw lastError;
}

async function robotLogsAfter(
  request: APIRequestContext,
  endpoint: string,
  afterLogSeq: number,
): Promise<Array<{ seq: number; stream: string; line: string }>> {
  let lastError: unknown;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const response = await request.get(
        `${endpoint}/api/v1/state?afterLogSeq=${afterLogSeq}`,
        { timeout: 3_000 },
      );
      expect(response.ok()).toBe(true);
      return (
        (await response.json()) as {
          logs: Array<{ seq: number; stream: string; line: string }>;
        }
      ).logs;
    } catch (error) {
      lastError = error;
      if (attempt < 2) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }
  }
  throw lastError;
}

async function robotCommand(
  request: APIRequestContext,
  endpoint: string,
  command: "stop" | "prepare",
  value: Record<string, unknown> = {},
): Promise<void> {
  const requestId = `e2e-${command}-${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
  const response = await request.post(`${endpoint}/api/v1/${command}`, {
    data: { ...value, requestId },
    timeout: 3_000,
  });
  expect(response.ok()).toBe(true);
  const reply = (await response.json()) as {
    ok: boolean;
    error?: { detail?: string };
  };
  expect(reply.ok, reply.error?.detail).toBe(true);
}

async function waitForRobotReady(
  request: APIRequestContext,
  endpoint: string,
): Promise<void> {
  await expect
    .poll(
      async () => {
        const response = await request.get(`${endpoint}/api/v1/state`, {
          timeout: 3_000,
        });
        if (!response.ok()) return "unreachable";
        return ((await response.json()) as { state: string }).state;
      },
      { timeout: 5_000 },
    )
    .toBe("ready");
}

function expectOrdered(text: string, stages: readonly string[]): void {
  let previous = -1;
  for (const stage of stages) {
    const index = text.indexOf(stage, previous + 1);
    expect(
      index,
      `Missing or out-of-order System log stage: ${stage}`,
    ).toBeGreaterThan(previous);
    previous = index;
  }
}

function occurrenceCount(text: string, value: string): number {
  return text.split(value).length - 1;
}

test("IDE and Monitor complete the bounded physical XRP workflow", async ({
  context,
}) => {
  test.skip(!xrpAddress, "Set XRP_ADDRESS to run the attached-hardware proof");
  test.skip(
    !physicalAllowed,
    "Set XRP_E2E_PHYSICAL=1 for the attached course test XRP",
  );
  test.setTimeout(90_000);

  const endpoint = `http://${xrpAddress}`;
  const request = context.request;
  const initialInfo = await robotInfo(request, endpoint);
  const retainedDeviceLogs = await robotLogsAfter(request, endpoint, 0);
  const initialDeviceLogSeq = retainedDeviceLogs.reduce(
    (maximum, entry) => Math.max(maximum, entry.seq),
    0,
  );

  const errors: string[] = [];
  const ide = await context.newPage();
  await seedWorkingFolder(ide, {
    folderName: "Physical-Hardware-Test",
    project: retainedZeroOutputProject,
    projectFolderName: "Physical-Service-Probe",
    robot: {
      id: initialInfo.robotId,
      name: "ucsb-xrp",
      networkMode: "station",
      ssid: "COURSE-NETWORK",
      address: xrpAddress!,
    },
    target: "physical",
  });
  const monitor = await context.newPage();
  collectBrowserErrors(ide, errors);
  collectBrowserErrors(monitor, errors);

  try {
    await ide.goto("/ide/");
    await monitor.goto("/monitor/");

    const ideStatus = ide.getByTestId("target-status");
    const monitorStatus = monitor.getByTestId("target-status");
    await expect(ideStatus).toContainText("Physical XRP · ready", {
      timeout: 5_000,
    });
    await expect(monitorStatus).toContainText("Physical XRP · ready");
    await ide.getByRole("tab", { name: /System log/ }).click();
    const systemLogBeforeWorkflow = await ide.getByRole("log").innerText();

    const monitorRun = monitor
      .locator(".app-header")
      .getByRole("button", { name: "Run", exact: true });
    await expect(monitorRun).toBeEnabled();

    // First run: Monitor requests the exact current IDE project. Run compiles
    // and prepares it in XRP memory before starting; this project never applies
    // motor effort.
    await monitorRun.click();
    await expect(ideStatus).toContainText("Physical XRP · running", {
      timeout: 5_000,
    });
    await ide.getByRole("tab", { name: /Program output/ }).click();
    await expect(ide.getByRole("log")).toContainText(noMotionSentinel, {
      timeout: 5_000,
    });
    const firstStopStarted = Date.now();
    await monitor
      .locator(".app-header")
      .getByRole("button", { name: "Stop", exact: true })
      .click();
    await expect(ideStatus).toContainText("Physical XRP · ready", {
      timeout: 5_000,
    });
    expect(Date.now() - firstStopStarted).toBeLessThan(3_000);
    await expect(monitor.getByTestId("motor-effort")).toHaveText("0.00 / 0.00");

    // A project edit is shared immediately. Monitor stays usable, but its Run
    // action now identifies that the edited project must be compiled and
    // loaded before it starts. Stop immediately after the running state to
    // exercise the real Run/Stop ordering before main.py reaches its loop.
    await ide.getByRole("button", { name: "New file…", exact: true }).click();
    await ide.getByLabel("Project-relative path").fill("notes.md");
    await ide.getByRole("button", { name: "Create file" }).click();
    await expect(monitorRun).toBeEnabled();
    await expect(monitorRun).toHaveAttribute(
      "title",
      /Compile and run the current IDE project/,
    );
    await monitorRun.click();
    await expect(ideStatus).toContainText("Physical XRP · running", {
      timeout: 5_000,
    });
    await monitor
      .locator(".app-header")
      .getByRole("button", { name: "Stop", exact: true })
      .click();
    await expect(ideStatus).toContainText("Physical XRP · ready", {
      timeout: 5_000,
    });

    // Third run: start from IDE and stop from Monitor to exercise the other
    // cross-window command direction. A fresh sentinel proves that the
    // immediate Stop did not leak into this later run and that output history
    // was retained rather than replaced.
    const outputBeforeThirdRun = await ide.getByRole("log").innerText();
    const sentinelCountBeforeThirdRun = occurrenceCount(
      outputBeforeThirdRun,
      noMotionSentinel,
    );
    await ide.getByRole("button", { name: "Run", exact: true }).click();
    await expect(monitorStatus).toContainText("Physical XRP · running", {
      timeout: 5_000,
    });
    await expect
      .poll(async () =>
        occurrenceCount(
          await ide.getByRole("log").innerText(),
          noMotionSentinel,
        ),
      )
      .toBeGreaterThan(sentinelCountBeforeThirdRun);
    await monitor
      .locator(".app-header")
      .getByRole("button", { name: "Stop", exact: true })
      .click();
    await expect(monitorStatus).toContainText("Physical XRP · ready", {
      timeout: 5_000,
    });

    // Reset is a fast course-state operation. It must not reboot Wi-Fi or
    // discard the project already prepared in RAM; a subsequent Run uses that
    // exact edited project without a USB or network recovery cycle.
    const beforeResetInfo = await robotInfo(request, endpoint);
    const resetStarted = Date.now();
    await monitor
      .locator(".app-header")
      .getByRole("button", { name: "Reset", exact: true })
      .click();
    await expect(ideStatus).toContainText("Physical XRP · ready", {
      timeout: 3_000,
    });
    expect(Date.now() - resetStarted).toBeLessThan(3_000);
    const afterResetInfo = await robotInfo(request, endpoint);
    expect(afterResetInfo.bootId).toBe(beforeResetInfo.bootId);
    expect(afterResetInfo.project?.revision).toBe(
      beforeResetInfo.project?.revision,
    );

    const outputBeforeResetRun = await ide.getByRole("log").innerText();
    const sentinelCountBeforeResetRun = occurrenceCount(
      outputBeforeResetRun,
      noMotionSentinel,
    );
    await monitorRun.click();
    await expect(ideStatus).toContainText("Physical XRP · running", {
      timeout: 5_000,
    });
    await expect
      .poll(async () =>
        occurrenceCount(
          await ide.getByRole("log").innerText(),
          noMotionSentinel,
        ),
      )
      .toBeGreaterThan(sentinelCountBeforeResetRun);
    await monitor
      .locator(".app-header")
      .getByRole("button", { name: "Stop", exact: true })
      .click();
    await expect(ideStatus).toContainText("Physical XRP · ready", {
      timeout: 5_000,
    });

    // The complete ordinary workflow must remain visible throughout this page
    // session. The optional motion proof below deliberately reloads both pages
    // to inject a test-owned project, so verify this history before that test
    // harness transition rather than treating a page reload as a log archive.
    await ide.getByRole("tab", { name: /System log/ }).click();
    const ordinaryWorkflowLog = await ide.getByRole("log").innerText();
    // Device and browser messages can arrive in the same poll and be ordered
    // around the initial snapshot. Preserve the baseline content without
    // requiring it to remain one byte-for-byte prefix of the rendered log.
    expect(systemLogBeforeWorkflow).toContain("Connected to");
    expect(ordinaryWorkflowLog).toContain("Connected to");
    expect(ordinaryWorkflowLog).toMatch(
      /UCSBXRP (?:app build \S+|local development) · course /,
    );
    expect(ordinaryWorkflowLog).toContain(
      `course ${initialInfo.courseRelease}`,
    );
    expectOrdered(ordinaryWorkflowLog, [
      "Run requested",
      "Run · 1 Python files compiled; starting main.py",
      "Starting main.py",
      "Running main.py",
      "Stop requested",
      "Stop · Stopping program",
      "Program stopped",
    ]);

    if (motionAllowed) {
      await replaceWorkspaceProject(ide, boundedMotionProject, {
        folderName: "Physical-Hardware-Test",
        projectFolderName: "Physical-Service-Probe",
      });
      await ide.reload();
      await monitor.reload();
      await expect(ideStatus).toContainText("Physical XRP · ready", {
        timeout: 5_000,
      });
      const encoderCountsBeforeMotion = numericPair(
        await monitor.getByTestId("encoder-counts").textContent(),
      );
      expect(encoderCountsBeforeMotion).toHaveLength(2);
      await ide.getByRole("button", { name: "Run", exact: true }).click();
      await expect(monitorStatus).toContainText("Physical XRP · running", {
        timeout: 5_000,
      });
      await ide.getByRole("tab", { name: /Program output/ }).click();
      await expect(ide.getByRole("log")).toContainText(motionSentinel, {
        timeout: 5_000,
      });
      await expect
        .poll(async () => {
          const values = numericPair(
            await monitor.getByTestId("motor-effort").textContent(),
          );
          return Math.max(0, ...values.map(Math.abs));
        })
        .toBeGreaterThan(0.05);
      await expect
        .poll(
          async () =>
            numericPair(
              await monitor.getByTestId("wheel-distance").textContent(),
            ).length,
        )
        .toBe(2);
      const wheelDistancesAtMotionStart = numericPair(
        await monitor.getByTestId("wheel-distance").textContent(),
      );
      await expect
        .poll(async () => {
          const values = numericPair(
            await monitor.getByTestId("wheel-distance").textContent(),
          );
          if (values.length !== 2) return 0;
          return Math.min(
            ...values.map((value, index) =>
              Math.abs(value - wheelDistancesAtMotionStart[index]!),
            ),
          );
        })
        .toBeGreaterThan(3);
      await expect
        .poll(async () => {
          const values = numericPair(
            await monitor.getByTestId("encoder-counts").textContent(),
          );
          if (values.length !== 2) return 0;
          return Math.min(
            ...values.map((value, index) =>
              Math.abs(value - encoderCountsBeforeMotion[index]!),
            ),
          );
        })
        .toBeGreaterThan(5);
      await expect(monitor.getByTestId("range-mm")).not.toContainText("—");
      await expect(
        monitor
          .getByText("motor supply", { exact: true })
          .locator("xpath=following-sibling::dd[1]"),
      ).toHaveText(/\d+(?:\.\d+)? V/);
      await expect(
        monitor
          .getByText("IMU temperature", { exact: true })
          .locator("xpath=following-sibling::dd[1]"),
      ).toHaveText(/\d+(?:\.\d+)? °C/);
      await expect(monitor.getByTestId("world-view")).toHaveAttribute(
        "data-pose-state",
        "published",
      );
      await expect
        .poll(async () =>
          Number.parseInt(
            (await monitor
              .getByTestId("world-view")
              .getAttribute("data-path-point-count")) ?? "0",
            10,
          ),
        )
        .toBeGreaterThan(5);
      await expect
        .poll(async () =>
          Number.parseInt(
            (await monitor
              .locator(".signal-plot-shell")
              .first()
              .getAttribute("data-sample-count")) ?? "0",
            10,
          ),
        )
        .toBeGreaterThan(5);

      const motionStop = monitor
        .locator(".app-header")
        .getByRole("button", { name: "Stop", exact: true });
      if (await motionStop.isVisible()) {
        const motionStopStarted = Date.now();
        await motionStop.click();
        try {
          await expect(ideStatus).toContainText("Physical XRP · ready", {
            timeout: 5_000,
          });
        } catch (error) {
          await ide.getByRole("tab", { name: /System log/ }).click();
          const systemLog = await ide.getByRole("log").innerText();
          throw new Error(
            `${error instanceof Error ? error.message : String(error)}\n\nSystem log at failed motion Stop:\n${systemLog}`,
          );
        }
        const motionStopElapsedMs = Date.now() - motionStopStarted;
        if (motionStopElapsedMs >= 3_000) {
          await ide.getByRole("tab", { name: /System log/ }).click();
          const systemLog = await ide.getByRole("log").innerText();
          throw new Error(
            `Motion Stop took ${motionStopElapsedMs} ms.\n\nSystem log at slow motion Stop:\n${systemLog}`,
          );
        }
      } else {
        // The four-second test program may finish while the preceding telemetry
        // assertions run. Natural completion is equivalent here because the
        // final state and zero motor effort are checked below.
        await expect(ideStatus).toContainText("Physical XRP · ready", {
          timeout: 5_000,
        });
      }
      await expect(monitor.getByTestId("motor-effort")).toHaveText(
        "0.00 / 0.00",
      );
    }

    await ide.getByRole("tab", { name: /System log/ }).click();
    const systemLog = await ide.getByRole("log").innerText();
    if (motionAllowed) {
      expectOrdered(systemLog, [
        "Run requested · Bounded physical motion proof",
        "Run · 3 Python files compiled; starting main.py",
        "Starting main.py",
        "Running main.py",
      ]);
      expect(systemLog).toContain("Stop requested");
      expect(systemLog).toMatch(/Program (?:completed|stopped)/);
    }
    const newDeviceLogs = await robotLogsAfter(
      request,
      endpoint,
      initialDeviceLogSeq,
    );
    expect(newDeviceLogs.map((entry) => entry.line).join("\n")).not.toMatch(
      /Traceback|Program stopped after an exception/,
    );

    const finalInfo = await robotInfo(request, endpoint);
    expect(finalInfo.bootId).toBe(initialInfo.bootId);
    expect(finalInfo.courseRelease).toBe(initialInfo.courseRelease);
    expect(errors).toEqual([]);
  } finally {
    // Cleanup is independent of browser controls: stop first, wait for
    // readiness, then leave the student-facing default project ready in RAM.
    await robotCommand(request, endpoint, "stop").catch(() => undefined);
    await waitForRobotReady(request, endpoint).catch(() => undefined);
    await robotCommand(request, endpoint, "prepare", {
      project: defaultSpiralProject,
    }).catch(() => undefined);
  }
  const restoredInfo = await robotInfo(request, endpoint);
  expect(restoredInfo.project?.name).toBe("Expanding spiral");
});
