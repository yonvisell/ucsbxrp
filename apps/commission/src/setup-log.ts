import {
  readCourseTextFile,
  type CourseDirectoryHandle,
} from "../../shared/course-folder";
import {
  diagnosticLogFileName,
  type DiagnosticLogEvent,
  type DiagnosticLogWriter,
} from "../../shared/diagnostic-log";

export type SetupLogLevel = "info" | "success" | "warning" | "error";

export interface SetupLogEntry {
  at: string;
  level: SetupLogLevel;
  step: string;
  message: string;
}

export interface SetupDiagnosticRecord {
  entry: SetupLogEntry;
  eventId: string;
}

export interface SetupSessionStartDetails {
  build: string;
  courseRelease: string;
  browser: string;
  operatingSystem: string;
  capabilities: readonly string[];
}

function oneLine(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function setupEventName(step: string): string {
  if (step.toLocaleLowerCase() === "session start") return "session.start";
  const suffix = step
    .toLocaleLowerCase()
    .replace(/[^a-z0-9]+/g, ".")
    .replace(/^\.+|\.+$/g, "");
  return suffix ? `setup.${suffix}` : "setup.event";
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

export function setupSessionStartMessage(
  details: SetupSessionStartDetails,
): string {
  return oneLine(
    `Build: ${details.build}; course: ${details.courseRelease}; browser: ${details.browser}; OS: ${details.operatingSystem}; capabilities: ${details.capabilities.join(", ")}.`,
  );
}

export function setupDiagnosticEvent(
  record: SetupDiagnosticRecord,
): DiagnosticLogEvent {
  const { entry, eventId } = record;
  return {
    event: setupEventName(entry.step),
    eventId,
    level:
      entry.level === "success"
        ? "info"
        : entry.level === "warning" || entry.level === "error"
          ? entry.level
          : "info",
    message: `[${entry.at}] ${entry.level.toUpperCase()} ${entry.step}: ${entry.message}`,
    terminal: entry.level === "error",
  };
}

/**
 * Attach the Working folder, append this setup attempt to the shared
 * diagnostic log, and confirm that the new root-level record can be read back.
 */
export async function verifySetupDiagnosticFolder(
  writer: DiagnosticLogWriter,
  root: CourseDirectoryHandle,
  records: readonly SetupDiagnosticRecord[],
  verificationEventId: string,
): Promise<void> {
  writer.attachWorkingFolder(root);
  try {
    for (const record of records) writer.record(setupDiagnosticEvent(record));
    writer.record({
      event: "setup.folder.write-check",
      eventId: verificationEventId,
      message: `Checking write access to Working folder "${root.name}".`,
      terminal: true,
    });
    await writer.flush();
    const content = await readCourseTextFile(root, diagnosticLogFileName);
    if (!content?.includes(`event_id=${JSON.stringify(verificationEventId)}`)) {
      throw new Error(
        `The selected folder did not return the new ${diagnosticLogFileName} record after it was written.`,
      );
    }
  } catch (error) {
    writer.detachWorkingFolder();
    throw error;
  }
}

/** Render only the current setup attempt for the on-screen view and Copy log. */
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
