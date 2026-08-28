import { describe, expect, it, vi } from "vitest";

import {
  CURRENT_COURSE_API_REVISION,
  CURRENT_COURSE_RELEASE,
  CURRENT_PROTOCOL_REVISION,
  CURRENT_ROBOT_RELEASE_SEQUENCE,
  DirectPhysicalTargetClient,
  localNetworkRequestInit,
  MINIMUM_ROBOT_RELEASE_SEQUENCE,
  PhysicalTargetClient,
  normalizePhysicalEndpoint,
} from "./physical-target";
import { describeProject } from "./project-identity";
import type { CourseProject, TargetEvent, TelemetrySample } from "./types";

const project: CourseProject = {
  entrypoint: "main.py",
  files: { "main.py": "print('ready')\n" },
};

function response(value: unknown, status = 200): Response {
  return new Response(JSON.stringify(value), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function physicalSample(
  sequence: number,
  timeMs = sequence * 20,
): TelemetrySample {
  return {
    tMs: timeMs,
    seq: sequence,
    source: "physical",
    poseAvailable: true,
    xMm: sequence,
    yMm: 0,
    headingRad: 0,
    leftEffort: 0.2,
    rightEffort: 0.2,
    leftWheelSpeedMmS: 100,
    rightWheelSpeedMmS: 100,
    leftEncoderCount: sequence,
    rightEncoderCount: sequence,
    collision: false,
    rangeMm: null,
    buttonPressed: false,
    accelerationMg: null,
    angularRateMdps: null,
    temperatureC: null,
    batteryV: null,
    sensorError: null,
  };
}

describe("physical target", () => {
  it("marks HTTPS-to-HTTP device requests as local-network traffic", () => {
    expect(
      localNetworkRequestInit(
        "http://192.168.7.30",
        { method: "GET" },
        "https:",
      ),
    ).toEqual({ method: "GET", targetAddressSpace: "local" });
    expect(
      localNetworkRequestInit(
        "http://192.168.7.30",
        { method: "GET" },
        "http:",
      ),
    ).toEqual({ method: "GET" });
    expect(
      localNetworkRequestInit(
        "https://xrp.example.test",
        { method: "GET" },
        "https:",
      ),
    ).toEqual({ method: "GET" });
  });

  it("primes local-network permission in the document before starting the shared worker", async () => {
    const operations: string[] = [];
    const fetchMock = vi.fn(async () => {
      operations.push("fetch");
      return response({ ok: true });
    });

    class FakeMessagePort {
      onmessage: ((event: MessageEvent) => void) | null = null;

      start(): void {}

      postMessage(command: { requestId?: string; type: string }): void {
        if (command.type !== "connect" || command.requestId === undefined) {
          return;
        }
        operations.push("worker");
        queueMicrotask(() =>
          this.onmessage?.({
            data: {
              type: "response",
              requestId: command.requestId,
              ok: true,
            },
          } as MessageEvent),
        );
      }

      close(): void {}
    }

    class FakeSharedWorker {
      readonly port = new FakeMessagePort();
    }

    vi.stubGlobal("window", { location: { protocol: "https:" } });
    vi.stubGlobal("location", { protocol: "https:" });
    vi.stubGlobal("fetch", fetchMock);
    vi.stubGlobal("SharedWorker", FakeSharedWorker);

    const target = new PhysicalTargetClient("192.168.7.30");
    try {
      await target.connect();
      expect(operations).toEqual(["fetch", "worker"]);
      expect(fetchMock).toHaveBeenCalledWith(
        "http://192.168.7.30/api/v1/info",
        expect.objectContaining({
          cache: "no-store",
          method: "GET",
          targetAddressSpace: "local",
        }),
      );
    } finally {
      target.disconnect();
      vi.unstubAllGlobals();
    }
  });

  it("explains the Wi-Fi runtime when the browser cannot reach the XRP", async () => {
    vi.stubGlobal("window", { location: { protocol: "https:" } });
    vi.stubGlobal("location", { protocol: "https:" });
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new TypeError("Failed to fetch");
      }),
    );

    const target = new PhysicalTargetClient("192.168.4.1");
    try {
      await expect(target.connect()).rejects.toThrow(
        /Run and telemetry use Wi-Fi, not USB/,
      );
      await expect(target.connect()).rejects.toThrow(
        /course app remains available without internet/,
      );
    } finally {
      target.disconnect();
      vi.unstubAllGlobals();
    }
  });

  it("discovers and applies physical live parameters with runtime feedback", async () => {
    const paths: string[] = [];
    const bodies: Array<Record<string, unknown>> = [];
    const initialRuntime =
      '{"revision":1,"parameters":[{"name":"speed","label":"Speed","kind":"number","value":100,"minimum":50,"maximum":200,"step":5,"unit":"mm/s"}],"watches":[]}';
    const updatedRuntime =
      '{"revision":2,"parameters":[{"name":"speed","label":"Speed","kind":"number","value":100,"pendingValue":175,"minimum":50,"maximum":200,"step":5,"unit":"mm/s"}],"watches":[]}';
    const fetchMock = vi.fn(
      async (input: URL | RequestInfo, init?: RequestInit) => {
        const path = String(input);
        paths.push(path);
        if (!init || init.method === "GET") {
          return response({
            protocol: 1,
            serviceVersion: CURRENT_COURSE_RELEASE,
            courseRelease: CURRENT_COURSE_RELEASE,
            bootId: "boot-a",
            robotName: "xrp-test",
            address: "192.168.7.30",
            runtimeJson: initialRuntime,
            capabilities: [
              "project.check",
              "project.prepare",
              "project.run",
              "program.run",
              "program.stop",
              "target.reset",
              "telemetry.poll",
              "runtime.parameters",
            ],
          });
        }
        const body = JSON.parse(String(init.body)) as Record<string, unknown>;
        bodies.push(body);
        return response({
          protocol: 1,
          requestId: body.requestId,
          ok: true,
          result: { runtimeJson: updatedRuntime },
        });
      },
    );
    const target = new DirectPhysicalTargetClient("192.168.7.30", {
      fetch: fetchMock as typeof fetch,
      pollIntervalMs: 60_000,
    });
    const events: TargetEvent[] = [];
    target.subscribe((event) => events.push(event));

    await target.connect();
    await target.setRuntimeParameter("speed", 175);

    expect(paths.at(-1)).toBe("http://192.168.7.30/api/v1/parameter");
    expect(bodies.at(-1)).toEqual(
      expect.objectContaining({ name: "speed", value: 175 }),
    );
    expect(events).toContainEqual({
      type: "runtime",
      state: expect.objectContaining({
        revision: 2,
        parameters: [expect.objectContaining({ pendingValue: 175 })],
      }),
    });
    target.disconnect();
  });

  it("reports the active robot network without exposing its credentials", async () => {
    const fetchMock = vi.fn(async () =>
      response({
        protocol: 1,
        serviceVersion: CURRENT_COURSE_RELEASE,
        courseRelease: CURRENT_COURSE_RELEASE,
        bootId: "boot-ap",
        robotId: "4c91fae8f1775aa4",
        robotName: "ucsb-xrp",
        address: "192.168.4.1",
        network: {
          mode: "access_point",
          requested_mode: "station",
          fallback: true,
          ssid: "UCSB-XRP-AA71",
        },
        capabilities: [
          "project.check",
          "project.prepare",
          "program.run",
          "program.stop",
          "target.reset",
          "telemetry.poll",
        ],
      }),
    );
    const target = new DirectPhysicalTargetClient("192.168.4.1", {
      fetch: fetchMock as typeof fetch,
      pollIntervalMs: 60_000,
    });
    const events: TargetEvent[] = [];
    target.subscribe((event) => events.push(event));

    await target.connect();

    expect(events).toContainEqual({
      type: "status",
      state: "ready",
      detail: `ucsb-xrp · UCSB-XRP-AA71 fallback · 192.168.4.1 · course ${CURRENT_COURSE_RELEASE}`,
    });
    expect(events).toContainEqual({
      type: "physical-network",
      mode: "access_point",
      address: "http://192.168.4.1",
      ssid: "UCSB-XRP-AA71",
      requestedMode: "station",
      fallback: true,
      robotId: "4c91fae8f1775aa4",
      hostname: "ucsb-xrp",
    });
    target.disconnect();
  });

  it("rejects a compatible service with the wrong robot identity before publishing it", async () => {
    const fetchMock = vi.fn(async () =>
      response({
        protocol: 1,
        serviceVersion: CURRENT_COURSE_RELEASE,
        courseRelease: CURRENT_COURSE_RELEASE,
        bootId: "boot-wrong-robot",
        robotId: "robot-b",
        robotName: "ucsb-xrp-b",
        address: "192.168.7.40",
        network: {
          mode: "station",
          requested_mode: "station",
          fallback: false,
          ssid: "Pink",
        },
        capabilities: [
          "project.check",
          "project.prepare",
          "program.run",
          "program.stop",
          "target.reset",
          "telemetry.poll",
        ],
      }),
    );
    const target = new DirectPhysicalTargetClient("192.168.7.40", {
      fetch: fetchMock as typeof fetch,
      expectedRobotId: "robot-a",
      pollIntervalMs: 60_000,
    });
    const events: TargetEvent[] = [];
    target.subscribe((event) => events.push(event));

    await expect(target.connect()).rejects.toMatchObject({
      code: "robot_identity_mismatch",
      message: expect.stringContaining("configured for robot-a"),
    });
    expect(events).not.toContainEqual(
      expect.objectContaining({ type: "physical-network" }),
    );
    expect(events).not.toContainEqual(
      expect.objectContaining({ type: "status", state: "ready" }),
    );
    target.disconnect();
  });

  it("recovers through the alternate known endpoint within a short discovery timeout", async () => {
    const fetchMock = vi.fn(async (input: URL | RequestInfo) => {
      const url = String(input);
      if (url.startsWith("http://192.168.7.30")) {
        throw new TypeError("station address unavailable");
      }
      return response({
        protocol: 1,
        serviceVersion: CURRENT_COURSE_RELEASE,
        courseRelease: CURRENT_COURSE_RELEASE,
        bootId: "boot-fallback",
        robotName: "ucsb-xrp",
        address: "192.168.4.1",
        network: {
          mode: "access_point",
          address: "192.168.4.1",
          ssid: "UCSB-XRP-TEST",
        },
        capabilities: [
          "project.check",
          "project.prepare",
          "program.run",
          "program.stop",
          "target.reset",
          "telemetry.poll",
        ],
      });
    });
    const target = new PhysicalTargetClient("192.168.7.30", {
      fetch: fetchMock as typeof fetch,
      candidateEndpoints: ["192.168.4.1"],
      discoveryTimeoutMs: 1_000,
      pollIntervalMs: 60_000,
    });
    const events: TargetEvent[] = [];
    target.subscribe((event) => events.push(event));

    await target.connect();

    expect(fetchMock.mock.calls[0]?.[0]).toBe(
      "http://192.168.7.30/api/v1/info",
    );
    expect(fetchMock.mock.calls[1]?.[0]).toBe("http://192.168.4.1/api/v1/info");
    expect(events).toContainEqual({
      type: "physical-network",
      mode: "access_point",
      address: "http://192.168.4.1",
      ssid: "UCSB-XRP-TEST",
      hostname: "ucsb-xrp",
    });
    target.disconnect();
  });

  it("skips a reachable wrong robot while discovering the commissioned identity", async () => {
    const fetchMock = vi.fn(async (input: URL | RequestInfo) => {
      const url = String(input);
      const correct = url.startsWith("http://192.168.7.31");
      return response({
        protocol: 1,
        serviceVersion: CURRENT_COURSE_RELEASE,
        courseRelease: CURRENT_COURSE_RELEASE,
        bootId: correct ? "boot-a" : "boot-b",
        robotId: correct ? "robot-a" : "robot-b",
        robotName: correct ? "ucsb-xrp-a" : "ucsb-xrp-b",
        address: correct ? "192.168.7.31" : "192.168.7.30",
        network: {
          mode: "station",
          address: correct ? "192.168.7.31" : "192.168.7.30",
          ssid: "Pink",
        },
        capabilities: [
          "project.check",
          "project.prepare",
          "program.run",
          "program.stop",
          "target.reset",
          "telemetry.poll",
        ],
      });
    });
    const target = new PhysicalTargetClient("192.168.7.30", {
      fetch: fetchMock as typeof fetch,
      candidateEndpoints: ["192.168.7.31"],
      expectedRobotId: "robot-a",
      pollIntervalMs: 60_000,
    });
    const events: TargetEvent[] = [];
    target.subscribe((event) => events.push(event));

    await target.connect();

    expect(fetchMock.mock.calls.slice(0, 2).map((call) => call[0])).toEqual([
      "http://192.168.7.30/api/v1/info",
      "http://192.168.7.31/api/v1/info",
    ]);
    expect(events).toContainEqual(
      expect.objectContaining({
        type: "physical-network",
        address: "http://192.168.7.31",
        robotId: "robot-a",
      }),
    );
    expect(events).not.toContainEqual(
      expect.objectContaining({
        type: "physical-network",
        robotId: "robot-b",
      }),
    );
    target.disconnect();
  });

  it.each([
    {
      field: "course release",
      serviceVersion: CURRENT_COURSE_RELEASE,
      courseRelease: "older-release",
    },
    {
      field: "service",
      serviceVersion: "older-service",
      courseRelease: CURRENT_COURSE_RELEASE,
    },
  ])(
    "directs students to repair an XRP with an older $field",
    async ({ serviceVersion, courseRelease }) => {
      const fetchMock = vi.fn(async () =>
        response({
          protocol: 1,
          serviceVersion,
          courseRelease,
          bootId: "boot-old",
          robotName: "ucsb-xrp",
          address: "192.168.4.1",
          capabilities: [
            "project.check",
            "project.prepare",
            "program.run",
            "program.stop",
            "target.reset",
            "telemetry.poll",
          ],
        }),
      );
      const target = new DirectPhysicalTargetClient("192.168.4.1", {
        fetch: fetchMock as typeof fetch,
        pollIntervalMs: 60_000,
      });

      await expect(target.connect()).rejects.toMatchObject({
        code: "release_mismatch",
        message: expect.stringContaining("Open Set up or repair XRP"),
      });
      target.disconnect();
    },
  );

  it("accepts a newer compatible runtime without equating service and course versions", async () => {
    const fetchMock = vi.fn(async () =>
      response({
        protocol: 1,
        protocolRevision: CURRENT_PROTOCOL_REVISION,
        serviceVersion: "0.2.0",
        courseRelease: "2026.09",
        runtimeRelease: "2026.09",
        runtimeReleaseSequence: CURRENT_ROBOT_RELEASE_SEQUENCE + 1,
        runtimeManifestSha256: "a".repeat(64),
        courseApiRevision: CURRENT_COURSE_API_REVISION,
        courseLibraryVersion: "0.4.1",
        bootstrapVersion: 1,
        bootId: "boot-newer",
        robotName: "ucsb-xrp-test",
        address: "192.168.7.30",
        capabilities: [
          "project.check",
          "project.prepare",
          "program.run",
          "program.stop",
          "target.reset",
          "telemetry.poll",
        ],
      }),
    );
    const target = new DirectPhysicalTargetClient("192.168.7.30", {
      fetch: fetchMock as typeof fetch,
      pollIntervalMs: 60_000,
    });

    await expect(target.connect()).resolves.toBeUndefined();
    target.disconnect();
  });

  it("starts a new browser session at the retained device-log tail", async () => {
    const requestedUrls: string[] = [];
    const fetchMock = vi.fn(async (input: URL | RequestInfo) => {
      const url = String(input);
      requestedUrls.push(url);
      if (url.endsWith("/api/v1/info")) {
        return response({
          protocol: 1,
          serviceVersion: CURRENT_COURSE_RELEASE,
          courseRelease: CURRENT_COURSE_RELEASE,
          bootId: "boot-a",
          robotName: "xrp-test",
          address: "192.168.7.30",
          capabilities: [
            "project.check",
            "project.prepare",
            "program.run",
            "program.stop",
            "target.reset",
            "telemetry.poll",
            "logs.poll",
          ],
        });
      }
      if (url.includes("/api/v1/state")) {
        return response({
          bootId: "boot-a",
          state: "ready",
          detail: "Physical XRP ready",
          runId: 4,
          logs: [{ seq: 41, stream: "stdout", line: "earlier browser output" }],
        });
      }
      return response({
        bootId: "boot-a",
        state: "ready",
        detail: "Physical XRP ready",
        runId: 4,
        logs: [{ seq: 42, stream: "stdout", line: "new browser output" }],
        samples: [],
      });
    });
    const target = new DirectPhysicalTargetClient("192.168.7.30", {
      fetch: fetchMock as typeof fetch,
      pollIntervalMs: 60_000,
    });
    const events: TargetEvent[] = [];
    target.subscribe((event) => events.push(event));

    await target.connect();
    await vi.waitFor(() =>
      expect(requestedUrls).toContain(
        "http://192.168.7.30/api/v1/telemetry?afterLogSeq=41&afterSampleSeq=0&runId=4",
      ),
    );

    expect(events).not.toContainEqual(
      expect.objectContaining({ line: "earlier browser output" }),
    );
    expect(events).toContainEqual(
      expect.objectContaining({ line: "new browser output" }),
    );
    target.disconnect();
  });

  it("requires boot-lifetime project preparation capability", async () => {
    const fetchMock = vi.fn(async () =>
      response({
        protocol: 1,
        serviceVersion: CURRENT_COURSE_RELEASE,
        courseRelease: CURRENT_COURSE_RELEASE,
        bootId: "boot-old-transfer",
        robotName: "ucsb-xrp-test",
        address: "192.168.7.30",
        capabilities: [
          "project.check",
          "project.sync",
          "program.run",
          "program.stop",
          "target.reset",
          "telemetry.poll",
        ],
      }),
    );
    const target = new DirectPhysicalTargetClient("192.168.7.30", {
      fetch: fetchMock as typeof fetch,
      pollIntervalMs: 60_000,
    });

    await expect(target.connect()).rejects.toMatchObject({
      code: "capability_mismatch",
      message: expect.stringContaining("project.prepare"),
    });
    target.disconnect();
  });

  it.each([
    {
      label: "runtime generation",
      runtimeReleaseSequence: MINIMUM_ROBOT_RELEASE_SEQUENCE - 1,
      courseApiRevision: CURRENT_COURSE_API_REVISION,
      protocolRevision: CURRENT_PROTOCOL_REVISION,
      code: "release_mismatch",
    },
    {
      label: "course API",
      runtimeReleaseSequence: CURRENT_ROBOT_RELEASE_SEQUENCE,
      courseApiRevision: "older-api",
      protocolRevision: CURRENT_PROTOCOL_REVISION,
      code: "release_mismatch",
    },
    {
      label: "protocol revision",
      runtimeReleaseSequence: CURRENT_ROBOT_RELEASE_SEQUENCE,
      courseApiRevision: CURRENT_COURSE_API_REVISION,
      protocolRevision: CURRENT_PROTOCOL_REVISION - 1,
      code: "protocol_mismatch",
    },
  ])(
    "rejects an incompatible transactional runtime by $label",
    async ({
      runtimeReleaseSequence,
      courseApiRevision,
      protocolRevision,
      code,
    }) => {
      const fetchMock = vi.fn(async () =>
        response({
          protocol: 1,
          protocolRevision,
          serviceVersion: "0.1.0",
          courseRelease: "candidate",
          runtimeRelease: "candidate",
          runtimeReleaseSequence,
          courseApiRevision,
          bootId: "boot-candidate",
          robotName: "ucsb-xrp-test",
          address: "192.168.7.30",
          capabilities: [],
        }),
      );
      const target = new DirectPhysicalTargetClient("192.168.7.30", {
        fetch: fetchMock as typeof fetch,
        pollIntervalMs: 60_000,
      });

      await expect(target.connect()).rejects.toMatchObject({ code });
      target.disconnect();
    },
  );

  it("discovers and runs the retained project without another transfer", async () => {
    const revision =
      "94c8db611816a391e40858466e242721dc446e44bf0b02688f5a63056c5d73e3";
    const fetchMock = vi.fn(
      async (input: URL | RequestInfo, init?: RequestInit) => {
        if (!init || init.method === "GET") {
          return response({
            protocol: 1,
            serviceVersion: CURRENT_COURSE_RELEASE,
            courseRelease: CURRENT_COURSE_RELEASE,
            bootId: "boot-a",
            robotName: "xrp-test",
            address: "192.168.7.30",
            project: {
              name: "Retained project",
              entrypoint: "main.py",
              revision,
            },
            capabilities: [
              "project.check",
              "project.prepare",
              "project.run",
              "program.run",
              "program.stop",
              "target.reset",
              "telemetry.poll",
            ],
          });
        }
        const body = JSON.parse(String(init.body)) as { requestId: string };
        return response({
          protocol: 1,
          requestId: body.requestId,
          ok: true,
          result: { detail: "Running main.py", runId: 2 },
        });
      },
    );
    const target = new DirectPhysicalTargetClient("192.168.7.30", {
      fetch: fetchMock as typeof fetch,
      pollIntervalMs: 60_000,
    });
    const events: TargetEvent[] = [];
    target.subscribe((event) => events.push(event));

    await target.connect();
    await target.runCurrent();

    expect(events).toContainEqual({
      type: "project",
      project: {
        name: "Retained project",
        entrypoint: "main.py",
        revision,
        stale: false,
      },
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    target.disconnect();
  });

  it("prepares the staged IDE revision before Monitor runs it", async () => {
    const retained = {
      ...project,
      name: "Retained project",
    };
    const changed = {
      ...retained,
      files: { "main.py": "print('changed')\n" },
    };
    const changedRevision = (await describeProject(changed)).revision;
    const retainedRevision =
      "f8ecfeb351b02819619f5bd6fd842977da0a01e5ef682f2b58a3db6f0ae7df27";
    let postCount = 0;
    const fetchMock = vi.fn(
      async (_input: URL | RequestInfo, init?: RequestInit) => {
        if (!init || init.method === "GET") {
          return response({
            protocol: 1,
            serviceVersion: CURRENT_COURSE_RELEASE,
            courseRelease: CURRENT_COURSE_RELEASE,
            bootId: "boot-a",
            robotName: "xrp-test",
            address: "192.168.7.30",
            project: {
              name: retained.name,
              entrypoint: retained.entrypoint,
              revision: retainedRevision,
            },
            capabilities: [
              "project.check",
              "project.prepare",
              "project.run",
              "program.run",
              "program.stop",
              "target.reset",
              "telemetry.poll",
            ],
          });
        }
        const body = JSON.parse(String(init.body)) as { requestId: string };
        postCount += 1;
        return response({
          protocol: 1,
          requestId: body.requestId,
          ok: true,
          result: {
            detail: "1 Python files compiled; starting main.py",
            checked: 1,
            runId: 3,
            project: {
              name: changed.name,
              entrypoint: changed.entrypoint,
              revision: changedRevision,
              lifetime: "boot",
            },
          },
        });
      },
    );
    const target = new DirectPhysicalTargetClient("192.168.7.30", {
      fetch: fetchMock as typeof fetch,
      pollIntervalMs: 60_000,
    });
    const events: TargetEvent[] = [];
    target.subscribe((event) => events.push(event));

    await target.connect();
    await target.markProjectStale(changed);
    await target.runCurrent();
    expect(postCount).toBe(1);
    expect(events).toContainEqual(
      expect.objectContaining({
        type: "project",
        project: expect.objectContaining({ stale: true }),
      }),
    );
    expect(events).toContainEqual({
      type: "status",
      state: "loading",
      detail: "Starting main.py",
    });
    expect(events).not.toContainEqual({
      type: "console",
      stream: "system",
      line: "Running main.py",
    });
    target.disconnect();
  });

  it("keeps an edited IDE project stale while telemetry reports the retained device project", async () => {
    vi.useFakeTimers();
    const retainedRevision =
      "f8ecfeb351b02819619f5bd6fd842977da0a01e5ef682f2b58a3db6f0ae7df27";
    const fetchMock = vi.fn(async (input: URL | RequestInfo) => {
      if (String(input).includes("/api/v1/telemetry")) {
        return response({
          bootId: "boot-a",
          state: "ready",
          detail: "Physical XRP ready",
          runId: 0,
          project: {
            name: "Retained project",
            entrypoint: "main.py",
            revision: retainedRevision,
          },
          logs: [],
          samples: [],
        });
      }
      return response({
        protocol: 1,
        serviceVersion: CURRENT_COURSE_RELEASE,
        courseRelease: CURRENT_COURSE_RELEASE,
        bootId: "boot-a",
        robotName: "xrp-test",
        address: "192.168.7.30",
        project: {
          name: "Retained project",
          entrypoint: "main.py",
          revision: retainedRevision,
        },
        capabilities: [
          "project.check",
          "project.prepare",
          "program.run",
          "program.stop",
          "target.reset",
          "telemetry.poll",
        ],
      });
    });
    const target = new DirectPhysicalTargetClient("192.168.7.30", {
      fetch: fetchMock as typeof fetch,
      pollIntervalMs: 10,
    });
    const events: TargetEvent[] = [];
    target.subscribe((event) => events.push(event));

    try {
      await target.connect();
      target.markProjectChanged({
        projectId: "project-1",
        revision: 2,
        name: "Edited project",
        entrypoint: "main.py",
      });
      await vi.advanceTimersByTimeAsync(20);

      expect(events.filter((event) => event.type === "project").at(-1)).toEqual(
        {
          type: "project",
          project: {
            name: "Edited project",
            entrypoint: "main.py",
            revision: "ide:project-1:2",
            stale: true,
          },
        },
      );
    } finally {
      target.disconnect();
      vi.useRealTimers();
    }
  });

  it("does not start polling after disconnecting during discovery", async () => {
    let resolveDiscovery: ((value: Response) => void) | undefined;
    const fetchMock = vi.fn(
      () =>
        new Promise<Response>((resolve) => {
          resolveDiscovery = resolve;
        }),
    );
    const target = new DirectPhysicalTargetClient("192.168.7.30", {
      fetch: fetchMock as typeof fetch,
      pollIntervalMs: 1,
    });
    const events: TargetEvent[] = [];
    target.subscribe((event) => events.push(event));

    const connection = target.connect();
    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    target.disconnect();
    resolveDiscovery?.(
      response({
        protocol: 1,
        serviceVersion: CURRENT_COURSE_RELEASE,
        courseRelease: CURRENT_COURSE_RELEASE,
        robotName: "xrp-test",
        address: "192.168.7.30",
        capabilities: [
          "project.check",
          "project.prepare",
          "program.run",
          "program.stop",
          "target.reset",
          "telemetry.poll",
        ],
      }),
    );
    await connection;
    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(events.at(-1)).toEqual({
      type: "status",
      state: "disconnected",
      detail: "Physical XRP disconnected",
    });
  });

  it("notifies the shared connection before closing its browser port", async () => {
    vi.useFakeTimers();
    const originalDescriptor = Object.getOwnPropertyDescriptor(
      globalThis,
      "SharedWorker",
    );
    const posted: unknown[] = [];
    const close = vi.fn();
    const port = {
      onmessage: null as ((event: MessageEvent) => void) | null,
      start: vi.fn(),
      close,
      postMessage(message: { type: string; requestId?: string }) {
        posted.push(message);
        if (message.type === "connect" && message.requestId) {
          queueMicrotask(() =>
            this.onmessage?.({
              data: {
                type: "response",
                requestId: message.requestId,
                ok: true,
              },
            } as MessageEvent),
          );
        }
      },
    };
    class FakeSharedWorker {
      readonly port = port;
    }
    Object.defineProperty(globalThis, "SharedWorker", {
      configurable: true,
      value: FakeSharedWorker,
    });

    try {
      const target = new PhysicalTargetClient("192.168.7.30");
      await target.connect();
      target.disconnect();

      expect(posted.at(-1)).toEqual({ type: "disconnect" });
      expect(close).not.toHaveBeenCalled();
      await vi.advanceTimersByTimeAsync(100);
      expect(close).toHaveBeenCalledOnce();
    } finally {
      vi.useRealTimers();
      if (originalDescriptor) {
        Object.defineProperty(globalThis, "SharedWorker", originalDescriptor);
      } else {
        Reflect.deleteProperty(globalThis, "SharedWorker");
      }
    }
  });

  it("uses target deadlines and rejects pending commands if the shared worker fails", async () => {
    const originalDescriptor = Object.getOwnPropertyDescriptor(
      globalThis,
      "SharedWorker",
    );
    const port = {
      onmessage: null as ((event: MessageEvent) => void) | null,
      start: vi.fn(),
      close: vi.fn(),
      postMessage(message: { type: string; requestId?: string }) {
        if (message.type === "connect" && message.requestId) {
          queueMicrotask(() =>
            this.onmessage?.({
              data: {
                type: "response",
                requestId: message.requestId,
                ok: true,
              },
            } as MessageEvent),
          );
        }
      },
    };
    const sharedWorkers: FakeSharedWorker[] = [];
    class FakeSharedWorker {
      readonly port = port;
      onerror: ((event: ErrorEvent) => void) | null = null;

      constructor() {
        sharedWorkers.push(this);
      }
    }
    Object.defineProperty(globalThis, "SharedWorker", {
      configurable: true,
      value: FakeSharedWorker,
    });

    try {
      const target = new PhysicalTargetClient("192.168.7.30");
      await target.connect();

      const check = target.check(project);
      expect(sharedWorkers).toHaveLength(1);
      sharedWorkers[0]?.onerror?.({
        message: "worker crashed",
        preventDefault: vi.fn(),
      } as unknown as ErrorEvent);
      await expect(check).rejects.toThrow(
        "Physical target worker failed: worker crashed",
      );

      target.disconnect();
    } finally {
      if (originalDescriptor) {
        Object.defineProperty(globalThis, "SharedWorker", originalDescriptor);
      } else {
        Reflect.deleteProperty(globalThis, "SharedWorker");
      }
    }
  });

  it("keeps a failed shared port attached so another tab can restore it", async () => {
    vi.useFakeTimers();
    const originalDescriptor = Object.getOwnPropertyDescriptor(
      globalThis,
      "SharedWorker",
    );
    const originalFetch = globalThis.fetch;
    const fetchMock = vi.fn();
    globalThis.fetch = fetchMock as typeof fetch;
    const posted: unknown[] = [];
    const port = {
      onmessage: null as ((event: MessageEvent) => void) | null,
      start: vi.fn(),
      close: vi.fn(),
      postMessage(message: { type: string; requestId?: string }) {
        posted.push(message);
        if (message.type === "connect" && message.requestId) {
          queueMicrotask(() =>
            this.onmessage?.({
              data: {
                type: "response",
                requestId: message.requestId,
                ok: false,
                error: "XRP unavailable",
              },
            } as MessageEvent),
          );
        }
      },
    };
    class FakeSharedWorker {
      readonly port = port;
    }
    Object.defineProperty(globalThis, "SharedWorker", {
      configurable: true,
      value: FakeSharedWorker,
    });

    try {
      const target = new PhysicalTargetClient("192.168.7.30");
      await expect(target.connect()).rejects.toThrow("XRP unavailable");

      expect(fetchMock).not.toHaveBeenCalled();
      expect(posted.at(-1)).toEqual(
        expect.objectContaining({ type: "connect" }),
      );
      await vi.advanceTimersByTimeAsync(100);
      expect(port.close).not.toHaveBeenCalled();
      target.disconnect();
      expect(posted.at(-1)).toEqual({ type: "disconnect" });
      await vi.advanceTimersByTimeAsync(100);
      expect(port.close).toHaveBeenCalledOnce();
    } finally {
      vi.useRealTimers();
      globalThis.fetch = originalFetch;
      if (originalDescriptor) {
        Object.defineProperty(globalThis, "SharedWorker", originalDescriptor);
      } else {
        Reflect.deleteProperty(globalThis, "SharedWorker");
      }
    }
  });

  it("invokes the browser fetch function with its global receiver", async () => {
    const originalFetch = globalThis.fetch;
    let observedReceiver: unknown;
    globalThis.fetch = vi.fn(function (this: unknown) {
      observedReceiver = this;
      return Promise.resolve(
        response({
          protocol: 1,
          serviceVersion: CURRENT_COURSE_RELEASE,
          courseRelease: CURRENT_COURSE_RELEASE,
          robotName: "xrp-test",
          address: "192.168.7.30",
          capabilities: [
            "project.check",
            "project.prepare",
            "program.run",
            "program.stop",
            "target.reset",
            "telemetry.poll",
          ],
        }),
      );
    }) as typeof fetch;
    try {
      const target = new PhysicalTargetClient("192.168.7.30", {
        pollIntervalMs: 60_000,
      });
      await target.connect();
      target.disconnect();
      expect(observedReceiver).toBe(globalThis);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it("normalizes an instructor-entered host or URL", () => {
    expect(normalizePhysicalEndpoint("192.168.7.30/")).toBe(
      "http://192.168.7.30",
    );
    expect(
      normalizePhysicalEndpoint("http://xrp.local/path///?ignored=1"),
    ).toBe("http://xrp.local/path");
  });

  it("leaves a quiet window between the run reply and telemetry polling", async () => {
    vi.useFakeTimers();
    const paths: string[] = [];
    const fetchMock = vi.fn(
      async (input: URL | RequestInfo, init?: RequestInit) => {
        const path = String(input);
        paths.push(path);
        if (!init || init.method === "GET") {
          if (path.includes("/api/v1/telemetry")) {
            return response({
              bootId: "boot-a",
              state: "running",
              detail: "Running main.py",
              runId: 1,
              logs: [],
            });
          }
          return response({
            protocol: 1,
            serviceVersion: CURRENT_COURSE_RELEASE,
            courseRelease: CURRENT_COURSE_RELEASE,
            bootId: "boot-a",
            robotName: "xrp-test",
            address: "192.168.7.30",
            project: {
              name: "Retained project",
              entrypoint: "main.py",
              revision:
                "94c8db611816a391e40858466e242721dc446e44bf0b02688f5a63056c5d73e3",
            },
            capabilities: [
              "project.check",
              "project.prepare",
              "program.run",
              "program.stop",
              "target.reset",
              "telemetry.poll",
            ],
          });
        }
        const body = JSON.parse(String(init.body)) as { requestId: string };
        return response({
          protocol: 1,
          requestId: body.requestId,
          ok: true,
          result: { detail: "Starting main.py", runId: 1 },
        });
      },
    );
    const target = new DirectPhysicalTargetClient("192.168.7.30", {
      fetch: fetchMock as typeof fetch,
      pollIntervalMs: 250,
    });

    await target.connect();
    await target.runCurrent();
    await vi.advanceTimersByTimeAsync(499);
    expect(paths.some((path) => path.includes("/api/v1/telemetry"))).toBe(
      false,
    );
    await vi.advanceTimersByTimeAsync(1);
    expect(paths).toContain(
      "http://192.168.7.30/api/v1/telemetry?afterLogSeq=0&afterSampleSeq=0&runId=1",
    );
    expect(paths.some((path) => path.endsWith("/api/v1/lease"))).toBe(false);
    target.disconnect();
    vi.useRealTimers();
  });

  it("uses the buffered active cadence without raising the idle rate", async () => {
    vi.useFakeTimers();
    let telemetryRequests = 0;
    const fetchMock = vi.fn(async (input: URL | RequestInfo) => {
      if (String(input).includes("/api/v1/telemetry")) {
        telemetryRequests += 1;
        return response({
          bootId: "boot-a",
          state: telemetryRequests === 1 ? "running" : "ready",
          detail:
            telemetryRequests === 1 ? "Running main.py" : "Program completed",
          runId: 1,
          logs: [],
        });
      }
      return response({
        protocol: 1,
        serviceVersion: CURRENT_COURSE_RELEASE,
        courseRelease: CURRENT_COURSE_RELEASE,
        bootId: "boot-a",
        robotName: "xrp-test",
        address: "192.168.7.30",
        project: null,
        capabilities: [
          "project.check",
          "project.prepare",
          "program.run",
          "program.stop",
          "target.reset",
          "telemetry.poll",
        ],
      });
    });
    const target = new DirectPhysicalTargetClient("192.168.7.30", {
      fetch: fetchMock as typeof fetch,
    });

    try {
      await target.connect();
      await vi.advanceTimersByTimeAsync(0);
      expect(telemetryRequests).toBe(1);

      await vi.advanceTimersByTimeAsync(124);
      expect(telemetryRequests).toBe(1);
      await vi.advanceTimersByTimeAsync(1);
      expect(telemetryRequests).toBe(2);

      await vi.advanceTimersByTimeAsync(249);
      expect(telemetryRequests).toBe(2);
      await vi.advanceTimersByTimeAsync(1);
      expect(telemetryRequests).toBe(3);
    } finally {
      target.disconnect();
      vi.useRealTimers();
    }
  });

  it("emits a physical telemetry batch in sequence order without duplicates", async () => {
    vi.useFakeTimers();
    const requestedUrls: string[] = [];
    const replies = [
      {
        bootId: "boot-a",
        state: "running",
        detail: "Running main.py",
        runId: 1,
        logs: [],
        samples: [
          physicalSample(4),
          physicalSample(2),
          physicalSample(3),
          physicalSample(3),
        ],
        sample: physicalSample(4),
      },
      {
        bootId: "boot-a",
        state: "running",
        detail: "Running main.py",
        runId: 1,
        logs: [],
        samples: [physicalSample(4), physicalSample(5), physicalSample(6)],
        sample: physicalSample(6),
      },
    ];
    const fetchMock = vi.fn(async (input: URL | RequestInfo) => {
      const url = String(input);
      requestedUrls.push(url);
      if (url.endsWith("/api/v1/info")) {
        return response({
          protocol: 1,
          serviceVersion: CURRENT_COURSE_RELEASE,
          courseRelease: CURRENT_COURSE_RELEASE,
          bootId: "boot-a",
          robotName: "xrp-test",
          address: "192.168.7.30",
          capabilities: [
            "project.check",
            "project.prepare",
            "program.run",
            "program.stop",
            "target.reset",
            "telemetry.poll",
          ],
        });
      }
      return response(
        replies.shift() ?? {
          bootId: "boot-a",
          state: "ready",
          detail: "Program completed",
          runId: 1,
          logs: [],
          samples: [],
          sample: physicalSample(6),
        },
      );
    });
    const target = new DirectPhysicalTargetClient("192.168.7.30", {
      fetch: fetchMock as typeof fetch,
      activePollIntervalMs: 10,
      pollIntervalMs: 10,
    });
    const events: TargetEvent[] = [];
    target.subscribe((event) => events.push(event));

    try {
      await target.connect();
      await vi.advanceTimersByTimeAsync(0);
      await vi.advanceTimersByTimeAsync(10);

      expect(
        events
          .filter((event) => event.type === "telemetry")
          .map((event) => event.sample.seq),
      ).toEqual([2, 3, 4, 5, 6]);
      expect(requestedUrls).toContain(
        "http://192.168.7.30/api/v1/telemetry?afterLogSeq=0&afterSampleSeq=0",
      );
      expect(requestedUrls).toContain(
        "http://192.168.7.30/api/v1/telemetry?afterLogSeq=0&afterSampleSeq=4&runId=1",
      );
    } finally {
      target.disconnect();
      vi.useRealTimers();
    }
  });

  it("drains bounded telemetry pages before publishing the terminal state", async () => {
    vi.useFakeTimers();
    const requestedUrls: string[] = [];
    const replies = [
      {
        bootId: "boot-a",
        state: "ready",
        detail: "Program completed",
        runId: 1,
        logs: [{ seq: 1, stream: "stdout", line: "first page" }],
        samples: [physicalSample(1)],
        sample: physicalSample(1),
        moreLogs: true,
        moreSamples: true,
      },
      {
        bootId: "boot-a",
        state: "ready",
        detail: "Program completed",
        runId: 1,
        logs: [{ seq: 2, stream: "stdout", line: "final page" }],
        samples: [physicalSample(2)],
        sample: physicalSample(2),
        moreLogs: false,
        moreSamples: false,
      },
    ];
    const fetchMock = vi.fn(async (input: URL | RequestInfo) => {
      const url = String(input);
      requestedUrls.push(url);
      if (url.endsWith("/api/v1/info")) {
        return response({
          protocol: 1,
          serviceVersion: CURRENT_COURSE_RELEASE,
          courseRelease: CURRENT_COURSE_RELEASE,
          bootId: "boot-a",
          robotName: "xrp-test",
          address: "192.168.7.30",
          capabilities: [
            "project.check",
            "project.prepare",
            "program.run",
            "program.stop",
            "target.reset",
            "telemetry.poll",
          ],
        });
      }
      return response(replies.shift());
    });
    const target = new DirectPhysicalTargetClient("192.168.7.30", {
      fetch: fetchMock as typeof fetch,
      activePollIntervalMs: 10_000,
      pollIntervalMs: 10_000,
    });
    const events: TargetEvent[] = [];
    target.subscribe((event) => events.push(event));

    try {
      await target.connect();
      events.length = 0;
      await vi.advanceTimersByTimeAsync(0);
      await vi.advanceTimersByTimeAsync(1);

      expect(requestedUrls).toContain(
        "http://192.168.7.30/api/v1/telemetry?afterLogSeq=0&afterSampleSeq=0",
      );
      expect(requestedUrls).toContain(
        "http://192.168.7.30/api/v1/telemetry?afterLogSeq=1&afterSampleSeq=1&runId=1",
      );
      expect(
        events
          .filter((event) => event.type === "console")
          .map((event) => event.line),
      ).toEqual(["first page", "final page"]);
      expect(
        events
          .filter((event) => event.type === "telemetry")
          .map((event) => event.sample.seq),
      ).toEqual([1, 2]);
      expect(
        events.filter(
          (event) => event.type === "status" && event.state === "ready",
        ),
      ).toEqual([
        { type: "status", state: "ready", detail: "Program completed" },
      ]);
    } finally {
      target.disconnect();
      vi.useRealTimers();
    }
  });

  it("starts the sample cursor again when a new physical run begins", async () => {
    vi.useFakeTimers();
    const replies = [
      {
        bootId: "boot-a",
        state: "ready",
        detail: "Program completed",
        runId: 3,
        logs: [],
        samples: [physicalSample(7)],
        sample: physicalSample(7),
      },
      {
        bootId: "boot-a",
        state: "running",
        detail: "Running main.py",
        runId: 4,
        logs: [],
        samples: [physicalSample(1, 0), physicalSample(2, 20)],
        sample: physicalSample(2, 20),
      },
    ];
    const fetchMock = vi.fn(async (input: URL | RequestInfo) => {
      if (String(input).endsWith("/api/v1/info")) {
        return response({
          protocol: 1,
          serviceVersion: CURRENT_COURSE_RELEASE,
          courseRelease: CURRENT_COURSE_RELEASE,
          bootId: "boot-a",
          robotName: "xrp-test",
          address: "192.168.7.30",
          capabilities: [
            "project.check",
            "project.prepare",
            "program.run",
            "program.stop",
            "target.reset",
            "telemetry.poll",
          ],
        });
      }
      return response(replies.shift());
    });
    const target = new DirectPhysicalTargetClient("192.168.7.30", {
      fetch: fetchMock as typeof fetch,
      activePollIntervalMs: 10,
      pollIntervalMs: 10,
    });
    const events: TargetEvent[] = [];
    target.subscribe((event) => events.push(event));

    try {
      await target.connect();
      await vi.advanceTimersByTimeAsync(0);
      await vi.advanceTimersByTimeAsync(10);

      expect(
        events
          .filter((event) => event.type === "telemetry")
          .map((event) => event.sample.seq),
      ).toEqual([7, 1, 2]);
    } finally {
      target.disconnect();
      vi.useRealTimers();
    }
  });

  it("reports retained telemetry samples lost between polls", async () => {
    vi.useFakeTimers();
    const replies = [
      {
        bootId: "boot-a",
        state: "running",
        detail: "Running main.py",
        runId: 1,
        logs: [],
        samples: [physicalSample(1), physicalSample(2)],
        sample: physicalSample(2),
      },
      {
        bootId: "boot-a",
        state: "running",
        detail: "Running main.py",
        runId: 1,
        logs: [],
        samples: [physicalSample(6), physicalSample(7)],
        sample: physicalSample(7),
      },
    ];
    const fetchMock = vi.fn(async (input: URL | RequestInfo) => {
      if (String(input).endsWith("/api/v1/info")) {
        return response({
          protocol: 1,
          serviceVersion: CURRENT_COURSE_RELEASE,
          courseRelease: CURRENT_COURSE_RELEASE,
          bootId: "boot-a",
          robotName: "xrp-test",
          address: "192.168.7.30",
          capabilities: [
            "project.check",
            "project.prepare",
            "program.run",
            "program.stop",
            "target.reset",
            "telemetry.poll",
          ],
        });
      }
      return response(replies.shift());
    });
    const target = new DirectPhysicalTargetClient("192.168.7.30", {
      fetch: fetchMock as typeof fetch,
      activePollIntervalMs: 10,
      pollIntervalMs: 10,
    });
    const events: TargetEvent[] = [];
    target.subscribe((event) => events.push(event));

    try {
      await target.connect();
      await vi.advanceTimersByTimeAsync(0);
      await vi.advanceTimersByTimeAsync(10);

      expect(
        events
          .filter((event) => event.type === "console")
          .map((event) => event.line),
      ).toContain("Telemetry gap · 3 samples unavailable");
      expect(
        events
          .filter((event) => event.type === "telemetry")
          .map((event) => event.sample.seq),
      ).toEqual([1, 2, 6, 7]);
    } finally {
      target.disconnect();
      vi.useRealTimers();
    }
  });

  it("retains single-sample polling for an older physical service", async () => {
    vi.useFakeTimers();
    let telemetryRequest = 0;
    const fetchMock = vi.fn(async (input: URL | RequestInfo) => {
      if (String(input).endsWith("/api/v1/info")) {
        return response({
          protocol: 1,
          serviceVersion: CURRENT_COURSE_RELEASE,
          courseRelease: CURRENT_COURSE_RELEASE,
          bootId: "boot-a",
          robotName: "xrp-test",
          address: "192.168.7.30",
          capabilities: [
            "project.check",
            "project.prepare",
            "program.run",
            "program.stop",
            "target.reset",
            "telemetry.poll",
          ],
        });
      }
      telemetryRequest += 1;
      return response({
        bootId: "boot-a",
        state: "ready",
        detail: "Physical XRP ready",
        runId: 0,
        logs: [],
        sample: physicalSample(telemetryRequest),
      });
    });
    const target = new DirectPhysicalTargetClient("192.168.7.30", {
      fetch: fetchMock as typeof fetch,
      pollIntervalMs: 10,
    });
    const events: TargetEvent[] = [];
    target.subscribe((event) => events.push(event));

    try {
      await target.connect();
      await vi.advanceTimersByTimeAsync(0);
      await vi.advanceTimersByTimeAsync(10);

      expect(
        events
          .filter((event) => event.type === "telemetry")
          .map((event) => event.sample.seq),
      ).toEqual([1, 2]);
    } finally {
      target.disconnect();
      vi.useRealTimers();
    }
  });

  it("discovers, checks, prepares, and runs with correlated replies", async () => {
    let requestCount = 0;
    const projectRevision = (await describeProject(project)).revision;
    const fetchMock = vi.fn(
      async (_input: URL | RequestInfo, init?: RequestInit) => {
        if (!init || init.method === "GET") {
          return response({
            protocol: 1,
            serviceVersion: CURRENT_COURSE_RELEASE,
            courseRelease: CURRENT_COURSE_RELEASE,
            robotName: "xrp-test",
            address: "192.168.7.30",
            capabilities: [
              "project.check",
              "project.prepare",
              "program.run",
              "program.stop",
              "target.reset",
              "telemetry.poll",
            ],
          });
        }
        const body = JSON.parse(String(init.body)) as { requestId: string };
        requestCount += 1;
        return response({
          protocol: 1,
          requestId: body.requestId,
          ok: true,
          result:
            requestCount === 1
              ? { detail: "1 Python files compiled" }
              : requestCount === 2
                ? {
                    detail: "Project prepared",
                    checked: 1,
                    project: {
                      name: project.entrypoint,
                      entrypoint: project.entrypoint,
                      revision: projectRevision,
                      lifetime: "boot",
                    },
                  }
                : { detail: "Running main.py", runId: 4 },
        });
      },
    );
    const target = new PhysicalTargetClient("192.168.7.30", {
      fetch: fetchMock as typeof fetch,
      pollIntervalMs: 60_000,
    });
    const events: TargetEvent[] = [];
    target.subscribe((event) => events.push(event));

    await target.connect();
    await expect(target.check(project)).resolves.toEqual({
      ok: true,
      detail: "1 Python files compiled",
    });
    await target.synchronize(project);
    await target.run(project);

    expect(requestCount).toBe(3);
    expect(fetchMock).not.toHaveBeenCalledWith(
      expect.stringContaining("/api/v1/sync"),
      expect.anything(),
    );
    expect(events).toContainEqual({
      type: "status",
      state: "ready",
      detail: "Project prepared",
    });
    expect(events).toContainEqual(
      expect.objectContaining({
        type: "console",
        line: "Prepare · Project prepared",
        action: "prepare",
        phase: "result",
      }),
    );
    expect(events).toContainEqual({
      type: "status",
      state: "loading",
      detail: "Running main.py",
    });
    expect(events).toContainEqual(
      expect.objectContaining({
        type: "console",
        stream: "system",
        line: "Compile requested · main.py",
        action: "validate",
        phase: "request",
      }),
    );
    expect(events).toContainEqual(
      expect.objectContaining({
        type: "console",
        stream: "system",
        line: "Compile · 1 Python files compiled",
        action: "validate",
        phase: "result",
      }),
    );
    expect(events).not.toContainEqual({
      type: "console",
      stream: "system",
      line: "Running main.py",
    });
    target.disconnect();
  });

  it("compiles, prepares, and starts an edited project with one device request", async () => {
    const projectRevision = (await describeProject(project)).revision;
    const postPaths: string[] = [];
    const postBodies: Array<Record<string, unknown>> = [];
    const fetchMock = vi.fn(
      async (input: URL | RequestInfo, init?: RequestInit) => {
        const path = String(input);
        if (!init || init.method === "GET") {
          return response({
            protocol: 1,
            serviceVersion: CURRENT_COURSE_RELEASE,
            courseRelease: CURRENT_COURSE_RELEASE,
            robotName: "xrp-test",
            address: "192.168.7.30",
            capabilities: [
              "project.check",
              "project.prepare",
              "project.run",
              "program.run",
              "program.stop",
              "target.reset",
              "telemetry.poll",
            ],
          });
        }
        const body = JSON.parse(String(init.body)) as Record<string, unknown>;
        postPaths.push(path);
        postBodies.push(body);
        return response({
          protocol: 1,
          requestId: body.requestId,
          ok: true,
          result: {
            detail: "1 Python files compiled; starting main.py",
            checked: 1,
            runId: 9,
            project: {
              name: project.entrypoint,
              entrypoint: project.entrypoint,
              revision: projectRevision,
              lifetime: "boot",
            },
          },
        });
      },
    );
    const target = new DirectPhysicalTargetClient("192.168.7.30", {
      fetch: fetchMock as typeof fetch,
      pollIntervalMs: 60_000,
    });

    await target.connect();
    await target.run(project);

    expect(postPaths).toEqual(["http://192.168.7.30/api/v1/run"]);
    expect(postBodies[0]).toMatchObject({ project });
    expect(postBodies[0]).toHaveProperty("requestId");
    target.disconnect();
  });

  it("requires current course software before running an edited project", async () => {
    const fetchMock = vi.fn(
      async (_input: URL | RequestInfo, _init?: RequestInit) =>
        response({
          protocol: 1,
          serviceVersion: CURRENT_COURSE_RELEASE,
          courseRelease: CURRENT_COURSE_RELEASE,
          robotName: "xrp-test",
          address: "192.168.7.30",
          capabilities: [
            "project.check",
            "project.prepare",
            "program.run",
            "program.stop",
            "target.reset",
            "telemetry.poll",
          ],
        }),
    );
    const target = new DirectPhysicalTargetClient("192.168.7.30", {
      fetch: fetchMock as typeof fetch,
      pollIntervalMs: 60_000,
    });

    await target.connect();
    await expect(target.run(project)).rejects.toMatchObject({
      code: "capability_mismatch",
      message: expect.stringContaining("Set up or Repair"),
    });
    expect(
      fetchMock.mock.calls.every(([, init]) => !init || init.method === "GET"),
    ).toBe(true);
    target.disconnect();
  });

  it("restarts log polling at sequence zero after an unannounced reboot", async () => {
    vi.useFakeTimers();
    const telemetryReplies = [
      {
        bootId: "boot-a",
        state: "ready",
        detail: "Physical XRP ready",
        runId: 0,
        logs: [{ seq: 10, stream: "stdout", line: "before reboot" }],
      },
      {
        bootId: "boot-b",
        state: "ready",
        detail: "Physical XRP ready",
        runId: 0,
        logs: [],
      },
      {
        bootId: "boot-b",
        state: "ready",
        detail: "Physical XRP ready",
        runId: 0,
        logs: [{ seq: 1, stream: "system", line: "after reboot" }],
      },
    ];
    const requestedUrls: string[] = [];
    const fetchMock = vi.fn(async (input: URL | RequestInfo) => {
      const url = String(input);
      requestedUrls.push(url);
      if (url.endsWith("/api/v1/info")) {
        return response({
          protocol: 1,
          serviceVersion: CURRENT_COURSE_RELEASE,
          courseRelease: CURRENT_COURSE_RELEASE,
          bootId: "boot-a",
          robotName: "xrp-test",
          address: "192.168.7.30",
          capabilities: [
            "project.check",
            "project.prepare",
            "program.run",
            "program.stop",
            "target.reset",
            "telemetry.poll",
          ],
        });
      }
      return response(
        telemetryReplies.shift() ??
          telemetryReplies.at(-1) ?? {
            bootId: "boot-b",
            state: "ready",
            detail: "Physical XRP ready",
            runId: 0,
            logs: [],
          },
      );
    });
    const target = new DirectPhysicalTargetClient("192.168.7.30", {
      fetch: fetchMock as typeof fetch,
      pollIntervalMs: 10,
    });
    const events: TargetEvent[] = [];
    target.subscribe((event) => events.push(event));

    try {
      await target.connect();
      await vi.advanceTimersByTimeAsync(35);

      expect(requestedUrls).toContain(
        "http://192.168.7.30/api/v1/telemetry?afterLogSeq=10&afterSampleSeq=0",
      );
      expect(requestedUrls).toContain(
        "http://192.168.7.30/api/v1/telemetry?afterLogSeq=0&afterSampleSeq=0",
      );
      expect(events).toContainEqual(
        expect.objectContaining({
          type: "console",
          stream: "system",
          line: "after reboot",
          eventId: "boot-b:log:1",
        }),
      );
    } finally {
      target.disconnect();
      vi.useRealTimers();
    }
  });

  it("waits for a stale poll and suppresses its error before Stop", async () => {
    let rejectTelemetry: ((reason: Error) => void) | undefined;
    let telemetryRequests = 0;
    let bootId = "boot-a";
    const info = () => ({
      protocol: 1,
      serviceVersion: CURRENT_COURSE_RELEASE,
      courseRelease: CURRENT_COURSE_RELEASE,
      bootId,
      robotName: "xrp-test",
      address: "192.168.7.30",
      capabilities: [
        "project.check",
        "project.prepare",
        "program.run",
        "program.stop",
        "target.reset",
        "telemetry.poll",
      ],
    });
    const fetchMock = vi.fn(
      async (input: URL | RequestInfo, init?: RequestInit) => {
        const url = String(input);
        if (url.endsWith("/api/v1/info")) {
          return response(info());
        }
        if (url.includes("/api/v1/telemetry")) {
          telemetryRequests += 1;
          if (telemetryRequests === 1) {
            return new Promise<Response>((_resolve, reject) => {
              rejectTelemetry = reject;
            });
          }
          return response({
            bootId,
            state: "ready",
            detail: "Physical XRP ready",
            runId: 0,
            logs: [],
          });
        }
        const body = JSON.parse(String(init?.body)) as { requestId: string };
        bootId = "boot-b";
        return response({
          protocol: 1,
          requestId: body.requestId,
          ok: true,
          result: { detail: "Program stopped", reconnecting: true },
        });
      },
    );
    const target = new DirectPhysicalTargetClient("192.168.7.30", {
      fetch: fetchMock as typeof fetch,
      pollIntervalMs: 1,
    });
    const events: TargetEvent[] = [];
    target.subscribe((event) => events.push(event));

    await target.connect();
    await vi.waitFor(() => expect(rejectTelemetry).toBeDefined());
    const stopping = target.stop();
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(
      fetchMock.mock.calls.some(([, init]) => init?.method === "POST"),
    ).toBe(false);
    rejectTelemetry?.(new Error("stale telemetry request failed"));
    await vi.waitFor(() =>
      expect(
        fetchMock.mock.calls.some(([, init]) => init?.method === "POST"),
      ).toBe(true),
    );
    await stopping;

    expect(events).not.toContainEqual(
      expect.objectContaining({ type: "status", state: "error" }),
    );
    expect(events).toContainEqual(
      expect.objectContaining({ type: "status", state: "ready" }),
    );
    target.disconnect();
  });

  it("stops a cooperative course program without rebooting the XRP", async () => {
    let stopPolls = 0;
    const fetchMock = vi.fn(
      async (input: URL | RequestInfo, init?: RequestInit) => {
        const url = String(input);
        if (url.endsWith("/api/v1/info")) {
          return response({
            protocol: 1,
            serviceVersion: CURRENT_COURSE_RELEASE,
            courseRelease: CURRENT_COURSE_RELEASE,
            bootId: "boot-a",
            robotName: "xrp-test",
            address: "192.168.4.1",
            capabilities: [
              "project.check",
              "project.prepare",
              "program.run",
              "program.stop",
              "target.reset",
              "telemetry.poll",
            ],
          });
        }
        if (url.includes("/api/v1/telemetry")) {
          stopPolls += 1;
          return response({
            bootId: "boot-a",
            state: stopPolls === 1 ? "loading" : "ready",
            detail: stopPolls === 1 ? "Stopping program" : "Program stopped",
            runId: 1,
            logs: [],
            samples: [],
          });
        }
        const body = JSON.parse(String(init?.body)) as { requestId: string };
        return response({
          protocol: 1,
          requestId: body.requestId,
          ok: true,
          result: { detail: "Stopping program", reconnecting: false },
        });
      },
    );
    const target = new DirectPhysicalTargetClient("192.168.4.1", {
      fetch: fetchMock as typeof fetch,
      pollIntervalMs: 10_000,
    });
    const events: TargetEvent[] = [];
    target.subscribe((event) => events.push(event));

    await target.connect();
    await target.stop();

    expect(stopPolls).toBe(2);
    expect(
      fetchMock.mock.calls.filter(([input]) =>
        String(input).endsWith("/api/v1/info"),
      ),
    ).toHaveLength(1);
    expect(events).toContainEqual(
      expect.objectContaining({ type: "status", state: "ready" }),
    );
    expect(events).not.toContainEqual(
      expect.objectContaining({ type: "status", state: "error" }),
    );
    target.disconnect();
  });

  it("resets course state cooperatively without reconnecting the XRP", async () => {
    let resetPolls = 0;
    const fetchMock = vi.fn(
      async (input: URL | RequestInfo, init?: RequestInit) => {
        const url = String(input);
        if (url.endsWith("/api/v1/info")) {
          return response({
            protocol: 1,
            serviceVersion: CURRENT_COURSE_RELEASE,
            courseRelease: CURRENT_COURSE_RELEASE,
            bootId: "boot-a",
            robotName: "xrp-test",
            address: "192.168.7.30",
            capabilities: [
              "project.check",
              "project.prepare",
              "program.run",
              "program.stop",
              "target.reset",
              "telemetry.poll",
            ],
          });
        }
        if (url.includes("/api/v1/telemetry")) {
          resetPolls += 1;
          return response({
            bootId: "boot-a",
            state: resetPolls === 1 ? "loading" : "ready",
            detail:
              resetPolls === 1
                ? "Resetting program state"
                : "Program state reset",
            runId: 1,
            logs: [],
            samples: [],
          });
        }
        const body = JSON.parse(String(init?.body)) as { requestId: string };
        return response({
          protocol: 1,
          requestId: body.requestId,
          ok: true,
          result: {
            detail: "Resetting program state",
            reconnecting: false,
          },
        });
      },
    );
    const target = new DirectPhysicalTargetClient("192.168.7.30", {
      fetch: fetchMock as typeof fetch,
      pollIntervalMs: 10_000,
    });
    const events: TargetEvent[] = [];
    target.subscribe((event) => events.push(event));

    await target.connect();
    events.length = 0;
    await target.reset();

    expect(resetPolls).toBe(2);
    expect(
      fetchMock.mock.calls.filter(([input]) =>
        String(input).endsWith("/api/v1/info"),
      ),
    ).toHaveLength(1);
    expect(events).toContainEqual(
      expect.objectContaining({
        type: "status",
        state: "ready",
        detail: "Program state reset",
      }),
    );
    expect(events).not.toContainEqual(
      expect.objectContaining({ type: "status", state: "connecting" }),
    );
    target.disconnect();
  });

  it("accepts an already-stopped reply without entering recovery", async () => {
    let telemetryRequests = 0;
    const fetchMock = vi.fn(
      async (input: URL | RequestInfo, init?: RequestInit) => {
        const url = String(input);
        if (url.endsWith("/api/v1/info")) {
          return response({
            protocol: 1,
            serviceVersion: CURRENT_COURSE_RELEASE,
            courseRelease: CURRENT_COURSE_RELEASE,
            bootId: "boot-a",
            robotName: "xrp-test",
            address: "192.168.4.1",
            capabilities: [
              "project.check",
              "project.prepare",
              "program.run",
              "program.stop",
              "target.reset",
              "telemetry.poll",
            ],
          });
        }
        if (url.includes("/api/v1/telemetry")) {
          telemetryRequests += 1;
          throw new Error("an acknowledged stopped state needs no poll");
        }
        const body = JSON.parse(String(init?.body)) as { requestId: string };
        return response({
          protocol: 1,
          requestId: body.requestId,
          ok: true,
          result: { detail: "Program already stopped", reconnecting: false },
        });
      },
    );
    const target = new DirectPhysicalTargetClient("192.168.4.1", {
      fetch: fetchMock as typeof fetch,
      pollIntervalMs: 60_000,
    });
    const events: TargetEvent[] = [];
    target.subscribe((event) => events.push(event));

    await target.connect();
    events.length = 0;
    await expect(target.stop()).resolves.toBeUndefined();

    expect(telemetryRequests).toBe(0);
    expect(events).toContainEqual(
      expect.objectContaining({
        type: "status",
        state: "ready",
        detail: "Program already stopped",
      }),
    );
    expect(events).not.toContainEqual(
      expect.objectContaining({ type: "status", state: "connecting" }),
    );
    target.disconnect();
  });

  it("renews a running project through telemetry without a lease POST", async () => {
    let telemetryRequests = 0;
    const requestedUrls: string[] = [];
    const fetchMock = vi.fn(async (input: URL | RequestInfo) => {
      const url = String(input);
      requestedUrls.push(url);
      if (url.endsWith("/api/v1/info")) {
        return response({
          protocol: 1,
          serviceVersion: CURRENT_COURSE_RELEASE,
          courseRelease: CURRENT_COURSE_RELEASE,
          bootId: "boot-a",
          robotName: "xrp-test",
          address: "192.168.4.1",
          capabilities: [
            "project.check",
            "project.prepare",
            "program.run",
            "program.stop",
            "target.reset",
            "telemetry.poll",
          ],
        });
      }
      if (url.includes("/api/v1/telemetry")) {
        telemetryRequests += 1;
        return response({
          bootId: "boot-a",
          state: "running",
          detail: "Running main.py",
          runId: 1,
          logs: [],
          samples: [],
        });
      }
      throw new Error(`Unexpected request ${url}`);
    });
    const target = new DirectPhysicalTargetClient("192.168.4.1", {
      fetch: fetchMock as typeof fetch,
      pollIntervalMs: 10,
    });

    try {
      await target.connect();
      await vi.waitFor(() =>
        expect(telemetryRequests).toBeGreaterThanOrEqual(2),
      );

      expect(requestedUrls).toContain(
        "http://192.168.4.1/api/v1/telemetry?afterLogSeq=0&afterSampleSeq=0&runId=1",
      );
      expect(requestedUrls.some((url) => url.endsWith("/api/v1/lease"))).toBe(
        false,
      );
    } finally {
      target.disconnect();
    }
  });

  it("verifies stopped state after the Stop reply is interrupted", async () => {
    const fetchMock = vi.fn(
      async (input: URL | RequestInfo, init?: RequestInit) => {
        const url = String(input);
        if (url.endsWith("/api/v1/info")) {
          return response({
            protocol: 1,
            serviceVersion: CURRENT_COURSE_RELEASE,
            courseRelease: CURRENT_COURSE_RELEASE,
            bootId: "boot-a",
            robotName: "xrp-test",
            address: "192.168.4.1",
            capabilities: [
              "project.check",
              "project.prepare",
              "program.run",
              "program.stop",
              "target.reset",
              "telemetry.poll",
            ],
          });
        }
        if (url.includes("/api/v1/telemetry")) {
          return response({
            bootId: "boot-b",
            state: "ready",
            detail: "Physical XRP ready",
            runId: 1,
            logs: [],
            samples: [],
          });
        }
        return await new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener("abort", () =>
            reject(new DOMException("Aborted", "AbortError")),
          );
        });
      },
    );
    const target = new DirectPhysicalTargetClient("192.168.4.1", {
      fetch: fetchMock as typeof fetch,
      pollIntervalMs: 60_000,
      requestTimeoutMs: 25,
    });
    const events: TargetEvent[] = [];
    target.subscribe((event) => events.push(event));

    await target.connect();
    await expect(target.stop()).resolves.toBeUndefined();

    expect(events).toContainEqual(
      expect.objectContaining({
        type: "console",
        line: "Stop reply was interrupted · checking XRP state",
      }),
    );
    expect(events.at(-1)).toEqual(
      expect.objectContaining({
        type: "console",
        line: "XRP stop state verified",
      }),
    );
    expect(events.at(-2)).toEqual(
      expect.objectContaining({ type: "status", state: "ready" }),
    );
    target.disconnect();
  });

  it("retries an interrupted Stop with the same request id", async () => {
    const stopRequestIds: string[] = [];
    let stopAttempts = 0;
    const fetchMock = vi.fn(
      async (input: URL | RequestInfo, init?: RequestInit) => {
        const url = String(input);
        if (url.endsWith("/api/v1/info")) {
          return response({
            protocol: 1,
            serviceVersion: CURRENT_COURSE_RELEASE,
            courseRelease: CURRENT_COURSE_RELEASE,
            bootId: "boot-a",
            robotName: "xrp-test",
            address: "192.168.4.1",
            capabilities: [
              "project.check",
              "project.prepare",
              "program.run",
              "program.stop",
              "target.reset",
              "telemetry.poll",
            ],
          });
        }
        if (url.includes("/api/v1/telemetry")) {
          return response({
            bootId: "boot-a",
            state: "ready",
            detail: "Program stopped",
            runId: 1,
            logs: [],
            samples: [],
          });
        }
        const body = JSON.parse(String(init?.body)) as { requestId: string };
        stopRequestIds.push(body.requestId);
        stopAttempts += 1;
        if (stopAttempts === 1) {
          throw new TypeError("Failed to fetch");
        }
        return response({
          protocol: 1,
          requestId: body.requestId,
          ok: true,
          result: { detail: "Stopping program", reconnecting: false },
        });
      },
    );
    const target = new DirectPhysicalTargetClient("192.168.4.1", {
      fetch: fetchMock as typeof fetch,
      pollIntervalMs: 60_000,
    });
    const events: TargetEvent[] = [];
    target.subscribe((event) => events.push(event));

    await target.connect();
    await expect(target.stop()).resolves.toBeUndefined();

    expect(stopRequestIds).toHaveLength(2);
    expect(stopRequestIds[0]).toBe(stopRequestIds[1]);
    expect(events).toContainEqual(
      expect.objectContaining({
        type: "console",
        line: "Stop reply interrupted · retrying the same request",
      }),
    );
    expect(events).not.toContainEqual(
      expect.objectContaining({
        type: "console",
        line: "Stop reply was interrupted · checking XRP state",
      }),
    );
    target.disconnect();
  });

  it("delivers final output before completion and runs the retained project again", async () => {
    vi.useFakeTimers();
    let runId = 0;
    let completedRun = 0;
    const revision =
      "94c8db611816a391e40858466e242721dc446e44bf0b02688f5a63056c5d73e3";
    const fetchMock = vi.fn(
      async (input: URL | RequestInfo, init?: RequestInit) => {
        const url = String(input);
        if (url.endsWith("/api/v1/info")) {
          return response({
            protocol: 1,
            serviceVersion: CURRENT_COURSE_RELEASE,
            courseRelease: CURRENT_COURSE_RELEASE,
            bootId: "boot-a",
            robotName: "xrp-test",
            address: "192.168.7.30",
            project: {
              name: "Retained project",
              entrypoint: "main.py",
              revision,
            },
            capabilities: [
              "project.check",
              "project.prepare",
              "program.run",
              "program.stop",
              "target.reset",
              "telemetry.poll",
            ],
          });
        }
        if (url.includes("/api/v1/telemetry")) {
          completedRun = runId;
          return response({
            bootId: "boot-a",
            state: "ready",
            detail: "Program completed",
            runId,
            logs: [
              {
                seq: runId,
                tMs: runId * 100,
                stream: "stdout",
                line: `finished run ${runId}`,
              },
            ],
            samples: [],
          });
        }
        const body = JSON.parse(String(init?.body)) as { requestId: string };
        runId += 1;
        return response({
          protocol: 1,
          requestId: body.requestId,
          ok: true,
          result: { detail: "Starting main.py", runId },
        });
      },
    );
    const target = new DirectPhysicalTargetClient("192.168.7.30", {
      fetch: fetchMock as typeof fetch,
      pollIntervalMs: 250,
    });
    const events: TargetEvent[] = [];
    target.subscribe((event) => events.push(event));

    try {
      await target.connect();
      await target.runCurrent();
      await vi.advanceTimersByTimeAsync(500);
      expect(completedRun).toBe(1);

      const outputIndex = events.findIndex(
        (event) => event.type === "console" && event.line === "finished run 1",
      );
      const completionIndex = events.findIndex(
        (event, index) =>
          index > outputIndex &&
          event.type === "status" &&
          event.detail === "Program completed",
      );
      expect(outputIndex).toBeGreaterThan(-1);
      expect(completionIndex).toBeGreaterThan(outputIndex);

      await target.runCurrent();
      expect(runId).toBe(2);
    } finally {
      target.disconnect();
      vi.useRealTimers();
    }
  });

  it("recovers one transient telemetry interruption without a terminal error", async () => {
    vi.useFakeTimers();
    let telemetryRequests = 0;
    const fetchMock = vi.fn(async (input: URL | RequestInfo) => {
      const url = String(input);
      if (url.endsWith("/api/v1/info")) {
        return response({
          protocol: 1,
          serviceVersion: CURRENT_COURSE_RELEASE,
          courseRelease: CURRENT_COURSE_RELEASE,
          bootId: "boot-a",
          robotName: "xrp-test",
          address: "192.168.7.30",
          capabilities: [
            "project.check",
            "project.prepare",
            "program.run",
            "program.stop",
            "target.reset",
            "telemetry.poll",
          ],
        });
      }
      telemetryRequests += 1;
      if (telemetryRequests === 1) {
        throw new TypeError("temporary Wi-Fi loss");
      }
      return response({
        bootId: "boot-a",
        state: "ready",
        detail: "Physical XRP ready",
        runId: 0,
        logs: [],
        samples: [],
      });
    });
    const target = new DirectPhysicalTargetClient("192.168.7.30", {
      fetch: fetchMock as typeof fetch,
    });
    const events: TargetEvent[] = [];
    target.subscribe((event) => events.push(event));

    try {
      await target.connect();
      await vi.advanceTimersByTimeAsync(0);
      expect(events).toContainEqual(
        expect.objectContaining({
          type: "console",
          action: "telemetry",
          phase: "error",
        }),
      );
      expect(events.at(-1)).toMatchObject({
        type: "status",
        state: "connecting",
      });
      expect(events).not.toContainEqual(
        expect.objectContaining({ type: "status", state: "error" }),
      );

      await vi.advanceTimersByTimeAsync(900);
      expect(events).toContainEqual(
        expect.objectContaining({
          type: "console",
          line: "XRP connection restored",
          action: "telemetry",
          phase: "result",
        }),
      );
      expect(events.at(-1)).toMatchObject({ type: "status", state: "ready" });
    } finally {
      target.disconnect();
      vi.useRealTimers();
    }
  });

  it("keeps an accepted run recoverable when its first startup poll times out", async () => {
    vi.useFakeTimers();
    const revision =
      "94c8db611816a391e40858466e242721dc446e44bf0b02688f5a63056c5d73e3";
    let runRequests = 0;
    let telemetryRequests = 0;
    const fetchMock = vi.fn(
      async (input: URL | RequestInfo, init?: RequestInit) => {
        const url = String(input);
        if (url.endsWith("/api/v1/info")) {
          return response({
            protocol: 1,
            serviceVersion: CURRENT_COURSE_RELEASE,
            courseRelease: CURRENT_COURSE_RELEASE,
            bootId: "boot-a",
            robotName: "xrp-test",
            address: "192.168.7.30",
            project: {
              name: "Retained project",
              entrypoint: "main.py",
              revision,
            },
            capabilities: [
              "project.check",
              "project.prepare",
              "program.run",
              "program.stop",
              "target.reset",
              "telemetry.poll",
            ],
          });
        }
        if (url.includes("/api/v1/telemetry")) {
          telemetryRequests += 1;
          if (telemetryRequests === 1) {
            return await new Promise<Response>((_resolve, reject) => {
              init?.signal?.addEventListener("abort", () =>
                reject(new DOMException("Aborted", "AbortError")),
              );
            });
          }
          return response({
            bootId: "boot-a",
            state: "running",
            detail: "Running main.py",
            runId: 1,
            logs: [],
            samples: [],
          });
        }
        const body = JSON.parse(String(init?.body)) as { requestId: string };
        if (url.endsWith("/api/v1/run")) {
          runRequests += 1;
          return response({
            protocol: 1,
            requestId: body.requestId,
            ok: true,
            result: { detail: "Starting main.py", runId: 1 },
          });
        }
        return response({
          protocol: 1,
          requestId: body.requestId,
          ok: true,
          result: { state: "running", runId: 1 },
        });
      },
    );
    const target = new DirectPhysicalTargetClient("192.168.7.30", {
      fetch: fetchMock as typeof fetch,
    });
    const events: TargetEvent[] = [];
    target.subscribe((event) => events.push(event));

    try {
      await target.connect();
      await target.runCurrent();
      await vi.advanceTimersByTimeAsync(3_500);
      expect(events.at(-1)).toMatchObject({
        type: "status",
        state: "connecting",
      });

      await vi.advanceTimersByTimeAsync(900);
      expect(runRequests).toBe(1);
      expect(telemetryRequests).toBe(2);
      expect(events.at(-1)).toMatchObject({
        type: "status",
        state: "running",
      });
      expect(events).not.toContainEqual(
        expect.objectContaining({ type: "status", state: "error" }),
      );
    } finally {
      target.disconnect();
      vi.useRealTimers();
    }
  });

  it("reports an error only after two consecutive telemetry failures", async () => {
    vi.useFakeTimers();
    let telemetryRequests = 0;
    const fetchMock = vi.fn(async (input: URL | RequestInfo) => {
      const url = String(input);
      if (url.endsWith("/api/v1/info")) {
        return response({
          protocol: 1,
          serviceVersion: CURRENT_COURSE_RELEASE,
          courseRelease: CURRENT_COURSE_RELEASE,
          bootId: "boot-a",
          robotName: "xrp-test",
          address: "192.168.7.30",
          capabilities: [
            "project.check",
            "project.prepare",
            "program.run",
            "program.stop",
            "target.reset",
            "telemetry.poll",
          ],
        });
      }
      telemetryRequests += 1;
      throw new TypeError(`Wi-Fi loss ${telemetryRequests}`);
    });
    const target = new DirectPhysicalTargetClient("192.168.7.30", {
      fetch: fetchMock as typeof fetch,
    });
    const events: TargetEvent[] = [];
    target.subscribe((event) => events.push(event));

    try {
      await target.connect();
      await vi.advanceTimersByTimeAsync(0);
      expect(events.at(-1)).toMatchObject({
        type: "status",
        state: "connecting",
      });

      await vi.advanceTimersByTimeAsync(900);
      expect(telemetryRequests).toBe(2);
      expect(events.at(-1)).toMatchObject({
        type: "status",
        state: "error",
      });
    } finally {
      target.disconnect();
      vi.useRealTimers();
    }
  });

  it("keeps Run available after a program exception", async () => {
    vi.useFakeTimers();
    let runId = 0;
    const fetchMock = vi.fn(
      async (input: URL | RequestInfo, init?: RequestInit) => {
        const url = String(input);
        if (url.endsWith("/api/v1/info")) {
          return response({
            protocol: 1,
            serviceVersion: CURRENT_COURSE_RELEASE,
            courseRelease: CURRENT_COURSE_RELEASE,
            bootId: "boot-a",
            robotName: "xrp-test",
            address: "192.168.7.30",
            project: {
              name: "Retained project",
              entrypoint: "main.py",
              revision:
                "94c8db611816a391e40858466e242721dc446e44bf0b02688f5a63056c5d73e3",
            },
            capabilities: [
              "project.check",
              "project.prepare",
              "program.run",
              "program.stop",
              "target.reset",
              "telemetry.poll",
            ],
          });
        }
        if (url.includes("/api/v1/telemetry")) {
          return response({
            bootId: "boot-a",
            state: "error",
            detail: "Program stopped after an exception",
            runId,
            logs: [
              {
                seq: runId,
                stream: "stderr",
                line: "ValueError: example",
              },
            ],
            samples: [],
          });
        }
        const body = JSON.parse(String(init?.body)) as { requestId: string };
        runId += 1;
        return response({
          protocol: 1,
          requestId: body.requestId,
          ok: true,
          result: { detail: "Starting main.py", runId },
        });
      },
    );
    const target = new DirectPhysicalTargetClient("192.168.7.30", {
      fetch: fetchMock as typeof fetch,
    });
    const events: TargetEvent[] = [];
    target.subscribe((event) => events.push(event));

    try {
      await target.connect();
      await target.runCurrent();
      await vi.advanceTimersByTimeAsync(500);
      expect(events.at(-1)).toMatchObject({
        type: "status",
        state: "ready",
        detail: "Program stopped after an exception",
      });
      await target.runCurrent();
      expect(runId).toBe(2);
    } finally {
      target.disconnect();
      vi.useRealTimers();
    }
  });

  it("rejects an uncorrelated command reply", async () => {
    const fetchMock = vi.fn(
      async (_input: URL | RequestInfo, init?: RequestInit) => {
        if (!init || init.method === "GET") {
          return response({
            protocol: 1,
            serviceVersion: CURRENT_COURSE_RELEASE,
            courseRelease: CURRENT_COURSE_RELEASE,
            robotName: "xrp-test",
            address: "192.168.7.30",
            capabilities: [
              "project.check",
              "project.prepare",
              "program.run",
              "program.stop",
              "target.reset",
              "telemetry.poll",
            ],
          });
        }
        return response({
          protocol: 1,
          requestId: "different",
          ok: true,
          result: { detail: "not trustworthy" },
        });
      },
    );
    const target = new PhysicalTargetClient("192.168.7.30", {
      fetch: fetchMock as typeof fetch,
      pollIntervalMs: 60_000,
    });
    await target.connect();
    await expect(target.check(project)).rejects.toThrow(/different request/i);
    target.disconnect();
  });
});
