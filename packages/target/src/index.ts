export {
  PhysicalTargetClient,
  PhysicalTargetError,
  normalizePhysicalEndpoint,
} from "./physical-target";
export type { PhysicalTargetOptions } from "./physical-target";
export {
  SIMULATION_SCENARIOS,
  simulatorConfigForScenario,
} from "@ucsb-xrp/simulator";
export type { SimulationScenario } from "@ucsb-xrp/simulator";
export {
  TelemetryRecorder,
  telemetryRecordingToCsv,
} from "./telemetry-recording";
export type { TelemetryRecordingSnapshot } from "./telemetry-recording";
export {
  millidegreesPerSecondToRadiansPerSecond,
  milligravityToMetersPerSecondSquared,
} from "./telemetry-units";
export { VirtualTargetClient } from "./virtual-target";
export {
  COURSE_STARTERS,
  STAGE_ONE_PROJECT,
  courseStarter,
} from "./course-project";
export type { CourseStarter } from "./course-project";
export {
  DEFAULT_TARGET_PREFERENCE,
  TARGET_PREFERENCE_KEY,
  loadTargetPreference,
  storeTargetPreference,
} from "./target-preference";
export type { TargetKind, TargetPreference } from "./target-preference";
export type {
  CheckResult,
  CourseProject,
  TargetClient,
  TargetEvent,
  TargetRunState,
  TelemetrySample,
} from "./types";
