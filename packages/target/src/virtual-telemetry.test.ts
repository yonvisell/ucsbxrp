import type { XrpSimulatorState } from "@ucsb-xrp/simulator";
import { describe, expect, it } from "vitest";

import { virtualTelemetrySample } from "./virtual-telemetry";
import type { CourseTelemetryState } from "./worker-protocol";

const simulatorState: XrpSimulatorState = {
  tMs: 120,
  seq: 6,
  pose: { xMm: 75, yMm: -20, headingRad: 0.4 },
  leftEffort: 0.25,
  rightEffort: 0.3,
  leftWheelSpeedMmS: 91,
  rightWheelSpeedMmS: 104,
  leftEncoderCount: 30,
  rightEncoderCount: 34,
  collision: false,
  rangeMm: 800,
  buttonPressed: false,
  accelerationMg: [0, 0, 1000],
  angularRateMdps: [0, 0, 100],
  temperatureC: 27,
  batteryV: 6.1,
};

describe("virtualTelemetrySample", () => {
  it("labels simulator pose as ground truth before student state is available", () => {
    const sample = virtualTelemetrySample(simulatorState, null);

    expect(sample).toMatchObject({
      poseAvailable: true,
      xMm: 75,
      estimatedPoseAvailable: false,
      estimatedXmm: null,
      groundTruthPoseAvailable: true,
      groundTruthXmm: 75,
      requestedForwardSpeedMmS: null,
      targetLeftWheelSpeedMmS: null,
      leftWheelSpeedMmS: 91,
    });
  });

  it("keeps truth separate from the student estimate and command chain", () => {
    const courseState: CourseTelemetryState = {
      estimatedXmm: 70,
      estimatedYmm: -18,
      estimatedHeadingRad: 0.35,
      measuredLeftWheelSpeedMmS: 88,
      measuredRightWheelSpeedMmS: 99,
      requestedForwardSpeedMmS: 100,
      requestedTurnRateRadS: 0.2,
      targetLeftWheelSpeedMmS: 84.5,
      targetRightWheelSpeedMmS: 115.5,
    };

    const sample = virtualTelemetrySample(simulatorState, courseState);

    expect(sample).toMatchObject({
      // Compatibility fields remain simulator truth on the virtual target.
      xMm: 75,
      yMm: -20,
      headingRad: 0.4,
      estimatedPoseAvailable: true,
      estimatedXmm: 70,
      estimatedYmm: -18,
      estimatedHeadingRad: 0.35,
      groundTruthXmm: 75,
      requestedForwardSpeedMmS: 100,
      requestedTurnRateRadS: 0.2,
      targetLeftWheelSpeedMmS: 84.5,
      targetRightWheelSpeedMmS: 115.5,
      // Wheel-speed plots compare targets with course-loop measurements.
      leftWheelSpeedMmS: 88,
      rightWheelSpeedMmS: 99,
    });
  });
});
