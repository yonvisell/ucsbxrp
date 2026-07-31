import type { CourseProject, TargetEvent } from "./types";

export type TargetWorkerCommand =
  | { type: "connect"; requestId: string }
  | { type: "disconnect" }
  | { type: "prepare-run"; requestId: string }
  | {
      type: "runtime-message";
      runId: number;
      message: RuntimeWorkerMessage;
    }
  | { type: "run-owner-heartbeat"; runId: number }
  | { type: "stop"; requestId: string }
  | { type: "reset"; requestId: string };

export type TargetWorkerMessage =
  | { type: "event"; event: TargetEvent }
  | { type: "terminate-runtime"; runId: number }
  | {
      type: "response";
      requestId: string;
      ok: true;
      result?: { runId: number };
    }
  | {
      type: "response";
      requestId: string;
      ok: false;
      error: string;
    };

export interface RuntimeWorkerRequest {
  mode: "check" | "run";
  project: CourseProject;
}

export type RuntimeWorkerMessage =
  | { type: "runtime-ready"; version: string }
  | { type: "effort"; side: "left" | "right"; effort: number }
  | { type: "console"; stream: "stdout" | "stderr"; line: string }
  | { type: "check-complete"; detail: string }
  | { type: "run-complete" }
  | { type: "error"; detail: string };
