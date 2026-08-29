import { describe, expect, it } from "vitest";

import { DEFAULT_WORLD_CATALOG, type TelemetrySample } from "@ucsb-xrp/target";

import { MonitorRunDatasetController } from "./monitor-run-dataset";

function sample(
  source: TelemetrySample["source"],
  seq: number,
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

describe("Monitor run dataset", () => {
  it("uses one completed dataset for samples, output, and notes", () => {
    const controller = new MonitorRunDatasetController();
    controller.begin({
      id: "run-1",
      target: "virtual",
      project: {
        name: "Spiral",
        entrypoint: "main.py",
        revision: "revision-1",
        stale: false,
      },
      worldId: "arena",
      world: DEFAULT_WORLD_CATALOG.worlds[0]!,
      startedAt: "2026-08-28T00:00:00.000Z",
    });
    controller.capture(sample("virtual", 1));
    controller.capture(sample("virtual", 2));
    controller.addOutput({
      id: "output-1",
      stream: "stdout",
      line: "finished",
    });
    controller.addAnnotation({
      id: "note-1",
      label: "turn",
      source: "virtual",
      seq: 2,
      tMs: 40,
      poseAvailable: true,
      xMm: 2,
      yMm: 0,
    });

    const run = controller.complete(
      "ready",
      "Program completed",
      "2026-08-28T00:00:01.000Z",
    );

    expect(run?.recording.samples.map((value) => value.seq)).toEqual([1, 2]);
    expect(run?.output.map((value) => value.line)).toEqual(["finished"]);
    expect(run?.annotations.map((value) => value.label)).toEqual(["turn"]);
  });

  it("rejects stale-target samples and starts every run empty", () => {
    const controller = new MonitorRunDatasetController();
    controller.begin({
      id: "physical-run",
      target: "physical",
      project: null,
      worldId: "arena",
      world: DEFAULT_WORLD_CATALOG.worlds[0]!,
      startedAt: "start",
    });

    expect(controller.capture(sample("virtual", 1))).toBe(false);
    expect(controller.capture(sample("physical", 2))).toBe(true);
    expect(
      controller.complete("ready", "done", "finish")?.recording.samples,
    ).toHaveLength(1);

    controller.begin({
      id: "next-run",
      target: "virtual",
      project: null,
      worldId: "arena",
      world: DEFAULT_WORLD_CATALOG.worlds[0]!,
      startedAt: "next",
    });
    expect(controller.sampleCount).toBe(0);
    expect(controller.currentAnnotations()).toEqual([]);
  });

  it("provides one bounded active snapshot when a hidden World becomes visible", () => {
    const controller = new MonitorRunDatasetController(5);
    controller.begin({
      id: "long-run",
      target: "virtual",
      project: null,
      worldId: "arena",
      world: DEFAULT_WORLD_CATALOG.worlds[0]!,
      startedAt: "start",
    });
    for (let sequence = 1; sequence <= 7; sequence += 1) {
      controller.capture(sample("virtual", sequence));
    }

    expect(
      controller.activeRecordingSnapshot()?.samples.map((value) => value.seq),
    ).toEqual([3, 4, 5, 6, 7]);

    controller.complete("ready", "done", "finish");
    expect(controller.activeRecordingSnapshot()).toBeNull();
  });

  it("keeps a note added after completion with the displayed run", () => {
    const controller = new MonitorRunDatasetController();
    controller.begin({
      id: "run",
      target: "virtual",
      project: null,
      worldId: "arena",
      world: DEFAULT_WORLD_CATALOG.worlds[0]!,
      startedAt: "start",
    });
    controller.capture(sample("virtual", 1));
    controller.complete("ready", "done", "finish");

    const updated = controller.addAnnotation({
      id: "note",
      label: "inspect",
      source: "virtual",
      seq: 1,
      tMs: 20,
      poseAvailable: true,
      xMm: 1,
      yMm: 0,
    });

    expect(updated?.annotations.map((value) => value.label)).toEqual([
      "inspect",
    ]);
  });

  it("accepts a late project descriptor but rejects a different project", () => {
    const controller = new MonitorRunDatasetController();
    controller.begin({
      id: "run",
      target: "virtual",
      project: null,
      worldId: "arena",
      world: DEFAULT_WORLD_CATALOG.worlds[0]!,
      startedAt: "start",
    });
    const project = {
      name: "Spiral",
      entrypoint: "main.py",
      revision: "revision-1",
      stale: false,
    };

    expect(controller.acceptProject(project)).toBe(true);
    expect(controller.acceptProject({ ...project })).toBe(true);
    expect(
      controller.acceptProject({ ...project, revision: "revision-2" }),
    ).toBe(false);
  });
});
