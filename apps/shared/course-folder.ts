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
  isSameEntry?(other: CourseDirectoryHandle): Promise<boolean>;
  resolve?(possibleDescendant: CourseDirectoryHandle): Promise<string[] | null>;
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
export const courseFolderChangedEvent = "ucsb-xrp-working-folder-changed";
const courseFolderChannelName = "ucsb-xrp-working-folder";

function announceCourseFolderChanged(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(courseFolderChangedEvent));
  }
  if (typeof BroadcastChannel !== "undefined") {
    const channel = new BroadcastChannel(courseFolderChannelName);
    channel.postMessage("changed");
    channel.close();
  }
}

/** Listen for a Working-folder or manifest change in this or another tab. */
export function subscribeCourseFolderChanged(listener: () => void): () => void {
  const localListener = () => listener();
  window.addEventListener(courseFolderChangedEvent, localListener);
  const channel =
    typeof BroadcastChannel === "undefined"
      ? null
      : new BroadcastChannel(courseFolderChannelName);
  if (channel) channel.onmessage = listener;
  return () => {
    window.removeEventListener(courseFolderChangedEvent, localListener);
    channel?.close();
  };
}

const databaseName = "ucsb-xrp-course-tools-v1";
const databaseVersion = 1;
const handleStoreName = "course-folders";
// IndexedDB retains only the browser capability needed to reopen a directory.
// Serializable project and robot state belongs in .ucsbxrp.json on disk.
const workspaceFolderCapabilityKey = "workspace-folder-capability-v1";
export const workspaceManifestFile = ".ucsbxrp.json";

export interface WorkspaceManifestRobot {
  id: string;
  name: string;
  networkMode: "station" | "access_point";
  ssid: string;
  address: string;
}

export type WorkspaceSettingValue =
  | string
  | number
  | boolean
  | null
  | WorkspaceSettingValue[]
  | { [key: string]: WorkspaceSettingValue };

export interface WorkspaceManifest {
  schemaVersion: 1;
  activeProject: string | null;
  robot?: WorkspaceManifestRobot;
  settings?: Record<string, WorkspaceSettingValue>;
}
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

export async function rememberWorkspaceFolder(
  handle: CourseDirectoryHandle,
): Promise<boolean> {
  return (await replaceRememberedWorkspaceFolder(handle)).remembered;
}

async function sameDirectoryHandle(
  first: CourseDirectoryHandle | null,
  second: CourseDirectoryHandle,
): Promise<boolean> {
  if (!first) return false;
  if (first === second) return true;
  try {
    if (first.isSameEntry) return await first.isSameEntry(second);
    if (second.isSameEntry) return await second.isSameEntry(first);
  } catch {
    // If Chrome can no longer compare the retained handle, treat the explicit
    // folder choice as a change. This prevents an old project from following a
    // student into a newly selected course folder.
  }
  return false;
}

/**
 * Determine whether a retained project folder belongs to the selected course
 * folder. `null` means the browser handle cannot prove either relationship;
 * callers should preserve the handle rather than discard student work.
 */
export async function projectFolderIsInsideCourseFolder(
  courseFolder: CourseDirectoryHandle,
  projectFolder: CourseDirectoryHandle,
): Promise<boolean | null> {
  if (courseFolder === projectFolder) return false;
  try {
    if (courseFolder.resolve) {
      const relativePath = await courseFolder.resolve(projectFolder);
      return relativePath !== null && relativePath.length > 0;
    }
  } catch {
    // Fall through to identity checks for compatibility handles and older
    // browser implementations.
  }

  try {
    if (courseFolder.isSameEntry) {
      if (await courseFolder.isSameEntry(projectFolder)) return false;
    } else if (projectFolder.isSameEntry) {
      if (await projectFolder.isSameEntry(courseFolder)) return false;
    }
  } catch {
    // Neither identity nor ancestry can be established safely.
  }
  return null;
}

export interface WorkspaceFolderSelection {
  changed: boolean;
  remembered: boolean;
}

/** Remember the parent folder used when creating or opening projects. */
export async function replaceRememberedWorkspaceFolder(
  handle: CourseDirectoryHandle,
): Promise<WorkspaceFolderSelection> {
  const previous = await loadRememberedWorkspaceFolder();
  const changed = !(await sameDirectoryHandle(previous, handle));
  if (typeof indexedDB === "undefined") {
    return { changed, remembered: false };
  }
  try {
    const database = await openFolderDatabase();
    const transaction = database.transaction(handleStoreName, "readwrite");
    const completed = transactionComplete(transaction);
    const store = transaction.objectStore(handleStoreName);
    store.put(handle, workspaceFolderCapabilityKey);
    await completed;
    database.close();
    announceCourseFolderChanged();
    return { changed, remembered: true };
  } catch {
    return { changed, remembered: false };
  }
}

/** Forget retained folder handles without deleting any files on disk. */
export async function forgetWorkspaceAndProjectFolders(): Promise<boolean> {
  if (typeof indexedDB === "undefined") return false;
  try {
    const database = await openFolderDatabase();
    const transaction = database.transaction(handleStoreName, "readwrite");
    const completed = transactionComplete(transaction);
    const store = transaction.objectStore(handleStoreName);
    store.delete(workspaceFolderCapabilityKey);
    await completed;
    database.close();
    announceCourseFolderChanged();
    return true;
  } catch {
    return false;
  }
}

export async function forgetWorkspaceFolder(): Promise<boolean> {
  return forgetWorkspaceAndProjectFolders();
}

export async function rememberProjectFolder(
  handle: CourseDirectoryHandle,
): Promise<boolean> {
  const workspace = await loadRememberedWorkspaceFolder();
  if (!workspace) return false;
  if ((await projectFolderIsInsideCourseFolder(workspace, handle)) !== true) {
    return false;
  }
  try {
    const updated = await updateWorkspaceManifest(workspace, {
      activeProject: handle.name,
    });
    if (!updated) return false;
    return true;
  } catch {
    return false;
  }
}

export async function forgetProjectFolder(): Promise<boolean> {
  try {
    const workspace = await loadRememberedWorkspaceFolder();
    if (!workspace) return true;
    const updated = await updateWorkspaceManifest(workspace, {
      activeProject: null,
    });
    if (!updated) return false;
    return true;
  } catch {
    return false;
  }
}

async function loadWorkspaceCapability(): Promise<CourseDirectoryHandle | null> {
  if (typeof indexedDB === "undefined") {
    return null;
  }
  try {
    const database = await openFolderDatabase();
    const transaction = database.transaction(handleStoreName, "readwrite");
    const completed = transactionComplete(transaction);
    const store = transaction.objectStore(handleStoreName);
    const handle = await requestResult(store.get(workspaceFolderCapabilityKey));
    await completed;
    database.close();
    return (handle as CourseDirectoryHandle | undefined) ?? null;
  } catch {
    return null;
  }
}

function validWorkspaceManifest(value: unknown): value is WorkspaceManifest {
  if (
    typeof value !== "object" ||
    value === null ||
    !("schemaVersion" in value) ||
    value.schemaVersion !== 1 ||
    !("activeProject" in value) ||
    (value.activeProject !== null && typeof value.activeProject !== "string")
  ) {
    return false;
  }
  return true;
}

export async function loadWorkspaceManifest(
  workspace: CourseDirectoryHandle,
): Promise<WorkspaceManifest | null> {
  try {
    const file = await workspace.getFileHandle(workspaceManifestFile);
    const value = JSON.parse(await (await file.getFile()).text()) as unknown;
    return validWorkspaceManifest(value) ? value : null;
  } catch {
    return null;
  }
}

export async function updateWorkspaceManifest(
  workspace: CourseDirectoryHandle,
  update: {
    activeProject?: string | null;
    robot?: WorkspaceManifestRobot;
    settings?: Record<string, WorkspaceSettingValue>;
  },
): Promise<boolean> {
  return (
    (await mutateWorkspaceManifest(workspace, (previous) => ({
      ...previous,
      activeProject:
        update.activeProject !== undefined
          ? update.activeProject
          : previous.activeProject,
      ...((update.robot ?? previous.robot)
        ? { robot: update.robot ?? previous.robot }
        : {}),
      ...((update.settings ?? previous.settings)
        ? {
            settings: {
              ...(previous.settings ?? {}),
              ...(update.settings ?? {}),
            },
          }
        : {}),
    }))) !== null
  );
}

/**
 * Read, change, and replace the sole on-disk app configuration atomically.
 * A waiting tab rereads the file after earlier writes complete.
 */
export async function mutateWorkspaceManifest(
  workspace: CourseDirectoryHandle,
  transform: (current: WorkspaceManifest) => WorkspaceManifest,
): Promise<WorkspaceManifest | null> {
  try {
    return await withCourseFolderWriteLock("config", async () => {
      const previous = (await loadWorkspaceManifest(workspace)) ?? {
        schemaVersion: 1 as const,
        activeProject: null,
      };
      const next = transform(previous);
      const file = await workspace.getFileHandle(workspaceManifestFile, {
        create: true,
      });
      const writable = await file.createWritable();
      await writable.write(`${JSON.stringify(next, null, 2)}\n`);
      await writable.close();
      announceCourseFolderChanged();
      return next;
    });
  } catch {
    return null;
  }
}

export async function loadRememberedWorkspaceFolder(): Promise<CourseDirectoryHandle | null> {
  // Older releases stored workspace, project, and recovery records
  // independently. Do not migrate them: that model could reopen an unrelated
  // project after a student selected a new Working folder.
  return loadWorkspaceCapability();
}

export async function loadRememberedProjectFolder(): Promise<CourseDirectoryHandle | null> {
  const workspace = await loadRememberedWorkspaceFolder();
  if (!workspace) return null;
  const manifest = await loadWorkspaceManifest(workspace);
  const name = manifest?.activeProject?.trim();
  if (!name || name.includes("/") || name.includes("\\")) return null;
  try {
    return await workspace.getDirectoryHandle(name);
  } catch {
    return null;
  }
}

export async function withCourseFolderWriteLock<T>(
  area: "project" | "run" | "setup" | "config",
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
