import { describe, expect, it, vi } from "vitest";

import { courseProjectTemplate } from "@ucsb-xrp/target";

import {
  createProjectFolder,
  deleteProjectFile,
  duplicateProjectFile,
  ensureProjectFolder,
  hasProjectFolderMetadata,
  isCourseRepositoryFolder,
  listDirectProjectFolders,
  normalizedProjectPath,
  projectContentDigest,
  projectPathError,
  projectFolderNameError,
  readProjectFolder,
  removeProjectFolderFiles,
  renameProjectFile,
  saveProjectFolderWithAutosave,
  setProjectEntrypoint,
  suggestedDuplicatePath,
  suggestedProjectFolderName,
  writeProjectFolder,
  ProjectFolderConflictError,
  type CourseDirectoryHandle,
} from "./project-files";

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

  async getDirectoryHandle(name: string): Promise<CourseDirectoryHandle> {
    const child = this.children.find(
      ([childName, handle]) =>
        childName === name && handle.kind === "directory",
    )?.[1];
    if (!child || child.kind !== "directory") {
      throw new DOMException("Directory not found", "NotFoundError");
    }
    return child;
  }

  async getFileHandle(name: string): Promise<ReadonlyFileHandle> {
    const child = this.children.find(
      ([childName, handle]) => childName === name && handle.kind === "file",
    )?.[1];
    if (!child || child.kind !== "file") {
      throw new DOMException("File not found", "NotFoundError");
    }
    return child;
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
    "student/./main.py",
    "bad:name.py",
    "student/CON.py",
    "notes./main.py",
    "student/.UCSB-XRP-PROJECT.JSON",
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

  it("renames a file and updates the main-file path when necessary", () => {
    const renamed = renameProjectFile(project, "main.py", "run_course.py");

    expect(renamed.entrypoint).toBe("run_course.py");
    expect(renamed.files["run_course.py"]).toBe("print('run')\n");
    expect(renamed.files).not.toHaveProperty("main.py");
    expect(() => renameProjectFile(project, "main.py", "README.md")).toThrow(
      "main file must keep a .py extension",
    );
  });

  it("duplicates contents without changing the main file", () => {
    const duplicated = duplicateProjectFile(
      project,
      "student/controller.py",
      "student/controller_experiment.py",
    );

    expect(duplicated.entrypoint).toBe("main.py");
    expect(duplicated.files["student/controller_experiment.py"]).toBe(
      project.files["student/controller.py"],
    );
    expect(() => duplicateProjectFile(project, "main.py", "MAIN.py")).toThrow(
      "already uses that path",
    );
  });

  it("selects a Python main file and rejects non-Python files", () => {
    expect(
      setProjectEntrypoint(project, "student/controller.py").entrypoint,
    ).toBe("student/controller.py");
    expect(() => setProjectEntrypoint(project, "notes.md")).toThrow(
      "Only a Python file",
    );
  });

  it("deletes a non-main file without changing the main file", () => {
    const deleted = deleteProjectFile(project, "notes.md");

    expect(deleted.entrypoint).toBe("main.py");
    expect(deleted.files).not.toHaveProperty("notes.md");
  });

  it("requires the student to choose a replacement before deleting main", () => {
    expect(() => deleteProjectFile(project, "main.py")).toThrow(
      "Choose another Python file as main",
    );

    const reassigned = setProjectEntrypoint(project, "student/controller.py");
    const deleted = deleteProjectFile(reassigned, "main.py");
    expect(deleted.entrypoint).toBe("student/controller.py");
    expect(deleted.files).not.toHaveProperty("main.py");
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

describe("project-folder reads", () => {
  it("recognizes only folders with UCSBXRP project metadata", async () => {
    const ordinaryFolder = new WritableDirectoryHandle(
      "repository-root",
      new Map([["unrelated.py", "print('not a project yet')\n"]]),
    );
    const ucsbProject = new WritableDirectoryHandle(
      "course-project",
      new Map([
        ["main.py", "print('project')\n"],
        [".ucsb-xrp-project.json", '{"entrypoint":"main.py"}\n'],
      ]),
    );

    await expect(hasProjectFolderMetadata(ordinaryFolder)).resolves.toBe(false);
    await expect(hasProjectFolderMetadata(ucsbProject)).resolves.toBe(true);

    const malformedProject = new WritableDirectoryHandle(
      "malformed-project",
      new Map([[".ucsb-xrp-project.json", "not json"]]),
    );
    await expect(hasProjectFolderMetadata(malformedProject)).resolves.toBe(
      false,
    );
  });

  it("loads supported files within one identified project and counts skipped items", async () => {
    const root = new ReadonlyDirectoryHandle("course-project", [
      [
        ".ucsb-xrp-project.json",
        new ReadonlyFileHandle(
          ".ucsb-xrp-project.json",
          '{"name":"course-project","entrypoint":"main.py"}\n',
        ),
      ],
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
      [
        ".ucsb-xrp-project.json",
        new ReadonlyFileHandle(
          ".ucsb-xrp-project.json",
          '{"entrypoint":"main.py"}\n',
        ),
      ],
      ["robot.png", new ReadonlyFileHandle("robot.png", "binary")],
    ]);

    await expect(readProjectFolder(root)).rejects.toThrow(
      "contains no supported text project files",
    );
  });

  it("rejects the UCSBXRP development repository as an IDE project", async () => {
    const root = new ReadonlyDirectoryHandle("Coursemobilerobotics", [
      ["AGENTS.md", new ReadonlyFileHandle("AGENTS.md", "instructions")],
      [
        "CODEX_IMPLEMENTATION_PROMPT.md",
        new ReadonlyFileHandle(
          "CODEX_IMPLEMENTATION_PROMPT.md",
          "implementation",
        ),
      ],
      [
        "device_service.py",
        new ReadonlyFileHandle("device_service.py", "print('service')"),
      ],
    ]);

    await expect(readProjectFolder(root)).rejects.toThrow(
      "not the UCSBXRP course software repository",
    );
    await expect(isCourseRepositoryFolder(root)).resolves.toBe(true);
  });

  it("does not reject a student project for one documentation file name", async () => {
    const root = new ReadonlyDirectoryHandle("student-project", [
      [
        ".ucsb-xrp-project.json",
        new ReadonlyFileHandle(
          ".ucsb-xrp-project.json",
          '{"entrypoint":"main.py"}\n',
        ),
      ],
      ["AGENTS.md", new ReadonlyFileHandle("AGENTS.md", "group notes")],
      ["main.py", new ReadonlyFileHandle("main.py", "print('ready')")],
    ]);

    await expect(isCourseRepositoryFolder(root)).resolves.toBe(false);
    await expect(readProjectFolder(root)).resolves.toMatchObject({
      project: {
        entrypoint: "main.py",
        files: { "main.py": "print('ready')" },
      },
    });
  });

  it("rejects project file names that would collide on Windows", async () => {
    const root = new ReadonlyDirectoryHandle("case-collision", [
      [
        ".ucsb-xrp-project.json",
        new ReadonlyFileHandle(
          ".ucsb-xrp-project.json",
          '{"entrypoint":"main.py"}\n',
        ),
      ],
      ["main.py", new ReadonlyFileHandle("main.py", "print('first')\n")],
      ["MAIN.py", new ReadonlyFileHandle("MAIN.py", "print('second')\n")],
    ]);

    await expect(readProjectFolder(root)).rejects.toThrow(
      "differ only by capitalization",
    );
  });

  it("rejects a Working folder before reading files from its child projects", async () => {
    const project = (name: string, marker: string) =>
      new ReadonlyDirectoryHandle(name, [
        [
          ".ucsb-xrp-project.json",
          new ReadonlyFileHandle(
            ".ucsb-xrp-project.json",
            `{"name":"${name}","entrypoint":"main.py"}\n`,
          ),
        ],
        ["main.py", new ReadonlyFileHandle("main.py", `print('${marker}')\n`)],
      ]);
    const workingFolder = new ReadonlyDirectoryHandle("xrp-course-work", [
      ["first-project", project("first-project", "first")],
      ["second-project", project("second-project", "second")],
    ]);

    await expect(readProjectFolder(workingFolder)).rejects.toThrow(
      "This folder contains multiple project folders (first-project, second-project). Choose one project folder rather than their parent folder.",
    );
  });

  it("lists only valid direct projects inside a Working folder", async () => {
    const project = (folderName: string, projectName: string) =>
      new ReadonlyDirectoryHandle(folderName, [
        [
          ".ucsb-xrp-project.json",
          new ReadonlyFileHandle(
            ".ucsb-xrp-project.json",
            `${JSON.stringify({ name: projectName, entrypoint: "main.py" })}\n`,
          ),
        ],
        ["main.py", new ReadonlyFileHandle("main.py", "print('ready')\n")],
      ]);
    const malformed = new ReadonlyDirectoryHandle("malformed", [
      [
        ".ucsb-xrp-project.json",
        new ReadonlyFileHandle(".ucsb-xrp-project.json", "not json"),
      ],
      ["main.py", new ReadonlyFileHandle("main.py", "print('bad')\n")],
    ]);
    const notes = new ReadonlyDirectoryHandle("notes", [
      ["README.md", new ReadonlyFileHandle("README.md", "course notes\n")],
    ]);
    const projectsFolder = new ReadonlyDirectoryHandle("XRP Projects", [
      ["zeta-folder", project("zeta-folder", "Zeta project")],
      ["alpha-folder", project("alpha-folder", "Alpha project")],
      ["malformed", malformed],
      ["notes", notes],
    ]);

    const candidates = await listDirectProjectFolders(projectsFolder);

    expect(
      candidates.map(({ folderName, projectName, entrypoint, fileCount }) => ({
        folderName,
        projectName,
        entrypoint,
        fileCount,
      })),
    ).toEqual([
      {
        folderName: "alpha-folder",
        projectName: "Alpha project",
        entrypoint: "main.py",
        fileCount: 1,
      },
      {
        folderName: "zeta-folder",
        projectName: "Zeta project",
        entrypoint: "main.py",
        fileCount: 1,
      },
    ]);
  });

  it("rejects a project folder that contains a second project folder", async () => {
    const nestedProject = new ReadonlyDirectoryHandle("second-project", [
      [
        ".ucsb-xrp-project.json",
        new ReadonlyFileHandle(
          ".ucsb-xrp-project.json",
          '{"entrypoint":"main.py"}\n',
        ),
      ],
      ["main.py", new ReadonlyFileHandle("main.py", "print('nested')\n")],
    ]);
    const root = new ReadonlyDirectoryHandle("first-project", [
      [
        ".ucsb-xrp-project.json",
        new ReadonlyFileHandle(
          ".ucsb-xrp-project.json",
          '{"entrypoint":"main.py"}\n',
        ),
      ],
      ["main.py", new ReadonlyFileHandle("main.py", "print('root')\n")],
      ["second-project", nestedProject],
    ]);

    await expect(readProjectFolder(root)).rejects.toThrow(
      "contains another UCSBXRP project folder (second-project)",
    );
  });

  it("rejects malformed project information and a missing main file", async () => {
    const malformed = new ReadonlyDirectoryHandle("malformed", [
      [
        ".ucsb-xrp-project.json",
        new ReadonlyFileHandle(".ucsb-xrp-project.json", "not json"),
      ],
      ["main.py", new ReadonlyFileHandle("main.py", "print('ready')\n")],
    ]);
    await expect(readProjectFolder(malformed)).rejects.toThrow(
      "invalid UCSBXRP project information",
    );

    const missingMain = new ReadonlyDirectoryHandle("missing-main", [
      [
        ".ucsb-xrp-project.json",
        new ReadonlyFileHandle(
          ".ucsb-xrp-project.json",
          '{"entrypoint":"main.py"}\n',
        ),
      ],
      ["notes.md", new ReadonlyFileHandle("notes.md", "notes\n")],
    ]);
    await expect(readProjectFolder(missingMain)).rejects.toThrow(
      "names main.py as its main file, but that file is missing",
    );
  });

  it("persists the main file and removes only explicitly deleted files", async () => {
    const files = new Map<string, string>([
      ["main.py", "print('old')\n"],
      ["obsolete.py", "print('remove me')\n"],
      ["student/controller.py", "class Old:\n    pass\n"],
    ]);
    const root = new WritableDirectoryHandle("course-project", files);
    const project = {
      name: "course-project",
      entrypoint: "student/controller.py",
      templateId: "challenge_2",
      files: {
        "main.py": "print('new')\n",
        "student/controller.py": "class Controller:\n    pass\n",
      },
    };

    await writeProjectFolder(root, project);
    await removeProjectFolderFiles(root, ["obsolete.py", "missing.py"]);

    expect(files.get("main.py")).toBe("print('new')\n");
    expect(files.has("obsolete.py")).toBe(false);
    expect(
      JSON.parse(files.get(".ucsb-xrp-project.json") ?? "{}"),
    ).toMatchObject({
      name: "course-project",
      entrypoint: "student/controller.py",
      templateId: "challenge_2",
    });
    const reopened = await readProjectFolder(root);
    expect(reopened.project).toEqual(project);
    expect(reopened.skipped).toBe(0);
  });

  it("writes session identity to project metadata and reopens it as saved", async () => {
    const files = new Map<string, string>();
    const root = new WritableDirectoryHandle("course-project", files);
    const project = {
      name: "course-project",
      entrypoint: "main.py",
      files: { "main.py": "print('draft')\n" },
      session: {
        projectId: "15f3cd4d-9e86-44ad-945f-daf7995710f3",
        revision: 9,
        savedRevision: 7,
        updatedAt: 1_786_000_000_500,
      },
    };

    await writeProjectFolder(root, project);

    expect(
      JSON.parse(files.get(".ucsb-xrp-project.json") ?? "{}"),
    ).toMatchObject({
      session: {
        projectId: "15f3cd4d-9e86-44ad-945f-daf7995710f3",
        revision: 9,
        savedRevision: 9,
        updatedAt: 1_786_000_000_500,
      },
    });
    await expect(readProjectFolder(root)).resolves.toMatchObject({
      project: {
        session: {
          projectId: "15f3cd4d-9e86-44ad-945f-daf7995710f3",
          revision: 9,
          savedRevision: 9,
          updatedAt: 1_786_000_000_500,
        },
      },
    });
  });

  it("adds session metadata to an unchanged legacy folder without rotating source", async () => {
    const files = new Map<string, string>([
      ["main.py", "print('unchanged')\n"],
      [
        ".ucsb-xrp-project.json",
        '{"name":"course-project","entrypoint":"main.py"}\n',
      ],
    ]);
    const root = new WritableDirectoryHandle("course-project", files);

    const result = await saveProjectFolderWithAutosave(root, {
      name: "course-project",
      entrypoint: "main.py",
      files: { "main.py": "print('unchanged')\n" },
      session: {
        projectId: "legacy-project-adopted",
        revision: 0,
        savedRevision: 0,
        updatedAt: 1_786_000_001_000,
      },
    });

    expect(result).toMatchObject({ changed: true, removedFiles: 0 });
    expect(
      JSON.parse(files.get(".ucsb-xrp-project.json") ?? "{}"),
    ).toMatchObject({
      session: {
        projectId: "legacy-project-adopted",
        revision: 0,
        savedRevision: 0,
      },
    });
    expect(
      [...files.keys()].some((path) => path.startsWith("UCSB_XRP_Autosaves/")),
    ).toBe(false);
    await expect(
      saveProjectFolderWithAutosave(root, {
        name: "course-project",
        entrypoint: "main.py",
        files: { "main.py": "print('unchanged')\n" },
        session: {
          projectId: "legacy-project-adopted",
          revision: 0,
          savedRevision: 0,
          updatedAt: 1_786_000_001_000,
        },
      }),
    ).resolves.toMatchObject({ changed: false, removedFiles: 0 });
  });

  it("creates a named project folder inside a workspace without overwriting", async () => {
    const files = new Map<string, string>();
    const workspace = new WritableDirectoryHandle("XRP-workspace", files);
    const project = {
      name: "Expanding spiral",
      entrypoint: "main.py",
      files: { "main.py": "print('spiral')\n" },
    };

    const folder = await createProjectFolder(workspace, "spiral-lab", project);

    expect(folder.name).toBe("spiral-lab");
    expect(files.get("spiral-lab/main.py")).toBe("print('spiral')\n");
    expect(
      JSON.parse(files.get("spiral-lab/.ucsb-xrp-project.json") ?? "{}"),
    ).toMatchObject({ name: "Expanding spiral", entrypoint: "main.py" });
    await expect(
      createProjectFolder(workspace, "spiral-lab", project),
    ).rejects.toThrow("already exists");
  });

  it("reopens a UCSBXRP project child and skips unrelated folder names", async () => {
    const files = new Map<string, string>([
      ["Expanding-Spiral/notes.txt", "unrelated folder\n"],
    ]);
    const workspace = new WritableDirectoryHandle("XRP-workspace", files);
    const project = {
      name: "Expanding spiral",
      entrypoint: "main.py",
      files: { "main.py": "print('spiral')\n" },
    };

    const created = await ensureProjectFolder(
      workspace,
      "Expanding-Spiral",
      project,
    );
    expect(created.created).toBe(true);
    expect(created.folder.name).toBe("Expanding-Spiral-2");
    expect(files.get("Expanding-Spiral/notes.txt")).toBe("unrelated folder\n");

    const reopened = await ensureProjectFolder(
      workspace,
      "Expanding-Spiral",
      project,
    );
    expect(reopened.created).toBe(false);
    expect(reopened.folder.name).toBe("Expanding-Spiral-2");
  });

  it("validates and suggests portable project folder names", () => {
    expect(projectFolderNameError("spiral-lab")).toBeNull();
    expect(projectFolderNameError("../spiral")).toContain("one folder name");
    expect(projectFolderNameError("  ")).toContain("Enter");
    expect(projectFolderNameError("CON")).toContain("reserved by Windows");
    expect(projectFolderNameError("spiral.")).toContain("period or space");
    expect(suggestedProjectFolderName("Expanding spiral! ")).toBe(
      "Expanding-spiral",
    );
  });

  it("calculates one canonical digest independent of file insertion order and session counters", async () => {
    const first = {
      name: "student-project",
      entrypoint: "main.py",
      files: {
        "notes.md": "observations\n",
        "main.py": "print('ready')\n",
      },
      session: {
        projectId: "project-a",
        revision: 2,
        savedRevision: 1,
        updatedAt: 100,
      },
    };
    const second = {
      ...first,
      files: {
        "main.py": "print('ready')\n",
        "notes.md": "observations\n",
      },
      session: {
        ...first.session,
        revision: 9,
        updatedAt: 900,
      },
    };

    await expect(projectContentDigest(first)).resolves.toBe(
      await projectContentDigest(second),
    );
  });

  it("detects a mixed or externally edited folder from its commit digest", async () => {
    const files = new Map<string, string>();
    const root = new WritableDirectoryHandle("student-project", files);
    await writeProjectFolder(root, {
      name: "student-project",
      entrypoint: "main.py",
      files: {
        "main.py": "print('saved')\n",
        "student/controller.py": "gain = 0.4\n",
      },
    });

    await expect(readProjectFolder(root)).resolves.toMatchObject({
      integrity: "verified",
    });
    files.set("student/controller.py", "gain = 0.7\n");

    const changed = await readProjectFolder(root);
    expect(changed.integrity).toBe("changed-after-save");
    expect(changed.contentDigest).not.toBe(
      JSON.parse(files.get(".ucsb-xrp-project.json") ?? "{}").contentDigest,
    );
  });

  it("pauses autosave when folder files changed outside the IDE", async () => {
    const files = new Map<string, string>();
    const root = new WritableDirectoryHandle("student-project", files);
    const saved = {
      name: "student-project",
      entrypoint: "main.py",
      files: { "main.py": "print('saved')\n" },
      session: {
        projectId: "project-a",
        revision: 3,
        savedRevision: 3,
        updatedAt: 300,
      },
    };
    await writeProjectFolder(root, saved);
    const opened = await readProjectFolder(root);
    const browserDraft = {
      ...opened.project,
      files: { "main.py": "print('IDE draft')\n" },
      session: {
        ...opened.project.session!,
        revision: 4,
        savedRevision: 3,
        updatedAt: 400,
      },
    };
    files.set("main.py", "print('Git edit')\n");

    const attempt = saveProjectFolderWithAutosave(root, browserDraft);
    await expect(attempt).rejects.toBeInstanceOf(ProjectFolderConflictError);
    expect(files.get("main.py")).toBe("print('Git edit')\n");
    expect(browserDraft.files["main.py"]).toBe("print('IDE draft')\n");
  });

  it("requires the current folder digest when explicitly keeping the IDE files", async () => {
    const files = new Map<string, string>();
    const root = new WritableDirectoryHandle("student-project", files);
    const saved = {
      name: "student-project",
      entrypoint: "main.py",
      files: { "main.py": "print('saved')\n" },
      session: {
        projectId: "project-a",
        revision: 3,
        savedRevision: 3,
        updatedAt: 300,
      },
    };
    await writeProjectFolder(root, saved);
    const opened = await readProjectFolder(root);
    const browserDraft = {
      ...opened.project,
      files: { "main.py": "print('IDE draft')\n" },
      session: {
        ...opened.project.session!,
        revision: 4,
        savedRevision: 3,
        updatedAt: 400,
      },
    };
    files.set("main.py", "print('Git edit')\n");
    let conflict: ProjectFolderConflictError | undefined;
    try {
      await saveProjectFolderWithAutosave(root, browserDraft);
    } catch (error) {
      if (error instanceof ProjectFolderConflictError) conflict = error;
    }
    expect(conflict).toBeDefined();

    const resolved = await saveProjectFolderWithAutosave(
      root,
      browserDraft,
      [],
      { expectedBaseDigest: conflict!.folderDigest },
    );

    expect(files.get("main.py")).toBe("print('IDE draft')\n");
    expect((await readProjectFolder(root)).integrity).toBe("verified");
    expect(resolved.contentDigest).toBe(
      await projectContentDigest(browserDraft),
    );
    const backups = [...files.entries()].filter(([path]) =>
      path.startsWith("UCSB_XRP_Autosaves/project-"),
    );
    expect(backups).toHaveLength(1);
    expect(backups[0]![1]).toContain("print('Git edit')");
  });

  it("retains the four prior complete project states before automatic overwrite", async () => {
    const files = new Map<string, string>();
    const root = new WritableDirectoryHandle("course-project", files);
    await writeProjectFolder(root, {
      name: "course-project",
      entrypoint: "main.py",
      files: { "main.py": "print('original')\n" },
    });

    for (let revision = 1; revision <= 5; revision += 1) {
      await saveProjectFolderWithAutosave(root, {
        name: "course-project",
        entrypoint: "main.py",
        files: { "main.py": `print('revision ${revision}')\n` },
      });
    }

    const savedSources = [1, 2, 3, 4].map((generation) => {
      const backup = JSON.parse(
        files.get(`UCSB_XRP_Autosaves/project-${generation}.json`) ?? "{}",
      ) as { project?: { files?: Record<string, string> } };
      return backup.project?.files?.["main.py"];
    });
    expect(savedSources).toEqual([
      "print('revision 4')\n",
      "print('revision 3')\n",
      "print('revision 2')\n",
      "print('revision 1')\n",
    ]);
    const reopened = await readProjectFolder(root);
    expect(reopened.project.files).toEqual({
      "main.py": "print('revision 5')\n",
    });
    expect(reopened.skipped).toBe(0);
  });
});
