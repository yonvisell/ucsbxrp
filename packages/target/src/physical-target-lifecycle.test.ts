import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  DirectPhysicalTargetClient,
  PhysicalTargetClient,
} from "./physical-target";
import type { CourseProject, TargetEvent } from "./types";

const project: CourseProject = {
  entrypoint: "main.py",
  files: { "main.py": "print('stay')\n" },
};

describe("physical document departure", () => {
  let page: EventTarget;
  const listeners = new Map<
    DirectPhysicalTargetClient,
    Set<(event: TargetEvent) => void>
  >();
  const emit = (target: DirectPhysicalTargetClient, event: TargetEvent) => {
    for (const listener of listeners.get(target) ?? []) listener(event);
  };

  beforeEach(() => {
    page = Object.assign(new EventTarget(), {
      location: { protocol: "https:" },
    });
    vi.stubGlobal("window", page);
    vi.stubGlobal(
      "document",
      Object.assign(new EventTarget(), { visibilityState: "visible" }),
    );
    vi.stubGlobal("navigator", { onLine: true });
    listeners.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  function mockDirect(owned = true) {
    let target!: DirectPhysicalTargetClient;
    let runId = 0;
    vi.spyOn(
      DirectPhysicalTargetClient.prototype,
      "subscribe",
    ).mockImplementation(function (this: DirectPhysicalTargetClient, listener) {
      target = this;
      let subscriptions = listeners.get(this);
      if (!subscriptions) listeners.set(this, (subscriptions = new Set()));
      subscriptions.add(listener);
      return () => subscriptions.delete(listener);
    });
    const connect = vi
      .spyOn(DirectPhysicalTargetClient.prototype, "connect")
      .mockImplementation(async function (this: DirectPhysicalTargetClient) {
        emit(this, {
          type: "control",
          owned,
          ownerPresent: true,
          canTakeover: false,
          detail: owned
            ? "This browser controls XRP"
            : "Observing another browser",
        });
        emit(this, {
          type: "status",
          state: owned ? "ready" : "running",
          detail: "Connected",
        });
      });
    const run = vi
      .spyOn(DirectPhysicalTargetClient.prototype, "run")
      .mockImplementation(async function (this: DirectPhysicalTargetClient) {
        emit(this, {
          type: "run",
          phase: "begin",
          runId: `run-${++runId}`,
          startedAtMs: Date.now(),
          state: "loading",
          detail: "Starting",
        });
        emit(this, { type: "status", state: "running", detail: "Running" });
      });
    const stop = vi
      .spyOn(DirectPhysicalTargetClient.prototype, "stop")
      .mockImplementation(async function (this: DirectPhysicalTargetClient) {
        emit(this, { type: "status", state: "loading", detail: "Stopping" });
        emit(this, {
          type: "run",
          phase: "end",
          runId: `run-${runId}`,
          startedAtMs: 1,
          finishedAtMs: Date.now(),
          state: "ready",
          detail: "Stopped",
        });
        emit(this, { type: "status", state: "ready", detail: "Stopped" });
      });
    const disconnect = vi
      .spyOn(DirectPhysicalTargetClient.prototype, "disconnect")
      .mockImplementation(function (this: DirectPhysicalTargetClient) {
        emit(this, {
          type: "status",
          state: "disconnected",
          detail: "Disconnected",
        });
      });
    return {
      get target() {
        return target;
      },
      connect,
      run,
      stop,
      disconnect,
    };
  }

  it("keeps a canceled departure subscribed through Stop completion and the next direct Run", async () => {
    const mocked = mockDirect();
    const client = new PhysicalTargetClient("http://robot-a", {
      fetch: vi.fn(),
    });
    const events: TargetEvent[] = [];
    client.subscribe((event) => events.push(event));
    await client.connect();
    await client.run(project);
    page.addEventListener("beforeunload", (event) => event.preventDefault());
    expect(
      page.dispatchEvent(new Event("beforeunload", { cancelable: true })),
    ).toBe(false);
    await vi.waitFor(() =>
      expect(
        events.filter((event) => event.type === "status").at(-1),
      ).toMatchObject({ state: "ready" }),
    );
    expect(mocked.stop).toHaveBeenCalledOnce();
    expect(mocked.disconnect).not.toHaveBeenCalled();
    expect(events.filter((event) => event.type === "run").at(-1)).toMatchObject(
      { phase: "end" },
    );
    await client.run(project);
    expect(mocked.run).toHaveBeenCalledTimes(2);
    client.disconnect();
    await vi.waitFor(() => expect(mocked.disconnect).toHaveBeenCalledOnce());
  });

  it("keeps a direct observer connected without issuing Stop for another browser", async () => {
    const mocked = mockDirect(false);
    const client = new PhysicalTargetClient("http://robot-a", {
      fetch: vi.fn(),
    });
    const events: TargetEvent[] = [];
    client.subscribe((event) => events.push(event));
    await client.connect();
    page.dispatchEvent(new Event("beforeunload", { cancelable: true }));
    expect(mocked.stop).not.toHaveBeenCalled();
    expect(mocked.disconnect).not.toHaveBeenCalled();
    emit(mocked.target, {
      type: "console",
      stream: "stdout",
      line: "still observing",
    });
    expect(events.at(-1)).toMatchObject({ line: "still observing" });
    client.disconnect();
    expect(mocked.stop).not.toHaveBeenCalled();
  });

  it.each(["direct", "worker construction fallback"])(
    "waits for held departure Stop before BFCache reconnect in %s mode",
    async (mode) => {
      const mocked = mockDirect();
      vi.stubGlobal(
        "SharedWorker",
        class {
          constructor() {
            throw new Error("Unavailable");
          }
        },
      );
      const client = new PhysicalTargetClient(
        "http://robot-a",
        mode === "direct" ? { fetch: vi.fn() } : {},
      );
      const events: TargetEvent[] = [];
      client.subscribe((event) => events.push(event));
      await client.connect();
      await client.run(project);
      let release!: () => void;
      const gate = new Promise<void>((resolve) => {
        release = resolve;
      });
      mocked.stop.mockImplementation(async function (
        this: DirectPhysicalTargetClient,
      ) {
        emit(this, { type: "status", state: "loading", detail: "Stopping" });
        await gate;
        emit(this, { type: "status", state: "ready", detail: "Stopped" });
      });
      page.dispatchEvent(new Event("beforeunload", { cancelable: true }));
      const hide = new Event("pagehide");
      Object.defineProperty(hide, "persisted", { value: true });
      page.dispatchEvent(hide);
      const show = new Event("pageshow");
      Object.defineProperty(show, "persisted", { value: true });
      page.dispatchEvent(show);
      await Promise.resolve();
      expect(mocked.stop).toHaveBeenCalledOnce();
      expect(mocked.disconnect).not.toHaveBeenCalled();
      expect(mocked.connect).toHaveBeenCalledOnce();
      release();
      await vi.waitFor(() => expect(mocked.connect).toHaveBeenCalledTimes(2));
      expect(mocked.disconnect).toHaveBeenCalledOnce();
      expect(
        events.filter((event) => event.type === "status").at(-1),
      ).toMatchObject({ state: "ready" });
      await client.run(project);
      expect(mocked.run).toHaveBeenCalledTimes(2);
      client.disconnect();
      await vi.waitFor(() =>
        expect(mocked.disconnect).toHaveBeenCalledTimes(2),
      );
    },
  );

  it("keeps a shared port and event delivery on beforeunload, then releases it on actual pagehide", async () => {
    const posted: Array<{ type: string; requestId?: string }> = [];
    const port = {
      onmessage: null as ((event: MessageEvent) => void) | null,
      start: vi.fn(),
      close: vi.fn(),
      postMessage(message: { type: string; requestId?: string }) {
        posted.push(message);
        if (message.requestId)
          queueMicrotask(() =>
            this.onmessage?.({
              data: {
                type: "response",
                requestId: message.requestId,
                ok: true,
              },
            } as MessageEvent),
          );
      },
    };
    vi.stubGlobal(
      "SharedWorker",
      class {
        readonly port = port;
      },
    );
    const client = new PhysicalTargetClient("http://robot-a");
    const observed: TargetEvent[] = [];
    client.subscribe((event) => observed.push(event));
    await client.connect();
    page.dispatchEvent(new Event("beforeunload", { cancelable: true }));
    expect(posted.at(-1)).toEqual({ type: "stop-owned-run" });
    expect(posted.some((message) => message.type === "disconnect")).toBe(false);
    port.onmessage?.({
      data: {
        type: "event",
        event: { type: "status", state: "ready", detail: "Stopped" },
      },
    } as MessageEvent);
    expect(observed.at(-1)).toMatchObject({ state: "ready" });
    await client.run(project);
    expect(posted.at(-1)).toMatchObject({ type: "run" });
    const hide = new Event("pagehide");
    Object.defineProperty(hide, "persisted", { value: false });
    page.dispatchEvent(hide);
    expect(posted.at(-1)).toEqual({ type: "disconnect" });
    await expect(client.run(project)).rejects.toThrow("not connected");
  });
});
