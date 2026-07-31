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

export const STAGE_ONE_PROJECT: CourseProject = {
  entrypoint: "main.py",
  files: {
    "main.py": `from time import sleep_ms
from ucsb_xrp import MotorEfforts, RobotConfig, XRPBot

bot = XRPBot(RobotConfig(max_effort=0.65))
print("Virtual XRP ready")

try:
    # Challenge 1 fixed-effort test: -1 reverse, 0 stop, +1 forward.
    test_efforts = MotorEfforts(0.58, 0.52)
    bot.set_efforts(test_efforts)
    print("Applying normalized {}".format(test_efforts))
    sleep_ms(1800)
finally:
    bot.stop()

print("Virtual run complete")
`,
  },
};
