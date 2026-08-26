import { describe, expect, it } from "vitest";

import {
  TARGET_TELEMETRY_HISTORY_LIMIT,
  TelemetryEventHistory,
} from "./telemetry-event-history";
import type { TelemetrySample } from "./types";

function event(seq: number) {
  const sample: TelemetrySample = {
    tMs: seq * 20,
    seq,
    source: "virtual",
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
  return { type: "telemetry" as const, sample };
}

describe("telemetry event history", () => {
  it("retains more than three minutes at the 50 Hz virtual rate", () => {
    expect(TARGET_TELEMETRY_HISTORY_LIMIT).toBe(10_000);
    expect(TARGET_TELEMETRY_HISTORY_LIMIT / 50).toBeGreaterThanOrEqual(180);
  });

  it("keeps exactly the newest bounded events in chronological order", () => {
    const history = new TelemetryEventHistory(3);
    for (const seq of [1, 2, 3, 4, 5]) history.retain(event(seq));

    expect(history.size).toBe(3);
    expect([...history.chronological()].map((item) => item.sample.seq)).toEqual(
      [3, 4, 5],
    );

    history.clear();
    expect(history.size).toBe(0);
    expect([...history.chronological()]).toEqual([]);
  });

  it("rejects invalid capacities", () => {
    expect(() => new TelemetryEventHistory(0)).toThrow(
      "maximumEvents must be a positive integer",
    );
  });
});
