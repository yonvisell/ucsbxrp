import type {
  SimulationScenario,
  WorldDefinition,
  XrpSimulatorState,
} from "@ucsb-xrp/simulator";

import type {
  CourseProject,
  ProjectRevisionNotice,
  RuntimeParameterValue,
  RuntimeState,
  SynchronizedProject,
  TargetEvent,
} from "./types";
import type {
  ProjectRunSnapshotRequest,
  ProjectRunSnapshotResponse,
} from "./project-run-provider";

export interface CourseTelemetryState {
  estimatedXmm: number;
  estimatedYmm: number;
  estimatedHeadingRad: number;
  measuredLeftWheelSpeedMmS: number;
  measuredRightWheelSpeedMmS: number;
  measuredLeftWheelDistanceMm: number;
  measuredRightWheelDistanceMm: number;
  requestedForwardSpeedMmS: number | null;
  requestedTurnRateRadS: number | null;
  targetLeftWheelSpeedMmS: number | null;
  targetRightWheelSpeedMmS: number | null;
}

export type TargetWorkerRole = "ide" | "monitor";
export type WorkerTelemetryEvent = Extract<TargetEvent, { type: "telemetry" }>;

export type TargetWorkerCommand =
  | {
      type: "connect";
      requestId: string;
      providesProject?: boolean;
      role?: TargetWorkerRole;
    }
  | { type: "disconnect" }
  | {
      type: "set-project-run-provider";
      providesProject: boolean;
      takeover?: boolean;
    }
  | { type: "mark-project-changed"; project: ProjectRevisionNotice }
  | ProjectRunSnapshotResponse
  | {
      type: "publish-console";
      event: Extract<TargetEvent, { type: "console" }>;
    }
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
      project: CourseProject;
      descriptor: SynchronizedProject;
    }
  | { type: "get-project"; requestId: string }
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
  | { type: "telemetry-batch"; events: readonly WorkerTelemetryEvent[] }
  | ProjectRunSnapshotRequest
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
        world?: WorldDefinition;
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
  mode: "check" | "test" | "run";
  project: CourseProject;
  scenario?: SimulationScenario;
  world?: WorldDefinition;
  liveParameterBuffer?: SharedArrayBuffer;
}

export type RuntimeWorkerMessage =
  | { type: "runtime-ready"; version: string }
  | { type: "compile-complete"; detail: string }
  | { type: "effort"; side: "left" | "right"; effort: number }
  | { type: "simulator-state"; state: XrpSimulatorState }
  | { type: "course-state"; state: CourseTelemetryState }
  | { type: "console"; stream: "stdout" | "stderr"; line: string }
  | { type: "check-complete"; detail: string }
  | { type: "test-complete"; detail: string }
  | { type: "run-complete" }
  | {
      type: "runtime-state";
      state: RuntimeState;
      slots: Record<string, number>;
    }
  | { type: "error"; detail: string; stage?: "compile" | "run" };
