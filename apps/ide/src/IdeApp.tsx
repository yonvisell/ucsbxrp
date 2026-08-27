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
import { ResetIcon, RunStopIcon } from "../../shared/HeaderIcons";
import { useTargetPreference } from "../../shared/use-target-preference";
import {
  registerOfflineShellBeforeReload,
  retryPendingOfflineShellReload,
  virtualRunNeedsPreparation,
} from "../../shared/offline-shell";
import { finishProjectBootstrap } from "../../shared/project-bootstrap";
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
  projectFolderIsInsideCourseFolder,
  rememberProjectFolder,
  replaceRememberedWorkspaceFolder,
  requestCourseFolderPermission,
} from "../../shared/course-folder";
import {
  chooseWorkingFolder,
  createProjectFolder,
  defaultProjectFolderName,
  deleteProjectFile,
  duplicateProjectFile,
  ensureProjectFolder,
  hasProjectFolderMetadata,
  isCourseRepositoryFolder,
  isDefaultProject,
  loadRecoveredProjectState,
  normalizedProjectPath,
  projectContentDigest,
  projectPathError,
  projectFolderNameError,
  ProjectFolderConflictError,
  readProjectFolder,
  renameProjectFile,
  saveProjectFolderWithAutosave,
  sameProjectContents,
  setProjectEntrypoint,
  storeRecoveredProject,
  suggestedDuplicatePath,
  suggestedProjectFolderName,
  supportsWorkingFolders,
  type CourseDirectoryHandle,
  type FolderReadResult,
  type ProjectSnapshot,
} from "./project-files";
import {
  acknowledgeProjectSessionSave,
  createProjectSession,
  markProjectSessionSaved,
  projectSessionHasUnsavedChanges,
  reconcileProjectSessions,
  snapshotForProjectSession,
  updateProjectSession,
  type ProjectSession,
} from "./project-session";
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

const apiReferenceByFilename: Record<string, { href: string; label: string }> =
  {
    "course_setup.py": {
      href: "../reference/#student-components",
      label: "Components",
    },
    "sensor_model.py": {
      href: "../reference/#sensor-model",
      label: "SensorModel",
    },
    "wheel_speed_controller.py": {
      href: "../reference/#wheel-speed-controller",
      label: "Wheel controller",
    },
    "differential_drive.py": {
      href: "../reference/#differential-drive",
      label: "DifferentialDrive",
    },
    "odometry.py": { href: "../reference/#odometry", label: "Odometry" },
    "navigation_controller.py": {
      href: "../reference/#navigation-controller",
      label: "Navigation",
    },
    "grid_planner.py": {
      href: "../reference/#grid-planner",
      label: "GridPlanner",
    },
    "robot_config.py": {
      href: "../reference/#configuration",
      label: "Configuration",
    },
    "challenge.py": {
      href: "../reference/#missions",
      label: "Mission services",
    },
    "world.json": { href: "../reference/#worlds", label: "Project world" },
  };

function apiReferenceForPath(path: string) {
  return apiReferenceByFilename[path.split("/").at(-1) ?? ""] ?? null;
}

const templateGroups: readonly {
  kind: CourseProjectKind;
  label: string;
}[] = [
  { kind: "challenge", label: "Course challenges" },
  { kind: "demo", label: "Robot demos" },
  { kind: "tutorial", label: "Tutorials" },
];

function initiallyShowProjectPanel(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) {
    return true;
  }
  return window.matchMedia("(min-width: 761px)").matches;
}

interface IdeAppProps {
  projectBootstrapOwner: string;
}

export function IdeApp({ projectBootstrapOwner }: IdeAppProps) {
  const initialRecovery = useMemo(() => loadRecoveredProjectState(), []);
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
  const [rememberedFolder, setRememberedFolder] =
    useState<CourseDirectoryHandle | null>(null);
  const [rememberedFolderCanAttach, setRememberedFolderCanAttach] =
    useState(true);
  const [folderSaveState, setFolderSaveState] = useState<
    "browser" | "pending" | "saving" | "current" | "permission" | "error"
  >("browser");
  const [folderDirty, setFolderDirty] = useState(false);
  const [projectFolderConflict, setProjectFolderConflict] =
    useState<ProjectFolderConflictState | null>(null);
  const [operationDetail, setOperationDetail] = useState(
    "This project is stored temporarily in Chrome. Choose a working folder to create its project folder, or open an existing project folder.",
  );
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
  const [newProjectDraft, setNewProjectDraft] = useState("");
  const [newProjectError, setNewProjectError] = useState("");
  const [pendingProject, setPendingProject] = useState<ProjectSnapshot | null>(
    null,
  );
  const [pathOperation, setPathOperation] = useState<PathOperation | null>(
    null,
  );
  const [pathDraft, setPathDraft] = useState("");
  const [pathOperationError, setPathOperationError] = useState("");
  const [fileActionsOpen, setFileActionsOpen] = useState(false);
  const [deletePath, setDeletePath] = useState<string | null>(null);
  const [pendingFolderDeletions, setPendingFolderDeletions] = useState(
    () => new Set<string>(),
  );
  const nextConsoleId = useRef(1);
  const initializedProjectEffect = useRef(false);
  const projectRef = useRef(project);
  const projectSessionRef = useRef(projectSession);
  const preservedBrowserDraftRef = useRef<ProjectSnapshot | undefined>(
    initialRecovery.preservedDraft,
  );
  const settingsDrawerRef = useRef<HTMLElement | null>(null);
  const fileActionsRef = useRef<HTMLDivElement | null>(null);
  const importInputRef = useRef<HTMLInputElement | null>(null);
  const projectVersion = useRef(0);
  const displayedProjectKey = useRef(
    `${initialProject.templateId ?? "custom"}:${initialProject.name}`,
  );

  useEffect(() => {
    if (!window.matchMedia) {
      return;
    }
    const narrowLayout = window.matchMedia("(max-width: 760px)");
    const collapseProjectPanel = (event: MediaQueryListEvent) => {
      if (event.matches) {
        setProjectPanelOpen(false);
      }
    };
    narrowLayout.addEventListener("change", collapseProjectPanel);
    return () =>
      narrowLayout.removeEventListener("change", collapseProjectPanel);
  }, []);
  const folderWriteQueue = useRef<Promise<void>>(Promise.resolve());
  const folderWriteEpoch = useRef(0);
  const pendingFolderDeletionsRef = useRef(new Set<string>());
  const projectSessionReadyRef = useRef(false);
  const workingFolderRef = useRef<CourseDirectoryHandle | null>(null);
  const folderDirtyRef = useRef(false);
  const targetStateRef = useRef<TargetRunState>("disconnected");
  const projectProviderActiveRef = useRef(false);
  const targetCommandCountRef = useRef(0);
  const componentCheckRunningRef = useRef(false);

  projectSessionReadyRef.current = projectSessionReady;
  workingFolderRef.current = workingFolder;
  folderDirtyRef.current = folderDirty;
  targetStateRef.current = targetState;
  projectProviderActiveRef.current = projectProviderActive;

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
  }, []);

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
    folderWriteEpoch.current += 1;
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
        preservedBrowserDraftRef.current = snapshotForProjectSession(browser);
        setProjectPanelOpen(true);
        setProjectFolderConflict({
          folderSession: folder,
          folderDigest: opened.contentDigest,
        });
      } else {
        setProjectFolderConflict(null);
      }
      if (result.preserveBrowserDraft) {
        preservedBrowserDraftRef.current = snapshotForProjectSession(browser);
      }
      return { folder, result };
    },
    [],
  );

  const recordProjectFolderConflict = useCallback(
    (conflict: ProjectFolderConflictError) => {
      stopFolderWrites();
      const browser = projectSessionRef.current;
      preservedBrowserDraftRef.current = snapshotForProjectSession(browser);
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
    [stopFolderWrites],
  );

  const replacePendingFolderDeletions = useCallback(
    (update: (current: Set<string>) => Set<string>) => {
      const next = update(pendingFolderDeletionsRef.current);
      pendingFolderDeletionsRef.current = next;
      setPendingFolderDeletions(next);
    },
    [],
  );

  useEffect(() => {
    if (!projectSessionReady) {
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
    setTargetState("connecting");
    setTargetDetail(`Connecting to ${target.kind} XRP…`);
    setCurrentProject(null);
    let disposed = false;
    const connect = async () => {
      try {
        await target.connect();
      } catch (error: unknown) {
        if (disposed) return;
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
    if (!projectSessionReady) return;
    storeRecoveredProject(
      snapshotForProjectSession(projectSession),
      preservedBrowserDraftRef.current,
    );
  }, [projectSession, projectSessionReady]);

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
        loadRememberedProjectFolder(),
      ]);
      if (disposed) return;
      const commissioningHandoff = courseFolderIsWaitingForIde();
      let workspace = loadedWorkspace;
      let folder = rememberedProject;
      let defaultProjectCreated = false;
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
            setOperationDetail(
              "The UCSBXRP course software repository cannot be used as a working folder. Choose a separate folder for your projects.",
            );
          } else {
            setWorkspaceFolder(workspace);
            if (commissioningHandoff) {
              setOperationDetail(
                `${workspace.name} is ready. New projects will be created in named folders inside it.`,
              );
            }
          }
        }
      }
      if (workspace && folder) {
        const belongsToCourseFolder = await projectFolderIsInsideCourseFolder(
          workspace,
          folder,
        );
        if (disposed) return;
        if (belongsToCourseFolder === false) {
          await forgetProjectFolder();
          folder = null;
          setRememberedFolder(null);
          setRememberedFolderCanAttach(false);
          setFolderSaveState("browser");
          setOperationDetail(
            "The remembered project is outside the selected working folder. It was detached without changing its files.",
          );
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
              }${reconciliation.preserveBrowserDraft ? " An earlier unsaved browser draft was retained." : ""}`,
            );
          }
        } else {
          setFolderSaveState("permission");
          setOperationDetail(
            `Reconnect project folder ${folder.name} once to resume automatic saves.`,
          );
        }
      }
      if (
        !folder &&
        workspace &&
        (await courseFolderPermission(workspace)) === "granted" &&
        isDefaultProject(browserSession.project)
      ) {
        try {
          const result = await ensureProjectFolder(
            workspace,
            defaultProjectFolderName,
            snapshotForProjectSession(browserSession),
          );
          folder = result.folder;
          defaultProjectCreated = result.created;
          void rememberProjectFolder(folder);
          const opened = await readProjectFolder(folder);
          if (disposed) return;
          const reconciliation = await attachFolderProject(folder, opened);
          setOperationDetail(
            `${defaultProjectCreated ? "Created" : reconciliation.session.source === "browser-draft" ? "Recovered newer browser changes for" : "Opened"} ./${folder.name}. Edits and monitored runs save there automatically.${reconciliation.preserveBrowserDraft ? " An earlier unsaved browser draft was retained." : ""}`,
          );
        } catch (error) {
          setOperationDetail(
            `${workspace.name} is ready, but the default project folder could not be created: ${errorDetail(error)}`,
          );
        }
      }
      if (disposed) return;
      publishProjectSession(resolvedSession);
      setProjectSessionReady(true);
      if (commissioningHandoff) finishCourseFolderIdeHandoff();
    };
    void restoreFolders().catch((error: unknown) => {
      if (disposed) return;
      setFolderSaveState("error");
      setOperationDetail(
        `The remembered project folder could not be reopened: ${errorDetail(error)} The temporary browser copy remains available.`,
      );
      publishProjectSession(initialProjectSession);
      setProjectSessionReady(true);
      if (courseFolderIsWaitingForIde()) finishCourseFolderIdeHandoff();
    });
    return () => {
      disposed = true;
    };
  }, [
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
  const replacementEntrypoint = projectFiles.find(
    (path) => path !== activePath && path.endsWith(".py"),
  );
  const canDeleteActiveFile =
    projectFiles.length > 1 &&
    (activePath !== project.entrypoint || replacementEntrypoint !== undefined);

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
    if (componentCheckRunning || !("component_checks.py" in project.files)) {
      return;
    }
    componentCheckRunningRef.current = true;
    setComponentCheckRunning(true);
    setOutputPanelOpen(true);
    setConsoleTab("output");
    setOperationDetail("Running hardware-free component checks…");
    try {
      const result = await testCourseProjectComponents({
        ...project,
        entrypoint: "component_checks.py",
      });
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
          line: result.ok
            ? result.detail
            : `Component checks stopped: ${result.detail}`,
        },
      ];
      setConsoleEntries((entries) => [
        ...entries.slice(-(maximumSessionLogEntries - lines.length)),
        ...lines,
      ]);
      setOperationDetail(
        result.ok
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
  }, [componentCheckRunning, project]);

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

  const openWorkingFolder = useCallback(async () => {
    try {
      const folder = await chooseWorkingFolder();
      const courseFolder = workspaceFolder ?? rememberedWorkspaceFolder;
      if (
        courseFolder &&
        (await projectFolderIsInsideCourseFolder(courseFolder, folder)) ===
          false
      ) {
        throw new Error(
          `Choose a project folder inside the working folder ${courseFolder.name}.`,
        );
      }
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
      void rememberProjectFolder(folder);
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
        }${result.skipped ? `; ${result.skipped} item${result.skipped === 1 ? "" : "s"} skipped` : ""}.${reconciliation.preserveBrowserDraft ? " An earlier unsaved browser draft was retained." : ""}`,
      );
    } catch (error) {
      if (!wasCancelled(error)) {
        setOperationDetail(errorDetail(error));
      }
    }
  }, [
    rememberedWorkspaceFolder,
    publishProjectSession,
    reconcileFolderSnapshot,
    replacePendingFolderDeletions,
    stageOpenedProject,
    stopFolderWrites,
    workspaceFolder,
  ]);

  const selectWorkspaceFolder = useCallback(async () => {
    try {
      const folder = await chooseWorkspaceFolder();
      if (await isCourseRepositoryFolder(folder)) {
        throw new Error(
          "Choose a working folder for student projects, not the UCSBXRP course software repository.",
        );
      }
      const selection = await replaceRememberedWorkspaceFolder(folder);
      if (!selection.remembered) {
        throw new Error(`Chrome could not remember ${folder.name}.`);
      }
      stopFolderWrites();
      let projectAttached = false;
      let activeProjectFolder = workingFolder;
      setWorkspaceFolder(folder);
      setRememberedWorkspaceFolder(folder);
      if (
        activeProjectFolder &&
        (await projectFolderIsInsideCourseFolder(
          folder,
          activeProjectFolder,
        )) === false
      ) {
        activeProjectFolder = null;
        setWorkingFolder(null);
        setRememberedFolder(null);
        setRememberedFolderCanAttach(false);
        setFolderSaveState("browser");
        publishProjectSession(
          createProjectSession(
            snapshotForProjectSession(projectSessionRef.current),
            { source: "browser-draft" },
          ),
        );
      }
      if (!activeProjectFolder && isDefaultProject(projectRef.current)) {
        const ensured = await ensureProjectFolder(
          folder,
          defaultProjectFolderName,
          snapshotForProjectSession(projectSessionRef.current),
        );
        const opened = await readProjectFolder(ensured.folder);
        const { folder: folderSession, result: reconciliation } =
          reconcileFolderSnapshot(opened);
        publishProjectSession(reconciliation.session);
        setActivePath(reconciliation.session.project.entrypoint);
        setOpenPaths([reconciliation.session.project.entrypoint]);
        setWorkingFolder(ensured.folder);
        setRememberedFolder(ensured.folder);
        setRememberedFolderCanAttach(true);
        const folderNeedsWrite =
          opened.project.session === undefined ||
          reconciliation.session.source === "browser-draft" ||
          reconciliation.session.revision !== folderSession.revision ||
          reconciliation.session.updatedAt !== folderSession.updatedAt;
        setFolderSaveState(folderNeedsWrite ? "pending" : "current");
        setFolderDirty(folderNeedsWrite);
        replacePendingFolderDeletions(() => new Set());
        void rememberProjectFolder(ensured.folder);
        setOperationDetail(
          `${ensured.created ? "Created" : "Opened"} ./${ensured.folder.name}. Edits and monitored runs save there automatically.`,
        );
        projectAttached = true;
      } else {
        setOperationDetail(
          `${folder.name} is the working folder for new project folders.`,
        );
      }
      return { folder, projectAttached };
    } catch (error) {
      if (!wasCancelled(error)) {
        setOperationDetail(errorDetail(error));
      }
      return null;
    }
  }, [
    publishProjectSession,
    reconcileFolderSnapshot,
    replacePendingFolderDeletions,
    stopFolderWrites,
    workingFolder,
  ]);

  const prepareProjectCreation = useCallback(
    async (snapshot: ProjectSnapshot, chooseWorkspaceIfMissing = false) => {
      let workspace = workspaceFolder;
      if (!workspace && chooseWorkspaceIfMissing && rememberedWorkspaceFolder) {
        const permission = await requestCourseFolderPermission(
          rememberedWorkspaceFolder,
        );
        if (permission === "granted") {
          workspace = rememberedWorkspaceFolder;
          setWorkspaceFolder(workspace);
        }
      }
      if (!workspace && chooseWorkspaceIfMissing && supportsWorkingFolders()) {
        const selection = await selectWorkspaceFolder();
        workspace = selection?.folder ?? null;
        if (selection?.projectAttached) return;
      }
      if (!workspace) {
        stopFolderWrites();
        const currentSession = projectSessionRef.current;
        if (projectSessionHasUnsavedChanges(currentSession)) {
          preservedBrowserDraftRef.current =
            snapshotForProjectSession(currentSession);
        }
        const nextSession = createProjectSession(snapshot, {
          source: "browser-draft",
        });
        await stageOpenedProject(nextSession.project);
        publishProjectSession(nextSession);
        setActivePath(nextSession.project.entrypoint);
        setOpenPaths([nextSession.project.entrypoint]);
        setWorkingFolder(null);
        setRememberedFolder(null);
        setRememberedFolderCanAttach(false);
        await forgetProjectFolder();
        replacePendingFolderDeletions(() => new Set());
        setFolderDirty(true);
        setFolderSaveState("browser");
        setCheckOk(null);
        setCheckDetail("Current files have not been checked.");
        setSyncOk(null);
        setSyncDetail("Run will load the current project into XRP memory.");
        setOperationDetail(
          `${snapshot.name} is stored temporarily in Chrome. Choose a working folder to create its project folder.`,
        );
        return;
      }
      setPendingProject(snapshot);
      setNewProjectDraft(suggestedProjectFolderName(snapshot.name));
      setNewProjectError("");
      setNewProjectOpen(true);
    },
    [
      rememberedWorkspaceFolder,
      publishProjectSession,
      replacePendingFolderDeletions,
      selectWorkspaceFolder,
      stageOpenedProject,
      stopFolderWrites,
      workspaceFolder,
    ],
  );

  const reconnectWorkingFolder = useCallback(async () => {
    if (!rememberedFolder || !rememberedFolderCanAttach) {
      return;
    }
    try {
      const permission = await requestCourseFolderPermission(rememberedFolder);
      if (permission !== "granted") {
        setFolderSaveState("permission");
        setOperationDetail(
          `Folder access was not granted. The temporary browser copy remains current.`,
        );
        return;
      }
      const courseFolder = workspaceFolder ?? rememberedWorkspaceFolder;
      if (
        courseFolder &&
        (await projectFolderIsInsideCourseFolder(
          courseFolder,
          rememberedFolder,
        )) === false
      ) {
        await forgetProjectFolder();
        setRememberedFolder(null);
        setRememberedFolderCanAttach(false);
        setFolderSaveState("browser");
        setOperationDetail(
          `That project is outside ${courseFolder.name}. Choose a project folder inside the working folder.`,
        );
        return;
      }
      if (
        (await isCourseRepositoryFolder(rememberedFolder)) ||
        !(await hasProjectFolderMetadata(rememberedFolder))
      ) {
        await forgetProjectFolder();
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
      void rememberProjectFolder(rememberedFolder);
      const folderNeedsWrite =
        opened.project.session === undefined ||
        reconciliation.session.source === "browser-draft" ||
        reconciliation.session.revision !== folderSession.revision ||
        reconciliation.session.updatedAt !== folderSession.updatedAt;
      setFolderDirty(folderNeedsWrite);
      setFolderSaveState(folderNeedsWrite ? "pending" : "current");
      setOperationDetail(
        `Reconnected project folder ${rememberedFolder.name}.${folderNeedsWrite ? " Recovered edits will save automatically." : " Files are current."}${reconciliation.preserveBrowserDraft ? " An earlier unsaved browser draft was retained." : ""}`,
      );
    } catch (error) {
      if (!wasCancelled(error)) {
        setFolderSaveState("error");
        setOperationDetail(errorDetail(error));
      }
    }
  }, [
    rememberedFolder,
    rememberedFolderCanAttach,
    rememberedWorkspaceFolder,
    publishProjectSession,
    reconcileFolderSnapshot,
    stageOpenedProject,
    workspaceFolder,
  ]);

  const saveProjectFiles = useCallback(async () => {
    try {
      if (!workingFolder) {
        await prepareProjectCreation(
          snapshotForProjectSession(projectSessionRef.current),
          true,
        );
        return;
      }
      const writeEpoch = folderWriteEpoch.current + 1;
      folderWriteEpoch.current = writeEpoch;
      const folder = workingFolder;
      const sessionToSave = projectSessionRef.current;
      const savedProject = snapshotForProjectSession(sessionToSave);
      const deletedPaths = new Set(pendingFolderDeletionsRef.current);
      setOperationDetail(
        `Saving ${Object.keys(savedProject.files).length} files…`,
      );
      setFolderSaveState("saving");
      const queued = folderWriteQueue.current.then(async () => {
        if (
          folderWriteEpoch.current !== writeEpoch ||
          projectSessionRef.current.projectId !== sessionToSave.projectId ||
          projectSessionRef.current.revision !== sessionToSave.revision
        ) {
          return null;
        }
        return saveProjectFolderWithAutosave(
          folder,
          savedProject,
          deletedPaths,
        );
      });
      folderWriteQueue.current = queued.then(
        () => undefined,
        () => undefined,
      );
      const result = await queued;
      if (
        result === null ||
        folderWriteEpoch.current !== writeEpoch ||
        projectSessionRef.current.projectId !== sessionToSave.projectId
      ) {
        return;
      }
      if (projectSessionRef.current.revision !== sessionToSave.revision) {
        publishProjectSession(
          acknowledgeProjectSessionSave(
            projectSessionRef.current,
            sessionToSave.revision,
            result.contentDigest,
          ),
        );
        setFolderSaveState("pending");
        return;
      }
      const { removedFiles } = result;
      publishProjectSession(
        markProjectSessionSaved(
          projectSessionRef.current,
          result.contentDigest,
        ),
      );
      folderDirtyRef.current = false;
      setFolderDirty(false);
      setFolderSaveState("current");
      replacePendingFolderDeletions(() => new Set());
      setOperationDetail(
        `Saved ${Object.keys(savedProject.files).length} project file${
          Object.keys(savedProject.files).length === 1 ? "" : "s"
        } to ${folder.name}${
          removedFiles > 0
            ? `; removed ${removedFiles} deleted file${removedFiles === 1 ? "" : "s"}`
            : ""
        }.`,
      );
      retryPendingOfflineShellReload();
    } catch (error) {
      if (!wasCancelled(error)) {
        if (error instanceof ProjectFolderConflictError) {
          recordProjectFolderConflict(error);
        } else {
          setFolderSaveState("error");
          setOperationDetail(errorDetail(error));
        }
      }
    }
  }, [
    prepareProjectCreation,
    publishProjectSession,
    recordProjectFolderConflict,
    replacePendingFolderDeletions,
    workingFolder,
  ]);

  useEffect(() => {
    if (!workingFolder || !folderDirty || projectFolderConflict) {
      return;
    }
    const folder = workingFolder;
    const sessionToSave = projectSession;
    const snapshot = snapshotForProjectSession(sessionToSave);
    const deletedPaths = new Set(pendingFolderDeletionsRef.current);
    const version = projectVersion.current;
    const writeEpoch = folderWriteEpoch.current;
    setFolderSaveState("pending");
    const timer = window.setTimeout(() => {
      setFolderSaveState("saving");
      const queued = folderWriteQueue.current.then(async () => {
        if (
          projectVersion.current !== version ||
          folderWriteEpoch.current !== writeEpoch ||
          projectSessionRef.current.projectId !== sessionToSave.projectId ||
          projectSessionRef.current.revision !== sessionToSave.revision
        ) {
          return null;
        }
        const permission = await courseFolderPermission(folder);
        if (permission !== "granted") {
          throw new DOMException(
            "Reconnect the project folder to resume automatic saves.",
            "NotAllowedError",
          );
        }
        return saveProjectFolderWithAutosave(folder, snapshot, deletedPaths);
      });
      folderWriteQueue.current = queued.then(
        () => undefined,
        () => undefined,
      );
      void queued
        .then((result) => {
          if (result === null) return;
          if (
            folderWriteEpoch.current !== writeEpoch ||
            projectSessionRef.current.projectId !== sessionToSave.projectId
          ) {
            return;
          }
          if (
            projectVersion.current !== version ||
            projectSessionRef.current.revision !== sessionToSave.revision
          ) {
            publishProjectSession(
              acknowledgeProjectSessionSave(
                projectSessionRef.current,
                sessionToSave.revision,
                result.contentDigest,
              ),
            );
            setFolderSaveState("pending");
            return;
          }
          publishProjectSession(
            markProjectSessionSaved(
              projectSessionRef.current,
              result.contentDigest,
            ),
          );
          folderDirtyRef.current = false;
          setFolderDirty(false);
          setFolderSaveState("current");
          replacePendingFolderDeletions((current) => {
            const remaining = new Set(current);
            for (const path of deletedPaths) {
              remaining.delete(path);
            }
            return remaining;
          });
          setOperationDetail(`Saved changes to ./${folder.name}.`);
          retryPendingOfflineShellReload();
        })
        .catch((error: unknown) => {
          if (error instanceof ProjectFolderConflictError) {
            recordProjectFolderConflict(error);
          } else if (
            error instanceof DOMException &&
            error.name === "NotAllowedError"
          ) {
            setWorkingFolder(null);
            setRememberedFolder(folder);
            setFolderSaveState("permission");
          } else {
            setFolderSaveState("error");
          }
          if (!(error instanceof ProjectFolderConflictError)) {
            setOperationDetail(errorDetail(error));
          }
        });
    }, 900);
    return () => window.clearTimeout(timer);
  }, [
    folderDirty,
    pendingFolderDeletions,
    projectSession,
    projectFolderConflict,
    publishProjectSession,
    recordProjectFolderConflict,
    replacePendingFolderDeletions,
    workingFolder,
  ]);

  const useFolderConflictFiles = useCallback(async () => {
    if (!projectFolderConflict || !workingFolder) return;
    stopFolderWrites();
    const browserDraft = projectSessionRef.current;
    preservedBrowserDraftRef.current = snapshotForProjectSession(browserDraft);
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
        `Opened the files currently in ./${workingFolder.name}. The earlier IDE draft remains available in browser recovery.`,
      );
    } catch (error) {
      setFolderSaveState("error");
      setOperationDetail(errorDetail(error));
    }
  }, [
    projectFolderConflict,
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
    const snapshot = snapshotForProjectSession(sessionToSave);
    const deletedPaths = new Set(pendingFolderDeletionsRef.current);
    const writeEpoch = folderWriteEpoch.current + 1;
    folderWriteEpoch.current = writeEpoch;
    setFolderSaveState("saving");
    setOperationDetail(`Saving the IDE files to ./${folder.name}…`);
    const queued = folderWriteQueue.current.then(() =>
      saveProjectFolderWithAutosave(folder, snapshot, deletedPaths, {
        expectedBaseDigest: conflict.folderDigest,
      }),
    );
    folderWriteQueue.current = queued.then(
      () => undefined,
      () => undefined,
    );
    try {
      const result = await queued;
      if (
        folderWriteEpoch.current !== writeEpoch ||
        projectSessionRef.current.projectId !== sessionToSave.projectId
      ) {
        return;
      }
      const current = acknowledgeProjectSessionSave(
        projectSessionRef.current,
        sessionToSave.revision,
        result.contentDigest,
      );
      publishProjectSession(current);
      setProjectFolderConflict(null);
      replacePendingFolderDeletions((pending) => {
        const remaining = new Set(pending);
        for (const path of deletedPaths) remaining.delete(path);
        return remaining;
      });
      const stillDirty = projectSessionHasUnsavedChanges(current);
      folderDirtyRef.current = stillDirty;
      setFolderDirty(stillDirty);
      setFolderSaveState(stillDirty ? "pending" : "current");
      setOperationDetail(
        `Kept the IDE files in ./${folder.name}. The previous folder files were retained in project autosaves.`,
      );
    } catch (error) {
      if (error instanceof ProjectFolderConflictError) {
        recordProjectFolderConflict(error);
      } else {
        setFolderSaveState("error");
        setOperationDetail(errorDetail(error));
      }
    }
  }, [
    projectFolderConflict,
    publishProjectSession,
    recordProjectFolderConflict,
    replacePendingFolderDeletions,
    workingFolder,
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
          });

        if (!projectSessionReadyRef.current || projectFolderConflict) {
          return false;
        }
        const sessionToSave = projectSessionRef.current;
        const expected = projectRevisionIdentity(sessionToSave);
        storeRecoveredProject(
          snapshotForProjectSession(sessionToSave),
          preservedBrowserDraftRef.current,
        );
        if (!activity()) return false;

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
          // Invalidate the delayed autosave before queuing this exact revision.
          const writeEpoch = folderWriteEpoch.current + 1;
          folderWriteEpoch.current = writeEpoch;
          const savedProject = snapshotForProjectSession(sessionToSave);
          const deletedPaths = new Set(pendingFolderDeletionsRef.current);
          setFolderSaveState("saving");
          const queued = folderWriteQueue.current.then(async () => {
            if (
              !activity() ||
              folderWriteEpoch.current !== writeEpoch ||
              workingFolderRef.current !== folder ||
              projectSessionRef.current.projectId !== expected.projectId ||
              projectSessionRef.current.revision !== expected.revision
            ) {
              return null;
            }
            if ((await courseFolderPermission(folder)) !== "granted") {
              throw new DOMException(
                "Reconnect the project folder before applying the course update.",
                "NotAllowedError",
              );
            }
            return saveProjectFolderWithAutosave(
              folder,
              savedProject,
              deletedPaths,
            );
          });
          folderWriteQueue.current = queued.then(
            () => undefined,
            () => undefined,
          );

          try {
            const result = await queued;
            if (
              result === null ||
              folderWriteEpoch.current !== writeEpoch ||
              workingFolderRef.current !== folder ||
              projectSessionRef.current.projectId !== expected.projectId ||
              projectSessionRef.current.revision !== expected.revision
            ) {
              if (
                workingFolderRef.current === folder &&
                folderDirtyRef.current
              ) {
                setFolderSaveState("pending");
              }
              return false;
            }
            const savedSession = markProjectSessionSaved(
              projectSessionRef.current,
              result.contentDigest,
            );
            publishProjectSession(savedSession);
            storeRecoveredProject(
              snapshotForProjectSession(savedSession),
              preservedBrowserDraftRef.current,
            );
            folderDirtyRef.current = false;
            setFolderDirty(false);
            setFolderSaveState("current");
            replacePendingFolderDeletions(() => new Set());
          } catch (error) {
            if (error instanceof ProjectFolderConflictError) {
              recordProjectFolderConflict(error);
            } else if (
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
            if (!(error instanceof ProjectFolderConflictError)) {
              setOperationDetail(errorDetail(error));
            }
            return false;
          }
        } else {
          await folderWriteQueue.current;
        }

        return (
          activity() &&
          workingFolderRef.current === folder &&
          projectRevisionIsReloadable(projectSessionRef.current, expected, true)
        );
      }),
    [
      projectFolderConflict,
      publishProjectSession,
      recordProjectFolderConflict,
      replacePendingFolderDeletions,
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
      folderSaveState !== "error"
    ) {
      retryPendingOfflineShellReload();
    }
  }, [
    componentCheckRunning,
    folderDirty,
    folderSaveState,
    projectSession.projectId,
    projectSession.revision,
    projectSession.savedRevision,
    projectSessionReady,
    targetState,
    workingFolder,
  ]);

  const loadProjectTemplate = useCallback(async () => {
    const template = COURSE_PROJECT_TEMPLATES.find(
      (candidate) => candidate.id === selectedTemplateId,
    );
    if (!template) {
      return;
    }
    const snapshot: ProjectSnapshot = {
      name: template.project.name ?? template.id.replaceAll("_", "-"),
      entrypoint: template.project.entrypoint,
      files: { ...template.project.files },
      templateId: template.id,
    };
    await prepareProjectCreation(snapshot);
    setSelectedTemplateId("");
  }, [prepareProjectCreation, selectedTemplateId]);

  const startNextChallenge = useCallback(async () => {
    if (!project.templateId || !followingChallenge) return;
    if (!workingFolder) {
      setOperationDetail(
        "Create a project folder for this challenge before starting the next one. The current challenge will remain unchanged.",
      );
      await saveProjectFiles();
      return;
    }
    if (!workspaceFolder) {
      setOperationDetail(
        "Choose the working folder that contains this project before starting the next challenge.",
      );
      await selectWorkspaceFolder();
      return;
    }
    try {
      const next = createNextChallengeProject(project.templateId, project);
      await prepareProjectCreation({
        ...next,
        name: next.name ?? followingChallenge.shortLabel,
        templateId: followingChallenge.id,
      });
    } catch (error) {
      setOperationDetail(
        `The next challenge could not be created: ${errorDetail(error)}`,
      );
    }
  }, [
    followingChallenge,
    prepareProjectCreation,
    project,
    saveProjectFiles,
    selectWorkspaceFolder,
    workingFolder,
    workspaceFolder,
  ]);

  const createNamedProject = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!pendingProject || !workspaceFolder) return;
      const validationError = projectFolderNameError(newProjectDraft);
      if (validationError) {
        setNewProjectError(validationError);
        return;
      }
      try {
        setNewProjectError("");
        setOperationDetail(`Creating ${newProjectDraft.trim()}…`);
        const previousSession = projectSessionRef.current;
        if (projectSessionHasUnsavedChanges(previousSession)) {
          preservedBrowserDraftRef.current =
            snapshotForProjectSession(previousSession);
        }
        const draftSession = createProjectSession(pendingProject, {
          source: "browser-draft",
        });
        const nextSession = markProjectSessionSaved(
          draftSession,
          await projectContentDigest(draftSession.project),
        );
        const folder = await createProjectFolder(
          workspaceFolder,
          newProjectDraft,
          snapshotForProjectSession(nextSession),
        );
        stopFolderWrites();
        await stageOpenedProject(nextSession.project);
        publishProjectSession(nextSession);
        setActivePath(nextSession.project.entrypoint);
        setOpenPaths([nextSession.project.entrypoint]);
        setWorkingFolder(folder);
        setRememberedFolder(folder);
        setRememberedFolderCanAttach(true);
        void rememberProjectFolder(folder);
        replacePendingFolderDeletions(() => new Set());
        setFolderDirty(false);
        setFolderSaveState("current");
        setCheckOk(null);
        setCheckDetail("Current files have not been checked.");
        setSyncOk(null);
        setSyncDetail("Run will load the current project into XRP memory.");
        setNewProjectOpen(false);
        setPendingProject(null);
        setNewProjectDraft("");
        setOperationDetail(
          `Created ./${folder.name}. Edits and monitored runs save there automatically.`,
        );
      } catch (error) {
        setNewProjectError(errorDetail(error));
      }
    },
    [
      newProjectDraft,
      pendingProject,
      publishProjectSession,
      replacePendingFolderDeletions,
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
      if (path in project.files) {
        setNewFileError("That file already exists.");
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
          : `${path} created in the temporary browser copy.`,
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
        if (pathError || path in files || file.size > 1024 * 1024) {
          skipped.push(file.name);
          continue;
        }
        files[path] = await file.text();
        imported.push(path);
      }
      if (imported.length === 0) {
        const onlySkipped = skipped.length === 1 ? skipped[0] : undefined;
        setOperationDetail(
          onlySkipped !== undefined && onlySkipped in current.files
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
        }.${workingFolder ? " Saving automatically." : " Choose a working folder to create this project's folder."}`,
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
        setSettingsOpen(false);
        setNewFileOpen(false);
        setNewProjectOpen(false);
        setPendingProject(null);
        setPathOperation(null);
        setDeletePath(null);
        return;
      }
      if (newFileOpen || newProjectOpen || pathOperation || deletePath) {
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
        setSettingsOpen((open) => !open);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [
    deletePath,
    newFileOpen,
    newProjectOpen,
    pathOperation,
    runTarget,
    saveProjectFiles,
    validateCode,
  ]);

  useEffect(() => {
    if (!newFileOpen && !newProjectOpen && !pathOperation && !deletePath) {
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
  }, [deletePath, newFileOpen, newProjectOpen, pathOperation]);

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
        setSettingsOpen(false);
      }
    };
    document.addEventListener("pointerdown", closeOutside);
    return () => document.removeEventListener("pointerdown", closeOutside);
  }, [settingsOpen]);

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

  const storageDetail = projectFolderConflict
    ? "Folder and IDE files differ; choose which version to keep"
    : workingFolder
      ? folderSaveState === "error"
        ? "Automatic save failed"
        : folderSaveState === "saving" || folderDirty
          ? "Saving changes…"
          : "Connected · changes save automatically"
      : rememberedFolder && rememberedFolderCanAttach
        ? `${rememberedFolder.name} · reconnect to resume saving`
        : "Temporary browser copy; no project folder selected";
  const storageSummary = projectFolderConflict
    ? "Folder changes need review"
    : workingFolder
      ? `Saved automatically in ./${workingFolder.name}`
      : rememberedFolder && rememberedFolderCanAttach
        ? `${rememberedFolder.name} · reconnect to resume automatic saving`
        : workspaceFolder
          ? `Temporary browser copy · working folder ${workspaceFolder.name} selected`
          : "Temporary browser copy · choose a working folder";
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
  const activeReference = apiReferenceForPath(activePath);
  const pendingTemplate = pendingProject?.templateId
    ? COURSE_PROJECT_TEMPLATES.find(
        (template) => template.id === pendingProject.templateId,
      )
    : null;
  const progressingToNextChallenge =
    pendingTemplate?.predecessorId === project.templateId;
  const carriedFiles =
    progressingToNextChallenge && pendingTemplate
      ? pendingTemplate.components
          .filter((component) => component.carryForward)
          .map((component) => component.file)
      : [];

  if (!projectSessionReady) {
    return (
      <div className="app-shell ide-app">
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
    <div className="app-shell ide-app">
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
                    ? "Another IDE tab controls Run. Choose Use this project in the Project panel to switch."
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
            title="Reset the selected XRP and clear its current motion state."
          >
            <ResetIcon />
            <span className="visually-hidden">Reset</span>
          </button>
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
              aria-label="Retry XRP connection"
              className="quiet-button target-retry-button"
              onClick={() => setConnectionAttempt((attempt) => attempt + 1)}
              title="Try the configured XRP Wi-Fi connection again."
            >
              Retry
            </button>
          ) : null}
          <button
            aria-expanded={settingsOpen}
            className="quiet-button settings-button"
            onClick={() => setSettingsOpen((open) => !open)}
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
            <div
              className="project-root"
              data-testid="project-folder"
              title={
                workingFolder
                  ? `Project folder: ./${workingFolder.name}`
                  : `${project.name} is a temporary browser copy`
              }
            >
              {workingFolder
                ? `./${workingFolder.name}`
                : `${project.name} · temporary browser copy`}
            </div>
            <div
              className={`project-owner-state ${projectProviderActive ? "active" : "standby"}`}
              data-testid="project-owner-state"
              role="status"
            >
              <span>
                {projectProviderActive
                  ? "Active project for Run and Monitor"
                  : projectProviderAvailable
                    ? "Another IDE tab controls Run and Monitor"
                    : "No active IDE project"}
              </span>
              {!projectProviderActive ? (
                <button
                  disabled={!isConnected}
                  onClick={useThisProjectForRun}
                  title="Use this tab's current project for the next IDE or Monitor Run."
                >
                  Use this project
                </button>
              ) : null}
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
              <div className="project-actions">
                <button
                  className="open-folder-button"
                  disabled={!supportsWorkingFolders()}
                  onClick={openWorkingFolder}
                  title="Open an existing local UCSBXRP project folder. The current project remains available as a temporary browser copy."
                >
                  Open project
                </button>
                <button
                  onClick={() => {
                    setNewFileOpen(true);
                    setNewFileError("");
                  }}
                  title="Create a new text file inside this project."
                >
                  New file
                </button>
                <button
                  onClick={() => importInputRef.current?.click()}
                  title="Import one or more text files into this project. Existing files are not overwritten."
                >
                  Import files
                </button>
                <input
                  accept=".csv,.ini,.json,.md,.py,.toml,.txt,.yaml,.yml,text/*"
                  hidden
                  multiple
                  onChange={importProjectFiles}
                  ref={importInputRef}
                  type="file"
                />
              </div>
              <div className="file-menu" ref={fileActionsRef}>
                <button
                  aria-expanded={fileActionsOpen}
                  className="file-menu-trigger"
                  onClick={() => setFileActionsOpen((open) => !open)}
                  title={`Rename, duplicate, make main, or delete ${activePath}.`}
                >
                  <span>File</span>
                  <strong>{activePath.split("/").at(-1)}</strong>
                  <span aria-hidden="true">{fileActionsOpen ? "▴" : "▾"}</span>
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
                      Rename file
                    </button>
                    <button
                      onClick={() => {
                        setFileActionsOpen(false);
                        beginPathOperation("duplicate");
                      }}
                      title={`Create a second editable copy of ${activePath}.`}
                    >
                      Duplicate file
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
                          : "A project must retain a Python main file"
                      }
                    >
                      Delete file
                    </button>
                  </div>
                ) : null}
              </div>
              {"component_checks.py" in project.files ? (
                <button
                  className="component-check-button"
                  disabled={componentCheckRunning}
                  onClick={() => void testComponents()}
                  title="Run this challenge's component checks in MicroPython without starting either robot. PASS, NOT IMPLEMENTED, and FAIL results appear in Program output."
                >
                  {componentCheckRunning
                    ? "Testing components…"
                    : "Test components"}
                </button>
              ) : null}
              {followingChallenge ? (
                <button
                  className="next-challenge-button"
                  onClick={() => void startNextChallenge()}
                  title={`Create a separate ${followingChallenge.label} project and copy your completed component files from this project.`}
                >
                  Create {followingChallenge.label} project
                </button>
              ) : null}
              <div className="template-control">
                <span>Create from template</span>
                <div className="template-actions">
                  <select
                    aria-label="Project template"
                    onChange={(event) =>
                      setSelectedTemplateId(event.target.value)
                    }
                    title="Choose a complete challenge, demo, or tutorial project."
                    value={selectedTemplateId}
                  >
                    <option disabled value="">
                      Choose template…
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
                  <button
                    disabled={!selectedTemplateId}
                    onClick={loadProjectTemplate}
                    title="Create a new editable project from this template."
                  >
                    Create
                  </button>
                </div>
              </div>
              <div className="project-storage">
                <span>Folders and automatic saving</span>
                <strong title={storageDetail}>{storageSummary}</strong>
                <button
                  className="folder-reconnect"
                  disabled={!supportsWorkingFolders()}
                  onClick={
                    workingFolder ? selectWorkspaceFolder : saveProjectFiles
                  }
                  title={
                    workingFolder
                      ? "Choose a different parent folder for UCSBXRP projects."
                      : workspaceFolder
                        ? `Create a project folder for ${project.name}.`
                        : "Choose the parent folder, then create a folder for this project."
                  }
                >
                  {workingFolder
                    ? "Change working folder"
                    : workspaceFolder
                      ? "Create project folder"
                      : "Choose working folder"}
                </button>
                {!workingFolder &&
                rememberedFolder &&
                rememberedFolderCanAttach ? (
                  <button
                    className="folder-reconnect"
                    onClick={reconnectWorkingFolder}
                    title={`Restore write access to ${rememberedFolder.name}.`}
                  >
                    Reconnect
                  </button>
                ) : null}
                {projectFolderConflict ? (
                  <div
                    aria-live="polite"
                    className="project-folder-conflict"
                    role="alert"
                  >
                    <small>
                      The folder changed outside UCSBXRP. Choose which files to
                      keep. Neither version has been overwritten.
                    </small>
                    <div>
                      <button
                        onClick={useFolderConflictFiles}
                        title="Open the files currently in the project folder and retain the IDE draft for recovery."
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
                <OfflineReadiness appName="IDE" />
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
              {activeReference ? (
                <a
                  className="editor-api-link"
                  href={activeReference.href}
                  rel="noopener noreferrer"
                  target="_blank"
                  title={`Open the ${activeReference.label} API entry for ${activePath}.`}
                >
                  {activeReference.label} API ↗
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
                  <span>Project</span>
                  <strong>{project.name}</strong>
                  <small aria-live="polite">
                    {projectFiles.length} file
                    {projectFiles.length === 1 ? "" : "s"} · main:{" "}
                    {project.entrypoint}. {operationDetail}
                  </small>
                </div>
                <div>
                  <span>Target</span>
                  <strong>{targetState}</strong>
                  <small>{targetDetail}</small>
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
              onClick={() => setSettingsOpen(false)}
            >
              ×
            </button>
          </div>
          <label className="setting-row">
            <span>Run on</span>
            <select
              onChange={(event) =>
                updateTargetPreference((current) => ({
                  ...current,
                  kind: event.target.value as TargetKind,
                }))
              }
              value={targetPreference.kind}
            >
              <option value="virtual">Virtual XRP</option>
              <option value="physical">Physical XRP</option>
            </select>
          </label>
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
                    defaultValue={targetPreference.stationEndpoint}
                    key={targetPreference.stationEndpoint}
                    onBlur={(event) =>
                      updateTargetPreference((current) =>
                        targetPreferenceForConfiguredNetwork(current, {
                          mode: "station",
                          stationAddress: event.target.value,
                        }),
                      )
                    }
                    spellCheck={false}
                    type="url"
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

      {newProjectOpen && pendingProject ? (
        <div
          aria-labelledby="new-project-title"
          aria-modal="true"
          className="modal-backdrop"
          role="dialog"
        >
          <form className="new-file-dialog" onSubmit={createNamedProject}>
            <span className="dialog-kicker">NEW PROJECT</span>
            <h2 id="new-project-title">Name the project folder</h2>
            <p className="dialog-context">
              {progressingToNextChallenge
                ? `This creates a separate project inside ${workspaceFolder?.name}. It carries ${carriedFiles.join(", ")} from ${project.name}; the current project remains unchanged. The new challenge supplies its own task, world, and newly introduced modules.`
                : `The folder will be created inside ${workspaceFolder?.name}. Source, automatic copies, program output, and telemetry will stay with this project.`}
            </p>
            <label htmlFor="new-project-folder">Folder name</label>
            <input
              aria-describedby="new-project-help"
              aria-invalid={newProjectError ? "true" : undefined}
              autoFocus
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
              {newProjectError || `Creates ./${newProjectDraft || "project"}`}
            </small>
            <div className="dialog-actions">
              <button
                onClick={() => {
                  setNewProjectOpen(false);
                  setPendingProject(null);
                  setNewProjectDraft("");
                  setNewProjectError("");
                }}
                type="button"
              >
                Cancel
              </button>
              <button className="primary-button" type="submit">
                Create project
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
              This removes the file from the temporary browser copy now. A
              connected project folder updates automatically.
              {deletePath === project.entrypoint && replacementEntrypoint
                ? ` ${replacementEntrypoint} will become the main file.`
                : ""}
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
