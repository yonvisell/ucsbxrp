import { courseFolderPermission } from "../../shared/course-folder";
import {
  ProjectFolderConflictError,
  saveProjectFolderWithAutosave,
  type CourseDirectoryHandle,
  type ProjectFolderSaveResult,
} from "./project-files";
import {
  acknowledgeProjectSessionSave,
  snapshotForProjectSession,
  type ProjectSession,
} from "./project-session";

export interface ProjectFolderSaveOutcome {
  status: "saved";
  session: ProjectSession;
  exactRevision: boolean;
  removedFiles: number;
  contentDigest: string;
}

export interface ProjectFolderCancelledOutcome {
  status: "cancelled";
}

export interface ProjectFolderConflictOutcome {
  status: "conflict";
}

export type ProjectFolderPersistenceOutcome =
  | ProjectFolderSaveOutcome
  | ProjectFolderCancelledOutcome
  | ProjectFolderConflictOutcome;

interface ProjectFolderPersistenceDependencies {
  getCurrentSession: () => ProjectSession;
  getProjectVersion: () => number;
  getWorkingFolder: () => CourseDirectoryHandle | null;
  permission?: (folder: CourseDirectoryHandle) => Promise<PermissionState>;
  save?: typeof saveProjectFolderWithAutosave;
}

interface WriteRequest {
  folder: CourseDirectoryHandle;
  session: ProjectSession;
  writeEpoch: number;
  requirePermission: boolean;
  permissionMessage?: string;
  expectedBaseDigest?: string;
  beforeWrite: () => boolean | Promise<boolean>;
  afterWrite: () => boolean;
  exactRevision: () => boolean;
  applyDeletionsWhenSuperseded: boolean;
}

/**
 * Serializes writes to the active Project folder and keeps the saved revision
 * and pending deletions consistent with the exact snapshot written to disk.
 * React remains responsible only for presenting the resulting state.
 */
export class ProjectFolderPersistenceController {
  private writeQueue: Promise<void> = Promise.resolve();
  private writeEpoch = 0;
  private pendingDeletions = new Set<string>();
  private conflictHandler: (conflict: ProjectFolderConflictError) => void =
    () => undefined;

  private readonly permission: (
    folder: CourseDirectoryHandle,
  ) => Promise<PermissionState>;
  private readonly save: typeof saveProjectFolderWithAutosave;

  constructor(
    private readonly dependencies: ProjectFolderPersistenceDependencies,
  ) {
    this.permission = dependencies.permission ?? courseFolderPermission;
    this.save = dependencies.save ?? saveProjectFolderWithAutosave;
  }

  setConflictHandler(
    handler: (conflict: ProjectFolderConflictError) => void,
  ): void {
    this.conflictHandler = handler;
  }

  cancelPendingWrites(): void {
    this.writeEpoch += 1;
  }

  replacePendingDeletions(update: (current: Set<string>) => Set<string>): void {
    this.pendingDeletions = update(this.pendingDeletions);
  }

  async waitForWrites(): Promise<void> {
    await this.writeQueue;
  }

  saveManually(
    folder: CourseDirectoryHandle,
    session: ProjectSession,
  ): Promise<ProjectFolderPersistenceOutcome> {
    const writeEpoch = this.beginExclusiveWrite();
    return this.enqueue({
      folder,
      session,
      writeEpoch,
      requirePermission: false,
      beforeWrite: () => this.isExactSession(writeEpoch, session),
      afterWrite: () => this.isCurrentProject(writeEpoch, session),
      exactRevision: () =>
        this.dependencies.getCurrentSession().revision === session.revision,
      applyDeletionsWhenSuperseded: false,
    });
  }

  saveAutomatically(
    folder: CourseDirectoryHandle,
    session: ProjectSession,
    projectVersion: number,
  ): Promise<ProjectFolderPersistenceOutcome> {
    const writeEpoch = this.writeEpoch;
    return this.enqueue({
      folder,
      session,
      writeEpoch,
      requirePermission: true,
      permissionMessage:
        "Reconnect the project folder to resume automatic saves.",
      beforeWrite: () =>
        this.dependencies.getProjectVersion() === projectVersion &&
        this.isExactSession(writeEpoch, session),
      afterWrite: () => this.isCurrentProject(writeEpoch, session),
      exactRevision: () =>
        this.dependencies.getProjectVersion() === projectVersion &&
        this.dependencies.getCurrentSession().revision === session.revision,
      applyDeletionsWhenSuperseded: false,
    });
  }

  saveBeforeReload(
    folder: CourseDirectoryHandle,
    session: ProjectSession,
    canWrite: () => boolean,
  ): Promise<ProjectFolderPersistenceOutcome> {
    const writeEpoch = this.beginExclusiveWrite();
    const stillCurrent = () =>
      canWrite() &&
      this.dependencies.getWorkingFolder() === folder &&
      this.isExactSession(writeEpoch, session);
    return this.enqueue({
      folder,
      session,
      writeEpoch,
      requirePermission: true,
      permissionMessage:
        "Reconnect the project folder before applying the course update.",
      beforeWrite: stillCurrent,
      afterWrite: stillCurrent,
      exactRevision: stillCurrent,
      applyDeletionsWhenSuperseded: false,
    });
  }

  keepIdeFiles(
    folder: CourseDirectoryHandle,
    session: ProjectSession,
    expectedBaseDigest: string,
  ): Promise<ProjectFolderPersistenceOutcome> {
    const writeEpoch = this.beginExclusiveWrite();
    return this.enqueue({
      folder,
      session,
      writeEpoch,
      requirePermission: false,
      expectedBaseDigest,
      // Conflict resolution is already an explicit user action. Preserve its
      // existing behavior of waiting behind an active write, then applying the
      // selected IDE snapshot.
      beforeWrite: () => true,
      afterWrite: () => this.isCurrentProject(writeEpoch, session),
      exactRevision: () =>
        this.dependencies.getCurrentSession().revision === session.revision,
      applyDeletionsWhenSuperseded: true,
    });
  }

  private beginExclusiveWrite(): number {
    this.writeEpoch += 1;
    return this.writeEpoch;
  }

  private isExactSession(writeEpoch: number, session: ProjectSession): boolean {
    const current = this.dependencies.getCurrentSession();
    return (
      this.writeEpoch === writeEpoch &&
      current.projectId === session.projectId &&
      current.revision === session.revision
    );
  }

  private isCurrentProject(
    writeEpoch: number,
    session: ProjectSession,
  ): boolean {
    return (
      this.writeEpoch === writeEpoch &&
      this.dependencies.getCurrentSession().projectId === session.projectId
    );
  }

  private enqueue(
    request: WriteRequest,
  ): Promise<ProjectFolderPersistenceOutcome> {
    const deletedPaths = new Set(this.pendingDeletions);
    const savedProject = snapshotForProjectSession(request.session);
    const queued = this.writeQueue.then(async () => {
      if (!(await request.beforeWrite())) return null;
      if (
        request.requirePermission &&
        (await this.permission(request.folder)) !== "granted"
      ) {
        throw new DOMException(
          request.permissionMessage ?? "Project folder access is required.",
          "NotAllowedError",
        );
      }
      return this.save(request.folder, savedProject, deletedPaths, {
        ...(request.expectedBaseDigest
          ? { expectedBaseDigest: request.expectedBaseDigest }
          : {}),
      });
    });
    this.writeQueue = queued.then(
      () => undefined,
      () => undefined,
    );
    return queued
      .then((result) => this.finishWrite(request, deletedPaths, result))
      .catch((error: unknown) => {
        if (error instanceof ProjectFolderConflictError) {
          this.cancelPendingWrites();
          this.conflictHandler(error);
          return { status: "conflict" } as const;
        }
        throw error;
      });
  }

  private finishWrite(
    request: WriteRequest,
    deletedPaths: Set<string>,
    result: ProjectFolderSaveResult | null,
  ): ProjectFolderPersistenceOutcome {
    if (result === null || !request.afterWrite()) {
      return { status: "cancelled" };
    }
    const current = this.dependencies.getCurrentSession();
    const exactRevision = request.exactRevision();
    const session = acknowledgeProjectSessionSave(
      current,
      request.session.revision,
      result.contentDigest,
    );
    if (exactRevision || request.applyDeletionsWhenSuperseded) {
      const remaining = new Set(this.pendingDeletions);
      for (const path of deletedPaths) remaining.delete(path);
      this.pendingDeletions = remaining;
    }
    return {
      status: "saved",
      session,
      exactRevision,
      removedFiles: result.removedFiles,
      contentDigest: result.contentDigest,
    };
  }
}
