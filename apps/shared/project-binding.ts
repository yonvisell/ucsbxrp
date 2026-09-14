import {
  courseFolderPermission,
  type CourseDirectoryHandle,
} from "./course-folder";

export interface ProjectFolderBinding {
  workspace: CourseDirectoryHandle;
  folder: CourseDirectoryHandle;
}

function database(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("ucsb-xrp-project-bindings-v1", 1);
    request.onupgradeneeded = () =>
      request.result.createObjectStore("bindings");
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function storedBindings(
  projectId: string,
): Promise<ProjectFolderBinding[]> {
  const db = await database();
  try {
    return await new Promise((resolve, reject) => {
      const request = db
        .transaction("bindings")
        .objectStore("bindings")
        .get(projectId);
      request.onsuccess = () => resolve(request.result ?? []);
      request.onerror = () => reject(request.error);
    });
  } finally {
    db.close();
  }
}

async function sameFolder(a: CourseDirectoryHandle, b: CourseDirectoryHandle) {
  return a === b || (a.isSameEntry ? await a.isSameEntry(b) : false);
}

/** Capabilities only; registering another copy never silently replaces its peer. */
export async function rememberProjectBinding(
  projectId: string,
  binding: ProjectFolderBinding,
): Promise<void> {
  const write = async () => {
    const candidates = await storedBindings(projectId);
    for (const previous of candidates) {
      if (await sameFolder(previous.folder, binding.folder)) return;
    }
    if (candidates.length >= 16)
      throw new Error(
        "Too many folders share this Project identity. Save a new Project copy before running.",
      );
    const db = await database();
    try {
      await new Promise<void>((resolve, reject) => {
        const transaction = db.transaction("bindings", "readwrite");
        transaction
          .objectStore("bindings")
          .put([...candidates, binding], projectId);
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
        transaction.onabort = () => reject(transaction.error);
      });
    } finally {
      db.close();
    }
  };
  if (typeof navigator !== "undefined" && navigator.locks)
    await navigator.locks.request(`ucsb-xrp-binding:${projectId}`, write);
  else await write();
}

async function projectIdIn(
  folder: CourseDirectoryHandle,
): Promise<string | null> {
  const file = await folder.getFileHandle(".ucsb-xrp-project.json");
  const content = await file.getFile();
  if (content.size > 64 * 1024)
    throw new Error(
      "Project identity metadata is too large to verify. Export this run manually.",
    );
  const value = JSON.parse(await content.text()) as {
    session?: { projectId?: unknown };
  };
  return typeof value.session?.projectId === "string"
    ? value.session.projectId
    : null;
}

export async function resolveProjectFolderById(
  workspace: CourseDirectoryHandle,
  projectId: string,
): Promise<CourseDirectoryHandle | null> {
  const matches: CourseDirectoryHandle[] = [];
  let inspected = 0;
  for await (const [name, folder] of workspace.entries()) {
    if (++inspected > 1_000)
      throw new Error(
        "The Working folder contains too many entries to identify the run destination. Export this run manually.",
      );
    if (folder.kind !== "directory" || name.startsWith(".")) continue;
    try {
      if ((await projectIdIn(folder)) === projectId) matches.push(folder);
    } catch (error) {
      if (!(error instanceof DOMException && error.name === "NotFoundError"))
        throw error;
    }
  }
  if (matches.length > 1)
    throw new Error(
      "Several Project folders share this identity. Export this run manually or create a new Project copy.",
    );
  return matches[0] ?? null;
}

/** Resolve the Run source rather than the last globally selected Project. */
export async function loadProjectBinding(
  projectId: string,
): Promise<ProjectFolderBinding | null> {
  const candidates = await storedBindings(projectId);
  const matches: ProjectFolderBinding[] = [];
  for (const candidate of candidates) {
    if ((await courseFolderPermission(candidate.folder)) !== "granted")
      continue;
    try {
      if ((await projectIdIn(candidate.folder)) !== projectId) continue;
      if (!(await resolveProjectFolderById(candidate.workspace, projectId)))
        continue;
      let duplicate = false;
      for (const match of matches)
        if (await sameFolder(match.folder, candidate.folder)) duplicate = true;
      if (!duplicate) matches.push(candidate);
    } catch (error) {
      if (!(error instanceof DOMException && error.name === "NotFoundError"))
        throw error;
    }
  }
  if (matches.length > 1)
    throw new Error(
      "Several selected folders share this Project identity. Export this run manually; no archive destination was chosen.",
    );
  return matches[0] ?? null;
}
