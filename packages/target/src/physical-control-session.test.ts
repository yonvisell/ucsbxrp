import { describe, expect, it, vi } from "vitest";
import {
  CURRENT_COURSE_RELEASE,
  DirectPhysicalTargetClient,
} from "./physical-target";
import { describeProject } from "./project-identity";
import type { CourseProject, TargetEvent } from "./types";

const project: CourseProject = {
  name: "Controller",
  entrypoint: "main.py",
  files: { "main.py": "print(1)" },
};
const emptyRuntime = JSON.stringify({
  revision: 0,
  parameters: [],
  watches: [],
  plots: [],
});
function json(value: unknown): Response {
  return new Response(JSON.stringify(value));
}

class ControlService {
  bootId = "boot-a";
  runId = 0;
  state = "ready";
  generation = 0;
  owner: string | null = null;
  prepared: Awaited<ReturnType<typeof describeProject>> | null = null;
  requests: { path: string; body: Record<string, unknown> }[] = [];
  gets: string[] = [];
  holdRunReply = false;
  rejectRunSyntax = false;
  resetReboots = false;
  releaseRunReply: (() => void) | null = null;
  samples: Record<string, unknown>[] = [];
  plots: unknown[] | undefined;
  control() {
    return {
      sessionId: this.owner,
      generation: this.generation,
      leaseRemainingMs: 6000,
      runId: this.runId,
    };
  }
  stateReply() {
    return {
      bootId: this.bootId,
      runId: this.runId,
      state: this.state,
      detail:
        this.state === "ready" ? "Program already stopped" : "Running main.py",
      logs: [],
      samples: this.samples,
      samplePlots: this.plots,
      moreSamples: false,
      moreLogs: false,
      project: this.prepared ? { ...this.prepared, lifetime: "boot" } : null,
      runtimeJson: emptyRuntime,
      control: this.control(),
    };
  }
  fetch: typeof fetch = async (input, init) => {
    const url = new URL(String(input));
    if (init?.method !== "POST") {
      this.gets.push(url.pathname + url.search);
      if (url.pathname.endsWith("/info"))
        return json({
          protocol: 1,
          serviceVersion: CURRENT_COURSE_RELEASE,
          courseRelease: CURRENT_COURSE_RELEASE,
          bootId: this.bootId,
          runId: this.runId,
          project: this.prepared
            ? { ...this.prepared, lifetime: "boot" }
            : null,
          robotName: "xrp-test",
          address: "192.168.7.30",
          control: this.control(),
          limits: { maxRequestBodyBytes: 131072 },
          capabilities: [
            "project.check",
            "project.prepare",
            "project.run",
            "program.run",
            "program.stop",
            "target.reset",
            "telemetry.poll",
            "control.session-v1",
          ],
        });
      if (url.pathname.endsWith("/telemetry")) {
        const rejected =
          url.searchParams.get("bootId") !== this.bootId
            ? "boot_changed"
            : Number(url.searchParams.get("runId")) !== this.runId
              ? "stale_run"
              : url.searchParams.get("sessionId") !== this.owner ||
                  Number(url.searchParams.get("controlGeneration")) !==
                    this.generation
                ? "control_required"
                : null;
        if (rejected)
          return new Response(
            JSON.stringify({ error: { code: rejected, detail: rejected } }),
            { status: 409 },
          );
        expect(url.searchParams.get("bootId")).toBe(this.bootId);
        expect(url.searchParams.get("sessionId")).toBe(this.owner);
        expect(Number(url.searchParams.get("controlGeneration"))).toBe(
          this.generation,
        );
        expect(Number(url.searchParams.get("runId"))).toBe(this.runId);
      }
      return json(this.stateReply());
    }
    const body = JSON.parse(String(init.body)) as Record<string, unknown>;
    const path = url.pathname.split("/").at(-1)!;
    this.requests.push({ path, body });
    const error = (code: string, detail = code) =>
      json({
        protocol: 1,
        requestId: body.requestId,
        ok: false,
        error: { code, detail },
      });
    const ok = (result: unknown) =>
      json({ protocol: 1, requestId: body.requestId, ok: true, result });
    if (body.bootId !== this.bootId) return error("boot_changed");
    if (path === "control") {
      if (
        this.owner &&
        body.sessionId !== this.owner &&
        (!body.takeover || this.state !== "ready")
      )
        return error("control_owned");
      if (body.sessionId !== this.owner) {
        this.generation += 1;
        this.owner = String(body.sessionId);
      }
      return ok({ control: this.control() });
    }
    if (path !== "check" && body.runId !== this.runId)
      return error("stale_run");
    if (
      path !== "stop" &&
      path !== "check" &&
      (body.sessionId !== this.owner ||
        body.controlGeneration !== this.generation)
    )
      return error("control_required");
    if (path === "prepare" || path === "run") {
      if (path === "run" && this.rejectRunSyntax)
        return error(
          "syntax_error",
          'Traceback (most recent call last):\n  File "main.py", line 1\nSyntaxError: invalid syntax',
        );
      if (body.project)
        this.prepared = await describeProject(body.project as CourseProject);
      else if (body.expectedProjectRevision !== this.prepared?.revision)
        return error("project_revision_mismatch");
      if (path === "run") {
        this.runId += 1;
        this.state = "running";
      }
      if (this.holdRunReply && path === "run")
        await new Promise<void>((resolve) => {
          this.releaseRunReply = resolve;
        });
      return ok({
        detail: "Starting main.py",
        runId: this.runId,
        project: { ...this.prepared, lifetime: "boot" },
      });
    }
    if (path === "stop" || path === "reset") {
      this.state = "ready";
      if (path === "reset" && this.resetReboots) {
        this.bootId = "boot-b";
        this.runId = 0;
        this.owner = null;
        this.generation = 0;
        this.prepared = null;
      }
      return ok({
        detail: path === "stop" ? "Program stopped" : "Program state reset",
        reconnecting: path === "reset" && this.resetReboots,
      });
    }
    return ok({ detail: "accepted" });
  };
  client() {
    return new DirectPhysicalTargetClient("192.168.7.30", {
      fetch: this.fetch,
      pollDrivenByVisibleClient: true,
      pollIntervalMs: 1,
    });
  }
}

it("preserves physical Run compiler text and exact source identity without launching invalid code", async () => {
  const service = new ControlService();
  service.rejectRunSyntax = true;
  const target = service.client();
  const events: TargetEvent[] = [];
  target.subscribe((event) => events.push(event));
  const invalid = {
    ...project,
    files: { "main.py": "def broken(:\n    pass\n" },
  };
  try {
    await target.connect();
    await expect(
      target.run(invalid, "invalid-physical-project"),
    ).rejects.toMatchObject({
      code: "syntax_error",
    });
    expect(
      events.find((event) => event.type === "compile-result"),
    ).toMatchObject({
      projectId: "invalid-physical-project",
      projectRevision: (await describeProject(invalid)).revision,
      result: {
        ok: false,
        compilerOutput: [expect.stringContaining('File "main.py", line 1')],
        diagnostics: [
          { phase: "compile", path: "main.py", start: { line: 1 } },
        ],
      },
    });
    expect(service.runId).toBe(0);
    expect(
      service.requests.filter((request) => request.path === "run"),
    ).toHaveLength(1);
  } finally {
    target.disconnect();
  }
});

describe("physical control sessions", () => {
  it("rejects an observer Reset before sending the preparatory Stop", async () => {
    const service = new ControlService();
    const owner = service.client();
    const observer = service.client();
    try {
      await owner.connect();
      await owner.run(project, "project-a");
      await observer.connect();
      const before = service.requests.length;
      await expect(observer.reset()).rejects.toMatchObject({
        code: "control_owned",
      });
      expect(
        service.requests.slice(before).map((request) => request.path),
      ).toEqual(["control"]);
      expect(service.state).toBe("running");
    } finally {
      observer.disconnect();
      owner.disconnect();
    }
  });

  it("reclaims the new boot and run epoch before reporting reset ready", async () => {
    const service = new ControlService();
    const client = service.client();
    service.resetReboots = true;
    try {
      await client.connect();
      await client.run(project, "project-a");
      await client.reset();
      await client.run(project, "project-a");
      expect(
        service.requests.filter((request) => request.path === "run").at(-1)
          ?.body,
      ).toMatchObject({ bootId: "boot-b", runId: 0, controlGeneration: 1 });
      expect(service.state).toBe("running");
    } finally {
      client.disconnect();
    }
  });
  it("cancels a delayed direct-browser project snapshot without revoking the provider", async () => {
    const service = new ControlService();
    const client = service.client();
    let release:
      | ((value: {
          projectId: string;
          revision: number;
          project: CourseProject;
        }) => void)
      | undefined;
    const provider = vi.fn(
      () =>
        new Promise<{
          projectId: string;
          revision: number;
          project: CourseProject;
        }>((resolve) => {
          release = resolve;
        }),
    );
    try {
      await client.connect();
      client.setProjectRunProvider(provider);
      const running = client.runCurrent();
      const rejected = expect(running).rejects.toThrow(/cancelled/);
      await vi.waitFor(() => expect(provider).toHaveBeenCalledOnce());
      await client.stop();
      await rejected;
      release!({ projectId: "project-a", revision: 1, project });
      await Promise.resolve();
      expect(
        service.requests.filter((request) => request.path === "run"),
      ).toHaveLength(0);
      client.setProjectRunProvider(() => ({
        projectId: "project-a",
        revision: 2,
        project,
      }));
      await client.runCurrent();
      expect(service.runId).toBe(1);
    } finally {
      client.disconnect();
    }
  });
  it("fences two independent browsers, preserves observer Stop, and allows explicit stopped takeover", async () => {
    const service = new ControlService();
    const owner = service.client();
    const observer = service.client();
    const observed: TargetEvent[] = [];
    observer.subscribe((e) => observed.push(e));
    try {
      await owner.connect();
      await owner.run(project, "project-a");
      await observer.connect();
      expect(observed).toContainEqual(
        expect.objectContaining({
          type: "control",
          owned: false,
          ownerPresent: true,
          canTakeover: false,
        }),
      );
      await expect(observer.claimControl()).rejects.toMatchObject({
        code: "control_owned",
      });
      await observer.stop();
      expect(service.state).toBe("ready");
      await expect(observer.run(project)).rejects.toMatchObject({
        code: "control_owned",
      });
      expect(
        service.gets.filter((path) => path.includes("/telemetry")),
      ).toHaveLength(0);
      await observer.claimControl();
      expect(observed).toContainEqual(
        expect.objectContaining({ type: "control", owned: true }),
      );
      await owner.stop();
      await expect(owner.run(project)).rejects.toMatchObject({
        code: "control_owned",
      });
      await observer.run(project, "project-b");
      expect(service.runId).toBe(2);
      expect(service.requests.filter((r) => r.path === "run")).toHaveLength(2);
    } finally {
      owner.disconnect();
      observer.disconnect();
    }
  });

  it("correlates prepared launches, rejects an old boot, and preflights request bytes", async () => {
    const service = new ControlService();
    const client = service.client();
    try {
      await client.connect();
      await client.synchronize(project);
      await client.run(project, "project-a");
      const launch = service.requests.find((r) => r.path === "run")!;
      expect(launch.body).toMatchObject({
        bootId: "boot-a",
        runId: 0,
        expectedProjectRevision: (await describeProject(project)).revision,
      });
      expect(launch.body.project).toBeUndefined();
      service.bootId = "boot-b";
      await expect(client.reset()).rejects.toMatchObject({
        code: "boot_changed",
      });
    } finally {
      client.disconnect();
    }
    const fresh = new ControlService();
    const limited = fresh.client();
    try {
      await limited.connect();
      await expect(
        limited.run({
          ...project,
          files: { "main.py": "#" + "a".repeat(140000) },
        }),
      ).rejects.toMatchObject({ code: "project_too_large" });
      expect(fresh.requests.some((r) => r.path === "run")).toBe(false);
    } finally {
      limited.disconnect();
    }
  });

  it("reconciles an accepted Run whose late reply was cancelled before scoping Stop", async () => {
    const service = new ControlService();
    const client = service.client();
    const events: TargetEvent[] = [];
    client.subscribe((e) => events.push(e));
    try {
      await client.connect();
      service.holdRunReply = true;
      const run = client.run(project, "project-a");
      const rejected = expect(run).rejects.toMatchObject({
        code: "operation_cancelled",
      });
      await vi.waitFor(() => expect(service.releaseRunReply).not.toBeNull());
      const afterCancel = events.length;
      const stopping = client.stop();
      await Promise.resolve();
      expect(
        service.requests.filter((request) => request.path === "stop"),
      ).toHaveLength(0);
      service.releaseRunReply!();
      await rejected;
      await stopping;
      expect(service.requests.find((r) => r.path === "stop")?.body.runId).toBe(
        1,
      );
      expect(service.requests.filter((r) => r.path === "run")).toHaveLength(1);
      expect(events.slice(afterCancel)).not.toContainEqual(
        expect.objectContaining({
          type: "console",
          line: "Run · Starting main.py",
        }),
      );
      expect(service.state).toBe("ready");
    } finally {
      client.disconnect();
    }
  });

  it("preserves sample-time plot values and never fills an unavailable row with later values", async () => {
    const service = new ControlService();
    const client = service.client();
    const events: TargetEvent[] = [];
    client.subscribe((e) => events.push(e));
    try {
      await client.connect();
      service.samples = [1, 2, 3].map((seq) => ({
        seq,
        tMs: seq * 20,
        source: "physical",
        poseAvailable: true,
        xMm: 0,
        yMm: 0,
        headingRad: 0,
        leftEncoderCount: seq,
        rightEncoderCount: seq,
        timingValues:
          seq === 2
            ? null
            : [
                100 + seq * 20,
                seq * 20,
                seq,
                null,
                null,
                0,
                1,
                seq,
                seq,
                null,
                seq * 20 + 5,
                20,
                20,
                0,
                "course",
                false,
              ],
      }));
      service.plots = [
        [{ name: "speed", label: "Speed", value: 10 }],
        null,
        [{ name: "speed", label: "Speed", value: 30 }],
      ];
      client.requestPollIfDue();
      await vi.waitFor(() =>
        expect(events.filter((e) => e.type === "telemetry")).toHaveLength(3),
      );
      expect(
        events
          .filter((e) => e.type === "telemetry")
          .map((e) => e.sample.plotValues),
      ).toEqual(service.plots.map((p) => p ?? []));
      const samples = events
        .filter((e) => e.type === "telemetry")
        .map((e) => e.sample);
      expect(samples[0]?.timing).toMatchObject({
        clockId: "physical:boot-a:0",
        acquisitionSeq: 1,
        acquiredAtMs: 20,
        publishedAtMs: 25,
      });
      expect(samples[1]?.timing).toBeUndefined();
      expect(samples[2]?.timing?.acquisitionSeq).toBe(3);
    } finally {
      client.disconnect();
    }
  });
});
