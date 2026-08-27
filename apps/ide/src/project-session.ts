import {
  sameProjectContents,
  type ProjectSessionMetadata,
  type ProjectSnapshot,
} from "./project-files";

export type ProjectSessionSource = "browser-draft" | "folder";

export interface ProjectSession extends ProjectSessionMetadata {
  project: ProjectSnapshot;
  source: ProjectSessionSource;
}

export interface CreateProjectSessionOptions {
  source: ProjectSessionSource;
  /** Supplies an identity when adopting a legacy project. */
  projectId?: string;
  /** Injectable for deterministic tests. */
  createProjectId?: () => string;
  /** Unix time in milliseconds. Defaults to Date.now(). */
  now?: number;
  /** Actual digest read from an attached project folder. */
  baseDigest?: string;
}

export type ProjectReconciliationReason =
  | "same-content"
  | "newer-browser-draft"
  | "newer-browser-copy"
  | "newer-folder"
  | "folder-conflict"
  | "different-project";

export interface ProjectReconciliation {
  session: ProjectSession;
  reason: ProjectReconciliationReason;
  /** Keep the unselected browser copy available for explicit recovery. */
  preserveBrowserDraft: boolean;
}

function projectWithoutSessionMetadata(
  project: ProjectSnapshot,
): ProjectSnapshot {
  const { session: _session, ...contents } = project;
  return { ...contents, files: { ...contents.files } };
}

function checkedNonnegativeInteger(value: number, label: string): number {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new Error(`${label} must be a nonnegative safe integer.`);
  }
  return value;
}

function checkedProjectId(projectId: string): string {
  if (
    projectId.length === 0 ||
    projectId.length > 128 ||
    projectId.trim() !== projectId
  ) {
    throw new Error("projectId must be a nonempty, trimmed identifier.");
  }
  return projectId;
}

function defaultProjectId(): string {
  if (!globalThis.crypto?.randomUUID) {
    throw new Error("This browser cannot create a stable project identity.");
  }
  return globalThis.crypto.randomUUID();
}

function monotonicUpdatedAt(previous: number, requested: number): number {
  const now = checkedNonnegativeInteger(requested, "updatedAt");
  if (previous === Number.MAX_SAFE_INTEGER) {
    throw new Error("The project update timestamp cannot advance further.");
  }
  return Math.max(now, previous + 1);
}

/**
 * Opens a project snapshot as a revisioned session. Existing metadata always
 * wins over supplied migration defaults. Folder contents are, by definition,
 * saved; a browser copy retains its recorded saved revision.
 */
export function createProjectSession(
  snapshot: ProjectSnapshot,
  options: CreateProjectSessionOptions,
): ProjectSession {
  const stored = snapshot.session;
  const projectId = checkedProjectId(
    stored?.projectId ??
      options.projectId ??
      (options.createProjectId ?? defaultProjectId)(),
  );
  const revision = checkedNonnegativeInteger(
    stored?.revision ?? (options.source === "browser-draft" ? 1 : 0),
    "revision",
  );
  const storedSavedRevision = checkedNonnegativeInteger(
    stored?.savedRevision ?? 0,
    "savedRevision",
  );
  if (storedSavedRevision > revision) {
    throw new Error("savedRevision cannot exceed revision.");
  }
  const updatedAt = checkedNonnegativeInteger(
    stored?.updatedAt ?? options.now ?? Date.now(),
    "updatedAt",
  );
  return {
    projectId,
    revision,
    savedRevision: options.source === "folder" ? revision : storedSavedRevision,
    updatedAt,
    ...(options.source === "folder" && options.baseDigest
      ? { baseDigest: options.baseDigest }
      : stored?.baseDigest
        ? { baseDigest: stored.baseDigest }
        : {}),
    source: options.source,
    project: projectWithoutSessionMetadata(snapshot),
  };
}

/** Produces the existing persistence shape with session metadata attached. */
export function snapshotForProjectSession(
  session: ProjectSession,
): ProjectSnapshot {
  return {
    ...projectWithoutSessionMetadata(session.project),
    session: {
      projectId: session.projectId,
      revision: session.revision,
      savedRevision: session.savedRevision,
      updatedAt: session.updatedAt,
      ...(session.baseDigest ? { baseDigest: session.baseDigest } : {}),
    },
  };
}

export function projectSessionHasUnsavedChanges(
  session: ProjectSession,
): boolean {
  return session.revision > session.savedRevision;
}

/**
 * Applies one content change. Repeating an equivalent update is a no-op, while
 * a real change advances both the revision and update time monotonically.
 */
export function updateProjectSession(
  session: ProjectSession,
  project: ProjectSnapshot,
  now: number = Date.now(),
): ProjectSession {
  const nextProject = projectWithoutSessionMetadata(project);
  if (sameProjectContents(session.project, nextProject)) {
    return session;
  }
  if (session.revision === Number.MAX_SAFE_INTEGER) {
    throw new Error("The project revision cannot advance further.");
  }
  return {
    ...session,
    project: nextProject,
    revision: session.revision + 1,
    updatedAt: monotonicUpdatedAt(session.updatedAt, now),
    source: "browser-draft",
  };
}

/** Marks the current revision as present in its attached project folder. */
export function acknowledgeProjectSessionSave(
  session: ProjectSession,
  savedRevision: number,
  baseDigest?: string,
): ProjectSession {
  const checkedSavedRevision = checkedNonnegativeInteger(
    savedRevision,
    "savedRevision",
  );
  if (checkedSavedRevision > session.revision) {
    throw new Error("savedRevision cannot exceed revision.");
  }
  if (checkedSavedRevision < session.savedRevision) {
    return session;
  }
  if (
    session.savedRevision === checkedSavedRevision &&
    (baseDigest === undefined || session.baseDigest === baseDigest)
  ) {
    return session;
  }
  return {
    ...session,
    savedRevision: checkedSavedRevision,
    ...(baseDigest ? { baseDigest } : {}),
    source:
      checkedSavedRevision === session.revision ? "folder" : "browser-draft",
  };
}

export function markProjectSessionSaved(
  session: ProjectSession,
  baseDigest?: string,
): ProjectSession {
  return acknowledgeProjectSessionSave(session, session.revision, baseDigest);
}

function sameProjectWithSavedFolder(
  browser: ProjectSession,
  folder: ProjectSession,
): ProjectSession {
  const revision = Math.max(browser.revision, folder.revision);
  return {
    ...folder,
    revision,
    savedRevision: revision,
    updatedAt: Math.max(browser.updatedAt, folder.updatedAt),
  };
}

/**
 * Resolves the browser recovery copy against the selected project folder.
 * Revisions are authoritative; timestamps only describe the chosen revision.
 * A dirty browser revision wins over the same or an older folder revision.
 */
export function reconcileProjectSessions(
  browser: ProjectSession,
  folder: ProjectSession,
): ProjectReconciliation {
  const browserDirty = projectSessionHasUnsavedChanges(browser);
  if (browser.projectId !== folder.projectId) {
    return {
      session: folder,
      reason: "different-project",
      preserveBrowserDraft: browserDirty,
    };
  }

  if (sameProjectContents(browser.project, folder.project)) {
    return {
      session: sameProjectWithSavedFolder(browser, folder),
      reason: "same-content",
      preserveBrowserDraft: false,
    };
  }

  // A dirty browser draft is safe to save only while the attached folder is
  // still the exact base from which that draft was made. A changed base is a
  // branch, regardless of revision counters stored in either copy.
  if (
    folder.baseDigest !== undefined &&
    browser.baseDigest !== folder.baseDigest
  ) {
    if (browserDirty) {
      return {
        session: browser,
        reason: "folder-conflict",
        preserveBrowserDraft: false,
      };
    }
    return {
      session: folder,
      reason: "newer-folder",
      preserveBrowserDraft: false,
    };
  }

  if (browserDirty && browser.revision >= folder.revision) {
    return {
      session: browser,
      reason: "newer-browser-draft",
      preserveBrowserDraft: false,
    };
  }

  if (folder.revision > browser.revision) {
    return {
      session: folder,
      reason: "newer-folder",
      preserveBrowserDraft: browserDirty,
    };
  }

  if (browser.revision > folder.revision) {
    return {
      session: browser,
      reason: browserDirty ? "newer-browser-draft" : "newer-browser-copy",
      preserveBrowserDraft: false,
    };
  }

  // Equal revisions with different contents indicate an external or legacy
  // edit that did not advance the shared counter. updatedAt makes the choice
  // repeatable; an exact tie favors the selected folder.
  if (browser.updatedAt > folder.updatedAt) {
    return {
      session: browser,
      reason: browserDirty ? "newer-browser-draft" : "newer-browser-copy",
      preserveBrowserDraft: false,
    };
  }
  return {
    session: folder,
    reason: "newer-folder",
    preserveBrowserDraft: browserDirty,
  };
}
