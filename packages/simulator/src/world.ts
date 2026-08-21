export interface AxisAlignedRectangle {
  minimumXmm: number;
  minimumYmm: number;
  maximumXmm: number;
  maximumYmm: number;
}

export interface WorldObstacle extends AxisAlignedRectangle {
  type: "block" | "wall";
  label?: string;
  feature?: string;
}

export type WorldMarker =
  | {
      type: "start_line";
      name?: string;
      label?: string;
      x1Mm: number;
      y1Mm: number;
      x2Mm: number;
      y2Mm: number;
    }
  | ({
      type: "start_box";
      name?: string;
      label?: string;
    } & AxisAlignedRectangle)
  | {
      type: "waypoint";
      name?: string;
      label?: string;
      xMm: number;
      yMm: number;
    };

export interface WorldDefinition {
  id: string;
  label: string;
  bounds: AxisAlignedRectangle;
  initialPose: { xMm: number; yMm: number; headingRad: number };
  obstacles: readonly WorldObstacle[];
  markers: readonly WorldMarker[];
}

export interface WorldCatalog {
  defaultWorldId: string;
  worlds: readonly WorldDefinition[];
}

const defaultBounds: AxisAlignedRectangle = {
  minimumXmm: -1200,
  minimumYmm: -900,
  maximumXmm: 1200,
  maximumYmm: 900,
};

export const DEFAULT_WORLD_CATALOG: WorldCatalog = {
  defaultWorldId: "open",
  worlds: [
    {
      id: "open",
      label: "Open field",
      bounds: defaultBounds,
      initialPose: { xMm: 0, yMm: 0, headingRad: 0 },
      obstacles: [],
      markers: [
        {
          type: "start_box",
          label: "Start",
          minimumXmm: -120,
          minimumYmm: -120,
          maximumXmm: 120,
          maximumYmm: 120,
        },
      ],
    },
    {
      id: "delivery-gate-blocked",
      label: "Delivery gate blocked",
      bounds: defaultBounds,
      initialPose: { xMm: 0, yMm: 0, headingRad: 0 },
      obstacles: [
        {
          type: "block",
          label: "Blocked gate",
          minimumXmm: 350,
          minimumYmm: -100,
          maximumXmm: 450,
          maximumYmm: 100,
        },
      ],
      markers: [
        {
          type: "start_line",
          label: "Start",
          x1Mm: 0,
          y1Mm: -140,
          x2Mm: 0,
          y2Mm: 140,
        },
        { type: "waypoint", label: "Delivery", xMm: 900, yMm: 0 },
      ],
    },
  ],
};

function objectValue(value: unknown, name: string): Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${name} must be an object`);
  }
  return value as Record<string, unknown>;
}

function arrayValue(value: unknown, name: string, maximum: number): unknown[] {
  if (!Array.isArray(value) || value.length > maximum) {
    throw new Error(`${name} must be a list with at most ${maximum} items`);
  }
  return value;
}

function numberValue(value: unknown, name: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`${name} must be a finite number`);
  }
  return value;
}

function textValue(value: unknown, name: string, maximum = 64): string {
  if (typeof value !== "string" || !value.trim() || value.length > maximum) {
    throw new Error(`${name} must contain 1 to ${maximum} characters`);
  }
  return value.trim();
}

function optionalLabel(value: unknown, name: string): string | undefined {
  return value === undefined ? undefined : textValue(value, name, 48);
}

function identifier(value: unknown, name: string): string {
  const text = textValue(value, name, 32);
  if (!/^[a-z][a-z0-9_-]*$/.test(text)) {
    throw new Error(
      `${name} must use lower-case letters, digits, underscores, and hyphens`,
    );
  }
  return text;
}

function rectangle(value: unknown, name: string): AxisAlignedRectangle {
  const item = objectValue(value, name);
  const result = {
    minimumXmm: numberValue(item.minimum_x_mm, `${name}.minimum_x_mm`),
    minimumYmm: numberValue(item.minimum_y_mm, `${name}.minimum_y_mm`),
    maximumXmm: numberValue(item.maximum_x_mm, `${name}.maximum_x_mm`),
    maximumYmm: numberValue(item.maximum_y_mm, `${name}.maximum_y_mm`),
  };
  if (
    result.maximumXmm <= result.minimumXmm ||
    result.maximumYmm <= result.minimumYmm
  ) {
    throw new Error(`${name} must have positive width and height`);
  }
  return result;
}

function parseWorld(value: unknown, index: number): WorldDefinition {
  const item = objectValue(value, `worlds[${index}]`);
  const bounds = rectangle(item.bounds, `worlds[${index}].bounds`);
  const pose = objectValue(
    item.initial_pose ?? { x_mm: 0, y_mm: 0, heading_rad: 0 },
    `worlds[${index}].initial_pose`,
  );
  const initialPose = {
    xMm: numberValue(pose.x_mm, `worlds[${index}].initial_pose.x_mm`),
    yMm: numberValue(pose.y_mm, `worlds[${index}].initial_pose.y_mm`),
    headingRad: numberValue(
      pose.heading_rad,
      `worlds[${index}].initial_pose.heading_rad`,
    ),
  };
  if (
    initialPose.xMm < bounds.minimumXmm ||
    initialPose.xMm > bounds.maximumXmm ||
    initialPose.yMm < bounds.minimumYmm ||
    initialPose.yMm > bounds.maximumYmm
  ) {
    throw new Error(`worlds[${index}].initial_pose must be inside the bounds`);
  }
  const obstacles = arrayValue(
    item.obstacles ?? [],
    `worlds[${index}].obstacles`,
    32,
  ).map((value, obstacleIndex): WorldObstacle => {
    const source = objectValue(
      value,
      `worlds[${index}].obstacles[${obstacleIndex}]`,
    );
    if (source.type !== "block" && source.type !== "wall") {
      throw new Error(
        `worlds[${index}].obstacles[${obstacleIndex}].type must be block or wall`,
      );
    }
    return {
      ...rectangle(source, `worlds[${index}].obstacles[${obstacleIndex}]`),
      type: source.type,
      label: optionalLabel(
        source.label,
        `worlds[${index}].obstacles[${obstacleIndex}].label`,
      ),
      feature:
        source.feature === undefined
          ? undefined
          : identifier(
              source.feature,
              `worlds[${index}].obstacles[${obstacleIndex}].feature`,
            ),
    };
  });
  const markers = arrayValue(
    item.markers ?? [],
    `worlds[${index}].markers`,
    32,
  ).map((value, markerIndex): WorldMarker => {
    const name = `worlds[${index}].markers[${markerIndex}]`;
    const source = objectValue(value, name);
    const label = optionalLabel(source.label, `${name}.label`);
    const markerName =
      source.name === undefined
        ? undefined
        : identifier(source.name, `${name}.name`);
    if (source.type === "start_line") {
      return {
        type: "start_line",
        name: markerName,
        label,
        x1Mm: numberValue(source.x1_mm, `${name}.x1_mm`),
        y1Mm: numberValue(source.y1_mm, `${name}.y1_mm`),
        x2Mm: numberValue(source.x2_mm, `${name}.x2_mm`),
        y2Mm: numberValue(source.y2_mm, `${name}.y2_mm`),
      };
    }
    if (source.type === "start_box") {
      return {
        type: "start_box",
        name: markerName,
        label,
        ...rectangle(source, name),
      };
    }
    if (source.type === "waypoint") {
      return {
        type: "waypoint",
        name: markerName,
        label,
        xMm: numberValue(source.x_mm, `${name}.x_mm`),
        yMm: numberValue(source.y_mm, `${name}.y_mm`),
      };
    }
    throw new Error(`${name}.type is not a supported marker`);
  });
  return {
    id: identifier(item.id, `worlds[${index}].id`),
    label: textValue(item.label, `worlds[${index}].label`),
    bounds,
    initialPose,
    obstacles,
    markers,
  };
}

export function parseWorldCatalog(source: string): WorldCatalog {
  if (source.length > 64_000) {
    throw new Error("world.json is too large");
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(source);
  } catch (error) {
    throw new Error(
      `world.json is not valid JSON: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
  const root = objectValue(parsed, "world.json");
  const worlds = arrayValue(root.worlds, "worlds", 8).map(parseWorld);
  if (worlds.length === 0) {
    throw new Error("worlds must contain at least one world");
  }
  if (new Set(worlds.map((world) => world.id)).size !== worlds.length) {
    throw new Error("world IDs must be unique");
  }
  const defaultWorldId = identifier(root.default_world, "default_world");
  if (!worlds.some((world) => world.id === defaultWorldId)) {
    throw new Error("default_world must name one of the worlds");
  }
  return { defaultWorldId, worlds };
}

export function worldById(
  catalog: WorldCatalog,
  worldId: string,
): WorldDefinition {
  const world = catalog.worlds.find((candidate) => candidate.id === worldId);
  if (!world) {
    throw new Error(`Unknown world '${worldId}'`);
  }
  return world;
}
