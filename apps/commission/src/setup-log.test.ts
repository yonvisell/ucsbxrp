import { describe, expect, it } from "vitest";

import { type CourseDirectoryHandle } from "../../shared/course-folder";
import {
  createSetupLogEntry,
  renderSetupLog,
  setupLogPath,
  verifySetupLogFolder,
} from "./setup-log";

class MemoryFileHandle {
  readonly kind = "file" as const;

  constructor(
    readonly name: string,
    private readonly path: string,
    private readonly files: Map<string, string>,
  ) {}

  async getFile(): Promise<File> {
    const content = this.files.get(this.path) ?? "";
    return { text: async () => content } as File;
  }

  async createWritable() {
    return {
      write: async (content: string) => {
        this.files.set(this.path, content);
      },
      close: async () => undefined,
    };
  }
}

class MemoryDirectoryHandle implements CourseDirectoryHandle {
  readonly kind = "directory" as const;

  constructor(
    readonly name: string,
    private readonly files: Map<string, string>,
    private readonly prefix = "",
  ) {}

  async *entries(): AsyncIterableIterator<
    [string, MemoryFileHandle | MemoryDirectoryHandle]
  > {}

  async getDirectoryHandle(name: string, options?: { create?: boolean }) {
    const prefix = `${this.prefix}${name}/`;
    if (
      !options?.create &&
      ![...this.files.keys()].some((path) => path.startsWith(prefix))
    ) {
      throw new DOMException("Directory not found", "NotFoundError");
    }
    return new MemoryDirectoryHandle(name, this.files, prefix);
  }

  async getFileHandle(name: string, options?: { create?: boolean }) {
    const path = `${this.prefix}${name}`;
    if (!options?.create && !this.files.has(path)) {
      throw new DOMException("File not found", "NotFoundError");
    }
    return new MemoryFileHandle(name, path, this.files);
  }

  async removeEntry(name: string) {
    this.files.delete(`${this.prefix}${name}`);
  }
}

describe("commissioning setup log", () => {
  it("writes and reads back the student-visible log", async () => {
    const files = new Map<string, string>();
    const root = new MemoryDirectoryHandle("XRP course", files);
    const entries = [
      createSetupLogEntry(
        "Folder",
        "Write access verified",
        "success",
        new Date("2026-08-07T12:00:00.000Z"),
      ),
    ];

    await verifySetupLogFolder(root, entries, "2026.08-dev.8");

    expect(files.get(setupLogPath)).toBe(
      renderSetupLog(entries, "2026.08-dev.8"),
    );
  });

  it("keeps each entry on one readable line", () => {
    const entry = createSetupLogEntry(
      "XRP service",
      "No reply\nwithin   three seconds",
      "warning",
      new Date("2026-08-07T12:00:00.000Z"),
    );

    expect(entry.message).toBe("No reply within three seconds");
    expect(renderSetupLog([entry], "test")).toContain(
      "WARNING XRP service: No reply within three seconds",
    );
  });
});
