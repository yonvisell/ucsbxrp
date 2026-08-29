import { describe, expect, it, vi } from "vitest";

import type { CourseDirectoryHandle } from "./project-files";
import { ProjectFolderConflictError } from "./project-files";
import { ProjectFolderPersistenceController } from "./project-folder-persistence";
import {
  createProjectSession,
  updateProjectSession,
  type ProjectSession,
} from "./project-session";

type SaveProjectFolder = NonNullable<
  ConstructorParameters<typeof ProjectFolderPersistenceController>[0]["save"]
>;

const folder = {
  kind: "directory",
  name: "spiral-lab",
} as CourseDirectoryHandle;

function session(): ProjectSession {
  return createProjectSession(
    {
      name: "Spiral lab",
      entrypoint: "main.py",
      files: { "main.py": "print('one')\n", "notes.md": "notes\n" },
    },
    { source: "folder", baseDigest: "a".repeat(64), now: 100 },
  );
}

function setup(
  overrides: {
    save?: ConstructorParameters<
      typeof ProjectFolderPersistenceController
    >[0]["save"];
    permission?: ConstructorParameters<
      typeof ProjectFolderPersistenceController
    >[0]["permission"];
  } = {},
) {
  let currentSession = session();
  let projectVersion = 1;
  let workingFolder: CourseDirectoryHandle | null = folder;
  const save = vi.fn(
    overrides.save ??
      (async () => ({
        changed: true,
        removedFiles: 0,
        contentDigest: "b".repeat(64),
      })),
  );
  const controller = new ProjectFolderPersistenceController({
    getCurrentSession: () => currentSession,
    getProjectVersion: () => projectVersion,
    getWorkingFolder: () => workingFolder,
    save,
    permission: overrides.permission,
  });
  return {
    controller,
    save,
    get session() {
      return currentSession;
    },
    setSession(next: ProjectSession) {
      currentSession = next;
    },
    setProjectVersion(next: number) {
      projectVersion = next;
    },
    setWorkingFolder(next: CourseDirectoryHandle | null) {
      workingFolder = next;
    },
  };
}

describe("ProjectFolderPersistenceController", () => {
  it("runs only one Project-folder write at a time", async () => {
    let releaseFirst!: () => void;
    let active = 0;
    let maximumActive = 0;
    let saveNumber = 0;
    const save = vi.fn<SaveProjectFolder>(async () => {
      saveNumber += 1;
      active += 1;
      maximumActive = Math.max(maximumActive, active);
      if (saveNumber === 1) {
        await new Promise<void>((resolve) => {
          releaseFirst = resolve;
        });
      }
      active -= 1;
      return {
        changed: true,
        removedFiles: 0,
        contentDigest: "b".repeat(64),
      };
    });
    const harness = setup({ save });

    const first = harness.controller.saveManually(folder, harness.session);
    await vi.waitFor(() => expect(save).toHaveBeenCalledOnce());
    const second = harness.controller.saveManually(folder, harness.session);
    await Promise.resolve();
    expect(save).toHaveBeenCalledOnce();
    releaseFirst();

    await Promise.all([first, second]);
    expect(save).toHaveBeenCalledTimes(2);
    expect(maximumActive).toBe(1);
  });

  it("acknowledges an exact manual save and applies its deletions once", async () => {
    const harness = setup();
    harness.controller.replacePendingDeletions(() => new Set(["notes.md"]));

    const first = await harness.controller.saveManually(
      folder,
      harness.session,
    );
    expect(first).toMatchObject({ status: "saved", exactRevision: true });
    if (first.status !== "saved") throw new Error("save did not complete");
    expect(first.session.savedRevision).toBe(first.session.revision);
    expect([...(harness.save.mock.calls[0]![2] ?? [])]).toEqual(["notes.md"]);

    harness.setSession(first.session);
    await harness.controller.saveManually(folder, harness.session);
    expect([...(harness.save.mock.calls[1]![2] ?? [])]).toEqual([]);
  });

  it("acknowledges the written revision but retains deletions after a newer edit", async () => {
    let finishWrite!: (value: {
      changed: boolean;
      removedFiles: number;
      contentDigest: string;
    }) => void;
    const save = vi.fn(
      () =>
        new Promise<{
          changed: boolean;
          removedFiles: number;
          contentDigest: string;
        }>((resolve) => {
          finishWrite = resolve;
        }),
    );
    const harness = setup({ save });
    harness.controller.replacePendingDeletions(() => new Set(["notes.md"]));

    const pending = harness.controller.saveManually(folder, harness.session);
    await vi.waitFor(() => expect(save).toHaveBeenCalledOnce());
    harness.setSession(
      updateProjectSession(
        harness.session,
        {
          ...harness.session.project,
          files: {
            ...harness.session.project.files,
            "main.py": "print('two')\n",
          },
        },
        200,
      ),
    );
    finishWrite({
      changed: true,
      removedFiles: 1,
      contentDigest: "b".repeat(64),
    });

    const outcome = await pending;
    expect(outcome).toMatchObject({ status: "saved", exactRevision: false });
    if (outcome.status !== "saved") throw new Error("save did not complete");
    expect(outcome.session.savedRevision).toBe(outcome.session.revision - 1);
    harness.setSession(outcome.session);
    save.mockResolvedValue({
      changed: true,
      removedFiles: 0,
      contentDigest: "c".repeat(64),
    });
    await harness.controller.saveManually(folder, harness.session);
    expect([...(harness.save.mock.calls[1]![2] ?? [])]).toEqual(["notes.md"]);
  });

  it("cancels a stale autosave before it writes", async () => {
    const harness = setup();
    harness.setProjectVersion(2);

    const outcome = await harness.controller.saveAutomatically(
      folder,
      harness.session,
      1,
    );

    expect(outcome).toEqual({ status: "cancelled" });
    expect(harness.save).not.toHaveBeenCalled();
  });

  it("coalesces an edit burst behind a slow write without losing the newest revision", async () => {
    let releaseFirst!: () => void;
    let active = 0;
    let maximumActive = 0;
    let saveNumber = 0;
    const save = vi.fn<SaveProjectFolder>(async () => {
      saveNumber += 1;
      active += 1;
      maximumActive = Math.max(maximumActive, active);
      if (saveNumber === 1) {
        await new Promise<void>((resolve) => {
          releaseFirst = resolve;
        });
      }
      active -= 1;
      return {
        changed: true,
        removedFiles: 0,
        contentDigest: `${saveNumber}`.repeat(64),
      };
    });
    const harness = setup({ save });

    const first = harness.controller.saveAutomatically(
      folder,
      harness.session,
      1,
    );
    await vi.waitFor(() => expect(save).toHaveBeenCalledOnce());

    const queueEdit = (content: string, version: number) => {
      const next = updateProjectSession(
        harness.session,
        {
          ...harness.session.project,
          files: {
            ...harness.session.project.files,
            "main.py": content,
          },
        },
        100 + version,
      );
      harness.setSession(next);
      harness.setProjectVersion(version);
      return harness.controller.saveAutomatically(folder, next, version);
    };

    const supersededSecond = queueEdit("print('two')\n", 2);
    const supersededThird = queueEdit("print('three')\n", 3);
    const latest = queueEdit("print('latest')\n", 4);

    await expect(supersededSecond).resolves.toEqual({ status: "cancelled" });
    await expect(supersededThird).resolves.toEqual({ status: "cancelled" });
    expect(save).toHaveBeenCalledOnce();

    releaseFirst();
    const [firstOutcome, latestOutcome] = await Promise.all([first, latest]);

    expect(firstOutcome).toMatchObject({
      status: "saved",
      exactRevision: false,
    });
    expect(latestOutcome).toMatchObject({
      status: "saved",
      exactRevision: true,
    });
    expect(save).toHaveBeenCalledTimes(2);
    expect(save.mock.calls[1]?.[1].files["main.py"]).toBe("print('latest')\n");
    expect(maximumActive).toBe(1);
  });

  it("requires folder permission for autosave and pre-update writes", async () => {
    const harness = setup({ permission: async () => "denied" });

    await expect(
      harness.controller.saveAutomatically(folder, harness.session, 1),
    ).rejects.toMatchObject({ name: "NotAllowedError" });
    await expect(
      harness.controller.saveBeforeReload(folder, harness.session, () => true),
    ).rejects.toMatchObject({ name: "NotAllowedError" });
    expect(harness.save).not.toHaveBeenCalled();
  });

  it("propagates a folder conflict through one handler", async () => {
    const conflict = new ProjectFolderConflictError(
      harnessProject(),
      "d".repeat(64),
    );
    const harness = setup({
      save: vi.fn(async () => {
        throw conflict;
      }),
    });
    const handler = vi.fn();
    harness.controller.setConflictHandler(handler);

    await expect(
      harness.controller.saveManually(folder, harness.session),
    ).resolves.toEqual({ status: "conflict" });
    expect(handler).toHaveBeenCalledWith(conflict);
  });
});

function harnessProject() {
  return {
    name: "Folder version",
    entrypoint: "main.py",
    files: { "main.py": "print('folder')\n" },
  };
}
