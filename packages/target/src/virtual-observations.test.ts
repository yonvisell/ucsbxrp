import { XrpSimulator } from "@ucsb-xrp/simulator";
import { describe, expect, it } from "vitest";
import { VirtualObservations } from "./virtual-observations";
import {
  TelemetryRecorder,
  telemetryRecordingMetadata,
  telemetryRecordingToCsv,
} from "./telemetry-recording";
import type { CourseTelemetryState } from "./worker-protocol";

describe("virtual observation provenance", () => {
  it("preserves separate wheel updates at one physics step and their original values", () => {
    const simulator = new XrpSimulator();
    const observations = new VirtualObservations();
    simulator.step();
    simulator.setMotorEffort("left", 0.3);
    const left = observations.capture(simulator.state, null, "actuator");
    simulator.setMotorEffort("right", 0.4);
    const right = observations.capture(simulator.state, null, "actuator");
    expect([left.observationSeq, right.observationSeq]).toEqual([0, 1]);
    expect(left).toMatchObject({
      seq: 1,
      tMs: 20,
      physicsStepSeq: 1,
      leftEffort: 0.3,
      rightEffort: 0,
    });
    expect(right).toMatchObject({
      seq: 1,
      tMs: 20,
      physicsStepSeq: 1,
      leftEffort: 0.3,
      rightEffort: 0.4,
    });
    const stopped = observations.capture(
      { ...simulator.state, seq: 2, leftEffort: 0, rightEffort: 0 },
      null,
      "stop",
      1,
    );
    expect(stopped).toMatchObject({
      seq: 2,
      tMs: 20,
      physicsStepSeq: 1,
      observationSeq: 2,
      observationKind: "stop",
    });
  });

  it("does not count an unobserved physics catch-up as lost delivery but counts an observation gap", () => {
    const simulator = new XrpSimulator();
    const observations = new VirtualObservations();
    const recorder = new TelemetryRecorder();
    recorder.start();
    recorder.capture(observations.capture(simulator.state, null, "initial"));
    for (let step = 0; step < 300; step++) simulator.step();
    recorder.capture(observations.capture(simulator.state, null, "physics"));
    expect(recorder.snapshot().droppedSamples).toBe(0);
    observations.capture(simulator.state, null, "actuator");
    recorder.capture(observations.capture(simulator.state, null, "actuator"));
    const recording = recorder.stop();
    expect(recording.samples.map((sample) => sample.seq)).toEqual([
      0, 300, 300,
    ]);
    expect(recording.samples.map((sample) => sample.observationSeq)).toEqual([
      0, 1, 3,
    ]);
    expect(recording.droppedSamples).toBe(1);
    expect(telemetryRecordingMetadata(recording)).toMatchObject({
      retainedObservations: 3,
      retainedTimeSpanSeconds: 6,
      knownDroppedObservations: 1,
    });
  });

  it("preserves known course publication provenance without inventing acquisition time", () => {
    const simulator = new XrpSimulator();
    simulator.step();
    const observations = new VirtualObservations();
    const course: CourseTelemetryState = {
      publicationSeq: 3,
      publishedAtMs: 27,
      estimatedXmm: 1,
      estimatedYmm: 2,
      estimatedHeadingRad: 0,
      measuredLeftWheelSpeedMmS: 10,
      measuredRightWheelSpeedMmS: 11,
      measuredLeftWheelDistanceMm: 12,
      measuredRightWheelDistanceMm: 13,
      requestedForwardSpeedMmS: null,
      requestedTurnRateRadS: null,
      targetLeftWheelSpeedMmS: null,
      targetRightWheelSpeedMmS: null,
      plotValues: [{ name: "test", label: "Test", value: 4 }],
    };
    const first = observations.capture(simulator.state, course, "course");
    const second = observations.capture(
      simulator.state,
      {
        ...course,
        publicationSeq: 4,
        publishedAtMs: 29,
        plotValues: [{ name: "test", label: "Test", value: 5 }],
      },
      "course",
    );
    expect(first).toMatchObject({
      tMs: 20,
      courseSnapshotSeq: 3,
      coursePublishedAtMs: 27,
    });
    expect(second).toMatchObject({
      tMs: 20,
      courseSnapshotSeq: 4,
      coursePublishedAtMs: 29,
    });
    expect(first).not.toHaveProperty("courseAcquiredAtMs");
    const unknown = observations.capture(
      simulator.state,
      { ...course, publicationSeq: undefined, publishedAtMs: undefined },
      "course",
    );
    expect(unknown).not.toHaveProperty("courseSnapshotSeq");
    expect(unknown).not.toHaveProperty("coursePublishedAtMs");
    const csv = telemetryRecordingToCsv({
      schemaVersion: 3,
      samples: [first, second, unknown],
      droppedSamples: 0,
    })
      .trimEnd()
      .split("\n");
    expect(csv[0]).toMatch(
      /observation_seq,observation_kind,physics_step_seq,course_snapshot_seq,course_published_at_s,timing_schema_version/,
    );
    expect(csv[1]?.split(",").slice(39, 45)).toEqual([
      "4",
      "0",
      "course",
      "1",
      "3",
      "0.027",
    ]);
    expect(csv[2]?.split(",").slice(39, 45)).toEqual([
      "5",
      "1",
      "course",
      "1",
      "4",
      "0.029",
    ]);
    expect(csv[3]?.split(",").slice(39, 45)).toEqual([
      "4",
      "2",
      "course",
      "1",
      "",
      "",
    ]);
  });
});
