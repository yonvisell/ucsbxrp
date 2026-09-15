import { describe, expect, it, vi } from "vitest";
import {
  DEFAULT_WORLD_CATALOG,
  type SynchronizedProject,
  type TargetEvent,
  type TelemetrySample,
} from "@ucsb-xrp/target";
import type { MonitorRunDataset } from "../../dashboard/src/monitor-run-dataset";
import type { CourseDirectoryHandle } from "../../shared/course-folder";
import {
  archiveForRun,
  completedRunMetadata,
} from "../../shared/run-archive-format";
import { RunArchiveRecorder } from "./run-archive-recorder";

const folderA = { name: "Project A" } as CourseDirectoryHandle;
const folderB = { name: "Project B" } as CourseDirectoryHandle;
function boundary(
  phase: "begin" | "end",
  overrides: Partial<Extract<TargetEvent, { type: "run" }>> = {},
): Extract<TargetEvent, { type: "run" }> {
  return {
    type: "run",
    phase,
    runId: "run-a",
    projectId: "project-a",
    projectName: "Project A",
    projectRevision: "source-sha-a",
    entrypoint: "main.py",
    startedAtMs: 1_000,
    state: phase === "begin" ? "running" : "ready",
    detail: phase === "begin" ? "Running" : "Finished",
    ...(phase === "end" ? { finishedAtMs: 2_000 } : {}),
    ...overrides,
  };
}
function sample(
  seq: number,
  source: TelemetrySample["source"] = "virtual",
): TelemetrySample {
  return {
    source,
    seq,
    tMs: seq * 20,
    poseAvailable: true,
    xMm: seq,
    yMm: 0,
    headingRad: 0,
    leftEffort: 0,
    rightEffort: 0,
    leftWheelSpeedMmS: 0,
    rightWheelSpeedMmS: 0,
    leftEncoderCount: seq,
    rightEncoderCount: seq,
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

describe("IDE run archive recorder", () => {
  it("captures exact run identity/world, output and samples without Monitor, even after Project selection changes", async () => {
    let selectedFolder = folderA;
    const resolve = vi.fn(async (_project: SynchronizedProject | null) => ({
      folder: selectedFolder,
    }));
    const save = vi.fn(
      async (_folder: CourseDirectoryHandle, _run: MonitorRunDataset) =>
        undefined,
    );
    const recorder = new RunArchiveRecorder(resolve, save);
    const world = { ...DEFAULT_WORLD_CATALOG.worlds[0]!, id: "assigned-world" };
    recorder.receive(
      {
        type: "world",
        catalog: { ...DEFAULT_WORLD_CATALOG, worlds: [world] },
        selectedWorldId: world.id,
      },
      "virtual",
    );
    recorder.receive(boundary("begin"), "virtual");
    selectedFolder = folderB;
    recorder.receive(
      {
        type: "project",
        project: {
          projectId: "project-b",
          name: "B",
          revision: "sha-b",
          entrypoint: "other.py",
          stale: false,
        },
      },
      "virtual",
    );
    recorder.receive(
      {
        type: "world",
        catalog: DEFAULT_WORLD_CATALOG,
        selectedWorldId: DEFAULT_WORLD_CATALOG.worlds[0]!.id,
      },
      "virtual",
    );
    recorder.receive(
      { type: "telemetry", sample: sample(1, "physical") },
      "virtual",
    );
    recorder.receive(
      {
        type: "telemetry",
        sample: {
          ...sample(1),
          plotValues: [
            { name: "error", label: "Position error", unit: "mm", value: 12 },
          ],
        },
      },
      "virtual",
    );
    recorder.receive(
      {
        type: "console",
        stream: "stdout",
        line: "trial=1 error_mm=12",
        eventId: "output-1",
        targetTimeMs: 20,
      },
      "virtual",
    );
    recorder.receive(boundary("end"), "virtual");
    expect(recorder.needsProtection).toBe(true);
    expect(await recorder.flush()).toBe(true);
    expect(save).toHaveBeenCalledTimes(1);
    const [folder, run] = save.mock.calls[0]! as unknown as [
      CourseDirectoryHandle,
      Parameters<typeof archiveForRun>[0],
    ];
    expect(folder).toBe(folderA);
    expect(run.project).toMatchObject({
      projectId: "project-a",
      revision: "source-sha-a",
    });
    expect(run.world.id).toBe("assigned-world");
    expect(run.recording.samples).toHaveLength(1);
    expect(run.output.map((entry) => entry.line)).toEqual([
      "trial=1 error_mm=12",
    ]);
    expect(completedRunMetadata(run).programPlots).toEqual([
      expect.objectContaining({
        name: "error",
        label: "Position error",
        unit: "mm",
      }),
    ]);
    expect(archiveForRun(run).telemetry).toContain("program_error");
    expect(recorder.needsProtection).toBe(false);
  });

  it("keeps pending saves protected and serializes a following run archive", async () => {
    let release!: () => void;
    const blocked = new Promise<void>((resolve) => {
      release = resolve;
    });
    const save = vi.fn(
      async (_folder: CourseDirectoryHandle, _run: MonitorRunDataset) => {
        if (save.mock.calls.length === 1) await blocked;
      },
    );
    const recorder = new RunArchiveRecorder(
      async () => ({ folder: folderA }),
      save,
    );
    recorder.receive(boundary("begin"), "virtual");
    recorder.receive(boundary("end"), "virtual");
    recorder.receive(boundary("begin", { runId: "run-b" }), "virtual");
    recorder.receive(boundary("end", { runId: "run-b" }), "virtual");
    await Promise.resolve();
    await Promise.resolve();
    expect(save).toHaveBeenCalledTimes(1);
    expect(recorder.snapshot()).toMatchObject({ phase: "saving", pending: 2 });
    release();
    expect(await recorder.flush()).toBe(true);
    expect(save).toHaveBeenCalledTimes(2);
  });

  it("retains failed output and empty-telemetry planning runs until an explicit recovery confirmation", async () => {
    const save = vi.fn(
      async (_folder: CourseDirectoryHandle, _run: MonitorRunDataset) => {
        throw new Error("Permission revoked");
      },
    );
    const recorder = new RunArchiveRecorder(
      async () => ({ folder: folderA }),
      save,
    );
    recorder.receive(boundary("begin"), "virtual");
    recorder.receive(
      { type: "console", stream: "stdout", line: "valid_path: 9 cells" },
      "virtual",
    );
    recorder.receive(boundary("end"), "virtual");
    expect(await recorder.flush()).toBe(false);
    expect(recorder.canStartRun).toBe(false);
    expect(recorder.unsavedRuns()[0]?.recording.samples).toEqual([]);
    expect(recorder.unsavedRuns()[0]?.output[0]?.line).toBe(
      "valid_path: 9 cells",
    );
    expect(recorder.snapshot().detail).toContain("Permission revoked");
    recorder.acknowledgeRecoverySaved(["run-a"]);
    expect(recorder.canStartRun).toBe(true);
    expect(recorder.needsProtection).toBe(false);
    expect(recorder.snapshot()).toMatchObject({ phase: "recovery-confirmed" });
    expect(recorder.snapshot().detail).toContain(
      "not saved to its Project folder",
    );
  });

  it("retries a failed archive using its original Project identity", async () => {
    const resolve = vi.fn(async (_project: SynchronizedProject | null) => ({
      folder: folderA,
    }));
    const save = vi
      .fn()
      .mockRejectedValueOnce(new Error("Disk temporarily unavailable"))
      .mockResolvedValue(undefined);
    const recorder = new RunArchiveRecorder(resolve, save);
    recorder.receive(boundary("begin"), "virtual");
    recorder.receive(boundary("end"), "virtual");
    await recorder.flush();
    recorder.retry();
    expect(await recorder.flush()).toBe(true);
    expect(resolve.mock.calls).toHaveLength(2);
    expect(
      resolve.mock.calls.every(
        (call) =>
          (call[0] as unknown as { projectId: string }).projectId ===
          "project-a",
      ),
    ).toBe(true);
  });

  it("archives completed retained history with its timestamps/loss and ignores duplicate envelopes", async () => {
    const save = vi.fn(
      async (_folder: CourseDirectoryHandle, _run: MonitorRunDataset) =>
        undefined,
    );
    const recorder = new RunArchiveRecorder(
      async () => ({ folder: folderA }),
      save,
    );
    const begin = {
      ...boundary("end"),
      type: "run-history",
      phase: "begin",
      retainedTelemetryDropped: 12,
      droppedOutputLines: 3,
    } as const;
    const end = { ...begin, phase: "end" } as const;
    recorder.receive(begin, "virtual");
    recorder.receive(
      { type: "telemetry", sample: sample(13), replayed: true },
      "virtual",
    );
    recorder.receive(
      {
        type: "console",
        stream: "stdout",
        line: "retained",
        replayed: true,
        requestId: "run-a",
      },
      "virtual",
    );
    recorder.receive(end, "virtual");
    await recorder.flush();
    recorder.receive(begin, "virtual");
    recorder.receive(end, "virtual");
    await recorder.flush();
    expect(save).toHaveBeenCalledTimes(1);
    const run = (
      save.mock.calls[0] as unknown as [
        unknown,
        Parameters<typeof archiveForRun>[0],
      ]
    )[1];
    expect(run.startedAt).toBe(new Date(1_000).toISOString());
    expect(run.finishedAt).toBe(new Date(2_000).toISOString());
    expect(run.recording.droppedSamples).toBe(12);
    expect(run.droppedOutputLines).toBe(3);
    expect(run.output[0]?.line).toBe("retained");
  });
});
