import type {
  CheckResult,
  CourseProject,
  RuntimeParameterValue,
  TargetEvent,
} from "./types";

export type PhysicalWorkerCommand =
  | {
      type: "connect";
      requestId: string;
      endpoints?: readonly string[];
      endpoint?: string;
      discoveryTimeoutMs?: number;
      expectedRobotId?: string;
    }
  | { type: "disconnect" }
  | { type: "check"; requestId: string; project: CourseProject }
  | { type: "sync"; requestId: string; project: CourseProject }
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
