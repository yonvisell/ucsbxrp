import {
  readCourseTextFile,
  writeCourseTextFile,
  type CourseDirectoryHandle,
} from "../../shared/course-folder";
import type { ProjectSnapshot } from "./project-files";
import {
  acquireProjectWriter,
  type ProjectWriterAdmission,
} from "./project-writer-admission";

const admissions = new WeakMap<object, ProjectWriterAdmission>();

export async function assertProjectWriterCurrent(
  root: CourseDirectoryHandle,
): Promise<void> {
  await admissions.get(root)?.assertCurrent();
}

export const projectCommitFile = ".ucsb-xrp-commit.json";
const writerLockFile = ".ucsb-xrp-write-lock";
const waitLimitMs = 2_000;

export interface PendingProjectCommit {
  transactionId: string;
  createdAt: number;
  previous: ProjectSnapshot | null;
  intended: ProjectSnapshot;
  /** Exact readable file set observed when another program interrupted a commit. */
  observed?: ProjectSnapshot;
  deletedPaths: string[];
}

export class ProjectCommitRecoveryError extends Error {
  readonly name = "ProjectCommitRecoveryError";
  constructor(readonly commit: PendingProjectCommit) {
    super(
      "A Project save did not finish. Open project recovery to retain the complete previous or intended version before continuing.",
    );
  }
}

/** Validate bounded journal shape without creating a runtime import cycle. */
function validateCommitSnapshot(
  value: unknown,
): asserts value is ProjectSnapshot {
  if (!value || typeof value !== "object")
    throw new Error("Project recovery snapshot is missing.");
  const snapshot = value as ProjectSnapshot;
  if (
    typeof snapshot.name !== "string" ||
    typeof snapshot.entrypoint !== "string" ||
    !snapshot.files ||
    typeof snapshot.files !== "object" ||
    Array.isArray(snapshot.files)
  )
    throw new Error("Project recovery snapshot is incomplete.");
  const contents = Object.values(snapshot.files);
  if (
    !contents.length ||
    contents.length > 250 ||
    !contents.every(
      (text) =>
        typeof text === "string" &&
        new TextEncoder().encode(text).byteLength <= 1024 * 1024,
    ) ||
    contents.reduce(
      (bytes, text) => bytes + new TextEncoder().encode(text).byteLength,
      0,
    ) >
      4 * 1024 * 1024 ||
    !(snapshot.entrypoint in snapshot.files)
  )
    throw new Error(
      "Project recovery source exceeds the supported shape or size.",
    );
}

export async function pendingProjectCommit(
  root: CourseDirectoryHandle,
): Promise<PendingProjectCommit | null> {
  let file;
  try {
    file = await (await root.getFileHandle(projectCommitFile)).getFile();
  } catch (error) {
    if (error instanceof DOMException && error.name === "NotFoundError")
      return null;
    throw error;
  }
  // Three bounded 4 MB source snapshots can expand sixfold in JSON escapes.
  if (file.size > 73 * 1024 * 1024)
    throw new Error(
      "Project recovery marker exceeds the supported size. Keep this folder for manual recovery.",
    );
  const text = await file.text();
  if (text === null) return null;
  let value: PendingProjectCommit;
  try {
    value = JSON.parse(text) as PendingProjectCommit;
  } catch {
    throw new Error(
      "The Project recovery marker is damaged. Keep this folder and export its files before repairing it.",
    );
  }
  if (
    !value.transactionId ||
    !value.intended?.files ||
    !Array.isArray(value.deletedPaths)
  ) {
    throw new Error(
      "The Project recovery marker is incomplete. Keep this folder for recovery.",
    );
  }
  validateCommitSnapshot(value.intended);
  if (value.previous) validateCommitSnapshot(value.previous);
  if (value.observed) validateCommitSnapshot(value.observed);
  if (!value.deletedPaths.every((path) => typeof path === "string"))
    throw new Error("Invalid recovery deletion list.");
  return value;
}

export async function beginProjectCommit(
  root: CourseDirectoryHandle,
  commit: PendingProjectCommit,
): Promise<void> {
  const text = JSON.stringify(commit) + "\n";
  await writeCourseTextFile(root, projectCommitFile, text);
  if ((await readCourseTextFile(root, projectCommitFile)) !== text)
    throw new Error(
      "The complete Project recovery snapshot could not be verified. Source files were not changed.",
    );
}

/** Keep the observed external version before reporting a native close conflict. */
export async function retainObservedProjectCommit(
  root: CourseDirectoryHandle,
  observed: ProjectSnapshot,
): Promise<void> {
  validateCommitSnapshot(observed);
  const pending = await pendingProjectCommit(root);
  if (!pending)
    throw new Error(
      "The Project recovery marker is unavailable. Keep this folder unchanged for recovery.",
    );
  const text = JSON.stringify({ ...pending, observed }) + "\n";
  const file = await root.getFileHandle(projectCommitFile);
  const writable = await file.createWritable();
  try {
    await writable.write(text);
    await assertProjectWriterCurrent(root);
    if (
      (await pendingProjectCommit(root))?.transactionId !==
      pending.transactionId
    )
      throw new Error(
        "The Project recovery marker changed. No source file was replaced.",
      );
    await writable.close();
    if ((await readCourseTextFile(root, projectCommitFile)) !== text)
      throw new Error(
        "The observed disk version could not be verified in recovery. Keep the native folder unchanged.",
      );
  } catch (error) {
    await writable.abort?.().catch(() => undefined);
    throw error;
  }
}

export async function finishProjectCommit(
  root: CourseDirectoryHandle,
  transactionId: string,
): Promise<void> {
  const current = await pendingProjectCommit(root);
  if (current?.transactionId !== transactionId)
    throw new Error(
      "Another writer changed the Project commit marker. Both recovery copies must be retained.",
    );
  await root.removeEntry(projectCommitFile);
}

/** Native exclusive stream and cross-client ticket admission; no siloed fallback. */
export async function withProjectNativeWrite<T>(
  root: CourseDirectoryHandle,
  projectId: string,
  operation: () => Promise<T>,
): Promise<T> {
  const exclusive = async () => {
    const lock = await root.getFileHandle(writerLockFile, { create: true });
    let stream: Awaited<ReturnType<typeof lock.createWritable>>;
    try {
      stream = await lock.createWritable({
        mode: "exclusive",
        keepExistingData: true,
      });
    } catch (error) {
      throw new Error(
        `Another page or program may be saving ${root.name}. Close its editor or wait for its save, then retry. ${error instanceof Error ? error.message : String(error)}`,
      );
    }
    let admission: ProjectWriterAdmission | undefined;
    try {
      admission = await acquireProjectWriter(root);
      admissions.set(root, admission);
      return await operation();
    } finally {
      admissions.delete(root);
      try {
        await admission?.release();
      } finally {
        if (stream.abort) await stream.abort();
        else await stream.close();
      }
    }
  };
  if (typeof navigator === "undefined" || !navigator.locks) return exclusive();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), waitLimitMs);
  try {
    return await navigator.locks.request(
      `ucsb-xrp-project:${projectId}`,
      { signal: controller.signal },
      async () => {
        clearTimeout(timer);
        return exclusive();
      },
    );
  } catch (error) {
    if (controller.signal.aborted)
      throw new Error(
        "This Project is still being saved in another page. Retry after that save finishes; your edits remain available.",
      );
    throw error;
  } finally {
    clearTimeout(timer);
  }
}
