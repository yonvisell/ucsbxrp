import type { CheckResult, CourseProject, TargetEvent } from "./types";

export type PhysicalWorkerCommand =
  | { type: "connect"; requestId: string; endpoint: string }
  | { type: "disconnect" }
  | { type: "check"; requestId: string; project: CourseProject }
  | { type: "sync"; requestId: string; project: CourseProject }
  | { type: "run"; requestId: string; project: CourseProject }
  | { type: "stop"; requestId: string }
  | { type: "reset"; requestId: string };

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
    };
