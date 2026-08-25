import { describe, expect, it, vi } from "vitest";

import {
  DirectPhysicalTargetClient,
  localNetworkRequestInit,
  PhysicalTargetClient,
  normalizePhysicalEndpoint,
} from "./physical-target";
import type { CourseProject, TargetEvent } from "./types";

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
            serviceVersion: "test",
            courseRelease: "test",
            bootId: "boot-a",
            robotName: "xrp-test",
            address: "192.168.7.30",
            runtimeJson: initialRuntime,
            capabilities: [
              "project.check",
              "project.sync",
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
        serviceVersion: "test",
        courseRelease: "test",
        bootId: "boot-ap",
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
          "project.sync",
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
      detail: "ucsb-xrp · UCSB-XRP-AA71 fallback · 192.168.4.1 · course test",
    });
    target.disconnect();
  });

  it("discovers and runs the retained project without another transfer", async () => {
    const revision =
      "94c8db611816a391e40858466e242721dc446e44bf0b02688f5a63056c5d73e3";
    const fetchMock = vi.fn(
      async (input: URL | RequestInfo, init?: RequestInit) => {
        if (!init || init.method === "GET") {
          return response({
            protocol: 1,
            serviceVersion: "test",
            courseRelease: "test",
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
              "project.sync",
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

  it("blocks a retained revision after an IDE edit until synchronization", async () => {
    const retained = {
      ...project,
      name: "Retained project",
    };
    const changed = {
      ...retained,
      files: { "main.py": "print('changed')\n" },
    };
    const retainedRevision =
      "f8ecfeb351b02819619f5bd6fd842977da0a01e5ef682f2b58a3db6f0ae7df27";
    let postCount = 0;
    const fetchMock = vi.fn(
      async (_input: URL | RequestInfo, init?: RequestInit) => {
        if (!init || init.method === "GET") {
          return response({
            protocol: 1,
            serviceVersion: "test",
            courseRelease: "test",
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
              "project.sync",
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
          result:
            postCount === 1
              ? { detail: "Project synchronized" }
              : { detail: "Running main.py", runId: 3 },
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
    await expect(target.runCurrent()).rejects.toThrow(/changed/i);
    expect(postCount).toBe(0);

    await target.synchronize(changed);
    await target.runCurrent();
    expect(postCount).toBe(2);
    expect(events).toContainEqual(
      expect.objectContaining({
        type: "project",
        project: expect.objectContaining({ stale: true }),
      }),
    );
    expect(events).toContainEqual({
      type: "status",
      state: "loading",
      detail: "Running main.py",
    });
    expect(events).toContainEqual({
      type: "console",
      stream: "system",
      line: "Running main.py",
    });
    target.disconnect();
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
        serviceVersion: "test",
        courseRelease: "test",
        robotName: "xrp-test",
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

  it("does not retry directly after shared discovery reaches the robot and fails", async () => {
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
          serviceVersion: "test",
          courseRelease: "test",
          robotName: "xrp-test",
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
            serviceVersion: "test",
            courseRelease: "test",
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
              "project.sync",
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
          result: path.endsWith("/lease")
            ? { state: "running", runId: 1 }
            : { detail: "Starting main.py", runId: 1 },
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
    expect(paths.some((path) => path.includes("/api/v1/telemetry"))).toBe(true);
    target.disconnect();
    vi.useRealTimers();
  });

  it("polls running telemetry four times faster without raising the idle rate", async () => {
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
        serviceVersion: "test",
        courseRelease: "test",
        bootId: "boot-a",
        robotName: "xrp-test",
        address: "192.168.7.30",
        project: null,
        capabilities: [
          "project.check",
          "project.sync",
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

      await vi.advanceTimersByTimeAsync(59);
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

  it("discovers, checks, synchronizes, and runs with correlated replies", async () => {
    let requestCount = 0;
    const fetchMock = vi.fn(
      async (_input: URL | RequestInfo, init?: RequestInit) => {
        if (!init || init.method === "GET") {
          return response({
            protocol: 1,
            serviceVersion: "test",
            courseRelease: "test",
            robotName: "xrp-test",
            address: "192.168.7.30",
            capabilities: [
              "project.check",
              "project.sync",
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
                ? { detail: "Project synchronized" }
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
    expect(events).toContainEqual({
      type: "status",
      state: "loading",
      detail: "Running main.py",
    });
    expect(events).toContainEqual({
      type: "console",
      stream: "system",
      line: "Validating main.py on the physical XRP",
    });
    expect(events).toContainEqual({
      type: "console",
      stream: "system",
      line: "Validation passed · 1 Python files compiled",
    });
    expect(events).toContainEqual({
      type: "console",
      stream: "system",
      line: "Running main.py",
    });
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
          serviceVersion: "test",
          courseRelease: "test",
          bootId: "boot-a",
          robotName: "xrp-test",
          address: "192.168.7.30",
          capabilities: [
            "project.check",
            "project.sync",
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
        "http://192.168.7.30/api/v1/telemetry?afterLogSeq=10",
      );
      expect(requestedUrls).toContain(
        "http://192.168.7.30/api/v1/telemetry?afterLogSeq=0",
      );
      expect(events).toContainEqual({
        type: "console",
        stream: "system",
        line: "after reboot",
      });
    } finally {
      target.disconnect();
      vi.useRealTimers();
    }
  });

  it("suppresses a stale polling error while an intentional stop reboots the XRP", async () => {
    let rejectTelemetry: ((reason: Error) => void) | undefined;
    let telemetryRequests = 0;
    let bootId = "boot-a";
    const info = () => ({
      protocol: 1,
      serviceVersion: "test",
      courseRelease: "test",
      bootId,
      robotName: "xrp-test",
      address: "192.168.7.30",
      capabilities: [
        "project.check",
        "project.sync",
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
    await vi.waitFor(() =>
      expect(
        fetchMock.mock.calls.some(([, init]) => init?.method === "POST"),
      ).toBe(true),
    );
    rejectTelemetry?.(new Error("stale telemetry request failed"));
    await stopping;

    expect(events).not.toContainEqual(
      expect.objectContaining({ type: "status", state: "error" }),
    );
    expect(events).toContainEqual(
      expect.objectContaining({ type: "status", state: "ready" }),
    );
    target.disconnect();
  });

  it("rejects an uncorrelated command reply", async () => {
    const fetchMock = vi.fn(
      async (_input: URL | RequestInfo, init?: RequestInit) => {
        if (!init || init.method === "GET") {
          return response({
            protocol: 1,
            serviceVersion: "test",
            courseRelease: "test",
            robotName: "xrp-test",
            address: "192.168.7.30",
            capabilities: [
              "project.check",
              "project.sync",
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
