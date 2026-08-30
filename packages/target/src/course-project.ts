import type { CourseProject } from "./types";
import catalogEntries from "../../../vendor/current/project_catalog.json" with { type: "json" };

export interface CourseStarter {
  id: string;
  label: string;
  shortLabel: string;
  summary: string;
  project: CourseProject;
}

export type CourseProjectKind =
  "challenge" | "complete-challenge" | "demo" | "tutorial";

export interface CourseComponentTemplate {
  name: string;
  file: string;
  selectionFlag: string;
}

export interface CourseProjectTemplate extends CourseStarter {
  kind: CourseProjectKind;
  components: readonly CourseComponentTemplate[];
}

const rawStarterFiles = {
  ...(import.meta.glob("../../../vendor/current/starters/challenge_*/*.py", {
    eager: true,
    import: "default",
    query: "?raw",
  }) as Record<string, string>),
  ...(import.meta.glob("../../../vendor/current/starters/challenge_*/*.md", {
    eager: true,
    import: "default",
    query: "?raw",
  }) as Record<string, string>),
  ...(import.meta.glob("../../../vendor/current/starters/challenge_*/*.json", {
    eager: true,
    import: "default",
    query: "?raw",
  }) as Record<string, string>),
};

const rawTemplateFiles = {
  ...(import.meta.glob("../../../vendor/current/templates/**/*.py", {
    eager: true,
    import: "default",
    query: "?raw",
  }) as Record<string, string>),
  ...(import.meta.glob("../../../vendor/current/templates/**/*.md", {
    eager: true,
    import: "default",
    query: "?raw",
  }) as Record<string, string>),
  ...(import.meta.glob("../../../vendor/current/templates/**/*.json", {
    eager: true,
    import: "default",
    query: "?raw",
  }) as Record<string, string>),
};

interface CatalogEntry {
  id: string;
  kind: CourseProjectKind;
  source: string;
  label: string;
  short_label: string;
  summary: string;
  entrypoint: string;
  components?: Array<{
    name: string;
    file: string;
    selection_flag: string;
  }>;
  published: boolean;
}

const catalog = (catalogEntries as CatalogEntry[]).filter(
  (entry) => entry.published,
);

const suppliedCoreComponents = [
  "DifferentialDrive",
  "GridPlanner",
  "NavigationController",
  "Odometry",
  "SensorModel",
  "WheelSpeedController",
] as const;

function completeCourseSetup(componentNames: ReadonlySet<string>): string {
  const importedCore = suppliedCoreComponents.filter(
    (name) =>
      [
        "DifferentialDrive",
        "Odometry",
        "SensorModel",
        "WheelSpeedController",
      ].includes(name) || componentNames.has(name),
  );
  const lines = [
    "# Complete demonstration: every course component comes from the supplied references.",
    "# Student implementation files are intentionally absent from this project.",
    "",
    "from ucsb_xrp import Robot, XRPBot",
    "from ucsb_xrp_reference import (",
    ...importedCore.map((name) => `    ${name},`),
    ")",
  ];
  if (componentNames.has("RangeSafetyController")) {
    lines.push(
      "from ucsb_xrp_reference.challenge_6 import RangeSafetyController",
    );
  }
  if (componentNames.has("PoseCorrector")) {
    lines.push("from ucsb_xrp_reference.challenge_7 import PoseCorrector");
  }
  if (componentNames.has("VisitOrderPlanner")) {
    lines.push("from ucsb_xrp_reference.challenge_8 import VisitOrderPlanner");
  }
  if (componentNames.has("LineFollower")) {
    lines.push("from ucsb_xrp_reference.challenge_9 import LineFollower");
  }
  lines.push(
    "",
    "",
    "def make_robot(config):",
    "    return Robot(",
    "        config,",
    "        XRPBot(config),",
    "        SensorModel(config),",
    "        WheelSpeedController(config),",
    "        DifferentialDrive(config),",
    "        Odometry(config),",
    "    )",
  );
  if (componentNames.has("NavigationController")) {
    lines.push(
      "",
      "",
      "def make_navigation_controller(config):",
      "    return NavigationController(config)",
    );
  }
  if (componentNames.has("GridPlanner")) {
    lines.push("", "", "def make_grid_planner():", "    return GridPlanner()");
  }
  if (componentNames.has("VisitOrderPlanner")) {
    lines.push(
      "",
      "",
      "def make_route_cost_grid_planner():",
      "    return GridPlanner()",
    );
  }
  if (componentNames.has("LineFollower")) {
    lines.push(
      "",
      "",
      "def make_line_follower(settings):",
      "    return LineFollower(settings)",
    );
  }
  if (componentNames.has("RangeSafetyController")) {
    lines.push(
      "",
      "",
      "def make_range_safety_controller(*settings):",
      "    return RangeSafetyController(*settings)",
    );
  }
  if (componentNames.has("PoseCorrector")) {
    lines.push(
      "",
      "",
      "def make_pose_corrector(sensor_forward_offset_mm):",
      "    return PoseCorrector(sensor_forward_offset_mm)",
    );
  }
  if (componentNames.has("VisitOrderPlanner")) {
    lines.push(
      "",
      "",
      "def make_visit_order_planner():",
      "    return VisitOrderPlanner()",
    );
  }
  return `${lines.join("\n")}\n`;
}

function completeChallengeFiles(
  entry: CatalogEntry,
  sourceFiles: Record<string, string>,
): Record<string, string> {
  const studentEntry = catalog.find(
    (candidate) =>
      candidate.kind === "challenge" && candidate.source === entry.source,
  );
  if (!studentEntry?.components?.length) {
    throw new Error(`${entry.id} has no matching student challenge`);
  }
  const files = { ...sourceFiles };
  for (const component of studentEntry.components) delete files[component.file];
  delete files["component_checks.py"];
  const componentNames = new Set(
    studentEntry.components.map((component) => component.name),
  );
  files["course_setup.py"] = completeCourseSetup(componentNames);
  const sourceReadme = sourceFiles["README.md"] ?? "";
  const challengeBrief =
    sourceReadme
      .match(/## The challenge\s*\n([\s\S]*?)(?=\n## |$)/)?.[1]
      ?.trim() ?? entry.summary;
  files["README.md"] = [
    `# ${entry.label}`,
    "",
    "This is the runnable reference demonstration of the corresponding student challenge.",
    "Every course component is supplied and selected in `course_setup.py`.",
    "Student component files and component checks are intentionally absent.",
    "",
    "## Task represented",
    "",
    challengeBrief,
    "",
    "## Run the reference",
    "",
    "1. Use the Virtual XRP and open Monitor.",
    "2. Select a world case in Monitor when the project provides more than one.",
    "3. Select **Run** and inspect the path, telemetry, and Program output.",
    "",
    "`main.py` executes the mission, `challenge.py` loads its task values,",
    "`world.json` defines the full course arena and scenario geometry, and",
    "`robot_config.py` contains robot settings. To implement and test the course",
    "components, create the student version of this challenge from Home instead.",
    "",
  ].join("\n");
  return files;
}

function projectFor(entry: CatalogEntry): CourseProject {
  const marker = `/${entry.source}/`;
  const sources = entry.source.startsWith("starters/")
    ? rawStarterFiles
    : rawTemplateFiles;
  let files = Object.fromEntries(
    Object.entries(sources)
      .filter(([sourcePath]) => sourcePath.includes(marker))
      .map(([sourcePath, content]) => [sourcePath.split(marker)[1], content]),
  );
  if (entry.kind === "complete-challenge") {
    files = completeChallengeFiles(entry, files);
  }
  if (!(entry.entrypoint in files) || Object.keys(files).length < 2) {
    throw new Error(`${entry.id} must contain a complete project`);
  }
  return Object.freeze({
    name: entry.short_label,
    entrypoint: entry.entrypoint,
    files: Object.freeze(files),
  });
}

export const COURSE_STARTERS: readonly CourseStarter[] = Object.freeze(
  catalog
    .filter((entry) => entry.kind === "challenge")
    .map((entry) =>
      Object.freeze({
        id: entry.id,
        label: entry.label,
        shortLabel: entry.short_label,
        summary: entry.summary,
        project: projectFor(entry),
      }),
    ),
);

export const COURSE_PROJECT_TEMPLATES: readonly CourseProjectTemplate[] =
  Object.freeze([
    ...catalog.map((entry) =>
      Object.freeze({
        id: entry.id,
        kind: entry.kind,
        label: entry.label,
        shortLabel: entry.short_label,
        summary: entry.summary,
        components: Object.freeze(
          (entry.components ?? []).map((component) =>
            Object.freeze({
              name: component.name,
              file: component.file,
              selectionFlag: component.selection_flag,
            }),
          ),
        ),
        project: projectFor(entry),
      }),
    ),
  ]);

export const STAGE_ONE_PROJECT = COURSE_STARTERS[0]!.project;
export const DEFAULT_COURSE_PROJECT_TEMPLATE_ID = "demo_spiral";

export function courseStarter(starterId: string): CourseStarter {
  const starter = COURSE_STARTERS.find(
    (candidate) => candidate.id === starterId,
  );
  if (!starter) {
    throw new Error(`Unknown course starter '${starterId}'`);
  }
  return starter;
}

export function courseProjectTemplate(
  templateId: string,
): CourseProjectTemplate {
  const template = COURSE_PROJECT_TEMPLATES.find(
    (candidate) => candidate.id === templateId,
  );
  if (!template) {
    throw new Error(`Unknown course project template '${templateId}'`);
  }
  return template;
}

function selectStudentComponent(source: string, selectionFlag: string): string {
  if (!/^[A-Z][A-Z0-9_]*$/.test(selectionFlag)) {
    throw new Error(`Invalid component selection flag '${selectionFlag}'`);
  }
  const assignment = new RegExp(
    `^(${selectionFlag}\\s*=\\s*)False(\\s*)$`,
    "m",
  );
  const matches = source.match(assignment);
  if (!matches) {
    throw new Error(`The next challenge does not declare ${selectionFlag}`);
  }
  return source.replace(assignment, "$1True$2");
}

function studentComponentSelection(
  source: string,
  selectionFlag: string,
): boolean | null {
  if (!/^[A-Z][A-Z0-9_]*$/.test(selectionFlag)) {
    throw new Error(`Invalid component selection flag '${selectionFlag}'`);
  }
  const assignment = new RegExp(
    `^${selectionFlag}\\s*=\\s*(True|False)\\s*$`,
    "m",
  );
  const match = source.match(assignment);
  if (!match) {
    return null;
  }
  return match[1] === "True";
}

export interface ChallengeTransition {
  project: CourseProject;
  preserve: readonly string[];
  merge: readonly string[];
  replace: readonly string[];
  add: readonly string[];
  omit: readonly string[];
}

const replacedChallengeTaskFiles = new Set([
  "README.md",
  "main.py",
  "challenge.py",
  "world.json",
  "component_checks.py",
]);

const allChallengeComponentFiles = new Set(
  catalog
    .filter((entry) => entry.kind === "challenge")
    .flatMap((entry) => entry.components ?? [])
    .map((component) => component.file),
);

function assignedConstructorBlock(
  source: string,
  variable: string,
  constructor: string,
): string | null {
  const assignment = new RegExp(
    `^${variable}\\s*=\\s*${constructor}\\(`,
    "m",
  ).exec(source);
  if (!assignment) return null;
  const opening = source.indexOf("(", assignment.index);
  let depth = 0;
  for (let index = opening; index < source.length; index += 1) {
    if (source[index] === "(") depth += 1;
    if (source[index] === ")") {
      depth -= 1;
      if (depth === 0) {
        return source.slice(assignment.index, index + 1);
      }
    }
  }
  throw new Error(`${variable} has an unterminated ${constructor}(...) value`);
}

function mergeRobotCalibration(
  currentSource: string,
  targetSource: string,
): string {
  const currentBlock = assignedConstructorBlock(
    currentSource,
    "ROBOT_CONFIG",
    "RobotConfig",
  );
  const targetBlock = assignedConstructorBlock(
    targetSource,
    "ROBOT_CONFIG",
    "RobotConfig",
  );
  if (currentBlock === null || targetBlock === null) return targetSource;
  return targetSource.replace(targetBlock, currentBlock);
}

/**
 * Build and describe a separate project for another challenge.
 *
 * The task definition is replaced. Robot calibration, components consumed by
 * the selected target, helpers, notes, and other student-created files remain
 * intact. Component files irrelevant to the target stay in the source project.
 */
export function describeChallengeProjectTransition(
  currentTemplateId: string,
  targetTemplateId: string,
  currentProject: CourseProject,
): ChallengeTransition {
  const current = courseProjectTemplate(currentTemplateId);
  const target = courseProjectTemplate(targetTemplateId);
  if (current.kind !== "challenge" || target.kind !== "challenge") {
    throw new Error("Challenge transitions require two student challenges");
  }
  if (currentTemplateId === targetTemplateId) {
    throw new Error("Choose a different challenge project");
  }
  const files = { ...target.project.files };
  const preserved = new Set<string>();
  const merged = new Set<string>();
  const replaced = new Set<string>();
  const added = new Set<string>();
  const omitted = new Set<string>();
  let courseSetup = files["course_setup.py"];
  const currentCourseSetup = currentProject.files["course_setup.py"];
  if (courseSetup === undefined) {
    throw new Error(`${target.label} does not contain course_setup.py`);
  }
  if (currentCourseSetup === undefined) {
    throw new Error("The current challenge does not contain course_setup.py");
  }
  const targetComponentFiles = new Set(
    target.components.map((component) => component.file),
  );

  for (const [path, source] of Object.entries(currentProject.files)) {
    if (path === "course_setup.py" || replacedChallengeTaskFiles.has(path)) {
      continue;
    }
    if (
      allChallengeComponentFiles.has(path) &&
      !targetComponentFiles.has(path)
    ) {
      omitted.add(path);
      continue;
    }
    if (path === "robot_config.py" && files[path] !== undefined) {
      files[path] = mergeRobotCalibration(source, files[path]);
      merged.add(path);
      continue;
    }
    files[path] = source;
    preserved.add(path);
  }

  for (const component of target.components) {
    const studentSource = currentProject.files[component.file];
    if (studentSource !== undefined) {
      files[component.file] = studentSource;
      preserved.add(component.file);
    }
    if (
      studentComponentSelection(currentCourseSetup, component.selectionFlag)
    ) {
      courseSetup = selectStudentComponent(
        courseSetup,
        component.selectionFlag,
      );
    }
  }
  files["course_setup.py"] = courseSetup;
  for (const path of Object.keys(files)) {
    if (preserved.has(path) || merged.has(path)) continue;
    if (path === "course_setup.py" || path in currentProject.files) {
      replaced.add(path);
    } else {
      added.add(path);
    }
  }
  return {
    project: {
      name: target.project.name,
      entrypoint: target.project.entrypoint,
      files,
    },
    preserve: Object.freeze([...preserved].sort()),
    merge: Object.freeze([...merged].sort()),
    replace: Object.freeze([...replaced].sort()),
    add: Object.freeze([...added].sort()),
    omit: Object.freeze([...omitted].sort()),
  };
}

export const DEFAULT_COURSE_PROJECT = courseProjectTemplate(
  DEFAULT_COURSE_PROJECT_TEMPLATE_ID,
).project;
