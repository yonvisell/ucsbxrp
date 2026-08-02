import { describe, expect, it, vi } from "vitest";

import {
  DirectPhysicalTargetClient,
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
      state: "running",
      detail: "Running main.py",
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
