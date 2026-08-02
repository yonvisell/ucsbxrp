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

export interface CheckResult {
  ok: boolean;
  detail: string;
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

export interface RuntimeState {
  revision: number;
  parameters: RuntimeParameter[];
  watches: RuntimeWatch[];
}

export type TargetRunState =
  "disconnected" | "connecting" | "loading" | "ready" | "running" | "error";

export interface TelemetrySample {
  tMs: number;
  seq: number;
  source: "virtual" | "physical";
  poseAvailable: boolean;
  xMm: number;
  yMm: number;
  headingRad: number;
  leftEffort: number;
  rightEffort: number;
  leftWheelSpeedMmS: number;
  rightWheelSpeedMmS: number;
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
      type: "runtime";
      state: RuntimeState;
    }
  | {
      type: "console";
      stream: "stdout" | "stderr" | "system";
      line: string;
    };

export interface TargetClient {
  readonly kind: "virtual" | "physical";
  connect(): Promise<void>;
  disconnect(): void;
  check(project: CourseProject): Promise<CheckResult>;
  synchronize(project: CourseProject): Promise<void>;
  run(project: CourseProject): Promise<void>;
  runCurrent(): Promise<void>;
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
