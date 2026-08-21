import type { CourseProject } from "./types";
import { worldCatalogForProject } from "./project-world";

export interface PreparedProject {
  entrypoint: string;
  files: ReadonlyArray<readonly [path: string, content: string]>;
  pythonPaths: string[];
}

export function normalizeProjectPath(path: string): string {
  const normalized = path.replaceAll("\\", "/").replace(/^\/+/, "");
  if (
    normalized.length === 0 ||
    normalized.includes("\0") ||
    normalized
      .split("/")
      .some((part) => part === "" || part === "." || part === "..")
  ) {
    throw new Error(`Invalid project path '${path}'`);
  }
  return normalized;
}

export function prepareProject(project: CourseProject): PreparedProject {
  worldCatalogForProject(project);
  const entrypoint = normalizeProjectPath(project.entrypoint);
  if (!entrypoint.endsWith(".py")) {
    throw new Error("The project entry point must be a Python (.py) file");
  }

  const normalizedFiles: Array<readonly [string, string]> = [];
  const seenPaths = new Set<string>();
  for (const [unsafePath, content] of Object.entries(project.files)) {
    const path = normalizeProjectPath(unsafePath);
    if (seenPaths.has(path)) {
      throw new Error(`Duplicate normalized project path '${path}'`);
    }
    if (typeof content !== "string") {
      throw new Error(`Project file '${path}' does not contain text`);
    }
    seenPaths.add(path);
    normalizedFiles.push([path, content]);
  }

  if (!seenPaths.has(entrypoint)) {
    throw new Error(`Project entry point '${entrypoint}' does not exist`);
  }

  const pythonPaths = normalizedFiles
    .map(([path]) => path)
    .filter((path) => path.endsWith(".py"));
  return { entrypoint, files: normalizedFiles, pythonPaths };
}
