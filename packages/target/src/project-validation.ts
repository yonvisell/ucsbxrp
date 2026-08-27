import type { CourseProject } from "./types";
import { worldCatalogForProject } from "./project-world";

export interface PreparedProject {
  entrypoint: string;
  files: ReadonlyArray<readonly [path: string, content: string]>;
  pythonPaths: string[];
  totalBytes: number;
}

/** These limits are also enforced by device_service/ucsb_xrp_service/protocol.py. */
export const MAX_PORTABLE_PROJECT_FILES = 48;
export const MAX_PORTABLE_PROJECT_BYTES = 256 * 1024;
export const MAX_PORTABLE_FILE_BYTES = 96 * 1024;
export const MAX_PORTABLE_PROJECT_PATH_CHARACTERS = 160;

const portablePathCharacters = /^[A-Za-z0-9._/-]+$/;
const utf8Encoder = new TextEncoder();

export class PortableProjectError extends Error {
  constructor(
    readonly code: "invalid_project" | "project_too_large",
    message: string,
  ) {
    super(message);
    this.name = "PortableProjectError";
  }
}

function invalidProject(message: string): never {
  throw new PortableProjectError("invalid_project", message);
}

function projectTooLarge(message: string): never {
  throw new PortableProjectError("project_too_large", message);
}

export function normalizeProjectPath(path: string): string {
  if (typeof path !== "string") {
    invalidProject("Project file paths must be text");
  }
  const normalized = path.replaceAll("\\", "/").replace(/^\/+|\/+$/g, "");
  if (
    normalized.length === 0 ||
    normalized
      .split("/")
      .some((part) => part === "" || part === "." || part === "..")
  ) {
    invalidProject(
      `File path '${path}' is invalid. Use named folders without empty, '.' or '..' sections.`,
    );
  }
  if (normalized.length > MAX_PORTABLE_PROJECT_PATH_CHARACTERS) {
    invalidProject(
      `File path '${path}' has ${normalized.length} characters; XRP project paths may use at most ${MAX_PORTABLE_PROJECT_PATH_CHARACTERS}.`,
    );
  }
  if (!portablePathCharacters.test(normalized)) {
    invalidProject(
      `File path '${path}' contains a character the XRP cannot store. Use letters, numbers, '-', '_', '.', and '/'.`,
    );
  }
  return normalized;
}

/**
 * Validate the subset of a browser project that can be copied unchanged to an
 * XRP. Folder import deliberately has looser limits so an incompatible folder
 * can still be opened and repaired in the IDE.
 */
export function validatePortableProject(
  project: CourseProject,
): PreparedProject {
  if (typeof project !== "object" || project === null) {
    invalidProject("The project is not a valid project object");
  }
  if (
    typeof project.files !== "object" ||
    project.files === null ||
    Array.isArray(project.files)
  ) {
    invalidProject("The project files are not a valid file collection");
  }

  const fileEntries = Object.entries(project.files);
  if (fileEntries.length === 0) {
    invalidProject(
      "This project has no files. Add a Python file, then try again.",
    );
  }
  if (fileEntries.length > MAX_PORTABLE_PROJECT_FILES) {
    const excessFiles = fileEntries.length - MAX_PORTABLE_PROJECT_FILES;
    projectTooLarge(
      `This project has ${fileEntries.length} files; an XRP project may contain at most ${MAX_PORTABLE_PROJECT_FILES}. Remove or move ${excessFiles} file${excessFiles === 1 ? "" : "s"}, then try again.`,
    );
  }

  const entrypoint = normalizeProjectPath(project.entrypoint);
  if (!entrypoint.endsWith(".py")) {
    invalidProject("The main file must be a Python (.py) file");
  }

  const normalizedFiles: Array<readonly [string, string]> = [];
  const seenPaths = new Set<string>();
  let totalBytes = 0;
  for (const [unsafePath, content] of fileEntries) {
    const path = normalizeProjectPath(unsafePath);
    if (seenPaths.has(path)) {
      invalidProject(
        `Two project files resolve to '${path}'. Rename one of them, then try again.`,
      );
    }
    if (typeof content !== "string") {
      invalidProject(`Project file '${path}' must contain text`);
    }
    const byteCount = utf8Encoder.encode(content).byteLength;
    if (byteCount > MAX_PORTABLE_FILE_BYTES) {
      projectTooLarge(
        `File '${path}' uses ${byteCount.toLocaleString("en-US")} bytes; each XRP project file may use at most ${MAX_PORTABLE_FILE_BYTES.toLocaleString("en-US")} bytes (96 KiB).`,
      );
    }
    totalBytes += byteCount;
    if (totalBytes > MAX_PORTABLE_PROJECT_BYTES) {
      projectTooLarge(
        `The project files use ${totalBytes.toLocaleString("en-US")} bytes; an XRP project may use at most ${MAX_PORTABLE_PROJECT_BYTES.toLocaleString("en-US")} bytes (256 KiB).`,
      );
    }
    seenPaths.add(path);
    normalizedFiles.push([path, content]);
  }

  if (!seenPaths.has(entrypoint)) {
    invalidProject(`The main file '${entrypoint}' is not in the project`);
  }
  if (
    project.name !== undefined &&
    (typeof project.name !== "string" || project.name.trim().length === 0)
  ) {
    invalidProject("The project name must contain text");
  }

  const pythonPaths = normalizedFiles
    .map(([path]) => path)
    .filter((path) => path.endsWith(".py"));
  return { entrypoint, files: normalizedFiles, pythonPaths, totalBytes };
}

export function portableProjectError(
  project: CourseProject,
): PortableProjectError | null {
  try {
    validatePortableProject(project);
    return null;
  } catch (error) {
    if (error instanceof PortableProjectError) {
      return error;
    }
    throw error;
  }
}

export function prepareProject(project: CourseProject): PreparedProject {
  const prepared = validatePortableProject(project);
  worldCatalogForProject(project);
  return prepared;
}
