export {
  PhysicalTargetClient,
  PhysicalTargetError,
  localNetworkRequestInit,
  normalizePhysicalEndpoint,
} from "./physical-target";
export type { PhysicalTargetOptions } from "./physical-target";
export {
  SIMULATION_SCENARIOS,
  DEFAULT_WORLD_CATALOG,
  parseWorldCatalog,
  simulatorConfigForScenario,
  simulatorConfigForWorld,
  worldById,
} from "@ucsb-xrp/simulator";
export type {
  SimulationScenario,
  WorldCatalog,
  WorldDefinition,
  WorldMarker,
  WorldObstacle,
} from "@ucsb-xrp/simulator";
export { PROJECT_WORLD_FILE, worldCatalogForProject } from "./project-world";
export {
  TelemetryRecorder,
  telemetryRecordingToCsv,
} from "./telemetry-recording";
export type { TelemetryRecordingSnapshot } from "./telemetry-recording";
export {
  millidegreesPerSecondToRadiansPerSecond,
  milligravityToMetersPerSecondSquared,
} from "./telemetry-units";
export {
  VirtualTargetClient,
  testCourseProjectComponents,
} from "./virtual-target";
export { describeProject, projectRevision } from "./project-identity";
export {
  COURSE_PROJECT_TEMPLATES,
  COURSE_STARTERS,
  DEFAULT_COURSE_PROJECT,
  DEFAULT_COURSE_PROJECT_TEMPLATE_ID,
  STAGE_ONE_PROJECT,
  createNextChallengeProject,
  courseProjectTemplate,
  courseStarter,
  nextChallengeTemplate,
} from "./course-project";
export type {
  CourseComponentTemplate,
  CourseProjectKind,
  CourseProjectTemplate,
  CourseStarter,
} from "./course-project";
export {
  DEFAULT_TARGET_PREFERENCE,
  TARGET_PREFERENCE_KEY,
  XRP_ACCESS_POINT_ENDPOINT,
  loadTargetPreference,
  physicalEndpointCandidates,
  physicalEndpointForPreference,
  storeTargetPreference,
  targetPreferenceForPhysicalNetwork,
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
  RuntimePlot,
  RuntimeState,
  RuntimeWatch,
  SynchronizedProject,
  TargetClient,
  TargetConsoleMetadata,
  TargetEvent,
  TargetRunState,
  TelemetrySample,
} from "./types";
