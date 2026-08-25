import Editor from "@monaco-editor/react";
import {
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
  loadTargetPreference,
  physicalEndpointForPreference,
  storeTargetPreference,
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
import { virtualRunNeedsPreparation } from "../../shared/offline-shell";
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
  rememberWorkspaceFolder,
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
  loadRecoveredProject,
  normalizedProjectPath,
  projectPathError,
  projectFolderNameError,
  readProjectFolder,
  renameProjectFile,
  saveProjectFolderWithAutosave,
  setProjectEntrypoint,
  storeRecoveredProject,
  suggestedDuplicatePath,
  suggestedProjectFolderName,
  supportsWorkingFolders,
  type CourseDirectoryHandle,
  type ProjectSnapshot,
} from "./project-files";

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

export function IdeApp() {
  const initialProject = useMemo(() => loadRecoveredProject(), []);
  const [settings, setSettings] = useState<IdeSettings>(loadSettings);
  const [targetPreference, setTargetPreference] =
    useState(loadTargetPreference);
  const [connectionAttempt, setConnectionAttempt] = useState(0);
  const target = useMemo<TargetClient>(
    () =>
      targetPreference.kind === "physical"
        ? new PhysicalTargetClient(
            physicalEndpointForPreference(targetPreference),
          )
        : new VirtualTargetClient(),
    [
      targetPreference.kind,
      targetPreference.physicalConnection,
      targetPreference.physicalEndpoint,
      connectionAttempt,
    ],
  );
  const virtualRuntimePreparing =
    target.kind === "virtual" &&
    virtualRunNeedsPreparation(
      import.meta.env.PROD,
      globalThis.crossOriginIsolated,
    );
  const [project, setProject] = useState<ProjectSnapshot>(initialProject);
  const [activePath, setActivePath] = useState(initialProject.entrypoint);
  const [openPaths, setOpenPaths] = useState([initialProject.entrypoint]);
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
  const [operationDetail, setOperationDetail] = useState(
    "This project has a recovery copy in Chrome. Choose a course folder to create its project folder, or open an existing project.",
  );
  const [targetState, setTargetState] =
    useState<TargetRunState>("disconnected");
  const [targetDetail, setTargetDetail] = useState("Not connected");
  const [currentProject, setCurrentProject] =
    useState<SynchronizedProject | null>(null);
  const [checkDetail, setCheckDetail] = useState(
    "Current files have not been checked.",
  );
  const [checkOk, setCheckOk] = useState<boolean | null>(null);
  const [syncDetail, setSyncDetail] = useState(
    "Current files have not been flashed to the XRP.",
  );
  const [syncOk, setSyncOk] = useState<boolean | null>(null);
  const [consoleEntries, setConsoleEntries] = useState<ConsoleEntry[]>([]);
  const [consoleTab, setConsoleTab] = useState<"status" | "output" | "details">(
    "status",
  );
  const [outputPanelOpen, setOutputPanelOpen] = useState(true);
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
  const [deletePath, setDeletePath] = useState<string | null>(null);
  const [pendingFolderDeletions, setPendingFolderDeletions] = useState(
    () => new Set<string>(),
  );
  const nextConsoleId = useRef(1);
  const initializedProjectEffect = useRef(false);
  const projectRef = useRef(project);
  const settingsDrawerRef = useRef<HTMLElement | null>(null);
  const projectVersion = useRef(0);
  const folderWriteQueue = useRef<Promise<void>>(Promise.resolve());
  const folderWriteEpoch = useRef(0);
  const pendingFolderDeletionsRef = useRef(new Set<string>());

  const replacePendingFolderDeletions = useCallback(
    (update: (current: Set<string>) => Set<string>) => {
      const next = update(pendingFolderDeletionsRef.current);
      pendingFolderDeletionsRef.current = next;
      setPendingFolderDeletions(next);
    },
    [],
  );

  useEffect(() => {
    const unsubscribe = target.subscribe((event: TargetEvent) => {
      if (event.type === "status") {
        setTargetState(event.state);
        setTargetDetail(event.detail);
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
      }
    });
    setTargetState("connecting");
    setTargetDetail(`Connecting to ${target.kind} XRP…`);
    setCurrentProject(null);
    target
      .connect()
      .then(() => target.markProjectStale(projectRef.current))
      .catch((error: unknown) => {
        setTargetState("error");
        setTargetDetail(errorDetail(error));
      });
    return () => {
      unsubscribe();
      target.disconnect();
    };
  }, [target]);

  useEffect(() => {
    projectRef.current = project;
    projectVersion.current += 1;
    storeRecoveredProject(project);
    if (initializedProjectEffect.current) {
      setCheckOk(null);
      setCheckDetail("Files changed since the last code check.");
      setSyncOk(null);
      setSyncDetail("Files changed since the last flash.");
      if (
        currentProject &&
        !currentProject.stale &&
        targetState !== "disconnected" &&
        targetState !== "connecting"
      ) {
        void target.markProjectStale(project).catch(() => {
          // Editing remains local if the target connection changes mid-update.
        });
      }
    } else {
      initializedProjectEffect.current = true;
    }
  }, [project]);

  useEffect(() => {
    let disposed = false;
    const restoreFolders = async () => {
      const [loadedWorkspace, rememberedProject] = await Promise.all([
        loadRememberedWorkspaceFolder(),
        loadRememberedProjectFolder(),
      ]);
      if (disposed) return;
      const commissioningHandoff = courseFolderIsWaitingForIde();
      let workspace = loadedWorkspace;
      let folder = rememberedProject;
      let defaultProjectCreated = false;
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
              "The UCSBXRP course software repository cannot be used as a course folder. Choose a folder for student projects.",
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
            projectRef.current = opened.project;
            setProject(opened.project);
            setActivePath(opened.project.entrypoint);
            setOpenPaths([opened.project.entrypoint]);
            setRememberedFolderCanAttach(true);
            setWorkingFolder(folder);
            setFolderDirty(false);
            setFolderSaveState("current");
            setOperationDetail(
              `Opened ./${folder.name}.${
                opened.skipped
                  ? ` Skipped ${opened.skipped} unsupported item${opened.skipped === 1 ? "" : "s"}.`
                  : ""
              }`,
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
        isDefaultProject(projectRef.current)
      ) {
        try {
          const result = await ensureProjectFolder(
            workspace,
            defaultProjectFolderName,
            projectRef.current,
          );
          folder = result.folder;
          defaultProjectCreated = result.created;
          void rememberProjectFolder(folder);
          const opened = await readProjectFolder(folder);
          if (disposed) return;
          projectRef.current = opened.project;
          setProject(opened.project);
          setActivePath(opened.project.entrypoint);
          setOpenPaths([opened.project.entrypoint]);
          setRememberedFolder(folder);
          setRememberedFolderCanAttach(true);
          setWorkingFolder(folder);
          setFolderDirty(false);
          setFolderSaveState("current");
          setOperationDetail(
            `${defaultProjectCreated ? "Created" : "Opened"} ./${folder.name}. Edits and monitored runs save there automatically.`,
          );
        } catch (error) {
          setOperationDetail(
            `${workspace.name} is ready, but the default project folder could not be created: ${errorDetail(error)}`,
          );
        }
      }
      if (commissioningHandoff) finishCourseFolderIdeHandoff();
    };
    void restoreFolders().catch((error: unknown) => {
      if (disposed) return;
      setFolderSaveState("error");
      setOperationDetail(
        `The remembered project folder could not be reopened: ${errorDetail(error)} The recovery copy in Chrome remains available.`,
      );
      if (courseFolderIsWaitingForIde()) finishCourseFolderIdeHandoff();
    });
    return () => {
      disposed = true;
    };
  }, []);

  useEffect(() => {
    localStorage.setItem(settingsKey, JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    storeTargetPreference(targetPreference);
  }, [targetPreference]);

  useEffect(() => {
    const updateFromOtherApp = (event: StorageEvent) => {
      if (event.key === "ucsb-xrp-target-v1") {
        setTargetPreference(loadTargetPreference());
      }
    };
    window.addEventListener("storage", updateFromOtherApp);
    return () => window.removeEventListener("storage", updateFromOtherApp);
  }, []);

  const isConnected =
    targetState === "ready" ||
    targetState === "loading" ||
    targetState === "running" ||
    (target.kind === "virtual" && targetState === "error");
  const isRunning = targetState === "running" || targetState === "loading";
  const canCommand =
    targetState === "ready" ||
    (target.kind === "virtual" && targetState === "error");
  const projectFiles = useMemo(
    () => Object.keys(project.files).sort((a, b) => a.localeCompare(b)),
    [project.files],
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
      projectRef.current = nextProject;
      setProject(nextProject);
      setFolderDirty(true);
      setOperationDetail(
        workingFolder
          ? "Changes save to this project folder automatically."
          : "Changes are backed up in this browser.",
      );
    },
    [activePath, workingFolder],
  );

  const validateCode = useCallback(async () => {
    if (!canCommand || isRunning) {
      return;
    }
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
    }
  }, [canCommand, isRunning, project, target]);

  const testComponents = useCallback(async () => {
    if (componentCheckRunning || !("component_checks.py" in project.files)) {
      return;
    }
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
          ? "Component checks finished; review PASS and PENDING results below."
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
      setComponentCheckRunning(false);
    }
  }, [componentCheckRunning, project]);

  const flashProject = useCallback(async () => {
    if (!canCommand || isRunning) {
      return;
    }
    setOutputPanelOpen(true);
    setConsoleTab("status");
    setSyncDetail("Flashing the complete project…");
    try {
      await target.synchronize(project);
      // The physical service compiles every Python file before it commits the
      // new project slot. A successful Flash therefore also validates this
      // exact project revision; Run must not repeat the same transfer/check.
      if (target.kind === "physical") {
        setCheckOk(true);
        setCheckDetail("Python files compiled while flashing the project.");
      }
      setSyncOk(true);
      setSyncDetail(
        target.kind === "physical"
          ? "The complete project is flashed and ready on the XRP."
          : "The project is ready for the virtual XRP.",
      );
    } catch (error) {
      setSyncOk(false);
      setSyncDetail(errorDetail(error));
    }
  }, [canCommand, isRunning, project, target]);

  const runTarget = useCallback(async () => {
    if (!canCommand || isRunning || virtualRuntimePreparing) {
      return;
    }
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
        setSyncDetail("The current project is flashed and ready on the XRP.");
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
    }
  }, [
    canCommand,
    checkOk,
    isRunning,
    project,
    target,
    virtualRuntimePreparing,
  ]);

  const stopProgram = useCallback(async () => {
    if (!isRunning) {
      return;
    }
    setOutputPanelOpen(true);
    setConsoleTab("details");
    await target.stop();
  }, [isRunning, target]);

  const resetTarget = useCallback(async () => {
    if (!isConnected) {
      return;
    }
    setOutputPanelOpen(true);
    setConsoleTab("status");
    await target.reset();
  }, [isConnected, target]);

  const openWorkingFolder = useCallback(async () => {
    try {
      const folder = await chooseWorkingFolder();
      setOperationDetail(`Reading ${folder.name}…`);
      const result = await readProjectFolder(folder);
      setWorkingFolder(folder);
      setRememberedFolder(folder);
      setRememberedFolderCanAttach(true);
      setFolderSaveState("current");
      void rememberProjectFolder(folder);
      projectRef.current = result.project;
      setProject(result.project);
      setActivePath(result.project.entrypoint);
      setOpenPaths([result.project.entrypoint]);
      setFolderDirty(false);
      replacePendingFolderDeletions(() => new Set());
      setCheckOk(null);
      setCheckDetail("Current files have not been checked.");
      setOperationDetail(
        `Opened project folder ${folder.name}: ${Object.keys(result.project.files).length} supported file${
          Object.keys(result.project.files).length === 1 ? "" : "s"
        }${result.skipped ? `; ${result.skipped} item${result.skipped === 1 ? "" : "s"} skipped` : ""}.`,
      );
    } catch (error) {
      if (!wasCancelled(error)) {
        setOperationDetail(errorDetail(error));
      }
    }
  }, [replacePendingFolderDeletions]);

  const selectWorkspaceFolder = useCallback(async () => {
    try {
      const folder = await chooseWorkspaceFolder();
      if (await isCourseRepositoryFolder(folder)) {
        throw new Error(
          "Choose a course folder for student projects, not the UCSBXRP course software repository.",
        );
      }
      let projectAttached = false;
      setWorkspaceFolder(folder);
      setRememberedWorkspaceFolder(folder);
      void rememberWorkspaceFolder(folder);
      if (!workingFolder && isDefaultProject(projectRef.current)) {
        const ensured = await ensureProjectFolder(
          folder,
          defaultProjectFolderName,
          projectRef.current,
        );
        const opened = await readProjectFolder(ensured.folder);
        projectRef.current = opened.project;
        setProject(opened.project);
        setActivePath(opened.project.entrypoint);
        setOpenPaths([opened.project.entrypoint]);
        setWorkingFolder(ensured.folder);
        setRememberedFolder(ensured.folder);
        setRememberedFolderCanAttach(true);
        setFolderSaveState("current");
        setFolderDirty(false);
        replacePendingFolderDeletions(() => new Set());
        void rememberProjectFolder(ensured.folder);
        setOperationDetail(
          `${ensured.created ? "Created" : "Opened"} ./${ensured.folder.name}. Edits and monitored runs save there automatically.`,
        );
        projectAttached = true;
      } else {
        setOperationDetail(
          `${folder.name} is the course folder for new project folders.`,
        );
      }
      return { folder, projectAttached };
    } catch (error) {
      if (!wasCancelled(error)) {
        setOperationDetail(errorDetail(error));
      }
      return null;
    }
  }, [replacePendingFolderDeletions, workingFolder]);

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
        projectRef.current = snapshot;
        setProject(snapshot);
        setActivePath(snapshot.entrypoint);
        setOpenPaths([snapshot.entrypoint]);
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
        setSyncDetail("Current files have not been sent to the XRP.");
        setOperationDetail(
          `${snapshot.name} has a recovery copy in Chrome. Choose a course folder to create its project folder.`,
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
      replacePendingFolderDeletions,
      selectWorkspaceFolder,
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
          `Folder access was not granted. The recovery copy in Chrome remains current.`,
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
      setWorkingFolder(rememberedFolder);
      void rememberProjectFolder(rememberedFolder);
      setFolderDirty(true);
      setFolderSaveState("pending");
      setOperationDetail(
        `Reconnected project folder ${rememberedFolder.name}. Recovered edits will save automatically.`,
      );
    } catch (error) {
      if (!wasCancelled(error)) {
        setFolderSaveState("error");
        setOperationDetail(errorDetail(error));
      }
    }
  }, [rememberedFolder, rememberedFolderCanAttach]);

  const saveProjectFiles = useCallback(async () => {
    try {
      if (!workingFolder) {
        await prepareProjectCreation(projectRef.current, true);
        return;
      }
      folderWriteEpoch.current += 1;
      const folder = workingFolder;
      const currentProjectSnapshot = projectRef.current;
      const savedProject = currentProjectSnapshot;
      const deletedPaths = new Set(pendingFolderDeletionsRef.current);
      setOperationDetail(
        `Saving ${Object.keys(savedProject.files).length} files…`,
      );
      setFolderSaveState("saving");
      const queued = folderWriteQueue.current.then(() =>
        saveProjectFolderWithAutosave(folder, savedProject, deletedPaths),
      );
      folderWriteQueue.current = queued.then(
        () => undefined,
        () => undefined,
      );
      const { removedFiles } = await queued;
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
    } catch (error) {
      if (!wasCancelled(error)) {
        setFolderSaveState("error");
        setOperationDetail(errorDetail(error));
      }
    }
  }, [prepareProjectCreation, replacePendingFolderDeletions, workingFolder]);

  useEffect(() => {
    if (!workingFolder || !folderDirty) {
      return;
    }
    const folder = workingFolder;
    const snapshot = project;
    const deletedPaths = new Set(pendingFolderDeletionsRef.current);
    const version = projectVersion.current;
    const writeEpoch = folderWriteEpoch.current;
    setFolderSaveState("pending");
    const timer = window.setTimeout(() => {
      setFolderSaveState("saving");
      const queued = folderWriteQueue.current.then(async () => {
        if (
          projectVersion.current !== version ||
          folderWriteEpoch.current !== writeEpoch
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
        .then(() => {
          if (
            projectVersion.current !== version ||
            folderWriteEpoch.current !== writeEpoch
          ) {
            return;
          }
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
    pendingFolderDeletions,
    project,
    replacePendingFolderDeletions,
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
    };
    await prepareProjectCreation(snapshot);
    setSelectedTemplateId("");
  }, [prepareProjectCreation, selectedTemplateId]);

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
        const folder = await createProjectFolder(
          workspaceFolder,
          newProjectDraft,
          pendingProject,
        );
        projectRef.current = pendingProject;
        setProject(pendingProject);
        setActivePath(pendingProject.entrypoint);
        setOpenPaths([pendingProject.entrypoint]);
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
        setSyncDetail("Current files have not been sent to the XRP.");
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
      replacePendingFolderDeletions,
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
      projectRef.current = nextProject;
      setProject(nextProject);
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
          : `${path} created in browser recovery.`,
      );
      openFile(path);
    },
    [
      newFilePath,
      openFile,
      project.files,
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
        projectRef.current = nextProject;
        setProject(nextProject);
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
      projectRef.current = nextProject;
      setProject(nextProject);
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
    deletePath,
    project,
    replacePendingFolderDeletions,
    workingFolder,
  ]);

  const useActiveFileAsEntrypoint = useCallback(() => {
    try {
      const nextProject = setProjectEntrypoint(projectRef.current, activePath);
      projectRef.current = nextProject;
      setProject(nextProject);
      setFolderDirty(true);
      setOperationDetail(
        `${activePath} is now the main file.${workingFolder ? " Automatic folder save pending." : ""}`,
      );
    } catch (error) {
      setOperationDetail(errorDetail(error));
    }
  }, [activePath, workingFolder]);

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

  const storageDetail = workingFolder
    ? folderSaveState === "error"
      ? "Automatic save failed"
      : folderSaveState === "saving" || folderDirty
        ? "Saving changes…"
        : "Connected · changes save automatically"
    : rememberedFolder && rememberedFolderCanAttach
      ? `${rememberedFolder.name} · reconnect to resume saving`
      : "Recovery copy in Chrome; no project folder selected";
  const storageSummary = workingFolder
    ? `Saved automatically in ./${workingFolder.name}`
    : rememberedFolder && rememberedFolderCanAttach
      ? `${rememberedFolder.name} · reconnect to resume automatic saving`
      : workspaceFolder
        ? `Recovery copy in Chrome · course folder ${workspaceFolder.name} selected`
        : "Recovery copy in Chrome · choose a course folder";
  const visibleConsoleEntries =
    consoleTab === "output" ? programOutput : serviceDetails;
  const projectIsFlashed = Boolean(currentProject && !currentProject.stale);
  const physicalConnectionActive =
    targetState !== "disconnected" &&
    targetState !== "connecting" &&
    targetState !== "error";
  const flashState = !physicalConnectionActive
    ? targetState === "connecting"
      ? "Checking connection"
      : "Connection required"
    : syncOk === false
      ? "Flash failed"
      : projectIsFlashed
        ? "Flashed"
        : "Flash needed";
  const physicalStatus = !physicalConnectionActive
    ? targetState === "connecting"
      ? "checking connection"
      : "connection required"
    : projectIsFlashed
      ? "flashed"
      : "flash needed";
  const robotProjectDetail = !physicalConnectionActive
    ? targetState === "connecting"
      ? "Checking the configured XRP Wi-Fi connection."
      : "Reconnect to the XRP before Flash or Run. USB-C is used by setup and repair; Run and telemetry use Wi-Fi."
    : syncDetail;
  const targetStatusTitle =
    target.kind === "physical"
      ? `${targetDetail}${targetDetail.endsWith(".") ? "" : "."} Project ${physicalStatus}.`
      : targetDetail;
  const activeReference = apiReferenceForPath(activePath);

  return (
    <div className="app-shell ide-app">
      <header className="app-header">
        <div className="brand" aria-label="UCSBXRP IDE">
          <span className="brand-mark">UCSB</span>
          <span className="brand-xrp">XRP</span>
          <span aria-hidden="true" className="brand-separator">
            |
          </span>
          <span className="brand-product">IDE</span>
        </div>
        <AppNavigation active="ide" />
        <div className="toolbar" role="toolbar" aria-label="Project commands">
          <select
            aria-label="Run on"
            className="target-select"
            onChange={(event) =>
              setTargetPreference((current) => ({
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
          {target.kind === "physical" ? (
            <button
              disabled={!canCommand || isRunning}
              onClick={flashProject}
              title={
                targetState === "error"
                  ? targetDetail
                  : "Write the complete project to the physical XRP"
              }
            >
              Flash project
            </button>
          ) : null}
          <button
            aria-label={isRunning ? "Stop" : "Run"}
            className={`command-run-button header-icon-button ${isRunning ? "danger-button" : "primary-button"}`}
            disabled={!isRunning && (!canCommand || virtualRuntimePreparing)}
            onClick={isRunning ? stopProgram : runTarget}
            title={
              isRunning
                ? "Stop the running program."
                : virtualRuntimePreparing
                  ? "Chrome is preparing the Virtual XRP. This page refreshes once automatically, then Run becomes available."
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
            <div className="project-root" data-testid="project-folder">
              {workingFolder
                ? `./${workingFolder.name}`
                : `${project.name} · recovery copy in Chrome`}
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
              <div
                className="file-actions"
                aria-label={`Actions for ${activePath}`}
              >
                <button
                  onClick={() => beginPathOperation("rename")}
                  title={`Rename ${activePath}.`}
                >
                  Rename file
                </button>
                <button
                  onClick={() => beginPathOperation("duplicate")}
                  title={`Create a second editable copy of ${activePath}.`}
                >
                  Duplicate file
                </button>
                <button
                  disabled={
                    activePath === project.entrypoint ||
                    !activePath.endsWith(".py")
                  }
                  onClick={useActiveFileAsEntrypoint}
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
                  onClick={() => setDeletePath(activePath)}
                  title={
                    canDeleteActiveFile
                      ? `Delete ${activePath} from the project`
                      : "A project must retain a Python main file"
                  }
                >
                  Delete file
                </button>
              </div>
              <div className="project-actions">
                <button
                  className="open-folder-button"
                  disabled={!supportsWorkingFolders()}
                  onClick={openWorkingFolder}
                  title="Open an existing local UCSBXRP project folder. The current project remains in browser recovery."
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
                  onClick={saveProjectFiles}
                  title="Save immediately. Connected folders also save automatically after edits (⌘/Ctrl+S)."
                >
                  Save
                </button>
              </div>
              {"component_checks.py" in project.files ? (
                <button
                  className="component-check-button"
                  disabled={componentCheckRunning}
                  onClick={() => void testComponents()}
                  title="Run this challenge's component checks in MicroPython without starting either robot. PASS, PENDING, and FAIL results appear in Program output."
                >
                  {componentCheckRunning
                    ? "Testing components…"
                    : "Test components"}
                </button>
              ) : null}
              <div className="template-control">
                <span>New project from template</span>
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
                <span>STORAGE</span>
                <strong title={storageDetail}>{storageSummary}</strong>
                <button
                  className="folder-reconnect"
                  disabled={!supportsWorkingFolders()}
                  onClick={selectWorkspaceFolder}
                  title="Choose the parent folder that contains your UCSBXRP project folders."
                >
                  {workspaceFolder
                    ? "Change course folder"
                    : "Choose course folder"}
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
                        physicalConnectionActive && projectIsFlashed
                          ? "pass"
                          : physicalConnectionActive && syncOk === false
                            ? "fail"
                            : ""
                      }
                    >
                      {flashState}
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
                      : "Validation, connection, flash, and target-service messages appear here."}
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
                setTargetPreference((current) => ({
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
                    setTargetPreference((current) => ({
                      ...current,
                      physicalConnection: event.target
                        .value as PhysicalConnectionMode,
                    }))
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
                    defaultValue={targetPreference.physicalEndpoint}
                    onBlur={(event) =>
                      setTargetPreference((current) => ({
                        ...current,
                        physicalEndpoint: event.target.value,
                      }))
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
              XRP, Run performs any required validation and project transfer.
              Validate and Flash project remain available as separate checks.
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
              The folder will be created inside {workspaceFolder?.name}. Source,
              automatic copies, program output, and telemetry will stay with
              this project.
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
              This removes the file from browser recovery now. A connected
              project folder updates automatically.
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
