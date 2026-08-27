import {
  DEFAULT_WORLD_CATALOG,
  parseWorldCatalog,
  type WorldCatalog,
} from "@ucsb-xrp/simulator";

import type { CourseProject } from "./types";

export const PROJECT_WORLD_FILE = "world.json";

export function worldCatalogForProject(project: CourseProject): WorldCatalog {
  const source = project.files[PROJECT_WORLD_FILE];
  return source === undefined
    ? DEFAULT_WORLD_CATALOG
    : parseWorldCatalog(source);
}

/**
 * Return an execution-only project whose Python world matches the Monitor.
 *
 * The project file remains the source of every world definition. Selecting a
 * different world changes only ``default_world`` in the copy sent to the
 * virtual MicroPython runtime, so ``load_world()`` and the simulator always
 * use the same geometry without modifying the student's saved file.
 */
export function projectWithSelectedWorld(
  project: CourseProject,
  worldId: string,
): CourseProject {
  const source = project.files[PROJECT_WORLD_FILE];
  if (source === undefined) {
    return project;
  }
  const catalog = worldCatalogForProject(project);
  if (!catalog.worlds.some((world) => world.id === worldId)) {
    throw new Error(`Unknown world '${worldId}'`);
  }
  if (catalog.defaultWorldId === worldId) {
    return project;
  }
  const root = JSON.parse(source) as Record<string, unknown>;
  return {
    ...project,
    files: {
      ...project.files,
      [PROJECT_WORLD_FILE]: `${JSON.stringify(
        { ...root, default_world: worldId },
        null,
        2,
      )}\n`,
    },
  };
}
