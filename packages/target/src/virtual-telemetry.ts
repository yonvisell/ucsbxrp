import type { XrpSimulatorState } from "@ucsb-xrp/simulator";

import type { TelemetrySample } from "./types";
import type { CourseTelemetryState } from "./worker-protocol";

/**
 * Keep simulator truth and student estimates distinct while preserving the
 * original flat pose fields consumed by existing Monitor releases.
 */
export function virtualTelemetrySample(
  state: XrpSimulatorState,
  courseState: CourseTelemetryState | null,
): TelemetrySample {
  return {
    tMs: state.tMs,
    seq: state.seq,
    source: "virtual",
    poseAvailable: true,
    xMm: state.pose.xMm,
    yMm: state.pose.yMm,
    headingRad: state.pose.headingRad,
    estimatedPoseAvailable: courseState !== null,
    estimatedXmm: courseState?.estimatedXmm ?? null,
    estimatedYmm: courseState?.estimatedYmm ?? null,
    estimatedHeadingRad: courseState?.estimatedHeadingRad ?? null,
    groundTruthPoseAvailable: true,
    groundTruthXmm: state.pose.xMm,
    groundTruthYmm: state.pose.yMm,
    groundTruthHeadingRad: state.pose.headingRad,
    requestedForwardSpeedMmS: courseState?.requestedForwardSpeedMmS ?? null,
    requestedTurnRateRadS: courseState?.requestedTurnRateRadS ?? null,
    targetLeftWheelSpeedMmS: courseState?.targetLeftWheelSpeedMmS ?? null,
    targetRightWheelSpeedMmS: courseState?.targetRightWheelSpeedMmS ?? null,
    leftEffort: state.leftEffort,
    rightEffort: state.rightEffort,
    leftWheelSpeedMmS:
      courseState?.measuredLeftWheelSpeedMmS ?? state.leftWheelSpeedMmS,
    rightWheelSpeedMmS:
      courseState?.measuredRightWheelSpeedMmS ?? state.rightWheelSpeedMmS,
    leftEncoderCount: state.leftEncoderCount,
    rightEncoderCount: state.rightEncoderCount,
    collision: state.collision,
    rangeMm: state.rangeMm,
    buttonPressed: state.buttonPressed,
    accelerationMg: state.accelerationMg,
    angularRateMdps: state.angularRateMdps,
    temperatureC: state.temperatureC,
    batteryV: state.batteryV,
    sensorError: null,
  };
}
