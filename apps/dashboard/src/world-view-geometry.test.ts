import { describe, expect, it } from "vitest";

import { DEFAULT_WORLD_CATALOG, type TelemetrySample } from "@ucsb-xrp/target";

import { fittedWorldViewSpans, worldTrailSegmentPoints } from "./WorldView";

function pose(source: TelemetrySample["source"], seq: number, tMs = seq) {
  return {
    source,
    seq,
    tMs,
    poseAvailable: true,
    xMm: seq,
    yMm: seq / 2,
  } as TelemetrySample;
}

describe("world view geometry", () => {
  it("fits the complete world in wide, square, and tall viewports", () => {
    const bounds = DEFAULT_WORLD_CATALOG.worlds[0]!.bounds;
    const worldWidth = bounds.maximumXmm - bounds.minimumXmm;
    const worldHeight = bounds.maximumYmm - bounds.minimumYmm;

    const viewports: Array<readonly [number, number]> = [
      [1_200, 400],
      [800, 800],
      [400, 1_200],
    ];
    for (const [width, height] of viewports) {
      const spans = fittedWorldViewSpans(bounds, width, height);
      expect(spans.horizontalMm).toBeGreaterThanOrEqual(worldWidth + 180);
      expect(spans.verticalMm).toBeGreaterThanOrEqual(worldHeight + 180);
      expect(spans.horizontalMm / spans.verticalMm).toBeCloseTo(width / height);
    }
  });

  it("does not connect a path across reset or target boundaries", () => {
    const points = worldTrailSegmentPoints([
      pose("virtual", 1),
      pose("virtual", 2),
      pose("virtual", 0, 0),
      pose("virtual", 1, 1),
      pose("physical", 2, 2),
      pose("physical", 3, 3),
    ]);

    expect(points).toHaveLength(6);
    expect(points.map((point) => point.x)).toEqual([1, 2, 0, 1, 2, 3]);
  });
});
