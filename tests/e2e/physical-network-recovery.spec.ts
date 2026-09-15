import { expect, test } from "@playwright/test";
import { readFileSync } from "node:fs";
import { createServer, type Server } from "node:http";

import { describeProject } from "../../packages/target/src/project-identity";
import type { CourseProject } from "../../packages/target/src/types";

import { readWorkspaceManifest, seedWorkingFolder } from "./working-folder";

const release = JSON.parse(
  readFileSync(
    new URL("../../vendor/current/release.json", import.meta.url),
    "utf8",
  ),
) as {
  release_id: string;
  release_sequence: number;
  course_api_revision: string;
  service: {
    version: string;
    protocol_revision: number;
    bootstrap_version: number;
  };
  ucsb_xrp: { version: string };
};

let mockXrp: Server;
let mockXrpEndpoint = "";
let reachable = false;
let serviceState: "ready" | "running" = "ready";
let rejectedCommand: "stop" | "reset" | null = null;
let serviceSampleSeq = 0;
let resetTelemetryEpoch = false;
let readySamplePending = false;
let resetPollStage = 0;
let stopCompletionAllowed = true;
let stopPending = false;
let serviceRunId = 0;
let controlOwner: string | null = null;
let controlGeneration = 0;
let serviceProject: Awaited<ReturnType<typeof describeProject>> | null = null;
const control = () => ({
  sessionId: controlOwner,
  generation: controlGeneration,
  leaseRemainingMs: 6000,
  runId: serviceRunId,
});

test.beforeEach(() => {
  controlOwner = null;
  controlGeneration = 0;
  serviceRunId = 0;
  serviceProject = null;
  resetPollStage = 0;
  stopCompletionAllowed = true;
  stopPending = false;
});

async function seedPhysicalWorkspace(
  page: import("@playwright/test").Page,
): Promise<void> {
  await seedWorkingFolder(page, {
    folderName: "Physical-Network-Recovery",
    robot: {
      id: "network-recovery-xrp",
      name: "ucsb-xrp",
      networkMode: "station",
      ssid: "TEST-NETWORK",
      address: mockXrpEndpoint,
    },
    target: "physical",
  });
}

test.beforeAll(async () => {
  mockXrp = createServer(async (request, response) => {
    if (!reachable) {
      request.socket.destroy();
      return;
    }
    const url = new URL(request.url ?? "/", "http://127.0.0.1");
    const responseHeaders = {
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Origin": "*",
      "Content-Type": "application/json",
    };
    if (request.method === "OPTIONS") {
      response.writeHead(204, responseHeaders);
      response.end();
      return;
    }
    if (serviceState === "running" && serviceRunId === 0) serviceRunId = 1;
    const common = {
      bootId: "network-recovery-boot",
      courseRelease: release.release_id,
      runtimeRelease: release.release_id,
      runtimeReleaseSequence: release.release_sequence,
      courseApiRevision: release.course_api_revision,
      protocolRevision: release.service.protocol_revision,
      bootstrapVersion: release.service.bootstrap_version,
      courseLibraryVersion: release.ucsb_xrp.version,
      serviceVersion: release.service.version,
      protocol: 1,
      runtimeJson: '{"revision":0,"parameters":[],"watches":[],"plots":[]}',
      project: serviceProject ? { ...serviceProject, lifetime: "boot" } : null,
      runId: serviceRunId,
      control: control(),
    };
    if (request.method === "POST") {
      const chunks: Buffer[] = [];
      for await (const chunk of request) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      }
      const requestBody = JSON.parse(
        Buffer.concat(chunks).toString("utf8"),
      ) as {
        requestId?: string;
        bootId?: string;
        sessionId?: string;
        controlGeneration?: number;
        runId?: number;
        takeover?: boolean;
        expectedProjectRevision?: string;
        project?: CourseProject;
      };
      const command = url.pathname.split("/").pop() ?? "";
      const reject = (code: string) => {
        response.writeHead(200, responseHeaders);
        response.end(
          JSON.stringify({
            protocol: 1,
            requestId: requestBody.requestId,
            ok: false,
            error: { code, detail: code },
          }),
        );
      };
      if (requestBody.bootId !== common.bootId) {
        reject("boot_changed");
        return;
      }
      if (command === "control") {
        if (
          requestBody.sessionId !== controlOwner &&
          ((controlOwner && !requestBody.takeover) || serviceState !== "ready")
        ) {
          reject("control_owned");
          return;
        }
        if (requestBody.sessionId !== controlOwner) {
          controlGeneration += 1;
          controlOwner = requestBody.sessionId ?? null;
        }
        response.writeHead(200, responseHeaders);
        response.end(
          JSON.stringify({
            protocol: 1,
            requestId: requestBody.requestId,
            ok: true,
            result: { control: control() },
          }),
        );
        return;
      }
      if (requestBody.runId !== serviceRunId) {
        reject("stale_run");
        return;
      }
      if (
        command !== "stop" &&
        (requestBody.sessionId !== controlOwner ||
          requestBody.controlGeneration !== controlGeneration)
      ) {
        reject("control_required");
        return;
      }
      if (command === "run") {
        if (serviceState !== "ready") {
          reject("program_active");
          return;
        }
        if (requestBody.project)
          serviceProject = await describeProject(requestBody.project);
        else if (
          requestBody.expectedProjectRevision !== serviceProject?.revision
        ) {
          reject("project_revision_mismatch");
          return;
        }
        serviceRunId += 1;
        serviceState = "running";
      }
      const commandRejected =
        (command === "stop" || command === "reset") &&
        command === rejectedCommand;
      if (commandRejected) {
        response.writeHead(200, responseHeaders);
        response.end(
          JSON.stringify({
            protocol: 1,
            requestId: requestBody.requestId,
            ok: false,
            error: {
              code: "target_error",
              detail: `simulated ${command} rejection`,
            },
          }),
        );
        return;
      }
      if (command === "stop") {
        if (stopCompletionAllowed) serviceState = "ready";
        else stopPending = true;
      }
      if (command === "reset") {
        resetPollStage = 1;
      }
      response.writeHead(200, responseHeaders);
      response.end(
        JSON.stringify({
          protocol: 1,
          requestId: requestBody.requestId,
          ok: true,
          result: {
            detail:
              command === "reset"
                ? "Resetting program state"
                : `${command} accepted`,
            reconnecting: false,
            runtimeJson: common.runtimeJson,
            runId: serviceRunId,
            project: serviceProject
              ? { ...serviceProject, lifetime: "boot" }
              : null,
          },
        }),
      );
      return;
    }
    if (
      url.pathname.endsWith("/telemetry") &&
      (url.searchParams.get("sessionId") !== controlOwner ||
        Number(url.searchParams.get("controlGeneration")) !==
          controlGeneration ||
        Number(url.searchParams.get("runId")) !== serviceRunId ||
        url.searchParams.get("bootId") !== common.bootId)
    ) {
      response.writeHead(409, responseHeaders);
      response.end(
        JSON.stringify({
          error: {
            code: "control_required",
            detail: "A current control session is required",
          },
        }),
      );
      return;
    }
    const infoRequest = url.pathname.endsWith("/info");
    let responseState: "loading" | "ready" | "running" = serviceState;
    let completedResetThisPoll = false;
    if (!infoRequest && stopPending) {
      if (stopCompletionAllowed) {
        stopPending = false;
        serviceState = "ready";
        responseState = "ready";
      } else {
        responseState = "loading";
      }
    } else if (!infoRequest && resetPollStage === 1) {
      responseState = "loading";
      resetPollStage = 2;
    } else if (!infoRequest && resetPollStage === 2) {
      serviceState = "ready";
      responseState = "ready";
      serviceSampleSeq = 0;
      resetTelemetryEpoch = true;
      readySamplePending = true;
      resetPollStage = 0;
      completedResetThisPoll = true;
    }
    const publishReadySample =
      !infoRequest &&
      responseState === "ready" &&
      readySamplePending &&
      !completedResetThisPoll;
    const nextSample =
      !infoRequest &&
      (responseState === "running" ||
        responseState === "loading" ||
        publishReadySample)
        ? {
            tMs: (serviceSampleSeq + 1) * 40,
            seq: (serviceSampleSeq += 1),
            source: "physical",
            poseAvailable:
              responseState === "running" || responseState === "loading",
            xMm: serviceSampleSeq * 5,
            yMm: 0,
            headingRad: 0,
            leftEffort: 0.2,
            rightEffort: 0.2,
            leftWheelSpeedMmS: 100,
            rightWheelSpeedMmS: 100,
            leftEncoderCount: serviceSampleSeq,
            rightEncoderCount: serviceSampleSeq,
            collision: false,
            rangeMm: 300,
            buttonPressed: false,
            accelerationMg: null,
            angularRateMdps: null,
            temperatureC: null,
            batteryV: null,
            sensorError: null,
          }
        : null;
    if (publishReadySample) readySamplePending = false;
    const body = infoRequest
      ? {
          ...common,
          robotId: "network-recovery-xrp",
          robotName: "ucsb-xrp",
          address: mockXrpEndpoint,
          network: {
            mode: "station",
            ssid: "TEST-NETWORK",
            address: mockXrpEndpoint,
            fallback: false,
          },
          capabilities: [
            "project.check",
            "project.prepare",
            "project.run",
            "logs.poll",
            "control.session-v1",
            "program.run",
            "program.stop",
            "target.reset",
            "telemetry.poll",
          ],
        }
      : {
          ...common,
          state: responseState,
          detail:
            responseState === "running"
              ? "Running main.py"
              : responseState === "loading"
                ? "Resetting program state"
                : "Physical XRP ready",
          runId: serviceRunId,
          logs: [],
          samples: nextSample ? [nextSample] : [],
          moreSamples: false,
          moreLogs: false,
          sample: null,
        };
    response.writeHead(200, responseHeaders);
    response.end(JSON.stringify(body));
  });
  await new Promise<void>((resolve) => mockXrp.listen(0, "127.0.0.1", resolve));
  const address = mockXrp.address();
  if (!address || typeof address === "string") {
    throw new Error("Mock XRP did not bind a TCP port");
  }
  mockXrpEndpoint = `http://127.0.0.1:${address.port}`;
});

test.afterAll(async () => {
  await new Promise<void>((resolve, reject) =>
    mockXrp.close((error) => (error ? reject(error) : resolve())),
  );
});

test("keeps IDE and Monitor attached until the XRP Wi-Fi connection returns", async ({
  context,
  page: ide,
}) => {
  reachable = false;
  serviceState = "ready";
  rejectedCommand = null;

  await ide.setViewportSize({ width: 850, height: 752 });
  await seedPhysicalWorkspace(ide);
  await ide.goto("/ide/");
  await ide.getByRole("button", { name: "Project ›" }).click();
  await ide.getByRole("button", { name: "New project…", exact: true }).click();
  await expect(
    ide.getByRole("combobox", { name: "Project template" }),
  ).toHaveValue("");
  await expect(
    ide.getByRole("button", {
      name: "Create",
      exact: true,
    }),
  ).toBeDisabled();
  await ide.getByRole("button", { name: "Cancel", exact: true }).click();
  await ide.getByRole("button", { name: "Collapse project" }).click();
  await expect(ide.getByTestId("target-status")).toContainText(
    "Physical XRP · error · connection required",
  );
  await expect(ide.getByTestId("target-status")).toHaveAttribute(
    "title",
    /Run and telemetry use Wi-Fi\. The computer and XRP must use the network selected during Set up or Repair\./,
  );
  await expect(ide.getByRole("button", { name: "Compile" })).toBeEnabled();
  await ide.getByRole("button", { name: "Compile" }).click();
  await expect(ide.getByTestId("check-result")).toContainText(
    /compiled successfully/i,
  );
  await expect(ide.getByTestId("target-status")).toContainText(
    "Physical XRP · error",
  );
  await expect(
    ide.getByRole("button", { name: "Run", exact: true }),
  ).toBeDisabled();
  await expect(ide.getByRole("button", { name: "Reset" })).toBeDisabled();

  const [toolbarBox, statusBox] = await Promise.all([
    ide.locator(".toolbar").boundingBox(),
    ide.locator(".header-statuses").boundingBox(),
  ]);
  const overlapWidth =
    Math.min(
      (toolbarBox?.x ?? 0) + (toolbarBox?.width ?? 0),
      (statusBox?.x ?? 0) + (statusBox?.width ?? 0),
    ) - Math.max(toolbarBox?.x ?? 0, statusBox?.x ?? 0);
  const overlapHeight =
    Math.min(
      (toolbarBox?.y ?? 0) + (toolbarBox?.height ?? 0),
      (statusBox?.y ?? 0) + (statusBox?.height ?? 0),
    ) - Math.max(toolbarBox?.y ?? 0, statusBox?.y ?? 0);
  expect(overlapWidth <= 0.5 || overlapHeight <= 0.5).toBe(true);

  const monitor = await context.newPage();
  await monitor.goto("/monitor/");
  await expect(monitor.getByTestId("target-status")).toContainText(
    "Physical XRP · error",
  );
  await expect(monitor.getByText("XRP not reachable")).toBeVisible();
  await expect(
    monitor.getByText(
      "Connect this computer and the XRP to TEST-NETWORK, then select Reconnect.",
      { exact: true },
    ),
  ).toBeVisible();
  const setupLinks = monitor.getByRole("link", {
    name: "Set up or repair XRP",
  });
  await expect(setupLinks).toHaveCount(2);
  expect(
    await setupLinks.evaluateAll((links) =>
      links.every((link) => link.getAttribute("target") === "_top"),
    ),
  ).toBe(true);
  await expect(
    monitor.getByRole("button", { name: "Run", exact: true }),
  ).toBeDisabled();
  await expect(monitor.getByRole("button", { name: "Reset" })).toBeDisabled();

  reachable = true;
  await monitor.getByRole("button", { name: "Reconnect XRP" }).click();
  await expect(monitor.getByTestId("target-status")).toContainText(
    "Physical XRP · ready",
  );
  await expect(monitor.getByTestId("target-status")).toContainText(
    /Expanding spiral|Expanding-Spiral loads on Run/,
  );
  await expect(ide.getByTestId("target-status")).toContainText(
    "Physical XRP · ready",
  );
  await expect(ide.getByRole("button", { name: "Compile" })).toBeEnabled();
  await expect
    .poll(() =>
      readWorkspaceManifest<{
        settings?: { target?: string };
        robot?: {
          id?: string;
          networkMode?: string;
          address?: string;
          ssid?: string;
        };
      }>(ide, "Physical-Network-Recovery"),
    )
    .toMatchObject({
      settings: { target: "physical" },
      robot: {
        id: "network-recovery-xrp",
        networkMode: "station",
        address: mockXrpEndpoint.replace(/^https?:\/\//, ""),
        ssid: "TEST-NETWORK",
      },
    });
  await ide.getByRole("tab", { name: /System log/ }).click();
  await expect(ide.getByRole("log")).toContainText("Connected to ucsb-xrp");
  await expect(
    ide.getByRole("log").getByText("Connected to ucsb-xrp"),
  ).toHaveCount(1);
});

test("reports a rejected physical Stop in the IDE System log", async ({
  context,
  page: ide,
}) => {
  reachable = true;
  serviceState = "running";
  rejectedCommand = "stop";
  try {
    await seedPhysicalWorkspace(ide);
    await ide.goto("/ide/");
    await expect(
      ide.getByRole("button", { name: "Stop", exact: true }),
    ).toBeEnabled();
    await ide.getByRole("button", { name: "Stop", exact: true }).click();
    await expect(ide.getByRole("log")).toContainText(
      "Stop did not complete · simulated stop rejection",
    );
  } finally {
    rejectedCommand = null;
    serviceState = "ready";
  }
});

test("reports a rejected physical Reset in the IDE System log", async ({
  context,
  page: ide,
}) => {
  reachable = true;
  serviceState = "ready";
  rejectedCommand = "reset";
  try {
    await seedPhysicalWorkspace(ide);
    await ide.goto("/ide/");
    await expect(
      ide.getByRole("button", { name: "Reset", exact: true }),
    ).toBeEnabled();
    await ide.getByRole("button", { name: "Reset", exact: true }).click();
    await expect(ide.getByRole("log")).toContainText(
      "Reset did not complete · simulated reset rejection",
    );
  } finally {
    rejectedCommand = null;
  }
});

test("physical Reset from the IDE clears the Monitor world path", async ({
  context,
  page: ide,
}) => {
  reachable = true;
  serviceState = "ready";
  serviceSampleSeq = 0;
  resetTelemetryEpoch = false;
  readySamplePending = false;
  resetPollStage = 0;
  rejectedCommand = null;
  try {
    await seedPhysicalWorkspace(ide);
    await ide.goto("/ide/");
    await expect(ide.getByTestId("target-status")).toContainText(
      "Physical XRP · ready",
    );
    serviceRunId = 1;
    serviceState = "running";
    const monitor = await context.newPage();
    await monitor.goto("/monitor/");
    await expect(monitor.getByTestId("target-status")).toContainText(
      "Physical XRP · running",
    );
    await expect
      .poll(async () =>
        Number(
          await monitor
            .getByTestId("world-view")
            .getAttribute("data-path-point-count"),
        ),
      )
      .toBeGreaterThan(2);

    const recordedSamples = async () => {
      const text = await monitor.getByTestId("recording-count").innerText();
      return Number(
        text.match(/([\d,]+) samples/)?.[1]?.replaceAll(",", "") ?? 0,
      );
    };
    const samplesBeforeReset = await recordedSamples();
    stopCompletionAllowed = false;
    await ide
      .locator(".app-header")
      .getByRole("button", { name: "Reset", exact: true })
      .click();

    await expect.poll(() => stopPending).toBe(true);
    await expect(monitor.getByTestId("target-status")).toContainText(
      "Physical XRP · loading",
    );
    await expect(
      monitor.getByRole("button", { name: "Export run data as CSV" }),
    ).toBeDisabled();
    await expect.poll(recordedSamples).toBeGreaterThan(samplesBeforeReset);
    stopCompletionAllowed = true;
    await expect(monitor.getByTestId("target-status")).toContainText(
      "Physical XRP · ready",
    );
    await expect.poll(() => resetTelemetryEpoch).toBe(true);
    await expect(monitor.getByTestId("world-view")).toHaveAttribute(
      "data-path-point-count",
      "0",
    );
    await expect(
      monitor.getByText("Preview · no published pose", { exact: true }),
    ).toBeVisible();
    await expect(monitor.getByText("odometry x", { exact: true })).toHaveCount(
      0,
    );
    await expect(monitor.getByTestId("range-mm")).toHaveText("300.0 mm");
    await expect(
      monitor.getByRole("button", { name: "Export run data as CSV" }),
    ).toBeEnabled();
  } finally {
    serviceState = "ready";
    serviceSampleSeq = 0;
    resetTelemetryEpoch = false;
    readySamplePending = false;
    resetPollStage = 0;
    stopCompletionAllowed = true;
    stopPending = false;
  }
});

test("enforces control across two independent browsers while preserving observer Stop", async ({
  browser,
  page: owner,
}) => {
  reachable = true;
  serviceState = "ready";
  rejectedCommand = null;
  await seedPhysicalWorkspace(owner);
  await owner.goto("/ide/");
  const run = (page: import("@playwright/test").Page) =>
    page
      .locator(".app-header")
      .getByRole("button", { name: "Run", exact: true });
  await expect(run(owner)).toBeEnabled();
  await run(owner).click();
  await expect.poll(() => serviceState).toBe("running");
  const independent = await browser.newContext({
    baseURL: new URL(owner.url()).origin,
  });
  try {
    const observer = await independent.newPage();
    await seedPhysicalWorkspace(observer);
    await observer.goto("/ide/");
    await expect(observer.getByTestId("target-status")).toContainText(
      "Physical XRP · running",
    );
    await expect(run(observer)).toHaveCount(0);
    const originalOwner = controlOwner;
    await observer
      .locator(".app-header")
      .getByRole("button", { name: "Stop", exact: true })
      .click();
    await expect(observer.getByTestId("target-status")).toContainText(
      "Physical XRP · ready",
    );
    expect(controlOwner).toBe(originalOwner);
    await expect(run(observer)).toBeDisabled();
    await observer
      .getByRole("button", { name: "Take control", exact: true })
      .click();
    await expect.poll(() => controlOwner).not.toBe(originalOwner);
    await expect(run(observer)).toBeEnabled();
    await run(observer).click();
    await expect.poll(() => serviceRunId).toBe(2);
    await expect(run(owner)).toHaveCount(0);
    // Saving and ownership status must leave the former controller's Stop
    // reachable at each supported header layout, including a narrow window.
    for (const width of [1440, 1024, 768, 375]) {
      await test.step(`Former-owner Stop is reachable at ${width}px`, async () => {
        await owner.setViewportSize({ width, height: 900 });
        await owner
          .locator(".app-header")
          .getByRole("button", { name: "Stop", exact: true })
          .click({ trial: true });
        await owner.screenshot({
          path: test.info().outputPath(`observer-stop-${width}px.png`),
          fullPage: true,
        });
      });
    }
    await owner
      .locator(".app-header")
      .getByRole("button", { name: "Stop", exact: true })
      .click();
    await expect.poll(() => serviceState).toBe("ready");
  } finally {
    await independent.close();
    serviceState = "ready";
  }
});
