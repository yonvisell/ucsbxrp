import { describe, expect, it } from "vitest";

import {
  autosaveDirectoryName,
  courseFolderPermission,
  loadWorkspaceManifest,
  projectFolderIsInsideCourseFolder,
  updateWorkspaceManifest,
  writeCourseFile,
  writeRotatingTextBundle,
  type CourseDirectoryHandle,
} from "./course-folder";

class MemoryFileHandle {
  readonly kind = "file" as const;

  constructor(
    readonly name: string,
    private readonly path: string,
    private readonly files: Map<string, string | Blob>,
  ) {}

  async getFile(): Promise<File> {
    const stored = this.files.get(this.path) ?? "";
    const content = typeof stored === "string" ? stored : await stored.text();
    return {
      size: new TextEncoder().encode(content).byteLength,
      text: async () => content,
    } as File;
  }

  async createWritable() {
    return {
      write: async (content: string | Blob) => {
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
    readonly files: Map<string, string | Blob>,
    private readonly prefix = "",
  ) {}

  async *entries(): AsyncIterableIterator<
    [string, MemoryFileHandle | MemoryDirectoryHandle]
  > {
    const directories = new Set<string>();
    for (const path of [...this.files.keys()].sort()) {
      if (!path.startsWith(this.prefix)) {
        continue;
      }
      const remainder = path.slice(this.prefix.length);
      const slash = remainder.indexOf("/");
      if (slash < 0) {
        yield [remainder, new MemoryFileHandle(remainder, path, this.files)];
      } else {
        const directory = remainder.slice(0, slash);
        if (!directories.has(directory)) {
          directories.add(directory);
          yield [
            directory,
            new MemoryDirectoryHandle(
              directory,
              this.files,
              `${this.prefix}${directory}/`,
            ),
          ];
        }
      }
    }
  }

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
    const path = `${this.prefix}${name}`;
    if (!this.files.delete(path)) {
      throw new DOMException("File not found", "NotFoundError");
    }
  }

  async isSameEntry(other: CourseDirectoryHandle) {
    return (
      other instanceof MemoryDirectoryHandle &&
      other.files === this.files &&
      other.prefix === this.prefix
    );
  }

  async resolve(
    possibleDescendant: CourseDirectoryHandle,
  ): Promise<string[] | null> {
    if (
      !(possibleDescendant instanceof MemoryDirectoryHandle) ||
      possibleDescendant.files !== this.files ||
      !possibleDescendant.prefix.startsWith(this.prefix)
    ) {
      return null;
    }
    const relative: string = possibleDescendant.prefix.slice(
      this.prefix.length,
    );
    return relative.split("/").filter(Boolean);
  }
}

describe("course-folder autosaves", () => {
  it("rotates four aligned generations before writing the newest bundle", async () => {
    const files = new Map<string, string | Blob>();
    for (let generation = 1; generation <= 4; generation += 1) {
      files.set(
        `${autosaveDirectoryName}/run-${generation}.txt`,
        `output-${generation}`,
      );
      files.set(
        `${autosaveDirectoryName}/telemetry-${generation}.csv`,
        `telemetry-${generation}`,
      );
    }
    const root = new MemoryDirectoryHandle("course", files);

    await writeRotatingTextBundle(root, [
      { baseName: "run", extension: "txt", content: "new output" },
      {
        baseName: "telemetry",
        extension: "csv",
        content: "new telemetry",
      },
    ]);

    expect(files.get(`${autosaveDirectoryName}/run-1.txt`)).toBe("new output");
    expect(files.get(`${autosaveDirectoryName}/run-2.txt`)).toBe("output-1");
    expect(files.get(`${autosaveDirectoryName}/run-3.txt`)).toBe("output-2");
    expect(files.get(`${autosaveDirectoryName}/run-4.txt`)).toBe("output-3");
    expect(files.get(`${autosaveDirectoryName}/telemetry-1.csv`)).toBe(
      "new telemetry",
    );
    expect(files.get(`${autosaveDirectoryName}/telemetry-4.csv`)).toBe(
      "telemetry-3",
    );
    expect(files.get(`${autosaveDirectoryName}/README.txt`)).toContain(
      "Generation 1 is newest",
    );
  });

  it("treats simple test and compatibility handles as already granted", async () => {
    const root = new MemoryDirectoryHandle("course", new Map());
    await expect(courseFolderPermission(root)).resolves.toBe("granted");
  });

  it("writes binary exports into a nested project folder", async () => {
    const files = new Map<string, string | Blob>();
    const root = new MemoryDirectoryHandle("course", files);
    const video = new Blob(["webm-data"], { type: "video/webm" });

    await writeCourseFile(root, "exports/world.webm", video);

    const stored = files.get("exports/world.webm");
    expect(stored).toBeInstanceOf(Blob);
    await expect((stored as Blob).text()).resolves.toBe("webm-data");
  });

  it("distinguishes projects inside a course folder from legacy cross-root handles", async () => {
    const courseFiles = new Map<string, string | Blob>([
      ["Project/main.py", "print('inside')\n"],
      ["Group/Nested/main.py", "print('nested')\n"],
    ]);
    const course = new MemoryDirectoryHandle("course", courseFiles);
    const project = await course.getDirectoryHandle("Project");
    const group = await course.getDirectoryHandle("Group");
    const nestedProject = await group.getDirectoryHandle("Nested");
    const unrelated = new MemoryDirectoryHandle(
      "Project",
      new Map([["main.py", "print('outside')\n"]]),
    );

    await expect(
      projectFolderIsInsideCourseFolder(course, project),
    ).resolves.toBe(true);
    await expect(
      projectFolderIsInsideCourseFolder(course, nestedProject),
    ).resolves.toBe(true);
    await expect(
      projectFolderIsInsideCourseFolder(course, unrelated),
    ).resolves.toBe(false);
    await expect(
      projectFolderIsInsideCourseFolder(course, course),
    ).resolves.toBe(false);
  });

  it("keeps active Project and robot settings in one Working-folder file", async () => {
    const files = new Map<string, string | Blob>();
    const workspace = new MemoryDirectoryHandle("XRP Work", files);

    await expect(
      updateWorkspaceManifest(workspace, { activeProject: "Spiral" }),
    ).resolves.toBe(true);
    await expect(
      updateWorkspaceManifest(workspace, {
        robot: {
          id: "robot-a",
          name: "ucsb-xrp-visell",
          networkMode: "station",
          ssid: "Pink",
          address: "192.168.7.25",
        },
      }),
    ).resolves.toBe(true);

    await expect(loadWorkspaceManifest(workspace)).resolves.toEqual({
      schemaVersion: 1,
      activeProject: "Spiral",
      robot: {
        id: "robot-a",
        name: "ucsb-xrp-visell",
        networkMode: "station",
        ssid: "Pink",
        address: "192.168.7.25",
      },
    });
  });
});
