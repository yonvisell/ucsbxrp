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
export {
  BROWSER_SYNTAX_CHECK_TIMEOUT_MS,
  checkCourseProjectSyntax,
} from "./browser-syntax-check";
export {
  MAX_PYTHON_DIAGNOSTIC_COLUMN,
  MAX_PYTHON_DIAGNOSTIC_LINE,
  MAX_PYTHON_DIAGNOSTIC_MESSAGE_CHARACTERS,
  MAX_PYTHON_DIAGNOSTIC_RAW_LINE_CHARACTERS,
  MAX_PYTHON_DIAGNOSTIC_RAW_LINES,
  parseMicroPythonDiagnostics,
  studentFacingMicroPythonError,
} from "./micropython-error";
export type { ParseMicroPythonDiagnosticOptions } from "./micropython-error";
export { describeProject, projectRevision } from "./project-identity";
export {
  MAX_PORTABLE_FILE_BYTES,
  MAX_PORTABLE_PROJECT_BYTES,
  MAX_PORTABLE_PROJECT_FILES,
  MAX_PORTABLE_PROJECT_PATH_CHARACTERS,
  PortableProjectError,
  portableProjectError,
  validatePortableProject,
} from "./project-validation";
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
  XRP_ACCESS_POINT_ENDPOINT,
  physicalEndpointCandidates,
  targetPreferenceForCommissionedRobot,
  targetPreferenceForConfiguredNetwork,
  targetPreferenceForPhysicalNetwork,
} from "./target-preference";
export type {
  PhysicalNetworkObservation,
  PhysicalConnectionMode,
  RobotProfile,
  TargetKind,
} from "./target-preference";
export type {
  CheckResult,
  CourseProject,
  ProjectRunProvider,
  ProjectRunSnapshot,
  ProjectRevisionNotice,
  PythonDiagnostic,
  PythonDiagnosticPosition,
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
