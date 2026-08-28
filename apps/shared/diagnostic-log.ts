import {
  courseFolderPermission,
  withCourseFolderWriteLock,
  type CourseDirectoryHandle,
  type CourseFileHandle,
} from "./course-folder";

export const diagnosticLogFileName = "UCSBXRP diagnostic log.txt";
export const diagnosticLogMaxBytes = 1024 * 1024;

const retainedLogBytes = 768 * 1024;
const flushDelayMs = 250;
const flushLineCount = 32;
const flushByteCount = 24 * 1024;
const rememberedEventIds = 2048;
const maximumMessageCharacters = 4096;
const textEncoder = new TextEncoder();

export type DiagnosticLogLevel = "info" | "warning" | "error";

export interface DiagnosticLogEvent {
  event: string;
  message: string;
  level?: DiagnosticLogLevel;
  eventId?: string;
  requestId?: string;
  terminal?: boolean;
  replayed?: boolean;
  kind?: "event" | "telemetry-sample";
}

export type DiagnosticLogRecordResult =
  | "queued"
  | "ignored-no-folder"
  | "ignored-replayed"
  | "ignored-duplicate"
  | "ignored-telemetry"
  | "ignored-error-callback";

type TimerHandle = ReturnType<typeof setTimeout>;
type DiagnosticWriteLock = <T>(operation: () => Promise<T>) => Promise<T>;

interface DiagnosticLogDependencies {
  now?: () => Date;
  setTimeout?: (callback: () => void, delayMs: number) => TimerHandle;
  clearTimeout?: (handle: TimerHandle) => void;
  withWriteLock?: DiagnosticWriteLock;
}

export interface DiagnosticLogOptions {
  app: string;
  courseRelease: string;
  sessionId?: string;
  origin?: string;
  onWriteError?: (error: Error) => void;
  dependencies?: DiagnosticLogDependencies;
}

function defaultSessionId(): string {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `session-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

async function defaultWriteLock<T>(operation: () => Promise<T>): Promise<T> {
  if (typeof navigator === "undefined" || !navigator.locks) {
    throw new Error(
      "This browser cannot safely coordinate diagnostic-log writes between the IDE and Monitor because Web Locks are unavailable.",
    );
  }
  return withCourseFolderWriteLock("diagnostic", operation);
}

function bounded(value: string, maximum: number): string {
  if (value.length <= maximum) return value;
  return `${value.slice(0, Math.max(0, maximum - 14))}… [truncated]`;
}

function byteLength(value: string): number {
  return textEncoder.encode(value).byteLength;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

async function abortQuietly(writable: {
  abort?: () => Promise<void>;
}): Promise<void> {
  try {
    await writable.abort?.();
  } catch {
    // Preserve the error that caused the write to fail.
  }
}

/**
 * Writes concise course-tool diagnostics to the currently attached Working
 * folder. The queue and event-ID set are transient; the text file is the only
 * stored diagnostic record.
 */
export class DiagnosticLogWriter {
  private readonly app: string;
  private readonly courseRelease: string;
  private readonly sessionId: string;
  private readonly origin: string;
  private readonly onWriteError?: (error: Error) => void;
  private readonly now: () => Date;
  private readonly setTimer: (
    callback: () => void,
    delayMs: number,
  ) => TimerHandle;
  private readonly clearTimer: (handle: TimerHandle) => void;
  private readonly withWriteLock: DiagnosticWriteLock;

  private folder: CourseDirectoryHandle | null = null;
  private folderGeneration = 0;
  private pendingLines: string[] = [];
  private pendingBytes = 0;
  private flushTimer: TimerHandle | null = null;
  private writeChain: Promise<void> = Promise.resolve();
  private eventIds = new Set<string>();
  private eventIdOrder: string[] = [];
  private notifyingWriteError = false;

  constructor(options: DiagnosticLogOptions) {
    this.app = bounded(options.app, 80);
    this.courseRelease = bounded(options.courseRelease, 80);
    this.sessionId = bounded(options.sessionId ?? defaultSessionId(), 160);
    this.origin = bounded(
      options.origin ??
        (typeof location === "undefined" ? "unknown" : location.origin),
      256,
    );
    this.onWriteError = options.onWriteError;
    this.now = options.dependencies?.now ?? (() => new Date());
    this.setTimer =
      options.dependencies?.setTimeout ??
      ((callback, delayMs) => globalThis.setTimeout(callback, delayMs));
    this.clearTimer =
      options.dependencies?.clearTimeout ??
      ((handle) => globalThis.clearTimeout(handle));
    this.withWriteLock =
      options.dependencies?.withWriteLock ?? defaultWriteLock;
  }

  /** Attach the one Working folder currently authoritative for this app. */
  attachWorkingFolder(folder: CourseDirectoryHandle): void {
    if (this.folder === folder) return;
    this.resetTransientState();
    this.folder = folder;
  }

  /** Stop logging immediately and discard records not yet written. */
  detachWorkingFolder(): void {
    this.resetTransientState();
    this.folder = null;
  }

  record(entry: DiagnosticLogEvent): DiagnosticLogRecordResult {
    if (this.notifyingWriteError) return "ignored-error-callback";
    if (
      entry.kind === "telemetry-sample" ||
      entry.event === "telemetry.sample"
    ) {
      return "ignored-telemetry";
    }
    if (entry.replayed) return "ignored-replayed";
    if (!this.folder) return "ignored-no-folder";

    const eventId = entry.eventId?.trim();
    if (eventId && this.eventIds.has(eventId)) return "ignored-duplicate";

    const line = this.formatLine({ ...entry, eventId });
    this.pendingLines.push(line);
    this.pendingBytes += byteLength(line);
    if (eventId) this.rememberEventId(eventId);

    if (
      entry.terminal ||
      entry.level === "error" ||
      this.pendingLines.length >= flushLineCount ||
      this.pendingBytes >= flushByteCount
    ) {
      void this.flush();
    } else if (this.flushTimer === null) {
      this.flushTimer = this.setTimer(() => {
        this.flushTimer = null;
        void this.flush();
      }, flushDelayMs);
    }
    return "queued";
  }

  /** Write all currently queued records and wait for earlier writes to finish. */
  async flush(): Promise<void> {
    this.cancelFlushTimer();
    if (this.pendingLines.length === 0) {
      await this.writeChain;
      return;
    }

    const folder = this.folder;
    if (!folder) {
      this.pendingLines = [];
      this.pendingBytes = 0;
      await this.writeChain;
      return;
    }

    const content = this.pendingLines.join("");
    const generation = this.folderGeneration;
    this.pendingLines = [];
    this.pendingBytes = 0;

    const operation = this.writeChain.then(() =>
      this.writeBatch(folder, generation, content),
    );
    this.writeChain = operation.catch((error) => {
      this.reportWriteError(
        new Error(
          `Could not write ${diagnosticLogFileName} in Working folder "${folder.name}": ${errorMessage(error)}`,
        ),
      );
    });
    await this.writeChain;
  }

  private resetTransientState(): void {
    this.cancelFlushTimer();
    this.folderGeneration += 1;
    this.pendingLines = [];
    this.pendingBytes = 0;
    this.eventIds = new Set<string>();
    this.eventIdOrder = [];
  }

  private cancelFlushTimer(): void {
    if (this.flushTimer === null) return;
    this.clearTimer(this.flushTimer);
    this.flushTimer = null;
  }

  private rememberEventId(eventId: string): void {
    this.eventIds.add(eventId);
    this.eventIdOrder.push(eventId);
    if (this.eventIdOrder.length <= rememberedEventIds) return;
    const oldest = this.eventIdOrder.shift();
    if (oldest) this.eventIds.delete(oldest);
  }

  private formatLine(entry: DiagnosticLogEvent): string {
    const fields: Array<[string, string]> = [
      ["app", this.app],
      ["event", bounded(entry.event.trim() || "event", 128)],
      ["message", bounded(entry.message, maximumMessageCharacters)],
      ["course", this.courseRelease],
      ["session", this.sessionId],
      ["origin", this.origin],
    ];
    if (entry.eventId) fields.push(["event_id", bounded(entry.eventId, 160)]);
    if (entry.requestId?.trim()) {
      fields.push(["request_id", bounded(entry.requestId.trim(), 160)]);
    }
    const values = fields
      .map(([key, value]) => `${key}=${JSON.stringify(value)}`)
      .join(" ");
    return `[${this.now().toISOString()}] ${(entry.level ?? "info").toUpperCase()} ${values}\n`;
  }

  private isCurrentFolder(
    folder: CourseDirectoryHandle,
    generation: number,
  ): boolean {
    return this.folder === folder && this.folderGeneration === generation;
  }

  private async writeBatch(
    folder: CourseDirectoryHandle,
    generation: number,
    content: string,
  ): Promise<void> {
    if (!this.isCurrentFolder(folder, generation)) return;
    await this.withWriteLock(async () => {
      if (!this.isCurrentFolder(folder, generation)) return;
      const permission = await courseFolderPermission(folder);
      if (permission !== "granted") {
        throw new Error(
          `Write access is ${permission} for Working folder "${folder.name}". Reconnect that Working folder before diagnostic logging continues.`,
        );
      }

      const handle = await folder.getFileHandle(diagnosticLogFileName, {
        create: true,
      });
      const file = await handle.getFile();
      if (file.size + byteLength(content) <= diagnosticLogMaxBytes) {
        await this.append(handle, file.size, content);
        return;
      }
      await this.compactAndWrite(handle, file, content);
    });
  }

  private async append(
    handle: CourseFileHandle,
    position: number,
    content: string,
  ): Promise<void> {
    const writable = await handle.createWritable({ keepExistingData: true });
    try {
      if (!writable.seek) {
        throw new Error(
          "This browser opened the diagnostic file but does not support appending to it.",
        );
      }
      await writable.seek(position);
      await writable.write(content);
      await writable.close();
    } catch (error) {
      await abortQuietly(writable);
      throw error;
    }
  }

  private async compactAndWrite(
    handle: CourseFileHandle,
    file: File,
    incoming: string,
  ): Promise<void> {
    const marker = this.formatLine({
      event: "log.compacted",
      level: "warning",
      message:
        "Earlier diagnostic records were removed after the log reached the 1 MiB size limit.",
    });
    const retainedBudget = Math.max(
      0,
      retainedLogBytes - byteLength(marker) - byteLength(incoming),
    );
    const retained = await this.newestWholeLines(file, retainedBudget);
    const replacement = `${marker}${retained}${incoming}`;
    if (byteLength(replacement) > diagnosticLogMaxBytes) {
      throw new Error(
        "A diagnostic batch was too large to fit within the 1 MiB log limit.",
      );
    }

    const writable = await handle.createWritable();
    try {
      await writable.write(replacement);
      await writable.close();
    } catch (error) {
      await abortQuietly(writable);
      throw error;
    }
  }

  private async newestWholeLines(file: File, budget: number): Promise<string> {
    if (budget <= 0 || file.size === 0) return "";
    const start = Math.max(0, file.size - retainedLogBytes);
    let tail = await file.slice(start).text();
    if (start > 0) {
      const preceding = await file.slice(start - 1, start).text();
      if (preceding !== "\n") {
        const firstBoundary = tail.indexOf("\n");
        tail = firstBoundary < 0 ? "" : tail.slice(firstBoundary + 1);
      }
    }
    if (!tail.endsWith("\n")) {
      const lastBoundary = tail.lastIndexOf("\n");
      tail = lastBoundary < 0 ? "" : tail.slice(0, lastBoundary + 1);
    }

    const lines = tail.split("\n");
    lines.pop();
    const selected: string[] = [];
    let selectedBytes = 0;
    for (let index = lines.length - 1; index >= 0; index -= 1) {
      const line = `${lines[index] ?? ""}\n`;
      const lineBytes = byteLength(line);
      if (selectedBytes + lineBytes > budget) break;
      selected.unshift(line);
      selectedBytes += lineBytes;
    }
    return selected.join("");
  }

  private reportWriteError(error: Error): void {
    if (!this.onWriteError || this.notifyingWriteError) return;
    this.notifyingWriteError = true;
    try {
      this.onWriteError(error);
    } catch {
      // A UI error reporter must not cause another diagnostic-log failure.
    } finally {
      this.notifyingWriteError = false;
    }
  }
}
