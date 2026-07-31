export interface CourseProject {
  files: Record<string, string>;
  entrypoint: string;
}

export interface CheckResult {
  ok: boolean;
  detail: string;
}

export type TargetRunState =
  "disconnected" | "connecting" | "loading" | "ready" | "running" | "error";

export interface TelemetrySample {
  tMs: number;
  seq: number;
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
      type: "console";
      stream: "stdout" | "stderr" | "system";
      line: string;
    };

export interface TargetClient {
  readonly kind: "virtual" | "physical";
  connect(): Promise<void>;
  disconnect(): void;
  check(project: CourseProject): Promise<CheckResult>;
  run(project: CourseProject): Promise<void>;
  stop(): Promise<void>;
  reset(): Promise<void>;
  subscribe(listener: (event: TargetEvent) => void): () => void;
}
