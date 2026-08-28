import {
  COURSE_PROJECT_TEMPLATES,
  DEFAULT_COURSE_PROJECT,
  DEFAULT_COURSE_PROJECT_TEMPLATE_ID,
  type CourseProject,
} from "@ucsb-xrp/target";

import {
  autosaveDirectoryName,
  chooseProjectFolder,
  supportsCourseFolders,
  withCourseFolderWriteLock,
  writeRotatingTextBundle,
  type CourseDirectoryHandle,
} from "../../shared/course-folder";

export type { CourseDirectoryHandle } from "../../shared/course-folder";

export interface ProjectSessionMetadata {
  /** Stable identity for this project across browser and folder copies. */
  projectId: string;
  /** Monotonic number advanced for each project-content change. */
  revision: number;
  /** Latest revision known to have been written to the project folder. */
  savedRevision: number;
  /** Unix time in milliseconds of the latest project-content change. */
  updatedAt: number;
  /**
   * Digest of the project folder on which this revision is based. It remains
   * unchanged while the browser draft is edited and advances only after a
   * verified folder write.
   */
  baseDigest?: string;
}

export interface ProjectSnapshot extends CourseProject {
  name: string;
  /** Catalog identity used only for an explicit challenge progression. */
  templateId?: string;
  /** Optional until a legacy project is opened as a revisioned session. */
  session?: ProjectSessionMetadata;
}

export type ProjectFolderIntegrity =
  "verified" | "legacy" | "changed-after-save";

export interface FolderReadResult {
  project: ProjectSnapshot;
  skipped: number;
  /** Canonical SHA-256 digest of the files and project-level settings read. */
  contentDigest: string;
  /** Whether the stored commit marker describes the files that were read. */
  integrity: ProjectFolderIntegrity;
}

export interface ProjectFolderCandidate {
  /** Direct child folder inside the selected Working folder. */
  folder: CourseDirectoryHandle;
  folderName: string;
  projectName: string;
  entrypoint: string;
  fileCount: number;
}

const projectMetadataFile = ".ucsb-xrp-project.json";
const sha256Pattern = /^[0-9a-f]{64}$/;
const windowsReservedName = /^(?:con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\..*)?$/i;
const readableExtensions = new Set([
  ".csv",
  ".ini",
  ".json",
  ".md",
  ".py",
  ".toml",
  ".txt",
  ".yaml",
  ".yml",
]);
const ignoredDirectories = new Set([
  ".git",
  ".idea",
  ".vscode",
  autosaveDirectoryName,
  "dist",
  "node_modules",
]);
const maximumFiles = 250;
const maximumFileBytes = 1024 * 1024;
const courseRepositoryMarkers = new Set([
  "AGENTS.md",
  "CODEX_IMPLEMENTATION_PROMPT.md",
  "IMPLEMENTATION_PLAN.md",
  "PROJECT_CONTEXT.md",
  "SYSTEM_DESIGN.md",
]);
export const defaultProjectTemplateId = DEFAULT_COURSE_PROJECT_TEMPLATE_ID;
export const defaultProjectFolderName = "Expanding-Spiral";

export function defaultProject(): ProjectSnapshot {
  const project = DEFAULT_COURSE_PROJECT;
  return {
    name: project.name ?? "Expanding spiral",
    entrypoint: project.entrypoint,
    files: { ...project.files },
    templateId: DEFAULT_COURSE_PROJECT_TEMPLATE_ID,
  };
}

export function isDefaultProject(project: ProjectSnapshot): boolean {
  const expected = defaultProject();
  const paths = Object.keys(project.files).sort();
  const expectedPaths = Object.keys(expected.files).sort();
  return (
    project.name === expected.name &&
    project.entrypoint === expected.entrypoint &&
    paths.length === expectedPaths.length &&
    paths.every(
      (path, index) =>
        path === expectedPaths[index] &&
        project.files[path] === expected.files[path],
    )
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function validContentDigest(value: unknown): value is string {
  return typeof value === "string" && sha256Pattern.test(value);
}

function recoveredSessionMetadata(
  value: unknown,
): ProjectSessionMetadata | undefined {
  if (
    !isRecord(value) ||
    typeof value.projectId !== "string" ||
    value.projectId.length === 0 ||
    value.projectId.length > 128 ||
    value.projectId.trim() !== value.projectId ||
    !Number.isSafeInteger(value.revision) ||
    (value.revision as number) < 0 ||
    !Number.isSafeInteger(value.savedRevision) ||
    (value.savedRevision as number) < 0 ||
    (value.savedRevision as number) > (value.revision as number) ||
    !Number.isSafeInteger(value.updatedAt) ||
    (value.updatedAt as number) < 0
  ) {
    return undefined;
  }
  return {
    projectId: value.projectId,
    revision: value.revision as number,
    savedRevision: value.savedRevision as number,
    updatedAt: value.updatedAt as number,
    ...(validContentDigest(value.baseDigest)
      ? { baseDigest: value.baseDigest }
      : {}),
  };
}

interface ProjectFolderMetadata {
  entrypoint: string;
  name?: string;
  templateId?: string;
  session?: ProjectSessionMetadata;
  contentDigest?: string;
}

class ProjectFolderMetadataError extends Error {
  readonly name = "ProjectFolderMetadataError";
}

function isNotFoundError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "name" in error &&
    error.name === "NotFoundError"
  );
}

async function readProjectFolderMetadata(
  root: CourseDirectoryHandle,
): Promise<ProjectFolderMetadata> {
  let handle;
  try {
    handle = await root.getFileHandle(projectMetadataFile);
  } catch (error) {
    if (isNotFoundError(error)) {
      throw new ProjectFolderMetadataError(
        `This is not a UCSBXRP project folder. Choose the project folder that contains ${projectMetadataFile}, not the Working folder that contains several projects.`,
      );
    }
    throw error;
  }

  let value: unknown;
  try {
    value = JSON.parse(await (await handle.getFile()).text()) as unknown;
  } catch {
    throw new ProjectFolderMetadataError(
      `This folder has invalid UCSBXRP project information in ${projectMetadataFile}. Choose another project folder, or create a new project and import its files.`,
    );
  }

  const invalidMetadata = () =>
    new ProjectFolderMetadataError(
      `This folder has invalid UCSBXRP project information in ${projectMetadataFile}. Choose another project folder, or create a new project and import its files.`,
    );
  if (!isRecord(value) || typeof value.entrypoint !== "string") {
    throw invalidMetadata();
  }
  const entrypoint = normalizedProjectPath(value.entrypoint);
  if (
    entrypoint !== value.entrypoint ||
    !entrypoint.endsWith(".py") ||
    projectPathError(entrypoint)
  ) {
    throw invalidMetadata();
  }
  if (
    value.name !== undefined &&
    (typeof value.name !== "string" ||
      value.name.trim().length === 0 ||
      value.name.trim() !== value.name)
  ) {
    throw invalidMetadata();
  }
  if (
    value.templateId !== undefined &&
    (typeof value.templateId !== "string" || value.templateId.length === 0)
  ) {
    throw invalidMetadata();
  }
  if (
    value.contentDigest !== undefined &&
    !validContentDigest(value.contentDigest)
  ) {
    throw invalidMetadata();
  }
  const session = recoveredSessionMetadata(value.session);
  if (
    value.session !== undefined &&
    (!session ||
      (isRecord(value.session) &&
        value.session.baseDigest !== undefined &&
        !validContentDigest(value.session.baseDigest)))
  ) {
    throw invalidMetadata();
  }

  return {
    entrypoint,
    ...(typeof value.name === "string" ? { name: value.name } : {}),
    ...(typeof value.templateId === "string"
      ? { templateId: value.templateId }
      : {}),
    ...(session ? { session } : {}),
    ...(validContentDigest(value.contentDigest)
      ? { contentDigest: value.contentDigest }
      : {}),
  };
}

export async function hasProjectFolderMetadata(
  root: CourseDirectoryHandle,
): Promise<boolean> {
  try {
    await readProjectFolderMetadata(root);
    return true;
  } catch (error) {
    if (error instanceof ProjectFolderMetadataError) {
      return false;
    }
    throw error;
  }
}

function isCourseRepositoryFileSet(files: Record<string, string>): boolean {
  let markerCount = 0;
  for (const path of Object.keys(files)) {
    if (!path.includes("/") && courseRepositoryMarkers.has(path)) {
      markerCount += 1;
      if (markerCount >= 2) {
        return true;
      }
    }
  }
  return false;
}

export async function isCourseRepositoryFolder(
  root: CourseDirectoryHandle,
): Promise<boolean> {
  let markerCount = 0;
  for await (const [name] of root.entries()) {
    if (courseRepositoryMarkers.has(name)) {
      markerCount += 1;
      if (markerCount >= 2) {
        return true;
      }
    }
  }
  return false;
}

export function projectPathError(path: string): string | null {
  const normalized = path.trim().replaceAll("\\", "/");
  if (!normalized) {
    return "Enter a file name.";
  }
  if (normalized.startsWith("/") || normalized.endsWith("/")) {
    return "Use a project-relative file path.";
  }
  const parts = normalized.split("/");
  if (parts.some((part) => part === "" || part === "." || part === "..")) {
    return "The path cannot contain empty folders, '.', or '..'.";
  }
  if (/[\u0000-\u001f:*?"<>|]/.test(normalized)) {
    return "The file name contains a character that cannot be saved.";
  }
  if (parts.some((part) => part.endsWith(".") || part.endsWith(" "))) {
    return "File and folder names cannot end with a period or space.";
  }
  if (parts.some((part) => windowsReservedName.test(part))) {
    return "That file or folder name is reserved by Windows.";
  }
  if (parts.some((part) => part.length > 255)) {
    return "Each file or folder name must be 255 characters or fewer.";
  }
  if (
    parts.some(
      (part) => part.toLowerCase() === projectMetadataFile.toLowerCase(),
    )
  ) {
    return "That name is reserved for UCSBXRP project settings.";
  }
  return null;
}

export function normalizedProjectPath(path: string): string {
  return path.trim().replaceAll("\\", "/");
}

export function projectFolderNameError(name: string): string | null {
  const normalized = name.trim();
  if (!normalized) {
    return "Enter a project folder name.";
  }
  if (normalized === "." || normalized === "..") {
    return "Choose a regular folder name.";
  }
  if (normalized.includes("/") || normalized.includes("\\")) {
    return "Enter one folder name, without a path.";
  }
  if (/[\u0000-\u001f:*?"<>|]/.test(normalized)) {
    return "The folder name contains a character that cannot be used.";
  }
  if (normalized.endsWith(".") || normalized.endsWith(" ")) {
    return "The folder name cannot end with a period or space.";
  }
  if (windowsReservedName.test(normalized)) {
    return "That folder name is reserved by Windows.";
  }
  if (normalized.length > 255) {
    return "The folder name must be 255 characters or fewer.";
  }
  return null;
}

/** Returns true when a path would collide on a case-insensitive file system. */
export function projectFilePathExists(
  files: Record<string, string>,
  requestedPath: string,
): boolean {
  const foldedPath = normalizedProjectPath(requestedPath).toLowerCase();
  return Object.keys(files).some((path) => path.toLowerCase() === foldedPath);
}

export function suggestedProjectFolderName(name: string): string {
  const suggestion = name
    .trim()
    .replace(/[^A-Za-z0-9 _-]+/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return suggestion || "xrp-project";
}

function fileExtension(name: string): string {
  const dot = name.lastIndexOf(".");
  return dot < 0 ? "" : name.slice(dot).toLowerCase();
}

function checkedDestinationPath(
  project: ProjectSnapshot,
  requestedPath: string,
  originalPath?: string,
): string {
  const error = projectPathError(requestedPath);
  if (error) {
    throw new Error(error);
  }
  const path = normalizedProjectPath(requestedPath);
  if (path === originalPath) {
    throw new Error("Enter a different file path.");
  }
  if (projectFilePathExists(project.files, path)) {
    throw new Error("A file already uses that path.");
  }
  return path;
}

export function renameProjectFile(
  project: ProjectSnapshot,
  sourcePath: string,
  requestedPath: string,
): ProjectSnapshot {
  const content = project.files[sourcePath];
  if (content === undefined) {
    throw new Error(`${sourcePath} is not in the project.`);
  }
  const path = checkedDestinationPath(project, requestedPath, sourcePath);
  if (project.entrypoint === sourcePath && !path.endsWith(".py")) {
    throw new Error("The main file must keep a .py extension.");
  }
  const files = { ...project.files };
  delete files[sourcePath];
  files[path] = content;
  return {
    ...project,
    entrypoint: project.entrypoint === sourcePath ? path : project.entrypoint,
    files,
  };
}

export function duplicateProjectFile(
  project: ProjectSnapshot,
  sourcePath: string,
  requestedPath: string,
): ProjectSnapshot {
  const content = project.files[sourcePath];
  if (content === undefined) {
    throw new Error(`${sourcePath} is not in the project.`);
  }
  const path = checkedDestinationPath(project, requestedPath, sourcePath);
  return {
    ...project,
    files: { ...project.files, [path]: content },
  };
}

export function deleteProjectFile(
  project: ProjectSnapshot,
  path: string,
): ProjectSnapshot {
  if (!(path in project.files)) {
    throw new Error(`${path} is not in the project.`);
  }
  if (Object.keys(project.files).length === 1) {
    throw new Error("A project must contain at least one file.");
  }
  if (path === project.entrypoint) {
    throw new Error(
      "Choose another Python file as main before deleting the current main file.",
    );
  }
  const files = { ...project.files };
  delete files[path];
  return { ...project, files };
}

export function setProjectEntrypoint(
  project: ProjectSnapshot,
  path: string,
): ProjectSnapshot {
  if (!(path in project.files)) {
    throw new Error(`${path} is not in the project.`);
  }
  if (!path.endsWith(".py")) {
    throw new Error("Only a Python file can be the main file.");
  }
  return { ...project, entrypoint: path };
}

export function suggestedDuplicatePath(
  sourcePath: string,
  files: Record<string, string>,
): string {
  const dot = sourcePath.lastIndexOf(".");
  const slash = sourcePath.lastIndexOf("/");
  const hasExtension = dot > slash;
  const base = hasExtension ? sourcePath.slice(0, dot) : sourcePath;
  const extension = hasExtension ? sourcePath.slice(dot) : "";
  let candidate = `${base}_copy${extension}`;
  let number = 2;
  while (candidate in files) {
    candidate = `${base}_copy_${number}${extension}`;
    number += 1;
  }
  return candidate;
}

export function supportsWorkingFolders(): boolean {
  return supportsCourseFolders();
}

export async function chooseWorkingFolder(): Promise<CourseDirectoryHandle> {
  return chooseProjectFolder();
}

async function likelyDirectProjectChildren(
  root: CourseDirectoryHandle,
): Promise<string[]> {
  const directories: Array<[string, CourseDirectoryHandle]> = [];
  // Finish enumerating the parent before opening any child. Some browser file
  // system implementations can skip a sibling when a child is queried while
  // the parent's asynchronous iterator is still active.
  for await (const [name, handle] of root.entries()) {
    if (
      handle.kind === "directory" &&
      !name.startsWith(".") &&
      !ignoredDirectories.has(name)
    ) {
      directories.push([name, handle]);
    }
  }

  const names: string[] = [];
  for (const [name, handle] of directories) {
    try {
      if (await hasProjectFolderMetadata(handle)) {
        names.push(name);
        continue;
      }
      await handle.getFileHandle("main.py");
      names.push(name);
    } catch (error) {
      if (!isNotFoundError(error)) throw error;
    }
  }
  return names.sort((left, right) => left.localeCompare(right));
}

/**
 * Return the valid UCSBXRP projects immediately inside a Working folder.
 * The full project reader is deliberately reused here so the chooser never
 * advertises a malformed, nested, or otherwise unreadable project as safe to
 * open. Files are only read; nothing is written until the student edits the
 * opened project.
 */
export async function listDirectProjectFolders(
  root: CourseDirectoryHandle,
): Promise<ProjectFolderCandidate[]> {
  const directories: Array<[string, CourseDirectoryHandle]> = [];
  for await (const [name, handle] of root.entries()) {
    if (
      handle.kind === "directory" &&
      !name.startsWith(".") &&
      !ignoredDirectories.has(name)
    ) {
      directories.push([name, handle]);
    }
  }

  const projects: ProjectFolderCandidate[] = [];
  for (const [folderName, folder] of directories) {
    try {
      const opened = await readProjectFolder(folder);
      projects.push({
        folder,
        folderName,
        projectName: opened.project.name,
        entrypoint: opened.project.entrypoint,
        fileCount: Object.keys(opened.project.files).length,
      });
    } catch {
      // A Working folder may also contain notes, exports, or incomplete
      // folders. They remain untouched and are not presented as projects.
    }
  }

  return projects.sort((left, right) => {
    const byName = left.projectName.localeCompare(right.projectName);
    return byName || left.folderName.localeCompare(right.folderName);
  });
}

function encodedDigestPart(value: string): Uint8Array {
  const encoder = new TextEncoder();
  const body = encoder.encode(value);
  const prefix = encoder.encode(`${body.byteLength}:`);
  const result = new Uint8Array(prefix.byteLength + body.byteLength + 1);
  result.set(prefix, 0);
  result.set(body, prefix.byteLength);
  result[result.byteLength - 1] = ";".charCodeAt(0);
  return result;
}

function digestHex(value: ArrayBuffer): string {
  return Array.from(new Uint8Array(value), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
}

/**
 * Calculates one deterministic identity for project files and the settings
 * that affect how they run. Session counters are deliberately excluded.
 */
export async function projectContentDigest(
  project: ProjectSnapshot,
): Promise<string> {
  if (!globalThis.crypto?.subtle) {
    throw new Error("This browser cannot verify project folder changes.");
  }
  const parts = [
    encodedDigestPart("ucsb-xrp-project-v1"),
    encodedDigestPart(project.name),
    encodedDigestPart(project.entrypoint),
    encodedDigestPart(project.templateId ?? ""),
  ];
  for (const [path, content] of Object.entries(project.files).sort(
    ([left], [right]) => (left < right ? -1 : left > right ? 1 : 0),
  )) {
    parts.push(encodedDigestPart(path), encodedDigestPart(content));
  }
  const length = parts.reduce((total, part) => total + part.byteLength, 0);
  const bytes = new Uint8Array(length);
  let offset = 0;
  for (const part of parts) {
    bytes.set(part, offset);
    offset += part.byteLength;
  }
  return digestHex(
    await globalThis.crypto.subtle.digest(
      "SHA-256",
      bytes.buffer as ArrayBuffer,
    ),
  );
}

export async function readProjectFolder(
  root: CourseDirectoryHandle,
): Promise<FolderReadResult> {
  if (await isCourseRepositoryFolder(root)) {
    throw new Error(
      "Choose a UCSBXRP project folder, not the UCSBXRP course software repository.",
    );
  }
  const likelyChildren = await likelyDirectProjectChildren(root);
  if (likelyChildren.length > 1) {
    throw new Error(
      `This folder contains multiple project folders (${likelyChildren.join(", ")}). Choose one project folder rather than their parent folder.`,
    );
  }
  const metadata = await readProjectFolderMetadata(root);
  const files: Record<string, string> = {};
  let skipped = 0;

  const visit = async (
    directory: CourseDirectoryHandle,
    prefix: string,
  ): Promise<void> => {
    for await (const [name, handle] of directory.entries()) {
      if (handle.kind === "directory") {
        if (name === autosaveDirectoryName) {
          continue;
        }
        if (name.startsWith(".") || ignoredDirectories.has(name)) {
          skipped += 1;
          continue;
        }
        await visit(handle, `${prefix}${name}/`);
        continue;
      }
      if (name === projectMetadataFile) {
        if (prefix !== "") {
          throw new Error(
            `This project folder contains another UCSBXRP project folder (${prefix.slice(0, -1)}). Choose one project folder at a time.`,
          );
        }
        continue;
      }
      if (
        Object.keys(files).length >= maximumFiles ||
        !readableExtensions.has(fileExtension(name))
      ) {
        skipped += 1;
        continue;
      }
      const file = await handle.getFile();
      if (file.size > maximumFileBytes) {
        skipped += 1;
        continue;
      }
      const path = `${prefix}${name}`;
      const pathError = projectPathError(path);
      if (pathError) {
        throw new Error(
          `The project contains a file path that cannot be used on both macOS and Windows: ${path}. ${pathError}`,
        );
      }
      if (projectFilePathExists(files, path)) {
        throw new Error(
          `The project contains file names that differ only by capitalization: ${path}. Rename one file before opening the project.`,
        );
      }
      files[path] = await file.text();
    }
  };

  await visit(root, "");
  if (Object.keys(files).length === 0) {
    throw new Error(
      "The selected folder contains no supported text project files.",
    );
  }
  if (isCourseRepositoryFileSet(files)) {
    throw new Error(
      "Choose a UCSBXRP project folder, not the UCSBXRP course software repository.",
    );
  }
  if (!(metadata.entrypoint in files)) {
    throw new Error(
      `This project names ${metadata.entrypoint} as its main file, but that file is missing. Restore the file or choose another project folder.`,
    );
  }
  const projectName = metadata.name ?? root.name;
  const inferredTemplateId = COURSE_PROJECT_TEMPLATES.find(
    (template) => template.project.name === projectName,
  )?.id;
  const preferredTemplateId = COURSE_PROJECT_TEMPLATES.some(
    (template) => template.id === metadata.templateId,
  )
    ? metadata.templateId
    : undefined;
  const project: ProjectSnapshot = {
    name: projectName,
    entrypoint: metadata.entrypoint,
    files,
    ...(preferredTemplateId || inferredTemplateId
      ? { templateId: preferredTemplateId ?? inferredTemplateId }
      : {}),
  };
  const contentDigest = await projectContentDigest(project);
  return {
    project: metadata.session
      ? {
          ...project,
          session: {
            ...metadata.session,
            savedRevision: metadata.session.revision,
            baseDigest: contentDigest,
          },
        }
      : project,
    skipped,
    contentDigest,
    integrity:
      metadata.contentDigest === undefined
        ? "legacy"
        : metadata.contentDigest === contentDigest
          ? "verified"
          : "changed-after-save",
  };
}

async function directoryForPath(
  root: CourseDirectoryHandle,
  path: string,
): Promise<{ directory: CourseDirectoryHandle; name: string }> {
  const parts = path.split("/");
  const name = parts.pop()!;
  let directory = root;
  for (const part of parts) {
    directory = await directory.getDirectoryHandle(part, { create: true });
  }
  return { directory, name };
}

async function writeProjectFiles(
  root: CourseDirectoryHandle,
  project: ProjectSnapshot,
): Promise<void> {
  for (const [path, content] of Object.entries(project.files)) {
    const error = projectPathError(path);
    if (error) {
      throw new Error(`${path}: ${error}`);
    }
    const { directory, name } = await directoryForPath(root, path);
    const handle = await directory.getFileHandle(name, { create: true });
    const writable = await handle.createWritable();
    await writable.write(content);
    await writable.close();
  }
}

async function writeProjectMetadata(
  root: CourseDirectoryHandle,
  project: ProjectSnapshot,
  contentDigest: string,
): Promise<void> {
  const metadata = await root.getFileHandle(projectMetadataFile, {
    create: true,
  });
  const writable = await metadata.createWritable();
  await writable.write(
    `${JSON.stringify(
      {
        name: project.name,
        entrypoint: project.entrypoint,
        ...(project.templateId ? { templateId: project.templateId } : {}),
        contentDigest,
        ...(project.session
          ? {
              session: {
                ...project.session,
                savedRevision: project.session.revision,
                baseDigest: contentDigest,
              },
            }
          : {}),
      },
      null,
      2,
    )}\n`,
  );
  await writable.close();
}

export async function writeProjectFolder(
  root: CourseDirectoryHandle,
  project: ProjectSnapshot,
): Promise<void> {
  const contentDigest = await projectContentDigest(project);
  await writeProjectFiles(root, project);
  // Metadata is the commit marker. Writing it last makes a partial multi-file
  // update detectable the next time the folder is read.
  await writeProjectMetadata(root, project, contentDigest);
}

export async function createProjectFolder(
  workspace: CourseDirectoryHandle,
  requestedName: string,
  project: ProjectSnapshot,
): Promise<CourseDirectoryHandle> {
  const error = projectFolderNameError(requestedName);
  if (error) {
    throw new Error(error);
  }
  const name = requestedName.trim();
  try {
    await workspace.getDirectoryHandle(name);
    throw new Error(
      `A folder named ${name} already exists. Open it as a project or choose another name.`,
    );
  } catch (folderError) {
    if (!(
      typeof folderError === "object" &&
      folderError !== null &&
      "name" in folderError &&
      folderError.name === "NotFoundError"
    )) {
      throw folderError;
    }
  }
  const folder = await workspace.getDirectoryHandle(name, { create: true });
  await writeProjectFolder(folder, project);
  return folder;
}

export async function ensureProjectFolder(
  workspace: CourseDirectoryHandle,
  requestedName: string,
  project: ProjectSnapshot,
): Promise<{ folder: CourseDirectoryHandle; created: boolean }> {
  const error = projectFolderNameError(requestedName);
  if (error) {
    throw new Error(error);
  }
  const baseName = requestedName.trim();
  for (let index = 1; index <= 100; index += 1) {
    const name = index === 1 ? baseName : `${baseName}-${index}`;
    try {
      const existing = await workspace.getDirectoryHandle(name);
      if (await hasProjectFolderMetadata(existing)) {
        return { folder: existing, created: false };
      }
    } catch (folderError) {
      if (!(
        typeof folderError === "object" &&
        folderError !== null &&
        "name" in folderError &&
        folderError.name === "NotFoundError"
      )) {
        throw folderError;
      }
      const folder = await workspace.getDirectoryHandle(name, {
        create: true,
      });
      await writeProjectFolder(folder, project);
      return { folder, created: true };
    }
  }
  throw new Error(`No available project folder name begins with ${baseName}.`);
}

export async function removeProjectFolderFiles(
  root: CourseDirectoryHandle,
  paths: Iterable<string>,
): Promise<number> {
  let removed = 0;
  for (const path of paths) {
    const error = projectPathError(path);
    if (error) {
      throw new Error(`${path}: ${error}`);
    }
    const parts = path.split("/");
    const name = parts.pop()!;
    let directory = root;
    try {
      for (const part of parts) {
        directory = await directory.getDirectoryHandle(part);
      }
      await directory.removeEntry(name);
      removed += 1;
    } catch (error) {
      if (
        typeof error === "object" &&
        error !== null &&
        "name" in error &&
        error.name === "NotFoundError"
      ) {
        continue;
      }
      throw error;
    }
  }
  return removed;
}

export function sameProjectContents(
  first: ProjectSnapshot,
  second: ProjectSnapshot,
): boolean {
  if (
    first.name !== second.name ||
    first.entrypoint !== second.entrypoint ||
    first.templateId !== second.templateId
  ) {
    return false;
  }
  const firstPaths = Object.keys(first.files).sort();
  const secondPaths = Object.keys(second.files).sort();
  return (
    firstPaths.length === secondPaths.length &&
    firstPaths.every(
      (path, index) =>
        path === secondPaths[index] && first.files[path] === second.files[path],
    )
  );
}

export interface ProjectFolderSaveResult {
  changed: boolean;
  removedFiles: number;
  contentDigest: string;
}

export interface ProjectFolderSaveOptions {
  /**
   * Overrides the draft's base only for an explicit conflict resolution. A
   * second external edit still causes another conflict instead of being lost.
   */
  expectedBaseDigest?: string;
}

export class ProjectFolderConflictError extends Error {
  readonly name = "ProjectFolderConflictError";

  constructor(
    readonly folderProject: ProjectSnapshot,
    readonly folderDigest: string,
  ) {
    super(
      "Files in this project folder changed outside UCSBXRP. Automatic saving paused so neither version is overwritten.",
    );
  }
}

function sameSavedSessionMetadata(
  first: ProjectSessionMetadata | undefined,
  second: ProjectSessionMetadata | undefined,
): boolean {
  if (!first || !second) {
    return first === second;
  }
  return (
    first.projectId === second.projectId &&
    first.revision === second.revision &&
    first.updatedAt === second.updatedAt
  );
}

async function saveProjectFolderWithAutosaveUnlocked(
  root: CourseDirectoryHandle,
  project: ProjectSnapshot,
  deletedPaths: Iterable<string> = [],
  options: ProjectFolderSaveOptions = {},
): Promise<ProjectFolderSaveResult> {
  let previous: FolderReadResult | null = null;
  try {
    previous = await readProjectFolder(root);
  } catch (error) {
    if (
      !(error instanceof Error) ||
      !error.message.includes("no supported text project files")
    ) {
      throw error;
    }
  }

  const contentsChanged =
    previous === null || !sameProjectContents(previous.project, project);
  const metadataChanged =
    previous !== null &&
    !sameSavedSessionMetadata(previous.project.session, project.session);
  const expectedBaseDigest =
    options.expectedBaseDigest ?? project.session?.baseDigest;
  if (
    previous !== null &&
    contentsChanged &&
    ((expectedBaseDigest !== undefined &&
      expectedBaseDigest !== previous.contentDigest) ||
      (expectedBaseDigest === undefined &&
        previous.integrity === "changed-after-save"))
  ) {
    throw new ProjectFolderConflictError(
      previous.project,
      previous.contentDigest,
    );
  }
  if (!contentsChanged && !metadataChanged) {
    return {
      changed: false,
      removedFiles: 0,
      contentDigest:
        previous?.contentDigest ?? (await projectContentDigest(project)),
    };
  }
  if (previous && contentsChanged) {
    await writeRotatingTextBundle(root, [
      {
        baseName: "project",
        extension: "json",
        content: `${JSON.stringify(
          {
            savedAt: new Date().toISOString(),
            project: previous.project,
          },
          null,
          2,
        )}\n`,
      },
    ]);
  }
  const contentDigest = await projectContentDigest(project);
  await writeProjectFiles(root, project);
  const removedFiles = contentsChanged
    ? await removeProjectFolderFiles(root, deletedPaths)
    : 0;
  // Deletions are part of the same logical update, so the commit marker must
  // be written after them rather than describing a mixed folder state.
  await writeProjectMetadata(root, project, contentDigest);
  const verified = await readProjectFolder(root);
  if (verified.contentDigest !== contentDigest) {
    throw new ProjectFolderConflictError(
      verified.project,
      verified.contentDigest,
    );
  }
  return { changed: true, removedFiles, contentDigest };
}

export async function saveProjectFolderWithAutosave(
  root: CourseDirectoryHandle,
  project: ProjectSnapshot,
  deletedPaths: Iterable<string> = [],
  options: ProjectFolderSaveOptions = {},
): Promise<ProjectFolderSaveResult> {
  return withCourseFolderWriteLock("project", () =>
    saveProjectFolderWithAutosaveUnlocked(root, project, deletedPaths, options),
  );
}
