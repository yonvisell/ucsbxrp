import {
  autosaveDirectoryName,
  readCourseTextFile,
  withCourseFolderWriteLock,
  writeCourseTextFile,
  type CourseDirectoryHandle,
} from "../../shared/course-folder";

export type SetupLogLevel = "info" | "success" | "warning" | "error";

export interface SetupLogEntry {
  at: string;
  level: SetupLogLevel;
  step: string;
  message: string;
}

export const setupLogPath = `${autosaveDirectoryName}/xrp-setup-latest.txt`;

function oneLine(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

export function createSetupLogEntry(
  step: string,
  message: string,
  level: SetupLogLevel = "info",
  at = new Date(),
): SetupLogEntry {
  return {
    at: at.toISOString(),
    level,
    step: oneLine(step),
    message: oneLine(message),
  };
}

export function renderSetupLog(
  entries: readonly SetupLogEntry[],
  releaseId: string,
): string {
  const lines = [
    "UCSBXRP setup log",
    `Course release: ${releaseId || "loading"}`,
    "",
    ...entries.map(
      (entry) =>
        `[${entry.at}] ${entry.level.toUpperCase()} ${entry.step}: ${entry.message}`,
    ),
  ];
  return `${lines.join("\n")}\n`;
}

export async function saveSetupLog(
  root: CourseDirectoryHandle,
  entries: readonly SetupLogEntry[],
  releaseId: string,
): Promise<void> {
  const content = renderSetupLog(entries, releaseId);
  await withCourseFolderWriteLock("setup", () =>
    writeCourseTextFile(root, setupLogPath, content),
  );
}

export async function verifySetupLogFolder(
  root: CourseDirectoryHandle,
  entries: readonly SetupLogEntry[],
  releaseId: string,
): Promise<void> {
  const expected = renderSetupLog(entries, releaseId);
  await withCourseFolderWriteLock("setup", async () => {
    await writeCourseTextFile(root, setupLogPath, expected);
    const actual = await readCourseTextFile(root, setupLogPath);
    if (actual !== expected) {
      throw new Error(
        "The selected folder did not return the setup log after it was written.",
      );
    }
  });
}
