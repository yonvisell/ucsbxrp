import type { CourseProject } from "./types";
import catalogSource from "../../../vendor/current/project_catalog.json?raw";

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
  published: boolean;
}

const catalog = (JSON.parse(catalogSource) as CatalogEntry[]).filter(
  (entry) => entry.published,
);

function projectFor(entry: CatalogEntry): CourseProject {
  const marker = `/${entry.source}/`;
  const sources = entry.source.startsWith("starters/")
    ? rawStarterFiles
    : rawTemplateFiles;
  const files = Object.fromEntries(
    Object.entries(sources)
      .filter(([sourcePath]) => sourcePath.includes(marker))
      .map(([sourcePath, content]) => [sourcePath.split(marker)[1], content]),
  );
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

export const DEFAULT_COURSE_PROJECT = courseProjectTemplate(
  DEFAULT_COURSE_PROJECT_TEMPLATE_ID,
).project;
