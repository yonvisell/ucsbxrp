import type {
  CheckResult,
  CourseProject,
  ProjectRevisionNotice,
  RuntimeParameterValue,
  TargetEvent,
} from "./types";
import type {
  ProjectRunSnapshotRequest,
  ProjectRunSnapshotResponse,
} from "./project-run-provider";

export type PhysicalWorkerCommand =
  | {
      type: "connect";
      requestId: string;
      endpoints?: readonly string[];
      endpoint?: string;
      discoveryTimeoutMs?: number;
      expectedRobotId?: string;
      providesProject?: boolean;
    }
  | { type: "disconnect" }
  | {
      type: "set-project-run-provider";
      providesProject: boolean;
      takeover?: boolean;
    }
  | { type: "mark-project-changed"; project: ProjectRevisionNotice }
  | ProjectRunSnapshotResponse
  | { type: "check"; requestId: string; project: CourseProject }
  | { type: "prepare"; requestId: string; project: CourseProject }
  | { type: "run"; requestId: string; project: CourseProject }
  | { type: "run-current"; requestId: string }
  | {
      type: "mark-project-stale";
      requestId: string;
      project: CourseProject;
    }
  | { type: "stop"; requestId: string }
  | { type: "reset"; requestId: string }
  | {
      type: "set-runtime-parameter";
      requestId: string;
      name: string;
      value: RuntimeParameterValue;
    };

export type PhysicalWorkerMessage =
  | { type: "event"; event: TargetEvent }
  | ProjectRunSnapshotRequest
  | {
      type: "response";
      requestId: string;
      ok: true;
      result?: CheckResult;
    }
  | {
      type: "response";
      requestId: string;
      ok: false;
      error: string;
      errorCode?: string;
    };
