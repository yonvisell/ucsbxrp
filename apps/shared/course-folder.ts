export interface CourseFileHandle {
  readonly kind: "file";
  readonly name: string;
  getFile(): Promise<File>;
  createWritable(): Promise<{
    write(data: string | Blob): Promise<void>;
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
  queryPermission?(options: { mode: "readwrite" }): Promise<PermissionState>;
  requestPermission?(options: { mode: "readwrite" }): Promise<PermissionState>;
}

export interface RotatingTextEntry {
  baseName: string;
  extension: string;
  content: string | null;
}

export const autosaveDirectoryName = "UCSB_XRP_Autosaves";
export const autosaveGenerations = 4;
export const courseFolderChangedKey = "ucsb-xrp-course-folder-changed-v1";
export const workspaceFolderChangedKey = "ucsb-xrp-workspace-folder-changed-v1";
export const courseFolderIdeHandoffKey =
  "ucsb-xrp-course-folder-ide-handoff-v1";

const databaseName = "ucsb-xrp-course-tools-v1";
const databaseVersion = 1;
const handleStoreName = "course-folders";
const workingFolderKey = "working-folder";
const projectFolderKey = "project-folder-v1";
const workspaceFolderKey = "workspace-folder-v1";
const projectMetadataFile = ".ucsb-xrp-project.json";
const autosaveReadme = `UCSB XRP automatic copies

The browser creates these files after a project folder has been selected.
Generation 1 is newest; generation 4 is oldest.

- project-N.json: complete project state before a source overwrite
- run-N.txt: program and service output from a monitored run
- telemetry-N.csv: unit-labeled telemetry from the same run
- run-N.json: target, project, time, and completion metadata
- xrp-setup-latest.txt: latest robot setup and connection log

Explicit CSV downloads are separate and are never rotated here.
`;

function isNotFound(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "name" in error &&
    error.name === "NotFoundError"
  );
}

function requestResult<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () =>
      reject(request.error ?? new Error("Browser storage request failed"));
  });
}

function transactionComplete(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onabort = () =>
      reject(transaction.error ?? new Error("Browser storage was aborted"));
    transaction.onerror = () =>
      reject(transaction.error ?? new Error("Browser storage failed"));
  });
}

function openFolderDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(databaseName, databaseVersion);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(handleStoreName)) {
        request.result.createObjectStore(handleStoreName);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () =>
      reject(request.error ?? new Error("Folder recovery storage failed"));
  });
}

export function supportsCourseFolders(): boolean {
  return (
    typeof window !== "undefined" &&
    "showDirectoryPicker" in window &&
    typeof (
      window as Window & {
        showDirectoryPicker?: unknown;
      }
    ).showDirectoryPicker === "function"
  );
}

async function chooseFolder(id: string): Promise<CourseDirectoryHandle> {
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
      "Local folders require desktop Chrome or Edge opened from the UCSBXRP course site.",
    );
  }
  return picker({ id, mode: "readwrite" });
}

/** @deprecated Choose a workspace or project folder explicitly. */
export async function chooseCourseFolder(): Promise<CourseDirectoryHandle> {
  return chooseFolder("ucsb-xrp-course-project");
}

export async function chooseWorkspaceFolder(): Promise<CourseDirectoryHandle> {
  return chooseFolder("ucsb-xrp-workspace");
}

export async function chooseProjectFolder(): Promise<CourseDirectoryHandle> {
  return chooseFolder("ucsb-xrp-project");
}

export async function courseFolderPermission(
  handle: CourseDirectoryHandle,
): Promise<PermissionState> {
  if (!handle.queryPermission) {
    return "granted";
  }
  return handle.queryPermission({ mode: "readwrite" });
}

export async function requestCourseFolderPermission(
  handle: CourseDirectoryHandle,
): Promise<PermissionState> {
  const current = await courseFolderPermission(handle);
  if (current === "granted" || !handle.requestPermission) {
    return current;
  }
  return handle.requestPermission({ mode: "readwrite" });
}

async function rememberFolder(
  handle: CourseDirectoryHandle,
  key: string,
  changeKey: string,
): Promise<boolean> {
  if (typeof indexedDB === "undefined") {
    return false;
  }
  try {
    const database = await openFolderDatabase();
    const transaction = database.transaction(handleStoreName, "readwrite");
    const completed = transactionComplete(transaction);
    transaction.objectStore(handleStoreName).put(handle, key);
    await completed;
    database.close();
    try {
      localStorage.setItem(changeKey, String(Date.now()));
    } catch {
      // The handle remains available to this origin even without localStorage.
    }
    return true;
  } catch {
    return false;
  }
}

/** @deprecated Remember a workspace or project folder explicitly. */
export async function rememberCourseFolder(
  handle: CourseDirectoryHandle,
): Promise<boolean> {
  return rememberFolder(handle, workingFolderKey, courseFolderChangedKey);
}

export async function rememberWorkspaceFolder(
  handle: CourseDirectoryHandle,
): Promise<boolean> {
  return rememberFolder(handle, workspaceFolderKey, workspaceFolderChangedKey);
}

export async function rememberProjectFolder(
  handle: CourseDirectoryHandle,
): Promise<boolean> {
  return rememberFolder(handle, projectFolderKey, courseFolderChangedKey);
}

export function handCourseFolderToIde(): void {
  try {
    localStorage.setItem(courseFolderIdeHandoffKey, "pending");
  } catch {
    // The remembered IndexedDB handle still remains useful to the IDE.
  }
}

export function courseFolderIsWaitingForIde(): boolean {
  try {
    return localStorage.getItem(courseFolderIdeHandoffKey) === "pending";
  } catch {
    return false;
  }
}

export function finishCourseFolderIdeHandoff(): void {
  try {
    localStorage.removeItem(courseFolderIdeHandoffKey);
  } catch {
    // No persistent handoff state remains available to clear.
  }
}

async function loadRememberedFolder(
  key: string,
): Promise<CourseDirectoryHandle | null> {
  if (typeof indexedDB === "undefined") {
    return null;
  }
  try {
    const database = await openFolderDatabase();
    const transaction = database.transaction(handleStoreName, "readonly");
    const completed = transactionComplete(transaction);
    const handle = await requestResult(
      transaction.objectStore(handleStoreName).get(key),
    );
    await completed;
    database.close();
    return (handle as CourseDirectoryHandle | undefined) ?? null;
  } catch {
    return null;
  }
}

async function hasProjectMetadata(
  handle: CourseDirectoryHandle,
): Promise<boolean> {
  try {
    await handle.getFileHandle(projectMetadataFile);
    return true;
  } catch (error) {
    if (isNotFound(error)) {
      return false;
    }
    throw error;
  }
}

/** @deprecated Load a workspace or project folder explicitly. */
export async function loadRememberedCourseFolder(): Promise<CourseDirectoryHandle | null> {
  return loadRememberedFolder(workingFolderKey);
}

export async function loadRememberedWorkspaceFolder(): Promise<CourseDirectoryHandle | null> {
  const remembered = await loadRememberedFolder(workspaceFolderKey);
  if (remembered) {
    return remembered;
  }
  const legacy = await loadRememberedFolder(workingFolderKey);
  if (!legacy) {
    return null;
  }
  try {
    return (await hasProjectMetadata(legacy)) ? null : legacy;
  } catch {
    return null;
  }
}

export async function loadRememberedProjectFolder(): Promise<CourseDirectoryHandle | null> {
  const remembered = await loadRememberedFolder(projectFolderKey);
  if (remembered) {
    return remembered;
  }
  const legacy = await loadRememberedFolder(workingFolderKey);
  if (!legacy) {
    return null;
  }
  try {
    return (await hasProjectMetadata(legacy)) ? legacy : null;
  } catch {
    return null;
  }
}

export async function withCourseFolderWriteLock<T>(
  area: "project" | "run" | "setup",
  operation: () => Promise<T>,
): Promise<T> {
  if (typeof navigator !== "undefined" && navigator.locks) {
    return navigator.locks.request(`ucsb-xrp-${area}-folder-write`, operation);
  }
  return operation();
}

async function directoryForPath(
  root: CourseDirectoryHandle,
  path: string,
  create: boolean,
): Promise<{ directory: CourseDirectoryHandle; name: string }> {
  const parts = path.split("/");
  const name = parts.pop();
  if (!name || parts.some((part) => !part || part === "..")) {
    throw new Error(`Invalid course data path '${path}'`);
  }
  let directory = root;
  for (const part of parts) {
    directory = await directory.getDirectoryHandle(part, { create });
  }
  return { directory, name };
}

export async function writeCourseTextFile(
  root: CourseDirectoryHandle,
  path: string,
  content: string,
): Promise<void> {
  const { directory, name } = await directoryForPath(root, path, true);
  const handle = await directory.getFileHandle(name, { create: true });
  const writable = await handle.createWritable();
  await writable.write(content);
  await writable.close();
}

export async function writeCourseFile(
  root: CourseDirectoryHandle,
  path: string,
  content: string | Blob,
): Promise<void> {
  const { directory, name } = await directoryForPath(root, path, true);
  const handle = await directory.getFileHandle(name, { create: true });
  const writable = await handle.createWritable();
  await writable.write(content);
  await writable.close();
}

export async function readCourseTextFile(
  root: CourseDirectoryHandle,
  path: string,
): Promise<string | null> {
  try {
    const { directory, name } = await directoryForPath(root, path, false);
    const handle = await directory.getFileHandle(name);
    return await (await handle.getFile()).text();
  } catch (error) {
    if (isNotFound(error)) {
      return null;
    }
    throw error;
  }
}

async function removeCourseTextFile(
  root: CourseDirectoryHandle,
  path: string,
): Promise<void> {
  try {
    const { directory, name } = await directoryForPath(root, path, false);
    await directory.removeEntry(name);
  } catch (error) {
    if (!isNotFound(error)) {
      throw error;
    }
  }
}

function generationPath(entry: RotatingTextEntry, generation: number): string {
  return `${autosaveDirectoryName}/${entry.baseName}-${generation}.${entry.extension}`;
}

export async function writeRotatingTextBundle(
  root: CourseDirectoryHandle,
  entries: readonly RotatingTextEntry[],
): Promise<void> {
  for (let generation = autosaveGenerations; generation >= 2; generation -= 1) {
    for (const entry of entries) {
      const previous = await readCourseTextFile(
        root,
        generationPath(entry, generation - 1),
      );
      const destination = generationPath(entry, generation);
      if (previous === null) {
        await removeCourseTextFile(root, destination);
      } else {
        await writeCourseTextFile(root, destination, previous);
      }
    }
  }

  for (const entry of entries) {
    const newest = generationPath(entry, 1);
    if (entry.content === null) {
      await removeCourseTextFile(root, newest);
    } else {
      await writeCourseTextFile(root, newest, entry.content);
    }
  }
  await writeCourseTextFile(
    root,
    `${autosaveDirectoryName}/README.txt`,
    autosaveReadme,
  );
}
