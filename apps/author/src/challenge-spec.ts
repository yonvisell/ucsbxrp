import { parseWorldCatalog } from "@ucsb-xrp/simulator";

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

const sourceComponentFiles: Record<string, ReadonlySet<string>> = {
  challenge_1: new Set(["sensor_model.py", "wheel_speed_controller.py"]),
  challenge_2: new Set([
    "sensor_model.py",
    "wheel_speed_controller.py",
    "differential_drive.py",
    "odometry.py",
  ]),
  challenge_3: new Set([
    "sensor_model.py",
    "wheel_speed_controller.py",
    "differential_drive.py",
    "odometry.py",
    "navigation_controller.py",
  ]),
  challenge_4: new Set([
    "sensor_model.py",
    "wheel_speed_controller.py",
    "differential_drive.py",
    "odometry.py",
    "navigation_controller.py",
    "grid_planner.py",
  ]),
  challenge_5: new Set([
    "sensor_model.py",
    "wheel_speed_controller.py",
    "differential_drive.py",
    "odometry.py",
    "navigation_controller.py",
    "grid_planner.py",
  ]),
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
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
    const componentKeys = new Set<string>();
    value.student_implementations.forEach((item, index) => {
      if (
        !isRecord(item) ||
        ["file", "class_name", "responsibility"].some(
          (key) => typeof item[key] !== "string" || !item[key].trim(),
        )
      ) {
        errors.push(`Student implementation ${index + 1} is incomplete.`);
        return;
      }
      if (
        !/^(?!\.)(?!.*(?:^|\/)\.\.?(?:\/|$))[A-Za-z0-9_/-]+\.py$/.test(
          item.file as string,
        )
      ) {
        errors.push(
          `Student implementation ${index + 1} needs a safe project-relative Python file.`,
        );
      }
      if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(item.class_name as string)) {
        errors.push(
          `Student implementation ${index + 1} needs a valid Python class name.`,
        );
      }
      const file = item.file as string;
      const className = item.class_name as string;
      const inheritedFiles =
        typeof value.source_id === "string"
          ? sourceComponentFiles[value.source_id]
          : undefined;
      const override = isRecord(value.files) ? value.files[file] : undefined;
      if (!inheritedFiles?.has(file) && typeof override !== "string") {
        errors.push(
          `Student implementation ${index + 1} needs a complete ${file} project-file override.`,
        );
      }
      if (
        typeof override === "string" &&
        /^[A-Za-z_][A-Za-z0-9_]*$/.test(className) &&
        !new RegExp(`(^|\\n)\\s*class\\s+${className}\\b`).test(override)
      ) {
        errors.push(`The ${file} override must define class ${className}.`);
      }
      const key = `${item.file}\0${item.class_name}`;
      if (componentKeys.has(key)) {
        errors.push(
          `Student implementation ${index + 1} duplicates an earlier file and class.`,
        );
      }
      componentKeys.add(key);
    });
  }
  if (
    !Array.isArray(value.supplied_files) ||
    value.supplied_files.length === 0
  ) {
    errors.push("Describe the supplied project files and services.");
  } else {
    const supplied = value.supplied_files;
    const suppliedNames = new Set<string>();
    supplied.forEach((item, index) => {
      if (
        !isRecord(item) ||
        typeof item.name !== "string" ||
        !item.name.trim() ||
        typeof item.use !== "string" ||
        !item.use.trim()
      ) {
        errors.push(`Supplied item ${index + 1} needs a name and use.`);
        return;
      }
      const name = item.name.trim();
      if (suppliedNames.has(name)) {
        errors.push(`Supplied item ${index + 1} duplicates ${name}.`);
      }
      suppliedNames.add(name);
    });
    if (
      !supplied.some((item) => isRecord(item) && item.name === "world.json")
    ) {
      errors.push("The supplied items must explain world.json.");
    }
  }

  let parsedWorld: ReturnType<typeof parseWorldCatalog> | null = null;
  if (!isRecord(value.world)) {
    errors.push("World JSON must contain one object.");
  } else {
    try {
      parsedWorld = parseWorldCatalog(JSON.stringify(value.world));
    } catch (error) {
      errors.push(
        `World JSON: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
  if (parsedWorld !== null) {
    const selected = parsedWorld.worlds.find(
      (world) => world.id === parsedWorld?.defaultWorldId,
    );
    if (selected) {
      const waypointNames = new Set(
        selected.markers.flatMap((marker) =>
          marker.type === "waypoint" && marker.name ? [marker.name] : [],
        ),
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
      if (!replacesChallengeLoader && value.source_id === "challenge_2") {
        const turn = selected.markers.find(
          (marker) => marker.type === "waypoint" && marker.name === "turn",
        );
        if (turn?.type === "waypoint" && turn.headingRad === undefined) {
          errors.push(
            "challenge_2 source requires the turn waypoint to define heading_rad.",
          );
        }
      }
      if (
        !replacesChallengeLoader &&
        value.source_id === "challenge_3" &&
        waypointNames.size === 0
      ) {
        errors.push("challenge_3 source requires at least one waypoint.");
      }
      if (
        !replacesChallengeLoader &&
        value.source_id === "challenge_5" &&
        !selected.obstacles.some((item) => item.feature === "center_gate")
      ) {
        errors.push(
          "challenge_5 source requires an obstacle feature named center_gate.",
        );
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
          path.split("/").some((part) => part === "." || part === "..") ||
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
