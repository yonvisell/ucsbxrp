import Editor, { type OnMount } from "@monaco-editor/react";
import {
  type CSSProperties,
  type ChangeEvent,
  type FormEvent,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  COURSE_PROJECT_TEMPLATES,
  DEFAULT_COURSE_PROJECT,
  PhysicalTargetClient,
  VirtualTargetClient,
  checkCourseProjectSyntax,
  describeChallengeProjectTransition,
  physicalEndpointCandidates,
  targetPreferenceForPhysicalNetwork,
  testCourseProjectComponents,
  type TargetClient,
  type TargetEvent,
  type TargetKind,
  type TargetRunState,
  type SynchronizedProject,
  type CourseProjectKind,
  type ChallengeTransition,
  type CheckResult,
  type PythonDiagnostic,
} from "@ucsb-xrp/target";

import { AppNavigation } from "../../shared/AppNavigation";
import { isEmbeddedApplication } from "../../shared/embedded-application";
import { ResetIcon, RunStopIcon } from "../../shared/HeaderIcons";
import { SplitWorkspaceLink } from "../../shared/SplitWorkspaceLink";
import { useTargetPreference } from "../../shared/use-target-preference";
import {
  DiagnosticLogWriter,
  diagnosticLogFileName,
} from "../../shared/diagnostic-log";
import {
  OFFLINE_SHELL_EVENT,
  readOfflineShellStatus,
  registerOfflineShellBeforeReload,
  retryPendingOfflineShellReload,
  virtualRunNeedsPreparation,
  type OfflineShellStatus,
} from "../../shared/offline-shell";
import courseRelease from "../../../vendor/current/release.json";
import type { AuthorDraftProject } from "../../shared/author-draft-handoff";
import { MarkdownPreview } from "./MarkdownPreview";
import { setCoursePythonProjectContext } from "./course-python-language";
import {
  chooseWorkspaceFolder,
  courseFolderPermission,
  forgetProjectFolder,
  forgetWorkspaceFolder,
  loadRememberedProjectFolder,
  loadRememberedWorkspaceFolder,
  loadWorkspaceManifest,
  rememberProjectFolder,
  replaceRememberedWorkspaceFolder,
  requireWorkingFolderParent,
  requestCourseFolderPermission,
} from "../../shared/course-folder";
import {
  createProjectFolder,
  defaultProject,
  defaultProjectFolderName,
  deleteProjectFile,
  duplicateProjectFile,
  ensureProjectFolder,
  hasProjectFolderMetadata,
  isDefaultProject,
  isCourseRepositoryFolder,
  listDirectProjectFolders,
  normalizedProjectPath,
  projectContentDigest,
  projectFilePathExists,
  projectPathError,
  projectFolderNameError,
  ProjectFolderConflictError,
  readProjectFolder,
  renameProjectFile,
  sameProjectContents,
  setProjectEntrypoint,
  suggestedDuplicatePath,
  suggestedProjectFolderName,
  supportsWorkingFolders,
  type CourseDirectoryHandle,
  type FolderReadResult,
  type ProjectFolderCandidate,
  type ProjectSnapshot,
} from "./project-files";
import {
  createProjectSession,
  markProjectSessionSaved,
  projectSessionHasUnsavedChanges,
  reconcileProjectSessions,
  snapshotForProjectSession,
  updateProjectSession,
  type ProjectSession,
} from "./project-session";
import { ProjectFolderPersistenceController } from "./project-folder-persistence";
import { presentPythonDiagnostic } from "./python-diagnostic-presentation";
import {
  ideReloadIsIdle,
  projectRevisionIdentity,
  projectRevisionIsReloadable,
} from "./ide-release-reload";
import {
  compilationIsFresh,
  forgetCompilation,
  rememberCompilation,
} from "./compilation-freshness";

interface ConsoleEntry {
  id: string;
  category: "program" | "service";
  stream: "stdout" | "stderr" | "system";
  line: string;
  timestampMs?: number;
}

type ConsoleTab = "status" | "problems" | "compiler" | "output" | "details";

interface CompilerTranscript {
  projectId: string;
  revision: number;
  ok: boolean;
  lines: string[];
}

interface IdeSettings {
  editorFontSize: number;
  consoleFontSize: number;
  projectRailWidth: number;
  tabSize: 2 | 4;
  wordWrap: "off" | "on";
  minimap: boolean;
}

type PathOperation = "rename" | "duplicate";

type ProjectCreationPurpose =
  "new-project" | "challenge-transition" | "save-current";

type WorkingFolderAccessState = "none" | "needs-permission" | "connected";

interface ProjectFolderConflictState {
  folderSession: ProjectSession;
  folderDigest: string;
}

const settingsKey = "ucsb-xrp-ide-settings-v2";
const completeChallengesPreferenceKey = "ucsb-xrp-show-complete-challenges-v1";
const maximumSessionLogEntries = 5_000;
const minimumProjectRailWidth = 160;
const maximumProjectRailWidth = 360;
const defaultProjectRailWidth = 200;

function clampProjectRailWidth(width: number): number {
  return Math.min(
    maximumProjectRailWidth,
    Math.max(minimumProjectRailWidth, Math.round(width)),
  );
}

function uniquePythonDiagnostics(
  diagnostics: readonly PythonDiagnostic[],
): PythonDiagnostic[] {
  const seen = new Set<string>();
  return diagnostics.filter((diagnostic) => {
    const key = JSON.stringify([
      diagnostic.phase,
      diagnostic.path ?? null,
      diagnostic.start?.line ?? null,
      diagnostic.start?.column ?? null,
      diagnostic.end?.line ?? null,
      diagnostic.end?.column ?? null,
      diagnostic.code ?? null,
      diagnostic.message,
    ]);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function storedCompleteChallengesPreference(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(completeChallengesPreferenceKey) === "1";
  } catch {
    return false;
  }
}

function formatConsoleTime(timestampMs: number | undefined): string {
  if (timestampMs === undefined) {
    return "";
  }
  return new Date(timestampMs).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

function consoleSourceLocation(
  line: string,
): { path: string; line: number; column: number } | null {
  const traceback = line.match(
    /^\s*File\s+["'](?:\/project\/|project\/)?([^"']+\.py)["'],\s*line\s+(\d+)/,
  );
  const compact = line.match(
    /^(?:\/project\/|project\/)?([^:\s]+\.py):(\d+)(?::(\d+))?:/,
  );
  const match = traceback ?? compact;
  if (!match) return null;
  const sourceLine = Number.parseInt(match[2] ?? "", 10);
  const sourceColumn = Number.parseInt(match[3] ?? "1", 10);
  if (!Number.isSafeInteger(sourceLine) || sourceLine < 1) return null;
  return {
    path: match[1]!,
    line: sourceLine,
    column:
      Number.isSafeInteger(sourceColumn) && sourceColumn > 0 ? sourceColumn : 1,
  };
}
const defaultSettings: IdeSettings = {
  editorFontSize: 10,
  consoleFontSize: 12,
  projectRailWidth: defaultProjectRailWidth,
  tabSize: 4,
  wordWrap: "off",
  minimap: false,
};
function loadSettings(): IdeSettings {
  try {
    const raw = localStorage.getItem(settingsKey);
    if (!raw) {
      return defaultSettings;
    }
    const value = JSON.parse(raw) as Partial<IdeSettings>;
    return {
      editorFontSize:
        typeof value.editorFontSize === "number" &&
        value.editorFontSize >= 8 &&
        value.editorFontSize <= 20
          ? value.editorFontSize
          : defaultSettings.editorFontSize,
      consoleFontSize:
        typeof value.consoleFontSize === "number" &&
        value.consoleFontSize >= 10 &&
        value.consoleFontSize <= 16
          ? value.consoleFontSize
          : defaultSettings.consoleFontSize,
      projectRailWidth:
        typeof value.projectRailWidth === "number" &&
        value.projectRailWidth >= minimumProjectRailWidth &&
        value.projectRailWidth <= maximumProjectRailWidth
          ? value.projectRailWidth
          : defaultSettings.projectRailWidth,
      tabSize: value.tabSize === 2 ? 2 : 4,
      wordWrap: value.wordWrap === "on" ? "on" : "off",
      minimap: value.minimap === true,
    };
  } catch {
    return defaultSettings;
  }
}

function errorDetail(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function ideSessionSummary(): string {
  const offline = readOfflineShellStatus();
  const navigatorWithCapabilities = navigator as Navigator & {
    userAgentData?: { platform?: string };
    locks?: unknown;
    serial?: unknown;
    standalone?: boolean;
  };
  const displayMode = navigatorWithCapabilities.standalone
    ? "standalone"
    : ((["fullscreen", "standalone", "minimal-ui"] as const).find(
        (mode) => window.matchMedia?.(`(display-mode: ${mode})`).matches,
      ) ?? "browser");
  return JSON.stringify({
    appBuild:
      offline.state === "development"
        ? "local-development"
        : (offline.version ?? courseRelease.application_version),
    courseRelease: courseRelease.release_id,
    route: window.location.pathname,
    browser: navigator.userAgent,
    operatingSystem:
      navigatorWithCapabilities.userAgentData?.platform ?? navigator.platform,
    language: navigator.language,
    displayMode,
    capabilities: {
      fileSystemAccess: "showDirectoryPicker" in window,
      secureContext: window.isSecureContext,
      crossOriginIsolated: globalThis.crossOriginIsolated,
      serviceWorker: {
        available: "serviceWorker" in navigator,
        controlled: Boolean(navigator.serviceWorker?.controller),
      },
      webLocks: Boolean(navigatorWithCapabilities.locks),
      webSerial: Boolean(navigatorWithCapabilities.serial),
    },
  });
}

function wasCancelled(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError";
}

function editorLanguage(path: string): string {
  if (path.endsWith(".py")) {
    return "python";
  }
  if (path.endsWith(".json")) {
    return "json";
  }
  if (path.endsWith(".md")) {
    return "markdown";
  }
  return "plaintext";
}

const contextHelpByFilename: Record<string, { href: string; label: string }> = {
  "sensor_model.py": {
    href: "../reference/#sensor-model",
    label: "SensorModel API",
  },
  "wheel_speed_controller.py": {
    href: "../reference/#wheel-speed-controller",
    label: "WheelSpeedController API",
  },
  "differential_drive.py": {
    href: "../reference/#differential-drive",
    label: "DifferentialDrive API",
  },
  "odometry.py": { href: "../reference/#odometry", label: "Odometry API" },
  "navigation_controller.py": {
    href: "../reference/#navigation-controller",
    label: "NavigationController API",
  },
  "grid_planner.py": {
    href: "../reference/#grid-planner",
    label: "GridPlanner API",
  },
  "robot_config.py": {
    href: "../reference/#configuration",
    label: "Configuration API",
  },
  "challenge.py": {
    href: "../guide/#project-structure",
    label: "Project structure",
  },
  "world.json": {
    href: "../reference/#worlds",
    label: "Project world reference",
  },
  "component_checks.py": {
    href: "../guide/#components",
    label: "Component check guide",
  },
  "student_work.py": {
    href: "../guide/#virtual-run",
    label: "Tutorial sequence",
  },
};

const tutorialHelpByTemplateId: Record<
  string,
  { href: string; label: string }
> = {
  micropython_tutorial: {
    href: "../guide/#virtual-run",
    label: "Tutorial path",
  },
  tutorial_virtual_drawing: {
    href: "../reference/#records",
    label: "Data types",
  },
  tutorial_robot_programs: {
    href: "../reference/#robot",
    label: "Robot service API",
  },
  tutorial_behavior_telemetry: {
    href: "../reference/#live",
    label: "Live controls and telemetry",
  },
  tutorial_physical_preflight: {
    href: "../guide/#physical-xrp",
    label: "Physical XRP setup",
  },
};

function contextHelpForPath(path: string, templateId?: string) {
  const filename = path.split("/").at(-1) ?? "";
  if (filename === "student_work.py" && templateId) {
    const tutorialHelp = tutorialHelpByTemplateId[templateId];
    if (tutorialHelp) return tutorialHelp;
  }
  return contextHelpByFilename[filename] ?? null;
}

const templateGroups: readonly {
  kind: CourseProjectKind;
  label: string;
}[] = [
  { kind: "challenge", label: "Course challenges" },
  { kind: "complete-challenge", label: "Complete challenge demonstrations" },
  { kind: "demo", label: "Robot demos" },
  { kind: "tutorial", label: "Tutorials" },
];

function openingPathForNewProject(project: ProjectSnapshot): string {
  const template = COURSE_PROJECT_TEMPLATES.find(
    (candidate) => candidate.id === project.templateId,
  );
  return (template?.kind === "challenge" ||
    template?.kind === "complete-challenge" ||
    template?.kind === "tutorial") &&
    "README.md" in project.files
    ? "README.md"
    : project.entrypoint;
}

function isTutorialProject(project: ProjectSnapshot): boolean {
  return COURSE_PROJECT_TEMPLATES.some(
    (template) =>
      template.id === project.templateId && template.kind === "tutorial",
  );
}

function newProjectPrefersVirtual(project: ProjectSnapshot): boolean {
  return COURSE_PROJECT_TEMPLATES.some(
    (template) =>
      template.id === project.templateId &&
      (template.kind === "tutorial" || template.kind === "complete-challenge"),
  );
}

function checkFileForProject(project: ProjectSnapshot): string | null {
  if ("component_checks.py" in project.files) return "component_checks.py";
  return null;
}

function initiallyShowProjectPanel(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) {
    return true;
  }
  return window.matchMedia("(min-width: 901px)").matches;
}

interface IdeAppProps {
  authorDraftProject?: AuthorDraftProject | null;
}

export function IdeApp({ authorDraftProject }: IdeAppProps) {
  const embeddedApplication = isEmbeddedApplication();
  const initialProjectSnapshot = useMemo<ProjectSnapshot>(
    () => authorDraftProject ?? defaultProject(),
    [authorDraftProject],
  );
  const initialProjectSession = useMemo(
    () =>
      createProjectSession(initialProjectSnapshot, {
        source: "browser-draft",
      }),
    [initialProjectSnapshot],
  );
  const initialProject = initialProjectSession.project;
  const [settings, setSettings] = useState<IdeSettings>(loadSettings);
  const [
    targetPreference,
    updateTargetPreference,
    targetPreferenceReady,
    targetPreferenceError,
  ] = useTargetPreference();
  const [connectionAttempt, setConnectionAttempt] = useState(0);
  const target = useMemo<TargetClient>(() => {
    if (targetPreference.kind !== "physical") return new VirtualTargetClient();
    const endpoints = physicalEndpointCandidates(targetPreference);
    return new PhysicalTargetClient(endpoints[0]!, {
      candidateEndpoints: endpoints.slice(1),
      expectedRobotId: targetPreference.robotId,
    });
  }, [
    targetPreference.kind,
    targetPreference.physicalConnection,
    targetPreference.stationEndpoint,
    targetPreference.accessPointEndpoint,
    targetPreference.robotId,
    targetPreference.hostname,
    connectionAttempt,
  ]);
  const virtualRuntimePreparing =
    target.kind === "virtual" &&
    virtualRunNeedsPreparation(
      import.meta.env.PROD,
      globalThis.crossOriginIsolated,
    );
  const [project, setProjectState] = useState<ProjectSnapshot>(initialProject);
  const [projectSession, setProjectSession] = useState<ProjectSession>(
    initialProjectSession,
  );
  const [projectSessionReady, setProjectSessionReady] = useState(false);
  const [activePath, setActivePath] = useState(initialProject.entrypoint);
  const [markdownPreviewOpen, setMarkdownPreviewOpen] = useState(
    initialProject.entrypoint.endsWith(".md"),
  );
  const [tutorialInstructionsOpen, setTutorialInstructionsOpen] = useState(
    isTutorialProject(initialProject),
  );
  const [workingFolder, setWorkingFolder] =
    useState<CourseDirectoryHandle | null>(null);
  const [workspaceFolder, setWorkspaceFolder] =
    useState<CourseDirectoryHandle | null>(null);
  const [rememberedWorkspaceFolder, setRememberedWorkspaceFolder] =
    useState<CourseDirectoryHandle | null>(null);
  const [workingFolderAccessState, setWorkingFolderAccessState] =
    useState<WorkingFolderAccessState>("none");
  const [rememberedFolder, setRememberedFolder] =
    useState<CourseDirectoryHandle | null>(null);
  const [rememberedFolderCanAttach, setRememberedFolderCanAttach] =
    useState(true);
  const [folderSaveState, setFolderSaveState] = useState<
    "browser" | "pending" | "saving" | "current" | "permission" | "error"
  >("browser");
  const [folderDirty, setFolderDirty] = useState(false);
  const [folderInteractionRevision, setFolderInteractionRevision] = useState(0);
  const [projectFolderConflict, setProjectFolderConflict] =
    useState<ProjectFolderConflictState | null>(null);
  const [operationDetail, setOperationDetail] = useState("");
  const [targetState, setTargetState] =
    useState<TargetRunState>("disconnected");
  const [targetDetail, setTargetDetail] = useState("Not connected");
  const [currentProject, setCurrentProject] =
    useState<SynchronizedProject | null>(null);
  const [projectProviderActive, setProjectProviderActive] = useState(false);
  const [projectProviderAvailable, setProjectProviderAvailable] =
    useState(false);
  const [checkDetail, setCheckDetail] = useState(
    "The current project has not been compiled.",
  );
  const [checkOk, setCheckOk] = useState<boolean | null>(null);
  const [pythonDiagnostics, setPythonDiagnostics] = useState<
    PythonDiagnostic[]
  >([]);
  const [compilerTranscript, setCompilerTranscript] =
    useState<CompilerTranscript | null>(null);
  const [projectCommandActive, setProjectCommandActive] = useState(false);
  const [syncDetail, setSyncDetail] = useState(
    "Run will load the current project into XRP memory.",
  );
  const [syncOk, setSyncOk] = useState<boolean | null>(null);
  const [consoleEntries, setConsoleEntries] = useState<ConsoleEntry[]>([]);
  const [consoleTab, setConsoleTab] = useState<ConsoleTab>("output");
  const [outputPanelOpen, setOutputPanelOpen] = useState(false);
  const [projectPanelOpen, setProjectPanelOpen] = useState(
    initiallyShowProjectPanel,
  );
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [showCompleteChallenges, setShowCompleteChallenges] = useState(
    storedCompleteChallengesPreference,
  );
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [newFileOpen, setNewFileOpen] = useState(false);
  const [newFilePath, setNewFilePath] = useState("");
  const [newFileError, setNewFileError] = useState("");
  const [componentCheckRunning, setComponentCheckRunning] = useState(false);
  const [newProjectOpen, setNewProjectOpen] = useState(false);
  const [projectChooserOpen, setProjectChooserOpen] = useState(false);
  const [projectChoices, setProjectChoices] = useState<
    ProjectFolderCandidate[]
  >([]);
  const [projectChooserLoading, setProjectChooserLoading] = useState(false);
  const [projectChooserError, setProjectChooserError] = useState("");
  const [openingProjectFolder, setOpeningProjectFolder] = useState<
    string | null
  >(null);
  const [newProjectDraft, setNewProjectDraft] = useState("");
  const [newProjectError, setNewProjectError] = useState("");
  const [pendingProject, setPendingProject] = useState<ProjectSnapshot | null>(
    null,
  );
  const [pendingChallengeTransition, setPendingChallengeTransition] =
    useState<ChallengeTransition | null>(null);
  const [projectCreationPurpose, setProjectCreationPurpose] =
    useState<ProjectCreationPurpose>("new-project");
  const [pathOperation, setPathOperation] = useState<PathOperation | null>(
    null,
  );
  const [pathDraft, setPathDraft] = useState("");
  const [pathOperationError, setPathOperationError] = useState("");
  const [fileActionsOpen, setFileActionsOpen] = useState(false);
  const [deletePath, setDeletePath] = useState<string | null>(null);
  const nextConsoleId = useRef(1);
  const diagnosticFolderRef = useRef<CourseDirectoryHandle | null>(null);
  const diagnosticStartedFoldersRef = useRef(new WeakSet<object>());
  const diagnosticWriteErrorShownRef = useRef(false);
  const diagnosticLog = useMemo(
    () =>
      new DiagnosticLogWriter({
        app: "IDE",
        courseRelease: courseRelease.release_id,
        onWriteError: (error) => {
          if (diagnosticWriteErrorShownRef.current) return;
          diagnosticWriteErrorShownRef.current = true;
          setConsoleEntries((entries) => {
            if (entries.some((entry) => entry.id === "ide-diagnostic-error")) {
              return entries;
            }
            return [
              ...entries.slice(-(maximumSessionLogEntries - 1)),
              {
                id: "ide-diagnostic-error",
                category: "service",
                stream: "stderr",
                line: `Troubleshooting log could not be written · ${error.message}`,
                timestampMs: Date.now(),
              },
            ];
          });
        },
      }),
    [],
  );
  const availableProjectTemplates = useMemo(
    () =>
      COURSE_PROJECT_TEMPLATES.filter(
        (template) =>
          template.kind !== "complete-challenge" || showCompleteChallenges,
      ),
    [showCompleteChallenges],
  );

  useEffect(() => {
    const synchronizePreference = (event: StorageEvent) => {
      if (event.key === completeChallengesPreferenceKey || event.key === null) {
        setShowCompleteChallenges(storedCompleteChallengesPreference());
      }
    };
    window.addEventListener("storage", synchronizePreference);
    return () => window.removeEventListener("storage", synchronizePreference);
  }, []);
  const initializedProjectEffect = useRef(false);
  const announcedProjectRevisionRef = useRef<{
    target: TargetClient;
    identity: string;
  } | null>(null);
  const projectRef = useRef(project);
  const projectSessionRef = useRef(projectSession);
  const preservedBrowserDraftRef = useRef<ProjectSnapshot | undefined>(
    undefined,
  );
  const [preservedBrowserDraft, setPreservedBrowserDraft] =
    useState<ProjectSnapshot | null>(null);
  const settingsDrawerRef = useRef<HTMLElement | null>(null);
  const fileActionsRef = useRef<HTMLDivElement | null>(null);
  const importInputRef = useRef<HTMLInputElement | null>(null);
  const editorRef = useRef<Parameters<OnMount>[0] | null>(null);
  const monacoRef = useRef<Parameters<OnMount>[1] | null>(null);
  const compileDecorationIdsRef = useRef<string[]>([]);
  const pendingEditorLocationRef = useRef<{
    path: string;
    line: number;
    column: number;
  } | null>(null);
  const projectVersion = useRef(0);
  const displayedProjectKey = useRef(
    `${initialProject.templateId ?? "custom"}:${initialProject.name}`,
  );

  useEffect(() => {
    const recordApplicationIdentity = (status: OfflineShellStatus) => {
      const appIdentity =
        status.state === "development"
          ? "local development"
          : status.version
            ? `app build ${status.version.slice(0, 12)}`
            : "app build pending";
      setConsoleEntries((entries) => [
        ...entries.filter((entry) => entry.id !== "ide-app-identity"),
        {
          id: "ide-app-identity",
          category: "service",
          stream: "system",
          line: `UCSBXRP ${appIdentity} · course ${courseRelease.release_id}`,
          timestampMs: Date.now(),
        },
      ]);
    };
    const handleOfflineState = (event: Event) => {
      recordApplicationIdentity(
        (event as CustomEvent<OfflineShellStatus>).detail,
      );
    };
    window.addEventListener(OFFLINE_SHELL_EVENT, handleOfflineState);
    recordApplicationIdentity(readOfflineShellStatus());
    return () =>
      window.removeEventListener(OFFLINE_SHELL_EVENT, handleOfflineState);
  }, []);

  useEffect(() => {
    if (!window.matchMedia) {
      return;
    }
    const narrowLayout = window.matchMedia("(max-width: 900px)");
    const adaptProjectPanel = (event: MediaQueryListEvent) => {
      setProjectPanelOpen(!event.matches);
    };
    narrowLayout.addEventListener("change", adaptProjectPanel);
    return () => narrowLayout.removeEventListener("change", adaptProjectPanel);
  }, []);
  const projectFolderHandleWriteRef = useRef<Promise<boolean>>(
    Promise.resolve(true),
  );
  const projectSessionReadyRef = useRef(false);
  const workingFolderRef = useRef<CourseDirectoryHandle | null>(null);
  const folderDirtyRef = useRef(false);
  const targetStateRef = useRef<TargetRunState>("disconnected");
  const projectProviderActiveRef = useRef(false);
  const targetCommandCountRef = useRef(0);
  const projectCommandActiveRef = useRef(false);
  const componentCheckRunningRef = useRef(false);
  const folderInteractionCountRef = useRef(0);
  const folderSaveStateRef = useRef(folderSaveState);
  const projectFolderPersistenceRef =
    useRef<ProjectFolderPersistenceController | null>(null);
  if (projectFolderPersistenceRef.current === null) {
    projectFolderPersistenceRef.current =
      new ProjectFolderPersistenceController({
        getCurrentSession: () => projectSessionRef.current,
        getProjectVersion: () => projectVersion.current,
        getWorkingFolder: () => workingFolderRef.current,
      });
  }
  const projectFolderPersistence = projectFolderPersistenceRef.current;

  projectSessionReadyRef.current = projectSessionReady;
  workingFolderRef.current = workingFolder;
  folderDirtyRef.current = folderDirty;
  targetStateRef.current = targetState;
  projectProviderActiveRef.current = projectProviderActive;
  folderSaveStateRef.current = folderSaveState;

  useEffect(() => {
    if (workspaceFolder === null || workingFolderAccessState !== "connected") {
      diagnosticFolderRef.current = null;
      diagnosticLog.detachWorkingFolder();
      return;
    }
    if (diagnosticFolderRef.current === workspaceFolder) return;

    diagnosticFolderRef.current = workspaceFolder;
    diagnosticLog.attachWorkingFolder(workspaceFolder);
    if (!diagnosticStartedFoldersRef.current.has(workspaceFolder)) {
      diagnosticStartedFoldersRef.current.add(workspaceFolder);
      diagnosticLog.record({
        event: "session.start",
        message: ideSessionSummary(),
        terminal: true,
      });
    }
    diagnosticLog.record({
      event: "working-folder.connected",
      message: `Working folder ${workspaceFolder.name} is writable.`,
    });
  }, [diagnosticLog, workingFolderAccessState, workspaceFolder]);

  useEffect(() => {
    const recordWindowError = (event: ErrorEvent) => {
      diagnosticLog.record({
        event: "window.error",
        level: "error",
        terminal: true,
        message: JSON.stringify({
          message:
            event.error instanceof Error ? event.error.message : event.message,
          stack:
            event.error instanceof Error ? (event.error.stack ?? null) : null,
          file: event.filename || null,
          line: event.lineno || null,
          column: event.colno || null,
        }),
      });
    };
    const recordUnhandledRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      diagnosticLog.record({
        event: "window.unhandled-rejection",
        level: "error",
        terminal: true,
        message: JSON.stringify({
          message: reason instanceof Error ? reason.message : String(reason),
          stack: reason instanceof Error ? (reason.stack ?? null) : null,
        }),
      });
    };
    const lifecycleMessage = (event: Event) =>
      JSON.stringify({
        type: event.type,
        visibility: document.visibilityState,
        online: navigator.onLine,
        persisted:
          "persisted" in event &&
          typeof (event as PageTransitionEvent).persisted === "boolean"
            ? (event as PageTransitionEvent).persisted
            : null,
      });
    const recordLifecycle = (event: Event) => {
      const hidden =
        event.type === "pagehide" ||
        (event.type === "visibilitychange" && document.hidden);
      diagnosticLog.record({
        event: `application.${event.type}`,
        message: lifecycleMessage(event),
        level: event.type === "offline" ? "warning" : "info",
        terminal:
          hidden ||
          event.type === "pageshow" ||
          event.type === "online" ||
          event.type === "offline",
      });
      if (event.type === "pagehide") void diagnosticLog.flush();
    };
    window.addEventListener("error", recordWindowError);
    window.addEventListener("unhandledrejection", recordUnhandledRejection);
    window.addEventListener("pagehide", recordLifecycle);
    window.addEventListener("pageshow", recordLifecycle);
    window.addEventListener("online", recordLifecycle);
    window.addEventListener("offline", recordLifecycle);
    window.addEventListener("focus", recordLifecycle);
    document.addEventListener("visibilitychange", recordLifecycle);
    return () => {
      window.removeEventListener("error", recordWindowError);
      window.removeEventListener(
        "unhandledrejection",
        recordUnhandledRejection,
      );
      window.removeEventListener("pagehide", recordLifecycle);
      window.removeEventListener("pageshow", recordLifecycle);
      window.removeEventListener("online", recordLifecycle);
      window.removeEventListener("offline", recordLifecycle);
      window.removeEventListener("focus", recordLifecycle);
      document.removeEventListener("visibilitychange", recordLifecycle);
    };
  }, [diagnosticLog]);

  const lastDiagnosticOperationRef = useRef("");
  useEffect(() => {
    const detail = operationDetail.trim();
    if (
      detail === "" ||
      detail === "Saving changes…" ||
      /^Saved changes in .+\.$/.test(detail)
    ) {
      return;
    }
    const isPermissionError =
      folderSaveState === "permission" ||
      workingFolderAccessState === "needs-permission";
    const isSaveError = folderSaveState === "error";
    const event = isSaveError
      ? "project.save-failed"
      : isPermissionError
        ? "project.permission-required"
        : "ide.operation";
    const key = `${event}:${detail}`;
    if (lastDiagnosticOperationRef.current === key) return;
    lastDiagnosticOperationRef.current = key;
    diagnosticLog.record({
      event,
      message: detail,
      level: isSaveError ? "error" : isPermissionError ? "warning" : "info",
      terminal: isSaveError || isPermissionError,
    });
  }, [
    diagnosticLog,
    folderSaveState,
    operationDetail,
    workingFolderAccessState,
  ]);

  const provideProjectRunSnapshot = useCallback(() => {
    const session = projectSessionRef.current;
    return {
      projectId: session.projectId,
      revision: session.revision,
      project: session.project,
    };
  }, []);

  useEffect(() => {
    if (!projectFolderConflict) return;
    folderDirtyRef.current = true;
    setFolderDirty(true);
    setFolderSaveState("error");
    setOperationDetail(
      "Files on disk no longer match this browser tab. Automatic saving paused; choose which version to keep.",
    );
  }, [projectFolderConflict]);

  const beginTargetCommand = useCallback(() => {
    targetCommandCountRef.current += 1;
  }, []);

  const finishTargetCommand = useCallback(() => {
    targetCommandCountRef.current = Math.max(
      0,
      targetCommandCountRef.current - 1,
    );
    retryPendingOfflineShellReload();
  }, []);

  const beginProjectCommand = useCallback((): boolean => {
    if (projectCommandActiveRef.current) return false;
    projectCommandActiveRef.current = true;
    setProjectCommandActive(true);
    beginTargetCommand();
    return true;
  }, [beginTargetCommand]);

  const finishProjectCommand = useCallback(() => {
    projectCommandActiveRef.current = false;
    setProjectCommandActive(false);
    finishTargetCommand();
  }, [finishTargetCommand]);

  const beginFolderInteraction = useCallback(() => {
    folderInteractionCountRef.current += 1;
  }, []);

  const finishFolderInteraction = useCallback(() => {
    folderInteractionCountRef.current = Math.max(
      0,
      folderInteractionCountRef.current - 1,
    );
    setFolderInteractionRevision((current) => current + 1);
  }, []);

  const closeSettings = useCallback(() => {
    setSettingsOpen(false);
  }, []);

  useEffect(() => {
    const input = importInputRef.current;
    if (!input) return;
    input.addEventListener("cancel", finishFolderInteraction);
    return () => input.removeEventListener("cancel", finishFolderInteraction);
  }, [finishFolderInteraction]);

  const publishProjectSession = useCallback((next: ProjectSession) => {
    projectSessionRef.current = next;
    projectRef.current = next.project;
    setProjectSession(next);
    setProjectState(next.project);
  }, []);

  const applyProjectChange = useCallback(
    (nextProject: ProjectSnapshot, now: number = Date.now()) => {
      const next = updateProjectSession(
        projectSessionRef.current,
        nextProject,
        now,
      );
      publishProjectSession(next);
      return next;
    },
    [publishProjectSession],
  );

  const stopFolderWrites = useCallback(() => {
    projectFolderPersistence.cancelPendingWrites();
  }, [projectFolderPersistence]);

  const saveCurrentProjectBeforeSwitch = useCallback(async () => {
    const folder = workingFolderRef.current;
    const session = projectSessionRef.current;
    if (!folder || !projectSessionHasUnsavedChanges(session)) return;
    setFolderSaveState("saving");
    const outcome = await projectFolderPersistence.saveManually(
      folder,
      session,
    );
    if (outcome.status !== "saved") {
      setFolderSaveState("error");
      throw new Error(
        outcome.status === "conflict"
          ? "Resolve the Project file conflict before opening another project."
          : "The current Project could not be saved, so it remains open.",
      );
    }
    publishProjectSession(outcome.session);
    folderDirtyRef.current = !outcome.exactRevision;
    setFolderDirty(!outcome.exactRevision);
    setFolderSaveState(outcome.exactRevision ? "current" : "pending");
  }, [projectFolderPersistence, publishProjectSession]);

  const preserveBrowserDraft = useCallback((draft?: ProjectSnapshot) => {
    preservedBrowserDraftRef.current = draft;
    setPreservedBrowserDraft(draft ?? null);
  }, []);

  const reconcileFolderSnapshot = useCallback(
    (opened: FolderReadResult, browser = projectSessionRef.current) => {
      const folderSnapshot = opened.project;
      const adoptedProjectId =
        !folderSnapshot.session &&
        sameProjectContents(browser.project, folderSnapshot)
          ? browser.projectId
          : undefined;
      const folder = createProjectSession(folderSnapshot, {
        source: "folder",
        baseDigest: opened.contentDigest,
        ...(adoptedProjectId ? { projectId: adoptedProjectId } : {}),
      });
      const result = reconcileProjectSessions(browser, folder);
      const browserNeedsRecovery =
        projectSessionHasUnsavedChanges(browser) &&
        !isDefaultProject(browser.project);
      let browserDraftPreserved = false;
      if (result.reason === "folder-conflict") {
        if (browserNeedsRecovery) {
          preserveBrowserDraft(snapshotForProjectSession(browser));
          browserDraftPreserved = true;
        }
        setProjectPanelOpen(true);
        setProjectFolderConflict({
          folderSession: folder,
          folderDigest: opened.contentDigest,
        });
      } else {
        setProjectFolderConflict(null);
      }
      if (result.preserveBrowserDraft && browserNeedsRecovery) {
        preserveBrowserDraft(snapshotForProjectSession(browser));
        browserDraftPreserved = true;
      }
      return {
        folder,
        result: {
          ...result,
          preserveBrowserDraft: browserDraftPreserved,
        },
      };
    },
    [preserveBrowserDraft],
  );

  const recordProjectFolderConflict = useCallback(
    (conflict: ProjectFolderConflictError) => {
      const browser = projectSessionRef.current;
      preserveBrowserDraft(snapshotForProjectSession(browser));
      setProjectPanelOpen(true);
      setProjectFolderConflict({
        folderSession: createProjectSession(conflict.folderProject, {
          source: "folder",
          baseDigest: conflict.folderDigest,
        }),
        folderDigest: conflict.folderDigest,
      });
      folderDirtyRef.current = true;
      setFolderDirty(true);
      setFolderSaveState("error");
      setOperationDetail(
        "Files on disk no longer match this browser tab. Automatic saving paused; choose which version to keep.",
      );
    },
    [preserveBrowserDraft],
  );

  projectFolderPersistence.setConflictHandler(recordProjectFolderConflict);

  const replacePendingFolderDeletions = useCallback(
    (update: (current: Set<string>) => Set<string>) => {
      projectFolderPersistence.replacePendingDeletions(update);
    },
    [projectFolderPersistence],
  );

  useEffect(() => {
    if (!projectSessionReady || !targetPreferenceReady) {
      targetStateRef.current = "disconnected";
      setTargetState("disconnected");
      setTargetDetail("Opening the saved project and XRP settings…");
      return;
    }
    if (targetPreferenceError) {
      targetStateRef.current = "error";
      setTargetState("error");
      setTargetDetail(targetPreferenceError);
      return;
    }
    setProjectProviderActive(false);
    setProjectProviderAvailable(false);
    projectProviderActiveRef.current = false;
    target.setProjectRunProvider(provideProjectRunSnapshot);
    diagnosticLog.record({
      event: "target.connect-requested",
      message: JSON.stringify(
        targetPreference.kind === "physical"
          ? {
              target: "physical",
              mode: targetPreference.physicalConnection,
              candidateAddresses: physicalEndpointCandidates(targetPreference),
              expectedRobotId: targetPreference.robotId ?? null,
              lastObservedNetwork: targetPreference.lastObservedNetwork ?? null,
            }
          : { target: "virtual" },
      ),
    });
    const unsubscribe = target.subscribe((event: TargetEvent) => {
      if (event.type === "status") {
        diagnosticLog.record({
          event: "target.status",
          message: JSON.stringify({
            target: target.kind,
            state: event.state,
            detail: event.detail,
          }),
          level: event.state === "error" ? "error" : "info",
          terminal:
            event.state === "ready" ||
            event.state === "error" ||
            event.state === "disconnected",
        });
        targetStateRef.current = event.state;
        setTargetState(event.state);
        setTargetDetail(event.detail);
      } else if (event.type === "physical-network") {
        diagnosticLog.record({
          event: "target.network",
          message: JSON.stringify({
            mode: event.mode,
            address: event.address,
            ssid: event.ssid ?? null,
            robotId: event.robotId ?? null,
            hostname: event.hostname ?? null,
            requestedMode: event.requestedMode ?? null,
            fallback: event.fallback ?? false,
          }),
        });
        updateTargetPreference((current) =>
          targetPreferenceForPhysicalNetwork(current, event),
        );
      } else if (event.type === "console") {
        if (
          event.phase === "request" ||
          event.phase === "result" ||
          event.phase === "error" ||
          event.stream === "stderr"
        ) {
          diagnosticLog.record({
            event: "target.console",
            eventId: event.eventId,
            requestId: event.requestId,
            replayed: event.replayed,
            message: JSON.stringify({
              action: event.action ?? null,
              phase: event.phase ?? null,
              stream: event.stream,
              line: event.line,
            }),
            level:
              event.stream === "stderr" || event.phase === "error"
                ? "error"
                : "info",
            terminal: event.phase === "result" || event.phase === "error",
          });
        }
        const id = event.eventId ?? `ide-target-${nextConsoleId.current++}`;
        setConsoleEntries((entries) => {
          if (entries.some((entry) => entry.id === id)) {
            return entries;
          }
          return [
            ...entries.slice(-(maximumSessionLogEntries - 1)),
            {
              id,
              category: event.stream === "system" ? "service" : "program",
              stream: event.stream,
              line: event.line,
              timestampMs: event.timestampMs,
            },
          ];
        });
      } else if (event.type === "project") {
        diagnosticLog.record({
          event: "target.project",
          message: event.project
            ? JSON.stringify({
                name: event.project.name,
                entrypoint: event.project.entrypoint,
                revision: event.project.revision,
                stale: event.project.stale,
              })
            : "No Project is loaded on the target.",
        });
        setCurrentProject(event.project);
      } else if (event.type === "project-provider") {
        projectProviderActiveRef.current = event.active;
        setProjectProviderActive(event.active);
        setProjectProviderAvailable(event.available);
      }
    });
    targetStateRef.current = "connecting";
    setTargetState("connecting");
    setTargetDetail(`Connecting to ${target.kind} XRP…`);
    setCurrentProject(null);
    let disposed = false;
    const connect = async () => {
      try {
        await target.connect();
      } catch (error: unknown) {
        if (disposed) return;
        diagnosticLog.record({
          event: "target.connect-failed",
          level: "error",
          terminal: true,
          message: errorDetail(error),
        });
        targetStateRef.current = "error";
        setTargetState("error");
        setTargetDetail(errorDetail(error));
      }
    };
    void connect();
    return () => {
      disposed = true;
      unsubscribe();
      target.setProjectRunProvider(null);
      target.disconnect();
    };
  }, [
    projectSessionReady,
    targetPreferenceError,
    targetPreferenceReady,
    diagnosticLog,
    provideProjectRunSnapshot,
    target,
    updateTargetPreference,
  ]);

  useEffect(() => {
    projectRef.current = project;
    projectVersion.current += 1;
    if (initializedProjectEffect.current) {
      const version = projectVersion.current;
      let disposed = false;
      setCheckOk(null);
      setCheckDetail("Files changed since the last code check.");
      setPythonDiagnostics([]);
      setSyncOk(null);
      setSyncDetail("Files changed; Run will load the updated project.");
      void projectContentDigest(project)
        .then((contentDigest) => {
          if (disposed || projectVersion.current !== version) return;
          if (!compilationIsFresh(window.sessionStorage, contentDigest)) return;
          setCheckOk(true);
          setCheckDetail(
            "Compilation passed earlier in this browser tab; the Project files are unchanged.",
          );
          setSyncDetail("Run will use the unchanged current Project.");
        })
        .catch(() => undefined);
      return () => {
        disposed = true;
      };
    } else {
      initializedProjectEffect.current = true;
    }
  }, [project]);

  useEffect(() => {
    if (!projectSessionReady || !workingFolder) return;
    projectFolderHandleWriteRef.current = rememberProjectFolder(workingFolder)
      .then((saved) => {
        if (!saved) {
          setFolderSaveState("error");
          setOperationDetail(
            `Chrome could not record ${workingFolder.name} as the active Project in .ucsbxrp.json. The Project remains open, but it may not reopen automatically.`,
          );
        }
        return saved;
      })
      .catch((error: unknown) => {
        setFolderSaveState("error");
        setOperationDetail(errorDetail(error));
        return false;
      })
      .finally(retryPendingOfflineShellReload);
  }, [projectSessionReady, workingFolder]);

  useEffect(() => {
    if (!projectSessionReady) return;
    const key = `${project.templateId ?? "custom"}:${project.name}`;
    if (key === displayedProjectKey.current) return;
    displayedProjectKey.current = key;
    const line = `Project opened · ${project.name}. Earlier messages belong to previous projects or runs.`;
    setConsoleEntries((entries) => [
      ...entries.slice(-(maximumSessionLogEntries - 2)),
      {
        id: `ide-project-output-${nextConsoleId.current++}`,
        category: "program",
        stream: "system",
        line,
        timestampMs: Date.now(),
      },
      {
        id: `ide-project-system-${nextConsoleId.current++}`,
        category: "service",
        stream: "system",
        line,
        timestampMs: Date.now(),
      },
    ]);
  }, [project.name, project.templateId, projectSessionReady]);

  useEffect(() => {
    setTutorialInstructionsOpen(isTutorialProject(project));
  }, [project.name, project.templateId]);

  useEffect(() => {
    let disposed = false;
    let recoveryWorkspace: CourseDirectoryHandle | null = null;
    const restoreFolders = async () => {
      const browserSession = initialProjectSession;
      let resolvedSession = browserSession;
      const loadedWorkspace = await loadRememberedWorkspaceFolder();
      recoveryWorkspace = loadedWorkspace;
      if (disposed) return;
      let workspace = loadedWorkspace;
      let folder: CourseDirectoryHandle | null = null;
      let workspaceConnected = false;
      const attachFolderProject = async (
        projectFolder: CourseDirectoryHandle,
        opened: Awaited<ReturnType<typeof readProjectFolder>>,
      ) => {
        const { folder: folderSession, result } = reconcileFolderSnapshot(
          opened,
          browserSession,
        );
        resolvedSession = result.session;
        const metadataNeedsWrite =
          opened.project.session === undefined ||
          resolvedSession.source === "browser-draft" ||
          resolvedSession.projectId !== folderSession.projectId ||
          resolvedSession.revision !== folderSession.revision ||
          resolvedSession.updatedAt !== folderSession.updatedAt;
        setRememberedFolder(projectFolder);
        setRememberedFolderCanAttach(true);
        setWorkingFolder(projectFolder);
        setFolderDirty(metadataNeedsWrite);
        setFolderSaveState(metadataNeedsWrite ? "pending" : "current");
        setActivePath(resolvedSession.project.entrypoint);
        replacePendingFolderDeletions(() => new Set());
        return result;
      };
      const useDefaultBrowserProject = () => {
        resolvedSession = createProjectSession(defaultProject(), {
          source: "browser-draft",
        });
        setWorkingFolder(null);
        setRememberedFolder(null);
        setRememberedFolderCanAttach(false);
        setFolderDirty(false);
        setFolderSaveState("browser");
        setActivePath(resolvedSession.project.entrypoint);
      };
      const preserveInitialDraftIfNeeded = () => {
        if (
          projectSessionHasUnsavedChanges(browserSession) &&
          !isDefaultProject(browserSession.project)
        ) {
          preserveBrowserDraft(snapshotForProjectSession(browserSession));
        }
      };
      if (workspace) {
        setRememberedWorkspaceFolder(workspace);
        const permission = await courseFolderPermission(workspace);
        if (disposed) return;
        if (permission === "granted") {
          await requireWorkingFolderParent(workspace);
          if (await isCourseRepositoryFolder(workspace)) {
            await forgetWorkspaceFolder();
            workspace = null;
            setRememberedWorkspaceFolder(null);
            setWorkingFolderAccessState("none");
            setOperationDetail(
              "The UCSBXRP course software repository cannot be used as the Working folder. Choose a separate folder for student projects.",
            );
          } else {
            setWorkspaceFolder(workspace);
            setWorkingFolderAccessState("connected");
            workspaceConnected = true;
            if (!authorDraftProject) {
              folder = await loadRememberedProjectFolder();
              if (disposed) return;
            }
          }
        } else {
          setWorkingFolderAccessState("needs-permission");
        }
      }

      if (folder) {
        setRememberedFolder(folder);
        const permission = await courseFolderPermission(folder);
        if (disposed) return;
        if (permission === "granted") {
          if (
            (await isCourseRepositoryFolder(folder)) ||
            !(await hasProjectFolderMetadata(folder))
          ) {
            await forgetProjectFolder();
            folder = null;
            setRememberedFolder(null);
            setRememberedFolderCanAttach(false);
            setFolderSaveState("browser");
            setOperationDetail(
              "The remembered folder is not a UCSBXRP project, so it was not opened or modified.",
            );
          } else {
            const opened = await readProjectFolder(folder);
            if (disposed) return;
            const reconciliation = await attachFolderProject(folder, opened);
            setOperationDetail(
              `${reconciliation.session.source === "browser-draft" ? "Recovered newer browser changes for" : "Opened"} ${folder.name}.${
                opened.skipped
                  ? ` Skipped ${opened.skipped} unsupported item${opened.skipped === 1 ? "" : "s"}.`
                  : ""
              }${reconciliation.preserveBrowserDraft ? " The previous unsaved version is available as Unsaved copy in Settings." : ""}`,
            );
          }
        } else {
          setFolderSaveState("permission");
          setOperationDetail(
            `Reconnect project folder ${folder.name} once to resume automatic saves.`,
          );
        }
      }

      // With a usable Working folder and no eligible active project, select a
      // project from this folder only. An empty first-use folder receives the
      // default spiral project; a populated folder never receives an arbitrary
      // stale recovery copy.
      if (!authorDraftProject && workspaceConnected && !folder) {
        const choices = await listDirectProjectFolders(workspace!);
        const workspaceManifest = await loadWorkspaceManifest(workspace!);
        if (disposed) return;
        const manifestProject = workspaceManifest?.activeProject
          ? choices.find(
              (choice) => choice.folderName === workspaceManifest.activeProject,
            )
          : undefined;
        if (manifestProject) {
          const opened = await readProjectFolder(manifestProject.folder);
          await attachFolderProject(manifestProject.folder, opened);
          setOperationDetail(`Opened ${manifestProject.projectName}.`);
        } else if (choices.length === 0) {
          const initial = createProjectSession(defaultProject(), {
            source: "browser-draft",
          });
          const saved = markProjectSessionSaved(
            initial,
            await projectContentDigest(initial.project),
          );
          const created = await ensureProjectFolder(
            workspace!,
            defaultProjectFolderName,
            snapshotForProjectSession(saved),
          );
          const opened = await readProjectFolder(created.folder);
          await attachFolderProject(created.folder, opened);
          setOperationDetail(
            `Expanding spiral is ready in ${created.folder.name}.`,
          );
        } else if (choices.length === 1) {
          const onlyProject = choices[0]!;
          const opened = await readProjectFolder(onlyProject.folder);
          await attachFolderProject(onlyProject.folder, opened);
          setOperationDetail(`Opened ${onlyProject.projectName}.`);
        } else {
          preserveInitialDraftIfNeeded();
          useDefaultBrowserProject();
          setProjectChoices(choices);
          setProjectChooserError("");
          setProjectChooserLoading(false);
          setProjectChooserOpen(true);
          setOperationDetail("Choose a project from the Working folder.");
        }
      }
      if (disposed) return;
      if (authorDraftProject) {
        setFolderSaveState("browser");
        setOperationDetail(
          "Opened an unpublished challenge draft. Compile and run it, then save it to a new Project folder if you want to retain it.",
        );
      }
      publishProjectSession(resolvedSession);
      setProjectSessionReady(true);
    };
    void restoreFolders().catch((error: unknown) => {
      if (disposed) return;
      if (recoveryWorkspace) {
        // A retained handle can report permission as granted after sleep and
        // still reject its first real file operation. Do not leave that stale
        // handle looking connected: the next user gesture must re-enter the
        // normal permission-and-write-check path.
        setWorkspaceFolder(null);
        setWorkingFolder(null);
        setWorkingFolderAccessState("needs-permission");
        setFolderSaveState("permission");
        setOperationDetail(
          `Reconnect Working folder ${recoveryWorkspace.name} to reopen its project and XRP settings. Chrome needs a user action before it can verify this retained folder again.`,
        );
      } else {
        setFolderSaveState("error");
        setOperationDetail(
          `The saved project could not be reopened: ${errorDetail(error)}`,
        );
      }
      publishProjectSession(initialProjectSession);
      setProjectSessionReady(true);
    });
    return () => {
      disposed = true;
    };
  }, [
    authorDraftProject,
    initialProjectSession,
    publishProjectSession,
    preserveBrowserDraft,
    reconcileFolderSnapshot,
    replacePendingFolderDeletions,
  ]);

  useEffect(() => {
    localStorage.setItem(settingsKey, JSON.stringify(settings));
  }, [settings]);

  const isConnected =
    targetState === "ready" ||
    targetState === "loading" ||
    targetState === "running" ||
    (target.kind === "virtual" && targetState === "error");
  const isRunning = targetState === "running" || targetState === "loading";
  const canCommand =
    projectProviderActive &&
    (targetState === "ready" ||
      (target.kind === "virtual" && targetState === "error"));
  const canRunProject = canCommand;

  const useThisIde = useCallback(() => {
    target.setProjectRunProvider(provideProjectRunSnapshot, { takeover: true });
  }, [provideProjectRunSnapshot, target]);
  const activeProjectTemplate = useMemo(
    () =>
      project.templateId
        ? COURSE_PROJECT_TEMPLATES.find(
            (template) => template.id === project.templateId,
          )
        : undefined,
    [project.templateId],
  );
  const projectCheckFile = checkFileForProject(project);
  const challengeComponentChecksAvailable =
    activeProjectTemplate?.kind === "challenge" && projectCheckFile !== null;
  const projectFiles = useMemo(
    () => Object.keys(project.files).sort((a, b) => a.localeCompare(b)),
    [project.files],
  );
  const projectPathSet = useMemo(() => new Set(projectFiles), [projectFiles]);
  const presentedPythonDiagnostics = useMemo(
    () =>
      pythonDiagnostics.map((diagnostic) => ({
        diagnostic,
        presentation: presentPythonDiagnostic(diagnostic, project.files),
      })),
    [project.files, pythonDiagnostics],
  );
  const compilerTranscriptIsCurrent =
    compilerTranscript?.projectId === projectSession.projectId &&
    compilerTranscript.revision === projectSession.revision;
  const programOutput = useMemo(
    () => consoleEntries.filter((entry) => entry.category === "program"),
    [consoleEntries],
  );
  const serviceDetails = useMemo(
    () => consoleEntries.filter((entry) => entry.category === "service"),
    [consoleEntries],
  );
  const canDeleteActiveFile =
    projectFiles.length > 1 && activePath !== project.entrypoint;

  const beginProjectRailResize = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      event.preventDefault();
      const startX = event.clientX;
      const startWidth = settings.projectRailWidth;
      const move = (pointerEvent: PointerEvent) => {
        const width = clampProjectRailWidth(
          startWidth + pointerEvent.clientX - startX,
        );
        setSettings((current) => ({ ...current, projectRailWidth: width }));
      };
      const finish = () => {
        window.removeEventListener("pointermove", move);
        window.removeEventListener("pointerup", finish);
      };
      window.addEventListener("pointermove", move);
      window.addEventListener("pointerup", finish, { once: true });
    },
    [settings.projectRailWidth],
  );

  const resizeProjectRailFromKeyboard = useCallback(
    (event: ReactKeyboardEvent<HTMLDivElement>) => {
      let nextWidth: number | null = null;
      if (event.key === "Home") nextWidth = minimumProjectRailWidth;
      if (event.key === "End") nextWidth = maximumProjectRailWidth;
      if (event.key === "ArrowLeft") {
        nextWidth = settings.projectRailWidth - (event.shiftKey ? 16 : 4);
      }
      if (event.key === "ArrowRight") {
        nextWidth = settings.projectRailWidth + (event.shiftKey ? 16 : 4);
      }
      if (nextWidth === null) return;
      event.preventDefault();
      const width = clampProjectRailWidth(nextWidth);
      setSettings((current) => ({ ...current, projectRailWidth: width }));
    },
    [settings.projectRailWidth],
  );

  const openFile = useCallback((path: string) => setActivePath(path), []);

  const openEditorLocation = useCallback(
    (location: { path: string; line: number; column: number }) => {
      if (location.path === activePath && editorRef.current) {
        pendingEditorLocationRef.current = null;
        editorRef.current.setPosition({
          lineNumber: location.line,
          column: location.column,
        });
        editorRef.current.revealLineInCenter(location.line);
        editorRef.current.focus();
        return;
      }
      pendingEditorLocationRef.current = location;
      openFile(location.path);
    },
    [activePath, openFile],
  );

  useEffect(() => {
    setCoursePythonProjectContext({
      projectId: projectSession.projectId,
      files: project.files,
      openLocation: openEditorLocation,
    });
    return () => setCoursePythonProjectContext(null);
  }, [openEditorLocation, project.files, projectSession.projectId]);

  const applyCompilerDiagnosticsToEditor = useCallback(
    (editor: Parameters<OnMount>[0], monaco: Parameters<OnMount>[1]) => {
      const model = editor?.getModel();
      if (!editor || !monaco || !model) return;
      if (!activePath.endsWith(".py") || !compilerTranscriptIsCurrent) {
        monaco.editor.setModelMarkers(model, "ucsb-xrp-compile", []);
        compileDecorationIdsRef.current = editor.deltaDecorations(
          compileDecorationIdsRef.current,
          [],
        );
        return;
      }
      const activeDiagnostics = presentedPythonDiagnostics.filter(
        ({ diagnostic }) =>
          diagnostic.phase === "compile" && diagnostic.path === activePath,
      );
      const markers = activeDiagnostics.map(({ diagnostic, presentation }) => {
        const boundedLine = model.validatePosition({
          lineNumber: diagnostic.start?.line ?? 1,
          column: 1,
        }).lineNumber;
        const start = model.validatePosition({
          lineNumber: boundedLine,
          column:
            diagnostic.start && diagnostic.start.column > 1
              ? diagnostic.start.column
              : (model.getLineFirstNonWhitespaceColumn(boundedLine) ?? 1),
        });
        const lineEnd = model.getLineMaxColumn(start.lineNumber);
        return {
          severity:
            diagnostic.severity === "warning"
              ? monaco.MarkerSeverity.Warning
              : diagnostic.severity === "info"
                ? monaco.MarkerSeverity.Info
                : monaco.MarkerSeverity.Error,
          message: `${presentation.title}\n${presentation.suggestion}`,
          source: "MicroPython",
          startLineNumber: start.lineNumber,
          startColumn: start.column,
          endLineNumber: start.lineNumber,
          endColumn: Math.max(start.column + 1, lineEnd),
        };
      });
      monaco.editor.setModelMarkers(model, "ucsb-xrp-compile", markers);

      const reportedLines = new Set(
        activeDiagnostics.map(
          ({ diagnostic }) =>
            model.validatePosition({
              lineNumber: diagnostic.start?.line ?? 1,
              column: 1,
            }).lineNumber,
        ),
      );
      const suggestedLines = new Set(
        activeDiagnostics
          .map(({ presentation }) => presentation.focusLine)
          .filter(
            (line): line is number =>
              line !== undefined &&
              !reportedLines.has(
                model.validatePosition({ lineNumber: line, column: 1 })
                  .lineNumber,
              ),
          )
          .map(
            (line) =>
              model.validatePosition({ lineNumber: line, column: 1 })
                .lineNumber,
          ),
      );
      compileDecorationIdsRef.current = editor.deltaDecorations(
        compileDecorationIdsRef.current,
        [
          ...[...reportedLines].map((line) => ({
            range: new monaco.Range(line, 1, line, 1),
            options: {
              isWholeLine: true,
              className: "python-error-line",
              linesDecorationsClassName: "python-error-line-gutter",
              overviewRuler: {
                color: "#c43424",
                position: monaco.editor.OverviewRulerLane.Right,
              },
            },
          })),
          ...[...suggestedLines].map((line) => ({
            range: new monaco.Range(line, 1, line, 1),
            options: {
              isWholeLine: true,
              className: "python-likely-fix-line",
              linesDecorationsClassName: "python-likely-fix-line-gutter",
            },
          })),
        ],
      );
    },
    [activePath, compilerTranscriptIsCurrent, presentedPythonDiagnostics],
  );

  const mountEditor = useCallback<OnMount>(
    (editor, monaco) => {
      editorRef.current = editor;
      monacoRef.current = monaco;
      applyCompilerDiagnosticsToEditor(editor, monaco);
      const location = pendingEditorLocationRef.current;
      if (!location) return;
      pendingEditorLocationRef.current = null;
      editor.setPosition({
        lineNumber: location.line,
        column: location.column,
      });
      editor.revealLineInCenter(location.line);
      editor.focus();
    },
    [applyCompilerDiagnosticsToEditor],
  );

  useEffect(() => {
    const editor = editorRef.current;
    const monaco = monacoRef.current;
    if (!editor || !monaco) return;
    applyCompilerDiagnosticsToEditor(editor, monaco);
  }, [applyCompilerDiagnosticsToEditor]);

  useEffect(() => {
    setMarkdownPreviewOpen(activePath.endsWith(".md"));
  }, [activePath]);

  const stageOpenedProject = useCallback(
    async (snapshot: ProjectSnapshot, projectId: string) => {
      if (!projectProviderActiveRef.current) return;
      if (
        targetStateRef.current === "loading" ||
        targetStateRef.current === "running"
      ) {
        throw new Error(
          "Stop the current run before opening a different Project.",
        );
      }
      beginTargetCommand();
      try {
        await target.markProjectStale(snapshot, projectId);
      } catch {
        // Opening and editing remain available while a physical XRP is offline.
      } finally {
        finishTargetCommand();
      }
    },
    [beginTargetCommand, finishTargetCommand, target],
  );

  useEffect(() => {
    if (!projectSessionReady || !projectProviderActive || !isConnected) {
      // A later connection or explicit ownership takeover must reconcile the
      // open files with the target again, even when the browser revision did
      // not change while this IDE was on standby.
      announcedProjectRevisionRef.current = null;
      return;
    }

    const identity = `${projectSession.projectId}:${projectSession.revision}`;
    const previous = announcedProjectRevisionRef.current;
    if (previous?.target === target && previous.identity === identity) return;
    announcedProjectRevisionRef.current = { target, identity };

    if (previous === null || previous.target !== target) {
      // The first notice for an active IDE uses the content digest, not the
      // browser's edit counter. This is the authoritative comparison after a
      // reconnect, reload, or ownership takeover: an exact retained project
      // remains ready and any other project becomes "Loads on Run".
      const snapshot = projectSession.project;
      void target
        .markProjectStale(snapshot, projectSession.projectId)
        .then(() => {
          const latest = announcedProjectRevisionRef.current;
          if (
            latest === null ||
            latest.target !== target ||
            latest.identity === identity
          ) {
            return;
          }
          // If an edit landed while the digest was being calculated, restore
          // the newest browser revision as the visible authority.
          const current = projectSessionRef.current;
          target.markProjectChanged({
            projectId: current.projectId,
            revision: current.revision,
            name: current.project.name,
            entrypoint: current.project.entrypoint,
          });
        })
        .catch(() => {
          // Editing remains available if a physical target disconnects during
          // this local reconciliation. The connection status carries the
          // actionable recovery state.
        });
      return;
    }

    target.markProjectChanged({
      projectId: projectSession.projectId,
      revision: projectSession.revision,
      name: projectSession.project.name,
      entrypoint: projectSession.project.entrypoint,
    });
  }, [
    isConnected,
    projectProviderActive,
    projectSession.project,
    projectSession.projectId,
    projectSession.revision,
    projectSessionReady,
    target,
  ]);

  const updateActiveFile = useCallback(
    (content: string) => {
      if (!workingFolder) return;
      const current = projectRef.current;
      const nextProject = {
        ...current,
        files: { ...current.files, [activePath]: content },
      };
      applyProjectChange(nextProject);
      setFolderDirty(true);
      setOperationDetail("Saving changes…");
    },
    [activePath, applyProjectChange, workingFolder],
  );

  const applyCompilationResult = useCallback(
    (
      result: CheckResult,
      checkedProject: ProjectSnapshot,
      checkedIdentity: { projectId: string; revision: number },
      requestedBy: "Compile" | "Run",
      systemLogRecordedByTarget = false,
    ) => {
      const diagnostics = uniquePythonDiagnostics(result.diagnostics ?? []);
      const presentations = diagnostics.map((diagnostic) => ({
        diagnostic,
        presentation: presentPythonDiagnostic(diagnostic, checkedProject.files),
      }));
      const first = presentations[0];
      const problemCount = diagnostics.length;
      const compilerLines =
        result.compilerOutput && result.compilerOutput.length > 0
          ? result.compilerOutput
          : [result.detail];

      setPythonDiagnostics(diagnostics);
      setCompilerTranscript({
        projectId: checkedIdentity.projectId,
        revision: checkedIdentity.revision,
        ok: result.ok,
        lines: compilerLines,
      });
      setCheckOk(result.ok);
      setCheckDetail(
        result.ok
          ? "Current files compiled successfully. Compile checks Python syntax; Run checks value types and program behavior."
          : problemCount > 0
            ? `${problemCount} problem${problemCount === 1 ? "" : "s"} found. Open Problems for a guided fix; Compiler output contains the exact MicroPython text.`
            : "Compile could not finish. Compiler output contains the complete error.",
      );

      diagnosticLog.record({
        event: result.ok ? "project.compile-passed" : "project.compile-failed",
        message: JSON.stringify({
          requestedBy,
          detail: result.detail,
          compilerOutput: compilerLines,
          diagnostics: presentations.map(({ diagnostic, presentation }) => ({
            code: diagnostic.code ?? null,
            message: diagnostic.message,
            path: diagnostic.path ?? null,
            line: diagnostic.start?.line ?? null,
            column:
              diagnostic.start && diagnostic.start.column > 1
                ? diagnostic.start.column
                : null,
            suggestion: presentation.suggestion,
            focusLine: presentation.focusLine ?? null,
          })),
        }),
        level: result.ok ? "info" : "error",
        terminal: true,
      });

      if (!systemLogRecordedByTarget) {
        const line = result.ok
          ? `${requestedBy} passed · ${result.detail}`
          : problemCount > 0
            ? `${requestedBy} found ${problemCount} source problem${problemCount === 1 ? "" : "s"} · open Problems for guidance or Compiler output for exact text`
            : `${requestedBy} could not finish · open Compiler output for the complete error`;
        setConsoleEntries((entries) => [
          ...entries.slice(-(maximumSessionLogEntries - 1)),
          {
            id: `ide-local-${nextConsoleId.current++}`,
            category: "service",
            stream: result.ok ? "system" : "stderr",
            line,
            timestampMs: Date.now(),
          },
        ]);
      }

      if (!result.ok) {
        setConsoleTab(first ? "problems" : "compiler");
        if (first?.diagnostic.path && first.diagnostic.start) {
          openEditorLocation({
            path: first.diagnostic.path,
            line: first.presentation.focusLine ?? first.diagnostic.start.line,
            column: 1,
          });
        }
      }
    },
    [diagnosticLog, openEditorLocation],
  );

  const validateCode = useCallback(async () => {
    if (isRunning || !beginProjectCommand()) {
      return;
    }
    setOutputPanelOpen(true);
    setConsoleTab("status");
    setCheckDetail(
      "Checking project structure and compiling Python files with MicroPython…",
    );
    const checkedIdentity = {
      projectId: projectSessionRef.current.projectId,
      revision: projectSessionRef.current.revision,
    };
    const checkedProject = projectRef.current;
    try {
      const [browserResult, contentDigest] = await Promise.all([
        checkCourseProjectSyntax(checkedProject),
        projectContentDigest(checkedProject),
      ]);
      let result = browserResult;
      let systemLogRecordedByTarget = false;
      if (
        browserResult.ok &&
        target.kind === "physical" &&
        canCommand &&
        projectProviderActiveRef.current
      ) {
        const deviceResult = await target.check(checkedProject);
        systemLogRecordedByTarget = true;
        result = {
          ...deviceResult,
          diagnostics:
            deviceResult.diagnostics ?? browserResult.diagnostics ?? [],
          compilerOutput: [
            ...(browserResult.compilerOutput ?? [browserResult.detail]),
            ...(deviceResult.compilerOutput ?? [deviceResult.detail]),
          ],
        };
      } else if (browserResult.ok && target.kind === "physical") {
        result = {
          ...browserResult,
          detail: `${browserResult.detail}. The XRP is not connected to this IDE; device validation will run on Run.`,
        };
      }
      if (
        projectSessionRef.current.projectId !== checkedIdentity.projectId ||
        projectSessionRef.current.revision !== checkedIdentity.revision
      ) {
        setCheckOk(null);
        setCheckDetail(
          "Files changed while Compile was running. Compile the current revision again.",
        );
        return;
      }
      applyCompilationResult(
        result,
        checkedProject,
        checkedIdentity,
        "Compile",
        systemLogRecordedByTarget,
      );
      if (
        result.ok &&
        projectSessionRef.current.projectId === checkedIdentity.projectId &&
        projectSessionRef.current.revision === checkedIdentity.revision
      ) {
        rememberCompilation(window.sessionStorage, contentDigest);
      } else if (!result.ok) {
        forgetCompilation(window.sessionStorage);
      }
    } catch (error) {
      const detail = errorDetail(error);
      applyCompilationResult(
        { ok: false, detail, compilerOutput: [detail] },
        checkedProject,
        checkedIdentity,
        "Compile",
      );
    } finally {
      finishProjectCommand();
      retryPendingOfflineShellReload();
    }
  }, [
    applyCompilationResult,
    beginProjectCommand,
    canCommand,
    finishProjectCommand,
    isRunning,
    target,
    workingFolder,
  ]);

  const testComponents = useCallback(async () => {
    if (
      !workingFolder ||
      !challengeComponentChecksAvailable ||
      componentCheckRunning ||
      isRunning ||
      projectCommandActive
    ) {
      return;
    }
    componentCheckRunningRef.current = true;
    setComponentCheckRunning(true);
    setOutputPanelOpen(true);
    setConsoleTab("output");
    setOperationDetail("Running hardware-free component checks…");
    try {
      const result = await testCourseProjectComponents({
        ...projectRef.current,
        entrypoint: projectCheckFile,
      });
      const completionDetail = result.detail;
      const incompleteComponents =
        result.ok &&
        (result.output ?? []).some((line) =>
          /^0 passed · [1-9]\d* not implemented · 0 failed$/.test(line),
        );
      const lines = [
        ...(result.output ?? []).map((line) => ({
          id: `ide-local-${nextConsoleId.current++}`,
          category: "program" as const,
          stream: line.startsWith("FAIL")
            ? ("stderr" as const)
            : ("stdout" as const),
          line,
        })),
        {
          id: `ide-local-${nextConsoleId.current++}`,
          category: "program" as const,
          stream: result.ok ? ("system" as const) : ("stderr" as const),
          line: incompleteComponents
            ? "Component checks finished · implement the listed methods, then test again."
            : result.ok
              ? completionDetail
              : `Component checks stopped: ${completionDetail}`,
        },
      ];
      setConsoleEntries((entries) => [
        ...entries.slice(-(maximumSessionLogEntries - lines.length)),
        ...lines,
      ]);
      setOperationDetail(
        incompleteComponents
          ? "Component checks finished; implement the listed methods, then test again."
          : result.ok
            ? "Component checks finished; review PASS and NOT IMPLEMENTED results below."
            : "One or more component checks failed; review Program output.",
      );
    } catch (error) {
      const detail = errorDetail(error);
      setConsoleEntries((entries) => [
        ...entries.slice(-(maximumSessionLogEntries - 1)),
        {
          id: `ide-local-${nextConsoleId.current++}`,
          category: "program",
          stream: "stderr",
          line: `Component checks could not run: ${detail}`,
          timestampMs: Date.now(),
        },
      ]);
      setOperationDetail("Component checks could not run.");
    } finally {
      componentCheckRunningRef.current = false;
      setComponentCheckRunning(false);
      retryPendingOfflineShellReload();
    }
  }, [
    challengeComponentChecksAvailable,
    componentCheckRunning,
    isRunning,
    projectCheckFile,
    projectCommandActive,
    workingFolder,
  ]);

  const runTarget = useCallback(async () => {
    if (
      !workingFolder ||
      !canRunProject ||
      isRunning ||
      virtualRuntimePreparing
    ) {
      return;
    }
    const projectToRun = projectRef.current;
    if (!beginProjectCommand()) return;
    const checkedIdentity = {
      projectId: projectSessionRef.current.projectId,
      revision: projectSessionRef.current.revision,
    };
    setOutputPanelOpen(true);
    setConsoleTab("output");
    try {
      const contentDigest = await projectContentDigest(projectToRun);
      if (!compilationIsFresh(window.sessionStorage, contentDigest)) {
        setCheckOk(null);
        setCheckDetail(
          "Run is checking the project and compiling its Python files…",
        );
        let result: CheckResult;
        try {
          result = await checkCourseProjectSyntax(projectToRun);
        } catch (error) {
          const detail = errorDetail(error);
          applyCompilationResult(
            { ok: false, detail, compilerOutput: [detail] },
            projectToRun,
            checkedIdentity,
            "Run",
          );
          return;
        }
        if (
          projectSessionRef.current.projectId !== checkedIdentity.projectId ||
          projectSessionRef.current.revision !== checkedIdentity.revision
        ) {
          setCheckOk(null);
          setCheckDetail(
            "Files changed while Run was checking them. Run the current revision again.",
          );
          return;
        }
        applyCompilationResult(result, projectToRun, checkedIdentity, "Run");
        if (!result.ok) {
          forgetCompilation(window.sessionStorage);
          return;
        }
      }
      await target.run(projectToRun, checkedIdentity.projectId);
      if (
        projectSessionRef.current.projectId === checkedIdentity.projectId &&
        projectSessionRef.current.revision === checkedIdentity.revision
      ) {
        rememberCompilation(window.sessionStorage, contentDigest);
      }
      if (target.kind === "physical") {
        setCheckOk(true);
        setCheckDetail(
          "The project structure is valid and every Python file compiled on the XRP.",
        );
        setSyncOk(true);
        setSyncDetail(
          "The current project is loaded and ready for this XRP session.",
        );
      }
    } catch (error) {
      const detail = errorDetail(error);
      setTargetState("error");
      setTargetDetail(detail);
      setConsoleEntries((entries) => [
        ...entries.slice(-(maximumSessionLogEntries - 1)),
        {
          id: `ide-local-${nextConsoleId.current++}`,
          category: "service",
          stream: "stderr",
          line: detail,
        },
      ]);
    } finally {
      finishProjectCommand();
      retryPendingOfflineShellReload();
    }
  }, [
    applyCompilationResult,
    beginProjectCommand,
    canRunProject,
    finishProjectCommand,
    isRunning,
    target,
    virtualRuntimePreparing,
    workingFolder,
  ]);

  const stopProgram = useCallback(async () => {
    if (!isRunning) {
      return;
    }
    beginTargetCommand();
    setOutputPanelOpen(true);
    setConsoleTab("details");
    try {
      await target.stop();
    } catch (error) {
      const detail = errorDetail(error);
      setTargetState("error");
      setTargetDetail(detail);
      setConsoleEntries((entries) => [
        ...entries.slice(-(maximumSessionLogEntries - 1)),
        {
          id: `ide-local-${nextConsoleId.current++}`,
          category: "service",
          stream: "stderr",
          line: `Stop did not complete · ${detail}. Check the target status, then try again.`,
          timestampMs: Date.now(),
        },
      ]);
    } finally {
      finishTargetCommand();
      retryPendingOfflineShellReload();
    }
  }, [beginTargetCommand, finishTargetCommand, isRunning, target]);

  const resetTarget = useCallback(async () => {
    if (!isConnected || (projectCommandActiveRef.current && !isRunning)) {
      return;
    }
    beginTargetCommand();
    setOutputPanelOpen(true);
    setConsoleTab("details");
    try {
      await target.reset();
    } catch (error) {
      const detail = errorDetail(error);
      setTargetState("error");
      setTargetDetail(detail);
      setConsoleEntries((entries) => [
        ...entries.slice(-(maximumSessionLogEntries - 1)),
        {
          id: `ide-local-${nextConsoleId.current++}`,
          category: "service",
          stream: "stderr",
          line: `Reset did not complete · ${detail}. Check the target status, then try again.`,
          timestampMs: Date.now(),
        },
      ]);
    } finally {
      finishTargetCommand();
      retryPendingOfflineShellReload();
    }
  }, [beginTargetCommand, finishTargetCommand, isConnected, isRunning, target]);

  const attachWorkingFolder = useCallback(
    async (folder: CourseDirectoryHandle) => {
      if (workingFolderRef.current !== folder) {
        await saveCurrentProjectBeforeSwitch();
      }
      setOperationDetail(`Reading ${folder.name}…`);
      const result = await readProjectFolder(folder);
      const { folder: folderSession, result: reconciliation } =
        reconcileFolderSnapshot(result);
      if (!(await rememberProjectFolder(folder))) {
        throw new Error(
          `Chrome could not record ${folder.name} as the active Project in .ucsbxrp.json.`,
        );
      }
      // Publish the complete project to the shared target before exposing it as
      // the active project. Monitor Run can otherwise observe the new IDE files
      // while the shared worker still owns the preceding project.
      await stageOpenedProject(
        reconciliation.session.project,
        reconciliation.session.projectId,
      );
      stopFolderWrites();
      setWorkingFolder(folder);
      setRememberedFolder(folder);
      setRememberedFolderCanAttach(true);
      setFolderSaveState("current");
      publishProjectSession(reconciliation.session);
      setActivePath(reconciliation.session.project.entrypoint);
      const folderNeedsWrite =
        result.project.session === undefined ||
        reconciliation.session.source === "browser-draft" ||
        reconciliation.session.revision !== folderSession.revision ||
        reconciliation.session.updatedAt !== folderSession.updatedAt;
      setFolderDirty(folderNeedsWrite);
      setFolderSaveState(folderNeedsWrite ? "pending" : "current");
      replacePendingFolderDeletions(() => new Set());
      setCheckOk(null);
      setCheckDetail("Current files have not been checked.");
      setOperationDetail(
        `${reconciliation.session.source === "browser-draft" ? "Recovered newer browser changes for" : "Opened"} project folder ${folder.name}: ${Object.keys(reconciliation.session.project.files).length} supported file${
          Object.keys(reconciliation.session.project.files).length === 1
            ? ""
            : "s"
        }${result.skipped ? `; ${result.skipped} item${result.skipped === 1 ? "" : "s"} skipped` : ""}.${reconciliation.preserveBrowserDraft ? " The previous unsaved version is available as Unsaved copy in Settings." : ""}`,
      );
    },
    [
      publishProjectSession,
      reconcileFolderSnapshot,
      replacePendingFolderDeletions,
      saveCurrentProjectBeforeSwitch,
      stageOpenedProject,
      stopFolderWrites,
    ],
  );

  const connectWorkingFolder = useCallback(
    async (folder: CourseDirectoryHandle, selectProjectFromFolder = true) => {
      await requireWorkingFolderParent(folder);
      if (await isCourseRepositoryFolder(folder)) {
        throw new Error(
          "Choose a Working folder for student projects, not the UCSBXRP course software repository.",
        );
      }
      const selectedWorkspaceManifest = await loadWorkspaceManifest(folder);
      const selection = await replaceRememberedWorkspaceFolder(folder);
      if (!selection.remembered) {
        throw new Error(`Chrome could not remember ${folder.name}.`);
      }
      setWorkspaceFolder(folder);
      setRememberedWorkspaceFolder(folder);
      setWorkingFolderAccessState("connected");

      // New Project and Save Project already own the Project that will become
      // active. Connecting their parent folder must not also create or open a
      // different Project behind the dialog.
      if (!selectProjectFromFolder) {
        setOperationDetail(`${folder.name} is the Working folder.`);
        return folder;
      }

      if (selection.changed || !workspaceFolder) {
        const choices = await listDirectProjectFolders(folder);
        const selected = selectedWorkspaceManifest?.activeProject
          ? choices.find(
              (choice) =>
                choice.folderName === selectedWorkspaceManifest.activeProject,
            )
          : choices.length === 1
            ? choices[0]
            : undefined;
        if (selected) {
          await attachWorkingFolder(selected.folder);
          setOperationDetail(
            `${folder.name} is the Working folder. Opened ${selected.projectName}.`,
          );
        } else if (choices.length === 0) {
          const initial = createProjectSession(defaultProject(), {
            source: "browser-draft",
          });
          const saved = markProjectSessionSaved(
            initial,
            await projectContentDigest(initial.project),
          );
          const created = await ensureProjectFolder(
            folder,
            defaultProjectFolderName,
            snapshotForProjectSession(saved),
          );
          await attachWorkingFolder(created.folder);
          setOperationDetail(
            `${folder.name} is the Working folder. Expanding spiral is ready in ${created.folder.name}.`,
          );
        } else {
          stopFolderWrites();
          const preview = createProjectSession(defaultProject(), {
            source: "browser-draft",
          });
          publishProjectSession(preview);
          setWorkingFolder(null);
          setRememberedFolder(null);
          setRememberedFolderCanAttach(false);
          setFolderDirty(false);
          setFolderSaveState("browser");
          setActivePath(preview.project.entrypoint);
          setProjectChoices(choices);
          setProjectChooserError("");
          setProjectChooserLoading(false);
          setProjectChooserOpen(true);
          setOperationDetail(
            `${folder.name} is the Working folder. Choose a project.`,
          );
        }
      } else {
        setOperationDetail(`${folder.name} is the Working folder.`);
      }
      return folder;
    },
    [
      attachWorkingFolder,
      publishProjectSession,
      stopFolderWrites,
      workspaceFolder,
    ],
  );

  const selectWorkspaceFolder = useCallback(
    async (
      reportError?: (detail: string) => void,
      selectProjectFromFolder = true,
    ) => {
      beginFolderInteraction();
      try {
        return await connectWorkingFolder(
          await chooseWorkspaceFolder(),
          selectProjectFromFolder,
        );
      } catch (error) {
        if (!wasCancelled(error)) {
          const detail = errorDetail(error);
          setOperationDetail(detail);
          reportError?.(detail);
        }
        return null;
      } finally {
        finishFolderInteraction();
      }
    },
    [beginFolderInteraction, connectWorkingFolder, finishFolderInteraction],
  );

  const ensureWorkingFolderAccess = useCallback(
    async (
      reportError?: (detail: string) => void,
      selectProjectFromFolder = true,
    ) => {
      if (workspaceFolder && workingFolderAccessState === "connected") {
        return workspaceFolder;
      }

      beginFolderInteraction();
      try {
        if (rememberedWorkspaceFolder) {
          const permission = await requestCourseFolderPermission(
            rememberedWorkspaceFolder,
          );
          if (permission !== "granted") {
            const detail = `Access to the Working folder ${rememberedWorkspaceFolder.name} was not granted. The current project is unchanged. Reconnect it or choose a different Working folder in Settings.`;
            setWorkingFolderAccessState("needs-permission");
            setOperationDetail(detail);
            reportError?.(detail);
            return null;
          }
          return await connectWorkingFolder(
            rememberedWorkspaceFolder,
            selectProjectFromFolder,
          );
        }

        return await connectWorkingFolder(
          await chooseWorkspaceFolder(),
          selectProjectFromFolder,
        );
      } catch (error) {
        if (!wasCancelled(error)) {
          const detail = errorDetail(error);
          setOperationDetail(detail);
          reportError?.(detail);
        }
        return null;
      } finally {
        finishFolderInteraction();
      }
    },
    [
      beginFolderInteraction,
      connectWorkingFolder,
      finishFolderInteraction,
      rememberedWorkspaceFolder,
      workingFolderAccessState,
      workspaceFolder,
    ],
  );

  const showProjectsInWorkingFolder = useCallback(
    async (folder: CourseDirectoryHandle) => {
      setProjectChooserOpen(true);
      setProjectChooserLoading(true);
      setProjectChooserError("");
      setProjectChoices([]);
      beginFolderInteraction();
      try {
        setProjectChoices(await listDirectProjectFolders(folder));
      } catch (error) {
        setProjectChooserError(
          `The Working folder could not be read: ${errorDetail(error)}`,
        );
      } finally {
        setProjectChooserLoading(false);
        finishFolderInteraction();
      }
    },
    [beginFolderInteraction, finishFolderInteraction],
  );

  const openProject = useCallback(async () => {
    setProjectChooserOpen(true);
    setProjectChooserLoading(false);
    setProjectChooserError("");
    setProjectChoices([]);
    if (workspaceFolder) {
      await showProjectsInWorkingFolder(workspaceFolder);
    }
  }, [showProjectsInWorkingFolder, workspaceFolder]);

  const openListedProject = useCallback(
    async (choice: ProjectFolderCandidate) => {
      setOpeningProjectFolder(choice.folderName);
      setProjectChooserError("");
      beginFolderInteraction();
      try {
        await attachWorkingFolder(choice.folder);
        setProjectChooserOpen(false);
      } catch (error) {
        setProjectChooserError(errorDetail(error));
      } finally {
        setOpeningProjectFolder(null);
        finishFolderInteraction();
      }
    },
    [attachWorkingFolder, beginFolderInteraction, finishFolderInteraction],
  );

  const closeProjectChooser = useCallback(() => {
    if (openingProjectFolder === null && !projectChooserLoading) {
      setProjectChooserOpen(false);
      setProjectChooserError("");
    }
  }, [openingProjectFolder, projectChooserLoading]);

  const changeWorkingFolderFromChooser = useCallback(async () => {
    setProjectChooserError("");
    let selectionError = "";
    const reportSelectionError = (detail: string) => {
      selectionError = detail;
      setProjectChooserError(detail);
    };
    const folder = workspaceFolder
      ? await selectWorkspaceFolder(reportSelectionError, false)
      : await ensureWorkingFolderAccess(reportSelectionError, false);
    if (folder) {
      await showProjectsInWorkingFolder(folder);
      return;
    }
    if (!selectionError) {
      setProjectChooserError(
        rememberedWorkspaceFolder
          ? `Access to ${rememberedWorkspaceFolder.name} was not granted. The current project is unchanged.`
          : "No Working folder was selected. The current project is unchanged.",
      );
    }
  }, [
    ensureWorkingFolderAccess,
    rememberedWorkspaceFolder,
    selectWorkspaceFolder,
    showProjectsInWorkingFolder,
    workspaceFolder,
  ]);

  const prepareProjectCreation = useCallback(
    async (
      snapshot: ProjectSnapshot,
      purpose: ProjectCreationPurpose = "new-project",
    ) => {
      setPendingProject(snapshot);
      setProjectCreationPurpose(purpose);
      setNewProjectDraft(suggestedProjectFolderName(snapshot.name));
      setNewProjectError("");
      setNewProjectOpen(true);
    },
    [],
  );

  const cancelProjectCreation = useCallback(() => {
    setNewProjectOpen(false);
    setPendingProject(null);
    setPendingChallengeTransition(null);
    setSelectedTemplateId("");
    setProjectCreationPurpose("new-project");
    setNewProjectDraft("");
    setNewProjectError("");
  }, []);

  const reconnectWorkingFolder = useCallback(async () => {
    if (!rememberedFolder || !rememberedFolderCanAttach) {
      return;
    }
    beginFolderInteraction();
    try {
      const permission = await requestCourseFolderPermission(rememberedFolder);
      if (permission !== "granted") {
        setFolderSaveState("permission");
        setOperationDetail(
          "Folder access was not granted. The preview remains open.",
        );
        return;
      }
      if (
        (await isCourseRepositoryFolder(rememberedFolder)) ||
        !(await hasProjectFolderMetadata(rememberedFolder))
      ) {
        if (projectProviderActiveRef.current) {
          await forgetProjectFolder();
        }
        setRememberedFolder(null);
        setRememberedFolderCanAttach(false);
        setFolderSaveState("browser");
        setOperationDetail(
          "That remembered folder is not a UCSBXRP project, so it was not opened or modified.",
        );
        return;
      }
      const opened = await readProjectFolder(rememberedFolder);
      const { folder: folderSession, result: reconciliation } =
        reconcileFolderSnapshot(opened);
      await stageOpenedProject(
        reconciliation.session.project,
        reconciliation.session.projectId,
      );
      publishProjectSession(reconciliation.session);
      setActivePath(reconciliation.session.project.entrypoint);
      setWorkingFolder(rememberedFolder);
      const folderNeedsWrite =
        opened.project.session === undefined ||
        reconciliation.session.source === "browser-draft" ||
        reconciliation.session.revision !== folderSession.revision ||
        reconciliation.session.updatedAt !== folderSession.updatedAt;
      setFolderDirty(folderNeedsWrite);
      setFolderSaveState(folderNeedsWrite ? "pending" : "current");
      setOperationDetail(
        `Reconnected ${rememberedFolder.name}.${folderNeedsWrite ? " Recovered edits will save automatically." : " Files are current."}${reconciliation.preserveBrowserDraft ? " The previous unsaved version is available as Unsaved copy in Settings." : ""}`,
      );
    } catch (error) {
      if (!wasCancelled(error)) {
        setFolderSaveState("error");
        setOperationDetail(errorDetail(error));
      }
    } finally {
      finishFolderInteraction();
    }
  }, [
    beginFolderInteraction,
    finishFolderInteraction,
    rememberedFolder,
    rememberedFolderCanAttach,
    publishProjectSession,
    reconcileFolderSnapshot,
    stageOpenedProject,
  ]);

  const saveProjectFiles = useCallback(async () => {
    try {
      if (!workingFolder) {
        await prepareProjectCreation(
          snapshotForProjectSession(projectSessionRef.current),
          "save-current",
        );
        return;
      }
      const folder = workingFolder;
      const sessionToSave = projectSessionRef.current;
      const savedProject = snapshotForProjectSession(sessionToSave);
      setOperationDetail(
        `Saving ${Object.keys(savedProject.files).length} files…`,
      );
      setFolderSaveState("saving");
      const outcome = await projectFolderPersistence.saveManually(
        folder,
        sessionToSave,
      );
      if (outcome.status !== "saved") return;
      publishProjectSession(outcome.session);
      if (!outcome.exactRevision) {
        setFolderSaveState("pending");
        return;
      }
      folderDirtyRef.current = false;
      setFolderDirty(false);
      setFolderSaveState("current");
      setOperationDetail(
        `Saved ${Object.keys(savedProject.files).length} project file${
          Object.keys(savedProject.files).length === 1 ? "" : "s"
        } to ${folder.name}${
          outcome.removedFiles > 0
            ? `; removed ${outcome.removedFiles} deleted file${outcome.removedFiles === 1 ? "" : "s"}`
            : ""
        }.`,
      );
      retryPendingOfflineShellReload();
    } catch (error) {
      if (!wasCancelled(error)) {
        setFolderSaveState("error");
        setOperationDetail(errorDetail(error));
      }
    }
  }, [
    prepareProjectCreation,
    projectFolderPersistence,
    publishProjectSession,
    workingFolder,
  ]);

  useEffect(() => {
    if (!workingFolder || !folderDirty || projectFolderConflict) {
      return;
    }
    const folder = workingFolder;
    const sessionToSave = projectSession;
    const version = projectVersion.current;
    setFolderSaveState("saving");
    void projectFolderPersistence
      .saveAutomatically(folder, sessionToSave, version)
      .then((outcome) => {
        if (outcome.status !== "saved") return;
        publishProjectSession(outcome.session);
        if (!outcome.exactRevision) {
          setFolderSaveState("pending");
          return;
        }
        folderDirtyRef.current = false;
        setFolderDirty(false);
        setFolderSaveState("current");
        setOperationDetail(`Saved changes in ${folder.name}.`);
        retryPendingOfflineShellReload();
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "NotAllowedError") {
          setWorkingFolder(null);
          setRememberedFolder(folder);
          setFolderSaveState("permission");
        } else {
          setFolderSaveState("error");
        }
        setOperationDetail(errorDetail(error));
      });
  }, [
    folderDirty,
    projectSession,
    projectFolderConflict,
    projectFolderPersistence,
    publishProjectSession,
    workingFolder,
  ]);

  const useFolderConflictFiles = useCallback(async () => {
    if (!projectFolderConflict || !workingFolder) return;
    stopFolderWrites();
    const browserDraft = projectSessionRef.current;
    preserveBrowserDraft(snapshotForProjectSession(browserDraft));
    try {
      await stageOpenedProject(
        projectFolderConflict.folderSession.project,
        projectFolderConflict.folderSession.projectId,
      );
      publishProjectSession(projectFolderConflict.folderSession);
      setActivePath(projectFolderConflict.folderSession.project.entrypoint);
      replacePendingFolderDeletions(() => new Set());
      folderDirtyRef.current = false;
      setFolderDirty(false);
      setProjectFolderConflict(null);
      setFolderSaveState("current");
      setOperationDetail(
        `Opened the files currently in ${workingFolder.name}. The previous unsaved version is available as Unsaved copy in Settings.`,
      );
    } catch (error) {
      setFolderSaveState("error");
      setOperationDetail(errorDetail(error));
    }
  }, [
    projectFolderConflict,
    preserveBrowserDraft,
    publishProjectSession,
    replacePendingFolderDeletions,
    stageOpenedProject,
    stopFolderWrites,
    workingFolder,
  ]);

  const keepIdeConflictFiles = useCallback(async () => {
    if (!projectFolderConflict || !workingFolder) return;
    const conflict = projectFolderConflict;
    const folder = workingFolder;
    const sessionToSave = projectSessionRef.current;
    setFolderSaveState("saving");
    setOperationDetail(`Saving the IDE files in ${folder.name}…`);
    try {
      const outcome = await projectFolderPersistence.keepIdeFiles(
        folder,
        sessionToSave,
        conflict.folderDigest,
      );
      if (outcome.status !== "saved") return;
      publishProjectSession(outcome.session);
      setProjectFolderConflict(null);
      preserveBrowserDraft();
      const stillDirty = projectSessionHasUnsavedChanges(outcome.session);
      folderDirtyRef.current = stillDirty;
      setFolderDirty(stillDirty);
      setFolderSaveState(stillDirty ? "pending" : "current");
      setOperationDetail(
        `Kept the IDE files in ${folder.name}. The previous folder files were retained in project autosaves.`,
      );
    } catch (error) {
      setFolderSaveState("error");
      setOperationDetail(errorDetail(error));
    }
  }, [
    projectFolderConflict,
    preserveBrowserDraft,
    projectFolderPersistence,
    publishProjectSession,
    workingFolder,
  ]);

  const reopenPreviousBrowserDraft = useCallback(async () => {
    const snapshot = preservedBrowserDraftRef.current;
    if (!snapshot) return;
    if (folderDirty || folderSaveState === "saving" || projectFolderConflict) {
      setOperationDetail(
        "Wait for the current project to finish saving before opening the unsaved copy.",
      );
      return;
    }
    try {
      stopFolderWrites();
      const restored = createProjectSession(snapshot, {
        source: "browser-draft",
      });
      await stageOpenedProject(restored.project, restored.projectId);
      publishProjectSession(restored);
      setActivePath(restored.project.entrypoint);
      setWorkingFolder(null);
      setRememberedFolder(null);
      setRememberedFolderCanAttach(false);
      replacePendingFolderDeletions(() => new Set());
      preserveBrowserDraft();
      setFolderDirty(true);
      setFolderSaveState("browser");
      setCheckOk(null);
      setCheckDetail("Current files have not been checked.");
      setSyncOk(null);
      setSyncDetail("Run will load the current project into XRP memory.");
      setOperationDetail(
        `Opened recovered unsaved work: ${restored.project.name}. Save it as a project to keep it.`,
      );
    } catch (error) {
      setOperationDetail(errorDetail(error));
    }
  }, [
    folderDirty,
    folderSaveState,
    preserveBrowserDraft,
    projectFolderConflict,
    publishProjectSession,
    replacePendingFolderDeletions,
    stageOpenedProject,
    stopFolderWrites,
  ]);

  useEffect(
    () =>
      registerOfflineShellBeforeReload(async () => {
        const activity = () =>
          ideReloadIsIdle({
            projectReady: projectSessionReadyRef.current,
            targetState: targetStateRef.current,
            targetCommandActive: targetCommandCountRef.current > 0,
            componentCheckActive: componentCheckRunningRef.current,
            uiDraftActive:
              newProjectOpen ||
              projectChooserOpen ||
              newFileOpen ||
              pathOperation !== null,
            folderInteractionActive: folderInteractionCountRef.current > 0,
            folderSaveActive: folderSaveStateRef.current === "saving",
          });

        if (!projectSessionReadyRef.current || projectFolderConflict) {
          return false;
        }
        const sessionToSave = projectSessionRef.current;
        const expected = projectRevisionIdentity(sessionToSave);
        if (!activity()) return false;

        if (
          projectProviderActiveRef.current &&
          !(await projectFolderHandleWriteRef.current)
        ) {
          setOperationDetail(
            "Chrome could not remember the active project folder. Reopen the project folder before applying the course update.",
          );
          return false;
        }

        const folder = workingFolderRef.current;
        if (folder === null) {
          return (
            activity() &&
            projectRevisionIsReloadable(
              projectSessionRef.current,
              expected,
              false,
            )
          );
        }

        const needsWrite =
          folderDirtyRef.current ||
          projectSessionHasUnsavedChanges(sessionToSave);
        if (needsWrite) {
          setFolderSaveState("saving");
          try {
            const outcome = await projectFolderPersistence.saveBeforeReload(
              folder,
              sessionToSave,
              activity,
            );
            if (outcome.status !== "saved") {
              if (
                workingFolderRef.current === folder &&
                folderDirtyRef.current
              ) {
                setFolderSaveState("pending");
              }
              return false;
            }
            publishProjectSession(outcome.session);
            folderDirtyRef.current = false;
            setFolderDirty(false);
            setFolderSaveState("current");
          } catch (error) {
            if (
              error instanceof DOMException &&
              error.name === "NotAllowedError"
            ) {
              workingFolderRef.current = null;
              setWorkingFolder(null);
              setRememberedFolder(folder);
              setFolderSaveState("permission");
            } else {
              setFolderSaveState("error");
            }
            setOperationDetail(errorDetail(error));
            return false;
          }
        } else {
          await projectFolderPersistence.waitForWrites();
        }

        return (
          activity() &&
          workingFolderRef.current === folder &&
          projectRevisionIsReloadable(projectSessionRef.current, expected, true)
        );
      }),
    [
      newFileOpen,
      newProjectOpen,
      pathOperation,
      projectChooserOpen,
      projectFolderConflict,
      projectFolderPersistence,
      publishProjectSession,
    ],
  );

  useEffect(() => {
    if (
      projectSessionReady &&
      !componentCheckRunning &&
      targetState !== "connecting" &&
      targetState !== "loading" &&
      targetState !== "running" &&
      folderSaveState !== "saving" &&
      folderSaveState !== "permission" &&
      folderSaveState !== "error" &&
      !newProjectOpen &&
      !newFileOpen &&
      pathOperation === null &&
      folderInteractionCountRef.current === 0
    ) {
      retryPendingOfflineShellReload();
    }
  }, [
    componentCheckRunning,
    folderDirty,
    folderInteractionRevision,
    folderSaveState,
    newFileOpen,
    newProjectOpen,
    pathOperation,
    projectProviderActive,
    projectSession.projectId,
    projectSession.revision,
    projectSession.savedRevision,
    projectSessionReady,
    targetState,
    workingFolder,
  ]);

  const openProjectTemplateDialog = useCallback(() => {
    if (
      targetStateRef.current === "loading" ||
      targetStateRef.current === "running"
    ) {
      setOperationDetail(
        "Stop the current run before creating a different Project.",
      );
      return;
    }
    setSelectedTemplateId("");
    setPendingProject(null);
    setPendingChallengeTransition(null);
    setProjectCreationPurpose("new-project");
    setNewProjectDraft("");
    setNewProjectError("");
    setNewProjectOpen(true);
  }, []);

  const openChallengeTransitionDialog = useCallback(() => {
    if (
      targetStateRef.current === "loading" ||
      targetStateRef.current === "running"
    ) {
      setOperationDetail(
        "Stop the current run before creating a different challenge Project.",
      );
      return;
    }
    if (activeProjectTemplate?.kind !== "challenge" || !project.templateId) {
      setOperationDetail(
        "Open a student challenge before carrying work forward.",
      );
      return;
    }
    setSelectedTemplateId("");
    setPendingProject(null);
    setPendingChallengeTransition(null);
    setProjectCreationPurpose("challenge-transition");
    setNewProjectDraft("");
    setNewProjectError("");
    setNewProjectOpen(true);
  }, [activeProjectTemplate?.kind, project.templateId]);

  const selectProjectTemplate = useCallback(
    (templateId: string) => {
      setSelectedTemplateId(templateId);
      const template = availableProjectTemplates.find(
        (candidate) => candidate.id === templateId,
      );
      if (!template) {
        setPendingProject(null);
        setPendingChallengeTransition(null);
        setNewProjectDraft("");
        return;
      }
      let snapshot: ProjectSnapshot;
      if (projectCreationPurpose === "challenge-transition") {
        if (!project.templateId || template.kind !== "challenge") {
          setPendingProject(null);
          setPendingChallengeTransition(null);
          setNewProjectDraft("");
          setNewProjectError("Choose a different student challenge.");
          return;
        }
        try {
          const transition = describeChallengeProjectTransition(
            project.templateId,
            template.id,
            project,
          );
          setPendingChallengeTransition(transition);
          snapshot = {
            ...transition.project,
            name:
              transition.project.name ??
              template.project.name ??
              template.id.replaceAll("_", "-"),
            templateId: template.id,
          };
        } catch (error) {
          setPendingProject(null);
          setPendingChallengeTransition(null);
          setNewProjectDraft("");
          setNewProjectError(errorDetail(error));
          return;
        }
      } else {
        snapshot = {
          name: template.project.name ?? template.id.replaceAll("_", "-"),
          entrypoint: template.project.entrypoint,
          files: { ...template.project.files },
          templateId: template.id,
        };
        setPendingChallengeTransition(null);
        setProjectCreationPurpose("new-project");
      }
      setPendingProject(snapshot);
      setNewProjectDraft(suggestedProjectFolderName(snapshot.name));
      setNewProjectError("");
    },
    [availableProjectTemplates, project, projectCreationPurpose],
  );

  const createNamedProject = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!pendingProject) return;
      if (
        targetStateRef.current === "loading" ||
        targetStateRef.current === "running"
      ) {
        setNewProjectError(
          "Stop the current run before creating or opening another Project.",
        );
        return;
      }
      const validationError = projectFolderNameError(newProjectDraft);
      if (validationError) {
        setNewProjectError(validationError);
        return;
      }
      let projectsFolder = workspaceFolder;
      if (!projectsFolder) {
        if (!supportsWorkingFolders()) {
          setNewProjectError(
            "This browser cannot create a local project. Use Preview, or open UCSBXRP in desktop Chrome or Edge.",
          );
          return;
        }
        let folderAccessError = "";
        projectsFolder = await ensureWorkingFolderAccess((detail) => {
          folderAccessError = detail;
        }, false);
        if (!projectsFolder) {
          setNewProjectError(
            folderAccessError ||
              "No Working folder was selected. The current project is unchanged.",
          );
          return;
        }
      }
      beginFolderInteraction();
      try {
        setNewProjectError("");
        setOperationDetail(`Creating ${newProjectDraft.trim()}…`);
        if (projectCreationPurpose !== "save-current") {
          await saveCurrentProjectBeforeSwitch();
        }
        const previousSession = projectSessionRef.current;
        if (
          projectCreationPurpose !== "save-current" &&
          projectSessionHasUnsavedChanges(previousSession)
        ) {
          preserveBrowserDraft(snapshotForProjectSession(previousSession));
        }
        const draftSession = createProjectSession(pendingProject, {
          source: "browser-draft",
        });
        const nextSession = markProjectSessionSaved(
          draftSession,
          await projectContentDigest(draftSession.project),
        );
        const folder = await createProjectFolder(
          projectsFolder,
          newProjectDraft,
          snapshotForProjectSession(nextSession),
        );
        if (!(await rememberProjectFolder(folder))) {
          throw new Error(
            `Created ${folder.name}, but Chrome could not record it as the active Project in .ucsbxrp.json.`,
          );
        }
        stopFolderWrites();
        await stageOpenedProject(nextSession.project, nextSession.projectId);
        publishProjectSession(nextSession);
        if (
          projectCreationPurpose !== "save-current" &&
          newProjectPrefersVirtual(pendingProject)
        ) {
          updateTargetPreference((current) => ({
            ...current,
            kind: "virtual",
          }));
        }
        const openingPath =
          projectCreationPurpose !== "save-current"
            ? openingPathForNewProject(pendingProject)
            : nextSession.project.entrypoint;
        setActivePath(openingPath);
        setWorkingFolder(folder);
        setRememberedFolder(folder);
        setRememberedFolderCanAttach(true);
        replacePendingFolderDeletions(() => new Set());
        setFolderDirty(false);
        setFolderSaveState("current");
        setCheckOk(null);
        setCheckDetail("Current files have not been checked.");
        setSyncOk(null);
        setSyncDetail("Run will load the current project into XRP memory.");
        const completedPurpose = projectCreationPurpose;
        cancelProjectCreation();
        setOperationDetail(
          completedPurpose === "save-current"
            ? `Saved ${nextSession.project.name} in ${folder.name}.`
            : `Created ${folder.name}.`,
        );
      } catch (error) {
        setNewProjectError(errorDetail(error));
      } finally {
        finishFolderInteraction();
      }
    },
    [
      beginFolderInteraction,
      cancelProjectCreation,
      finishFolderInteraction,
      newProjectDraft,
      pendingProject,
      preserveBrowserDraft,
      projectCreationPurpose,
      publishProjectSession,
      replacePendingFolderDeletions,
      saveCurrentProjectBeforeSwitch,
      ensureWorkingFolderAccess,
      stageOpenedProject,
      stopFolderWrites,
      updateTargetPreference,
      workspaceFolder,
    ],
  );

  const createFile = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const error = projectPathError(newFilePath);
      if (error) {
        setNewFileError(error);
        return;
      }
      const path = normalizedProjectPath(newFilePath);
      if (projectFilePathExists(project.files, path)) {
        setNewFileError(
          "That file name is already used (capitalization does not make a separate portable file name).",
        );
        return;
      }
      const current = projectRef.current;
      const nextProject = {
        ...current,
        files: { ...current.files, [path]: "" },
      };
      applyProjectChange(nextProject);
      replacePendingFolderDeletions((current) => {
        const next = new Set(current);
        next.delete(path);
        return next;
      });
      setFolderDirty(true);
      setNewFileOpen(false);
      setNewFilePath("");
      setNewFileError("");
      setOperationDetail(
        workingFolder
          ? `${path} created. Automatic folder save pending.`
          : `${path} created in the preview.`,
      );
      openFile(path);
    },
    [
      applyProjectChange,
      newFilePath,
      openFile,
      project.files,
      replacePendingFolderDeletions,
      workingFolder,
    ],
  );

  const importProjectFiles = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const selected = Array.from(event.target.files ?? []);
      event.target.value = "";
      if (selected.length === 0) return;

      const current = projectRef.current;
      const files = { ...current.files };
      const imported: string[] = [];
      const skipped: string[] = [];
      for (const file of selected) {
        const path = normalizedProjectPath(file.name);
        const pathError = projectPathError(path);
        if (
          pathError ||
          projectFilePathExists(files, path) ||
          file.size > 1024 * 1024
        ) {
          skipped.push(file.name);
          continue;
        }
        files[path] = await file.text();
        imported.push(path);
      }
      if (imported.length === 0) {
        const onlySkipped = skipped.length === 1 ? skipped[0] : undefined;
        setOperationDetail(
          onlySkipped !== undefined &&
            projectFilePathExists(current.files, onlySkipped)
            ? `${onlySkipped} is already in this project. Rename it before importing.`
            : "No files were imported. Choose text files smaller than 1 MB with names not already used in the project.",
        );
        return;
      }
      const nextProject = { ...current, files };
      applyProjectChange(nextProject);
      setFolderDirty(true);
      replacePendingFolderDeletions((pending) => {
        const next = new Set(pending);
        imported.forEach((path) => next.delete(path));
        return next;
      });
      openFile(imported[0]!);
      setOperationDetail(
        `Imported ${imported.length} file${imported.length === 1 ? "" : "s"}${
          skipped.length
            ? `; skipped ${skipped.length} duplicate or unsupported file${skipped.length === 1 ? "" : "s"}`
            : ""
        }.${workingFolder ? " Saving automatically." : " Choose a Working folder to save this project."}`,
      );
    },
    [
      applyProjectChange,
      openFile,
      replacePendingFolderDeletions,
      workingFolder,
    ],
  );

  const beginPathOperation = useCallback(
    (operation: PathOperation) => {
      setPathOperation(operation);
      setPathDraft(
        operation === "rename"
          ? activePath
          : suggestedDuplicatePath(activePath, project.files),
      );
      setPathOperationError("");
    },
    [activePath, project.files],
  );

  const applyPathOperation = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!pathOperation) {
        return;
      }
      try {
        const nextPath = normalizedProjectPath(pathDraft);
        const nextProject =
          pathOperation === "rename"
            ? renameProjectFile(project, activePath, nextPath)
            : duplicateProjectFile(project, activePath, nextPath);
        applyProjectChange(nextProject);
        replacePendingFolderDeletions((current) => {
          const next = new Set(current);
          next.delete(nextPath);
          if (pathOperation === "rename") {
            next.add(activePath);
          }
          return next;
        });
        setActivePath(nextPath);
        setFolderDirty(true);
        setOperationDetail(
          pathOperation === "rename"
            ? `Renamed ${activePath} to ${nextPath}.${workingFolder ? " Automatic folder save pending." : ""}`
            : `Copied ${activePath} as ${nextPath}.${workingFolder ? " Automatic folder save pending." : ""}`,
        );
        setPathOperation(null);
        setPathDraft("");
        setPathOperationError("");
      } catch (error) {
        setPathOperationError(errorDetail(error));
      }
    },
    [
      activePath,
      applyProjectChange,
      pathDraft,
      pathOperation,
      project,
      replacePendingFolderDeletions,
      workingFolder,
    ],
  );

  const confirmDeleteFile = useCallback(() => {
    if (!deletePath) {
      return;
    }
    try {
      const nextProject = deleteProjectFile(project, deletePath);
      applyProjectChange(nextProject);
      replacePendingFolderDeletions(
        (current) => new Set([...current, deletePath]),
      );
      if (activePath === deletePath) {
        setActivePath(nextProject.entrypoint);
      }
      setFolderDirty(true);
      setOperationDetail(
        `${deletePath} removed from the project.${workingFolder ? " Automatic folder save pending." : ""}`,
      );
      setDeletePath(null);
    } catch (error) {
      setOperationDetail(errorDetail(error));
      setDeletePath(null);
    }
  }, [
    activePath,
    applyProjectChange,
    deletePath,
    project,
    replacePendingFolderDeletions,
    workingFolder,
  ]);

  const useActiveFileAsEntrypoint = useCallback(() => {
    try {
      const nextProject = setProjectEntrypoint(projectRef.current, activePath);
      applyProjectChange(nextProject);
      setFolderDirty(true);
      setOperationDetail(
        `${activePath} is now the main file.${workingFolder ? " Automatic folder save pending." : ""}`,
      );
    } catch (error) {
      setOperationDetail(errorDetail(error));
    }
  }, [activePath, applyProjectChange, workingFolder]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeSettings();
        closeProjectChooser();
        setNewFileOpen(false);
        cancelProjectCreation();
        setPathOperation(null);
        setDeletePath(null);
        return;
      }
      if (
        projectChooserOpen ||
        newFileOpen ||
        newProjectOpen ||
        pathOperation ||
        deletePath
      ) {
        return;
      }
      const command = event.metaKey || event.ctrlKey;
      if (command && event.key.toLowerCase() === "s") {
        event.preventDefault();
        void saveProjectFiles();
      } else if (command && event.key === "Enter" && event.shiftKey) {
        event.preventDefault();
        void validateCode();
      } else if (command && event.key === "Enter") {
        event.preventDefault();
        void runTarget();
      } else if (command && event.key === ",") {
        event.preventDefault();
        if (settingsOpen) closeSettings();
        else setSettingsOpen(true);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [
    cancelProjectCreation,
    closeProjectChooser,
    closeSettings,
    deletePath,
    newFileOpen,
    newProjectOpen,
    pathOperation,
    projectChooserOpen,
    runTarget,
    saveProjectFiles,
    settingsOpen,
    validateCode,
  ]);

  useEffect(() => {
    if (
      !projectChooserOpen &&
      !newFileOpen &&
      !newProjectOpen &&
      !pathOperation &&
      !deletePath
    ) {
      return;
    }
    const keepFocusInDialog = (event: KeyboardEvent) => {
      if (event.key !== "Tab") {
        return;
      }
      const dialog = document.querySelector<HTMLElement>(
        '.modal-backdrop[aria-modal="true"]',
      );
      const controls = dialog
        ? Array.from(
            dialog.querySelectorAll<HTMLElement>(
              'button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])',
            ),
          )
        : [];
      if (controls.length === 0) {
        return;
      }
      const first = controls[0]!;
      const last = controls[controls.length - 1]!;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", keepFocusInDialog);
    return () => window.removeEventListener("keydown", keepFocusInDialog);
  }, [
    deletePath,
    newFileOpen,
    newProjectOpen,
    pathOperation,
    projectChooserOpen,
  ]);

  useEffect(() => {
    if (!settingsOpen) return;
    const closeOutside = (event: PointerEvent) => {
      const targetNode = event.target as Node | null;
      const targetElement = event.target as Element | null;
      if (
        targetNode &&
        !settingsDrawerRef.current?.contains(targetNode) &&
        !targetElement?.closest(".settings-button")
      ) {
        closeSettings();
      }
    };
    document.addEventListener("pointerdown", closeOutside);
    return () => document.removeEventListener("pointerdown", closeOutside);
  }, [closeSettings, settingsOpen]);

  useEffect(() => {
    if (!fileActionsOpen) return;
    const closeOutside = (event: PointerEvent) => {
      const targetNode = event.target as Node | null;
      if (targetNode && !fileActionsRef.current?.contains(targetNode)) {
        setFileActionsOpen(false);
      }
    };
    document.addEventListener("pointerdown", closeOutside);
    return () => document.removeEventListener("pointerdown", closeOutside);
  }, [fileActionsOpen]);

  const projectStorageDetail = projectFolderConflict
    ? "Folder and IDE files differ; choose which version to keep"
    : workingFolder
      ? folderSaveState === "error"
        ? "Automatic save failed"
        : folderSaveState === "saving" || folderDirty
          ? "Saving changes…"
          : "Connected · changes save automatically"
      : rememberedFolder && rememberedFolderCanAttach
        ? `${rememberedFolder.name} · reconnect to resume saving`
        : "Choose a Working folder, then create or open a project.";
  const projectStorageSummary = projectFolderConflict
    ? "Review folder changes"
    : workingFolder
      ? folderSaveState === "error"
        ? "Save failed"
        : folderSaveState === "saving" || folderDirty
          ? "Saving…"
          : "Saved"
      : rememberedFolder && rememberedFolderCanAttach
        ? "Reconnect to save"
        : "Working folder required";
  const workingFolderName =
    workspaceFolder?.name ?? rememberedWorkspaceFolder?.name ?? null;
  const workingFolderAccessSummary =
    workingFolderAccessState === "connected"
      ? "Contains each named Project folder."
      : workingFolderAccessState === "needs-permission"
        ? "Reconnect once to open and save Projects."
        : "Choose a folder that will contain your Projects.";
  const visibleConsoleEntries =
    consoleTab === "output" ? programOutput : serviceDetails;
  const projectIsReadyOnTarget = Boolean(
    currentProject && !currentProject.stale,
  );
  const physicalConnectionActive =
    targetState !== "disconnected" &&
    targetState !== "connecting" &&
    targetState !== "error";
  const projectLoadState = !physicalConnectionActive
    ? targetState === "connecting"
      ? "Checking connection"
      : "Connection required"
    : syncOk === false
      ? "Load failed"
      : projectIsReadyOnTarget
        ? "Ready this session"
        : "Loads on Run";
  const physicalStatus = !physicalConnectionActive
    ? targetState === "connecting"
      ? "checking connection"
      : "connection required"
    : projectIsReadyOnTarget
      ? "project ready"
      : "loads on Run";
  const robotProjectDetail = !physicalConnectionActive
    ? targetState === "connecting"
      ? "Checking the configured XRP Wi-Fi connection."
      : "Reconnect to the XRP before Run. USB-C is used by setup and repair; Run and telemetry use Wi-Fi."
    : syncDetail;
  const targetStatusTitle =
    target.kind === "physical"
      ? `${targetDetail}${targetDetail.endsWith(".") ? "" : "."} ${physicalStatus.charAt(0).toUpperCase()}${physicalStatus.slice(1)}.`
      : targetDetail;
  const nextRunProjectName = project.name;
  const activeHelp = contextHelpForPath(activePath, project.templateId);
  const tutorialInstructionsAvailable =
    isTutorialProject(project) &&
    activePath === "student_work.py" &&
    typeof project.files["README.md"] === "string";
  const tutorialExerciseSections = useMemo(
    () =>
      (project.files["README.md"] ?? "")
        .split("\n")
        .filter((line) => /^## Exercise\b/.test(line))
        .map((line) => line.replace(/^##\s+/, "").trim()),
    [project.files],
  );
  const activeFileReadOnly =
    !workingFolder ||
    (isTutorialProject(project) && activePath !== "student_work.py");
  const pendingTemplate = pendingProject?.templateId
    ? availableProjectTemplates.find(
        (template) => template.id === pendingProject.templateId,
      )
    : null;
  const preparingChallengeTransition =
    projectCreationPurpose === "challenge-transition";

  if (!projectSessionReady || !targetPreferenceReady) {
    return (
      <div
        className={`app-shell ide-app ${embeddedApplication ? "embedded-app" : ""}`}
      >
        <header className="app-header">
          <div className="brand" aria-label="UCSBXRP">
            <span className="brand-mark">UCSB</span>
            <span className="brand-xrp">XRP</span>
          </div>
          <AppNavigation active="ide" />
        </header>
        <main data-testid="project-bootstrap" role="status">
          Opening the saved project and XRP settings…
        </main>
      </div>
    );
  }

  return (
    <div
      className={`app-shell ide-app ${embeddedApplication ? "embedded-app" : ""}`}
    >
      <header className="app-header">
        <div className="brand" aria-label="UCSBXRP">
          <span className="brand-mark">UCSB</span>
          <span className="brand-xrp">XRP</span>
        </div>
        <AppNavigation active="ide" />
        <div className="toolbar" role="toolbar" aria-label="Project commands">
          <select
            aria-label="Run on"
            className="target-select"
            disabled={isRunning || projectCommandActive}
            onChange={(event) => {
              if (!projectProviderActive) useThisIde();
              updateTargetPreference((current) => ({
                ...current,
                kind: event.target.value as TargetKind,
              }));
            }}
            title={
              projectCommandActive
                ? "Wait for the current Compile or Run request to finish."
                : isRunning
                  ? "Stop the current program before changing XRP."
                  : !targetPreference.robotId
                    ? workingFolderAccessState === "needs-permission"
                      ? "Reconnect the Working folder to restore the commissioned Physical XRP connection."
                      : "Run Set up or Repair before selecting the Physical XRP."
                    : !projectProviderActive
                      ? "Choose the XRP target. Changing it makes this IDE control Run."
                      : "Choose whether Run uses the simulator or the configured physical XRP."
            }
            value={targetPreference.kind}
          >
            <option value="virtual">Virtual XRP</option>
            <option disabled={!targetPreference.robotId} value="physical">
              {targetPreference.robotId
                ? "Physical XRP"
                : workingFolderAccessState === "needs-permission"
                  ? "Physical XRP · reconnect folder"
                  : "Physical XRP · set up first"}
            </option>
          </select>
          <button
            disabled={isRunning || projectCommandActive}
            onClick={validateCode}
            title={
              projectCommandActive
                ? "The current Compile or Run request is still in progress."
                : target.kind === "physical" && targetState === "error"
                  ? "Compile locally with the browser's MicroPython runtime; reconnect the XRP before Run."
                  : !workingFolder
                    ? "Compile the recovered browser copy. Reconnect the Working folder before editing or saving."
                    : "Check project structure and compile all Python files without running the robot (⌘/Ctrl+Shift+Enter)"
            }
          >
            Compile
          </button>
          <button
            aria-label={isRunning ? "Stop" : "Run"}
            className={`command-run-button header-icon-button ${isRunning ? "danger-button" : "primary-button"}`}
            disabled={
              !isRunning &&
              (!workingFolder ||
                !canRunProject ||
                virtualRuntimePreparing ||
                projectCommandActive)
            }
            onClick={isRunning ? stopProgram : runTarget}
            title={
              isRunning
                ? "Stop the running program."
                : projectCommandActive
                  ? "The current Compile or Run request is still in progress."
                  : virtualRuntimePreparing
                    ? "Chrome is preparing the Virtual XRP. This page refreshes once automatically, then Run becomes available."
                    : !workingFolder
                      ? "Choose a Working folder and create or open a project before running."
                      : target.kind === "physical" && targetState === "error"
                        ? targetDetail
                        : `Run ${project.entrypoint} on the ${target.kind} XRP (⌘/Ctrl+Enter)`
            }
          >
            <RunStopIcon running={isRunning} />
            <span className="visually-hidden">
              {isRunning ? "Stop" : "Run"}
            </span>
          </button>
          <button
            aria-label="Reset"
            className="header-icon-button"
            disabled={
              !projectProviderActive ||
              !isConnected ||
              (projectCommandActive && !isRunning)
            }
            onClick={resetTarget}
            title="Stop the program and restore the selected XRP to its initial course state."
          >
            <ResetIcon />
            <span className="visually-hidden">Reset</span>
          </button>
          <SplitWorkspaceLink />
        </div>
        <div className="header-statuses">
          {!projectProviderActive && projectProviderAvailable ? (
            <button
              className="quiet-button"
              onClick={useThisIde}
              title="Make this IDE supply the current project and send Run commands."
              type="button"
            >
              Use this IDE
            </button>
          ) : null}
          <div
            aria-live="polite"
            className="connection-pill"
            data-testid="target-status"
            role="status"
            title={targetStatusTitle}
          >
            <span aria-hidden="true" className={`status-dot ${targetState}`} />
            <span>
              {!projectProviderActive && projectProviderAvailable
                ? "Another IDE tab receives Run commands"
                : `${target.kind === "virtual" ? "Virtual XRP" : "Physical XRP"} · ${targetState}${target.kind === "physical" ? ` · ${physicalStatus}` : ""}`}
            </span>
          </div>
          <button
            aria-expanded={settingsOpen}
            className="quiet-button settings-button"
            onClick={() => {
              if (settingsOpen) closeSettings();
              else setSettingsOpen(true);
            }}
            title="IDE settings (⌘/Ctrl+,)"
          >
            Settings
          </button>
        </div>
      </header>

      {target.kind === "physical" && targetState === "error" ? (
        <section className="connection-recovery" role="alert">
          <div>
            <strong>Physical XRP connection lost</strong>
            <span>
              {targetDetail} The IDE retries automatically when this page
              returns after sleep or the network comes back.
            </span>
          </div>
          <button
            className="primary-button"
            onClick={() => setConnectionAttempt((attempt) => attempt + 1)}
            type="button"
          >
            Reconnect XRP
          </button>
          <a href="../commission/">Set up or repair…</a>
        </section>
      ) : null}

      <main
        className={`ide-workspace ${projectPanelOpen ? "" : "project-collapsed"}`}
        style={
          {
            "--project-rail-width": `${settings.projectRailWidth}px`,
          } as CSSProperties
        }
      >
        {projectPanelOpen ? (
          <aside className="project-rail panel" aria-label="Project">
            <div className="panel-header project-heading">
              <h2 className="panel-title">Project</h2>
              <button
                aria-label="Collapse project"
                className="icon-button"
                onClick={() => setProjectPanelOpen(false)}
                title="Collapse project"
              >
                ‹
              </button>
            </div>
            <div className="project-rail-body">
              <div className="project-root" title={projectStorageDetail}>
                <strong data-testid="project-name">{project.name}</strong>
                <div className="project-location">
                  <span>{workingFolderName ?? "Working folder"} ›</span>
                  <strong data-testid="project-folder">
                    {workingFolder ? workingFolder.name : "Not selected"}
                  </strong>
                </div>
                <small
                  className="project-save-state"
                  data-testid="project-save-state"
                >
                  {projectStorageSummary}
                </small>
              </div>
              <div className="file-list">
                {projectFiles.map((path) => (
                  <button
                    aria-label={`Open ${path}${
                      path === project.entrypoint ? " (main file)" : ""
                    }`}
                    aria-current={path === activePath ? "true" : undefined}
                    className={`file-row ${path === activePath ? "active" : ""}`}
                    key={path}
                    onClick={() => openFile(path)}
                    title={`Open ${path}.`}
                    type="button"
                  >
                    <span className="file-path">{path}</span>
                    {path === project.entrypoint ? (
                      <span className="startup-badge">main</span>
                    ) : null}
                  </button>
                ))}
              </div>
              <div className="project-controls">
                <div className="file-menu" ref={fileActionsRef}>
                  <button
                    aria-expanded={fileActionsOpen}
                    className="file-menu-trigger"
                    disabled={!workingFolder}
                    onClick={() => setFileActionsOpen((open) => !open)}
                    title={`Rename, duplicate, make main, or delete ${activePath}.`}
                  >
                    <span>Actions for</span>
                    <strong>{activePath.split("/").at(-1)}</strong>
                    <span aria-hidden="true">
                      {fileActionsOpen ? "▴" : "▾"}
                    </span>
                  </button>
                  {fileActionsOpen ? (
                    <div
                      className="file-actions"
                      aria-label={`Actions for ${activePath}`}
                    >
                      <button
                        onClick={() => {
                          setFileActionsOpen(false);
                          beginPathOperation("rename");
                        }}
                        title={`Rename ${activePath}.`}
                      >
                        Rename file…
                      </button>
                      <button
                        onClick={() => {
                          setFileActionsOpen(false);
                          beginPathOperation("duplicate");
                        }}
                        title={`Create a second editable copy of ${activePath}.`}
                      >
                        Duplicate file…
                      </button>
                      <button
                        disabled={
                          activePath === project.entrypoint ||
                          !activePath.endsWith(".py")
                        }
                        onClick={() => {
                          setFileActionsOpen(false);
                          useActiveFileAsEntrypoint();
                        }}
                        title={
                          !activePath.endsWith(".py")
                            ? "Only a Python file can be the main file"
                            : activePath === project.entrypoint
                              ? "Run already executes this file first"
                              : `Make ${activePath} the file Run executes first`
                        }
                      >
                        Make main
                      </button>
                      <button
                        className="danger-button"
                        disabled={!canDeleteActiveFile}
                        onClick={() => {
                          setFileActionsOpen(false);
                          setDeletePath(activePath);
                        }}
                        title={
                          canDeleteActiveFile
                            ? `Delete ${activePath} from the project`
                            : activePath === project.entrypoint
                              ? "Choose another Python file as main before deleting this file"
                              : "A project must contain at least one file"
                        }
                      >
                        Delete file…
                      </button>
                    </div>
                  ) : null}
                </div>
                <div
                  aria-label="Create or import project files"
                  className="file-create-actions"
                  role="group"
                >
                  <button
                    aria-label="New file…"
                    disabled={!workingFolder}
                    onClick={() => {
                      setNewFileOpen(true);
                      setNewFileError("");
                    }}
                    title="Create a new text file inside this project."
                  >
                    New file…
                  </button>
                  <button
                    aria-label="Import files…"
                    disabled={!workingFolder}
                    onClick={() => {
                      beginFolderInteraction();
                      importInputRef.current?.click();
                    }}
                    title="Import copies of one or more text files into this project. Existing files are not overwritten."
                  >
                    Import files…
                  </button>
                  <input
                    accept=".csv,.ini,.json,.md,.py,.toml,.txt,.yaml,.yml,text/*"
                    hidden
                    multiple
                    onChange={(event) => {
                      void importProjectFiles(event).finally(
                        finishFolderInteraction,
                      );
                    }}
                    ref={importInputRef}
                    type="file"
                  />
                </div>
                <div
                  aria-label="Project actions"
                  className="project-actions"
                  role="group"
                >
                  <small className="project-template-hint">
                    New project: Open challenges, demos, or tutorials
                  </small>
                  <button
                    aria-label="New project…"
                    disabled={isRunning}
                    onClick={openProjectTemplateDialog}
                    title={
                      isRunning
                        ? "Stop the current run before creating another Project."
                        : "Create a new project from a course challenge, demo, or tutorial."
                    }
                  >
                    New project…
                  </button>
                  <button
                    aria-label="Open project…"
                    className="open-folder-button"
                    disabled={!supportsWorkingFolders() || isRunning}
                    onClick={() => void openProject()}
                    title={
                      isRunning
                        ? "Stop the current run before opening another Project."
                        : "Open an existing UCSBXRP project with read-write access. Changes save to its folder automatically."
                    }
                  >
                    Open project…
                  </button>
                  {!workingFolder &&
                  rememberedFolder &&
                  rememberedFolderCanAttach ? (
                    <button
                      className="project-storage-action"
                      disabled={isRunning}
                      onClick={reconnectWorkingFolder}
                      title={`Reconnect ${rememberedFolder.name} with read-write access and resume automatic saving.`}
                    >
                      Reconnect project folder…
                    </button>
                  ) : null}
                  {!workingFolder &&
                  rememberedWorkspaceFolder &&
                  workingFolderAccessState === "needs-permission" ? (
                    <button
                      className="project-storage-action"
                      disabled={isRunning}
                      onClick={() => void ensureWorkingFolderAccess()}
                      title={`Restore read-write access to ${rememberedWorkspaceFolder.name}, reopen its active Project, and restore its XRP connection.`}
                    >
                      Reconnect Working folder…
                    </button>
                  ) : null}
                </div>
                <div className="course-project-actions">
                  <button
                    aria-describedby="component-check-help"
                    className="component-check-button"
                    disabled={
                      !workingFolder ||
                      !challengeComponentChecksAvailable ||
                      componentCheckRunning ||
                      isRunning ||
                      projectCommandActive
                    }
                    onClick={() => void testComponents()}
                    title={
                      !challengeComponentChecksAvailable
                        ? "Open a student challenge to test its class implementations."
                        : isRunning
                          ? "Stop the current robot run before testing challenge components."
                          : projectCommandActive
                            ? "Wait for the current project action to finish."
                            : "Run supplied input/output checks in MicroPython without running an XRP."
                    }
                  >
                    {componentCheckRunning
                      ? "Testing components…"
                      : "Test components"}
                  </button>
                  <small id="component-check-help">
                    Test the class implementations for this challenge
                  </small>
                  {activeProjectTemplate?.kind === "challenge" ? (
                    <button
                      className="challenge-transition-button"
                      disabled={isRunning}
                      onClick={openChallengeTransitionDialog}
                      title="Choose another student challenge, preview every file change, and create it as a separate project. This project remains unchanged."
                    >
                      Start another challenge…
                    </button>
                  ) : null}
                </div>
                <div className="working-folder-shortcut">
                  <button
                    disabled={!supportsWorkingFolders() || isRunning}
                    onClick={() => void selectWorkspaceFolder()}
                    title="Choose the parent folder for Projects. UCSBXRP verifies write access, then opens that folder's active Project or asks you to choose one."
                    type="button"
                  >
                    {workingFolderName
                      ? "Change Working folder…"
                      : "Choose Working folder…"}
                  </button>
                </div>
                {projectFolderConflict ? (
                  <div className="project-feedback">
                    <div
                      aria-live="polite"
                      className="project-folder-conflict"
                      role="alert"
                    >
                      <small>
                        Files on disk no longer match this browser tab.
                        Automatic saving is paused; choose which version to
                        keep.
                      </small>
                      <div>
                        <button
                          disabled={isRunning}
                          onClick={useFolderConflictFiles}
                          title="Open the files currently in the Project folder. The current IDE files remain available as an unsaved copy."
                        >
                          <strong>Open folder version</strong>
                          <span>Keep this tab as an Unsaved copy</span>
                        </button>
                        <button
                          onClick={keepIdeConflictFiles}
                          title="Write the IDE files to the project folder and retain the previous folder files in autosaves."
                        >
                          <strong>Save this tab to folder</strong>
                          <span>Retain the previous version in Autosaves</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </aside>
        ) : null}
        {projectPanelOpen ? (
          <div
            aria-label="Resize Project sidebar"
            aria-orientation="vertical"
            aria-valuemax={maximumProjectRailWidth}
            aria-valuemin={minimumProjectRailWidth}
            aria-valuenow={settings.projectRailWidth}
            className="project-rail-resizer"
            onDoubleClick={() =>
              setSettings((current) => ({
                ...current,
                projectRailWidth: defaultProjectRailWidth,
              }))
            }
            onKeyDown={resizeProjectRailFromKeyboard}
            onPointerDown={beginProjectRailResize}
            role="separator"
            tabIndex={0}
            title="Drag to resize the Project sidebar. Double-click to reset."
          />
        ) : null}

        <section
          className={`editor-stack ${outputPanelOpen ? "" : "output-collapsed"}`}
        >
          <div className="editor-panel panel">
            <div className="editor-toolbar">
              {!projectPanelOpen ? (
                <button
                  className="project-reopen"
                  onClick={() => setProjectPanelOpen(true)}
                  title="Show project"
                >
                  Project ›
                </button>
              ) : null}
              <strong
                className="current-file-heading"
                data-testid="current-file"
                title={activePath}
              >
                {activePath}
              </strong>
              {folderSaveState === "error" || folderSaveState === "saving" ? (
                <span className="autosave-label">
                  {folderSaveState === "error" ? "Save failed" : "Saving…"}
                </span>
              ) : null}
              {activePath.endsWith(".md") ? (
                <div
                  aria-label="Markdown view"
                  className="markdown-view-toggle"
                  role="group"
                >
                  <button
                    aria-pressed={markdownPreviewOpen}
                    className={markdownPreviewOpen ? "active" : ""}
                    onClick={() => setMarkdownPreviewOpen(true)}
                    title="Show this Markdown file as formatted documentation."
                  >
                    Preview
                  </button>
                  <button
                    aria-pressed={!markdownPreviewOpen}
                    className={!markdownPreviewOpen ? "active" : ""}
                    onClick={() => setMarkdownPreviewOpen(false)}
                    title="Edit the Markdown source."
                  >
                    Edit
                  </button>
                </div>
              ) : null}
              {activeHelp ? (
                <a
                  className="editor-api-link"
                  href={activeHelp.href}
                  target="_top"
                  title={`Open ${activeHelp.label} for ${activePath} in this tab.`}
                >
                  {activeHelp.label}
                </a>
              ) : null}
              {tutorialInstructionsAvailable ? (
                <button
                  aria-pressed={tutorialInstructionsOpen}
                  className={`tutorial-instructions-toggle ${tutorialInstructionsOpen ? "active" : ""}`}
                  onClick={() => setTutorialInstructionsOpen((open) => !open)}
                  title="Show the tutorial instructions beside the current Python file."
                >
                  Instructions
                </button>
              ) : null}
            </div>
            <div
              className={`editor-frame ${tutorialInstructionsAvailable && tutorialInstructionsOpen ? "tutorial-split" : ""}`}
              data-testid="python-editor"
            >
              <div className="editor-primary">
                {activePath.endsWith(".md") && markdownPreviewOpen ? (
                  <MarkdownPreview
                    onOpenProjectFile={openFile}
                    projectPaths={projectPathSet}
                    source={project.files[activePath] ?? ""}
                  />
                ) : (
                  <Editor
                    key={`${projectSession.projectId}:${activePath}`}
                    language={editorLanguage(activePath)}
                    onMount={mountEditor}
                    onChange={(value) => updateActiveFile(value ?? "")}
                    options={{
                      ariaLabel: `${activePath} editor`,
                      automaticLayout: true,
                      detectIndentation: false,
                      fontFamily: "SFMono-Regular, Consolas, monospace",
                      fontSize: settings.editorFontSize,
                      insertSpaces: true,
                      lineHeight: Math.round(settings.editorFontSize * 1.65),
                      minimap: { enabled: settings.minimap },
                      padding: { top: 5 },
                      readOnly: activeFileReadOnly,
                      renderLineHighlight: "gutter",
                      scrollBeyondLastLine: false,
                      stickyScroll: { enabled: false },
                      tabFocusMode: false,
                      tabSize: settings.tabSize,
                      wordWrap: settings.wordWrap,
                    }}
                    path={`${projectSession.projectId}/${activePath}`}
                    theme="vs"
                    value={project.files[activePath] ?? ""}
                  />
                )}
              </div>
              {tutorialInstructionsAvailable && tutorialInstructionsOpen ? (
                <aside
                  aria-label="Tutorial instructions"
                  className="tutorial-instructions"
                >
                  <div className="tutorial-instructions-heading">
                    <strong>Instructions</strong>
                    <button
                      aria-label="Close tutorial instructions"
                      onClick={() => setTutorialInstructionsOpen(false)}
                      title="Close tutorial instructions."
                    >
                      ×
                    </button>
                  </div>
                  {tutorialExerciseSections.length > 1 ? (
                    <nav
                      aria-label="Tutorial exercises"
                      className="tutorial-exercise-nav"
                    >
                      {tutorialExerciseSections.map((title, index) => (
                        <button
                          key={title}
                          onClick={(event) => {
                            const aside = event.currentTarget.closest(
                              ".tutorial-instructions",
                            );
                            const heading = Array.from(
                              aside?.querySelectorAll("h2") ?? [],
                            ).find(
                              (candidate) => candidate.textContent === title,
                            );
                            heading?.scrollIntoView({ block: "start" });
                          }}
                          title={`Show ${title}.`}
                        >
                          {index + 1}
                        </button>
                      ))}
                    </nav>
                  ) : null}
                  <MarkdownPreview
                    onOpenProjectFile={openFile}
                    projectPaths={projectPathSet}
                    source={project.files["README.md"] ?? ""}
                  />
                </aside>
              ) : null}
            </div>
          </div>

          <section
            className={`console-panel panel ${outputPanelOpen ? "" : "collapsed"}`}
            aria-label="Run information"
          >
            <div className="console-header">
              <div
                className="console-tabs"
                role="tablist"
                aria-label="Run information"
              >
                <button
                  aria-selected={consoleTab === "status"}
                  className={consoleTab === "status" ? "active" : ""}
                  onClick={() => {
                    setConsoleTab("status");
                    setOutputPanelOpen(true);
                  }}
                  role="tab"
                  title="Show concise target, compilation, project, and file status."
                >
                  Status
                </button>
                <button
                  aria-selected={consoleTab === "problems"}
                  className={consoleTab === "problems" ? "active" : ""}
                  onClick={() => {
                    setConsoleTab("problems");
                    setOutputPanelOpen(true);
                  }}
                  role="tab"
                  title="Show compiler diagnostics. Select a problem to open its exact source location."
                >
                  Problems
                  {pythonDiagnostics.length > 0
                    ? ` (${pythonDiagnostics.length})`
                    : ""}
                </button>
                <button
                  aria-selected={consoleTab === "compiler"}
                  className={consoleTab === "compiler" ? "active" : ""}
                  onClick={() => {
                    setConsoleTab("compiler");
                    setOutputPanelOpen(true);
                  }}
                  role="tab"
                  title="Show output from the latest MicroPython compile."
                >
                  Compiler output
                </button>
                <button
                  aria-selected={consoleTab === "output"}
                  className={consoleTab === "output" ? "active" : ""}
                  onClick={() => {
                    setConsoleTab("output");
                    setOutputPanelOpen(true);
                  }}
                  role="tab"
                  title="Show text printed by the running program and Python exceptions."
                >
                  Program output
                  {programOutput.length > 0 ? ` (${programOutput.length})` : ""}
                </button>
                <button
                  aria-selected={consoleTab === "details"}
                  className={consoleTab === "details" ? "active" : ""}
                  onClick={() => {
                    setConsoleTab("details");
                    setOutputPanelOpen(true);
                  }}
                  role="tab"
                  title="Show compilation, connection, flash, and target-service messages."
                >
                  System log
                  {serviceDetails.length > 0
                    ? ` (${serviceDetails.length})`
                    : ""}
                </button>
              </div>
              <div className="console-actions">
                {outputPanelOpen &&
                (consoleTab === "output" || consoleTab === "details") ? (
                  <button
                    className="clear-output"
                    disabled={visibleConsoleEntries.length === 0}
                    onClick={() =>
                      setConsoleEntries((entries) =>
                        consoleTab === "output"
                          ? entries.filter(
                              (entry) => entry.category !== "program",
                            )
                          : entries.filter(
                              (entry) => entry.category !== "service",
                            ),
                      )
                    }
                    title={`Clear ${consoleTab === "output" ? "program output" : "system log"}.`}
                  >
                    Clear
                  </button>
                ) : null}
                <button
                  aria-expanded={outputPanelOpen}
                  className="output-toggle"
                  onClick={() => setOutputPanelOpen((open) => !open)}
                  title={
                    outputPanelOpen
                      ? "Collapse run information."
                      : "Expand run information."
                  }
                >
                  {outputPanelOpen ? "Collapse output" : "Expand output"}
                </button>
              </div>
            </div>
            {outputPanelOpen && consoleTab === "status" ? (
              <div className="status-grid" role="tabpanel">
                <div>
                  <span>Project</span>
                  <strong>{project.name}</strong>
                  <small aria-live="polite">
                    {workingFolder
                      ? `${workingFolder.name} · ${projectStorageSummary}`
                      : projectStorageSummary}
                    {operationDetail ? ` · ${operationDetail}` : ""}
                  </small>
                </div>
                <div>
                  <span>Next run</span>
                  <strong>
                    {nextRunProjectName} ·{" "}
                    {target.kind === "virtual" ? "Virtual XRP" : "Physical XRP"}
                  </strong>
                </div>
                <div>
                  <span>Compilation</span>
                  <strong
                    className={
                      checkOk === true
                        ? "pass"
                        : checkOk === false
                          ? "fail"
                          : ""
                    }
                  >
                    {checkOk === true
                      ? "Passed"
                      : checkOk === false
                        ? "Failed"
                        : "Not run"}
                  </strong>
                  <small aria-live="polite" data-testid="check-result">
                    {checkDetail}
                  </small>
                </div>
                {target.kind === "physical" ? (
                  <div>
                    <span>Robot project</span>
                    <strong
                      className={
                        physicalConnectionActive && projectIsReadyOnTarget
                          ? "pass"
                          : physicalConnectionActive && syncOk === false
                            ? "fail"
                            : ""
                      }
                    >
                      {projectLoadState}
                    </strong>
                    <small aria-live="polite">{robotProjectDetail}</small>
                  </div>
                ) : null}
              </div>
            ) : outputPanelOpen && consoleTab === "problems" ? (
              <div className="problems-panel" role="tabpanel">
                {pythonDiagnostics.length === 0 ? (
                  <span className="console-placeholder">
                    Compile the current files to list Python source problems
                    here.
                  </span>
                ) : (
                  <ol className="problem-list">
                    {presentedPythonDiagnostics.map(
                      ({ diagnostic, presentation }, index) => {
                        const focusLine =
                          presentation.focusLine ?? diagnostic.start?.line ?? 1;
                        return (
                          <li
                            key={`${diagnostic.path ?? "project"}:${diagnostic.start?.line ?? 0}:${diagnostic.start?.column ?? 0}:${index}`}
                          >
                            <button
                              disabled={!diagnostic.path}
                              onClick={() => {
                                if (!diagnostic.path) return;
                                openEditorLocation({
                                  path: diagnostic.path,
                                  line: focusLine,
                                  column: 1,
                                });
                              }}
                              title={
                                diagnostic.path
                                  ? `Open ${diagnostic.path} at line ${focusLine}`
                                  : "The compiler did not provide a source location."
                              }
                              type="button"
                            >
                              <span className="problem-location">
                                {presentation.location}
                              </span>
                              <strong>{presentation.title}</strong>
                              <span className="problem-suggestion">
                                {presentation.suggestion}
                              </span>
                              {presentation.sourceLine ? (
                                <code>{presentation.sourceLine}</code>
                              ) : null}
                              <small>
                                {presentation.focusLine !== undefined &&
                                presentation.focusLine !==
                                  diagnostic.start?.line
                                  ? `Go to likely fix on line ${presentation.focusLine}`
                                  : "Open highlighted line"}
                              </small>
                            </button>
                          </li>
                        );
                      },
                    )}
                  </ol>
                )}
              </div>
            ) : outputPanelOpen && consoleTab === "compiler" ? (
              <div className="compiler-output-panel" role="tabpanel">
                {compilerTranscript ? (
                  <>
                    <div className="compiler-output-heading">
                      <strong>MicroPython compiler</strong>
                      <span>
                        {compilerTranscript.ok ? "Passed" : "Failed"} ·{" "}
                        {compilerTranscriptIsCurrent
                          ? "current files"
                          : "earlier Project revision"}
                      </span>
                    </div>
                    <pre style={{ fontSize: `${settings.consoleFontSize}px` }}>
                      {compilerTranscript.lines.join("\n")}
                    </pre>
                  </>
                ) : (
                  <span className="console-placeholder">
                    Compile to view MicroPython compiler output here.
                  </span>
                )}
              </div>
            ) : outputPanelOpen ? (
              <div
                className="console-output"
                role="log"
                aria-live="polite"
                style={{ fontSize: `${settings.consoleFontSize}px` }}
              >
                {visibleConsoleEntries.length === 0 ? (
                  <span className="console-placeholder">
                    {consoleTab === "output"
                      ? "Program output appears here after Run."
                      : "Compilation, connection, project-loading, and target-service messages appear here."}
                  </span>
                ) : (
                  visibleConsoleEntries.map((entry) => (
                    <div
                      className={`console-line ${entry.stream}`}
                      key={entry.id}
                    >
                      <time
                        className="console-time"
                        dateTime={
                          entry.timestampMs === undefined
                            ? undefined
                            : new Date(entry.timestampMs).toISOString()
                        }
                      >
                        {formatConsoleTime(entry.timestampMs)}
                      </time>
                      <span className="console-marker">
                        {entry.stream === "stderr"
                          ? "!"
                          : entry.stream === "system"
                            ? "•"
                            : "›"}
                      </span>
                      {(() => {
                        const location = consoleSourceLocation(entry.line);
                        return location && projectPathSet.has(location.path) ? (
                          <button
                            className="console-source-link"
                            onClick={() => openEditorLocation(location)}
                            title={`Open ${location.path}:${location.line}`}
                            type="button"
                          >
                            {entry.line}
                          </button>
                        ) : (
                          <span>{entry.line}</span>
                        );
                      })()}
                    </div>
                  ))
                )}
              </div>
            ) : null}
          </section>
        </section>
      </main>

      {settingsOpen ? (
        <aside
          aria-label="IDE settings"
          className="settings-drawer"
          data-testid="settings-panel"
          ref={settingsDrawerRef}
        >
          <div className="settings-heading">
            <div>
              <span>IDE</span>
              <h2>Settings</h2>
            </div>
            <button
              aria-label="Close settings"
              className="icon-button"
              onClick={closeSettings}
            >
              ×
            </button>
          </div>
          <section className="settings-note project-settings">
            <h3>Working folder</h3>
            <div className="project-setting-state">
              <strong>{workingFolderName ?? "Not selected"}</strong>
              <small>{workingFolderAccessSummary}</small>
              <small>Troubleshooting log: {diagnosticLogFileName}</small>
            </div>
            <div className="project-setting-actions">
              {workingFolderAccessState === "needs-permission" ? (
                <button
                  disabled={!supportsWorkingFolders() || isRunning}
                  onClick={() => void ensureWorkingFolderAccess()}
                  title="Restore read-write access to the remembered Working folder."
                >
                  Reconnect Working folder…
                </button>
              ) : null}
              <button
                disabled={!supportsWorkingFolders() || isRunning}
                onClick={() => void selectWorkspaceFolder()}
                title="Choose the parent folder used when new projects are created. The current project remains open."
              >
                {workingFolderName
                  ? "Change Working folder…"
                  : "Choose Working folder…"}
              </button>
              {preservedBrowserDraft ? (
                <button
                  disabled={
                    isRunning ||
                    folderDirty ||
                    folderSaveState === "saving" ||
                    projectFolderConflict !== null
                  }
                  onClick={() => void reopenPreviousBrowserDraft()}
                  title={`Open the unsaved copy of ${preservedBrowserDraft.name}. The current Project remains unchanged.`}
                >
                  Unsaved copy · {preservedBrowserDraft.name}
                </button>
              ) : null}
            </div>
          </section>
          {targetPreference.kind === "physical" ? (
            <fieldset className="xrp-wifi-settings">
              <legend>Physical XRP</legend>
              <p className="xrp-wifi-summary">
                Run and telemetry use the network verified during XRP setup.
              </p>
              <dl className="xrp-connection-summary">
                <div>
                  <dt>Robot</dt>
                  <dd>{targetPreference.hostname ?? "Not commissioned"}</dd>
                </div>
                <div>
                  <dt>Network</dt>
                  <dd>
                    {targetPreference.lastObservedNetwork?.ssid ||
                      (targetPreference.physicalConnection === "access_point"
                        ? "Robot hotspot"
                        : "Local Wi-Fi")}
                  </dd>
                </div>
                <div>
                  <dt>Address</dt>
                  <dd>
                    {targetPreference.physicalConnection === "access_point"
                      ? targetPreference.accessPointEndpoint
                      : targetPreference.stationEndpoint}
                  </dd>
                </div>
              </dl>
              <a
                className="commission-settings-link"
                href="../commission/"
                title="Install, repair, or change this XRP network over USB-C."
              >
                Set up, repair, or change network ↗
              </a>
            </fieldset>
          ) : null}
          {targetPreference.kind !== "physical" ? (
            <a
              className="commission-settings-link standalone"
              href="../commission/"
              title="Install or repair the course runtime on an XRP over USB-C."
            >
              Set up or repair XRP ↗
            </a>
          ) : null}
          <label className="setting-row">
            <span>
              Editor font size <strong>{settings.editorFontSize} px</strong>
            </span>
            <input
              max="20"
              min="8"
              onChange={(event) =>
                setSettings((current) => ({
                  ...current,
                  editorFontSize: Number(event.target.value),
                }))
              }
              type="range"
              value={settings.editorFontSize}
            />
          </label>
          <label className="setting-row">
            <span>
              Output font size <strong>{settings.consoleFontSize} px</strong>
            </span>
            <input
              max="16"
              min="10"
              onChange={(event) =>
                setSettings((current) => ({
                  ...current,
                  consoleFontSize: Number(event.target.value),
                }))
              }
              type="range"
              value={settings.consoleFontSize}
            />
          </label>
          <label className="setting-row">
            <span>Indent width</span>
            <select
              onChange={(event) =>
                setSettings((current) => ({
                  ...current,
                  tabSize: Number(event.target.value) === 2 ? 2 : 4,
                }))
              }
              value={settings.tabSize}
            >
              <option value="2">2 spaces</option>
              <option value="4">4 spaces</option>
            </select>
          </label>
          <label className="setting-row">
            <span>Long lines</span>
            <select
              onChange={(event) =>
                setSettings((current) => ({
                  ...current,
                  wordWrap: event.target.value === "on" ? "on" : "off",
                }))
              }
              value={settings.wordWrap}
            >
              <option value="off">Scroll horizontally</option>
              <option value="on">Wrap in editor</option>
            </select>
          </label>
          <label className="setting-row">
            <span>Code overview</span>
            <select
              onChange={(event) =>
                setSettings((current) => ({
                  ...current,
                  minimap: event.target.value === "on",
                }))
              }
              value={settings.minimap ? "on" : "off"}
            >
              <option value="off">Hide minimap</option>
              <option value="on">Show minimap</option>
            </select>
          </label>
          <section className="settings-note shortcuts-note">
            <h3>Shortcuts</h3>
            <dl>
              <div>
                <dt>Save</dt>
                <dd>⌘/Ctrl+S</dd>
              </div>
              <div>
                <dt>Compile</dt>
                <dd>⌘/Ctrl+Shift+Enter</dd>
              </div>
              <div>
                <dt>Run selected target</dt>
                <dd>⌘/Ctrl+Enter</dd>
              </div>
              <div>
                <dt>Settings</dt>
                <dd>⌘/Ctrl+,</dd>
              </div>
            </dl>
          </section>
        </aside>
      ) : null}

      {projectChooserOpen ? (
        <div
          aria-labelledby="open-project-title"
          aria-modal="true"
          className="modal-backdrop"
          role="dialog"
        >
          <section className="new-file-dialog project-chooser-dialog">
            <h2 id="open-project-title">Open project</h2>
            <p className="dialog-context">
              {workspaceFolder ? (
                <>
                  Choose a project saved in{" "}
                  <strong>{workspaceFolder.name}</strong>.
                </>
              ) : rememberedWorkspaceFolder ? (
                <>
                  Reconnect <strong>{rememberedWorkspaceFolder.name}</strong> to
                  see its projects.
                </>
              ) : (
                <>
                  Choose the <strong>Working folder</strong> that contains your
                  UCSBXRP projects.
                </>
              )}
            </p>
            {workspaceFolder ? (
              projectChooserLoading ? (
                <p aria-live="polite" className="project-chooser-status">
                  Reading projects…
                </p>
              ) : projectChoices.length > 0 ? (
                <div className="project-choice-list">
                  {projectChoices.map((choice, index) => (
                    <button
                      aria-label={
                        "Open " +
                        choice.projectName +
                        " from " +
                        choice.folderName
                      }
                      autoFocus={index === 0}
                      disabled={openingProjectFolder !== null || isRunning}
                      key={choice.folderName}
                      onClick={() => void openListedProject(choice)}
                      type="button"
                    >
                      <strong>{choice.projectName}</strong>
                      <small>
                        {choice.folderName} · {choice.fileCount} file
                        {choice.fileCount === 1 ? "" : "s"}
                      </small>
                      {openingProjectFolder === choice.folderName ? (
                        <span>Opening…</span>
                      ) : null}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="project-chooser-empty">
                  <p className="project-chooser-status">
                    No projects are saved in {workspaceFolder.name} yet.
                  </p>
                  <button
                    className="primary-button"
                    disabled={isRunning}
                    onClick={() => {
                      setProjectChooserOpen(false);
                      openProjectTemplateDialog();
                    }}
                    type="button"
                  >
                    Create project
                  </button>
                </div>
              )
            ) : null}
            {projectChooserError ? (
              <small
                aria-live="polite"
                className="dialog-error project-chooser-error"
                role="alert"
              >
                {projectChooserError}
              </small>
            ) : null}
            <div className="dialog-actions project-chooser-actions">
              <button
                disabled={
                  isRunning ||
                  openingProjectFolder !== null ||
                  projectChooserLoading
                }
                onClick={closeProjectChooser}
                type="button"
              >
                Cancel
              </button>
              <button
                className="primary-button"
                disabled={
                  openingProjectFolder !== null || projectChooserLoading
                }
                onClick={() => void changeWorkingFolderFromChooser()}
                title={
                  workspaceFolder
                    ? "Choose a different parent folder, then list its UCSBXRP projects."
                    : rememberedWorkspaceFolder
                      ? `Restore read-write access to ${rememberedWorkspaceFolder.name}, then list its UCSBXRP projects.`
                      : "Choose the parent folder that contains your UCSBXRP projects."
                }
                type="button"
              >
                {workspaceFolder
                  ? "Change Working folder…"
                  : rememberedWorkspaceFolder
                    ? "Reconnect Working folder…"
                    : "Choose Working folder…"}
              </button>
            </div>
          </section>
        </div>
      ) : null}

      {newProjectOpen ? (
        <div
          aria-labelledby="new-project-title"
          aria-modal="true"
          className="modal-backdrop"
          role="dialog"
        >
          <form className="new-file-dialog" onSubmit={createNamedProject}>
            <h2 id="new-project-title">
              {projectCreationPurpose === "save-current"
                ? "Save project"
                : preparingChallengeTransition
                  ? "Start another challenge"
                  : "New project"}
            </h2>
            {projectCreationPurpose === "new-project" ||
            preparingChallengeTransition ? (
              <label className="dialog-field" htmlFor="new-project-template">
                <span>
                  {preparingChallengeTransition ? "Challenge" : "Start with"}
                </span>
                <select
                  autoFocus
                  id="new-project-template"
                  aria-label={
                    preparingChallengeTransition
                      ? "Challenge"
                      : "Project template"
                  }
                  onChange={(event) =>
                    selectProjectTemplate(event.target.value)
                  }
                  value={selectedTemplateId}
                >
                  <option value="">
                    {preparingChallengeTransition
                      ? "Choose another challenge…"
                      : "Choose a challenge, demo, or tutorial…"}
                  </option>
                  {preparingChallengeTransition
                    ? availableProjectTemplates
                        .filter(
                          (template) =>
                            template.kind === "challenge" &&
                            template.id !== project.templateId,
                        )
                        .map((template) => (
                          <option key={template.id} value={template.id}>
                            {template.shortLabel}
                          </option>
                        ))
                    : templateGroups
                        .filter((group) =>
                          availableProjectTemplates.some(
                            (template) => template.kind === group.kind,
                          ),
                        )
                        .map((group) => (
                          <optgroup key={group.kind} label={group.label}>
                            {availableProjectTemplates
                              .filter(
                                (template) => template.kind === group.kind,
                              )
                              .map((template) => (
                                <option key={template.id} value={template.id}>
                                  {template.shortLabel}
                                </option>
                              ))}
                          </optgroup>
                        ))}
                </select>
              </label>
            ) : null}
            {projectCreationPurpose === "new-project" && pendingTemplate ? (
              <div className="template-guidance">
                <p className="dialog-context">
                  <strong>{pendingTemplate.shortLabel}:</strong>{" "}
                  {pendingTemplate.summary}
                </p>
                {pendingTemplate.kind === "tutorial" ? (
                  <p className="dialog-context">
                    The tutorial opens with the Virtual XRP selected. Tutorial 5
                    explains when to switch to a physical XRP.
                  </p>
                ) : null}
                {pendingTemplate.kind === "complete-challenge" ? (
                  <p className="dialog-context">
                    Ready to run: this demonstration uses a reference-only
                    <code> course_setup.py</code>. Student component files and
                    component checks are intentionally absent; student challenge
                    projects remain separate.
                  </p>
                ) : null}
              </div>
            ) : null}
            <p className="dialog-context">
              {projectCreationPurpose === "save-current"
                ? `Save ${pendingProject?.name ?? project.name}${workspaceFolder ? ` in ${workspaceFolder.name}` : " in a Working folder"}.`
                : preparingChallengeTransition
                  ? `Review the file changes below, then create a separate project${workspaceFolder ? ` in ${workspaceFolder.name}` : ""}. ${project.name} remains unchanged.`
                  : pendingProject
                    ? `Create this project${workspaceFolder ? ` in ${workspaceFolder.name}` : " after choosing a Working folder"}.`
                    : "Choose a challenge, demo, or tutorial."}
            </p>
            {preparingChallengeTransition && pendingChallengeTransition ? (
              <div
                aria-label="Challenge project file changes"
                className="challenge-transition-preview"
                role="group"
              >
                <div>
                  <strong>Preserve</strong>
                  <span>{pendingChallengeTransition.preserve.join(", ")}</span>
                </div>
                {pendingChallengeTransition.merge.length > 0 ? (
                  <div>
                    <strong>Merge robot calibration</strong>
                    <span>{pendingChallengeTransition.merge.join(", ")}</span>
                  </div>
                ) : null}
                <div>
                  <strong>Replace for the new task</strong>
                  <span>{pendingChallengeTransition.replace.join(", ")}</span>
                </div>
                <div>
                  <strong>Add</strong>
                  <span>{pendingChallengeTransition.add.join(", ")}</span>
                </div>
                {pendingChallengeTransition.omit.length > 0 ? (
                  <div>
                    <strong>Leave in the source project</strong>
                    <span>{pendingChallengeTransition.omit.join(", ")}</span>
                  </div>
                ) : null}
                <small>
                  course_setup.py receives the selected challenge structure;
                  only component files that it uses are copied.
                </small>
              </div>
            ) : null}
            <label htmlFor="new-project-folder">Name</label>
            <input
              aria-describedby="new-project-help"
              aria-invalid={newProjectError ? "true" : undefined}
              autoFocus={projectCreationPurpose === "save-current"}
              disabled={!pendingProject}
              id="new-project-folder"
              onChange={(event) => {
                setNewProjectDraft(event.target.value);
                setNewProjectError("");
              }}
              value={newProjectDraft}
            />
            <small
              aria-live="polite"
              className={newProjectError ? "dialog-error" : ""}
              id="new-project-help"
            >
              {newProjectError ||
                (pendingProject
                  ? `Saves in ${workspaceFolder ? `${workspaceFolder.name}/` : "the Working folder/"}${newProjectDraft || "project"}`
                  : "Choose an item above.")}
            </small>
            <div className="dialog-actions">
              <button onClick={cancelProjectCreation} type="button">
                Cancel
              </button>
              <button
                className="primary-button"
                disabled={
                  isRunning ||
                  !pendingProject ||
                  (!workspaceFolder && !supportsWorkingFolders())
                }
                type="submit"
              >
                {workspaceFolder
                  ? projectCreationPurpose === "save-current"
                    ? "Save"
                    : "Create"
                  : supportsWorkingFolders()
                    ? projectCreationPurpose === "save-current"
                      ? "Choose Working folder and save"
                      : "Choose Working folder and create"
                    : projectCreationPurpose === "save-current"
                      ? "Save unavailable"
                      : "Create unavailable"}
              </button>
            </div>
          </form>
        </div>
      ) : null}

      {newFileOpen ? (
        <div
          aria-labelledby="new-file-title"
          aria-modal="true"
          className="modal-backdrop"
          role="dialog"
        >
          <form className="new-file-dialog" onSubmit={createFile}>
            <h2 id="new-file-title">Create a file</h2>
            <label htmlFor="new-file-path">Project-relative path</label>
            <input
              aria-describedby="new-file-help"
              aria-invalid={newFileError ? "true" : undefined}
              autoFocus
              id="new-file-path"
              onChange={(event) => {
                setNewFilePath(event.target.value);
                setNewFileError("");
              }}
              placeholder="controllers/straight_line.py"
              value={newFilePath}
            />
            <small
              aria-live="polite"
              className={newFileError ? "dialog-error" : ""}
              id="new-file-help"
            >
              {newFileError ||
                "Folders in the path are created when the project is saved."}
            </small>
            <div className="dialog-actions">
              <button
                onClick={() => {
                  setNewFileOpen(false);
                  setNewFilePath("");
                  setNewFileError("");
                }}
                type="button"
              >
                Cancel
              </button>
              <button className="primary-button" type="submit">
                Create file
              </button>
            </div>
          </form>
        </div>
      ) : null}

      {pathOperation ? (
        <div
          aria-labelledby="file-operation-title"
          aria-modal="true"
          className="modal-backdrop"
          role="dialog"
        >
          <form className="new-file-dialog" onSubmit={applyPathOperation}>
            <h2 id="file-operation-title">
              {pathOperation === "rename" ? "Rename file" : "Duplicate file"}
            </h2>
            <p className="dialog-context">
              {pathOperation === "rename"
                ? `Choose a new path for ${activePath}.`
                : `Choose a path for the duplicate of ${activePath}.`}
            </p>
            <label htmlFor="file-operation-path">Project-relative path</label>
            <input
              aria-describedby="file-operation-help"
              aria-invalid={pathOperationError ? "true" : undefined}
              autoFocus
              id="file-operation-path"
              onChange={(event) => {
                setPathDraft(event.target.value);
                setPathOperationError("");
              }}
              value={pathDraft}
            />
            <small
              aria-live="polite"
              className={pathOperationError ? "dialog-error" : ""}
              id="file-operation-help"
            >
              {pathOperationError ||
                "Use a path inside the project, such as student/controller.py."}
            </small>
            <div className="dialog-actions">
              <button
                onClick={() => {
                  setPathOperation(null);
                  setPathDraft("");
                  setPathOperationError("");
                }}
                type="button"
              >
                Cancel
              </button>
              <button className="primary-button" type="submit">
                {pathOperation === "rename" ? "Rename file" : "Duplicate file"}
              </button>
            </div>
          </form>
        </div>
      ) : null}

      {deletePath ? (
        <div
          aria-labelledby="delete-file-title"
          aria-modal="true"
          className="modal-backdrop"
          role="alertdialog"
        >
          <div className="new-file-dialog">
            <h2 id="delete-file-title">Delete {deletePath}?</h2>
            <p className="dialog-context">
              This removes the file from the current project. A connected
              project folder updates automatically.
            </p>
            <div className="dialog-actions">
              <button
                autoFocus
                onClick={() => setDeletePath(null)}
                type="button"
              >
                Keep file
              </button>
              <button
                className="danger-button confirm-danger"
                onClick={confirmDeleteFile}
                type="button"
              >
                Delete file
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
