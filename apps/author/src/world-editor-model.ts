import {
  COURSE_ARENA_BOUNDS,
  parseWorldCatalog,
  type WorldCatalog,
  type WorldDefinition,
  type WorldMarker,
  type WorldObstacle,
} from "@ucsb-xrp/simulator";

export type WorldObjectSelection =
  | { kind: "bounds" }
  | { kind: "initial_pose" }
  | { kind: "obstacle"; index: number }
  | { kind: "marker"; index: number };

export type WorldAddItemType =
  | "wall"
  | "block"
  | "start_line"
  | "finish_line"
  | "start_box"
  | "finish_box"
  | "waypoint"
  | "marker";

export interface ParsedWorldDocument {
  catalog: WorldCatalog;
  raw: Record<string, unknown>;
}

export interface WorldEditorWarning {
  code: "initial-footprint-collision";
  message: string;
}

function rectangleValues(item: WorldObstacle | WorldMarker) {
  if (!("minimumXmm" in item)) return null;
  return {
    minimum_x_mm: item.minimumXmm,
    minimum_y_mm: item.minimumYmm,
    maximum_x_mm: item.maximumXmm,
    maximum_y_mm: item.maximumYmm,
  };
}

function markerValues(marker: WorldMarker): Record<string, number> {
  if (marker.type === "start_line" || marker.type === "finish_line") {
    return {
      x1_mm: marker.x1Mm,
      y1_mm: marker.y1Mm,
      x2_mm: marker.x2Mm,
      y2_mm: marker.y2Mm,
    };
  }
  if (marker.type === "start_box" || marker.type === "finish_box") {
    return rectangleValues(marker) ?? {};
  }
  return {
    x_mm: marker.xMm,
    y_mm: marker.yMm,
    ...(marker.type === "waypoint" && marker.headingRad !== undefined
      ? { heading_rad: marker.headingRad }
      : {}),
  };
}

export function worldSelectionValues(
  world: WorldDefinition,
  selection: WorldObjectSelection,
): Record<string, number> {
  if (selection.kind === "bounds") {
    return {
      minimum_x_mm: world.bounds.minimumXmm,
      minimum_y_mm: world.bounds.minimumYmm,
      maximum_x_mm: world.bounds.maximumXmm,
      maximum_y_mm: world.bounds.maximumYmm,
    };
  }
  if (selection.kind === "initial_pose") {
    return {
      x_mm: world.initialPose.xMm,
      y_mm: world.initialPose.yMm,
      heading_rad: world.initialPose.headingRad,
    };
  }
  if (selection.kind === "obstacle") {
    return rectangleValues(world.obstacles[selection.index]!) ?? {};
  }
  return markerValues(world.markers[selection.index]!);
}

export function worldItemLabel(
  item: WorldObstacle | WorldMarker,
  index: number,
): string {
  const label = item.label ?? ("name" in item ? item.name : undefined);
  return `${item.type.replaceAll("_", " ")}${label ? ` · ${label}` : ` ${index + 1}`}`;
}

type JsonObject = Record<string, unknown>;

const ROBOT_HALF_LENGTH_MM = 110;
const ROBOT_HALF_WIDTH_MM = 90;

function objectValue(value: unknown, name: string): JsonObject {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${name} must be an object`);
  }
  return value as JsonObject;
}

function arrayValue(value: unknown, name: string): unknown[] {
  if (!Array.isArray(value)) throw new Error(`${name} must be a list`);
  return value;
}

function clone<T>(value: T): T {
  return structuredClone(value);
}

function serialize(value: JsonObject): string {
  return `${JSON.stringify(value, null, 2)}\n`;
}

export function parseWorldDocument(source: string): ParsedWorldDocument {
  const raw = objectValue(JSON.parse(source) as unknown, "world.json");
  return { raw, catalog: parseWorldCatalog(source) };
}

function mutateDocument(
  source: string,
  mutate: (root: JsonObject) => void,
): string {
  const { raw } = parseWorldDocument(source);
  const next = clone(raw);
  mutate(next);
  return serialize(next);
}

function rawWorlds(root: JsonObject): JsonObject[] {
  return arrayValue(root.worlds, "worlds").map((value, index) =>
    objectValue(value, `worlds[${index}]`),
  );
}

function rawWorld(root: JsonObject, worldId: string): JsonObject {
  const world = rawWorlds(root).find((candidate) => candidate.id === worldId);
  if (!world) throw new Error(`Unknown world '${worldId}'`);
  return world;
}

function uniqueWorldId(root: JsonObject, requested: string): string {
  const ids = new Set(rawWorlds(root).map((world) => String(world.id)));
  if (!ids.has(requested)) return requested;
  let suffix = 2;
  while (ids.has(`${requested}-${suffix}`)) suffix += 1;
  return `${requested}-${suffix}`;
}

function centerOf(world: WorldDefinition): { x: number; y: number } {
  return {
    x: (world.bounds.minimumXmm + world.bounds.maximumXmm) / 2,
    y: (world.bounds.minimumYmm + world.bounds.maximumYmm) / 2,
  };
}

function defaultItem(
  world: WorldDefinition,
  type: WorldAddItemType,
): JsonObject {
  const center = centerOf(world);
  const worldWidth = world.bounds.maximumXmm - world.bounds.minimumXmm;
  const worldHeight = world.bounds.maximumYmm - world.bounds.minimumYmm;
  const halfBlockWidth = Math.min(100, worldWidth / 4);
  const halfBlockHeight = Math.min(50, worldHeight / 4);
  const halfLineLength = Math.min(125, worldHeight / 4);
  const halfBoxWidth = Math.min(100, worldWidth / 4);
  const halfBoxHeight = Math.min(100, worldHeight / 4);
  if (type === "wall" || type === "block") {
    return {
      type,
      minimum_x_mm: center.x - halfBlockWidth,
      minimum_y_mm: center.y - halfBlockHeight,
      maximum_x_mm: center.x + halfBlockWidth,
      maximum_y_mm: center.y + halfBlockHeight,
      label: type === "wall" ? "Wall" : "Block",
    };
  }
  if (type === "start_line" || type === "finish_line") {
    return {
      type,
      x1_mm: center.x,
      y1_mm: center.y - halfLineLength,
      x2_mm: center.x,
      y2_mm: center.y + halfLineLength,
      label: type === "start_line" ? "Start" : "Finish",
    };
  }
  if (type === "start_box" || type === "finish_box") {
    return {
      type,
      minimum_x_mm: center.x - halfBoxWidth,
      minimum_y_mm: center.y - halfBoxHeight,
      maximum_x_mm: center.x + halfBoxWidth,
      maximum_y_mm: center.y + halfBoxHeight,
      label: type === "start_box" ? "Start" : "Finish",
    };
  }
  if (type === "waypoint") {
    return {
      type,
      name: "waypoint",
      x_mm: center.x,
      y_mm: center.y,
      label: "Waypoint",
    };
  }
  return {
    type: "marker",
    name: "marker",
    x_mm: center.x,
    y_mm: center.y,
    label: "Marker",
  };
}

function uniqueItemName(items: unknown[], requested: string): string {
  const names = new Set(
    items.flatMap((value) => {
      const item = objectValue(value, "item");
      return typeof item.name === "string" ? [item.name] : [];
    }),
  );
  if (!names.has(requested)) return requested;
  let suffix = 2;
  while (names.has(`${requested}_${suffix}`)) suffix += 1;
  return `${requested}_${suffix}`;
}

export function addWorld(source: string): { source: string; worldId: string } {
  let worldId = "world";
  const nextSource = mutateDocument(source, (root) => {
    const worlds = arrayValue(root.worlds, "worlds");
    worldId = uniqueWorldId(root, "world");
    worlds.push({
      id: worldId,
      label: "New world",
      bounds: {
        minimum_x_mm: COURSE_ARENA_BOUNDS.minimumXmm,
        minimum_y_mm: COURSE_ARENA_BOUNDS.minimumYmm,
        maximum_x_mm: COURSE_ARENA_BOUNDS.maximumXmm,
        maximum_y_mm: COURSE_ARENA_BOUNDS.maximumYmm,
      },
      initial_pose: { x_mm: 0, y_mm: 0, heading_rad: 0 },
      obstacles: [],
      markers: [],
    });
  });
  return { source: nextSource, worldId };
}

export function duplicateWorld(
  source: string,
  worldId: string,
): { source: string; worldId: string } {
  let nextWorldId = worldId;
  const nextSource = mutateDocument(source, (root) => {
    const worlds = arrayValue(root.worlds, "worlds");
    const index = worlds.findIndex(
      (value) => objectValue(value, "world").id === worldId,
    );
    if (index < 0) throw new Error(`Unknown world '${worldId}'`);
    const original = objectValue(worlds[index], "world");
    nextWorldId = uniqueWorldId(root, `${worldId}-copy`);
    const duplicate = clone(original);
    duplicate.id = nextWorldId;
    duplicate.label = `${String(original.label)} copy`;
    worlds.splice(index + 1, 0, duplicate);
  });
  return { source: nextSource, worldId: nextWorldId };
}

export function deleteWorld(
  source: string,
  worldId: string,
): { source: string; worldId: string } {
  let nextWorldId = worldId;
  const nextSource = mutateDocument(source, (root) => {
    const worlds = arrayValue(root.worlds, "worlds");
    if (worlds.length <= 1) throw new Error("The last world cannot be deleted");
    const index = worlds.findIndex(
      (value) => objectValue(value, "world").id === worldId,
    );
    if (index < 0) throw new Error(`Unknown world '${worldId}'`);
    worlds.splice(index, 1);
    const next = objectValue(
      worlds[Math.min(index, worlds.length - 1)],
      "world",
    );
    nextWorldId = String(next.id);
    if (root.default_world === worldId) root.default_world = nextWorldId;
  });
  return { source: nextSource, worldId: nextWorldId };
}

export function makeDefaultWorld(source: string, worldId: string): string {
  return mutateDocument(source, (root) => {
    rawWorld(root, worldId);
    root.default_world = worldId;
  });
}

export function updateWorldIdentity(
  source: string,
  worldId: string,
  field: "id" | "label",
  value: string,
): { source: string; worldId: string } {
  let nextWorldId = worldId;
  const nextSource = mutateDocument(source, (root) => {
    const world = rawWorld(root, worldId);
    world[field] = value;
    if (field === "id") {
      nextWorldId = value;
      if (root.default_world === worldId) root.default_world = value;
    }
  });
  return { source: nextSource, worldId: nextWorldId };
}

export function updateWorldNumber(
  source: string,
  worldId: string,
  selection: WorldObjectSelection,
  field: string,
  value: number,
): string {
  return updateWorldNumbers(source, worldId, selection, { [field]: value });
}

export function updateWorldNumbers(
  source: string,
  worldId: string,
  selection: WorldObjectSelection,
  values: Readonly<Record<string, number>>,
): string {
  return mutateDocument(source, (root) => {
    const world = rawWorld(root, worldId);
    let target: JsonObject;
    if (selection.kind === "bounds") {
      target = objectValue(world.bounds, "bounds");
    } else if (selection.kind === "initial_pose") {
      target = objectValue(world.initial_pose, "initial_pose");
    } else {
      const key = selection.kind === "obstacle" ? "obstacles" : "markers";
      const items = arrayValue(world[key], key);
      target = objectValue(
        items[selection.index],
        `${key}[${selection.index}]`,
      );
    }
    Object.assign(target, values);
  });
}

export function updateWorldText(
  source: string,
  worldId: string,
  selection: Extract<WorldObjectSelection, { kind: "obstacle" | "marker" }>,
  field: "name" | "label" | "feature",
  value: string,
): string {
  return mutateDocument(source, (root) => {
    const world = rawWorld(root, worldId);
    const key = selection.kind === "obstacle" ? "obstacles" : "markers";
    const items = arrayValue(world[key], key);
    const item = objectValue(
      items[selection.index],
      `${key}[${selection.index}]`,
    );
    if (value.trim()) item[field] = value;
    else delete item[field];
  });
}

export function addWorldItem(
  source: string,
  worldId: string,
  type: WorldAddItemType,
): { source: string; selection: WorldObjectSelection } {
  const { catalog } = parseWorldDocument(source);
  const parsedWorld = catalog.worlds.find((world) => world.id === worldId);
  if (!parsedWorld) throw new Error(`Unknown world '${worldId}'`);
  let selection: WorldObjectSelection = { kind: "initial_pose" };
  const nextSource = mutateDocument(source, (root) => {
    const world = rawWorld(root, worldId);
    const key = type === "wall" || type === "block" ? "obstacles" : "markers";
    const items = arrayValue(world[key], key);
    const item = defaultItem(parsedWorld, type);
    if (typeof item.name === "string") {
      item.name = uniqueItemName(items, item.name);
    }
    items.push(item);
    selection = {
      kind: key === "obstacles" ? "obstacle" : "marker",
      index: items.length - 1,
    };
  });
  return { source: nextSource, selection };
}

export function deleteWorldItem(
  source: string,
  worldId: string,
  selection: Extract<WorldObjectSelection, { kind: "obstacle" | "marker" }>,
): string {
  return mutateDocument(source, (root) => {
    const world = rawWorld(root, worldId);
    const key = selection.kind === "obstacle" ? "obstacles" : "markers";
    arrayValue(world[key], key).splice(selection.index, 1);
  });
}

export function reorderWaypoint(
  source: string,
  worldId: string,
  markerIndex: number,
  direction: -1 | 1,
): { source: string; markerIndex: number } {
  let nextIndex = markerIndex;
  const nextSource = mutateDocument(source, (root) => {
    const markers = arrayValue(rawWorld(root, worldId).markers, "markers");
    const current = objectValue(
      markers[markerIndex],
      `markers[${markerIndex}]`,
    );
    if (current.type !== "waypoint") return;
    let candidate = markerIndex + direction;
    while (candidate >= 0 && candidate < markers.length) {
      if (
        objectValue(markers[candidate], `markers[${candidate}]`).type ===
        "waypoint"
      ) {
        [markers[markerIndex], markers[candidate]] = [
          markers[candidate],
          markers[markerIndex],
        ];
        nextIndex = candidate;
        return;
      }
      candidate += direction;
    }
  });
  return { source: nextSource, markerIndex: nextIndex };
}

export function snapWorldValue(value: number, spacing: number): number {
  if (spacing <= 0) return value;
  return Math.round(value / spacing) * spacing;
}

export function worldEditorWarnings(
  world: WorldDefinition,
): WorldEditorWarning[] {
  const cos = Math.cos(world.initialPose.headingRad);
  const sin = Math.sin(world.initialPose.headingRad);
  const corners = [
    [-ROBOT_HALF_LENGTH_MM, -ROBOT_HALF_WIDTH_MM],
    [ROBOT_HALF_LENGTH_MM, -ROBOT_HALF_WIDTH_MM],
    [ROBOT_HALF_LENGTH_MM, ROBOT_HALF_WIDTH_MM],
    [-ROBOT_HALF_LENGTH_MM, ROBOT_HALF_WIDTH_MM],
  ].map(([x = 0, y = 0]) => ({
    x: world.initialPose.xMm + x * cos - y * sin,
    y: world.initialPose.yMm + x * sin + y * cos,
  }));
  const polygonOverlapsRectangle = (
    rectangle: WorldDefinition["obstacles"][number],
  ) => {
    const rectangleCorners = [
      { x: rectangle.minimumXmm, y: rectangle.minimumYmm },
      { x: rectangle.maximumXmm, y: rectangle.minimumYmm },
      { x: rectangle.maximumXmm, y: rectangle.maximumYmm },
      { x: rectangle.minimumXmm, y: rectangle.maximumYmm },
    ];
    const axes = [
      { x: 1, y: 0 },
      { x: 0, y: 1 },
      ...corners.map((point, index) => {
        const next = corners[(index + 1) % corners.length]!;
        const edge = { x: next.x - point.x, y: next.y - point.y };
        return { x: -edge.y, y: edge.x };
      }),
    ];
    return axes.every((axis) => {
      const footprintProjection = corners.map(
        (point) => point.x * axis.x + point.y * axis.y,
      );
      const obstacleProjection = rectangleCorners.map(
        (point) => point.x * axis.x + point.y * axis.y,
      );
      return (
        Math.max(...footprintProjection) >= Math.min(...obstacleProjection) &&
        Math.max(...obstacleProjection) >= Math.min(...footprintProjection)
      );
    });
  };
  const collision = world.obstacles.find(polygonOverlapsRectangle);
  return collision
    ? [
        {
          code: "initial-footprint-collision",
          message: `The initial XRP footprint overlaps ${collision.label ?? `a ${collision.type}`}.`,
        },
      ]
    : [];
}
