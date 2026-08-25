export interface ChallengeComponentSpec {
  file: string;
  class_name: string;
  responsibility: string;
}

export interface SuppliedFileSpec {
  name: string;
  use: string;
}

export interface ChallengeSpec {
  schema_version: 1;
  source_id: string;
  id: string;
  title: string;
  summary: string;
  objective: string;
  student_implementations: ChallengeComponentSpec[];
  supplied_files: SuppliedFileSpec[];
  program_flow: string;
  evidence: string[];
  work_sequence: string[];
  world: Record<string, unknown>;
  files?: Record<string, string>;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function lineError(value: unknown, label: string): string | null {
  return typeof value === "string" && value.trim() && !value.includes("\n")
    ? null
    : `${label} must be one nonempty line.`;
}

export function linesFromText(value: string): string[] {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

export function suppliedFilesFromText(value: string): SuppliedFileSpec[] {
  return linesFromText(value).map((line) => {
    const separator = line.indexOf("|");
    if (separator < 0) return { name: line, use: "" };
    return {
      name: line.slice(0, separator).trim(),
      use: line.slice(separator + 1).trim(),
    };
  });
}

export function suppliedFilesToText(value: SuppliedFileSpec[]): string {
  return value.map((item) => `${item.name} | ${item.use}`).join("\n");
}

export function validateChallengeSpec(value: unknown): string[] {
  if (!isRecord(value)) return ["The specification must be a JSON object."];
  const errors: string[] = [];
  if (value.schema_version !== 1) errors.push("Schema version must be 1.");
  for (const [key, label] of [
    ["source_id", "Starting challenge"],
    ["id", "Challenge ID"],
    ["title", "Title"],
    ["summary", "Catalog summary"],
  ] as const) {
    const error = lineError(value[key], label);
    if (error) errors.push(error);
  }
  if (
    typeof value.id === "string" &&
    !/^challenge_[1-9][0-9]*$/.test(value.id)
  ) {
    errors.push("Challenge ID must have the form challenge_6.");
  }
  for (const [key, label] of [
    ["objective", "Objective"],
    ["program_flow", "Program flow"],
  ] as const) {
    if (typeof value[key] !== "string" || !value[key].trim()) {
      errors.push(`${label} is required.`);
    }
  }
  for (const [key, label] of [
    ["evidence", "Evidence"],
    ["work_sequence", "Work sequence"],
  ] as const) {
    if (
      !Array.isArray(value[key]) ||
      value[key].length === 0 ||
      value[key].some((item) => typeof item !== "string" || !item.trim())
    ) {
      errors.push(`${label} must contain at least one nonempty item.`);
    }
  }
  if (
    !Array.isArray(value.student_implementations) ||
    value.student_implementations.length === 0
  ) {
    errors.push("Select at least one student implementation.");
  } else {
    value.student_implementations.forEach((item, index) => {
      if (
        !isRecord(item) ||
        ["file", "class_name", "responsibility"].some(
          (key) => typeof item[key] !== "string" || !item[key].trim(),
        )
      ) {
        errors.push(`Student implementation ${index + 1} is incomplete.`);
      }
    });
  }
  if (
    !Array.isArray(value.supplied_files) ||
    value.supplied_files.length === 0
  ) {
    errors.push("Describe the supplied project files and services.");
  } else {
    const supplied = value.supplied_files;
    supplied.forEach((item, index) => {
      if (
        !isRecord(item) ||
        typeof item.name !== "string" ||
        !item.name.trim() ||
        typeof item.use !== "string" ||
        !item.use.trim()
      ) {
        errors.push(`Supplied item ${index + 1} needs a name and use.`);
      }
    });
    if (
      !supplied.some((item) => isRecord(item) && item.name === "world.json")
    ) {
      errors.push("The supplied items must explain world.json.");
    }
  }

  if (!isRecord(value.world) || !Array.isArray(value.world.worlds)) {
    errors.push("World JSON must contain a worlds array.");
  } else {
    const worldValue = value.world;
    const worlds = worldValue.worlds as unknown[];
    const ids = new Set<string>();
    for (const [index, world] of worlds.entries()) {
      if (!isRecord(world) || typeof world.id !== "string" || !world.id) {
        errors.push(`World ${index + 1} needs an ID.`);
        continue;
      }
      if (ids.has(world.id)) errors.push(`World ID ${world.id} is duplicated.`);
      ids.add(world.id);
      const bounds = world.bounds;
      if (!isRecord(bounds)) {
        errors.push(`World ${world.id} needs bounds.`);
        continue;
      }
      const minimumX = Number(bounds.minimum_x_mm);
      const minimumY = Number(bounds.minimum_y_mm);
      const maximumX = Number(bounds.maximum_x_mm);
      const maximumY = Number(bounds.maximum_y_mm);
      if (
        ![minimumX, minimumY, maximumX, maximumY].every(Number.isFinite) ||
        maximumX <= minimumX ||
        maximumY <= minimumY
      ) {
        errors.push(
          `World ${world.id} bounds must have positive width and height.`,
        );
      }
    }
    if (
      typeof worldValue.default_world !== "string" ||
      !ids.has(worldValue.default_world)
    ) {
      errors.push("default_world must name one defined world.");
    } else {
      const selected = worlds.find(
        (world) => isRecord(world) && world.id === worldValue.default_world,
      );
      if (isRecord(selected)) {
        const markers = Array.isArray(selected.markers) ? selected.markers : [];
        const waypointNames = new Set(
          markers
            .filter((marker) => isRecord(marker) && marker.type === "waypoint")
            .map((marker) => (marker as Record<string, unknown>).name),
        );
        const replacesChallengeLoader =
          isRecord(value.files) &&
          typeof value.files["challenge.py"] === "string";
        const requiredWaypoint: Record<string, string> = {
          challenge_1: "finish",
          challenge_2: "turn",
          challenge_4: "destination",
          challenge_5: "destination",
        };
        const required =
          typeof value.source_id === "string"
            ? requiredWaypoint[value.source_id]
            : undefined;
        if (
          !replacesChallengeLoader &&
          required &&
          !waypointNames.has(required)
        ) {
          errors.push(
            `${value.source_id} source requires a waypoint named ${required}.`,
          );
        }
        if (
          !replacesChallengeLoader &&
          value.source_id === "challenge_3" &&
          waypointNames.size === 0
        ) {
          errors.push("challenge_3 source requires at least one waypoint.");
        }
        if (!replacesChallengeLoader && value.source_id === "challenge_5") {
          const obstacles = Array.isArray(selected.obstacles)
            ? selected.obstacles
            : [];
          const hasGate = obstacles.some(
            (item) => isRecord(item) && item.feature === "center_gate",
          );
          if (!hasGate) {
            errors.push(
              "challenge_5 source requires an obstacle feature named center_gate.",
            );
          }
        }
      }
    }
  }
  if (value.files !== undefined) {
    if (!isRecord(value.files)) {
      errors.push("Project file overrides must be a path-to-text object.");
    } else {
      for (const [path, contents] of Object.entries(value.files)) {
        if (path === "README.md" || path === "world.json") {
          errors.push(`${path} is generated from its specification fields.`);
          continue;
        }
        if (
          path.startsWith("/") ||
          path.includes("\\") ||
          path.includes(":") ||
          path.split("/").includes("..") ||
          !/\.(json|md|py|txt)$/.test(path) ||
          typeof contents !== "string"
        ) {
          errors.push(`Project file override ${path} is invalid.`);
        }
      }
    }
  }
  return errors;
}

export function specificationFilename(spec: ChallengeSpec): string {
  return `${spec.id || "challenge"}.challenge.json`;
}

export function authoringCommand(filename: string): string {
  return `python3 scripts/challenge_authoring.py create --spec ${filename}`;
}
