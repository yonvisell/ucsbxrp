import { describe, expect, it } from "vitest";

import { DEFAULT_WORLD_CATALOG, type TelemetrySample } from "@ucsb-xrp/target";

import { fittedWorldViewSpans, worldTrailSegmentPoints } from "./WorldView";
import { WorldTrailGeometry } from "./world-trail-geometry";

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

  it("appends a sliding live snapshot into one reusable geometry", () => {
    const trail = new WorldTrailGeometry(10);
    const first = [pose("virtual", 1), pose("virtual", 2), pose("virtual", 3)];
    const geometry = trail.geometry;

    expect(trail.update(first)).toMatchObject({
      appendedSamples: 3,
      changed: true,
      rebuilt: true,
    });
    const attribute = geometry.getAttribute("position");
    expect(trail.segmentCount).toBe(2);
    expect(geometry.drawRange.count).toBe(4);

    expect(
      trail.update([first[1]!, first[2]!, pose("virtual", 4)]),
    ).toMatchObject({
      appendedSamples: 1,
      changed: true,
      rebuilt: false,
    });
    expect(trail.geometry).toBe(geometry);
    expect(geometry.getAttribute("position")).toBe(attribute);
    expect(trail.segmentCount).toBe(3);
    expect(geometry.drawRange.count).toBe(6);
    trail.dispose();
  });

  it("performs one bounded rebuild when the history boundary disappears", () => {
    const trail = new WorldTrailGeometry(2);
    trail.update([pose("virtual", 1), pose("virtual", 2)]);

    expect(
      trail.update([pose("physical", 7), pose("physical", 8)]),
    ).toMatchObject({
      appendedSamples: 2,
      changed: true,
      rebuilt: true,
    });
    expect(trail.segmentCount).toBe(1);
    expect(trail.posePointCount).toBe(2);
    trail.dispose();
  });

  it("rebuilds once when live history is replaced by a complete run", () => {
    const trail = new WorldTrailGeometry(10);
    const live = [pose("virtual", 3), pose("virtual", 4)];
    trail.update(live);
    const complete = [
      pose("virtual", 1),
      pose("virtual", 2),
      ...live.map((sample) => ({ ...sample })),
    ];

    expect(trail.update(complete, true)).toMatchObject({
      appendedSamples: 4,
      changed: true,
      rebuilt: true,
    });
    expect(trail.segmentCount).toBe(3);
    expect(trail.posePointCount).toBe(4);
    trail.dispose();
  });
});
