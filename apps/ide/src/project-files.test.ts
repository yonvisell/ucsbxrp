import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { STAGE_ONE_PROJECT } from "@ucsb-xrp/target";

import {
  deleteProjectFile,
  duplicateProjectFile,
  loadRecoveredProject,
  normalizedProjectPath,
  projectPathError,
  readProjectFolder,
  removeProjectFolderFiles,
  renameProjectFile,
  setProjectEntrypoint,
  storeRecoveredProject,
  suggestedDuplicatePath,
  writeProjectFolder,
  type CourseDirectoryHandle,
} from "./project-files";

const projectRecoveryKey = "ucsb-xrp-course-project-v1";
const legacyRecoveryKey = "ucsb-xrp-stage-one-main-py";
const originalStageOneStarterSource = `from time import sleep_ms
from ucsb_xrp import MotorEfforts, XRPBot

bot = XRPBot()
print("Virtual XRP ready")

try:
    # Challenge 1 fixed-effort test: -1 reverse, 0 stop, +1 forward.
    test_efforts = MotorEfforts(0.58, 0.52)
    bot.set_efforts(test_efforts)
    print("Applying normalized {}".format(test_efforts))
    sleep_ms(1800)
finally:
    bot.stop()

print("Virtual run complete")
`;
const earlyStageOneStarterSource = `from time import sleep_ms
from ucsb_xrp import MotorEfforts, XRPBot

bot = XRPBot()
print("Virtual XRP ready")

try:
    bot.set_efforts(MotorEfforts(0.58, 0.52))
    print("Driving with left=0.58, right=0.52")
    sleep_ms(1800)
finally:
    bot.stop()

print("Virtual run complete")
`;

class MemoryStorage implements Storage {
  private readonly values = new Map<string, string>();

  get length(): number {
    return this.values.size;
  }

  clear(): void {
    this.values.clear();
  }

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  key(index: number): string | null {
    return [...this.values.keys()][index] ?? null;
  }

  removeItem(key: string): void {
    this.values.delete(key);
  }

  setItem(key: string, value: string): void {
    this.values.set(key, String(value));
  }
}

class ReadonlyFileHandle {
  readonly kind = "file" as const;

  constructor(
    readonly name: string,
    private readonly content: string,
  ) {}

  async getFile(): Promise<File> {
    return {
      size: new TextEncoder().encode(this.content).byteLength,
      text: async () => this.content,
    } as File;
  }

  async createWritable(): Promise<{
    write(data: string): Promise<void>;
    close(): Promise<void>;
  }> {
    throw new Error("read-only test handle");
  }
}

class ReadonlyDirectoryHandle implements CourseDirectoryHandle {
  readonly kind = "directory" as const;

  constructor(
    readonly name: string,
    private readonly children: Array<
      [string, ReadonlyFileHandle | ReadonlyDirectoryHandle]
    >,
  ) {}

  async *entries(): AsyncIterableIterator<
    [string, ReadonlyFileHandle | ReadonlyDirectoryHandle]
  > {
    yield* this.children;
  }

  async getDirectoryHandle(): Promise<CourseDirectoryHandle> {
    throw new Error("read-only test handle");
  }

  async getFileHandle(): Promise<ReadonlyFileHandle> {
    throw new Error("read-only test handle");
  }

  async removeEntry(): Promise<void> {
    throw new Error("read-only test handle");
  }
}

class WritableFileHandle {
  readonly kind = "file" as const;

  constructor(
    readonly name: string,
    private readonly path: string,
    private readonly files: Map<string, string>,
  ) {}

  async getFile(): Promise<File> {
    const content = this.files.get(this.path) ?? "";
    return {
      size: new TextEncoder().encode(content).byteLength,
      text: async () => content,
    } as File;
  }

  async createWritable(): Promise<{
    write(data: string): Promise<void>;
    close(): Promise<void>;
  }> {
    return {
      write: async (data: string) => {
        this.files.set(this.path, data);
      },
      close: async () => undefined,
    };
  }
}

class WritableDirectoryHandle implements CourseDirectoryHandle {
  readonly kind = "directory" as const;

  constructor(
    readonly name: string,
    readonly files: Map<string, string>,
    private readonly prefix = "",
  ) {}

  async *entries(): AsyncIterableIterator<
    [string, WritableFileHandle | WritableDirectoryHandle]
  > {
    const directories = new Set<string>();
    for (const path of [...this.files.keys()].sort()) {
      if (!path.startsWith(this.prefix)) {
        continue;
      }
      const remainder = path.slice(this.prefix.length);
      const slash = remainder.indexOf("/");
      if (slash < 0) {
        yield [remainder, new WritableFileHandle(remainder, path, this.files)];
        continue;
      }
      const directory = remainder.slice(0, slash);
      if (!directories.has(directory)) {
        directories.add(directory);
        yield [
          directory,
          new WritableDirectoryHandle(
            directory,
            this.files,
            `${this.prefix}${directory}/`,
          ),
        ];
      }
    }
  }

  async getDirectoryHandle(
    name: string,
    options?: { create?: boolean },
  ): Promise<CourseDirectoryHandle> {
    const prefix = `${this.prefix}${name}/`;
    if (
      !options?.create &&
      ![...this.files.keys()].some((path) => path.startsWith(prefix))
    ) {
      throw new DOMException("Directory not found", "NotFoundError");
    }
    return new WritableDirectoryHandle(name, this.files, prefix);
  }

  async getFileHandle(
    name: string,
    options?: { create?: boolean },
  ): Promise<WritableFileHandle> {
    const path = `${this.prefix}${name}`;
    if (!options?.create && !this.files.has(path)) {
      throw new DOMException("File not found", "NotFoundError");
    }
    return new WritableFileHandle(name, path, this.files);
  }

  async removeEntry(name: string): Promise<void> {
    const path = `${this.prefix}${name}`;
    if (!this.files.delete(path)) {
      throw new DOMException("File not found", "NotFoundError");
    }
  }
}

describe("project recovery", () => {
  let storage: MemoryStorage;

  beforeEach(() => {
    storage = new MemoryStorage();
    vi.stubGlobal("localStorage", storage);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("migrates only the exact original Stage 1 starter", () => {
    storage.setItem(
      projectRecoveryKey,
      JSON.stringify({
        name: "straight-run-proof",
        entrypoint: "main.py",
        files: {
          "main.py": originalStageOneStarterSource,
          "notes.md": "student notes",
        },
      }),
    );

    const recovered = loadRecoveredProject();

    expect(recovered.files["main.py"]).toBe(STAGE_ONE_PROJECT.files["main.py"]);
    expect(recovered.files["notes.md"]).toBe("student notes");
  });

  it("migrates the exact early generated Stage 1 starter", () => {
    storage.setItem(
      projectRecoveryKey,
      JSON.stringify({
        name: "straight-run-proof",
        entrypoint: "main.py",
        files: { "main.py": earlyStageOneStarterSource },
      }),
    );

    const recovered = loadRecoveredProject();

    expect(recovered.files["main.py"]).toBe(STAGE_ONE_PROJECT.files["main.py"]);
  });

  it("preserves arbitrary user source even when it still calls XRPBot()", () => {
    const userSource = `${originalStageOneStarterSource}\n# Student calibration note\n`;
    storage.setItem(
      projectRecoveryKey,
      JSON.stringify({
        name: "student-project",
        entrypoint: "main.py",
        files: { "main.py": userSource },
      }),
    );

    expect(loadRecoveredProject().files["main.py"]).toBe(userSource);
  });

  it("applies the same exact migration to the legacy single-file key", () => {
    storage.setItem(legacyRecoveryKey, originalStageOneStarterSource);

    expect(loadRecoveredProject().files["main.py"]).toBe(
      STAGE_ONE_PROJECT.files["main.py"],
    );
  });

  it("preserves arbitrary source from the legacy single-file key", () => {
    const userSource = "from ucsb_xrp import XRPBot\n\nbot = XRPBot()\n";
    storage.setItem(legacyRecoveryKey, userSource);

    expect(loadRecoveredProject().files["main.py"]).toBe(userSource);
  });

  it("stores and recovers a valid project without changing user files", () => {
    const project = {
      name: "week-two",
      entrypoint: "run.py",
      files: {
        "run.py": "print('ready')\n",
        "config/robot.json": '{"wheel_mm": 60}\n',
      },
    };

    storeRecoveredProject(project);

    expect(loadRecoveredProject()).toEqual(project);
  });

  it("falls back to the current starter when recovery is malformed", () => {
    storage.setItem(
      projectRecoveryKey,
      JSON.stringify({
        name: "broken",
        entrypoint: "missing.py",
        files: { "main.py": "print('orphan')" },
      }),
    );

    const recovered = loadRecoveredProject();

    expect(recovered.entrypoint).toBe(STAGE_ONE_PROJECT.entrypoint);
    expect(recovered.files).toEqual(STAGE_ONE_PROJECT.files);
  });
});

describe("project paths", () => {
  it.each([
    "main.py",
    "student/sensor_model.py",
    "config/robot.json",
    " spaced name.txt ",
  ])("accepts a valid project-relative path: %s", (path) => {
    expect(projectPathError(path)).toBeNull();
  });

  it.each([
    "",
    "/main.py",
    "folder/",
    "student//model.py",
    "../main.py",
    "student/../main.py",
    "bad:name.py",
    ".ucsb-xrp-project.json",
  ])("rejects an unsafe project path: %s", (path) => {
    expect(projectPathError(path)).not.toBeNull();
  });

  it("normalizes surrounding whitespace and Windows separators", () => {
    expect(normalizedProjectPath("  student\\model.py  ")).toBe(
      "student/model.py",
    );
  });
});

describe("project file operations", () => {
  const project = {
    name: "course-project",
    entrypoint: "main.py",
    files: {
      "main.py": "print('run')\n",
      "student/controller.py": "class Controller:\n    pass\n",
      "notes.md": "measure before tuning\n",
    },
  };

  it("renames a file and updates the startup path when necessary", () => {
    const renamed = renameProjectFile(project, "main.py", "run_course.py");

    expect(renamed.entrypoint).toBe("run_course.py");
    expect(renamed.files["run_course.py"]).toBe("print('run')\n");
    expect(renamed.files).not.toHaveProperty("main.py");
    expect(() => renameProjectFile(project, "main.py", "README.md")).toThrow(
      "startup file must keep a .py extension",
    );
  });

  it("duplicates contents without changing the startup file", () => {
    const duplicated = duplicateProjectFile(
      project,
      "student/controller.py",
      "student/controller_experiment.py",
    );

    expect(duplicated.entrypoint).toBe("main.py");
    expect(duplicated.files["student/controller_experiment.py"]).toBe(
      project.files["student/controller.py"],
    );
  });

  it("selects a Python startup file and rejects non-Python files", () => {
    expect(
      setProjectEntrypoint(project, "student/controller.py").entrypoint,
    ).toBe("student/controller.py");
    expect(() => setProjectEntrypoint(project, "notes.md")).toThrow(
      "Only a Python file",
    );
  });

  it("deletes a file and chooses another Python startup file", () => {
    const deleted = deleteProjectFile(project, "main.py");

    expect(deleted.entrypoint).toBe("student/controller.py");
    expect(deleted.files).not.toHaveProperty("main.py");
  });

  it("protects the only usable startup file", () => {
    const onePythonFile = {
      ...project,
      files: { "main.py": "pass\n", "notes.md": "notes\n" },
    };

    expect(() => deleteProjectFile(onePythonFile, "main.py")).toThrow(
      "Create another Python file",
    );
  });

  it("suggests a unique, legible duplicate path", () => {
    expect(suggestedDuplicatePath("main.py", project.files)).toBe(
      "main_copy.py",
    );
    expect(
      suggestedDuplicatePath("notes", {
        notes: "",
        notes_copy: "",
        notes_copy_2: "",
      }),
    ).toBe("notes_copy_3");
  });
});

describe("working-folder reads", () => {
  it("loads supported nested files, prefers main.py, and counts skipped items", async () => {
    const root = new ReadonlyDirectoryHandle("course-project", [
      ["main.py", new ReadonlyFileHandle("main.py", "print('main')\n")],
      [
        "student",
        new ReadonlyDirectoryHandle("student", [
          [
            "components.py",
            new ReadonlyFileHandle(
              "components.py",
              "class SensorModel:\n    pass\n",
            ),
          ],
          ["diagram.png", new ReadonlyFileHandle("diagram.png", "not text")],
        ]),
      ],
      [
        ".git",
        new ReadonlyDirectoryHandle(".git", [
          ["config", new ReadonlyFileHandle("config", "ignored")],
        ]),
      ],
    ]);

    const result = await readProjectFolder(root);

    expect(result.project).toEqual({
      name: "course-project",
      entrypoint: "main.py",
      files: {
        "main.py": "print('main')\n",
        "student/components.py": "class SensorModel:\n    pass\n",
      },
    });
    expect(result.skipped).toBe(2);
  });

  it("rejects a folder with no supported project files", async () => {
    const root = new ReadonlyDirectoryHandle("images-only", [
      ["robot.png", new ReadonlyFileHandle("robot.png", "binary")],
    ]);

    await expect(readProjectFolder(root)).rejects.toThrow(
      "contains no supported text project files",
    );
  });

  it("persists the startup file and removes only explicitly deleted files", async () => {
    const files = new Map<string, string>([
      ["main.py", "print('old')\n"],
      ["obsolete.py", "print('remove me')\n"],
      ["student/controller.py", "class Old:\n    pass\n"],
    ]);
    const root = new WritableDirectoryHandle("course-project", files);
    const project = {
      name: "course-project",
      entrypoint: "student/controller.py",
      files: {
        "main.py": "print('new')\n",
        "student/controller.py": "class Controller:\n    pass\n",
      },
    };

    await writeProjectFolder(root, project);
    await removeProjectFolderFiles(root, ["obsolete.py", "missing.py"]);

    expect(files.get("main.py")).toBe("print('new')\n");
    expect(files.has("obsolete.py")).toBe(false);
    expect(JSON.parse(files.get(".ucsb-xrp-project.json") ?? "{}")).toEqual({
      entrypoint: "student/controller.py",
    });
    const reopened = await readProjectFolder(root);
    expect(reopened.project).toEqual(project);
    expect(reopened.skipped).toBe(0);
  });
});
