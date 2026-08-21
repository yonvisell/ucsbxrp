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
