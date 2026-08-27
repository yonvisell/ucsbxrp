import { describe, expect, it } from "vitest";

import {
  MAX_PORTABLE_FILE_BYTES,
  MAX_PORTABLE_PROJECT_BYTES,
  MAX_PORTABLE_PROJECT_FILES,
  MAX_PORTABLE_PROJECT_PATH_CHARACTERS,
  normalizeProjectPath,
  prepareProject,
  validatePortableProject,
} from "./project-validation";

describe("course project validation", () => {
  it("normalizes separators and rejects ambiguous or escaping paths", () => {
    expect(normalizeProjectPath("/src\\main.py")).toBe("src/main.py");
    expect(() => normalizeProjectPath("src/../main.py")).toThrow(
      "without empty, '.' or '..' sections",
    );
    expect(() => normalizeProjectPath("src//main.py")).toThrow(
      "without empty, '.' or '..' sections",
    );
    expect(() => normalizeProjectPath("./main.py")).toThrow(
      "without empty, '.' or '..' sections",
    );
    expect(normalizeProjectPath("/src/main.py/")).toBe("src/main.py");
  });

  it("selects only Python files for compilation", () => {
    const prepared = prepareProject({
      entrypoint: "main.py",
      files: {
        "main.py": "print('ready')",
        "student/controller.py": "VALUE = 1",
        "README.md": "# Notes",
        "config.json": "{}",
      },
    });

    expect(prepared.pythonPaths).toEqual(["main.py", "student/controller.py"]);
    expect(prepared.files).toHaveLength(4);
    expect(prepared.totalBytes).toBe(32);
  });

  it("requires an existing Python entry point", () => {
    expect(() =>
      prepareProject({ entrypoint: "README.md", files: { "README.md": "x" } }),
    ).toThrow("must be a Python");
    expect(() =>
      prepareProject({ entrypoint: "main.py", files: { "other.py": "x" } }),
    ).toThrow("is not in the project");
  });

  it("rejects paths that collide after normalization", () => {
    expect(() =>
      prepareProject({
        entrypoint: "main.py",
        files: { "main.py": "x", "/main.py": "y" },
      }),
    ).toThrow("Two project files resolve");
  });

  it("matches the RP2350 project-size limits", () => {
    expect(MAX_PORTABLE_PROJECT_FILES).toBe(48);
    expect(MAX_PORTABLE_PROJECT_BYTES).toBe(256 * 1024);
    expect(MAX_PORTABLE_FILE_BYTES).toBe(96 * 1024);

    const maximumFileProject = validatePortableProject({
      entrypoint: "main.py",
      files: { "main.py": "x".repeat(MAX_PORTABLE_FILE_BYTES) },
    });
    expect(maximumFileProject.totalBytes).toBe(MAX_PORTABLE_FILE_BYTES);

    const tooManyFiles = Object.fromEntries([
      ["main.py", "pass\n"],
      ...Array.from({ length: MAX_PORTABLE_PROJECT_FILES }, (_, index) => [
        `notes_${index}.txt`,
        "",
      ]),
    ]);
    expect(() =>
      validatePortableProject({ entrypoint: "main.py", files: tooManyFiles }),
    ).toThrow("49 files; an XRP project may contain at most 48");

    expect(() =>
      validatePortableProject({
        entrypoint: "main.py",
        files: {
          "main.py": "x".repeat(MAX_PORTABLE_FILE_BYTES + 1),
        },
      }),
    ).toThrow("each XRP project file may use at most 98,304 bytes");

    expect(() =>
      validatePortableProject({
        entrypoint: "main.py",
        files: {
          "main.py": "x".repeat(90 * 1024),
          "part_a.txt": "x".repeat(90 * 1024),
          "part_b.txt": "x".repeat(90 * 1024),
        },
      }),
    ).toThrow("an XRP project may use at most 262,144 bytes");
  });

  it("matches the RP2350 project-path rules", () => {
    const longestPath = `${"a".repeat(
      MAX_PORTABLE_PROJECT_PATH_CHARACTERS - 3,
    )}.py`;
    expect(
      validatePortableProject({
        entrypoint: longestPath,
        files: { [longestPath]: "pass\n" },
      }).entrypoint,
    ).toBe(longestPath);

    const tooLongPath = `a${longestPath}`;
    expect(() =>
      validatePortableProject({
        entrypoint: tooLongPath,
        files: { [tooLongPath]: "pass\n" },
      }),
    ).toThrow("may use at most 160");

    expect(() =>
      validatePortableProject({
        entrypoint: "maín.py",
        files: { "maín.py": "pass\n" },
      }),
    ).toThrow("character the XRP cannot store");
  });
});
