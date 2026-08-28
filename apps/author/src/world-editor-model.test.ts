import { readFileSync } from "node:fs";

import { describe, expect, test } from "vitest";

import {
  addWorld,
  addWorldItem,
  deleteWorld,
  deleteWorldItem,
  duplicateWorld,
  makeDefaultWorld,
  parseWorldDocument,
  reorderWaypoint,
  snapWorldValue,
  updateWorldIdentity,
  updateWorldNumbers,
  updateWorldText,
  worldEditorWarnings,
  type WorldAddItemType,
} from "./world-editor-model";

const source = readFileSync(
  "vendor/current/starters/challenge_5/world.json",
  "utf8",
);

describe("visual world editor model", () => {
  test("all current challenge worlds parse without conversion", () => {
    for (let challenge = 1; challenge <= 5; challenge += 1) {
      const current = readFileSync(
        `vendor/current/starters/challenge_${challenge}/world.json`,
        "utf8",
      );
      const parsed = parseWorldDocument(current);
      expect(parsed.catalog.worlds.length).toBeGreaterThan(0);
      expect(JSON.parse(current)).toEqual(parsed.raw);
    }
  });

  test("graphic edits preserve unknown fields and untouched array order", () => {
    const value = JSON.parse(source) as Record<string, unknown>;
    value.course_extension = { retained: true };
    const worlds = value.worlds as Array<Record<string, unknown>>;
    worlds[0]!.instructor_note = "keep";
    const obstacles = worlds[0]!.obstacles as Array<Record<string, unknown>>;
    obstacles[0]!.material = "foam";
    const markers = worlds[0]!.markers as Array<Record<string, unknown>>;
    markers[0]!.appearance = { dashed: true };
    const extended = JSON.stringify(value);

    const moved = updateWorldNumbers(
      extended,
      "gate-blocked",
      { kind: "obstacle", index: 1 },
      {
        minimum_x_mm: 375,
        minimum_y_mm: 125,
        maximum_x_mm: 475,
        maximum_y_mm: 375,
      },
    );
    const result = JSON.parse(moved) as Record<string, any>;
    expect(result.course_extension).toEqual({ retained: true });
    expect(result.worlds[0].instructor_note).toBe("keep");
    expect(result.worlds[0].obstacles[0].material).toBe("foam");
    expect(result.worlds[0].markers[0].appearance).toEqual({ dashed: true });
    expect(result.worlds[0].obstacles.map((item: any) => item.label)).toEqual([
      "Lower wall",
      "Upper wall",
      "Center gate",
    ]);
    expect(
      parseWorldDocument(moved).catalog.worlds[0]?.obstacles[1],
    ).toMatchObject({ minimumXmm: 375, maximumYmm: 375 });
  });

  test("world operations keep one valid default and unique IDs", () => {
    const added = addWorld(source);
    expect(added.worldId).toBe("world");
    const duplicate = duplicateWorld(added.source, "gate-blocked");
    expect(duplicate.worldId).toBe("gate-blocked-copy");
    const renamed = updateWorldIdentity(
      duplicate.source,
      duplicate.worldId,
      "id",
      "alternate-course",
    );
    const defaulted = makeDefaultWorld(renamed.source, renamed.worldId);
    const deleted = deleteWorld(defaulted, renamed.worldId);
    const parsed = parseWorldDocument(deleted.source).catalog;
    expect(parsed.worlds.map((world) => world.id)).not.toContain(
      "alternate-course",
    );
    expect(
      parsed.worlds.some((world) => world.id === parsed.defaultWorldId),
    ).toBe(true);
    expect(() =>
      deleteWorld(
        readFileSync("vendor/current/starters/challenge_1/world.json", "utf8"),
        "straight-run",
      ),
    ).toThrow("last world");
  });

  test("all supported items are added inside the arena and remain editable", () => {
    let current = readFileSync(
      "vendor/current/starters/challenge_1/world.json",
      "utf8",
    );
    const types: WorldAddItemType[] = [
      "wall",
      "block",
      "start_line",
      "finish_line",
      "start_box",
      "finish_box",
      "waypoint",
      "marker",
    ];
    for (const type of types) {
      current = addWorldItem(current, "straight-run", type).source;
      expect(() => parseWorldDocument(current)).not.toThrow();
    }
    const document = parseWorldDocument(current);
    expect(document.catalog.worlds[0]?.obstacles).toHaveLength(2);
    expect(document.catalog.worlds[0]?.markers).toHaveLength(8);

    const renamed = updateWorldText(
      current,
      "straight-run",
      { kind: "marker", index: 7 },
      "label",
      "Inspection point",
    );
    const removed = deleteWorldItem(renamed, "straight-run", {
      kind: "marker",
      index: 7,
    });
    expect(parseWorldDocument(removed).catalog.worlds[0]?.markers).toHaveLength(
      7,
    );
  });

  test("waypoints reorder without moving unrelated markers", () => {
    const current = readFileSync(
      "vendor/current/starters/challenge_3/world.json",
      "utf8",
    );
    const reordered = reorderWaypoint(current, "waypoint-route", 3, -1);
    const raw = parseWorldDocument(reordered.source).raw as Record<string, any>;
    expect(
      raw.worlds[0].markers.map((item: any) => item.name ?? item.type),
    ).toEqual(["start_box", "route_1", "route_3", "route_2"]);
    expect(reordered.markerIndex).toBe(2);
  });

  test("out-of-bounds edits are reported and are never silently cropped", () => {
    const current = readFileSync(
      "vendor/current/starters/challenge_4/world.json",
      "utf8",
    );
    const outside = updateWorldNumbers(
      current,
      "mapped-route",
      { kind: "obstacle", index: 0 },
      { maximum_x_mm: 1_600 },
    );
    expect(JSON.parse(outside).worlds[0].obstacles[0].maximum_x_mm).toBe(1_600);
    expect(() => parseWorldDocument(outside)).toThrow(
      "inside the world bounds",
    );
  });

  test("initial footprint overlap is a warning rather than a parse failure", () => {
    const current = readFileSync(
      "vendor/current/starters/challenge_4/world.json",
      "utf8",
    );
    const overlapping = updateWorldNumbers(
      current,
      "mapped-route",
      { kind: "initial_pose" },
      { x_mm: 0, y_mm: 0 },
    );
    const world = parseWorldDocument(overlapping).catalog.worlds[0]!;
    expect(worldEditorWarnings(world)).toEqual([
      expect.objectContaining({ code: "initial-footprint-collision" }),
    ]);
  });

  test("invalid raw text is not normalized and snap can be disabled", () => {
    const invalid = '{"default_world":';
    expect(() => addWorld(invalid)).toThrow();
    expect(invalid).toBe('{"default_world":');
    expect(snapWorldValue(113, 25)).toBe(125);
    expect(snapWorldValue(113, 0)).toBe(113);
  });
});
