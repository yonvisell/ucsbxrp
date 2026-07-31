import { describe, expect, it } from "vitest";

import { normalizeProjectPath, prepareProject } from "./project-validation";

describe("course project validation", () => {
  it("normalizes separators and rejects ambiguous or escaping paths", () => {
    expect(normalizeProjectPath("/src\\main.py")).toBe("src/main.py");
    expect(() => normalizeProjectPath("src/../main.py")).toThrow(
      "Invalid project path",
    );
    expect(() => normalizeProjectPath("src//main.py")).toThrow(
      "Invalid project path",
    );
    expect(() => normalizeProjectPath("./main.py")).toThrow(
      "Invalid project path",
    );
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
  });

  it("requires an existing Python entry point", () => {
    expect(() =>
      prepareProject({ entrypoint: "README.md", files: { "README.md": "x" } }),
    ).toThrow("must be a Python");
    expect(() =>
      prepareProject({ entrypoint: "main.py", files: { "other.py": "x" } }),
    ).toThrow("does not exist");
  });

  it("rejects paths that collide after normalization", () => {
    expect(() =>
      prepareProject({
        entrypoint: "main.py",
        files: { "main.py": "x", "/main.py": "y" },
      }),
    ).toThrow("Duplicate normalized");
  });
});
