import type { TargetRunState } from "@ucsb-xrp/target";

import type { ProjectSession } from "./project-session";

export interface IdeReloadActivity {
  projectReady: boolean;
  targetState: TargetRunState;
  targetCommandActive: boolean;
  componentCheckActive: boolean;
  uiDraftActive: boolean;
  folderInteractionActive: boolean;
  folderSaveActive: boolean;
}

export interface ProjectRevisionIdentity {
  projectId: string;
  revision: number;
  savedRevision: number;
}

export function ideReloadIsIdle(activity: IdeReloadActivity): boolean {
  return (
    activity.projectReady &&
    !activity.targetCommandActive &&
    !activity.componentCheckActive &&
    !activity.uiDraftActive &&
    !activity.folderInteractionActive &&
    !activity.folderSaveActive &&
    activity.targetState !== "connecting" &&
    activity.targetState !== "loading" &&
    activity.targetState !== "running"
  );
}

export function projectRevisionIdentity(
  session: ProjectSession,
): ProjectRevisionIdentity {
  return {
    projectId: session.projectId,
    revision: session.revision,
    savedRevision: session.savedRevision,
  };
}

export function projectRevisionIsReloadable(
  current: ProjectSession,
  expected: ProjectRevisionIdentity,
  requireFolderSave: boolean,
): boolean {
  return (
    current.projectId === expected.projectId &&
    current.revision === expected.revision &&
    current.savedRevision ===
      (requireFolderSave ? expected.revision : expected.savedRevision)
  );
}
