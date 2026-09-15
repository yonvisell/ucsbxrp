import { describe, expect, it } from "vitest";
import { XrpSimulator } from "@ucsb-xrp/simulator";
import {
  applyTelemetryTimingPage,
  decodeTelemetryTiming,
  decodeVirtualAcquisition,
} from "./telemetry-timing";
import {
  TelemetryRecorder,
  telemetryRecordingMetadata,
  telemetryRecordingToCsv,
} from "./telemetry-recording";
import { virtualTelemetrySample } from "./virtual-telemetry";
import { VirtualObservations } from "./virtual-observations";
import type { CourseTelemetryState } from "./worker-protocol";

const values = [
  120,
  20,
  2,
  0,
  1,
  0,
  1,
  8,
  9,
  null,
  43,
  20,
  20,
  3,
  "course",
  false,
];
const sample = () => virtualTelemetrySample(new XrpSimulator().state, null);

describe("acquisition timing", () => {
  it("keeps acquisition, publication, sensor identity and legacy time independent", () => {
    const timing = decodeTelemetryTiming(values, "physical:boot:run")!;
    expect(timing).toMatchObject({
      rawDeviceTimeMs: 120,
      acquiredAtMs: 20,
      acquisitionSeq: 2,
      publishedAtMs: 43,
      sampleDtMs: 20,
      rangeSampled: false,
    });
    const recorder = new TelemetryRecorder();
    recorder.start();
    const source = { ...sample(), tMs: 5000, timing };
    recorder.capture(source);
    timing.acquiredAtMs = 999;
    const snapshot = recorder.stop();
    expect(snapshot.samples[0]!.timing!.acquiredAtMs).toBe(20);
    const [header, row] = telemetryRecordingToCsv(snapshot)
      .trim()
      .split("\n")
      .map((line) => line.split(","));
    const cell = (name: string) => row![header!.indexOf(name)];
    expect(cell("t_s")).toBe("5");
    expect(cell("acquired_at_s")).toBe("0.02");
    expect(cell("published_at_s")).toBe("0.043");
    expect(cell("acquired_range_mm")).toBe("");
    expect(cell("clock_id")).toBe("physical:boot:run");
    expect(cell("csv_schema_version")).toBe("4");
    expect(cell("recording_dropped_observations")).toBe("0");
    expect(
      telemetryRecordingMetadata(snapshot).configuredSamplePeriodsSeconds,
    ).toEqual([0.02]);
    snapshot.samples[0]!.timing!.acquiredAtMs = 777;
    expect(recorder.snapshot().samples[0]!.timing!.acquiredAtMs).toBe(20);
  });

  it("preserves absent legacy timing without deriving acquisition from receipt or tMs", () => {
    expect(decodeTelemetryTiming(null, "legacy")).toBeUndefined();
    const [header, row] = telemetryRecordingToCsv({
      schemaVersion: 3,
      samples: [sample()],
      droppedSamples: 0,
    })
      .trimEnd()
      .split("\n")
      .map((line) => line.split(","));
    expect(row![header!.indexOf("acquired_at_s")]).toBe("");
    expect(row![header!.indexOf("acquisition_seq")]).toBe("");
  });

  it("rejects malformed and unaligned additive pages", () => {
    expect(() => decodeTelemetryTiming(values.slice(1), "clock")).toThrow();
    expect(() =>
      decodeTelemetryTiming(
        [...values.slice(0, 1), NaN, ...values.slice(2)],
        "clock",
      ),
    ).toThrow();
    expect(() =>
      applyTelemetryTimingPage([sample()], [], undefined, "clock"),
    ).toThrow("Unaligned");
    expect(() =>
      applyTelemetryTimingPage(
        [sample()],
        [values],
        [[[1, 2], null, 2, 3, null]],
        "clock",
      ),
    ).toThrow("vector");
  });

  it("replays sample-time diagnostics without copying newest data into older samples", () => {
    const samples = applyTelemetryTimingPage(
      [sample(), { ...sample(), seq: 1 }],
      [values, [...values.slice(0, 10), 63, ...values.slice(11)]],
      [
        [[1, 2, 3], null, 21, 5.8, null],
        [null, null, null, 5.7, "IMU: OSError"],
      ],
      "physical:boot:run",
    );
    expect(samples[0]!.accelerationMg).toEqual([1, 2, 3]);
    expect(samples[0]!.batteryV).toBe(5.8);
    expect(samples[1]!.accelerationMg).toBeNull();
    expect(samples[1]!.timing!.publishedAtMs).toBe(63);
  });

  it("keeps one acquisition through repeated virtual physics and course observations", () => {
    const simulator = new XrpSimulator();
    const observations = new VirtualObservations();
    const timing = decodeTelemetryTiming(values, "virtual:run")!;
    const course: CourseTelemetryState = {
      estimatedXmm: 1,
      estimatedYmm: 2,
      estimatedHeadingRad: 0,
      measuredLeftWheelSpeedMmS: 10,
      measuredRightWheelSpeedMmS: 10,
      measuredLeftWheelDistanceMm: 1,
      measuredRightWheelDistanceMm: 1,
      requestedForwardSpeedMmS: 10,
      requestedTurnRateRadS: 0,
      targetLeftWheelSpeedMmS: 10,
      targetRightWheelSpeedMmS: 10,
      timing,
    };
    const first = observations.capture(simulator.state, course, "course");
    const repeated = observations.capture(simulator.state, course, "actuator");
    expect(repeated.observationSeq).toBe(first.observationSeq! + 1);
    expect(repeated.timing).toEqual(first.timing);
    expect(repeated.tMs).toBe(first.tMs);
    const raw = observations.capture(simulator.state, null, "state", 0, {
      ...timing,
      kind: "raw",
    });
    expect(raw.estimatedPoseAvailable).toBe(false);
    expect(raw.timing!.rawLeftEncoderCount).toBe(8);
    const newerRaw = decodeVirtualAcquisition(
      JSON.stringify({
        timing: [140, 40, 3, ...values.slice(3, 14), "raw", false],
        diagnostics: [null, null, null, 5.7, "IMU: OSError"],
        plots: [{ name: "count", label: "Count", value: 3 }],
      }),
      "virtual:run",
    )!;
    const directAfterRobot = observations.capture(
      simulator.state,
      course,
      "state",
      0,
      newerRaw,
    );
    expect(directAfterRobot.timing!.acquisitionSeq).toBe(3);
    expect(directAfterRobot.timing!.kind).toBe("raw");
    expect(directAfterRobot.accelerationMg).toBeNull();
    expect(directAfterRobot.batteryV).toBe(5.7);
    expect(directAfterRobot.plotValues?.[0]?.value).toBe(3);
    expect(directAfterRobot.estimatedXmm).toBe(1);
  });
});
