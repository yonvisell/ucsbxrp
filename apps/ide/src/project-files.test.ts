import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { STAGE_ONE_PROJECT } from "@ucsb-xrp/target";

import {
  loadRecoveredProject,
  normalizedProjectPath,
  projectPathError,
  readProjectFolder,
  storeRecoveredProject,
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
    expect(recovered.files["main.py"]).toContain("RobotConfig");
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
    expect(recovered.files["main.py"]).toContain("RobotConfig");
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
  ])("rejects an unsafe project path: %s", (path) => {
    expect(projectPathError(path)).not.toBeNull();
  });

  it("normalizes surrounding whitespace and Windows separators", () => {
    expect(normalizedProjectPath("  student\\model.py  ")).toBe(
      "student/model.py",
    );
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
});
