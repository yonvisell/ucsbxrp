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
  readCourseTextFile,
  writeCourseTextFile,
  type CourseDirectoryHandle,
} from "../../shared/course-folder";

import {
  assertProjectWriterCurrent,
  beginProjectCommit,
  finishProjectCommit,
  pendingProjectCommit,
  retainObservedProjectCommit,
  projectCommitFile,
  ProjectCommitRecoveryError,
  withProjectNativeWrite,
  type PendingProjectCommit,
} from "./project-native-write";

import {
  validProjectProvenance,
  type ProjectProvenance,
} from "./project-provenance";

import {
  isProjectWriterRecordFile,
  inspectProjectWriters,
  type ProjectWriterRecord,
} from "./project-writer-admission";

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
  provenance?: ProjectProvenance;
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
  problem?: string;
  recovery?: PendingProjectCommit;
  writerRecords?: ProjectWriterRecord[];
  backups?: ProjectSnapshot[];
  externalChange?: { snapshot: ProjectSnapshot; digest: string };
}

export const projectMetadataFile = ".ucsb-xrp-project.json";
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
  "dist",
  "node_modules",
]);
const generatedProjectDirectories = new Set([
  autosaveDirectoryName.toLowerCase(),
  "exports",
]);
export const maximumFiles = 250;
export const maximumFileBytes = 1024 * 1024;
export const maximumProjectBytes = 4 * 1024 * 1024;
const maximumScanEntries = 2_000;
const maximumDepth = 12;
const internalProjectFiles = new Set([
  projectMetadataFile,
  projectCommitFile,
  ".ucsb-xrp-writer.json",
  ".ucsb-xrp-write-lock",
]);
const checkpointTimes = new WeakMap<object, number>();
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
  provenance?: ProjectProvenance;
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
    const file = await handle.getFile();
    if (file.size > 64 * 1024)
      throw new Error("Project metadata exceeds the supported size.");
    value = JSON.parse(await file.text()) as unknown;
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
  if (
    value.provenance !== undefined &&
    !validProjectProvenance(value.provenance)
  )
    throw invalidMetadata();
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
    ...(validProjectProvenance(value.provenance)
      ? { provenance: value.provenance }
      : {}),
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
  let scanned = 0;
  for await (const [name] of root.entries()) {
    if (++scanned > maximumScanEntries)
      throw new Error(
        "Folder scan limit reached. Choose a folder with fewer unrelated entries.",
      );
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
  if (path.trim() && path.endsWith(" "))
    return "File and folder names cannot end with a space.";
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
  if (parts.some((part) => part.toLowerCase().startsWith(".ucsb-xrp-"))) {
    return "That name is reserved for UCSBXRP project settings.";
  }
  if (generatedProjectDirectories.has(parts[0]!.toLowerCase())) {
    return "That top-level folder is reserved for UCSBXRP run data and exports.";
  }
  return null;
}

export function normalizedProjectPath(path: string): string {
  return path.trim().replaceAll("\\", "/");
}

export function projectFolderNameError(name: string): string | null {
  if (name.trim() && name.endsWith(" "))
    return "The folder name cannot end with a space.";
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
  const canonical = (path: string) => path.normalize("NFC").toLowerCase();
  const requested = normalizedProjectPath(requestedPath);
  const foldedPath = canonical(requested);
  return Object.keys(files).some((path) => {
    const folded = canonical(path);
    if (
      folded === foldedPath ||
      folded.startsWith(foldedPath + "/") ||
      foldedPath.startsWith(folded + "/")
    )
      return true;
    const left = path.split("/");
    const right = requested.split("/");
    for (let i = 0; i < Math.min(left.length, right.length) - 1; i += 1) {
      if (canonical(left[i]!) !== canonical(right[i]!)) break;
      if (left[i] !== right[i]) return true;
    }
    return false;
  });
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
  let scanned = 0;
  for await (const [name, handle] of root.entries()) {
    if (++scanned > maximumScanEntries)
      throw new Error(
        "Folder scan limit reached. Choose a folder with fewer unrelated entries.",
      );
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
  let scanned = 0;
  for await (const [name, handle] of root.entries()) {
    if (++scanned > maximumScanEntries)
      throw new Error(
        "Folder scan limit reached. Choose a folder with fewer unrelated entries.",
      );
    if (
      handle.kind === "directory" &&
      !name.startsWith(".") &&
      !ignoredDirectories.has(name)
    ) {
      directories.push([name, handle]);
    }
  }

  const projects: ProjectFolderCandidate[] = [];
  let candidateBytes = 0;
  for (const [folderName, folder] of directories) {
    // A Working folder may also contain unrelated personal directories. Do not
    // recursively scan their contents just to establish that they are not Projects.
    let recognized = false;
    let accessFailure: unknown;
    for (const name of [projectMetadataFile, projectCommitFile]) {
      try {
        await folder.getFileHandle(name);
        recognized = true;
        break;
      } catch (error) {
        if (!isNotFoundError(error)) {
          accessFailure = error;
          break;
        }
      }
    }
    if (accessFailure) {
      projects.push({
        folder,
        folderName,
        projectName: folderName,
        entrypoint: "",
        fileCount: 0,
        problem: `This folder could not be inspected. Restore access before deciding whether it contains a Project. ${accessFailure instanceof Error ? accessFailure.message : String(accessFailure)}`,
      });
      continue;
    }
    if (!recognized) continue;
    try {
      const opened = await readProjectFolder(folder, {
        consumeBytes: (bytes) => {
          candidateBytes += bytes;
          if (candidateBytes > 16 * 1024 * 1024)
            throw new Error(
              "Working-folder Project scan exceeded 16 MB. Move older Projects to another Working folder, then reopen this chooser. No incomplete Project was opened.",
            );
        },
      });
      const writerRecords = await inspectProjectWriters(folder);
      projects.push({
        folder,
        folderName,
        projectName: opened.project.name,
        entrypoint: opened.project.entrypoint,
        fileCount: Object.keys(opened.project.files).length,
        ...(writerRecords.length
          ? {
              writerRecords,
              problem:
                "A browser still has a pending Project writer record. Close other editors, then review writer recovery before saving.",
            }
          : {}),
        ...(opened.integrity === "changed-after-save"
          ? {
              problem:
                "Files changed outside UCSBXRP after the last verified save. Download a copy, then explicitly open the changed files or recover an earlier checkpoint.",
              externalChange: {
                snapshot: opened.project,
                digest: opened.contentDigest,
              },
              backups: await readProjectBackups(folder),
            }
          : {}),
      });
    } catch (error) {
      // A recognizable but damaged project must remain visible for recovery.
      let recognizable = error instanceof ProjectCommitRecoveryError;
      if (!recognizable) {
        try {
          await folder.getFileHandle(projectMetadataFile);
          recognizable = true;
        } catch {
          /* Ordinary unrelated folders are not projects. */
        }
      }
      if (recognizable)
        projects.push({
          folder,
          folderName,
          projectName: folderName,
          entrypoint: "",
          fileCount: 0,
          problem: error instanceof Error ? error.message : String(error),
          ...(error instanceof ProjectCommitRecoveryError
            ? { recovery: error.commit }
            : {}),
          backups: await readProjectBackups(folder),
          writerRecords: await inspectProjectWriters(folder),
        });
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
  options: {
    allowPendingCommit?: boolean;
    consumeBytes?: (bytes: number) => void;
  } = {},
): Promise<FolderReadResult> {
  if (!options.allowPendingCommit) {
    const pending = await pendingProjectCommit(root);
    if (pending) throw new ProjectCommitRecoveryError(pending);
  }
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
  let scanned = 0;
  let totalBytes = 0;
  const pathSpellings = new Map<string, string>();

  const visit = async (
    directory: CourseDirectoryHandle,
    prefix: string,
  ): Promise<void> => {
    if (prefix.split("/").length > maximumDepth)
      throw new Error(
        `Project nesting exceeds ${maximumDepth} folders. Move unrelated data outside this Project.`,
      );
    for await (const [name, handle] of directory.entries()) {
      if (++scanned > maximumScanEntries)
        throw new Error(
          "Project scan limit reached. Move unrelated data outside this Project; no incomplete project was opened.",
        );
      if (handle.kind === "directory") {
        if (generatedProjectDirectories.has(name.toLowerCase())) {
          continue;
        }
        if (name.startsWith(".") || ignoredDirectories.has(name)) {
          skipped += 1;
          continue;
        }
        await visit(handle, `${prefix}${name}/`);
        continue;
      }
      if (internalProjectFiles.has(name) || isProjectWriterRecordFile(name)) {
        if (name === projectMetadataFile && prefix !== "") {
          throw new Error(
            `This project folder contains another UCSBXRP project folder (${prefix.slice(0, -1)}). Choose one project folder at a time.`,
          );
        }
        continue;
      }
      if (!readableExtensions.has(fileExtension(name))) {
        skipped += 1;
        continue;
      }
      if (Object.keys(files).length >= maximumFiles)
        throw new Error(
          `The Project exceeds ${maximumFiles} supported files. No incomplete project was opened.`,
        );
      const file = await handle.getFile();
      if (file.size > maximumFileBytes)
        throw new Error(
          `${prefix}${name} exceeds the 1 MB file limit. No incomplete project was opened.`,
        );
      options.consumeBytes?.(file.size);
      totalBytes += file.size;
      if (totalBytes > maximumProjectBytes)
        throw new Error(
          "The Project exceeds the 4 MB source limit. Move large data outside the Project; no incomplete project was opened.",
        );
      const path = `${prefix}${name}`;
      const parts = path.split("/");
      for (let index = 1; index <= parts.length; index += 1) {
        const spelling = parts.slice(0, index).join("/");
        const canonical = spelling.normalize("NFC").toLowerCase();
        const previous = pathSpellings.get(canonical);
        if (previous && previous !== spelling)
          throw new Error(
            `The project contains names that differ only by capitalization or Unicode form: ${previous}, ${spelling}. Rename one before opening.`,
          );
        pathSpellings.set(canonical, spelling);
      }
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
  const project: ProjectSnapshot = {
    name: projectName,
    ...(metadata.provenance ? { provenance: metadata.provenance } : {}),
    entrypoint: metadata.entrypoint,
    files,
    ...(metadata.templateId ? { templateId: metadata.templateId } : {}),
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

export function validateProjectSnapshot(
  value: unknown,
): asserts value is ProjectSnapshot {
  if (
    !isRecord(value) ||
    typeof value.name !== "string" ||
    !value.name.trim() ||
    typeof value.entrypoint !== "string" ||
    !isRecord(value.files)
  )
    throw new Error("The recovery file does not contain a complete Project.");
  const files = value.files;
  const paths = Object.keys(files);
  if (!paths.length || paths.length > maximumFiles)
    throw new Error(
      `A Project must contain 1–${maximumFiles} supported files.`,
    );
  let bytes = 0;
  const checked: Record<string, string> = {};
  for (const path of paths) {
    const content = files[path];
    const error = projectPathError(path);
    if (
      typeof content !== "string" ||
      normalizedProjectPath(path) !== path ||
      error ||
      !readableExtensions.has(fileExtension(path)) ||
      path.split("/").length > maximumDepth
    )
      throw new Error(
        `${path}: ${error ?? "Unsupported file content or path."}`,
      );
    if (projectFilePathExists(checked, path))
      throw new Error(`Conflicting file or folder names: ${path}.`);
    const size = new TextEncoder().encode(content).byteLength;
    bytes += size;
    if (size > maximumFileBytes || bytes > maximumProjectBytes)
      throw new Error(
        "Project source exceeds the 1 MB per-file or 4 MB total limit.",
      );
    checked[path] = content;
  }
  if (!value.entrypoint.endsWith(".py") || !(value.entrypoint in files))
    throw new Error("The Project main Python file is missing.");
  if (
    value.provenance !== undefined &&
    !validProjectProvenance(value.provenance)
  )
    throw new Error("The Project template provenance is invalid.");
  if (value.session !== undefined && !recoveredSessionMetadata(value.session))
    throw new Error("The Project recovery identity is invalid.");
}

export async function readProjectBackups(
  root: CourseDirectoryHandle,
): Promise<ProjectSnapshot[]> {
  const snapshots: ProjectSnapshot[] = [];
  try {
    const backups = await root.getDirectoryHandle(autosaveDirectoryName);
    for (let index = 1; index <= 4; index += 1) {
      try {
        const file = await (
          await backups.getFileHandle(`project-${index}.json`)
        ).getFile();
        if (file.size > maximumProjectBytes * 3) continue;
        const value = JSON.parse(await file.text()) as { project?: unknown };
        validateProjectSnapshot(value.project);
        snapshots.push(value.project);
      } catch {
        /* Keep every other readable complete checkpoint available. */
      }
    }
  } catch {
    /* The chooser still exposes the damaged candidate and its explanation. */
  }
  return snapshots;
}

async function compareNativeFileBeforeClose(
  root: CourseDirectoryHandle,
  handle: Awaited<ReturnType<CourseDirectoryHandle["getFileHandle"]>>,
  path: string,
  expected: string,
  intended: string,
): Promise<void> {
  let observedText: string | null = null;
  try {
    const file = await handle.getFile();
    if (
      file.size > (path === projectMetadataFile ? 64 * 1024 : maximumFileBytes)
    )
      throw new Error("The changed native file exceeds the supported size.");
    observedText = await file.text();
  } catch (error) {
    if (!isNotFoundError(error)) throw error;
  }
  // Identical incoming bytes are harmless, including a native editor that
  // independently saved the same correction while this stream was buffered.
  if (observedText === expected || observedText === intended) return;
  let observed: FolderReadResult;
  try {
    observed = await readProjectFolder(root, { allowPendingCommit: true });
  } catch (error) {
    throw new Error(
      `${path} changed in another program before this save committed. No complete observed Project snapshot could be read. The pending file was not replaced; keep this folder and its existing recovery copies. ${error instanceof Error ? error.message : String(error)}`,
    );
  }
  await retainObservedProjectCommit(root, observed.project);
  throw new ProjectFolderConflictError(
    observed.project,
    observed.contentDigest,
  );
}

async function writeProjectFiles(
  root: CourseDirectoryHandle,
  project: ProjectSnapshot,
  previous?: ProjectSnapshot | null,
  assertCurrent?: () => void,
): Promise<void> {
  for (const [path, content] of Object.entries(project.files)) {
    if (previous?.files[path] === content) continue;
    const error = projectPathError(path);
    if (error) {
      throw new Error(`${path}: ${error}`);
    }
    assertCurrent?.();
    const { directory, name } = await directoryForPath(root, path);
    const handle = await directory.getFileHandle(name, { create: true });
    const expected = previous
      ? (previous.files[path] ?? "")
      : await (await handle.getFile()).text();
    const writable = await handle.createWritable();
    try {
      assertCurrent?.();
      await writable.write(content);
      assertCurrent?.();
      await assertProjectWriterCurrent(root);
      await compareNativeFileBeforeClose(root, handle, path, expected, content);
      await assertProjectWriterCurrent(root);
      assertCurrent?.();
      await writable.close();
    } catch (error) {
      await writable.abort?.().catch(() => undefined);
      throw error;
    }
  }
}

async function writeProjectMetadata(
  root: CourseDirectoryHandle,
  project: ProjectSnapshot,
  contentDigest: string,
  assertCurrent?: () => void,
  expectedMetadata?: string | null,
): Promise<void> {
  const metadata = await root.getFileHandle(projectMetadataFile, {
    create: true,
  });
  const expected =
    expectedMetadata === undefined
      ? await (await metadata.getFile()).text()
      : (expectedMetadata ?? "");
  const content = `${JSON.stringify(
    {
      name: project.name,
      entrypoint: project.entrypoint,
      ...(project.templateId ? { templateId: project.templateId } : {}),
      contentDigest,
      ...(project.provenance ? { provenance: project.provenance } : {}),
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
  )}\n`;
  const writable = await metadata.createWritable();
  try {
    assertCurrent?.();
    await writable.write(content);
    assertCurrent?.();
    await assertProjectWriterCurrent(root);
    await compareNativeFileBeforeClose(
      root,
      metadata,
      projectMetadataFile,
      expected,
      content,
    );
    await assertProjectWriterCurrent(root);
    assertCurrent?.();
    await writable.close();
  } catch (error) {
    await writable.abort?.().catch(() => undefined);
    throw error;
  }
}

export async function writeProjectFolder(
  root: CourseDirectoryHandle,
  project: ProjectSnapshot,
): Promise<void> {
  validateProjectSnapshot(project);
  await withProjectNativeWrite(
    root,
    project.session?.projectId ?? root.name,
    async () => {
      const pending = await pendingProjectCommit(root);
      if (pending) throw new ProjectCommitRecoveryError(pending);
      const contentDigest = await projectContentDigest(project);
      const commit: PendingProjectCommit = {
        transactionId: crypto.randomUUID(),
        createdAt: Date.now(),
        previous: null,
        intended: project,
        deletedPaths: [],
      };
      await beginProjectCommit(root, commit);
      await writeProjectFiles(root, project);
      await writeProjectMetadata(root, project, contentDigest);
      const verified = await readProjectFolder(root, {
        allowPendingCommit: true,
      });
      if (verified.contentDigest !== contentDigest)
        throw new Error(
          "The new Project could not be verified. Its complete intended files remain available for recovery.",
        );
      await finishProjectCommit(root, commit.transactionId);
    },
  );
}

export async function createProjectFolder(
  workspace: CourseDirectoryHandle,
  requestedName: string,
  project: ProjectSnapshot,
): Promise<CourseDirectoryHandle> {
  return withProjectNativeWrite(
    workspace,
    `create:${workspace.name}`,
    async () => {
      validateProjectSnapshot(project);
      const error = projectFolderNameError(requestedName);
      if (error) {
        throw new Error(error);
      }
      const name = requestedName.trim();
      let scanned = 0;
      for await (const [existing] of workspace.entries()) {
        if (++scanned > maximumScanEntries)
          throw new Error(
            "The Working folder contains too many entries to allocate a Project safely.",
          );
        if (
          existing.normalize("NFC").toLowerCase() ===
          name.normalize("NFC").toLowerCase()
        )
          throw new Error(
            `A folder named ${existing} already exists. Choose another name, including different capitalization.`,
          );
      }
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
    },
  );
}

export async function ensureProjectFolder(
  workspace: CourseDirectoryHandle,
  requestedName: string,
  project: ProjectSnapshot,
): Promise<{ folder: CourseDirectoryHandle; created: boolean }> {
  return withProjectNativeWrite(
    workspace,
    `create:${workspace.name}`,
    async () => {
      validateProjectSnapshot(project);
      const error = projectFolderNameError(requestedName);
      if (error) {
        throw new Error(error);
      }
      const baseName = requestedName.trim();
      const existingNames = new Set<string>();
      let scanned = 0;
      for await (const [name] of workspace.entries()) {
        if (++scanned > maximumScanEntries)
          throw new Error(
            "The Working folder contains too many entries to allocate a Project safely.",
          );
        existingNames.add(name.normalize("NFC").toLowerCase());
      }
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
          if (existingNames.has(name.normalize("NFC").toLowerCase())) continue;
          const folder = await workspace.getDirectoryHandle(name, {
            create: true,
          });
          await writeProjectFolder(folder, project);
          return { folder, created: true };
        }
      }
      throw new Error(
        `No available project folder name begins with ${baseName}.`,
      );
    },
  );
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
      await assertProjectWriterCurrent(root);
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
    first.templateId !== second.templateId ||
    JSON.stringify(first.provenance) !== JSON.stringify(second.provenance)
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
  assertCurrent?: () => void;
}

export class ProjectFolderConflictError extends Error {
  readonly name = "ProjectFolderConflictError";

  constructor(
    readonly folderProject: ProjectSnapshot,
    readonly folderDigest: string,
  ) {
    super(
      "Files on disk no longer match the version this browser tab edited. Automatic saving paused until you choose which version to keep.",
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
  validateProjectSnapshot(project);
  options.assertCurrent?.();
  const expectedMetadata = await readCourseTextFile(root, projectMetadataFile);
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

  if (
    previous?.project.session &&
    project.session &&
    previous.project.session.projectId !== project.session.projectId &&
    options.expectedBaseDigest === undefined
  ) {
    throw new ProjectFolderConflictError(
      previous.project,
      previous.contentDigest,
    );
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
  const pending = await pendingProjectCommit(root);
  if (pending) throw new ProjectCommitRecoveryError(pending);
  const now = Date.now();
  const rotateCheckpoint =
    previous &&
    contentsChanged &&
    now - (checkpointTimes.get(root) ?? 0) >= 60_000;
  if (previous && rotateCheckpoint) {
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
    checkpointTimes.set(root, now);
  }
  const contentDigest = await projectContentDigest(project);
  const commit: PendingProjectCommit = {
    transactionId: crypto.randomUUID(),
    createdAt: now,
    previous: previous?.project ?? null,
    intended: project,
    deletedPaths: Array.from(deletedPaths),
  };
  options.assertCurrent?.();
  await beginProjectCommit(root, commit);
  const justBeforeWrite = await readProjectFolder(root, {
    allowPendingCommit: true,
  });
  if (previous && justBeforeWrite.contentDigest !== previous.contentDigest) {
    await finishProjectCommit(root, commit.transactionId);
    throw new ProjectFolderConflictError(
      justBeforeWrite.project,
      justBeforeWrite.contentDigest,
    );
  }
  await writeProjectFiles(
    root,
    project,
    previous?.project,
    options.assertCurrent,
  );
  options.assertCurrent?.();
  const removedFiles = contentsChanged
    ? await removeProjectFolderFiles(root, commit.deletedPaths)
    : 0;
  // Deletions are part of the same logical update, so the commit marker must
  // be written after them rather than describing a mixed folder state.
  options.assertCurrent?.();
  await writeProjectMetadata(
    root,
    project,
    contentDigest,
    options.assertCurrent,
    expectedMetadata,
  );
  const verified = await readProjectFolder(root, { allowPendingCommit: true });
  if (verified.contentDigest !== contentDigest) {
    throw new ProjectFolderConflictError(
      verified.project,
      verified.contentDigest,
    );
  }
  await finishProjectCommit(root, commit.transactionId);
  return { changed: true, removedFiles, contentDigest };
}

export async function saveProjectFolderWithAutosave(
  root: CourseDirectoryHandle,
  project: ProjectSnapshot,
  deletedPaths: Iterable<string> = [],
  options: ProjectFolderSaveOptions = {},
): Promise<ProjectFolderSaveResult> {
  return withProjectNativeWrite(
    root,
    project.session?.projectId ?? root.name,
    () =>
      saveProjectFolderWithAutosaveUnlocked(
        root,
        project,
        deletedPaths,
        options,
      ),
  );
}

/** Export candidates remain available even when an interrupted native commit cannot resume. */
export async function recoverProjectFolder(
  root: CourseDirectoryHandle,
  choice: "previous" | "intended",
): Promise<void> {
  await withProjectNativeWrite(root, root.name, async () => {
    const commit = await pendingProjectCommit(root);
    const snapshot =
      choice === "previous" ? commit?.previous : commit?.intended;
    if (!commit || !snapshot)
      throw new Error("That complete Project recovery version is unavailable.");
    validateProjectSnapshot(snapshot);
    const expectedMetadata = await readCourseTextFile(
      root,
      projectMetadataFile,
    );
    const digest = await projectContentDigest(snapshot);
    await writeProjectFiles(root, snapshot);
    const knownPaths = new Set([
      ...Object.keys(commit.previous?.files ?? {}),
      ...Object.keys(commit.intended.files),
    ]);
    await removeProjectFolderFiles(
      root,
      [...knownPaths].filter((path) => !(path in snapshot.files)),
    );
    await writeProjectMetadata(
      root,
      snapshot,
      digest,
      undefined,
      expectedMetadata,
    );
    const verified = await readProjectFolder(root, {
      allowPendingCommit: true,
    });
    if (verified.contentDigest !== digest)
      throw new Error(
        "Project recovery did not verify. All recovery snapshots were retained.",
      );
    await finishProjectCommit(root, commit.transactionId);
  });
}
