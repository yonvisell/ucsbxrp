import type {
  SimulationScenario,
  XrpSimulatorState,
} from "@ucsb-xrp/simulator";

import type {
  CourseProject,
  RuntimeParameterValue,
  RuntimeState,
  SynchronizedProject,
  TargetEvent,
} from "./types";

export type TargetWorkerCommand =
  | { type: "connect"; requestId: string }
  | { type: "disconnect" }
  | {
      type: "prepare-run";
      requestId: string;
      project?: CourseProject;
      descriptor?: SynchronizedProject;
    }
  | {
      type: "store-project";
      requestId: string;
      project: CourseProject;
      descriptor: SynchronizedProject;
    }
  | {
      type: "mark-project-stale";
      requestId: string;
      revision: string;
    }
  | {
      type: "set-scenario";
      requestId: string;
      scenario: SimulationScenario;
    }
  | {
      type: "runtime-message";
      runId: number;
      message: RuntimeWorkerMessage;
    }
  | { type: "run-owner-heartbeat"; runId: number }
  | {
      type: "set-runtime-parameter";
      requestId: string;
      name: string;
      value: RuntimeParameterValue;
    }
  | { type: "stop"; requestId: string }
  | { type: "reset"; requestId: string };

export type TargetWorkerMessage =
  | { type: "event"; event: TargetEvent }
  | { type: "terminate-runtime"; runId: number }
  | {
      type: "apply-runtime-parameter";
      runId: number;
      slot: number;
      encoded: number;
    }
  | {
      type: "response";
      requestId: string;
      ok: true;
      result?: {
        runId?: number;
        scenario?: SimulationScenario;
        project?: CourseProject;
        descriptor?: SynchronizedProject;
      };
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
  scenario?: SimulationScenario;
  liveParameterBuffer?: SharedArrayBuffer;
}

export type RuntimeWorkerMessage =
  | { type: "runtime-ready"; version: string }
  | { type: "effort"; side: "left" | "right"; effort: number }
  | { type: "simulator-state"; state: XrpSimulatorState }
  | { type: "console"; stream: "stdout" | "stderr"; line: string }
  | { type: "check-complete"; detail: string }
  | { type: "run-complete" }
  | {
      type: "runtime-state";
      state: RuntimeState;
      slots: Record<string, number>;
    }
  | { type: "error"; detail: string };
