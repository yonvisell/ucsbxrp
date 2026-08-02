import type { CourseProject } from "./types";

export interface CourseStarter {
  id: string;
  label: string;
  shortLabel: string;
  summary: string;
  project: CourseProject;
}

const rawStarterFiles = import.meta.glob(
  "../../../vendor/current/starters/challenge_*/*.py",
  {
    eager: true,
    import: "default",
    query: "?raw",
  },
) as Record<string, string>;

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
