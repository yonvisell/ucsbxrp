import type { CourseDirectoryHandle } from "../../shared/course-folder";
import {
  projectMetadataFile,
  readProjectFolder,
  type FolderReadResult,
} from "./project-files";
import {
  pendingProjectCommit,
  ProjectCommitRecoveryError,
} from "./project-native-write";
import { inspectProjectWriters } from "./project-writer-admission";

async function metadataGeneration(folder: CourseDirectoryHandle) {
  try {
    const file = await (
      await folder.getFileHandle(projectMetadataFile)
    ).getFile();
    if (file.size > 64 * 1024)
      throw new Error("Project metadata exceeds the supported 64 KB limit.");
    return await file.text();
  } catch (error) {
    if (error instanceof DOMException && error.name === "NotFoundError")
      return null;
    throw error;
  }
}

/** Read outside write transactions; never acquire or recover a writer here. */
export async function readProjectFolderWhenIdle(
  folder: CourseDirectoryHandle,
  options: {
    assertCurrent?: () => void;
    onWait?: () => void;
    timeoutMs?: number;
  } = {},
): Promise<FolderReadResult> {
  const deadline = performance.now() + (options.timeoutMs ?? 2_000);
  let notified = false;
  let lastError: unknown;
  while (true) {
    options.assertCurrent?.();
    let generation: string | null | undefined;
    try {
      if ((await inspectProjectWriters(folder)).length === 0) {
        generation = await metadataGeneration(folder);
        options.assertCurrent?.();
        const result = await readProjectFolder(folder);
        options.assertCurrent?.();
        if ((await inspectProjectWriters(folder)).length === 0) {
          const after = await metadataGeneration(folder);
          options.assertCurrent?.();
          if (generation === after) {
            if (result.integrity === "changed-after-save")
              throw new Error(
                `${folder.name} has changed since its last complete save. Open it in the IDE to review and save the files before running from the Monitor.`,
              );
            return result;
          }
        }
      }
    } catch (error) {
      options.assertCurrent?.();
      const writers = await inspectProjectWriters(folder);
      const generationChanged =
        generation !== undefined &&
        generation !== (await metadataGeneration(folder));
      const observedCommitFinished =
        error instanceof ProjectCommitRecoveryError &&
        (await pendingProjectCommit(folder))?.transactionId !==
          error.commit.transactionId;
      options.assertCurrent?.();
      if (
        !(error instanceof DOMException && error.name === "NotFoundError") &&
        writers.length === 0 &&
        !generationChanged &&
        !observedCommitFinished
      )
        throw error;
      lastError = error;
    }
    options.assertCurrent?.();
    if (performance.now() >= deadline) {
      throw new Error(
        `Could not read a completed save from ${folder.name}. Wait for its editor to finish, then refresh the Project folder. If all editors are closed, open Project recovery in the IDE.`,
        { cause: lastError },
      );
    }
    if (!notified) {
      notified = true;
      options.onWait?.();
    }
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
}
