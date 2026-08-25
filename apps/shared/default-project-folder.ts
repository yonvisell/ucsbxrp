import { DEFAULT_COURSE_PROJECT, type CourseProject } from "@ucsb-xrp/target";

import {
  rememberProjectFolder,
  writeCourseTextFile,
  type CourseDirectoryHandle,
} from "./course-folder";

export const defaultProjectFolderName = "Expanding-Spiral";
const projectMetadataFile = ".ucsb-xrp-project.json";

function isNotFound(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "name" in error &&
    error.name === "NotFoundError"
  );
}

async function hasProjectMetadata(
  folder: CourseDirectoryHandle,
): Promise<boolean> {
  try {
    await folder.getFileHandle(projectMetadataFile);
    return true;
  } catch (error) {
    if (isNotFound(error)) return false;
    throw error;
  }
}

async function writeProject(
  folder: CourseDirectoryHandle,
  project: CourseProject,
): Promise<void> {
  for (const [path, content] of Object.entries(project.files)) {
    await writeCourseTextFile(folder, path, content);
  }
  await writeCourseTextFile(
    folder,
    projectMetadataFile,
    `${JSON.stringify(
      {
        name: project.name ?? "Expanding spiral",
        entrypoint: project.entrypoint,
      },
      null,
      2,
    )}\n`,
  );
}

/**
 * Create or reopen the ordinary default project inside a newly selected course
 * folder and make it the project that the IDE will open. Existing project files
 * are never overwritten.
 */
export async function prepareDefaultProjectFolder(
  workspace: CourseDirectoryHandle,
): Promise<{ folder: CourseDirectoryHandle; created: boolean }> {
  for (let index = 1; index <= 100; index += 1) {
    const name =
      index === 1
        ? defaultProjectFolderName
        : `${defaultProjectFolderName}-${index}`;
    try {
      const existing = await workspace.getDirectoryHandle(name);
      if (!(await hasProjectMetadata(existing))) continue;
      if (!(await rememberProjectFolder(existing))) {
        throw new Error(
          "Chrome could not remember the default XRP project folder.",
        );
      }
      return { folder: existing, created: false };
    } catch (error) {
      if (!isNotFound(error)) throw error;
      const folder = await workspace.getDirectoryHandle(name, {
        create: true,
      });
      await writeProject(folder, DEFAULT_COURSE_PROJECT);
      if (!(await rememberProjectFolder(folder))) {
        throw new Error(
          "Chrome could not remember the default XRP project folder.",
        );
      }
      return { folder, created: true };
    }
  }
  throw new Error(
    `No available project folder name begins with ${defaultProjectFolderName}.`,
  );
}
