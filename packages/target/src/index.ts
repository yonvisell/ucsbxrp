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
export { describeProject, projectRevision } from "./project-identity";
export {
  COURSE_PROJECT_TEMPLATES,
  COURSE_STARTERS,
  STAGE_ONE_PROJECT,
  courseProjectTemplate,
  courseStarter,
} from "./course-project";
export type {
  CourseProjectKind,
  CourseProjectTemplate,
  CourseStarter,
} from "./course-project";
export {
  DEFAULT_TARGET_PREFERENCE,
  TARGET_PREFERENCE_KEY,
  XRP_ACCESS_POINT_ENDPOINT,
  loadTargetPreference,
  physicalEndpointForPreference,
  storeTargetPreference,
} from "./target-preference";
export type {
  PhysicalConnectionMode,
  TargetKind,
  TargetPreference,
} from "./target-preference";
export type {
  CheckResult,
  CourseProject,
  RuntimeParameter,
  RuntimeParameterKind,
  RuntimeParameterValue,
  RuntimeState,
  RuntimeWatch,
  SynchronizedProject,
  TargetClient,
  TargetEvent,
  TargetRunState,
  TelemetrySample,
} from "./types";
