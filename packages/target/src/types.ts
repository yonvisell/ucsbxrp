export interface CourseProject {
  files: Record<string, string>;
  entrypoint: string;
  name?: string;
}

export interface SynchronizedProject {
  name: string;
  entrypoint: string;
  revision: string;
  stale: boolean;
}

export interface ProjectRunSnapshot {
  projectId: string;
  revision: number;
  project: CourseProject;
}

export type ProjectRunProvider = () => ProjectRunSnapshot;

export interface ProjectRevisionNotice {
  projectId: string;
  revision: number;
  name: string;
  entrypoint: string;
}

export interface CheckResult {
  ok: boolean;
  detail: string;
  output?: string[];
}

export type RuntimeParameterValue = number | boolean | string;
export type RuntimeParameterKind = "number" | "toggle" | "choice";

export interface RuntimeParameter {
  name: string;
  label: string;
  kind: RuntimeParameterKind;
  value: RuntimeParameterValue;
  pendingValue?: RuntimeParameterValue;
  unit?: string;
  minimum?: number;
  maximum?: number;
  step?: number;
  options?: string[];
}

export interface RuntimeWatch {
  name: string;
  label: string;
  value: RuntimeParameterValue;
  unit?: string;
}

export interface RuntimePlot {
  name: string;
  label: string;
  value: number;
  unit?: string;
}

export interface RuntimeState {
  revision: number;
  parameters: RuntimeParameter[];
  watches: RuntimeWatch[];
  plots: RuntimePlot[];
}

export type TargetRunState =
  "disconnected" | "connecting" | "loading" | "ready" | "running" | "error";

/**
 * Machine-readable context for one target console event. The same
 * event may be replayed when another app tab opens; consumers must use
 * `eventId`, rather than the displayed text, to recognize that replay.
 */
export interface TargetConsoleMetadata {
  eventId?: string;
  timestampMs?: number;
  targetTimeMs?: number;
  action?:
    | "connect"
    | "validate"
    | "prepare"
    | "flash"
    | "run"
    | "stop"
    | "reset"
    | "parameter"
    | "telemetry";
  phase?: "request" | "result" | "error" | "output";
  requestId?: string;
}

export interface TelemetrySample {
  tMs: number;
  seq: number;
  source: "virtual" | "physical";
  /**
   * Compatibility pose used by existing Monitor releases. It is simulator
   * ground truth for the virtual XRP and student odometry for a physical XRP.
   * New views should use the explicit pose channels below.
   */
  poseAvailable: boolean;
  xMm: number;
  yMm: number;
  headingRad: number;
  estimatedPoseAvailable?: boolean;
  estimatedXmm?: number | null;
  estimatedYmm?: number | null;
  estimatedHeadingRad?: number | null;
  groundTruthPoseAvailable?: boolean;
  groundTruthXmm?: number | null;
  groundTruthYmm?: number | null;
  groundTruthHeadingRad?: number | null;
  requestedForwardSpeedMmS?: number | null;
  requestedTurnRateRadS?: number | null;
  targetLeftWheelSpeedMmS?: number | null;
  targetRightWheelSpeedMmS?: number | null;
  leftEffort: number;
  rightEffort: number;
  leftWheelSpeedMmS: number;
  rightWheelSpeedMmS: number;
  leftWheelDistanceMm?: number | null;
  rightWheelDistanceMm?: number | null;
  plotValues?: RuntimePlot[];
  leftEncoderCount: number;
  rightEncoderCount: number;
  collision: boolean;
  rangeMm: number | null;
  buttonPressed: boolean;
  accelerationMg: [number, number, number] | null;
  angularRateMdps: [number, number, number] | null;
  temperatureC: number | null;
  batteryV: number | null;
  sensorError: string | null;
}

export type TargetEvent =
  | {
      type: "status";
      state: TargetRunState;
      detail: string;
    }
  | {
      type: "telemetry";
      sample: TelemetrySample;
    }
  | {
      type: "project";
      project: SynchronizedProject | null;
    }
  | {
      type: "project-provider";
      active: boolean;
      available: boolean;
    }
  | {
      type: "runtime";
      state: RuntimeState;
    }
  | {
      type: "world";
      catalog: WorldCatalog;
      selectedWorldId: string;
    }
  | {
      type: "physical-network";
      mode: "access_point" | "station";
      address: string;
      ssid?: string;
      requestedMode?: "access_point" | "station";
      fallback?: boolean;
      robotId?: string;
      hostname?: string;
    }
  | ({
      type: "console";
      stream: "stdout" | "stderr" | "system";
      line: string;
    } & TargetConsoleMetadata);

export interface TargetClient {
  readonly kind: "virtual" | "physical";
  connect(): Promise<void>;
  disconnect(): void;
  check(project: CourseProject): Promise<CheckResult>;
  synchronize(project: CourseProject): Promise<void>;
  run(project: CourseProject): Promise<void>;
  runCurrent(): Promise<void>;
  setProjectRunProvider(
    provider: ProjectRunProvider | null,
    options?: { takeover?: boolean },
  ): void;
  markProjectChanged(project: ProjectRevisionNotice): void;
  markProjectStale(project: CourseProject): Promise<void>;
  stop(): Promise<void>;
  reset(): Promise<void>;
  setRuntimeParameter(
    name: string,
    value: RuntimeParameterValue,
  ): Promise<void>;
  setSimulationScenario?(scenario: SimulationScenario): Promise<void>;
  subscribe(listener: (event: TargetEvent) => void): () => void;
}
import type { SimulationScenario } from "@ucsb-xrp/simulator";
import type { WorldCatalog } from "@ucsb-xrp/simulator";
