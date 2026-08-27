import { describe, expect, it, vi } from "vitest";

import { OfflineReleaseCoordinator } from "../../shared/offline-release-coordinator";
import {
  ideReloadIsIdle,
  projectRevisionIdentity,
  projectRevisionIsReloadable,
  type IdeReloadActivity,
} from "./ide-release-reload";
import type { ProjectSession } from "./project-session";

const idle: IdeReloadActivity = {
  projectReady: true,
  targetState: "ready",
  targetCommandActive: false,
  componentCheckActive: false,
};

function session(
  revision = 4,
  savedRevision = revision,
  projectId = "project-a",
): ProjectSession {
  return {
    projectId,
    revision,
    savedRevision,
    updatedAt: 1_000,
    source: savedRevision === revision ? "folder" : "browser-draft",
    project: {
      name: "Project",
      entrypoint: "main.py",
      files: { "main.py": "print('ready')\n" },
    },
  };
}

async function finishAttempt() {
  await Promise.resolve();
  await Promise.resolve();
}

describe("IDE course-update reload", () => {
  it.each([
    ["project bootstrap", { projectReady: false }],
    ["target connection", { targetState: "connecting" as const }],
    ["target loading", { targetState: "loading" as const }],
    ["target run", { targetState: "running" as const }],
    ["target command", { targetCommandActive: true }],
    ["component check", { componentCheckActive: true }],
  ])("rejects reload during %s", (_label, change) => {
    expect(ideReloadIsIdle({ ...idle, ...change })).toBe(false);
  });

  it("requires the same project and revision after an attached-folder save", () => {
    const expected = projectRevisionIdentity(session(6, 4));

    expect(projectRevisionIsReloadable(session(6, 6), expected, true)).toBe(
      true,
    );
    expect(projectRevisionIsReloadable(session(7, 7), expected, true)).toBe(
      false,
    );
    expect(
      projectRevisionIsReloadable(session(6, 6, "project-b"), expected, true),
    ).toBe(false);
  });

  it("preserves a browser-only session without pretending it was folder-saved", () => {
    const browserDraft = session(6, 4);
    const expected = projectRevisionIdentity(browserDraft);

    expect(projectRevisionIsReloadable(browserDraft, expected, false)).toBe(
      true,
    );
    expect(projectRevisionIsReloadable(session(6, 5), expected, false)).toBe(
      false,
    );
  });

  it("defers a release until the command and exact folder save complete", async () => {
    let activity = { ...idle, targetCommandActive: true };
    let current = session(5, 4);
    const expected = projectRevisionIdentity(current);
    const reload = vi.fn();
    const coordinator = new OfflineReleaseCoordinator({ reload });
    coordinator.registerBeforeReload(() => {
      return (
        ideReloadIsIdle(activity) &&
        projectRevisionIsReloadable(current, expected, true)
      );
    });

    coordinator.request({ version: "release-b", reason: "release-update" });
    await finishAttempt();
    expect(reload).not.toHaveBeenCalled();

    activity = idle;
    current = session(5, 5);
    coordinator.retry();
    await finishAttempt();
    expect(reload).toHaveBeenCalledOnce();
  });
});
