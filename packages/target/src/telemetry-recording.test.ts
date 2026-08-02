import { describe, expect, it } from "vitest";

import {
  TelemetryRecorder,
  telemetryRecordingToCsv,
} from "./telemetry-recording";
import type { TelemetrySample } from "./types";

function sample(seq: number): TelemetrySample {
  return {
    tMs: seq * 20,
    seq,
    source: "virtual",
    poseAvailable: true,
    xMm: seq * 1.5,
    yMm: -seq,
    headingRad: 0.1 * seq,
    leftEffort: 0.2,
    rightEffort: 0.19,
    leftWheelSpeedMmS: 100,
    rightWheelSpeedMmS: 98,
    leftEncoderCount: seq * 4,
    rightEncoderCount: seq * 4 - 1,
    collision: seq === 3,
    rangeMm: null,
    buttonPressed: false,
    accelerationMg: null,
    angularRateMdps: null,
    temperatureC: null,
    batteryV: null,
    sensorError: null,
  };
}

describe("TelemetryRecorder", () => {
  it("records only while active and returns independent snapshots", () => {
    const recorder = new TelemetryRecorder();
    recorder.capture(sample(0));
    recorder.start();
    recorder.capture(sample(1));
    const snapshot = recorder.stop();
    recorder.capture(sample(2));

    expect(snapshot.samples).toEqual([sample(1)]);
    expect(recorder.sampleCount).toBe(1);
    expect(recorder.isRecording).toBe(false);

    const mutable = snapshot.samples[0] as TelemetrySample;
    mutable.xMm = 999;
    expect(recorder.snapshot().samples[0]?.xMm).toBe(1.5);
  });

  it("keeps a bounded recent window and reports dropped samples", () => {
    const recorder = new TelemetryRecorder(2);
    recorder.start();
    recorder.capture(sample(1));
    recorder.capture(sample(2));
    recorder.capture(sample(3));
    recorder.capture(sample(4));

    const recording = recorder.stop();
    expect(recording.samples.map((value) => value.seq)).toEqual([3, 4]);
    expect(recording.droppedSamples).toBe(2);
    expect(recorder.droppedSampleCount).toBe(2);
  });

  it("validates its capacity and resets state on start and clear", () => {
    expect(() => new TelemetryRecorder(0)).toThrow(
      "maximumSamples must be a positive integer",
    );
    const recorder = new TelemetryRecorder();
    recorder.start();
    recorder.capture(sample(1));
    recorder.start();
    expect(recorder.sampleCount).toBe(0);
    recorder.clear();
    expect(recorder.snapshot()).toEqual({
      schemaVersion: 2,
      samples: [],
      droppedSamples: 0,
    });
  });
});

describe("telemetryRecordingToCsv", () => {
  it("exports stable explicit units and values", () => {
    const recorder = new TelemetryRecorder();
    recorder.start();
    recorder.capture(sample(3));

    const csv = telemetryRecordingToCsv(recorder.stop());
    expect(csv.split("\n")[0]).toBe(
      "source,pose_available,seq,t_s,x_mm,y_mm,heading_rad,left_drive_command,right_drive_command,left_wheel_speed_mm_s,right_wheel_speed_mm_s,left_encoder_count,right_encoder_count,collision,range_mm,button_pressed,acceleration_x_m_s2,acceleration_y_m_s2,acceleration_z_m_s2,angular_rate_x_rad_s,angular_rate_y_rad_s,angular_rate_z_rad_s,temperature_c,battery_v,sensor_error",
    );
    expect(csv).toContain("virtual,1,3,0.06,4.5,-3,0.30000000000000004");
    expect(csv).toContain(",1,,0,,,,,,,,,");
  });

  it("converts hardware-native IMU values to SI units", () => {
    const recorder = new TelemetryRecorder();
    recorder.start();
    recorder.capture({
      ...sample(1),
      accelerationMg: [1_000, -500, 0],
      angularRateMdps: [180_000, -90_000, 0],
    });

    const values = telemetryRecordingToCsv(recorder.stop())
      .trimEnd()
      .split("\n")[1]!
      .split(",");
    expect(values.slice(16, 22).map(Number)).toEqual([
      9.80665,
      -4.903325,
      0,
      Math.PI,
      -Math.PI / 2,
      0,
    ]);
  });

  it("exports a header-only file for an empty recording", () => {
    const recorder = new TelemetryRecorder();
    expect(telemetryRecordingToCsv(recorder.snapshot()).split("\n")).toEqual([
      "source,pose_available,seq,t_s,x_mm,y_mm,heading_rad,left_drive_command,right_drive_command,left_wheel_speed_mm_s,right_wheel_speed_mm_s,left_encoder_count,right_encoder_count,collision,range_mm,button_pressed,acceleration_x_m_s2,acceleration_y_m_s2,acceleration_z_m_s2,angular_rate_x_rad_s,angular_rate_y_rad_s,angular_rate_z_rad_s,temperature_c,battery_v,sensor_error",
      "",
    ]);
  });
});
