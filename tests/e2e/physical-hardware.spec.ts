import {
  expect,
  test,
  type APIRequestContext,
  type Page,
} from "@playwright/test";
import { readFileSync } from "node:fs";

const xrpAddress = process.env.XRP_ADDRESS?.trim();
const flashAllowed = process.env.XRP_E2E_ALLOW_FLASH === "1";
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
  const response = await request.get(`${endpoint}/api/v1/info`, {
    timeout: 3_000,
  });
  expect(response.ok()).toBe(true);
  return (await response.json()) as { bootId: string; courseRelease: string };
}

async function robotCommand(
  request: APIRequestContext,
  endpoint: string,
  command: "stop" | "sync",
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

test("IDE and Monitor complete the bounded physical XRP workflow", async ({
  context,
}) => {
  test.skip(!xrpAddress, "Set XRP_ADDRESS to run the attached-hardware proof");
  test.skip(
    !flashAllowed,
    "Set XRP_E2E_ALLOW_FLASH=1 only for the designated course test XRP",
  );
  test.setTimeout(90_000);

  const endpoint = `http://${xrpAddress}`;
  const request = context.request;
  const initialInfo = await robotInfo(request, endpoint);

  await context.addInitScript(
    ({ address, project }) => {
      localStorage.setItem(
        "ucsb-xrp-target-v1",
        JSON.stringify({
          kind: "physical",
          physicalConnection: "station",
          physicalEndpoint: `http://${address}`,
        }),
      );
      if (!localStorage.getItem("ucsb-xrp-course-project-v1")) {
        localStorage.setItem(
          "ucsb-xrp-course-project-v1",
          JSON.stringify(project),
        );
      }
    },
    { address: xrpAddress!, project: retainedZeroOutputProject },
  );

  const errors: string[] = [];
  const ide = await context.newPage();
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

    const monitorRun = monitor
      .locator(".app-header")
      .getByRole("button", { name: "Run", exact: true });
    await ide.getByRole("button", { name: "Flash project" }).click();
    await expect(
      ide.getByText("The complete project is flashed and ready on the XRP."),
    ).toBeVisible({ timeout: 5_000 });
    await expect(monitorRun).toBeEnabled();

    // First run: start from Monitor, observe the project output in IDE, and
    // stop from Monitor. This project never applies motor effort.
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
    // action now identifies that the edited project must be validated and
    // flashed before it starts. One click performs that coherent sequence.
    await ide.getByRole("button", { name: "New file", exact: true }).click();
    await ide.getByLabel("Project-relative path").fill("notes.md");
    await ide.getByRole("button", { name: "Create file" }).click();
    await expect(monitorRun).toBeEnabled();
    await expect(monitorRun).toHaveAttribute(
      "title",
      /Validate and run the current IDE project/,
    );
    await monitorRun.click();
    await expect(ideStatus).toContainText("Physical XRP · running", {
      timeout: 5_000,
    });
    await expect(ide.getByRole("log")).toContainText(noMotionSentinel, {
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
    // cross-window command direction.
    await ide.getByRole("button", { name: "Run", exact: true }).click();
    await expect(monitorStatus).toContainText("Physical XRP · running", {
      timeout: 5_000,
    });
    await expect(ide.getByRole("log")).toContainText(noMotionSentinel, {
      timeout: 5_000,
    });
    await monitor
      .locator(".app-header")
      .getByRole("button", { name: "Stop", exact: true })
      .click();
    await expect(monitorStatus).toContainText("Physical XRP · ready", {
      timeout: 5_000,
    });

    if (motionAllowed) {
      await ide.evaluate((project) => {
        localStorage.setItem(
          "ucsb-xrp-course-project-v1",
          JSON.stringify(project),
        );
      }, boundedMotionProject);
      await ide.reload();
      await monitor.reload();
      await expect(ideStatus).toContainText("Physical XRP · ready", {
        timeout: 5_000,
      });
      await ide.getByRole("button", { name: "Flash project" }).click();
      await expect(
        ide.getByText("The complete project is flashed and ready on the XRP."),
      ).toBeVisible({ timeout: 5_000 });

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
        .poll(async () => {
          const values = numericPair(
            await monitor.getByTestId("wheel-distance").textContent(),
          );
          return Math.max(0, ...values.map(Math.abs));
        })
        .toBeGreaterThan(3);

      const motionStopStarted = Date.now();
      await monitor
        .locator(".app-header")
        .getByRole("button", { name: "Stop", exact: true })
        .click();
      await expect(ideStatus).toContainText("Physical XRP · ready", {
        timeout: 5_000,
      });
      expect(Date.now() - motionStopStarted).toBeLessThan(3_000);
      await expect(monitor.getByTestId("motor-effort")).toHaveText(
        "0.00 / 0.00",
      );
    }

    await ide.getByRole("tab", { name: /System log/ }).click();
    const systemLog = await ide.getByRole("log").innerText();
    expectOrdered(systemLog, [
      "Flash requested",
      "Flash · Project flashed",
      "Run requested",
      "Run · Starting main.py",
      "Running main.py",
      "Stop requested",
      "Stop · Stopping program",
      "Program stopped",
    ]);
    expect(systemLog).not.toMatch(
      /Traceback|Program stopped after an exception/,
    );

    const finalInfo = await robotInfo(request, endpoint);
    expect(finalInfo.bootId).toBe(initialInfo.bootId);
    expect(finalInfo.courseRelease).toBe(initialInfo.courseRelease);
    expect(errors).toEqual([]);
  } finally {
    // Cleanup is independent of browser controls: stop first, wait for
    // readiness, then restore the student-facing default project.
    await robotCommand(request, endpoint, "stop").catch(() => undefined);
    await waitForRobotReady(request, endpoint).catch(() => undefined);
    await robotCommand(request, endpoint, "sync", {
      project: defaultSpiralProject,
    }).catch(() => undefined);
  }
});
