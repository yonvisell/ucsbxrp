import { afterEach, describe, expect, it, vi } from "vitest";

import {
  DiagnosticLogWriter,
  diagnosticLogFileName,
  diagnosticLogMaxBytes,
} from "./diagnostic-log";
import type { CourseDirectoryHandle, CourseFileHandle } from "./course-folder";

const encoder = new TextEncoder();
const decoder = new TextDecoder();

class MemoryFileHandle implements CourseFileHandle {
  readonly kind = "file" as const;
  readonly writableOptions: Array<{ keepExistingData?: boolean } | undefined> =
    [];
  readonly seekPositions: number[] = [];
  abortCount = 0;
  failNextWrite = false;
  failNextClose = false;

  constructor(
    readonly name: string,
    private readonly files: Map<string, string>,
  ) {}

  async getFile(): Promise<File> {
    return new Blob([this.files.get(this.name) ?? ""], {
      type: "text/plain",
    }) as File;
  }

  async createWritable(options?: { keepExistingData?: boolean }) {
    this.writableOptions.push(options);
    let draft = options?.keepExistingData
      ? encoder.encode(this.files.get(this.name) ?? "")
      : new Uint8Array();
    let position = 0;
    let aborted = false;
    return {
      seek: async (nextPosition: number) => {
        this.seekPositions.push(nextPosition);
        position = nextPosition;
      },
      write: async (data: string | Blob) => {
        if (this.failNextWrite) {
          this.failNextWrite = false;
          throw new Error("simulated write failure");
        }
        const bytes =
          typeof data === "string"
            ? encoder.encode(data)
            : new Uint8Array(await data.arrayBuffer());
        const next = new Uint8Array(
          Math.max(draft.byteLength, position + bytes.byteLength),
        );
        next.set(draft);
        next.set(bytes, position);
        draft = next;
        position += bytes.byteLength;
      },
      abort: async () => {
        aborted = true;
        this.abortCount += 1;
      },
      close: async () => {
        if (this.failNextClose) {
          this.failNextClose = false;
          throw new Error("simulated close failure");
        }
        if (!aborted) this.files.set(this.name, decoder.decode(draft));
      },
    };
  }
}

class MemoryDirectoryHandle implements CourseDirectoryHandle {
  readonly kind = "directory" as const;
  permission: PermissionState = "granted";
  readonly requestedFiles: string[] = [];
  private readonly handles = new Map<string, MemoryFileHandle>();

  constructor(
    readonly name: string,
    readonly files = new Map<string, string>(),
  ) {}

  async *entries(): AsyncIterableIterator<
    [string, CourseFileHandle | CourseDirectoryHandle]
  > {
    for (const name of this.files.keys()) {
      yield [name, await this.getFileHandle(name)];
    }
  }

  async getDirectoryHandle(): Promise<CourseDirectoryHandle> {
    throw new DOMException("Directory not found", "NotFoundError");
  }

  async getFileHandle(
    name: string,
    options?: { create?: boolean },
  ): Promise<MemoryFileHandle> {
    this.requestedFiles.push(name);
    if (!this.files.has(name)) {
      if (!options?.create) {
        throw new DOMException("File not found", "NotFoundError");
      }
      this.files.set(name, "");
    }
    let handle = this.handles.get(name);
    if (!handle) {
      handle = new MemoryFileHandle(name, this.files);
      this.handles.set(name, handle);
    }
    return handle;
  }

  async removeEntry(name: string): Promise<void> {
    if (!this.files.delete(name)) {
      throw new DOMException("File not found", "NotFoundError");
    }
    this.handles.delete(name);
  }

  async queryPermission(): Promise<PermissionState> {
    return this.permission;
  }

  fileHandle(name = diagnosticLogFileName): MemoryFileHandle {
    const handle = this.handles.get(name);
    if (!handle) throw new Error(`${name} has not been opened`);
    return handle;
  }
}

function serializedLock(): <T>(operation: () => Promise<T>) => Promise<T> {
  let tail: Promise<unknown> = Promise.resolve();
  return <T>(operation: () => Promise<T>): Promise<T> => {
    const current = tail.then(operation);
    tail = current.catch(() => undefined);
    return current;
  };
}

function writer(
  folder: CourseDirectoryHandle,
  options: {
    app?: string;
    sessionId?: string;
    onWriteError?: (error: Error) => void;
    lock?: ReturnType<typeof serializedLock>;
  } = {},
): DiagnosticLogWriter {
  const result = new DiagnosticLogWriter({
    app: options.app ?? "IDE",
    courseRelease: "2026.08-dev.test",
    sessionId: options.sessionId ?? "session-test",
    origin: "https://example.test",
    onWriteError: options.onWriteError,
    dependencies: {
      now: () => new Date("2026-08-28T12:34:56.000Z"),
      withWriteLock: options.lock ?? serializedLock(),
    },
  });
  result.attachWorkingFolder(folder);
  return result;
}

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("DiagnosticLogWriter", () => {
  it("appends one readable structured line to the root diagnostic file", async () => {
    const folder = new MemoryDirectoryHandle(
      "XRP Work",
      new Map([[diagnosticLogFileName, "existing record\n"]]),
    );
    const log = writer(folder);

    expect(
      log.record({
        event: "run.start",
        message: "First line\nsecond line",
        eventId: "event-1",
        requestId: "request-1",
        terminal: true,
      }),
    ).toBe("queued");
    await log.flush();

    const content = folder.files.get(diagnosticLogFileName) ?? "";
    expect(content).toMatch(/^existing record\n\[2026-08-28T12:34:56.000Z\]/);
    expect(content).toContain('INFO app="IDE" event="run.start"');
    expect(content).toContain('message="First line\\nsecond line"');
    expect(content).toContain('course="2026.08-dev.test"');
    expect(content).toContain('session="session-test"');
    expect(content).toContain('origin="https://example.test"');
    expect(content).toContain('event_id="event-1" request_id="request-1"');
    expect(content.split("\n")).toHaveLength(3);
    expect(folder.requestedFiles).toEqual([diagnosticLogFileName]);
    expect(folder.fileHandle().writableOptions).toEqual([
      { keepExistingData: true },
    ]);
    expect(folder.fileHandle().seekPositions).toEqual([
      encoder.encode("existing record\n").byteLength,
    ]);
  });

  it("batches routine records for 250 ms and immediately flushes errors", async () => {
    vi.useFakeTimers();
    const folder = new MemoryDirectoryHandle("XRP Work");
    const log = writer(folder);

    log.record({ event: "project.open", message: "Project opened" });
    await vi.advanceTimersByTimeAsync(249);
    expect(folder.files.has(diagnosticLogFileName)).toBe(false);

    await vi.advanceTimersByTimeAsync(1);
    await log.flush();
    expect(folder.files.get(diagnosticLogFileName)).toContain(
      'event="project.open"',
    );

    log.record({
      event: "run.failed",
      message: "Program stopped",
      level: "error",
    });
    await log.flush();
    expect(folder.files.get(diagnosticLogFileName)).toContain(
      'ERROR app="IDE" event="run.failed"',
    );
  });

  it("serializes writers and declines duplicate, replayed, and sample events", async () => {
    const folder = new MemoryDirectoryHandle("XRP Work");
    const lock = serializedLock();
    const ide = writer(folder, { app: "IDE", sessionId: "ide", lock });
    const monitor = writer(folder, {
      app: "Monitor",
      sessionId: "monitor",
      lock,
    });

    expect(
      ide.record({ event: "run.start", message: "Started", eventId: "a" }),
    ).toBe("queued");
    expect(
      ide.record({ event: "run.start", message: "Duplicate", eventId: "a" }),
    ).toBe("ignored-duplicate");
    expect(
      monitor.record({
        event: "run.start",
        message: "Replayed",
        eventId: "a",
        replayed: true,
      }),
    ).toBe("ignored-replayed");
    expect(
      monitor.record({
        event: "telemetry.sample",
        message: "Do not log sample data",
        kind: "telemetry-sample",
      }),
    ).toBe("ignored-telemetry");
    expect(monitor.record({ event: "monitor.open", message: "Opened" })).toBe(
      "queued",
    );

    await Promise.all([ide.flush(), monitor.flush()]);
    const content = folder.files.get(diagnosticLogFileName) ?? "";
    expect(content).toContain('app="IDE" event="run.start"');
    expect(content).toContain('app="Monitor" event="monitor.open"');
    expect(content).not.toContain("Duplicate");
    expect(content).not.toContain("Replayed");
    expect(content).not.toContain("Do not log sample data");
  });

  it("uses the dedicated cross-tab Web Lock in the browser", async () => {
    const request = vi.fn(
      async <T>(_name: string, operation: () => Promise<T>): Promise<T> =>
        operation(),
    );
    vi.stubGlobal("navigator", { locks: { request } });
    const folder = new MemoryDirectoryHandle("XRP Work");
    const log = new DiagnosticLogWriter({
      app: "IDE",
      courseRelease: "2026.08-dev.test",
      sessionId: "session-test",
      origin: "https://example.test",
    });
    log.attachWorkingFolder(folder);

    log.record({
      event: "project.open",
      message: "Project opened",
      terminal: true,
    });
    await log.flush();

    expect(request).toHaveBeenCalledWith(
      "ucsb-xrp-diagnostic-folder-write",
      expect.any(Function),
    );
  });

  it("compacts an oversized file to complete newest lines plus a clear marker", async () => {
    const oldLines: string[] = [];
    let oldBytes = 0;
    for (let index = 0; oldBytes <= 1_100_000; index += 1) {
      const line = `[old-${index.toString().padStart(5, "0")}] ${"x".repeat(112)}\n`;
      oldLines.push(line);
      oldBytes += byteLengthForTest(line);
    }
    const oldest = oldLines[0] ?? "";
    const newest = oldLines.at(-1) ?? "";
    const folder = new MemoryDirectoryHandle(
      "XRP Work",
      new Map([[diagnosticLogFileName, oldLines.join("")]]),
    );
    const log = writer(folder);

    log.record({
      event: "run.complete",
      message: "Program completed",
      terminal: true,
    });
    await log.flush();

    const content = folder.files.get(diagnosticLogFileName) ?? "";
    expect(byteLengthForTest(content)).toBeLessThanOrEqual(
      diagnosticLogMaxBytes,
    );
    expect(content).toContain('event="log.compacted"');
    expect(content).toContain("after the log reached the 1 MiB size limit");
    expect(content).not.toContain(oldest.trim());
    expect(content).toContain(newest.trim());
    expect(content).toContain('event="run.complete"');
    expect(content.endsWith("\n")).toBe(true);
    expect(
      content
        .split("\n")
        .filter(Boolean)
        .every((line) => line.startsWith("[")),
    ).toBe(true);
    expect(folder.fileHandle().writableOptions).toEqual([undefined]);
  });

  it("reports a denied folder once without prompting or recursively logging", async () => {
    const folder = new MemoryDirectoryHandle("XRP Work");
    folder.permission = "denied";
    const errors: Error[] = [];
    let callbackRecordResult: string | undefined;
    let log: DiagnosticLogWriter;
    log = writer(folder, {
      onWriteError: (error) => {
        errors.push(error);
        callbackRecordResult = log.record({
          event: "log.failed",
          message: error.message,
        });
      },
    });

    log.record({
      event: "run.failed",
      message: "Program stopped",
      level: "error",
    });
    await log.flush();

    expect(errors).toHaveLength(1);
    expect(errors[0]?.message).toContain("Write access is denied");
    expect(errors[0]?.message).toContain(diagnosticLogFileName);
    expect(callbackRecordResult).toBe("ignored-error-callback");
    expect(folder.requestedFiles).toEqual([]);

    folder.permission = "granted";
    log.record({
      event: "folder.reconnected",
      message: "Working folder reconnected",
      terminal: true,
    });
    await log.flush();
    expect(folder.files.get(diagnosticLogFileName)).toContain(
      'event="folder.reconnected"',
    );
  });

  it("does not replace the existing file when a write fails", async () => {
    const folder = new MemoryDirectoryHandle(
      "XRP Work",
      new Map([[diagnosticLogFileName, "previous record\n"]]),
    );
    const errors: Error[] = [];
    const log = writer(folder, { onWriteError: (error) => errors.push(error) });
    const fileHandle = await folder.getFileHandle(diagnosticLogFileName);
    fileHandle.failNextWrite = true;

    log.record({
      event: "run.failed",
      message: "This write fails",
      level: "error",
    });
    await log.flush();

    expect(folder.files.get(diagnosticLogFileName)).toBe("previous record\n");
    expect(fileHandle.abortCount).toBe(1);
    expect(errors).toHaveLength(1);

    log.record({
      event: "run.retry",
      message: "This write succeeds",
      terminal: true,
    });
    await log.flush();
    expect(folder.files.get(diagnosticLogFileName)).toContain(
      'event="run.retry"',
    );
  });

  it("drops queued records when the authoritative Working folder changes", async () => {
    const first = new MemoryDirectoryHandle("First Work");
    const second = new MemoryDirectoryHandle("Second Work");
    const log = writer(first);

    log.record({ event: "project.open", message: "Belongs to first" });
    log.detachWorkingFolder();
    expect(log.record({ event: "project.open", message: "No folder" })).toBe(
      "ignored-no-folder",
    );
    log.attachWorkingFolder(second);
    log.record({
      event: "project.open",
      message: "Belongs to second",
      terminal: true,
    });
    await log.flush();

    expect(first.files.has(diagnosticLogFileName)).toBe(false);
    expect(second.files.get(diagnosticLogFileName)).toContain(
      "Belongs to second",
    );
    expect(second.files.get(diagnosticLogFileName)).not.toContain(
      "Belongs to first",
    );
  });
});

function byteLengthForTest(value: string): number {
  return encoder.encode(value).byteLength;
}
