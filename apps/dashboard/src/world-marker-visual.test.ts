import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { parseWorldCatalog } from "@ucsb-xrp/simulator";

import {
  worldMarkerLabelPosition,
  worldMarkerVisualStyle,
} from "./world-marker-visual";

const catalog = parseWorldCatalog(
  readFileSync(
    new URL("../../../tests/fixtures/world/all-geometry.json", import.meta.url),
    "utf8",
  ),
);

describe("world marker presentation", () => {
  it("gives start, finish, waypoint, and general markers distinct semantics", () => {
    const styles = Object.fromEntries(
      catalog.worlds[0]!.markers.map((marker) => [
        marker.type,
        worldMarkerVisualStyle(marker),
      ]),
    );

    expect(styles.start_line).toMatchObject({ dashed: false, shape: "line" });
    expect(styles.start_box).toMatchObject({ dashed: false, shape: "box" });
    expect(styles.finish_line).toMatchObject({ dashed: true, shape: "line" });
    expect(styles.finish_box).toMatchObject({ dashed: true, shape: "box" });
    expect(styles.waypoint).toMatchObject({ shape: "ring" });
    expect(styles.marker).toMatchObject({ shape: "diamond" });
  });

  it("positions every provided label adjacent to its geometry", () => {
    const positions = catalog.worlds[0]!.markers.map((marker) => ({
      label: marker.label,
      ...worldMarkerLabelPosition(marker),
    }));

    expect(positions).toHaveLength(7);
    expect(positions.every((position) => Boolean(position.label))).toBe(true);
    expect(positions).toContainEqual({
      label: "Finish box",
      xMm: 1420,
      yMm: 910,
    });
  });
});
