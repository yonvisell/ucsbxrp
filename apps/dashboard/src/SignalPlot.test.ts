import { describe, expect, it } from "vitest";

import type { TelemetrySample } from "@ucsb-xrp/target";

import { SIGNAL_PLOTS, signalPlotData, signalXAxis } from "./SignalPlot";

function sample(
  tMs: number,
  values: Partial<TelemetrySample> = {},
): TelemetrySample {
  return {
    tMs,
    seq: tMs,
    source: "virtual",
    poseAvailable: true,
    xMm: 0,
    yMm: 0,
    headingRad: 0,
    leftEffort: 0.25,
    rightEffort: 0.2,
    leftWheelSpeedMmS: 100,
    rightWheelSpeedMmS: 90,
    leftEncoderCount: 0,
    rightEncoderCount: 0,
    collision: false,
    rangeMm: 300,
    buttonPressed: false,
    accelerationMg: [1, 2, 1_000],
    angularRateMdps: [3, 4, 5],
    temperatureC: 25,
    batteryV: 6,
    sensorError: null,
    ...values,
  };
}

describe("monitor signal plots", () => {
  it("offers distinct course-relevant signal choices", () => {
    expect(SIGNAL_PLOTS.map((plot) => plot.id)).toEqual([
      "wheel-speed",
      "motor-effort",
      "pose-error",
      "range",
      "acceleration",
      "angular-rate",
    ]);
  });

  it("plots virtual odometry position error separately from ground truth", () => {
    const data = signalPlotData(
      [
        sample(0, {
          estimatedPoseAvailable: true,
          estimatedXmm: 103,
          estimatedYmm: 104,
          groundTruthPoseAvailable: true,
          groundTruthXmm: 100,
          groundTruthYmm: 100,
        }),
      ],
      "pose-error",
      5,
    );

    expect(data[0]?.values).toEqual([[0, 5]]);
  });

  it("keeps only the selected trailing time window and makes now zero", () => {
    const data = signalPlotData(
      [sample(0), sample(5_000), sample(12_000)],
      "wheel-speed",
      10,
    );
    expect(data[0]?.values).toEqual([
      [-7, 100],
      [0, 100],
    ]);
    expect(data[1]?.values).toEqual([
      [-7, 90],
      [0, 90],
    ]);
  });

  it("plots the regularized wheel-speed values supplied by SensorModel", () => {
    const data = signalPlotData(
      [
        sample(0, { leftWheelSpeedMmS: 80 }),
        sample(20, { leftWheelSpeedMmS: 120 }),
        sample(140, { leftWheelSpeedMmS: 100 }),
      ],
      "wheel-speed",
      5,
    );

    expect(data[0]?.name).toBe("Measured L");
    expect(data[0]?.values.map((point) => point[1])).toEqual([80, 120, 100]);
  });

  it("preserves missing physical sensor values as chart gaps", () => {
    const data = signalPlotData(
      [sample(0, { rangeMm: null }), sample(100, { rangeMm: 240 })],
      "range",
      5,
    );
    expect(data[0]?.values).toEqual([
      [-0.1, null],
      [0, 240],
    ]);
  });

  it("presents hardware-native IMU samples in SI units", () => {
    const acceleration = signalPlotData([sample(0)], "acceleration", 5);
    const angularRate = signalPlotData(
      [sample(0, { angularRateMdps: [180_000, -90_000, 0] })],
      "angular-rate",
      5,
    );

    expect(acceleration.map((series) => series.values[0]?.[1])).toEqual([
      0.00980665, 0.0196133, 9.80665,
    ]);
    expect(angularRate.map((series) => series.values[0]?.[1])).toEqual([0]);
  });

  it("adds one unlabeled minor x-grid line between adjacent labeled lines", () => {
    const xAxis = signalXAxis(10);

    expect(xAxis.min).toBe(-10);
    expect(xAxis.max).toBe(0);
    expect(xAxis.minorTick).toEqual({ show: false, splitNumber: 2 });
    expect(xAxis.minorSplitLine.show).toBe(true);
  });
});
