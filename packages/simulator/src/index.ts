export interface Pose2d {
  xMm: number;
  yMm: number;
  headingRad: number;
}

export interface XrpSimulatorConfig {
  fixedStepMs: number;
  wheelDiameterMm: number;
  trackWidthMm: number;
  encoderCountsPerRevolution: number;
  maximumWheelSpeedMmS: number;
  motorTimeConstantS: number;
  leftStartEffort: number;
  rightStartEffort: number;
  leftResponseScale: number;
  rightResponseScale: number;
}

export interface XrpSimulatorState {
  tMs: number;
  seq: number;
  pose: Pose2d;
  leftEffort: number;
  rightEffort: number;
  leftWheelSpeedMmS: number;
  rightWheelSpeedMmS: number;
  leftEncoderCount: number;
  rightEncoderCount: number;
  collision: boolean;
}

export const DEFAULT_XRP_SIMULATOR_CONFIG: XrpSimulatorConfig = {
  fixedStepMs: 20,
  wheelDiameterMm: 60,
  trackWidthMm: 155,
  encoderCountsPerRevolution: 585,
  maximumWheelSpeedMmS: Math.PI * 60 * 1.5,
  motorTimeConstantS: 0.18,
  leftStartEffort: 0.12,
  rightStartEffort: 0.13,
  leftResponseScale: 1,
  rightResponseScale: 0.97,
};

const stoppedWheelSpeedMmS = 0.01;

function clamp(value: number, lower: number, upper: number): number {
  return Math.max(lower, Math.min(upper, value));
}

function wrapAngle(angleRad: number): number {
  const wrapped =
    (((angleRad + Math.PI) % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
  return wrapped - Math.PI;
}

function targetWheelSpeed(
  effort: number,
  startEffort: number,
  responseScale: number,
  maximumWheelSpeedMmS: number,
): number {
  const magnitude = Math.abs(clamp(effort, -1, 1));
  if (magnitude <= startEffort) {
    return 0;
  }
  const movingFraction = (magnitude - startEffort) / (1 - startEffort);
  return (
    Math.sign(effort) * movingFraction * responseScale * maximumWheelSpeedMmS
  );
}

export class XrpSimulator {
  readonly config: XrpSimulatorConfig;
  private leftDistanceMm = 0;
  private rightDistanceMm = 0;
  private currentState: XrpSimulatorState;

  constructor(config: Partial<XrpSimulatorConfig> = {}) {
    this.config = { ...DEFAULT_XRP_SIMULATOR_CONFIG, ...config };
    this.currentState = this.initialState();
  }

  get state(): XrpSimulatorState {
    return {
      ...this.currentState,
      pose: { ...this.currentState.pose },
    };
  }

  reset(pose: Pose2d = { xMm: 0, yMm: 0, headingRad: 0 }): XrpSimulatorState {
    this.leftDistanceMm = 0;
    this.rightDistanceMm = 0;
    this.currentState = {
      ...this.initialState(),
      pose: { ...pose, headingRad: wrapAngle(pose.headingRad) },
    };
    return this.state;
  }

  setMotorEffort(side: "left" | "right", effort: number): void {
    const bounded = clamp(Number.isFinite(effort) ? effort : 0, -1, 1);
    if (side === "left") {
      this.currentState.leftEffort = bounded;
    } else {
      this.currentState.rightEffort = bounded;
    }
  }

  stop(): void {
    this.currentState.leftEffort = 0;
    this.currentState.rightEffort = 0;
  }

  step(stepMs = this.config.fixedStepMs): XrpSimulatorState {
    if (!(stepMs > 0)) {
      throw new Error("Simulator step must be positive");
    }
    const dtS = stepMs / 1000;
    const leftTarget = targetWheelSpeed(
      this.currentState.leftEffort,
      this.config.leftStartEffort,
      this.config.leftResponseScale,
      this.config.maximumWheelSpeedMmS,
    );
    const rightTarget = targetWheelSpeed(
      this.currentState.rightEffort,
      this.config.rightStartEffort,
      this.config.rightResponseScale,
      this.config.maximumWheelSpeedMmS,
    );
    const response = 1 - Math.exp(-dtS / this.config.motorTimeConstantS);
    let leftSpeed =
      this.currentState.leftWheelSpeedMmS +
      response * (leftTarget - this.currentState.leftWheelSpeedMmS);
    let rightSpeed =
      this.currentState.rightWheelSpeedMmS +
      response * (rightTarget - this.currentState.rightWheelSpeedMmS);
    if (leftTarget === 0 && Math.abs(leftSpeed) < stoppedWheelSpeedMmS) {
      leftSpeed = 0;
    }
    if (rightTarget === 0 && Math.abs(rightSpeed) < stoppedWheelSpeedMmS) {
      rightSpeed = 0;
    }
    const leftIncrementMm = leftSpeed * dtS;
    const rightIncrementMm = rightSpeed * dtS;
    this.leftDistanceMm += leftIncrementMm;
    this.rightDistanceMm += rightIncrementMm;

    const centerIncrementMm = (leftIncrementMm + rightIncrementMm) / 2;
    const headingIncrementRad =
      (rightIncrementMm - leftIncrementMm) / this.config.trackWidthMm;
    const pose = this.currentState.pose;
    let xMm = pose.xMm;
    let yMm = pose.yMm;

    if (Math.abs(headingIncrementRad) < 1e-12) {
      xMm += centerIncrementMm * Math.cos(pose.headingRad);
      yMm += centerIncrementMm * Math.sin(pose.headingRad);
    } else {
      const radiusMm = centerIncrementMm / headingIncrementRad;
      const nextHeading = pose.headingRad + headingIncrementRad;
      xMm += radiusMm * (Math.sin(nextHeading) - Math.sin(pose.headingRad));
      yMm -= radiusMm * (Math.cos(nextHeading) - Math.cos(pose.headingRad));
    }

    const millimetersPerCount =
      (Math.PI * this.config.wheelDiameterMm) /
      this.config.encoderCountsPerRevolution;
    this.currentState = {
      ...this.currentState,
      tMs: this.currentState.tMs + stepMs,
      seq: this.currentState.seq + 1,
      pose: {
        xMm,
        yMm,
        headingRad: wrapAngle(pose.headingRad + headingIncrementRad),
      },
      leftWheelSpeedMmS: leftSpeed,
      rightWheelSpeedMmS: rightSpeed,
      leftEncoderCount: Math.round(this.leftDistanceMm / millimetersPerCount),
      rightEncoderCount: Math.round(this.rightDistanceMm / millimetersPerCount),
    };
    return this.state;
  }

  private initialState(): XrpSimulatorState {
    return {
      tMs: 0,
      seq: 0,
      pose: { xMm: 0, yMm: 0, headingRad: 0 },
      leftEffort: 0,
      rightEffort: 0,
      leftWheelSpeedMmS: 0,
      rightWheelSpeedMmS: 0,
      leftEncoderCount: 0,
      rightEncoderCount: 0,
      collision: false,
    };
  }
}
