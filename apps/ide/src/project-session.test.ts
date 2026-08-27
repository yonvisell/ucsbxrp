import { describe, expect, it } from "vitest";

import type { ProjectSnapshot } from "./project-files";
import {
  createProjectSession,
  markProjectSessionSaved,
  projectSessionHasUnsavedChanges,
  reconcileProjectSessions,
  snapshotForProjectSession,
  updateProjectSession,
  type ProjectSession,
} from "./project-session";

const baseProject: ProjectSnapshot = {
  name: "Expanding spiral",
  entrypoint: "main.py",
  files: { "main.py": "print('spiral')\n" },
};

function session(overrides: Partial<ProjectSession> = {}): ProjectSession {
  return {
    projectId: "project-a",
    revision: 4,
    savedRevision: 4,
    updatedAt: 1_000,
    source: "folder",
    project: baseProject,
    ...overrides,
  };
}

describe("project session lifecycle", () => {
  it("creates a stable unsaved identity for a browser-only project", () => {
    const opened = createProjectSession(baseProject, {
      source: "browser-draft",
      createProjectId: () => "project-a",
      now: 500,
    });

    expect(opened).toMatchObject({
      projectId: "project-a",
      revision: 1,
      savedRevision: 0,
      updatedAt: 500,
      source: "browser-draft",
    });
    expect(projectSessionHasUnsavedChanges(opened)).toBe(true);
  });

  it("restores persisted identity and treats folder contents as saved", () => {
    const opened = createProjectSession(
      {
        ...baseProject,
        session: {
          projectId: "stored-project",
          revision: 7,
          savedRevision: 5,
          updatedAt: 900,
        },
      },
      {
        source: "folder",
        projectId: "ignored-migration-id",
        createProjectId: () => "ignored-generated-id",
        now: 1_000,
      },
    );

    expect(opened).toMatchObject({
      projectId: "stored-project",
      revision: 7,
      savedRevision: 7,
      updatedAt: 900,
      source: "folder",
    });
    expect(opened.project).not.toHaveProperty("session");
  });

  it("adopts a supplied identity when opening a legacy project", () => {
    const opened = createProjectSession(baseProject, {
      source: "folder",
      projectId: "adopted-project",
      createProjectId: () => "unused-project",
      now: 500,
    });

    expect(opened.projectId).toBe("adopted-project");
  });

  it("advances revision and updatedAt monotonically for real changes only", () => {
    const original = session();
    const unchanged = updateProjectSession(original, { ...baseProject }, 900);
    const edited = updateProjectSession(
      original,
      {
        ...baseProject,
        files: { "main.py": "print('student edit')\n" },
      },
      900,
    );

    expect(unchanged).toBe(original);
    expect(edited).toMatchObject({
      projectId: "project-a",
      revision: 5,
      savedRevision: 4,
      updatedAt: 1_001,
      source: "browser-draft",
    });
    expect(projectSessionHasUnsavedChanges(edited)).toBe(true);
  });

  it("marks the exact current revision as saved without changing identity", () => {
    const draft = session({
      revision: 6,
      savedRevision: 4,
      source: "browser-draft",
    });

    const saved = markProjectSessionSaved(draft);

    expect(saved).toMatchObject({
      projectId: "project-a",
      revision: 6,
      savedRevision: 6,
      source: "folder",
    });
    expect(projectSessionHasUnsavedChanges(saved)).toBe(false);
  });

  it("serializes through the existing ProjectSnapshot persistence shape", () => {
    const current = session({
      revision: 6,
      savedRevision: 4,
      updatedAt: 1_200,
      source: "browser-draft",
    });

    const snapshot = snapshotForProjectSession(current);
    const reopened = createProjectSession(snapshot, {
      source: "browser-draft",
      createProjectId: () => "unused-project",
      now: 9_000,
    });

    expect(snapshot.session).toEqual({
      projectId: "project-a",
      revision: 6,
      savedRevision: 4,
      updatedAt: 1_200,
    });
    expect(reopened).toEqual(current);
  });

  it("rejects exhausted counters instead of losing monotonicity", () => {
    expect(() =>
      updateProjectSession(
        session({ revision: Number.MAX_SAFE_INTEGER }),
        {
          ...baseProject,
          files: { "main.py": "print('change')\n" },
        },
        2_000,
      ),
    ).toThrow("revision cannot advance");
  });
});

describe("project session reconciliation", () => {
  it("keeps a newer unsaved browser draft instead of an older folder copy", () => {
    const browser = session({
      revision: 8,
      savedRevision: 5,
      updatedAt: 1_500,
      source: "browser-draft",
      project: {
        ...baseProject,
        files: { "main.py": "print('unsaved student work')\n" },
      },
    });
    const folder = session({
      revision: 5,
      savedRevision: 5,
      updatedAt: 1_000,
    });

    const result = reconcileProjectSessions(browser, folder);

    expect(result).toMatchObject({
      session: browser,
      reason: "newer-browser-draft",
      preserveBrowserDraft: false,
    });
  });

  it("uses a newer folder revision when the browser copy is clean", () => {
    const browser = session({ revision: 4, savedRevision: 4 });
    const folder = session({
      revision: 6,
      savedRevision: 6,
      updatedAt: 1_500,
      project: {
        ...baseProject,
        files: { "main.py": "print('new folder work')\n" },
      },
    });

    expect(reconcileProjectSessions(browser, folder)).toMatchObject({
      session: folder,
      reason: "newer-folder",
      preserveBrowserDraft: false,
    });
  });

  it("selects a newer folder but retains an older unsaved browser branch", () => {
    const browser = session({
      revision: 5,
      savedRevision: 4,
      source: "browser-draft",
      project: {
        ...baseProject,
        files: { "main.py": "print('older unsaved branch')\n" },
      },
    });
    const folder = session({
      revision: 6,
      savedRevision: 6,
      updatedAt: 1_500,
      project: {
        ...baseProject,
        files: { "main.py": "print('new folder work')\n" },
      },
    });

    expect(reconcileProjectSessions(browser, folder)).toMatchObject({
      session: folder,
      reason: "newer-folder",
      preserveBrowserDraft: true,
    });
  });

  it("coalesces identical contents as a saved folder revision", () => {
    const browser = session({
      revision: 8,
      savedRevision: 5,
      updatedAt: 1_500,
      source: "browser-draft",
    });
    const folder = session({ revision: 5, savedRevision: 5 });

    const result = reconcileProjectSessions(browser, folder);

    expect(result).toMatchObject({
      reason: "same-content",
      preserveBrowserDraft: false,
      session: {
        revision: 8,
        savedRevision: 8,
        updatedAt: 1_500,
        source: "folder",
      },
    });
  });

  it("keeps an unsaved browser tie rather than selecting different folder contents", () => {
    const browser = session({
      revision: 6,
      savedRevision: 5,
      source: "browser-draft",
      project: {
        ...baseProject,
        files: { "main.py": "print('browser edit')\n" },
      },
    });
    const folder = session({
      revision: 6,
      project: {
        ...baseProject,
        files: { "main.py": "print('external edit')\n" },
      },
    });

    expect(reconcileProjectSessions(browser, folder)).toMatchObject({
      session: browser,
      reason: "newer-browser-draft",
      preserveBrowserDraft: false,
    });
  });

  it("selects the explicit folder for a different project without deleting a dirty draft", () => {
    const browser = session({
      projectId: "project-a",
      revision: 3,
      savedRevision: 2,
      source: "browser-draft",
    });
    const folder = session({ projectId: "project-b" });

    expect(reconcileProjectSessions(browser, folder)).toMatchObject({
      session: folder,
      reason: "different-project",
      preserveBrowserDraft: true,
    });
  });

  it("uses updatedAt only to break an equal-revision clean-copy conflict", () => {
    const browser = session({
      updatedAt: 1_500,
      source: "browser-draft",
      project: {
        ...baseProject,
        files: { "main.py": "print('newer browser copy')\n" },
      },
    });
    const folder = session({
      updatedAt: 1_000,
      project: {
        ...baseProject,
        files: { "main.py": "print('folder copy')\n" },
      },
    });

    expect(reconcileProjectSessions(browser, folder)).toMatchObject({
      session: browser,
      reason: "newer-browser-copy",
    });
  });
});
