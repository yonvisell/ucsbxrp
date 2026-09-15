import type {
  SimulationScenario,
  WorldDefinition,
  XrpSimulatorState,
} from "@ucsb-xrp/simulator";

import type {
  CourseProject,
  ProjectRevisionNotice,
  PythonDiagnostic,
  RuntimeParameterValue,
  RuntimePlot,
  RuntimeState,
  SynchronizedProject,
  TargetEvent,
  TelemetryObservationKind,
  TelemetryTiming,
} from "./types";
import type {
  ProjectRunSnapshotRequest,
  ProjectRunSnapshotResponse,
} from "./project-run-provider";

export interface CourseTelemetryState {
  /** Source publication identity/time; neither implies sensor acquisition. */
  publicationSeq?: number;
  publishedAtMs?: number;
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
  plotValues?: RuntimePlot[];
  timing?: TelemetryTiming;
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
  | { type: "set-role"; role: TargetWorkerRole }
  | { type: "reserve-run"; requestId: string }
  | { type: "cancel-run"; requestId: string; operationEpoch: number }
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
      operationEpoch?: number;
      project?: CourseProject;
      descriptor?: SynchronizedProject;
      projectId?: string;
    }
  | {
      type: "store-project";
      requestId: string;
      project: CourseProject;
      descriptor: SynchronizedProject;
      projectId?: string;
    }
  | {
      type: "mark-project-stale";
      requestId: string;
      project: CourseProject;
      descriptor: SynchronizedProject;
      projectId?: string;
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
        operationEpoch?: number;
        scenario?: SimulationScenario;
        world?: WorldDefinition;
        project?: CourseProject;
        projectId?: string;
        storedProjectId?: string;
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
  cancellationBuffer?: SharedArrayBuffer;
}

export type RuntimeWorkerMessage =
  | { type: "runtime-ready"; version: string }
  | {
      type: "compile-complete";
      detail: string;
      diagnostics?: PythonDiagnostic[];
    }
  | { type: "effort"; side: "left" | "right"; effort: number }
  | {
      type: "simulator-state";
      state: XrpSimulatorState;
      observationKind?: TelemetryObservationKind;
    }
  | { type: "course-state"; state: CourseTelemetryState }
  | { type: "sensor-acquisition"; timing: TelemetryTiming }
  | { type: "console"; stream: "stdout" | "stderr"; line: string }
  | {
      type: "console-batch";
      lines: { stream: "stdout" | "stderr"; line: string }[];
      omitted: number;
    }
  | {
      type: "check-complete";
      detail: string;
      diagnostics?: PythonDiagnostic[];
    }
  | { type: "test-complete"; detail: string }
  | { type: "run-complete" }
  | {
      type: "runtime-state";
      state: RuntimeState;
      slots: Record<string, number>;
    }
  | {
      type: "error";
      detail: string;
      reason?: "memory-limit";
      /** Exact runtime exception text before student-facing presentation. */
      rawDetail?: string;
      stage?: "compile" | "run";
      diagnostics?: PythonDiagnostic[];
    };
