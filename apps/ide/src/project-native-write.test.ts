import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import type {
  CourseDirectoryHandle,
  CourseFileHandle,
} from "../../shared/course-folder";
import { withProjectNativeWrite } from "./project-native-write";

/** File handles model buffered native writes: only close commits bytes. */
class NativeFolder implements CourseDirectoryHandle {
  readonly kind = "directory" as const;
  readonly name = "Project";
  readonly files = new Map<string, string>();
  held = false;
  onWrite?: (path: string, content: string) => void;
  modes: Array<string | undefined> = [];
  async *entries(): AsyncIterableIterator<[string, CourseFileHandle]> {
    for (const name of this.files.keys())
      yield [name, await this.getFileHandle(name)];
  }
  async getDirectoryHandle(): Promise<CourseDirectoryHandle> {
    throw new DOMException("Missing", "NotFoundError");
  }
  async removeEntry(name: string) {
    this.files.delete(name);
  }
  async getFileHandle(
    name: string,
    options?: { create?: boolean },
  ): Promise<CourseFileHandle> {
    if (!options?.create && !this.files.has(name))
      throw new DOMException("Missing", "NotFoundError");
    if (!this.files.has(name)) this.files.set(name, "");
    return {
      kind: "file",
      name,
      getFile: async () =>
        ({
          size: this.files.get(name)!.length,
          text: async () => this.files.get(name)!,
        }) as File,
      createWritable: async (options) => {
        let lock = false;
        if (name === ".ucsb-xrp-write-lock") {
          this.modes.push(options?.mode);
          if (this.held)
            throw new DOMException(
              "Writer present",
              "NoModificationAllowedError",
            );
          this.held = true;
          lock = true;
        }
        let pending = "";
        return {
          write: async (value) => {
            pending = String(value);
            this.onWrite?.(name, pending);
          },
          close: async () => {
            this.files.set(name, pending);
            if (lock) this.held = false;
          },
          abort: async () => {
            if (lock) this.held = false;
          },
        };
      },
    };
  }
}
beforeEach(() => {
  vi.stubGlobal("navigator", {});
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe("native project write admission", () => {
  it("requests exclusive mode and refuses a competing writer without a siloed retry", async () => {
    const folder = new NativeFolder();
    let release!: () => void;
    const first = withProjectNativeWrite(folder, "P", async () => {
      await new Promise<void>((resolve) => {
        release = resolve;
      });
    });
    await vi.waitFor(() => expect(release).toBeTypeOf("function"));
    const secondOperation = vi.fn();
    await expect(
      withProjectNativeWrite(folder, "P", secondOperation),
    ).rejects.toThrow("Another page or program");
    expect(secondOperation).not.toHaveBeenCalled();
    expect(folder.modes).toEqual(["exclusive", "exclusive"]);
    release();
    await first;
    expect(folder.held).toBe(false);
  });
  it("keeps both live and old foreign browser records blocked until explicit recovery", async () => {
    const folder = new NativeFolder();
    folder.files.set(
      ".ucsb-xrp-writer.json",
      JSON.stringify({
        owner: "other-browser",
        expiresAt: Date.now() + 30_000,
      }),
    );
    const { inspectProjectWriters, releaseSelectedProjectWriters } =
      await import("./project-writer-admission");
    const records = await inspectProjectWriters(folder);
    expect(records).toHaveLength(1);
    await releaseSelectedProjectWriters(folder, records);
    await expect(
      withProjectNativeWrite(folder, "P", async () => {
        throw new Error("Source write failed");
      }),
    ).rejects.toThrow("Source write failed");
    expect(folder.held).toBe(false);
    expect(await inspectProjectWriters(folder)).toEqual([]);
  });
  it("bounds a queued same-origin writer wait without running its operation", async () => {
    vi.useFakeTimers();
    vi.stubGlobal("navigator", {
      locks: {
        request: (_name: string, options: { signal: AbortSignal }) =>
          new Promise((_resolve, reject) => {
            options.signal.addEventListener("abort", () =>
              reject(new DOMException("Aborted", "AbortError")),
            );
          }),
      },
    });
    const operation = vi.fn();
    const result = withProjectNativeWrite(new NativeFolder(), "P", operation);
    const rejection = expect(result).rejects.toThrow(
      "still being saved in another page",
    );
    await vi.advanceTimersByTimeAsync(2_001);
    await rejection;
    expect(operation).not.toHaveBeenCalled();
  });
});

it("aborts a buffered source close after its writer ticket is recovered in another browser", async () => {
  const { writeProjectFolder, saveProjectFolderWithAutosave } =
    await import("./project-files");
  const folder = new NativeFolder();
  const original = {
    name: "Project",
    entrypoint: "main.py",
    files: { "main.py": "print('original')\n" },
  };
  await writeProjectFolder(folder, original);
  const backups = new NativeFolder();
  folder.getDirectoryHandle = async () => backups;
  folder.onWrite = (path) => {
    if (path === "main.py")
      for (const key of folder.files.keys())
        if (key.startsWith(".ucsb-xrp-writer-")) folder.files.delete(key);
  };
  await expect(
    saveProjectFolderWithAutosave(folder, {
      ...original,
      files: { "main.py": "print('new')\n" },
    }),
  ).rejects.toThrow("cancelled or recovered");
  expect(folder.files.get("main.py")).toBe("print('original')\n");
  const marker = JSON.parse(folder.files.get(".ucsb-xrp-commit.json")!);
  expect(marker.previous.files["main.py"]).toBe("print('original')\n");
  expect(marker.intended.files["main.py"]).toBe("print('new')\n");
});

it("compares buffered source with disk immediately before close and retains the observed external version", async () => {
  const {
    writeProjectFolder,
    saveProjectFolderWithAutosave,
    ProjectFolderConflictError,
  } = await import("./project-files");
  const folder = new NativeFolder();
  const original = {
    name: "Project",
    entrypoint: "main.py",
    files: { "helper.py": "HELPER = 1\n", "main.py": "print('original')\n" },
  };
  await writeProjectFolder(folder, original);
  const backups = new NativeFolder();
  folder.getDirectoryHandle = async () => backups;
  folder.onWrite = (path) => {
    if (path === "main.py")
      folder.files.set(path, "print('external editor')\n");
  };
  await expect(
    saveProjectFolderWithAutosave(folder, {
      ...original,
      files: { "helper.py": "HELPER = 2\n", "main.py": "print('IDE edit')\n" },
    }),
  ).rejects.toBeInstanceOf(ProjectFolderConflictError);
  expect(folder.files.get("main.py")).toBe("print('external editor')\n");
  const marker = JSON.parse(folder.files.get(".ucsb-xrp-commit.json")!);
  expect(marker.previous.files).toEqual(original.files);
  expect(marker.intended.files["main.py"]).toBe("print('IDE edit')\n");
  expect(marker.observed.files).toEqual({
    "helper.py": "HELPER = 2\n",
    "main.py": "print('external editor')\n",
  });
});

it("retains external metadata edits made while the metadata stream was buffered", async () => {
  const {
    writeProjectFolder,
    saveProjectFolderWithAutosave,
    ProjectFolderConflictError,
  } = await import("./project-files");
  const folder = new NativeFolder();
  const original = {
    name: "Project",
    entrypoint: "main.py",
    files: { "main.py": "print('original')\n" },
  };
  await writeProjectFolder(folder, original);
  const backups = new NativeFolder();
  folder.getDirectoryHandle = async () => backups;
  folder.onWrite = (path) => {
    if (path !== ".ucsb-xrp-project.json") return;
    const metadata = JSON.parse(folder.files.get(path)!);
    folder.files.set(
      path,
      JSON.stringify({
        ...metadata,
        name: "Renamed externally",
        externalNote: "retain exact native metadata",
      }),
    );
  };
  await expect(
    saveProjectFolderWithAutosave(folder, {
      ...original,
      files: { "main.py": "print('IDE edit')\n" },
    }),
  ).rejects.toBeInstanceOf(ProjectFolderConflictError);
  expect(JSON.parse(folder.files.get(".ucsb-xrp-project.json")!)).toMatchObject(
    {
      name: "Renamed externally",
      externalNote: "retain exact native metadata",
    },
  );
  const marker = JSON.parse(folder.files.get(".ucsb-xrp-commit.json")!);
  expect(marker.observed.name).toBe("Renamed externally");
  expect(marker.observed.files["main.py"]).toBe("print('IDE edit')\n");
  expect(marker.previous.files["main.py"]).toBe("print('original')\n");
});
