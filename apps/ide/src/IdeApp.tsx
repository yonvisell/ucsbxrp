import Editor from "@monaco-editor/react";
import {
  type ChangeEvent,
  type FormEvent,
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
  createNextChallengeProject,
  nextChallengeTemplate,
  physicalEndpointCandidates,
  targetPreferenceForConfiguredNetwork,
  targetPreferenceForPhysicalNetwork,
  testCourseProjectComponents,
  type TargetClient,
  type TargetEvent,
  type TargetKind,
  type PhysicalConnectionMode,
  type TargetRunState,
  type SynchronizedProject,
  type CourseProjectKind,
} from "@ucsb-xrp/target";

import { OfflineReadiness } from "../../shared/OfflineReadiness";
import { AppNavigation } from "../../shared/AppNavigation";
import { isEmbeddedApplication } from "../../shared/embedded-application";
import { ResetIcon, RunStopIcon } from "../../shared/HeaderIcons";
import { SplitWorkspaceLink } from "../../shared/SplitWorkspaceLink";
import { useTargetPreference } from "../../shared/use-target-preference";
import {
  OFFLINE_SHELL_EVENT,
  readOfflineShellStatus,
  registerOfflineShellBeforeReload,
  retryPendingOfflineShellReload,
  virtualRunNeedsPreparation,
  type OfflineShellStatus,
} from "../../shared/offline-shell";
import courseRelease from "../../../vendor/current/release.json";
import { finishProjectBootstrap } from "../../shared/project-bootstrap";
import type { AuthorDraftProject } from "../../shared/author-draft-handoff";
import { MarkdownPreview } from "./MarkdownPreview";
import {
  chooseWorkspaceFolder,
  courseFolderIsWaitingForIde,
  courseFolderPermission,
  finishCourseFolderIdeHandoff,
  forgetProjectFolder,
  forgetWorkspaceFolder,
  loadRememberedProjectFolder,
  loadRememberedWorkspaceFolder,
  rememberProjectFolder,
  replaceRememberedWorkspaceFolder,
  requestCourseFolderPermission,
} from "../../shared/course-folder";
import {
  createProjectFolder,
  deleteProjectFile,
  duplicateProjectFile,
  hasProjectFolderMetadata,
  isCourseRepositoryFolder,
  loadRecoveredProjectState,
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
  storeRecoveredProject,
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
import {
  ideReloadIsIdle,
  projectRevisionIdentity,
  projectRevisionIsReloadable,
} from "./ide-release-reload";

interface ConsoleEntry {
  id: string;
  category: "program" | "service";
  stream: "stdout" | "stderr" | "system";
  line: string;
  timestampMs?: number;
}

interface IdeSettings {
  editorFontSize: number;
  consoleFontSize: number;
  tabSize: 2 | 4;
  wordWrap: "off" | "on";
  minimap: boolean;
}

type PathOperation = "rename" | "duplicate";

type ProjectCreationPurpose = "new-project" | "next-challenge" | "save-current";

type WorkingFolderAccessState = "none" | "needs-permission" | "connected";

interface ProjectFolderConflictState {
  folderSession: ProjectSession;
  folderDigest: string;
}

const settingsKey = "ucsb-xrp-ide-settings-v2";
const maximumSessionLogEntries = 5_000;

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
const defaultSettings: IdeSettings = {
  editorFontSize: 9,
  consoleFontSize: 9,
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
        value.consoleFontSize >= 8 &&
        value.consoleFontSize <= 16
          ? value.consoleFontSize
          : defaultSettings.consoleFontSize,
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
  "main.py": {
    href: "../reference/#project-loop",
    label: "Measured program loop",
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

function contextHelpForPath(path: string) {
  return contextHelpByFilename[path.split("/").at(-1) ?? ""] ?? null;
}

const templateGroups: readonly {
  kind: CourseProjectKind;
  label: string;
}[] = [
  { kind: "challenge", label: "Course challenges" },
  { kind: "demo", label: "Robot demos" },
  { kind: "tutorial", label: "Tutorials" },
];

function openingPathForNewProject(project: ProjectSnapshot): string {
  const template = COURSE_PROJECT_TEMPLATES.find(
    (candidate) => candidate.id === project.templateId,
  );
  return (template?.kind === "challenge" || template?.kind === "tutorial") &&
    "README.md" in project.files
    ? "README.md"
    : project.entrypoint;
}

function checkFileForProject(project: ProjectSnapshot): string | null {
  if ("exercise_checks.py" in project.files) return "exercise_checks.py";
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
  projectBootstrapOwner: string;
}

export function IdeApp({
  authorDraftProject,
  projectBootstrapOwner,
}: IdeAppProps) {
  const embeddedApplication = isEmbeddedApplication();
  const storedRecovery = useMemo(() => loadRecoveredProjectState(), []);
  const initialRecovery = useMemo(
    () =>
      authorDraftProject
        ? {
            project: authorDraftProject,
            preservedDraft: storedRecovery.project,
          }
        : storedRecovery,
    [authorDraftProject, storedRecovery],
  );
  const initialProjectSession = useMemo(
    () =>
      createProjectSession(initialRecovery.project, {
        source: "browser-draft",
      }),
    [initialRecovery.project],
  );
  const initialProject = initialProjectSession.project;
  const [settings, setSettings] = useState<IdeSettings>(loadSettings);
  const [targetPreference, updateTargetPreference] = useTargetPreference();
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
  const [openPaths, setOpenPaths] = useState([initialProject.entrypoint]);
  const [markdownPreviewOpen, setMarkdownPreviewOpen] = useState(
    initialProject.entrypoint.endsWith(".md"),
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
    "Current files have not been checked.",
  );
  const [checkOk, setCheckOk] = useState<boolean | null>(null);
  const [syncDetail, setSyncDetail] = useState(
    "Run will load the current project into XRP memory.",
  );
  const [syncOk, setSyncOk] = useState<boolean | null>(null);
  const [consoleEntries, setConsoleEntries] = useState<ConsoleEntry[]>([]);
  const [consoleTab, setConsoleTab] = useState<"status" | "output" | "details">(
    "output",
  );
  const [outputPanelOpen, setOutputPanelOpen] = useState(false);
  const [projectPanelOpen, setProjectPanelOpen] = useState(
    initiallyShowProjectPanel,
  );
  const [settingsOpen, setSettingsOpen] = useState(false);
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
  const [projectCreationPurpose, setProjectCreationPurpose] =
    useState<ProjectCreationPurpose>("new-project");
  const [
    continueToNextChallengeAfterSave,
    setContinueToNextChallengeAfterSave,
  ] = useState(false);
  const [pathOperation, setPathOperation] = useState<PathOperation | null>(
    null,
  );
  const [pathDraft, setPathDraft] = useState("");
  const [pathOperationError, setPathOperationError] = useState("");
  const [fileActionsOpen, setFileActionsOpen] = useState(false);
  const [addressDraftActive, setAddressDraftActive] = useState(false);
  const [stationAddressDraft, setStationAddressDraft] = useState(
    targetPreference.stationEndpoint,
  );
  const [deletePath, setDeletePath] = useState<string | null>(null);
  const nextConsoleId = useRef(1);
  const initializedProjectEffect = useRef(false);
  const projectRef = useRef(project);
  const projectSessionRef = useRef(projectSession);
  const preservedBrowserDraftRef = useRef<ProjectSnapshot | undefined>(
    initialRecovery.preservedDraft,
  );
  const [preservedBrowserDraft, setPreservedBrowserDraft] =
    useState<ProjectSnapshot | null>(initialRecovery.preservedDraft ?? null);
  const settingsDrawerRef = useRef<HTMLElement | null>(null);
  const fileActionsRef = useRef<HTMLDivElement | null>(null);
  const importInputRef = useRef<HTMLInputElement | null>(null);
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
      "The project folder changed outside UCSBXRP. Choose which version to keep; neither version has been overwritten.",
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

  const commitStationAddressDraft = useCallback(() => {
    if (addressDraftActive) {
      updateTargetPreference((current) =>
        targetPreferenceForConfiguredNetwork(current, {
          mode: "station",
          stationAddress: stationAddressDraft,
        }),
      );
    }
    setAddressDraftActive(false);
  }, [addressDraftActive, stationAddressDraft, updateTargetPreference]);

  const closeSettings = useCallback(() => {
    commitStationAddressDraft();
    setSettingsOpen(false);
  }, [commitStationAddressDraft]);

  useEffect(() => {
    if (!addressDraftActive) {
      setStationAddressDraft(targetPreference.stationEndpoint);
    }
  }, [addressDraftActive, targetPreference.stationEndpoint]);

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
      if (result.reason === "folder-conflict") {
        preserveBrowserDraft(snapshotForProjectSession(browser));
        setProjectPanelOpen(true);
        setProjectFolderConflict({
          folderSession: folder,
          folderDigest: opened.contentDigest,
        });
      } else {
        setProjectFolderConflict(null);
      }
      if (result.preserveBrowserDraft) {
        preserveBrowserDraft(snapshotForProjectSession(browser));
      }
      return { folder, result };
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
        "The project folder changed outside UCSBXRP. Choose which version to keep; neither version has been overwritten.",
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
    if (!projectSessionReady) {
      targetStateRef.current = "disconnected";
      setTargetState("disconnected");
      setTargetDetail("Opening the saved project…");
      return;
    }
    setProjectProviderActive(false);
    setProjectProviderAvailable(false);
    projectProviderActiveRef.current = false;
    target.setProjectRunProvider(provideProjectRunSnapshot);
    const unsubscribe = target.subscribe((event: TargetEvent) => {
      if (event.type === "status") {
        targetStateRef.current = event.state;
        setTargetState(event.state);
        setTargetDetail(event.detail);
      } else if (event.type === "physical-network") {
        updateTargetPreference((current) =>
          targetPreferenceForPhysicalNetwork(current, event),
        );
      } else if (event.type === "console") {
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
        targetStateRef.current = "error";
        setTargetState("error");
        setTargetDetail(errorDetail(error));
      } finally {
        if (!disposed) finishProjectBootstrap(projectBootstrapOwner);
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
    projectBootstrapOwner,
    projectSessionReady,
    provideProjectRunSnapshot,
    target,
    updateTargetPreference,
  ]);

  useEffect(() => {
    projectRef.current = project;
    projectVersion.current += 1;
    if (initializedProjectEffect.current) {
      setCheckOk(null);
      setCheckDetail("Files changed since the last code check.");
      setSyncOk(null);
      setSyncDetail("Files changed; Run will load the updated project.");
    } else {
      initializedProjectEffect.current = true;
    }
  }, [project]);

  useEffect(() => {
    if (!projectSessionReady || !projectProviderActive) return;
    storeRecoveredProject(
      snapshotForProjectSession(projectSession),
      preservedBrowserDraftRef.current,
    );
  }, [projectProviderActive, projectSession, projectSessionReady]);

  useEffect(() => {
    if (!projectSessionReady || !projectProviderActive) return;
    projectFolderHandleWriteRef.current = (
      workingFolder
        ? rememberProjectFolder(workingFolder)
        : forgetProjectFolder()
    ).finally(retryPendingOfflineShellReload);
  }, [projectProviderActive, projectSessionReady, workingFolder]);

  useEffect(() => {
    if (!projectSessionReady) return;
    if (!projectProviderActive) return;
    target.markProjectChanged({
      projectId: projectSession.projectId,
      revision: projectSession.revision,
      name: projectSession.project.name,
      entrypoint: projectSession.project.entrypoint,
    });
  }, [
    projectSession.project.entrypoint,
    projectSession.project.name,
    projectSession.projectId,
    projectSession.revision,
    projectSessionReady,
    projectProviderActive,
    target,
  ]);

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
    let disposed = false;
    const restoreFolders = async () => {
      const browserSession = initialProjectSession;
      let resolvedSession = browserSession;
      const [loadedWorkspace, rememberedProject] = await Promise.all([
        loadRememberedWorkspaceFolder(),
        authorDraftProject
          ? Promise.resolve(null)
          : loadRememberedProjectFolder(),
      ]);
      if (disposed) return;
      const commissioningHandoff = courseFolderIsWaitingForIde();
      let workspace = loadedWorkspace;
      let folder = rememberedProject;
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
        setOpenPaths([resolvedSession.project.entrypoint]);
        replacePendingFolderDeletions(() => new Set());
        return result;
      };
      if (workspace) {
        setRememberedWorkspaceFolder(workspace);
        const permission = await courseFolderPermission(workspace);
        if (disposed) return;
        if (permission === "granted") {
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
            if (commissioningHandoff) {
              setOperationDetail(
                `${workspace.name} is the Working folder. New projects will be created in named project folders inside it.`,
              );
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
              `${reconciliation.session.source === "browser-draft" ? "Recovered newer browser changes for" : "Opened"} ./${folder.name}.${
                opened.skipped
                  ? ` Skipped ${opened.skipped} unsupported item${opened.skipped === 1 ? "" : "s"}.`
                  : ""
              }${reconciliation.preserveBrowserDraft ? " The previous unsaved project can be reopened in the Project panel." : ""}`,
            );
          }
        } else {
          setFolderSaveState("permission");
          setOperationDetail(
            `Reconnect project folder ${folder.name} once to resume automatic saves.`,
          );
        }
      }
      if (disposed) return;
      if (authorDraftProject) {
        setFolderSaveState("browser");
        setOperationDetail(
          "Opened an unpublished challenge draft. Validate and run it, then save it to a new Project folder if you want to retain it.",
        );
      }
      publishProjectSession(resolvedSession);
      setProjectSessionReady(true);
      if (commissioningHandoff) finishCourseFolderIdeHandoff();
    };
    void restoreFolders().catch((error: unknown) => {
      if (disposed) return;
      setFolderSaveState("error");
      setOperationDetail(
        `The remembered project folder could not be reopened: ${errorDetail(error)} The browser project remains available.`,
      );
      publishProjectSession(initialProjectSession);
      setProjectSessionReady(true);
      if (courseFolderIsWaitingForIde()) finishCourseFolderIdeHandoff();
    });
    return () => {
      disposed = true;
    };
  }, [
    authorDraftProject,
    initialProjectSession,
    publishProjectSession,
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
    targetState === "ready" ||
    (target.kind === "virtual" && targetState === "error");
  const canRunProject = canCommand && projectProviderActive;
  const projectCheckFile = checkFileForProject(project);
  const checkingExercises = projectCheckFile === "exercise_checks.py";
  const projectFiles = useMemo(
    () => Object.keys(project.files).sort((a, b) => a.localeCompare(b)),
    [project.files],
  );
  const projectPathSet = useMemo(() => new Set(projectFiles), [projectFiles]);
  const followingChallenge = useMemo(
    () =>
      project.templateId ? nextChallengeTemplate(project.templateId) : null,
    [project.templateId],
  );
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

  const openFile = useCallback((path: string) => {
    setOpenPaths((paths) => (paths.includes(path) ? paths : [...paths, path]));
    setActivePath(path);
  }, []);

  useEffect(() => {
    setMarkdownPreviewOpen(activePath.endsWith(".md"));
  }, [activePath]);

  const stageOpenedProject = useCallback(
    async (snapshot: ProjectSnapshot) => {
      if (!projectProviderActiveRef.current) return;
      beginTargetCommand();
      try {
        await target.markProjectStale(snapshot);
      } catch {
        // Opening and editing remain available while a physical XRP is offline.
      } finally {
        finishTargetCommand();
      }
    },
    [beginTargetCommand, finishTargetCommand, target],
  );

  useEffect(() => {
    if (!projectSessionReady || !projectProviderActive || !isConnected) return;
    void stageOpenedProject(projectRef.current);
  }, [
    isConnected,
    projectProviderActive,
    projectSessionReady,
    stageOpenedProject,
  ]);

  const useThisProjectForRun = useCallback(() => {
    target.setProjectRunProvider(provideProjectRunSnapshot, { takeover: true });
    setOperationDetail(
      `Selecting ${projectSessionRef.current.project.name} as the active project for Run and Monitor.`,
    );
  }, [provideProjectRunSnapshot, target]);

  const closeFile = useCallback(
    (path: string) => {
      setOpenPaths((paths) => {
        if (paths.length === 1) {
          return paths;
        }
        const index = paths.indexOf(path);
        const remaining = paths.filter((candidate) => candidate !== path);
        if (path === activePath) {
          setActivePath(
            remaining[Math.min(index, remaining.length - 1)] ??
              project.entrypoint,
          );
        }
        return remaining;
      });
    },
    [activePath, project.entrypoint],
  );

  const updateActiveFile = useCallback(
    (content: string) => {
      const current = projectRef.current;
      const nextProject = {
        ...current,
        files: { ...current.files, [activePath]: content },
      };
      applyProjectChange(nextProject);
      setFolderDirty(true);
      setOperationDetail(
        workingFolder
          ? "Changes save to this project folder automatically."
          : "Changes are backed up in this browser.",
      );
    },
    [activePath, applyProjectChange, workingFolder],
  );

  const validateCode = useCallback(async () => {
    if (!canCommand || isRunning) {
      return;
    }
    beginTargetCommand();
    setOutputPanelOpen(true);
    setConsoleTab("status");
    setCheckDetail("Compiling Python project files with MicroPython…");
    try {
      const result = await target.check(project);
      setCheckOk(result.ok);
      setCheckDetail(result.detail);
    } catch (error) {
      setCheckOk(false);
      setCheckDetail(errorDetail(error));
    } finally {
      finishTargetCommand();
      retryPendingOfflineShellReload();
    }
  }, [
    beginTargetCommand,
    canCommand,
    finishTargetCommand,
    isRunning,
    project,
    target,
  ]);

  const testComponents = useCallback(async () => {
    if (componentCheckRunning || projectCheckFile === null) {
      return;
    }
    componentCheckRunningRef.current = true;
    setComponentCheckRunning(true);
    setOutputPanelOpen(true);
    setConsoleTab("output");
    setOperationDetail(
      checkingExercises
        ? "Checking tutorial exercises without starting a robot…"
        : "Running hardware-free component checks…",
    );
    try {
      const result = await testCourseProjectComponents({
        ...project,
        entrypoint: projectCheckFile,
      });
      const completionDetail = checkingExercises
        ? result.detail.replace(/^Component checks/, "Exercise checks")
        : result.detail;
      const incompleteComponents =
        !checkingExercises &&
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
              : `${checkingExercises ? "Exercise" : "Component"} checks stopped: ${completionDetail}`,
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
            ? checkingExercises
              ? "Exercise checks finished; review the results below."
              : "Component checks finished; review PASS and NOT IMPLEMENTED results below."
            : checkingExercises
              ? "One or more exercises are incomplete or incorrect; review Program output."
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
          line: `${checkingExercises ? "Exercise" : "Component"} checks could not run: ${detail}`,
          timestampMs: Date.now(),
        },
      ]);
      setOperationDetail(
        `${checkingExercises ? "Exercise" : "Component"} checks could not run.`,
      );
    } finally {
      componentCheckRunningRef.current = false;
      setComponentCheckRunning(false);
      retryPendingOfflineShellReload();
    }
  }, [checkingExercises, componentCheckRunning, project, projectCheckFile]);

  const runTarget = useCallback(async () => {
    if (!canRunProject || isRunning || virtualRuntimePreparing) {
      return;
    }
    beginTargetCommand();
    setOutputPanelOpen(true);
    setConsoleTab("output");
    let validationPassed = checkOk === true;
    try {
      if (!validationPassed) {
        setCheckDetail("Compiling Python project files with MicroPython…");
        const result = await target.check(project);
        setCheckOk(result.ok);
        setCheckDetail(result.detail);
        validationPassed = result.ok;
      }
      if (!validationPassed) {
        setConsoleTab("details");
        return;
      }
      await target.run(project);
      if (target.kind === "physical") {
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
      finishTargetCommand();
      retryPendingOfflineShellReload();
    }
  }, [
    beginTargetCommand,
    canRunProject,
    checkOk,
    finishTargetCommand,
    isRunning,
    project,
    target,
    virtualRuntimePreparing,
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
    if (!isConnected) {
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
  }, [beginTargetCommand, finishTargetCommand, isConnected, target]);

  const attachWorkingFolder = useCallback(
    async (folder: CourseDirectoryHandle) => {
      setOperationDetail(`Reading ${folder.name}…`);
      const result = await readProjectFolder(folder);
      const { folder: folderSession, result: reconciliation } =
        reconcileFolderSnapshot(result);
      // Publish the complete project to the shared target before exposing it as
      // the active project. Monitor Run can otherwise observe the new IDE files
      // while the shared worker still owns the preceding project.
      await stageOpenedProject(reconciliation.session.project);
      stopFolderWrites();
      setWorkingFolder(folder);
      setRememberedFolder(folder);
      setRememberedFolderCanAttach(true);
      setFolderSaveState("current");
      publishProjectSession(reconciliation.session);
      setActivePath(reconciliation.session.project.entrypoint);
      setOpenPaths([reconciliation.session.project.entrypoint]);
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
        }${result.skipped ? `; ${result.skipped} item${result.skipped === 1 ? "" : "s"} skipped` : ""}.${reconciliation.preserveBrowserDraft ? " The previous unsaved project can be reopened below." : ""}`,
      );
    },
    [
      publishProjectSession,
      reconcileFolderSnapshot,
      replacePendingFolderDeletions,
      stageOpenedProject,
      stopFolderWrites,
    ],
  );

  const connectWorkingFolder = useCallback(
    async (folder: CourseDirectoryHandle) => {
      if (await isCourseRepositoryFolder(folder)) {
        throw new Error(
          "Choose a Working folder for student projects, not the UCSBXRP course software repository.",
        );
      }
      const selection = await replaceRememberedWorkspaceFolder(folder);
      if (!selection.remembered) {
        throw new Error(`Chrome could not remember ${folder.name}.`);
      }
      setWorkspaceFolder(folder);
      setRememberedWorkspaceFolder(folder);
      setWorkingFolderAccessState("connected");
      setOperationDetail(
        `${folder.name} is the Working folder. New projects will be created inside it; the current project remains open.`,
      );
      return folder;
    },
    [],
  );

  const selectWorkspaceFolder = useCallback(async () => {
    beginFolderInteraction();
    try {
      return await connectWorkingFolder(await chooseWorkspaceFolder());
    } catch (error) {
      if (!wasCancelled(error)) {
        setOperationDetail(errorDetail(error));
      }
      return null;
    } finally {
      finishFolderInteraction();
    }
  }, [beginFolderInteraction, connectWorkingFolder, finishFolderInteraction]);

  const ensureWorkingFolderAccess = useCallback(async () => {
    if (workspaceFolder) return workspaceFolder;

    beginFolderInteraction();
    try {
      if (rememberedWorkspaceFolder) {
        const permission = await requestCourseFolderPermission(
          rememberedWorkspaceFolder,
        );
        if (permission !== "granted") {
          setWorkingFolderAccessState("needs-permission");
          setOperationDetail(
            `Access to the Working folder ${rememberedWorkspaceFolder.name} was not granted. The current project is unchanged. Reconnect it or choose a different Working folder in Settings.`,
          );
          return null;
        }
        return await connectWorkingFolder(rememberedWorkspaceFolder);
      }

      return await connectWorkingFolder(await chooseWorkspaceFolder());
    } catch (error) {
      if (!wasCancelled(error)) {
        setOperationDetail(errorDetail(error));
      }
      return null;
    } finally {
      finishFolderInteraction();
    }
  }, [
    beginFolderInteraction,
    connectWorkingFolder,
    finishFolderInteraction,
    rememberedWorkspaceFolder,
    workspaceFolder,
  ]);

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
    const folder = workspaceFolder
      ? await selectWorkspaceFolder()
      : await ensureWorkingFolderAccess();
    if (folder) {
      await showProjectsInWorkingFolder(folder);
      return;
    }
    setProjectChooserError(
      rememberedWorkspaceFolder
        ? `Access to ${rememberedWorkspaceFolder.name} was not granted. The current project is unchanged.`
        : "No Working folder was selected. The current project is unchanged.",
    );
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
    setSelectedTemplateId("");
    setProjectCreationPurpose("new-project");
    setContinueToNextChallengeAfterSave(false);
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
          "Folder access was not granted. The browser project remains current.",
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
      await stageOpenedProject(reconciliation.session.project);
      publishProjectSession(reconciliation.session);
      setActivePath(reconciliation.session.project.entrypoint);
      setOpenPaths([reconciliation.session.project.entrypoint]);
      setWorkingFolder(rememberedFolder);
      const folderNeedsWrite =
        opened.project.session === undefined ||
        reconciliation.session.source === "browser-draft" ||
        reconciliation.session.revision !== folderSession.revision ||
        reconciliation.session.updatedAt !== folderSession.updatedAt;
      setFolderDirty(folderNeedsWrite);
      setFolderSaveState(folderNeedsWrite ? "pending" : "current");
      setOperationDetail(
        `Reconnected project folder ${rememberedFolder.name}.${folderNeedsWrite ? " Recovered edits will save automatically." : " Files are current."}${reconciliation.preserveBrowserDraft ? " The previous unsaved project can be reopened in the Project panel." : ""}`,
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
    setFolderSaveState("pending");
    const timer = window.setTimeout(() => {
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
          setOperationDetail(`Saved changes to ./${folder.name}.`);
          retryPendingOfflineShellReload();
        })
        .catch((error: unknown) => {
          if (
            error instanceof DOMException &&
            error.name === "NotAllowedError"
          ) {
            setWorkingFolder(null);
            setRememberedFolder(folder);
            setFolderSaveState("permission");
          } else {
            setFolderSaveState("error");
          }
          setOperationDetail(errorDetail(error));
        });
    }, 900);
    return () => window.clearTimeout(timer);
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
      await stageOpenedProject(projectFolderConflict.folderSession.project);
      publishProjectSession(projectFolderConflict.folderSession);
      setActivePath(projectFolderConflict.folderSession.project.entrypoint);
      setOpenPaths([projectFolderConflict.folderSession.project.entrypoint]);
      replacePendingFolderDeletions(() => new Set());
      folderDirtyRef.current = false;
      setFolderDirty(false);
      setProjectFolderConflict(null);
      setFolderSaveState("current");
      setOperationDetail(
        `Opened the files currently in ./${workingFolder.name}. The previous unsaved project can be reopened below.`,
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
    setOperationDetail(`Saving the IDE files to ./${folder.name}…`);
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
        `Kept the IDE files in ./${folder.name}. The previous folder files were retained in project autosaves.`,
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
        "Wait for the current project to finish saving before opening the previous unsaved project.",
      );
      return;
    }
    try {
      stopFolderWrites();
      const restored = createProjectSession(snapshot, {
        source: "browser-draft",
      });
      await stageOpenedProject(restored.project);
      publishProjectSession(restored);
      setActivePath(restored.project.entrypoint);
      setOpenPaths([restored.project.entrypoint]);
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
        `Opened previous unsaved project ${restored.project.name}. Choose a Working folder to save it.`,
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
              pathOperation !== null ||
              addressDraftActive,
            folderInteractionActive: folderInteractionCountRef.current > 0,
            folderSaveActive: folderSaveStateRef.current === "saving",
          });

        if (!projectSessionReadyRef.current || projectFolderConflict) {
          return false;
        }
        const sessionToSave = projectSessionRef.current;
        const expected = projectRevisionIdentity(sessionToSave);
        let browserRecoveryAvailable = false;
        if (projectProviderActiveRef.current) {
          browserRecoveryAvailable = storeRecoveredProject(
            snapshotForProjectSession(sessionToSave),
            preservedBrowserDraftRef.current,
          );
        }
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
          // Only the active IDE publishes browser recovery. A standby tab may
          // contain a distinct draft, so it waits for explicit project
          // takeover or closure instead of silently discarding that work.
          if (
            !projectProviderActiveRef.current &&
            projectSessionHasUnsavedChanges(sessionToSave)
          ) {
            return false;
          }
          if (projectProviderActiveRef.current && !browserRecoveryAvailable) {
            setOperationDetail(
              "Chrome could not preserve this project for the course update. Save it to a project folder, then the update can continue.",
            );
            return false;
          }
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
            if (projectProviderActiveRef.current) {
              storeRecoveredProject(
                snapshotForProjectSession(outcome.session),
                preservedBrowserDraftRef.current,
              );
            }
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
      addressDraftActive,
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
      !addressDraftActive &&
      folderInteractionCountRef.current === 0
    ) {
      retryPendingOfflineShellReload();
    }
  }, [
    addressDraftActive,
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
    setSelectedTemplateId("");
    setPendingProject(null);
    setProjectCreationPurpose("new-project");
    setNewProjectDraft("");
    setNewProjectError("");
    setNewProjectOpen(true);
  }, []);

  const selectProjectTemplate = useCallback((templateId: string) => {
    setSelectedTemplateId(templateId);
    const template = COURSE_PROJECT_TEMPLATES.find(
      (candidate) => candidate.id === templateId,
    );
    if (!template) {
      setPendingProject(null);
      setNewProjectDraft("");
      return;
    }
    const snapshot: ProjectSnapshot = {
      name: template.project.name ?? template.id.replaceAll("_", "-"),
      entrypoint: template.project.entrypoint,
      files: { ...template.project.files },
      templateId: template.id,
    };
    setPendingProject(snapshot);
    setProjectCreationPurpose("new-project");
    setNewProjectDraft(suggestedProjectFolderName(snapshot.name));
    setNewProjectError("");
  }, []);

  const prepareNextChallengeCreation = useCallback(
    async (sourceProject: ProjectSnapshot) => {
      if (!sourceProject.templateId) {
        throw new Error("This project is not part of the challenge sequence.");
      }
      const nextTemplate = nextChallengeTemplate(sourceProject.templateId);
      if (!nextTemplate) {
        throw new Error("This is the final challenge in the sequence.");
      }
      const next = createNextChallengeProject(
        sourceProject.templateId,
        sourceProject,
      );
      await prepareProjectCreation(
        {
          ...next,
          name: next.name ?? nextTemplate.shortLabel,
          templateId: nextTemplate.id,
        },
        "next-challenge",
      );
      return nextTemplate;
    },
    [prepareProjectCreation],
  );

  const startNextChallenge = useCallback(async () => {
    if (!project.templateId || !followingChallenge) return;
    if (!workingFolder) {
      setContinueToNextChallengeAfterSave(true);
      setOperationDetail(
        `Save ${project.name} as a project, then the IDE will continue to ${followingChallenge.label}.`,
      );
      await saveProjectFiles();
      return;
    }
    if (!workspaceFolder) {
      setOperationDetail(
        "Choose the Working folder for the next challenge project.",
      );
      if (!(await ensureWorkingFolderAccess())) return;
    }
    try {
      await prepareNextChallengeCreation(project);
    } catch (error) {
      setOperationDetail(
        `The next challenge could not be created: ${errorDetail(error)}`,
      );
    }
  }, [
    followingChallenge,
    prepareNextChallengeCreation,
    project,
    saveProjectFiles,
    ensureWorkingFolderAccess,
    workingFolder,
    workspaceFolder,
  ]);

  const activateBrowserOnlyProject = useCallback(
    async (snapshot: ProjectSnapshot, showChallengeBrief: boolean) => {
      stopFolderWrites();
      const currentSession = projectSessionRef.current;
      if (projectSessionHasUnsavedChanges(currentSession)) {
        preserveBrowserDraft(snapshotForProjectSession(currentSession));
      }
      const nextSession = createProjectSession(snapshot, {
        source: "browser-draft",
      });
      await stageOpenedProject(nextSession.project);
      publishProjectSession(nextSession);
      const openingPath = showChallengeBrief
        ? openingPathForNewProject(snapshot)
        : nextSession.project.entrypoint;
      setActivePath(openingPath);
      setOpenPaths([openingPath]);
      setWorkingFolder(null);
      setRememberedFolder(null);
      setRememberedFolderCanAttach(false);
      replacePendingFolderDeletions(() => new Set());
      setFolderDirty(true);
      setFolderSaveState("browser");
      setCheckOk(null);
      setCheckDetail("Current files have not been checked.");
      setSyncOk(null);
      setSyncDetail("Run will load the current project into XRP memory.");
      setOperationDetail(`Opened ${snapshot.name} without a project folder.`);
    },
    [
      preserveBrowserDraft,
      publishProjectSession,
      replacePendingFolderDeletions,
      stageOpenedProject,
      stopFolderWrites,
    ],
  );

  const createTemporaryPendingProject = useCallback(async () => {
    if (!pendingProject) return;
    if (
      projectCreationPurpose === "save-current" &&
      continueToNextChallengeAfterSave
    ) {
      setContinueToNextChallengeAfterSave(false);
      try {
        const nextTemplate = await prepareNextChallengeCreation(pendingProject);
        setOperationDetail(
          `Kept ${pendingProject.name} without a folder. Name the ${nextTemplate.label} project to continue.`,
        );
      } catch (error) {
        cancelProjectCreation();
        setOperationDetail(
          `The next challenge could not be prepared: ${errorDetail(error)}`,
        );
      }
      return;
    }
    await activateBrowserOnlyProject(
      pendingProject,
      projectCreationPurpose !== "save-current",
    );
    cancelProjectCreation();
  }, [
    activateBrowserOnlyProject,
    cancelProjectCreation,
    continueToNextChallengeAfterSave,
    pendingProject,
    prepareNextChallengeCreation,
    projectCreationPurpose,
  ]);

  const createNamedProject = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!pendingProject) return;
      const validationError = projectFolderNameError(newProjectDraft);
      if (validationError) {
        setNewProjectError(validationError);
        return;
      }
      let projectsFolder = workspaceFolder;
      if (!projectsFolder) {
        if (!supportsWorkingFolders()) {
          await createTemporaryPendingProject();
          return;
        }
        projectsFolder = await ensureWorkingFolderAccess();
        if (!projectsFolder) {
          setNewProjectError(
            "No Working folder was selected. The current project is unchanged.",
          );
          return;
        }
      }
      beginFolderInteraction();
      try {
        setNewProjectError("");
        setOperationDetail(`Creating ${newProjectDraft.trim()}…`);
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
        stopFolderWrites();
        await stageOpenedProject(nextSession.project);
        publishProjectSession(nextSession);
        const openingPath =
          projectCreationPurpose !== "save-current"
            ? openingPathForNewProject(pendingProject)
            : nextSession.project.entrypoint;
        setActivePath(openingPath);
        setOpenPaths([openingPath]);
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
        const shouldContinueToNextChallenge =
          projectCreationPurpose === "save-current" &&
          continueToNextChallengeAfterSave;
        if (shouldContinueToNextChallenge) {
          setContinueToNextChallengeAfterSave(false);
          try {
            const nextTemplate = await prepareNextChallengeCreation(
              nextSession.project,
            );
            setOperationDetail(
              `Saved ${nextSession.project.name} in ./${folder.name}. Name the ${nextTemplate.label} project to continue.`,
            );
          } catch (error) {
            cancelProjectCreation();
            setOperationDetail(
              `Saved ${nextSession.project.name} in ./${folder.name}, but the next challenge could not be prepared: ${errorDetail(error)}`,
            );
          }
        } else {
          const completedPurpose = projectCreationPurpose;
          cancelProjectCreation();
          setOperationDetail(
            completedPurpose === "save-current"
              ? `Saved ${nextSession.project.name} as ./${folder.name}. Edits and monitored runs save there automatically.`
              : `Created ./${folder.name}. Edits and monitored runs save there automatically.`,
          );
        }
      } catch (error) {
        setNewProjectError(errorDetail(error));
      } finally {
        finishFolderInteraction();
      }
    },
    [
      beginFolderInteraction,
      cancelProjectCreation,
      continueToNextChallengeAfterSave,
      createTemporaryPendingProject,
      finishFolderInteraction,
      newProjectDraft,
      pendingProject,
      prepareNextChallengeCreation,
      preserveBrowserDraft,
      projectCreationPurpose,
      publishProjectSession,
      replacePendingFolderDeletions,
      ensureWorkingFolderAccess,
      stageOpenedProject,
      stopFolderWrites,
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
          : `${path} created in the browser project.`,
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
        if (pathOperation === "rename") {
          setOpenPaths((paths) =>
            paths.map((path) => (path === activePath ? nextPath : path)),
          );
        } else {
          setOpenPaths((paths) =>
            paths.includes(nextPath) ? paths : [...paths, nextPath],
          );
        }
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
      setOpenPaths((paths) => {
        const remaining = paths.filter((path) => path !== deletePath);
        return remaining.length > 0 ? remaining : [nextProject.entrypoint];
      });
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
        : "This project is not saved to a folder. It remains available in this browser.";
  const projectStorageSummary = projectFolderConflict
    ? "Folder changes need review"
    : workingFolder
      ? folderSaveState === "error"
        ? "Automatic save failed"
        : folderSaveState === "saving" || folderDirty
          ? "Saving automatically…"
          : "Changes save automatically"
      : rememberedFolder && rememberedFolderCanAttach
        ? `Reconnect ./${rememberedFolder.name} to resume automatic saving`
        : "Changes stay in this browser until saved";
  const workingFolderName =
    workspaceFolder?.name ?? rememberedWorkspaceFolder?.name ?? null;
  const workingFolderAccessSummary =
    workingFolderAccessState === "connected"
      ? "Connected · contains each project folder"
      : workingFolderAccessState === "needs-permission"
        ? "Reconnect once to open or create projects"
        : "Choose the parent folder that will contain your projects";
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
      ? `${targetDetail}${targetDetail.endsWith(".") ? "" : "."} Project ${physicalStatus}.`
      : targetDetail;
  const nextRunProjectName = projectProviderActive
    ? project.name
    : projectProviderAvailable && currentProject
      ? currentProject.name
      : target.kind === "virtual"
        ? DEFAULT_COURSE_PROJECT.name
        : "No project selected";
  const activeHelp = contextHelpForPath(activePath);
  const pendingTemplate = pendingProject?.templateId
    ? COURSE_PROJECT_TEMPLATES.find(
        (template) => template.id === pendingProject.templateId,
      )
    : null;
  const pendingTemplatePredecessor = pendingTemplate?.predecessorId
    ? COURSE_PROJECT_TEMPLATES.find(
        (template) => template.id === pendingTemplate.predecessorId,
      )
    : null;
  const progressingToNextChallenge =
    projectCreationPurpose === "next-challenge";
  const carriedFiles =
    progressingToNextChallenge && pendingTemplate
      ? pendingTemplate.components
          .filter((component) => component.carryForward)
          .map((component) => component.file)
      : [];
  const followingChallengeCarriedFiles = followingChallenge
    ? followingChallenge.components
        .filter((component) => component.carryForward)
        .map((component) => component.file)
    : [];

  if (!projectSessionReady) {
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
          Opening the saved project…
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
            onChange={(event) =>
              updateTargetPreference((current) => ({
                ...current,
                kind: event.target.value as TargetKind,
              }))
            }
            title="Choose whether Run uses the simulator or the configured physical XRP."
            value={targetPreference.kind}
          >
            <option value="virtual">Virtual XRP</option>
            <option value="physical">Physical XRP</option>
          </select>
          <button
            disabled={!canCommand || isRunning}
            onClick={validateCode}
            title={
              target.kind === "physical" && targetState === "error"
                ? targetDetail
                : "Compile all Python files with MicroPython (⌘/Ctrl+Shift+Enter)"
            }
          >
            Validate
          </button>
          <button
            aria-label={isRunning ? "Stop" : "Run"}
            className={`command-run-button header-icon-button ${isRunning ? "danger-button" : "primary-button"}`}
            disabled={!isRunning && (!canRunProject || virtualRuntimePreparing)}
            onClick={isRunning ? stopProgram : runTarget}
            title={
              isRunning
                ? "Stop the running program."
                : virtualRuntimePreparing
                  ? "Chrome is preparing the Virtual XRP. This page refreshes once automatically, then Run becomes available."
                  : !projectProviderActive
                    ? "Another IDE tab controls Run. Choose Use for Run + Monitor in the Project panel to switch."
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
            disabled={!isConnected}
            onClick={resetTarget}
            title="Stop the program and restore the selected XRP to its initial course state."
          >
            <ResetIcon />
            <span className="visually-hidden">Reset</span>
          </button>
          <SplitWorkspaceLink />
        </div>
        <div className="header-statuses">
          <div
            aria-live="polite"
            className="connection-pill"
            data-testid="target-status"
            role="status"
            title={targetStatusTitle}
          >
            <span aria-hidden="true" className={`status-dot ${targetState}`} />
            <span>
              {target.kind === "virtual" ? "Virtual XRP" : "Physical XRP"} ·{" "}
              {targetState}
              {target.kind === "physical" ? ` · ${physicalStatus}` : ""}
            </span>
          </div>
          {target.kind === "physical" && targetState === "error" ? (
            <button
              aria-label="Reconnect XRP"
              className="quiet-button target-retry-button"
              onClick={() => setConnectionAttempt((attempt) => attempt + 1)}
              title="Try the configured XRP Wi-Fi connection again."
            >
              Reconnect
            </button>
          ) : null}
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

      <main
        className={`ide-workspace ${projectPanelOpen ? "" : "project-collapsed"}`}
      >
        {projectPanelOpen ? (
          <aside className="project-rail panel" aria-label="Project">
            <div className="panel-header project-heading">
              <h2 className="panel-title">Current project</h2>
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
                <span className="project-location" data-testid="project-folder">
                  {workingFolder
                    ? `./${workingFolder.name}`
                    : "Not saved to a folder"}
                </span>
                <small
                  className="project-save-state"
                  data-testid="project-save-state"
                >
                  {projectStorageSummary}
                </small>
              </div>
              {!projectProviderActive ? (
                <div
                  className="project-owner-state standby"
                  data-testid="project-owner-state"
                  role="status"
                >
                  <span>
                    {projectProviderAvailable
                      ? "Run uses another IDE tab"
                      : "Run has no IDE project"}
                  </span>
                  <button
                    disabled={!isConnected}
                    onClick={useThisProjectForRun}
                    title="Use this tab's current project for the next IDE or Monitor Run."
                  >
                    Use for Run + Monitor
                  </button>
                </div>
              ) : null}
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
                  aria-label="Project actions"
                  className="project-actions"
                  role="group"
                >
                  <button
                    aria-label="Open project…"
                    className="open-folder-button"
                    disabled={!supportsWorkingFolders()}
                    onClick={() => void openProject()}
                    title="Open an existing UCSBXRP project with read-write access. Changes save to its folder automatically."
                  >
                    Open project…
                  </button>
                  <button
                    aria-label="New project…"
                    onClick={openProjectTemplateDialog}
                    title="Create a new project from a course challenge, demo, or tutorial."
                  >
                    New project…
                  </button>
                  {!workingFolder ? (
                    rememberedFolder && rememberedFolderCanAttach ? (
                      <button
                        className="project-storage-action"
                        onClick={reconnectWorkingFolder}
                        title={`Reconnect ${rememberedFolder.name} with read-write access and resume automatic saving.`}
                      >
                        Reconnect project folder…
                      </button>
                    ) : (
                      <button
                        className="project-storage-action"
                        disabled={!supportsWorkingFolders()}
                        onClick={() => void saveProjectFiles()}
                        title={`Create a named project folder for ${project.name}. Changes will save there automatically.`}
                      >
                        Save project…
                      </button>
                    )
                  ) : null}
                </div>
                <div
                  aria-label="Create or import project files"
                  className="file-create-actions"
                  role="group"
                >
                  <button
                    aria-label="New file…"
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
                <div className="course-project-actions">
                  {projectCheckFile ? (
                    <button
                      className="component-check-button"
                      disabled={componentCheckRunning}
                      onClick={() => void testComponents()}
                      title={
                        checkingExercises
                          ? "Check the tutorial exercises without starting either robot. PASS, NOT COMPLETED, and INCORRECT results appear in Program output."
                          : "Run this challenge's component checks in MicroPython without starting either robot. PASS, NOT IMPLEMENTED, and FAIL results appear in Program output."
                      }
                    >
                      {componentCheckRunning
                        ? checkingExercises
                          ? "Checking exercises…"
                          : "Testing components…"
                        : checkingExercises
                          ? "Check exercises"
                          : "Test components"}
                    </button>
                  ) : null}
                  {followingChallenge ? (
                    <button
                      className="next-challenge-button"
                      onClick={() => void startNextChallenge()}
                      title={`Continue in a separate ${followingChallenge.label} project. Copies ${followingChallengeCarriedFiles.join(", ")} from this project; this project remains unchanged.`}
                    >
                      Continue to {followingChallenge.label}…
                    </button>
                  ) : null}
                </div>
                {projectFolderConflict || operationDetail ? (
                  <div className="project-feedback">
                    {projectFolderConflict ? (
                      <div
                        aria-live="polite"
                        className="project-folder-conflict"
                        role="alert"
                      >
                        <small>
                          The folder changed outside UCSBXRP. Choose which files
                          to keep. Neither version has been overwritten.
                        </small>
                        <div>
                          <button
                            onClick={useFolderConflictFiles}
                            title="Open the files currently in the project folder. The current IDE files will remain available as the previous unsaved project."
                          >
                            Use folder files
                          </button>
                          <button
                            onClick={keepIdeConflictFiles}
                            title="Write the IDE files to the project folder and retain the previous folder files in autosaves."
                          >
                            Keep IDE files
                          </button>
                        </div>
                      </div>
                    ) : (
                      <small
                        aria-live="polite"
                        className="project-operation-detail"
                        title={operationDetail}
                      >
                        {operationDetail}
                      </small>
                    )}
                  </div>
                ) : null}
              </div>
            </div>
          </aside>
        ) : null}

        <section
          className={`editor-stack ${outputPanelOpen ? "" : "output-collapsed"}`}
        >
          <div className="editor-panel panel">
            <div
              className="editor-tabbar"
              role="tablist"
              aria-label="Open files"
            >
              {!projectPanelOpen ? (
                <button
                  className="project-reopen"
                  onClick={() => setProjectPanelOpen(true)}
                  title="Show project"
                >
                  Project ›
                </button>
              ) : null}
              {openPaths.map((path) => (
                <div
                  className={`editor-tab ${path === activePath ? "active" : ""}`}
                  key={path}
                  role="presentation"
                >
                  <button
                    aria-selected={path === activePath}
                    className="tab-select"
                    onClick={() => setActivePath(path)}
                    role="tab"
                    title={path}
                  >
                    <span>{path.split("/").at(-1)}</span>
                  </button>
                  <button
                    aria-label={`Close ${path}`}
                    className="tab-close"
                    disabled={openPaths.length === 1}
                    onClick={() => closeFile(path)}
                    title={`Close ${path}`}
                  >
                    ×
                  </button>
                </div>
              ))}
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
                  rel="noopener noreferrer"
                  target="_blank"
                  title={`Open ${activeHelp.label} for ${activePath}.`}
                >
                  {activeHelp.label} ↗
                </a>
              ) : null}
            </div>
            <div className="editor-frame" data-testid="python-editor">
              {activePath.endsWith(".md") && markdownPreviewOpen ? (
                <MarkdownPreview
                  onOpenProjectFile={openFile}
                  projectPaths={projectPathSet}
                  source={project.files[activePath] ?? ""}
                />
              ) : (
                <Editor
                  language={editorLanguage(activePath)}
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
                    renderLineHighlight: "gutter",
                    scrollBeyondLastLine: false,
                    stickyScroll: { enabled: false },
                    tabFocusMode: false,
                    tabSize: settings.tabSize,
                    wordWrap: settings.wordWrap,
                  }}
                  path={activePath}
                  theme="vs"
                  value={project.files[activePath] ?? ""}
                />
              )}
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
                  title="Show concise target, validation, project, and file status."
                >
                  Status
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
                  title="Show validation, connection, flash, and target-service messages."
                >
                  System log
                  {serviceDetails.length > 0
                    ? ` (${serviceDetails.length})`
                    : ""}
                </button>
              </div>
              <div className="console-actions">
                {outputPanelOpen && consoleTab !== "status" ? (
                  <button
                    className="clear-output"
                    disabled={visibleConsoleEntries.length === 0}
                    onClick={() =>
                      setConsoleEntries((entries) =>
                        entries.filter((entry) =>
                          consoleTab === "output"
                            ? entry.category !== "program"
                            : entry.category !== "service",
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
                  <span>Next run</span>
                  <strong>
                    {nextRunProjectName} ·{" "}
                    {target.kind === "virtual" ? "Virtual XRP" : "Physical XRP"}
                  </strong>
                </div>
                <div>
                  <span>Validation</span>
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
                        : "Not checked"}
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
                      : "Validation, connection, project-loading, and target-service messages appear here."}
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
                      <span>{entry.line}</span>
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
            <h3>Project storage</h3>
            <div className="project-setting-state">
              <span>Working folder</span>
              <strong>{workingFolderName ?? "Not selected"}</strong>
              <small>{workingFolderAccessSummary}</small>
            </div>
            <div className="project-setting-actions">
              {workingFolderAccessState === "needs-permission" ? (
                <button
                  disabled={!supportsWorkingFolders()}
                  onClick={() => void ensureWorkingFolderAccess()}
                  title="Restore read-write access to the remembered Working folder."
                >
                  Reconnect Working folder…
                </button>
              ) : null}
              <button
                disabled={!supportsWorkingFolders()}
                onClick={selectWorkspaceFolder}
                title="Choose the parent folder used when new projects are created. The current project remains open."
              >
                {workingFolderName
                  ? "Change Working folder…"
                  : "Choose Working folder…"}
              </button>
              {preservedBrowserDraft ? (
                <button
                  disabled={
                    folderDirty ||
                    folderSaveState === "saving" ||
                    projectFolderConflict !== null
                  }
                  onClick={() => void reopenPreviousBrowserDraft()}
                  title={`Open the previous unsaved project ${preservedBrowserDraft.name}. The current folder-backed project remains on disk.`}
                >
                  Open previous unsaved project · {preservedBrowserDraft.name}
                </button>
              ) : null}
            </div>
          </section>
          {targetPreference.kind === "physical" ? (
            <fieldset className="xrp-wifi-settings">
              <legend>XRP Wi-Fi</legend>
              <p className="xrp-wifi-summary">
                Project flashing, controls, and telemetry use Wi-Fi. USB handles
                firmware, setup, repair, and changes to the network stored on
                the XRP.
              </p>
              <label className="setting-row">
                <span>Network</span>
                <select
                  aria-label="Network"
                  aria-describedby="physical-connection-help"
                  onChange={(event) =>
                    updateTargetPreference((current) =>
                      targetPreferenceForConfiguredNetwork(current, {
                        mode: event.target.value as PhysicalConnectionMode,
                      }),
                    )
                  }
                  value={targetPreference.physicalConnection}
                >
                  <option value="access_point">Robot hotspot</option>
                  <option value="station">Existing Wi-Fi</option>
                </select>
                <small id="physical-connection-help">
                  {targetPreference.physicalConnection === "access_point"
                    ? "Join the UCSB-XRP network shown during USB setup; the robot is at 192.168.4.1."
                    : "Use the same local Wi-Fi network as the XRP."}
                </small>
              </label>
              {targetPreference.physicalConnection === "station" ? (
                <label className="setting-row">
                  <span>XRP address</span>
                  <input
                    aria-label="XRP address"
                    aria-describedby="physical-address-help"
                    onBlur={commitStationAddressDraft}
                    onChange={(event) => {
                      setAddressDraftActive(true);
                      setStationAddressDraft(event.target.value);
                    }}
                    onFocus={() => setAddressDraftActive(true)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") event.currentTarget.blur();
                    }}
                    spellCheck={false}
                    type="url"
                    value={stationAddressDraft}
                  />
                  <small id="physical-address-help">
                    USB setup reports this address. Monitor uses the same
                    setting.
                  </small>
                </label>
              ) : null}
              <a
                className="commission-settings-link"
                href="../commission/"
                title="Install, update, repair, or change the XRP network over USB-C."
              >
                Set up or repair XRP ↗
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
              min="8"
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
          <section className="settings-note">
            <h3>Physical workflow</h3>
            <p>
              Virtual and physical targets use the same project. On a physical
              XRP, Run validates when needed, loads the current project into
              robot memory, and starts it. Resetting the XRP clears that loaded
              copy; the next Run loads it again from the IDE.
            </p>
          </section>
          <section className="settings-note offline-settings-note">
            <h3>Offline access</h3>
            <OfflineReadiness appName="IDE" />
          </section>
          <section className="settings-note shortcuts-note">
            <h3>Shortcuts</h3>
            <dl>
              <div>
                <dt>Save</dt>
                <dd>⌘/Ctrl+S</dd>
              </div>
              <div>
                <dt>Validate</dt>
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
            <span className="dialog-kicker">PROJECTS</span>
            <h2 id="open-project-title">Open a project</h2>
            <p className="dialog-context">
              {workspaceFolder ? (
                <>
                  Choose a UCSBXRP project directly inside{" "}
                  <strong>{workspaceFolder.name}</strong>. The IDE opens it with
                  read-write access and saves changes to its folder
                  automatically.
                </>
              ) : rememberedWorkspaceFolder ? (
                <>
                  Reconnect the Working folder{" "}
                  <strong>{rememberedWorkspaceFolder.name}</strong> to list its
                  Project folders. The current project remains open until you
                  choose another.
                </>
              ) : (
                <>
                  First choose the parent <strong>Working folder</strong> that
                  contains your Project folders. Only UCSBXRP projects directly
                  inside it appear in this list. The current project remains
                  open until you choose another.
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
                      disabled={openingProjectFolder !== null}
                      key={choice.folderName}
                      onClick={() => void openListedProject(choice)}
                      type="button"
                    >
                      <strong>{choice.projectName}</strong>
                      <small>
                        ./{choice.folderName} · {choice.fileCount} file
                        {choice.fileCount === 1 ? "" : "s"}
                      </small>
                      {openingProjectFolder === choice.folderName ? (
                        <span>Opening…</span>
                      ) : null}
                    </button>
                  ))}
                </div>
              ) : (
                <p className="project-chooser-status">
                  No valid UCSBXRP project folders were found directly inside
                  this Working folder.
                </p>
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
                  openingProjectFolder !== null || projectChooserLoading
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
            <span className="dialog-kicker">
              {projectCreationPurpose === "save-current"
                ? "SAVE PROJECT"
                : progressingToNextChallenge
                  ? "NEXT CHALLENGE"
                  : "NEW PROJECT"}
            </span>
            <h2 id="new-project-title">
              {projectCreationPurpose === "save-current"
                ? "Save project"
                : "Create a project"}
            </h2>
            {projectCreationPurpose === "new-project" ? (
              <label className="dialog-field" htmlFor="new-project-template">
                <span>Start from</span>
                <select
                  autoFocus
                  id="new-project-template"
                  aria-label="Project template"
                  onChange={(event) =>
                    selectProjectTemplate(event.target.value)
                  }
                  value={selectedTemplateId}
                >
                  <option value="">
                    Choose a challenge, demo, or tutorial…
                  </option>
                  {templateGroups.map((group) => (
                    <optgroup key={group.kind} label={group.label}>
                      {COURSE_PROJECT_TEMPLATES.filter(
                        (template) => template.kind === group.kind,
                      ).map((template) => (
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
                {pendingTemplatePredecessor ? (
                  <p className="dialog-context">
                    In the course sequence, continue from{" "}
                    <strong>{pendingTemplatePredecessor.shortLabel}</strong> so
                    your earlier component files carry forward. Creating this
                    template here starts an independent project.
                  </p>
                ) : null}
              </div>
            ) : null}
            <p className="dialog-context">
              {projectCreationPurpose === "save-current"
                ? `Create a named folder for ${pendingProject?.name ?? project.name}. Source files, automatic copies, program output, and telemetry will stay with this project.`
                : progressingToNextChallenge
                  ? `This creates a separate project in ${workspaceFolder ? `the Working folder ${workspaceFolder.name}` : "a Working folder you choose"}. It carries ${carriedFiles.join(", ")} from ${project.name}; the current project remains unchanged. The new challenge supplies its own task, world, and newly introduced modules.`
                  : pendingProject
                    ? `The project folder will be created in ${workspaceFolder ? `the Working folder ${workspaceFolder.name}` : "a Working folder you choose"}. Source files, automatic copies, program output, and telemetry will stay with this project.`
                    : "Choose the course project you want to create."}
            </p>
            <label htmlFor="new-project-folder">Project folder name</label>
            <input
              aria-describedby="new-project-help"
              aria-invalid={newProjectError ? "true" : undefined}
              autoFocus={projectCreationPurpose !== "new-project"}
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
                  ? `Project folder: ${workspaceFolder ? `${workspaceFolder.name}/` : ""}${newProjectDraft || "project"}`
                  : "Select a project above.")}
            </small>
            <div className="dialog-actions">
              <button onClick={cancelProjectCreation} type="button">
                Cancel
              </button>
              {projectCreationPurpose === "new-project" &&
              pendingProject &&
              !workspaceFolder &&
              supportsWorkingFolders() ? (
                <button
                  onClick={() => void createTemporaryPendingProject()}
                  title="Open the project now. Changes remain in this browser until you choose a Working folder."
                  type="button"
                >
                  Continue without a folder
                </button>
              ) : null}
              <button
                className="primary-button"
                disabled={!pendingProject}
                type="submit"
              >
                {workspaceFolder
                  ? projectCreationPurpose === "save-current"
                    ? "Save project"
                    : "Create project"
                  : supportsWorkingFolders()
                    ? projectCreationPurpose === "save-current"
                      ? "Choose Working folder and save…"
                      : "Choose Working folder and create…"
                    : projectCreationPurpose === "save-current"
                      ? "Keep without a folder"
                      : "Create without a folder"}
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
            <span className="dialog-kicker">PROJECT</span>
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
            <span className="dialog-kicker">PROJECT FILE</span>
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
            <span className="dialog-kicker">CONFIRM DELETION</span>
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
