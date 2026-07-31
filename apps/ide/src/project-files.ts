import { STAGE_ONE_PROJECT, type CourseProject } from "@ucsb-xrp/target";

export interface ProjectSnapshot extends CourseProject {
  name: string;
}

interface CourseFileHandle {
  readonly kind: "file";
  readonly name: string;
  getFile(): Promise<File>;
  createWritable(): Promise<{
    write(data: string): Promise<void>;
    close(): Promise<void>;
  }>;
}

export interface CourseDirectoryHandle {
  readonly kind: "directory";
  readonly name: string;
  entries(): AsyncIterableIterator<
    [string, CourseFileHandle | CourseDirectoryHandle]
  >;
  getDirectoryHandle(
    name: string,
    options?: { create?: boolean },
  ): Promise<CourseDirectoryHandle>;
  getFileHandle(
    name: string,
    options?: { create?: boolean },
  ): Promise<CourseFileHandle>;
  removeEntry(name: string, options?: { recursive?: boolean }): Promise<void>;
}

interface FolderReadResult {
  project: ProjectSnapshot;
  skipped: number;
}

const projectRecoveryKey = "ucsb-xrp-course-project-v1";
const legacyRecoveryKey = "ucsb-xrp-stage-one-main-py";
const projectMetadataFile = ".ucsb-xrp-project.json";
const originalStageOneStarterSource = `from time import sleep_ms
from ucsb_xrp import MotorEfforts, XRPBot

bot = XRPBot()
print("Virtual XRP ready")

try:
    # Challenge 1 fixed-effort test: -1 reverse, 0 stop, +1 forward.
    test_efforts = MotorEfforts(0.58, 0.52)
    bot.set_efforts(test_efforts)
    print("Applying normalized {}".format(test_efforts))
    sleep_ms(1800)
finally:
    bot.stop()

print("Virtual run complete")
`;
const earlyStageOneStarterSource = `from time import sleep_ms
from ucsb_xrp import MotorEfforts, XRPBot

bot = XRPBot()
print("Virtual XRP ready")

try:
    bot.set_efforts(MotorEfforts(0.58, 0.52))
    print("Driving with left=0.58, right=0.52")
    sleep_ms(1800)
finally:
    bot.stop()

print("Virtual run complete")
`;
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
const maximumFiles = 250;
const maximumFileBytes = 1024 * 1024;

function defaultProject(): ProjectSnapshot {
  return {
    name: "straight-run-proof",
    entrypoint: STAGE_ONE_PROJECT.entrypoint,
    files: { ...STAGE_ONE_PROJECT.files },
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function recoveredProject(value: unknown): ProjectSnapshot | null {
  if (
    !isRecord(value) ||
    typeof value.name !== "string" ||
    typeof value.entrypoint !== "string" ||
    !isRecord(value.files)
  ) {
    return null;
  }
  const files: Record<string, string> = {};
  for (const [path, content] of Object.entries(value.files)) {
    if (typeof content !== "string" || projectPathError(path)) {
      return null;
    }
    files[path] = content;
  }
  if (Object.keys(files).length === 0 || !(value.entrypoint in files)) {
    return null;
  }
  return {
    name: value.name,
    entrypoint: value.entrypoint,
    files,
  };
}

function migrateOriginalStageOneStarter(
  project: ProjectSnapshot,
): ProjectSnapshot {
  const source = project.files["main.py"];
  if (
    source !== originalStageOneStarterSource &&
    source !== earlyStageOneStarterSource
  ) {
    return project;
  }
  const currentStarterSource = STAGE_ONE_PROJECT.files["main.py"];
  if (currentStarterSource === undefined) {
    return project;
  }
  return {
    ...project,
    files: {
      ...STAGE_ONE_PROJECT.files,
      ...project.files,
      "main.py": currentStarterSource,
    },
  };
}

export function loadRecoveredProject(): ProjectSnapshot {
  try {
    const saved = localStorage.getItem(projectRecoveryKey);
    if (saved) {
      const project = recoveredProject(JSON.parse(saved));
      if (project) {
        return migrateOriginalStageOneStarter(project);
      }
    }
    const legacySource = localStorage.getItem(legacyRecoveryKey);
    if (legacySource !== null) {
      return migrateOriginalStageOneStarter({
        ...defaultProject(),
        files: { "main.py": legacySource },
      });
    }
  } catch {
    return defaultProject();
  }
  return defaultProject();
}

export function storeRecoveredProject(project: ProjectSnapshot): void {
  try {
    localStorage.setItem(projectRecoveryKey, JSON.stringify(project));
  } catch {
    // The in-memory project remains usable if browser recovery is unavailable.
  }
}

export function projectPathError(path: string): string | null {
  const normalized = path.trim().replaceAll("\\", "/");
  if (!normalized) {
    return "Enter a file name.";
  }
  if (normalized.startsWith("/") || normalized.endsWith("/")) {
    return "Use a project-relative file path.";
  }
  if (normalized.split("/").some((part) => part === "" || part === "..")) {
    return "The path cannot contain empty folders or '..'.";
  }
  if (/[\0:*?"<>|]/.test(normalized)) {
    return "The file name contains a character that cannot be saved.";
  }
  if (normalized === projectMetadataFile) {
    return "That name is reserved for the project's startup-file setting.";
  }
  return null;
}

export function normalizedProjectPath(path: string): string {
  return path.trim().replaceAll("\\", "/");
}

function fileExtension(name: string): string {
  const dot = name.lastIndexOf(".");
  return dot < 0 ? "" : name.slice(dot).toLowerCase();
}

function selectEntrypoint(
  files: Record<string, string>,
  preferredEntrypoint?: string,
): string {
  if (
    preferredEntrypoint &&
    preferredEntrypoint.endsWith(".py") &&
    preferredEntrypoint in files
  ) {
    return preferredEntrypoint;
  }
  if ("main.py" in files) {
    return "main.py";
  }
  return (
    Object.keys(files)
      .sort()
      .find((path) => path.endsWith(".py")) ?? Object.keys(files).sort()[0]!
  );
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
  if (path in project.files) {
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
    throw new Error("The startup file must keep a .py extension.");
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
  const files = { ...project.files };
  delete files[path];
  let entrypoint = project.entrypoint;
  if (path === project.entrypoint) {
    const replacement = Object.keys(files)
      .sort()
      .find((candidate) => candidate.endsWith(".py"));
    if (!replacement) {
      throw new Error(
        "Create another Python file before deleting the only startup file.",
      );
    }
    entrypoint = replacement;
  }
  return { ...project, entrypoint, files };
}

export function setProjectEntrypoint(
  project: ProjectSnapshot,
  path: string,
): ProjectSnapshot {
  if (!(path in project.files)) {
    throw new Error(`${path} is not in the project.`);
  }
  if (!path.endsWith(".py")) {
    throw new Error("Only a Python file can be the startup file.");
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
  return (
    "showDirectoryPicker" in window &&
    typeof (
      window as Window & {
        showDirectoryPicker?: unknown;
      }
    ).showDirectoryPicker === "function"
  );
}

export async function chooseWorkingFolder(): Promise<CourseDirectoryHandle> {
  const picker = (
    window as Window & {
      showDirectoryPicker?: (options: {
        id: string;
        mode: "readwrite";
      }) => Promise<CourseDirectoryHandle>;
    }
  ).showDirectoryPicker;
  if (!picker) {
    throw new Error(
      "Folder access requires a current Chromium browser on localhost or HTTPS.",
    );
  }
  return picker({ id: "ucsb-xrp-course-project", mode: "readwrite" });
}

export async function readProjectFolder(
  root: CourseDirectoryHandle,
): Promise<FolderReadResult> {
  const files: Record<string, string> = {};
  let skipped = 0;
  let preferredEntrypoint: string | undefined;

  const visit = async (
    directory: CourseDirectoryHandle,
    prefix: string,
  ): Promise<void> => {
    for await (const [name, handle] of directory.entries()) {
      if (handle.kind === "directory") {
        if (name.startsWith(".") || ignoredDirectories.has(name)) {
          skipped += 1;
          continue;
        }
        await visit(handle, `${prefix}${name}/`);
        continue;
      }
      if (prefix === "" && name === projectMetadataFile) {
        try {
          const file = await handle.getFile();
          const metadata = JSON.parse(await file.text()) as unknown;
          if (isRecord(metadata) && typeof metadata.entrypoint === "string") {
            preferredEntrypoint = metadata.entrypoint;
          } else {
            skipped += 1;
          }
        } catch {
          skipped += 1;
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
      files[`${prefix}${name}`] = await file.text();
    }
  };

  await visit(root, "");
  if (Object.keys(files).length === 0) {
    throw new Error(
      "The selected folder contains no supported text project files.",
    );
  }
  return {
    project: {
      name: root.name,
      entrypoint: selectEntrypoint(files, preferredEntrypoint),
      files,
    },
    skipped,
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

export async function writeProjectFolder(
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
  const metadata = await root.getFileHandle(projectMetadataFile, {
    create: true,
  });
  const writable = await metadata.createWritable();
  await writable.write(
    `${JSON.stringify({ entrypoint: project.entrypoint }, null, 2)}\n`,
  );
  await writable.close();
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
