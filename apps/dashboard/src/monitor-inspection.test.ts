import { describe, expect, it } from "vitest";
import type { TelemetrySample } from "@ucsb-xrp/target";
import {
  annotationMatchesSample,
  inspectionValue,
  nearestObservation,
  observationDescription,
} from "./monitor-inspection";

describe("Monitor observation inspection", () => {
  const first = {
    source: "virtual",
    seq: 9,
    observationSeq: 31,
    physicsStepSeq: 9,
    tMs: 180,
  } as TelemetrySample;
  const second = { ...first, observationSeq: 32 };
  it("selects the latest actual observation at a repeated time without inventing an interpolated value", () => {
    expect(nearestObservation([first, second], 180)).toBe(second);
    expect(nearestObservation([first, second], 160)).toBe(second);
    expect(nearestObservation([], 0)).toBeNull();
    expect(observationDescription(second)).toBe("0.180 s · observation 32");
  });
  it("keeps a note attached to one observation even when physics time and sequence match", () => {
    const note = {
      ...first,
      id: "note",
      label: "first update",
      poseAvailable: true,
      xMm: 1,
      yMm: 2,
    };
    expect(annotationMatchesSample(note, first)).toBe(true);
    expect(annotationMatchesSample(note, second)).toBe(false);
    expect(
      annotationMatchesSample(
        { ...note, observationSeq: undefined },
        { ...first, tMs: 200 },
      ),
    ).toBe(false);
  });
  it("distinguishes unavailable values from measured zero without hiding small signals", () => {
    expect(inspectionValue(null)).toBe("Unavailable");
    expect(inspectionValue(NaN)).toBe("Unavailable");
    expect(inspectionValue(0)).toBe("0");
    expect(inspectionValue(0.0000002)).toBe("2.000e-7");
  });
});
