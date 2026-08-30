import { describe, expect, it } from "vitest";

import type { WorldTrack } from "@ucsb-xrp/simulator";

import { worldTrackColor, worldTrackSegments } from "./world-track-geometry";

const points = [
  { xMm: -10, yMm: 0 },
  { xMm: 20, yMm: 0 },
  { xMm: 20, yMm: 30 },
] as const;

function track(closed: boolean): WorldTrack {
  return {
    type: "line",
    widthMm: 18,
    darkness: 1,
    closed,
    points,
  };
}

describe("world track geometry", () => {
  it("keeps an open track open and closes a closed track exactly once", () => {
    expect(worldTrackSegments(track(false))).toEqual([
      { start: points[0], end: points[1] },
      { start: points[1], end: points[2] },
    ]);
    expect(worldTrackSegments(track(true))).toEqual([
      { start: points[0], end: points[1] },
      { start: points[1], end: points[2] },
      { start: points[2], end: points[0] },
    ]);
  });

  it("uses declared darkness for a neutral floor color", () => {
    expect(worldTrackColor(0)).toBe("#eeeeee");
    expect(worldTrackColor(1)).toBe("#323232");
    expect(worldTrackColor(0.5)).toBe("#909090");
  });
});
