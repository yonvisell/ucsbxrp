import {
  COURSE_ARENA_BOUNDS,
  DEFAULT_WORLD_CATALOG,
  worldById,
  type AxisAlignedRectangle,
  type WorldDefinition,
} from "./world";

export {
  COURSE_ARENA_BOUNDS,
  DEFAULT_WORLD_CATALOG,
  parseWorldCatalog,
  worldById,
} from "./world";
export type {
  AxisAlignedRectangle,
  WorldCatalog,
  WorldDefinition,
  WorldMarker,
  WorldObstacle,
} from "./world";

export interface Pose2d {
  xMm: number;
  yMm: number;
  headingRad: number;
}

export interface Point2d {
  xMm: number;
  yMm: number;
}

// SparkFun XRP / HC-SR04 geometry, expressed in millimeters and radians.
// The 70 mm acoustic origin is 26.25 mm behind the 192.5 mm chassis nose.
export const XRP_CHASSIS_LENGTH_MM = 192.5;
export const XRP_ULTRASONIC_SENSOR_OFFSET_MM = 70;
export const XRP_ULTRASONIC_FIELD_OF_VIEW_DEG = 15;
export const XRP_ULTRASONIC_FIELD_OF_VIEW_RAD = Math.PI / 12;
export const XRP_ULTRASONIC_RAY_COUNT = 9;

export const XRP_ULTRASONIC_RAY_OFFSETS_RAD: readonly number[] = Object.freeze(
  Array.from({ length: XRP_ULTRASONIC_RAY_COUNT }, (_, index) => {
    const fraction = index / (XRP_ULTRASONIC_RAY_COUNT - 1);
    return (fraction - 0.5) * XRP_ULTRASONIC_FIELD_OF_VIEW_RAD;
  }),
);

export function ultrasonicSensorOrigin(
  pose: Pose2d,
  offsetMm = XRP_ULTRASONIC_SENSOR_OFFSET_MM,
): Point2d {
  return {
    xMm: pose.xMm + offsetMm * Math.cos(pose.headingRad),
    yMm: pose.yMm + offsetMm * Math.sin(pose.headingRad),
  };
}

export type SimulationScenario = string;

export const SIMULATION_SCENARIOS: Readonly<
  Record<
    SimulationScenario,
    { label: string; obstacles: readonly AxisAlignedRectangle[] }
  >
> = Object.freeze({
  open: Object.freeze({ label: "Course arena", obstacles: Object.freeze([]) }),
  "delivery-gate-blocked": Object.freeze({
    label: "Delivery gate blocked",
    obstacles: Object.freeze([
      Object.freeze({
        minimumXmm: 350,
        minimumYmm: -100,
        maximumXmm: 450,
        maximumYmm: 100,
      }),
    ]),
  }),
});

export function simulatorConfigForScenario(
  scenario: SimulationScenario = "open",
): Partial<XrpSimulatorConfig> {
  return simulatorConfigForWorld(defaultWorld(scenario));
}

export function simulatorConfigForWorld(
  world: WorldDefinition,
): Partial<XrpSimulatorConfig> {
  return {
    worldBounds: world.bounds,
    obstacles: world.obstacles,
  };
}

export function defaultWorld(scenario: SimulationScenario = "open") {
  return worldById(DEFAULT_WORLD_CATALOG, scenario);
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
  robotRadiusMm: number;
  rangeSensorOffsetMm: number;
  maximumRangeMm: number;
  batteryV: number;
  temperatureC: number;
  worldBounds: AxisAlignedRectangle;
  obstacles: readonly AxisAlignedRectangle[];
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
  rangeMm: number | null;
  buttonPressed: boolean;
  accelerationMg: [number, number, number];
  angularRateMdps: [number, number, number];
  temperatureC: number;
  batteryV: number;
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
  robotRadiusMm: 85,
  rangeSensorOffsetMm: XRP_ULTRASONIC_SENSOR_OFFSET_MM,
  maximumRangeMm: 2000,
  batteryV: 6.2,
  temperatureC: 27,
  worldBounds: COURSE_ARENA_BOUNDS,
  obstacles: [],
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

function validRectangle(rectangle: AxisAlignedRectangle): boolean {
  return (
    Number.isFinite(rectangle.minimumXmm) &&
    Number.isFinite(rectangle.minimumYmm) &&
    Number.isFinite(rectangle.maximumXmm) &&
    Number.isFinite(rectangle.maximumYmm) &&
    rectangle.maximumXmm > rectangle.minimumXmm &&
    rectangle.maximumYmm > rectangle.minimumYmm
  );
}

function pointInsideExpandedRectangle(
  xMm: number,
  yMm: number,
  rectangle: AxisAlignedRectangle,
  expansionMm: number,
): boolean {
  return (
    xMm >= rectangle.minimumXmm - expansionMm &&
    xMm <= rectangle.maximumXmm + expansionMm &&
    yMm >= rectangle.minimumYmm - expansionMm &&
    yMm <= rectangle.maximumYmm + expansionMm
  );
}

function rayRectangleDistance(
  originX: number,
  originY: number,
  directionX: number,
  directionY: number,
  rectangle: AxisAlignedRectangle,
): number | null {
  let entry = -Infinity;
  let exit = Infinity;
  const axes: readonly [number, number, number, number][] = [
    [originX, directionX, rectangle.minimumXmm, rectangle.maximumXmm],
    [originY, directionY, rectangle.minimumYmm, rectangle.maximumYmm],
  ];
  for (const [origin, direction, minimum, maximum] of axes) {
    if (Math.abs(direction) < 1e-12) {
      if (origin < minimum || origin > maximum) {
        return null;
      }
      continue;
    }
    const first = (minimum - origin) / direction;
    const second = (maximum - origin) / direction;
    entry = Math.max(entry, Math.min(first, second));
    exit = Math.min(exit, Math.max(first, second));
    if (exit < entry) {
      return null;
    }
  }
  if (exit < 0) {
    return null;
  }
  return entry >= 0 ? entry : exit;
}

export class XrpSimulator {
  readonly config: XrpSimulatorConfig;
  private leftDistanceMm = 0;
  private rightDistanceMm = 0;
  private previousCenterSpeedMmS = 0;
  private currentState: XrpSimulatorState;

  constructor(config: Partial<XrpSimulatorConfig> = {}) {
    this.config = {
      ...DEFAULT_XRP_SIMULATOR_CONFIG,
      ...config,
      worldBounds: {
        ...DEFAULT_XRP_SIMULATOR_CONFIG.worldBounds,
        ...config.worldBounds,
      },
      obstacles: (
        config.obstacles ?? DEFAULT_XRP_SIMULATOR_CONFIG.obstacles
      ).map((obstacle) => ({ ...obstacle })),
    };
    if (!validRectangle(this.config.worldBounds)) {
      throw new Error("Simulator world bounds must form a valid rectangle");
    }
    if (this.config.obstacles.some((obstacle) => !validRectangle(obstacle))) {
      throw new Error("Every simulator obstacle must form a valid rectangle");
    }
    this.currentState = this.initialState();
    this.updateRange();
  }

  get state(): XrpSimulatorState {
    return {
      ...this.currentState,
      pose: { ...this.currentState.pose },
      accelerationMg: [...this.currentState.accelerationMg],
      angularRateMdps: [...this.currentState.angularRateMdps],
    };
  }

  reset(pose: Pose2d = { xMm: 0, yMm: 0, headingRad: 0 }): XrpSimulatorState {
    this.leftDistanceMm = 0;
    this.rightDistanceMm = 0;
    this.previousCenterSpeedMmS = 0;
    this.currentState = {
      ...this.initialState(),
      pose: { ...pose, headingRad: wrapAngle(pose.headingRad) },
    };
    this.updateRange();
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

    const proposedPose = {
      xMm,
      yMm,
      headingRad: wrapAngle(pose.headingRad + headingIncrementRad),
    };
    const collision = !this.poseIsFree(proposedPose);
    const centerSpeedMmS = (leftSpeed + rightSpeed) / 2;
    const longitudinalAccelerationMmS2 =
      (centerSpeedMmS - this.previousCenterSpeedMmS) / dtS;
    this.previousCenterSpeedMmS = centerSpeedMmS;
    const millimetersPerCount =
      (Math.PI * this.config.wheelDiameterMm) /
      this.config.encoderCountsPerRevolution;

    this.currentState = {
      ...this.currentState,
      tMs: this.currentState.tMs + stepMs,
      seq: this.currentState.seq + 1,
      pose: collision ? pose : proposedPose,
      leftWheelSpeedMmS: leftSpeed,
      rightWheelSpeedMmS: rightSpeed,
      leftEncoderCount: Math.round(this.leftDistanceMm / millimetersPerCount),
      rightEncoderCount: Math.round(this.rightDistanceMm / millimetersPerCount),
      collision,
      accelerationMg: [longitudinalAccelerationMmS2 / 9.80665, 0, 1000],
      angularRateMdps: [
        0,
        0,
        ((rightSpeed - leftSpeed) / this.config.trackWidthMm) *
          (180 / Math.PI) *
          1000,
      ],
    };
    this.updateRange();
    return this.state;
  }

  private poseIsFree(pose: Pose2d): boolean {
    const bounds = this.config.worldBounds;
    const radius = this.config.robotRadiusMm;
    if (
      pose.xMm < bounds.minimumXmm + radius ||
      pose.xMm > bounds.maximumXmm - radius ||
      pose.yMm < bounds.minimumYmm + radius ||
      pose.yMm > bounds.maximumYmm - radius
    ) {
      return false;
    }
    return !this.config.obstacles.some((obstacle) =>
      pointInsideExpandedRectangle(pose.xMm, pose.yMm, obstacle, radius),
    );
  }

  private updateRange(): void {
    const pose = this.currentState.pose;
    const origin = ultrasonicSensorOrigin(
      pose,
      this.config.rangeSensorOffsetMm,
    );
    const distances: number[] = [];
    for (const offsetRad of XRP_ULTRASONIC_RAY_OFFSETS_RAD) {
      const headingRad = pose.headingRad + offsetRad;
      const directionX = Math.cos(headingRad);
      const directionY = Math.sin(headingRad);
      for (const obstacle of this.config.obstacles) {
        const distance = rayRectangleDistance(
          origin.xMm,
          origin.yMm,
          directionX,
          directionY,
          obstacle,
        );
        if (distance !== null && distance >= 0) {
          distances.push(distance);
        }
      }
      const boundaryDistance = rayRectangleDistance(
        origin.xMm,
        origin.yMm,
        directionX,
        directionY,
        this.config.worldBounds,
      );
      if (boundaryDistance !== null && boundaryDistance >= 0) {
        distances.push(boundaryDistance);
      }
    }
    const closest = distances.length > 0 ? Math.min(...distances) : Infinity;
    this.currentState.rangeMm =
      closest <= this.config.maximumRangeMm ? closest : null;
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
      rangeMm: null,
      buttonPressed: false,
      accelerationMg: [0, 0, 1000],
      angularRateMdps: [0, 0, 0],
      temperatureC: this.config.temperatureC,
      batteryV: this.config.batteryV,
    };
  }
}
