import type { CourseProject } from "./types";

export interface CourseStarter {
  id: string;
  label: string;
  shortLabel: string;
  summary: string;
  project: CourseProject;
}

export type CourseProjectKind = "challenge" | "demo" | "tutorial";

export interface CourseProjectTemplate extends CourseStarter {
  kind: CourseProjectKind;
}

const rawStarterFiles = import.meta.glob(
  "../../../vendor/current/starters/challenge_*/*.py",
  {
    eager: true,
    import: "default",
    query: "?raw",
  },
) as Record<string, string>;

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
};

const metadata = [
  {
    id: "challenge_1",
    label: "Challenge 1 · Straight Run",
    shortLabel: "1 · Straight Run",
    summary: "Measure wheel motion and control a straight-line run.",
  },
  {
    id: "challenge_2",
    label: "Challenge 2 · Turn and Return",
    shortLabel: "2 · Turn and Return",
    summary: "Add differential-drive kinematics and planar odometry.",
  },
  {
    id: "challenge_3",
    label: "Challenge 3 · Waypoint Courier",
    shortLabel: "3 · Waypoint Courier",
    summary: "Follow ordered world-coordinate goals.",
  },
  {
    id: "challenge_4",
    label: "Challenge 4 · Mapped Route",
    shortLabel: "4 · Mapped Route",
    summary: "Plan a shortest free grid path and execute it.",
  },
  {
    id: "challenge_5",
    label: "Challenge 5 · Delivery Mission",
    shortLabel: "5 · Delivery Mission",
    summary: "Observe, update the map, plan, and deliver.",
  },
] as const;

function projectFor(starterId: string, name: string): CourseProject {
  const marker = `/starters/${starterId}/`;
  const files = Object.fromEntries(
    Object.entries(rawStarterFiles)
      .filter(([sourcePath]) => sourcePath.includes(marker))
      .map(([sourcePath, content]) => [sourcePath.split(marker)[1], content]),
  );
  if (!("main.py" in files) || Object.keys(files).length < 5) {
    throw new Error(`${starterId} must contain a complete Python project`);
  }
  return Object.freeze({
    name,
    entrypoint: "main.py",
    files: Object.freeze(files),
  });
}

export const COURSE_STARTERS: readonly CourseStarter[] = Object.freeze(
  metadata.map((starter) =>
    Object.freeze({
      ...starter,
      project: projectFor(starter.id, starter.shortLabel),
    }),
  ),
);

const additionalTemplates = [
  {
    id: "demo_obstacle_turn",
    kind: "demo",
    label: "Demo · Obstacle, Left, Obstacle",
    shortLabel: "Obstacle, left, obstacle",
    summary:
      "Drive to a nearby obstacle, turn left 90 degrees, then drive to the next obstacle.",
    entrypoint: "main.py",
  },
  {
    id: "micropython_tutorial",
    kind: "tutorial",
    label: "Tutorial · MicroPython Foundations",
    shortLabel: "MicroPython foundations",
    summary:
      "Seven short lessons covering functions, collections, classes, exceptions, modules, a virtual robot, and state machines.",
    entrypoint: "1_values_and_functions.py",
  },
] as const;

function additionalProject(
  template: (typeof additionalTemplates)[number],
): CourseProject {
  const marker = `/templates/${template.id}/`;
  const files = Object.fromEntries(
    Object.entries(rawTemplateFiles)
      .filter(([sourcePath]) => sourcePath.includes(marker))
      .map(([sourcePath, content]) => [sourcePath.split(marker)[1], content]),
  );
  if (!(template.entrypoint in files) || Object.keys(files).length < 2) {
    throw new Error(`${template.id} must contain a complete project template`);
  }
  return Object.freeze({
    name: template.shortLabel,
    entrypoint: template.entrypoint,
    files: Object.freeze(files),
  });
}

export const COURSE_PROJECT_TEMPLATES: readonly CourseProjectTemplate[] =
  Object.freeze([
    ...COURSE_STARTERS.map((starter) =>
      Object.freeze({ ...starter, kind: "challenge" as const }),
    ),
    ...additionalTemplates.map((template) =>
      Object.freeze({ ...template, project: additionalProject(template) }),
    ),
  ]);

export const STAGE_ONE_PROJECT = COURSE_STARTERS[0]!.project;

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
