import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";

import {
  DEFAULT_WORLD_CATALOG,
  PhysicalTargetClient,
  VirtualTargetClient,
  TelemetryRecorder,
  describeProject,
  physicalEndpointCandidates,
  millidegreesPerSecondToRadiansPerSecond,
  milligravityToMetersPerSecondSquared,
  targetPreferenceForPhysicalNetwork,
  type TargetClient,
  type TargetEvent,
  type TargetRunState,
  type TelemetrySample,
  type WorldCatalog,
  type SynchronizedProject,
  type RuntimeParameterValue,
  type RuntimeState,
} from "@ucsb-xrp/target";

import { AppNavigation } from "../../shared/AppNavigation";
import { OperationStatus } from "../../shared/OperationStatus";
import { isEmbeddedApplication } from "../../shared/embedded-application";
import { ResetIcon, RunStopIcon } from "../../shared/HeaderIcons";
import { SplitWorkspaceLink } from "../../shared/SplitWorkspaceLink";
import { ResizableSeparator } from "../../shared/ResizableSeparator";
import { useTargetPreference } from "../../shared/use-target-preference";
import { useWorkspaceSurfaceActive } from "../../shared/workspace-visibility";
import {
  readOfflineShellStatus,
  registerOfflineShellBeforeReload,
  retryPendingOfflineShellReload,
  virtualRunNeedsPreparation,
} from "../../shared/offline-shell";
import { DiagnosticLogWriter } from "../../shared/diagnostic-log";
import {
  archiveForRun,
  completedRunMetadata,
  completedRunOutput,
} from "../../shared/run-archive-format";
import {
  courseFolderPermission,
  loadRememberedProjectFolder,
  loadRememberedWorkspaceFolder,
  requestCourseFolderPermission,
  subscribeCourseFolderChanged,
  withCourseFolderWriteLock,
  writeCourseFile,
  type CourseDirectoryHandle,
  type CourseFileHandle,
} from "../../shared/course-folder";
import {
  loadProjectBinding,
  rememberProjectBinding,
  resolveProjectFolderById,
} from "../../shared/project-binding";
import {
  saveRunArchive,
  saveRunAnnotations,
  readRunAnnotations,
} from "./monitor-run-archive";
import { saveProjectFolderWithAutosave } from "../../ide/src/project-files";
import { readProjectFolderWhenIdle } from "../../ide/src/project-folder-reader";
import {
  createProjectSession,
  snapshotForProjectSession,
} from "../../ide/src/project-session";
import {
  SIGNAL_PLOTS,
  SignalPlot,
  runtimePlotDefinition,
  withTargetSeriesVisibility,
  type SignalPlotDefinition,
  type SignalPlotId,
} from "./SignalPlot";
import { WorldView } from "./WorldView";
import { RuntimeControls } from "./RuntimeControls";
import { SavedRunPicker } from "./SavedRunPicker";
import { readSavedRun } from "./saved-run-reader";
import {
  MonitorNotes,
  MonitorNoteEditor,
  type NoteRequest,
} from "./MonitorNotes";
import { annotationMatchesSample } from "./monitor-inspection";
import {
  createMonitorAnnotation,
  downloadBlob,
  monitorRunToCsv,
  timestampedName,
  webmExportSupported,
  type MonitorAnnotation,
} from "./monitor-export-core";
import {
  MonitorRunDatasetController,
  type MonitorRunDataset,
  type MonitorRunOutput,
} from "./monitor-run-dataset";
import { monitorProjectId } from "./monitor-project-identity";
import { monitorReloadIsSafe } from "./monitor-release-reload";
import {
  normalizeTelemetryUltrasound,
  normalizeUltrasoundRangeMm,
} from "./ultrasound-range";
import {
  appendTelemetryRateSample,
  MonitorVisualHistory,
  type MonitorVisualSnapshot,
  recentTelemetryRateHz,
} from "./plot-sample-history";
import courseRelease from "../../../vendor/current/release.json";

interface ConsoleEntry {
  id: string;
  stream: "stdout" | "stderr" | "system";
  line: string;
}

interface ReplayedRunBuffer {
  boundary: Extract<TargetEvent, { type: "run-history" }>;
  samples: TelemetrySample[];
  output: MonitorRunOutput[];
}

interface RunFolderResolution {
  folder: CourseDirectoryHandle | null;
  error?: string;
}

interface RetainedRunArchive {
  run: MonitorRunDataset;
  destination: Promise<RunFolderResolution>;
  saving: boolean;
  error?: string;
}

function projectFromRun(
  event: Extract<TargetEvent, { type: "run" | "run-history" }>,
): SynchronizedProject | null {
  if (!event.projectRevision || !event.projectName || !event.entrypoint)
    return null;
  return {
    projectId: event.projectId,
    name: event.projectName,
    revision: event.projectRevision,
    entrypoint: event.entrypoint,
    stale: false,
  };
}

async function resolveRunFolder(
  project: SynchronizedProject | null,
): Promise<RunFolderResolution> {
  try {
    if (!project?.projectId)
      throw new Error(
        "This run has no saved Project identity. Export it before closing this page.",
      );
    const binding = await loadProjectBinding(project.projectId);
    if (binding) return { folder: binding.folder };
    const workspace = await loadRememberedWorkspaceFolder();
    return {
      folder: workspace
        ? await resolveProjectFolderById(workspace, project.projectId)
        : null,
    };
  } catch (error) {
    return {
      folder: null,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

const monitorSettingsKey = "ucsb-xrp-monitor-settings-v4";
const previousMonitorSettingsKey = "ucsb-xrp-monitor-settings-v3";
const maximumPlotSamples = 1_800;
const maximumRetainedRunArchives = 4;
const loadMonitorExport = () => import("./monitor-export");
const emptyRuntimeState: RuntimeState = {
  revision: 0,
  parameters: [],
  watches: [],
  plots: [],
};

function sameRuntimePlotDescriptors(
  left: RuntimeState["plots"],
  right: RuntimeState["plots"],
): boolean {
  return (
    left.length === right.length &&
    left.every(
      (plot, index) =>
        plot.name === right[index]?.name &&
        plot.label === right[index]?.label &&
        plot.unit === right[index]?.unit,
    )
  );
}

function monitorSessionSummary(): string {
  const offline = readOfflineShellStatus();
  const navigatorWithData = navigator as Navigator & {
    userAgentData?: { platform?: string };
    serial?: unknown;
    locks?: unknown;
  };
  return JSON.stringify({
    appBuild:
      offline.state === "development"
        ? "local-development"
        : (offline.version ?? offline.state),
    route: window.location.pathname,
    browser: navigator.userAgent,
    platform: navigatorWithData.userAgentData?.platform ?? navigator.platform,
    language: navigator.language,
    displayMode: window.matchMedia("(display-mode: standalone)").matches
      ? "installed-app"
      : "browser-tab",
    online: navigator.onLine,
    capabilities: {
      fileSystemAccess: "showDirectoryPicker" in window,
      secureContext: window.isSecureContext,
      serviceWorker: "serviceWorker" in navigator,
      serviceWorkerController: Boolean(navigator.serviceWorker?.controller),
      webLocks: Boolean(navigatorWithData.locks),
      webSerial: Boolean(navigatorWithData.serial),
    },
  });
}

function isActiveRunState(state: TargetRunState): boolean {
  return state === "loading" || state === "running";
}

function wasCancelled(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError";
}

interface ExportDestination {
  description: string;
  completion: "saved" | "download-requested";
  save(blob: Blob): Promise<void>;
}

function exportCompletionDetail(destination: ExportDestination): string {
  return destination.completion === "saved"
    ? `Saved ${destination.description}`
    : `Download requested: ${destination.description}. Check your browser downloads.`;
}

async function prepareExportDestination(
  folder: CourseDirectoryHandle | null,
  fileName: string,
  mimeType: string,
): Promise<ExportDestination | null> {
  const writable = folder
    ? await courseFolderPermission(folder).catch(() => "denied")
    : "denied";
  if (folder && writable === "granted") {
    const path = `exports/${fileName}`;
    return {
      description: `./${folder.name}/${path}`,
      completion: "saved",
      save: (blob) =>
        withCourseFolderWriteLock("run", () =>
          writeCourseFile(folder, path, blob),
        ),
    };
  }

  const picker = (
    window as Window & {
      showSaveFilePicker?: (options: {
        suggestedName: string;
        types: Array<{
          description: string;
          accept: Record<string, string[]>;
        }>;
      }) => Promise<CourseFileHandle>;
    }
  ).showSaveFilePicker;
  if (picker) {
    const extension = `.${fileName.split(".").at(-1) ?? "data"}`;
    try {
      const handle = await picker({
        suggestedName: fileName,
        types: [
          {
            description: "UCSBXRP export",
            accept: { [mimeType]: [extension] },
          },
        ],
      });
      return {
        description: handle.name,
        completion: "saved",
        save: async (blob) => {
          const writable = await handle.createWritable();
          await writable.write(blob);
          await writable.close();
        },
      };
    } catch (error) {
      if (wasCancelled(error)) return null;
      throw error;
    }
  }

  return {
    description: fileName,
    completion: "download-requested",
    save: async (blob) => downloadBlob(blob, fileName),
  };
}

interface MonitorSettings {
  timeWindowS: number;
  showTargetValues: boolean;
  plots: Record<SignalPlotId, boolean>;
  layout: {
    topHeightPercent: number;
    worldWidthPercent: number;
    plotsWidthPercent: number;
  };
}

const defaultMonitorSettings: MonitorSettings = {
  timeWindowS: 10,
  showTargetValues: false,
  plots: {
    "wheel-speed": true,
    "wheel-distance": false,
    "motor-effort": true,
    "pose-error": false,
    range: false,
    acceleration: false,
    "angular-rate": false,
  },
  layout: {
    topHeightPercent: 57,
    worldWidthPercent: 77,
    plotsWidthPercent: 69,
  },
};

function boundedPercent(
  value: unknown,
  fallback: number,
  minimum: number,
  maximum: number,
): number {
  const numeric = Number(value);
  return Number.isFinite(numeric)
    ? Math.min(maximum, Math.max(minimum, numeric))
    : fallback;
}

function loadMonitorSettings(): MonitorSettings {
  try {
    const currentSettings = window.localStorage.getItem(monitorSettingsKey);
    const stored = JSON.parse(
      currentSettings ??
        window.localStorage.getItem(previousMonitorSettingsKey) ??
        "null",
    ) as Partial<MonitorSettings> | null;
    const timeWindowS = Number(stored?.timeWindowS);
    return {
      timeWindowS:
        Number.isFinite(timeWindowS) && timeWindowS >= 2 && timeWindowS <= 30
          ? timeWindowS
          : defaultMonitorSettings.timeWindowS,
      showTargetValues:
        currentSettings !== null &&
        typeof stored?.showTargetValues === "boolean"
          ? stored.showTargetValues
          : defaultMonitorSettings.showTargetValues,
      plots: Object.fromEntries(
        SIGNAL_PLOTS.map((plot) => [
          plot.id,
          typeof stored?.plots?.[plot.id] === "boolean"
            ? stored.plots[plot.id]
            : defaultMonitorSettings.plots[plot.id],
        ]),
      ) as Record<SignalPlotId, boolean>,
      layout: {
        topHeightPercent: boundedPercent(
          stored?.layout?.topHeightPercent,
          defaultMonitorSettings.layout.topHeightPercent,
          35,
          75,
        ),
        worldWidthPercent: boundedPercent(
          stored?.layout?.worldWidthPercent,
          defaultMonitorSettings.layout.worldWidthPercent,
          48,
          78,
        ),
        plotsWidthPercent: boundedPercent(
          stored?.layout?.plotsWidthPercent,
          defaultMonitorSettings.layout.plotsWidthPercent,
          42,
          84,
        ),
      },
    };
  } catch {
    return defaultMonitorSettings;
  }
}

function initiallyShowMonitorControls(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) {
    return true;
  }
  return window.matchMedia("(min-width: 901px)").matches;
}

function value(value: number | null, digits = 1): string {
  return value !== null && Number.isFinite(value) ? value.toFixed(digits) : "—";
}

function vector(
  values: [number, number, number] | null,
  convert: (value: number) => number,
  digits: number,
): string {
  return values
    ? values.map((item) => value(convert(item), digits)).join(" / ")
    : "—";
}

function centeredWorldPreview(
  source: TelemetrySample["source"],
): TelemetrySample {
  return {
    tMs: 0,
    seq: 0,
    source,
    poseAvailable: false,
    xMm: 0,
    yMm: 0,
    headingRad: 0,
    leftEffort: 0,
    rightEffort: 0,
    leftWheelSpeedMmS: 0,
    rightWheelSpeedMmS: 0,
    leftEncoderCount: 0,
    rightEncoderCount: 0,
    collision: false,
    rangeMm: null,
    buttonPressed: false,
    accelerationMg: null,
    angularRateMdps: null,
    temperatureC: null,
    batteryV: null,
    sensorError: null,
  };
}

export function DashboardApp() {
  const embeddedApplication = isEmbeddedApplication();
  const monitorSurfaceActive = useWorkspaceSurfaceActive("monitor");
  const monitorSurfaceActiveRef = useRef(monitorSurfaceActive);
  monitorSurfaceActiveRef.current = monitorSurfaceActive;
  const [
    targetPreference,
    updateTargetPreference,
    targetPreferenceReady,
    targetPreferenceError,
  ] = useTargetPreference();
  const [connectionAttempt, setConnectionAttempt] = useState(0);
  const [worldCatalog, setWorldCatalog] = useState<WorldCatalog>(
    DEFAULT_WORLD_CATALOG,
  );
  const [selectedWorldId, setSelectedWorldId] = useState(
    DEFAULT_WORLD_CATALOG.defaultWorldId,
  );
  const worldCatalogRef = useRef(worldCatalog);
  worldCatalogRef.current = worldCatalog;
  const selectedWorldIdRef = useRef(selectedWorldId);
  selectedWorldIdRef.current = selectedWorldId;
  const [monitorSettings, setMonitorSettings] =
    useState<MonitorSettings>(loadMonitorSettings);
  const [controlsOpen, setControlsOpen] = useState(
    initiallyShowMonitorControls,
  );
  const [liveSidebarOpen, setLiveSidebarOpen] = useState(true);
  const [plotsOpen, setPlotsOpen] = useState(true);
  const controlsRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!controlsOpen) return;
    const closeOverlay = (event: PointerEvent) => {
      if (
        window.matchMedia("(max-width: 900px)").matches &&
        controlsRef.current &&
        !controlsRef.current.contains(event.target as Node)
      ) {
        setControlsOpen(false);
      }
    };
    document.addEventListener("pointerdown", closeOverlay);
    return () => document.removeEventListener("pointerdown", closeOverlay);
  }, [controlsOpen]);

  useEffect(() => {
    if (!window.matchMedia) return;
    const narrowLayout = window.matchMedia("(max-width: 900px)");
    const closeControlsOnNarrowLayout = (event: MediaQueryListEvent) => {
      if (event.matches) setControlsOpen(false);
    };
    narrowLayout.addEventListener("change", closeControlsOnNarrowLayout);
    return () =>
      narrowLayout.removeEventListener("change", closeControlsOnNarrowLayout);
  }, []);
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
    targetPreference.hostname,
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
  const runDatasetController = useMemo(
    () => new MonitorRunDatasetController(30_000),
    [],
  );
  const [visualSnapshot, setVisualSnapshot] = useState<MonitorVisualSnapshot>({
    sample: null,
    samples: [],
  });
  const monitorVisualHistory = useMemo(
    () =>
      new MonitorVisualHistory(
        maximumPlotSamples,
        setVisualSnapshot,
        (callback) => window.requestAnimationFrame(callback),
        (frameId) => window.cancelAnimationFrame(frameId),
      ),
    [],
  );
  const sample = visualSnapshot.sample;
  const plotSamples = visualSnapshot.samples;
  const [activeRunWorldBackfill, setActiveRunWorldBackfill] = useState<
    readonly TelemetrySample[] | null
  >(null);
  const [targetState, setTargetState] =
    useState<TargetRunState>("disconnected");
  const [targetDetail, setTargetDetail] = useState("Not connected");
  const [currentProject, setCurrentProject] =
    useState<SynchronizedProject | null>(null);
  const [projectProviderAvailable, setProjectProviderAvailable] =
    useState(false);
  const [runStarting, setRunStarting] = useState(false);
  const [activeRunId, setActiveRunId] = useState<string | null>(null);
  const [latestRun, setLatestRun] = useState<MonitorRunDataset | null>(null);
  const [savedRunId, setSavedRunId] = useState<string | null>(null);
  const savedRunIdRef = useRef<string | null>(null);
  const [worldHistoryCleared, setWorldHistoryCleared] = useState(false);
  const [runtimeState, setRuntimeState] =
    useState<RuntimeState>(emptyRuntimeState);
  const [availableProgramPlots, setAvailableProgramPlots] = useState(
    emptyRuntimeState.plots,
  );
  const [programPlotVisibility, setProgramPlotVisibility] = useState<
    Record<string, boolean>
  >({});
  const [runtimeDrafts, setRuntimeDrafts] = useState<
    Record<string, RuntimeParameterValue>
  >({});
  const [runtimeUpdateError, setRuntimeUpdateError] = useState("");
  const [autosaveFolder, setAutosaveFolder] =
    useState<CourseDirectoryHandle | null>(null);
  const [autosaveProjectId, setAutosaveProjectId] = useState<string | null>(
    null,
  );
  const [folderInteractionRevision, setFolderInteractionRevision] = useState(0);
  const [folderReadError, setFolderReadError] = useState("");
  const refreshFolderRef = useRef<() => void>(() => undefined);
  const [rememberedAutosaveFolder, setRememberedAutosaveFolder] =
    useState<CourseDirectoryHandle | null>(null);
  const [runAutosaveDetail, setRunAutosaveDetail] = useState(
    "Choose a Working folder and project in the IDE.",
  );
  const [annotations, setAnnotations] = useState<MonitorAnnotation[]>([]);
  const [annotationsVisible, setAnnotationsVisible] = useState(true);
  const [noteRequest, setNoteRequest] = useState<NoteRequest | null>(null);
  const [noteFeedback, setNoteFeedback] = useState("");
  const [exportState, setExportState] = useState<
    "idle" | "telemetry-csv" | "plots-svg" | "plots-png" | "world-webm"
  >("idle");
  const [exportDetail, setExportDetail] = useState("");
  const nextConsoleId = useRef(1);
  const autosaveFolderRef = useRef<CourseDirectoryHandle | null>(null);
  const autosaveWorkspaceRef = useRef<CourseDirectoryHandle | null>(null);
  const activeRunFolderRef = useRef<Promise<RunFolderResolution> | null>(null);
  const latestRunDestinationRef = useRef<Promise<RunFolderResolution> | null>(
    null,
  );
  const [control, setControl] = useState<Extract<
    TargetEvent,
    { type: "control" }
  > | null>(null);
  const latestRunFolderRef = useRef<CourseDirectoryHandle | null>(null);
  const diagnosticFolderRef = useRef<CourseDirectoryHandle | null>(null);
  const autosaveFolderRemembered = useRef(false);
  const currentProjectRef = useRef<SynchronizedProject | null>(null);
  const projectProviderAvailableRef = useRef(false);
  const annotationsRef = useRef<MonitorAnnotation[]>([]);
  const runArchiveQueue = useRef<Promise<void>>(Promise.resolve());
  const targetStateRef = useRef<TargetRunState>("disconnected");
  const runStartingRef = useRef(false);
  const runPreflightEpochRef = useRef(0);
  const exportActiveRef = useRef(false);
  const runtimeUpdateRevisions = useRef(new Map<string, number>());
  const nextRuntimeUpdateRevision = useRef(0);
  const runtimeUpdateTimers = useRef(
    new Map<string, ReturnType<typeof setTimeout>>(),
  );
  const latestRuntimeStateRef = useRef<RuntimeState>(emptyRuntimeState);
  const folderInteractionCountRef = useRef(0);
  const runArchiveCountRef = useRef(0);
  const retainedRunArchivesRef = useRef(new Map<string, RetainedRunArchive>());
  const declinedRunRef = useRef<string | null>(null);
  const [recordingAdmissionDetail, setRecordingAdmissionDetail] = useState("");
  const [discardRunId, setDiscardRunId] = useState<string | null>(null);
  const pendingRunNotesRef = useRef(
    new Map<
      string,
      {
        runId: string;
        project: SynchronizedProject | null;
        annotations: readonly MonitorAnnotation[];
      }
    >(),
  );
  const [, refreshPendingRunNotes] = useState(0);
  const targetCommandCountRef = useRef(0);
  const annotationDraftIdsRef = useRef(new Set<string>());
  const telemetryRateSamplesRef = useRef<TelemetrySample[]>([]);
  const nextRunIdRef = useRef(1);
  const replayedRunRef = useRef<ReplayedRunBuffer | null>(null);
  const diagnosticWriteErrorShownRef = useRef(false);
  const diagnosticLog = useMemo(
    () =>
      new DiagnosticLogWriter({
        app: "Monitor",
        courseRelease: courseRelease.release_id,
        onWriteError: (error) => {
          if (diagnosticWriteErrorShownRef.current) return;
          diagnosticWriteErrorShownRef.current = true;
          setRunAutosaveDetail(error.message);
        },
      }),
    [],
  );

  const publishRuntimeState = useCallback((state: RuntimeState) => {
    setRuntimeState(state);
    if (state.plots.length > 0) {
      setAvailableProgramPlots((current) =>
        sameRuntimePlotDescriptors(current, state.plots)
          ? current
          : state.plots,
      );
      setProgramPlotVisibility((current) => {
        const next = {
          ...current,
          ...Object.fromEntries(
            state.plots.map((plot) => [plot.name, current[plot.name] ?? true]),
          ),
        };
        return Object.keys(next).length === Object.keys(current).length &&
          Object.entries(next).every(
            ([name, visible]) => current[name] === visible,
          )
          ? current
          : next;
      });
    }
  }, []);

  useEffect(() => {
    monitorVisualHistory.setActive(monitorSurfaceActive);
    if (monitorSurfaceActive) {
      setActiveRunWorldBackfill(
        runDatasetController.activeRecordingSnapshot()?.samples ?? null,
      );
      publishRuntimeState(latestRuntimeStateRef.current);
    }
  }, [
    monitorSurfaceActive,
    monitorVisualHistory,
    publishRuntimeState,
    runDatasetController,
  ]);

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

  const setAnnotationDraftActive = useCallback(
    (plotId: string, active: boolean) => {
      if (active) {
        annotationDraftIdsRef.current.add(plotId);
      } else {
        annotationDraftIdsRef.current.delete(plotId);
        retryPendingOfflineShellReload();
      }
    },
    [],
  );

  useEffect(() => {
    if (targetState === "running") {
      return;
    }
    for (const timer of runtimeUpdateTimers.current.values()) {
      clearTimeout(timer);
    }
    runtimeUpdateTimers.current.clear();
    runtimeUpdateRevisions.current.clear();
    setRuntimeDrafts({});
    retryPendingOfflineShellReload();
  }, [targetState]);

  useEffect(() => {
    try {
      window.localStorage.setItem(
        monitorSettingsKey,
        JSON.stringify(monitorSettings),
      );
    } catch {
      /* Plot controls remain usable for this session. */
    }
  }, [monitorSettings]);

  useEffect(() => {
    autosaveFolderRef.current = autosaveFolder;
  }, [autosaveFolder]);

  useEffect(() => {
    annotationsRef.current = annotations;
  }, [annotations]);

  useEffect(() => {
    const recordWindowError = (event: ErrorEvent) => {
      diagnosticLog.record({
        event: "window.error",
        level: "error",
        terminal: true,
        message:
          event.error instanceof Error
            ? `${event.error.message}\n${event.error.stack ?? ""}`
            : event.message,
      });
    };
    const recordUnhandledRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      diagnosticLog.record({
        event: "window.unhandled-rejection",
        level: "error",
        terminal: true,
        message:
          reason instanceof Error
            ? `${reason.message}\n${reason.stack ?? ""}`
            : String(reason),
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

  useEffect(() => {
    let disposed = false;
    let refreshRevision = 0;
    const publishFolderDetail = (detail: string) => {
      if (
        !runDatasetController.isActive &&
        !runDatasetController.latest &&
        retainedRunArchivesRef.current.size === 0 &&
        pendingRunNotesRef.current.size === 0
      )
        setRunAutosaveDetail(detail);
    };
    const refreshFolder = async (preserveUnrememberedFolder = false) => {
      beginFolderInteraction();
      const revision = ++refreshRevision;
      const assertCurrent = () => {
        if (disposed || revision !== refreshRevision)
          throw new DOMException(
            "Project folder selection changed.",
            "AbortError",
          );
      };
      setFolderReadError("");
      try {
        const workspace = await loadRememberedWorkspaceFolder();
        if (disposed || revision !== refreshRevision) {
          return;
        }
        const workspacePermission = workspace
          ? await courseFolderPermission(workspace)
          : "denied";
        if (disposed || revision !== refreshRevision) return;
        if (workspace && workspacePermission === "granted") {
          if (diagnosticFolderRef.current !== workspace) {
            diagnosticFolderRef.current = workspace;
            diagnosticWriteErrorShownRef.current = false;
            diagnosticLog.attachWorkingFolder(workspace);
            diagnosticLog.record({
              event: "session.start",
              message: monitorSessionSummary(),
              terminal: true,
            });
            diagnosticLog.record({
              event: "working-folder.connected",
              message: `Working folder ${workspace.name} is writable.`,
            });
          }
        } else {
          diagnosticFolderRef.current = null;
          diagnosticLog.detachWorkingFolder();
        }
        if (workspace && workspacePermission !== "granted") {
          autosaveFolderRemembered.current = false;
          autosaveFolderRef.current = null;
          setRememberedAutosaveFolder(null);
          setAutosaveFolder(null);
          setAutosaveProjectId(null);
          publishFolderDetail(
            `Open the IDE to reconnect Working folder ${workspace.name}.`,
          );
          return;
        }
        const folder = workspace ? await loadRememberedProjectFolder() : null;
        if (disposed || revision !== refreshRevision) return;
        if (folder === null) {
          if (preserveUnrememberedFolder && !autosaveFolderRemembered.current) {
            return;
          }
          autosaveFolderRemembered.current = false;
          autosaveFolderRef.current = null;
          setRememberedAutosaveFolder(null);
          setAutosaveFolder(null);
          setAutosaveProjectId(null);
          publishFolderDetail(
            "Choose a Working folder and project in the IDE.",
          );
          return;
        }
        autosaveFolderRemembered.current = true;
        setRememberedAutosaveFolder(folder);
        const permission = await courseFolderPermission(folder);
        if (disposed || revision !== refreshRevision) {
          return;
        }
        if (permission === "granted") {
          const opened = await readProjectFolderWhenIdle(folder, {
            assertCurrent,
            onWait: () =>
              publishFolderDetail(
                `Waiting for ${folder.name} to finish saving…`,
              ),
          });
          if (disposed || revision !== refreshRevision) {
            return;
          }
          const descriptor = {
            ...(await describeProject(opened.project)),
            projectId: opened.project.session?.projectId,
          };
          if (workspace && descriptor.projectId)
            await rememberProjectBinding(descriptor.projectId, {
              workspace,
              folder,
            });
          if (disposed || revision !== refreshRevision) return;
          autosaveFolderRef.current = folder;
          autosaveWorkspaceRef.current = workspace;
          setAutosaveFolder(folder);
          setAutosaveProjectId(descriptor.projectId ?? null);
          if (currentProjectRef.current === null) {
            currentProjectRef.current = descriptor;
            setCurrentProject(descriptor);
          }
          publishFolderDetail(`Runs save automatically to ${folder.name}.`);
        } else {
          autosaveFolderRef.current = null;
          setAutosaveFolder(null);
          setAutosaveProjectId(null);
          publishFolderDetail(
            `Reconnect project folder ${folder.name} to resume run saving.`,
          );
        }
      } catch (error: unknown) {
        if (disposed || revision !== refreshRevision || wasCancelled(error))
          return;
        const detail = error instanceof Error ? error.message : String(error);
        autosaveFolderRef.current = null;
        setAutosaveFolder(null);
        setAutosaveProjectId(null);
        setFolderReadError(detail);
        publishFolderDetail(`Project folder could not be read. ${detail}`);
        diagnosticLog.record({
          event: "working-folder.open-failed",
          level: "error",
          terminal: true,
          message: detail,
        });
      } finally {
        finishFolderInteraction();
      }
    };
    const retryFolder = () => void refreshFolder();
    refreshFolderRef.current = retryFolder;
    const folderChanged = () => {
      const sharedFolderCanChange = autosaveFolderRemembered.current;
      diagnosticFolderRef.current = null;
      diagnosticLog.detachWorkingFolder();
      if (sharedFolderCanChange) {
        // Stop writes immediately; loading the replacement handle is asynchronous.
        autosaveFolderRef.current = null;
        setAutosaveFolder(null);
        setAutosaveProjectId(null);
      }
      void refreshFolder(!sharedFolderCanChange);
    };
    void refreshFolder();
    const unsubscribe = subscribeCourseFolderChanged(folderChanged);
    return () => {
      disposed = true;
      if (refreshFolderRef.current === retryFolder)
        refreshFolderRef.current = () => undefined;
      runPreflightEpochRef.current += 1;
      unsubscribe();
      void diagnosticLog.flush();
    };
  }, [
    beginFolderInteraction,
    diagnosticLog,
    finishFolderInteraction,
    runDatasetController,
  ]);

  const archiveCompletedRun = useCallback(
    (run: MonitorRunDataset, destination: Promise<RunFolderResolution>) => {
      const previous = retainedRunArchivesRef.current.get(run.id);
      if (previous?.saving) return;
      const retained: RetainedRunArchive = {
        run,
        destination,
        saving: true,
        error: previous?.error,
      };
      const pendingNotes = pendingRunNotesRef.current.get(run.id);
      const includesPendingNotes =
        pendingNotes !== undefined &&
        JSON.stringify(pendingNotes.annotations) ===
          JSON.stringify(run.annotations);
      retainedRunArchivesRef.current.set(run.id, retained);
      refreshPendingRunNotes((revision) => revision + 1);
      if (runDatasetController.latest?.id === run.id)
        setRunAutosaveDetail("Saving completed run to its Project folder…");
      runArchiveCountRef.current += 1;
      const queued = runArchiveQueue.current.then(async () => {
        const resolved = await destination;
        if (!resolved.folder)
          throw new Error(
            resolved.error ??
              "Reconnect the run's Project folder in the IDE, or export the displayed run.",
          );
        await saveRunArchive(resolved.folder, archiveForRun(run));
        // Another Monitor may have archived this run first. Merge this
        // window's notes without replacing that run's samples or output.
        if (run.annotations.length > 0)
          await saveRunAnnotations(resolved.folder, archiveForRun(run));
        const saved = await readRunAnnotations(
          resolved.folder,
          run.id,
          run.project!.projectId!,
        );
        if (retainedRunArchivesRef.current.get(run.id) === retained)
          retainedRunArchivesRef.current.delete(run.id);
        if (
          includesPendingNotes &&
          pendingRunNotesRef.current.get(run.id) === pendingNotes
        )
          pendingRunNotesRef.current.delete(run.id);
        if (runDatasetController.latest?.id === run.id) {
          latestRunFolderRef.current = resolved.folder;
          if (
            JSON.stringify(runDatasetController.currentAnnotations()) ===
            JSON.stringify(run.annotations)
          ) {
            const updated = runDatasetController.restoreAnnotations(saved);
            annotationsRef.current = [
              ...runDatasetController.currentAnnotations(),
            ];
            setAnnotations(annotationsRef.current);
            if (updated) setLatestRun(updated);
          }
        }
        return resolved.folder;
      });
      runArchiveQueue.current = queued.then(
        () => undefined,
        () => undefined,
      );
      void queued
        .then((folder) => {
          if (runDatasetController.latest?.id === run.id)
            setRunAutosaveDetail(`Saved automatically to ${folder.name}.`);
          diagnosticLog.record({
            event: "run.archive-saved",
            message: `Run ${run.id} was saved to Project folder ${folder.name}.`,
          });
        })
        .catch((error: unknown) => {
          const detail = error instanceof Error ? error.message : String(error);
          retained.error = detail;
          if (runDatasetController.latest?.id === run.id)
            setRunAutosaveDetail(
              `Run save failed: ${detail} Export the displayed run to retain it.`,
            );
          diagnosticLog.record({
            event: "run.archive-failed",
            level: "error",
            terminal: true,
            message: `Run ${run.id} could not be saved: ${detail}`,
          });
        })
        .finally(() => {
          retained.saving = false;
          runArchiveCountRef.current = Math.max(
            0,
            runArchiveCountRef.current - 1,
          );
          refreshPendingRunNotes((revision) => revision + 1);
          retryPendingOfflineShellReload();
        });
    },
    [diagnosticLog, runDatasetController],
  );

  const retryRunArchive = (retained: RetainedRunArchive) => {
    if (
      retained.saving ||
      retainedRunArchivesRef.current.get(retained.run.id) !== retained
    )
      return;
    const destination = retained.destination.then((resolved) =>
      resolved.folder ? resolved : resolveRunFolder(retained.run.project),
    );
    archiveCompletedRun(retained.run, destination);
  };

  const finishActiveRun = useCallback(
    (
      finalState: TargetRunState,
      finalDetail: string,
      finishedAtMs = Date.now(),
    ) => {
      const run = runDatasetController.complete(
        finalState,
        finalDetail,
        new Date(finishedAtMs).toISOString(),
      );
      if (!run) return null;
      const runFolder =
        activeRunFolderRef.current ?? Promise.resolve({ folder: null });
      activeRunFolderRef.current = null;
      latestRunFolderRef.current = null;
      latestRunDestinationRef.current = runFolder;
      setActiveRunId(null);
      setLatestRun(run);
      setActiveRunWorldBackfill(null);
      annotationsRef.current = [...run.annotations];
      setAnnotations([...run.annotations]);
      diagnosticLog.record({
        event: "run.finished",
        eventId: `run-finished:${run.id}`,
        terminal: true,
        level: finalState === "error" ? "error" : "info",
        message: JSON.stringify({
          runId: run.id,
          target: run.target,
          project: run.project?.name ?? null,
          world: run.worldId,
          result: finalState,
          detail: finalDetail,
          durationMs: Math.max(
            0,
            Date.parse(run.finishedAt) - Date.parse(run.startedAt),
          ),
          samples: run.recording.samples.length,
          droppedSamples: run.recording.droppedSamples,
          programOutputLines: run.output.length,
          notes: run.annotations.length,
        }),
      });
      archiveCompletedRun(run, runFolder);
      return run;
    },
    [archiveCompletedRun, diagnosticLog, runDatasetController],
  );

  const clearDisplayedRun = useCallback(() => {
    runDatasetController.clear();
    setActiveRunId(null);
    setLatestRun(null);
    savedRunIdRef.current = null;
    setSavedRunId(null);
    setWorldHistoryCleared(false);
    setActiveRunWorldBackfill(null);
    latestRunFolderRef.current = null;
    latestRunDestinationRef.current = null;
    monitorVisualHistory.clearHistory();
    annotationsRef.current = [];
    setAnnotations([]);
    setNoteFeedback("");
    setExportDetail("");
    retryPendingOfflineShellReload();
  }, [monitorVisualHistory, runDatasetController]);

  const openSavedRun = (
    run: MonitorRunDataset,
    folder: CourseDirectoryHandle,
  ) => {
    if (
      runDatasetController.isActive ||
      runStartingRef.current ||
      targetStateRef.current === "running" ||
      targetStateRef.current === "loading" ||
      autosaveFolderRef.current !== folder ||
      runArchiveCountRef.current > 0 ||
      retainedRunArchivesRef.current.size > 0 ||
      pendingRunNotesRef.current.size > 0 ||
      annotationDraftIdsRef.current.size > 0
    )
      throw new Error(
        "Finish the current run and save or export pending notes before opening another trial.",
      );
    const restored = runDatasetController.restore(run);
    latestRunFolderRef.current = folder;
    latestRunDestinationRef.current = Promise.resolve({ folder });
    setLatestRun(restored);
    savedRunIdRef.current = restored.id;
    setSavedRunId(restored.id);
    setWorldHistoryCleared(false);
    setActiveRunWorldBackfill(null);
    annotationsRef.current = [...restored.annotations];
    setAnnotations(annotationsRef.current);
    setAnnotationsVisible(true);
    setNoteFeedback("");
    setExportDetail("");
    setRunAutosaveDetail(`Opened saved trial from ${folder.name}.`);
    const names = restored.recording.samples.flatMap(
      (sample) => sample.plotValues?.map((plot) => plot.name) ?? [],
    );
    setProgramPlotVisibility((current) => ({
      ...current,
      ...Object.fromEntries(names.map((name) => [name, current[name] ?? true])),
    }));
  };

  const beginRunDataset = useCallback(
    (
      source: TelemetrySample["source"],
      identity?: {
        id: string;
        startedAtMs?: number;
        replayed?: boolean;
        project?: SynchronizedProject | null;
      },
    ): string | null => {
      if (runDatasetController.activeId) {
        return runDatasetController.activeId;
      }
      const runId =
        identity?.id ?? `${source}-${Date.now()}-${nextRunIdRef.current++}`;
      if (retainedRunArchivesRef.current.size >= maximumRetainedRunArchives) {
        declinedRunRef.current = runId;
        setRecordingAdmissionDetail(
          "This run is not being recorded because recovery storage was full when it began. Live telemetry and Stop remain available. Recover the retained runs, then start a new run.",
        );
        return null;
      }
      declinedRunRef.current = null;
      setRecordingAdmissionDetail("");
      const project =
        identity?.project !== undefined
          ? identity.project
          : currentProjectRef.current;
      const catalog = worldCatalogRef.current;
      const selectedWorld =
        catalog.worlds.find(
          (world) => world.id === selectedWorldIdRef.current,
        ) ?? catalog.worlds[0]!;
      runDatasetController.begin({
        id: runId,
        target: source,
        project,
        worldId: selectedWorld.id,
        world: selectedWorld,
        startedAt: new Date(identity?.startedAtMs ?? Date.now()).toISOString(),
      });
      activeRunFolderRef.current = resolveRunFolder(project);
      setActiveRunId(runId);
      savedRunIdRef.current = null;
      setSavedRunId(null);
      setWorldHistoryCleared(false);
      setActiveRunWorldBackfill(null);
      monitorVisualHistory.clearHistory();
      annotationsRef.current = [];
      setAnnotations([]);
      setNoteFeedback("");
      setExportDetail("");
      setRunAutosaveDetail(
        project?.projectId
          ? `Locating the Project folder for ${project.name}…`
          : "Run folder identity is unavailable. Export this run before closing the page.",
      );
      void activeRunFolderRef.current.then((resolved) => {
        if (runDatasetController.activeId !== runId) return;
        setRunAutosaveDetail(
          resolved.folder
            ? `Will save automatically to ${resolved.folder.name}.`
            : (resolved.error ??
                "Reconnect the run's Project folder or export this run."),
        );
      });
      if (!identity?.replayed) {
        diagnosticLog.record({
          event: "run.started",
          eventId: `run-started:${runId}`,
          message: JSON.stringify({
            runId,
            target: source,
            project: currentProjectRef.current?.name ?? null,
            world: selectedWorld.id,
          }),
        });
      }
      return runId;
    },
    [diagnosticLog, monitorVisualHistory, runDatasetController],
  );

  const updateSavedRunAnnotations = useCallback(
    (run: MonitorRunDataset) => {
      const retained = retainedRunArchivesRef.current.get(run.id);
      if (retained) retained.run = run;
      setRunAutosaveDetail("Saving run notes…");
      const pending = {
        runId: run.id,
        project: run.project,
        annotations: run.annotations,
      };
      pendingRunNotesRef.current.set(run.id, pending);
      refreshPendingRunNotes((revision) => revision + 1);
      const destination =
        latestRunDestinationRef.current ?? resolveRunFolder(run.project);
      runArchiveCountRef.current += 1;
      const update = runArchiveQueue.current.then(async () => {
        const resolved = await destination;
        if (!resolved.folder)
          throw new Error(
            resolved.error ??
              "Reconnect the run's Project folder or export the displayed run with its notes.",
          );
        await saveRunAnnotations(resolved.folder, archiveForRun(run));
        const saved = await readRunAnnotations(
          resolved.folder,
          run.id,
          run.project!.projectId!,
        );
        if (
          runDatasetController.latest?.id === run.id &&
          pendingRunNotesRef.current.get(run.id) === pending
        ) {
          const updated = runDatasetController.restoreAnnotations(saved);
          annotationsRef.current = [
            ...runDatasetController.currentAnnotations(),
          ];
          setAnnotations(annotationsRef.current);
          if (updated) setLatestRun(updated);
        }
        if (pendingRunNotesRef.current.get(run.id) === pending) {
          pendingRunNotesRef.current.delete(run.id);
          refreshPendingRunNotes((revision) => revision + 1);
        }
        if (runDatasetController.latest?.id === run.id)
          setRunAutosaveDetail(
            `Saved notes for this run to ${resolved.folder.name}.`,
          );
      });
      runArchiveQueue.current = update.catch(() => undefined);
      void update
        .catch((error: unknown) => {
          if (runDatasetController.latest?.id === run.id)
            setRunAutosaveDetail(
              error instanceof Error ? error.message : String(error),
            );
        })
        .finally(() => {
          runArchiveCountRef.current = Math.max(
            0,
            runArchiveCountRef.current - 1,
          );
          retryPendingOfflineShellReload();
        });
    },
    [runDatasetController],
  );

  useEffect(() => {
    if (!targetPreferenceReady) {
      targetStateRef.current = "disconnected";
      setTargetState("disconnected");
      setTargetDetail("Opening the saved XRP settings…");
      return;
    }
    if (targetPreferenceError) {
      targetStateRef.current = "error";
      setTargetState("error");
      setTargetDetail(targetPreferenceError);
      return;
    }
    setActiveRunId(null);
    setCurrentProject(null);
    latestRuntimeStateRef.current = emptyRuntimeState;
    setRuntimeState(emptyRuntimeState);
    setAvailableProgramPlots([]);
    setProgramPlotVisibility({});
    setRuntimeDrafts({});
    setRuntimeUpdateError("");
    projectProviderAvailableRef.current = false;
    nextConsoleId.current = 1;
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
      if (event.type === "telemetry") {
        const normalizedSample = normalizeTelemetryUltrasound(event.sample);
        if (
          event.replayed !== true &&
          normalizedSample.observationKind === "reset" &&
          !runDatasetController.isActive &&
          savedRunIdRef.current !== runDatasetController.latest?.id
        ) {
          setWorldHistoryCleared(true);
          setActiveRunWorldBackfill(null);
        }
        const rateSamples = telemetryRateSamplesRef.current;
        appendTelemetryRateSample(rateSamples, normalizedSample);

        if (event.replayed === true && replayedRunRef.current) {
          replayedRunRef.current.samples.push(normalizedSample);
        }

        const capturedByRun = runDatasetController.capture(normalizedSample);
        const telemetryRestarted = monitorVisualHistory.append(
          normalizedSample,
          capturedByRun,
        );
        if (capturedByRun) {
          if (telemetryRestarted && !runDatasetController.isActive) {
            annotationsRef.current = [];
            setAnnotations([]);
          }
        }
      } else if (event.type === "control") {
        setControl(event);
      } else if (event.type === "run") {
        if (event.phase === "begin") {
          if (declinedRunRef.current === event.runId) return;
          declinedRunRef.current = null;
          beginRunDataset(target.kind, {
            id: event.runId,
            startedAtMs: event.startedAtMs,
            project: projectFromRun(event),
          });
        } else {
          if (declinedRunRef.current === event.runId)
            declinedRunRef.current = null;
          if (runDatasetController.activeId === event.runId) {
            runDatasetController.reportDroppedOutput(event.droppedOutputLines);
            finishActiveRun(event.state, event.detail, event.finishedAtMs);
          }
        }
      } else if (event.type === "status") {
        targetStateRef.current = event.state;
        const retained = replayedRunRef.current?.boundary;
        if (
          (event.state === "running" ||
            (event.state === "connecting" && retained !== undefined)) &&
          !runDatasetController.isActive &&
          declinedRunRef.current === null
        ) {
          // A Monitor can attach after another tab requested Run. Entering the
          // running state, or replaying an interrupted run, is an unambiguous
          // fallback boundary. Initial connection has no retained run.
          beginRunDataset(
            target.kind,
            retained
              ? {
                  id: retained.runId,
                  startedAtMs: retained.startedAtMs,
                  replayed: true,
                  project: projectFromRun(retained),
                }
              : undefined,
          );
          if (retained) {
            runDatasetController.reportRetainedTelemetryDropped(
              retained.retainedTelemetryDropped,
            );
          }
        }
        const nextRunActive =
          isActiveRunState(event.state) ||
          (event.state === "connecting" && runDatasetController.isActive);
        if (
          !nextRunActive &&
          runDatasetController.isActive &&
          !(
            target.kind === "physical" &&
            (event.state === "error" || event.state === "disconnected")
          )
        ) {
          finishActiveRun(event.state, event.detail);
        }
        setTargetState(event.state);
        setTargetDetail(event.detail);
        if (!projectProviderAvailableRef.current) {
          diagnosticLog.record({
            event: "target.status",
            level: event.state === "error" ? "error" : "info",
            terminal: event.state === "error",
            message: JSON.stringify({
              target: target.kind,
              state: event.state,
              detail: event.detail,
            }),
          });
        }
      } else if (event.type === "physical-network") {
        updateTargetPreference((current) =>
          targetPreferenceForPhysicalNetwork(current, event),
        );
        if (!projectProviderAvailableRef.current) {
          diagnosticLog.record({
            event: "target.network",
            terminal: true,
            message: JSON.stringify({
              mode: event.mode,
              address: event.address,
              ssid: event.ssid ?? null,
              requestedMode: event.requestedMode ?? null,
              fallback: event.fallback ?? false,
              robotId: event.robotId ?? null,
              hostname: event.hostname ?? null,
            }),
          });
        }
      } else if (event.type === "project") {
        const projectChanged =
          currentProjectRef.current?.revision !== event.project?.revision;
        currentProjectRef.current = event.project;
        if (projectChanged) {
          latestRuntimeStateRef.current = emptyRuntimeState;
          setRuntimeState(emptyRuntimeState);
          setAvailableProgramPlots([]);
          setProgramPlotVisibility({});
          setRuntimeDrafts({});
          setRuntimeUpdateError("");
        }
        if (projectChanged && runDatasetController.isActive) {
          // The executing run retains its start-time project snapshot. Edits
          // are saved for the next run and do not end telemetry collection.
          runDatasetController.acceptProject(event.project);
        }
        setCurrentProject(event.project);
        if (projectChanged && !projectProviderAvailableRef.current) {
          diagnosticLog.record({
            event: "project.active",
            message: JSON.stringify({
              name: event.project?.name ?? null,
              revision: event.project?.revision ?? null,
            }),
          });
        }
      } else if (event.type === "project-provider") {
        projectProviderAvailableRef.current = event.available;
        setProjectProviderAvailable(event.available);
      } else if (event.type === "runtime") {
        latestRuntimeStateRef.current = event.state;
        if (monitorSurfaceActiveRef.current) {
          publishRuntimeState(event.state);
        }
      } else if (event.type === "world") {
        setWorldCatalog(event.catalog);
        setSelectedWorldId(event.selectedWorldId);
      } else if (event.type === "run-history") {
        if (event.phase === "begin") {
          if (
            retainedRunArchivesRef.current.has(event.runId) ||
            (event.finishedAtMs === undefined &&
              declinedRunRef.current === event.runId)
          ) {
            replayedRunRef.current = null;
            return;
          }
          if (
            retainedRunArchivesRef.current.size >= maximumRetainedRunArchives
          ) {
            replayedRunRef.current = null;
            if (event.finishedAtMs === undefined)
              declinedRunRef.current = event.runId;
            setRecordingAdmissionDetail(
              "This received run was not recorded because recovery storage is full. Live telemetry and Stop remain available. Recover the retained runs before collecting another run.",
            );
            return;
          }
          declinedRunRef.current = null;
          replayedRunRef.current = {
            boundary: event,
            samples: [],
            output: [],
          };
        } else {
          const replayed = replayedRunRef.current;
          replayedRunRef.current = null;
          if (
            replayed &&
            replayed.boundary.runId === event.runId &&
            event.finishedAtMs !== undefined &&
            !runDatasetController.isActive &&
            savedRunIdRef.current === null &&
            !retainedRunArchivesRef.current.has(event.runId) &&
            retainedRunArchivesRef.current.size < maximumRetainedRunArchives &&
            replayed.samples.length > 0
          ) {
            const catalog = worldCatalogRef.current;
            const selectedWorld =
              catalog.worlds.find(
                (world) => world.id === selectedWorldIdRef.current,
              ) ?? catalog.worlds[0]!;
            const replayRecorder = new TelemetryRecorder();
            replayRecorder.start();
            for (const retainedSample of replayed.samples) {
              replayRecorder.capture(retainedSample);
            }
            const recording = replayRecorder.stop();
            const retainedDropped =
              event.retainedTelemetryDropped ??
              replayed.boundary.retainedTelemetryDropped ??
              0;
            const knownPrefixLoss =
              Number.isSafeInteger(retainedDropped) && retainedDropped >= 0
                ? retainedDropped
                : 0;
            const restored = runDatasetController.restore({
              id: event.runId,
              target: target.kind,
              project: projectFromRun(event),
              worldId: selectedWorld.id,
              world: selectedWorld,
              startedAt: new Date(event.startedAtMs).toISOString(),
              finishedAt: new Date(
                event.finishedAtMs ?? event.startedAtMs,
              ).toISOString(),
              finalState: event.state,
              finalDetail: event.detail,
              recording: {
                ...recording,
                droppedSamples: recording.droppedSamples + knownPrefixLoss,
              },
              output: replayed.output,
              droppedOutputLines: event.droppedOutputLines ?? 0,
              annotations: [],
            });
            activeRunFolderRef.current = null;
            latestRunFolderRef.current = null;
            latestRunDestinationRef.current = resolveRunFolder(
              restored.project,
            );
            const retained: RetainedRunArchive = {
              run: restored,
              destination: latestRunDestinationRef.current,
              saving: true,
            };
            retainedRunArchivesRef.current.set(restored.id, retained);
            void retained.destination
              .then(async (resolved) => {
                if (!resolved.folder || !restored.project?.projectId)
                  throw new Error(
                    resolved.error ??
                      "The run's Project folder is unavailable.",
                  );
                const saved = await readSavedRun(
                  resolved.folder,
                  restored.project.projectId,
                  restored.id,
                  {
                    assertCurrent: () => {
                      if (
                        retainedRunArchivesRef.current.get(restored.id) !==
                        retained
                      )
                        throw new DOMException(
                          "Run archive verification was canceled.",
                          "AbortError",
                        );
                    },
                    onWait: () => {
                      if (
                        runDatasetController.latest?.id === restored.id &&
                        !pendingRunNotesRef.current.has(restored.id)
                      )
                        setRunAutosaveDetail(
                          `Waiting for ${resolved.folder!.name} to finish saving before reading this run…`,
                        );
                    },
                  },
                );
                if (
                  saved.target !== restored.target ||
                  saved.project?.revision !== restored.project.revision
                )
                  throw new Error(
                    "The saved archive does not match this run's target and Project revision. Export the retained copy before closing the page.",
                  );
                if (runDatasetController.latest?.id === restored.id) {
                  const updated = runDatasetController.restoreAnnotations(
                    saved.annotations,
                  );
                  annotationsRef.current = [
                    ...runDatasetController.currentAnnotations(),
                  ];
                  setAnnotations(annotationsRef.current);
                  if (updated) setLatestRun(updated);
                  latestRunFolderRef.current = resolved.folder;
                  if (!pendingRunNotesRef.current.has(restored.id))
                    setRunAutosaveDetail(
                      `Showing the most recent XRP run saved in ${resolved.folder.name}.`,
                    );
                }
                if (
                  retainedRunArchivesRef.current.get(restored.id) === retained
                )
                  retainedRunArchivesRef.current.delete(restored.id);
              })
              .catch((reason: unknown) => {
                retained.error =
                  reason instanceof Error ? reason.message : String(reason);
                if (
                  runDatasetController.latest?.id === restored.id &&
                  !pendingRunNotesRef.current.has(restored.id)
                )
                  setRunAutosaveDetail(
                    `Run archive could not be verified: ${retained.error}`,
                  );
              })
              .finally(() => {
                retained.saving = false;
                refreshPendingRunNotes((revision) => revision + 1);
                retryPendingOfflineShellReload();
              });
            setActiveRunId(null);
            setLatestRun(restored);
            annotationsRef.current = [];
            setAnnotations([]);
            monitorVisualHistory.clearHistory();
            setRunAutosaveDetail(
              "Showing the most recent XRP run; it was not saved again.",
            );
          }
        }
      } else if (event.type === "console") {
        const completedReplay = replayedRunRef.current?.boundary;
        const resetAfterRetainedRun =
          completedReplay?.finishedAtMs !== undefined &&
          event.timestampMs !== undefined &&
          event.timestampMs >= completedReplay.startedAtMs;
        if (
          event.action === "reset" &&
          event.phase === "result" &&
          (event.replayed !== true || resetAfterRetainedRun)
        ) {
          if (event.replayed !== true && target.kind !== "physical")
            finishActiveRun("ready", "Run ended by Reset");
          if (savedRunIdRef.current !== runDatasetController.latest?.id) {
            setWorldHistoryCleared(true);
            setActiveRunWorldBackfill(null);
          }
          telemetryRateSamplesRef.current = [];
          monitorVisualHistory.clearAll();
        }
        if (!projectProviderAvailableRef.current) {
          diagnosticLog.record({
            event: "target.console",
            eventId: event.eventId,
            requestId: event.requestId,
            replayed: event.replayed,
            level:
              event.stream === "stderr" || event.phase === "error"
                ? "error"
                : "info",
            terminal: event.phase === "error" || event.phase === "result",
            message: JSON.stringify({
              target: target.kind,
              stream: event.stream,
              line: event.line,
              action: event.action ?? null,
              phase: event.phase ?? null,
              timestampMs: event.timestampMs ?? null,
              targetTimeMs: event.targetTimeMs ?? null,
            }),
          });
        }
        const entry = {
          id: event.eventId ?? `monitor-target-${nextConsoleId.current++}`,
          stream: event.stream,
          line: event.line,
          ...(event.timestampMs === undefined
            ? {}
            : { timestampMs: event.timestampMs }),
          ...(event.targetTimeMs === undefined
            ? {}
            : { targetTimeMs: event.targetTimeMs }),
          ...("targetClockId" in event &&
          typeof event.targetClockId === "string"
            ? { targetClockId: event.targetClockId }
            : {}),
        };
        const replayedRun = replayedRunRef.current;
        if (
          replayedRun &&
          event.replayed === true &&
          replayedRun.boundary.runId === event.requestId
        ) {
          replayedRun.output.push(entry);
        }
        runDatasetController.addOutput(entry);
      }
    });
    beginTargetCommand();
    targetStateRef.current = "connecting";
    setTargetState("connecting");
    setTargetDetail(`Connecting to ${target.kind} XRP…`);
    telemetryRateSamplesRef.current = [];
    monitorVisualHistory.clearAll();
    currentProjectRef.current = null;
    setProjectProviderAvailable(false);
    let disposed = false;
    const connect = async () => {
      try {
        await target.connect();
      } catch (error: unknown) {
        if (!disposed) {
          const detail = error instanceof Error ? error.message : String(error);
          targetStateRef.current = "error";
          setTargetState("error");
          setTargetDetail(detail);
          diagnosticLog.record({
            event: "target.connect-failed",
            level: "error",
            terminal: true,
            message: `${target.kind} XRP connection failed: ${detail}`,
          });
        }
      } finally {
        finishTargetCommand();
      }
    };
    void connect();
    return () => {
      disposed = true;
      finishActiveRun("disconnected", "Target connection changed");
      runPreflightEpochRef.current += 1;
      unsubscribe();
      for (const timer of runtimeUpdateTimers.current.values()) {
        clearTimeout(timer);
      }
      runtimeUpdateTimers.current.clear();
      monitorVisualHistory.clearAll(false);
      projectProviderAvailableRef.current = false;
      replayedRunRef.current = null;
      target.disconnect();
    };
  }, [
    beginTargetCommand,
    beginRunDataset,
    diagnosticLog,
    finishActiveRun,
    finishTargetCommand,
    monitorVisualHistory,
    publishRuntimeState,
    runDatasetController,
    target,
    targetPreferenceError,
    targetPreferenceReady,
  ]);

  const reset = async () => {
    runPreflightEpochRef.current += 1;
    runStartingRef.current = false;
    setRunStarting(false);
    beginTargetCommand();
    try {
      await target.reset();
    } catch (error: unknown) {
      const detail = error instanceof Error ? error.message : String(error);
      targetStateRef.current = "error";
      setTargetState("error");
      setTargetDetail(detail);
      diagnosticLog.record({
        event: "target.reset-failed",
        level: "error",
        terminal: true,
        message: `${target.kind} XRP reset failed: ${detail}`,
      });
    } finally {
      finishTargetCommand();
    }
  };

  const canRunCurrent =
    targetPreferenceReady &&
    (projectProviderAvailable || autosaveFolder !== null) &&
    (control === null || control.owned) &&
    retainedRunArchivesRef.current.size === 0 &&
    !virtualRuntimePreparing &&
    (targetState === "ready" ||
      (target.kind === "virtual" && targetState === "error"));

  const runOrStop = async () => {
    const stopping =
      runStarting ||
      runDatasetController.isActive ||
      targetState === "running" ||
      targetState === "loading";
    if (!stopping && !canRunCurrent) {
      return;
    }
    const epoch = ++runPreflightEpochRef.current;
    const assertCurrent = () => {
      if (runPreflightEpochRef.current !== epoch)
        throw new DOMException("Run preparation was cancelled.", "AbortError");
    };
    beginTargetCommand();
    try {
      if (stopping) {
        await target.stop();
      } else {
        runStartingRef.current = true;
        setRunStarting(true);
        if (projectProviderAvailable) {
          await target.runCurrent();
        } else {
          const folder = autosaveFolderRef.current;
          const workspace = autosaveWorkspaceRef.current;
          if (!folder) {
            throw new Error(
              "Choose a Working folder and project in the IDE before running.",
            );
          }
          const assertFolderCurrent = () => {
            assertCurrent();
            if (
              autosaveFolderRef.current !== folder ||
              autosaveWorkspaceRef.current !== workspace
            )
              throw new DOMException(
                "The selected Project changed during Run preparation. Run the selected Project again.",
                "AbortError",
              );
          };
          let opened = await readProjectFolderWhenIdle(folder, {
            assertCurrent: assertFolderCurrent,
          });
          assertFolderCurrent();
          if (!opened.project.session) {
            const session = createProjectSession(opened.project, {
              source: "folder",
              baseDigest: opened.contentDigest,
            });
            await saveProjectFolderWithAutosave(
              folder,
              snapshotForProjectSession(session),
              [],
              { assertCurrent: assertFolderCurrent },
            );
            assertFolderCurrent();
            opened = await readProjectFolderWhenIdle(folder, {
              assertCurrent: assertFolderCurrent,
            });
          }
          assertFolderCurrent();
          if (!workspace || !opened.project.session)
            throw new Error(
              "Reconnect this Project in the IDE before running; its saved identity is unavailable.",
            );
          await rememberProjectBinding(opened.project.session.projectId, {
            workspace,
            folder,
          });
          assertFolderCurrent();
          await target.run(
            opened.project,
            monitorProjectId(folder, opened.project.session),
          );
        }
      }
    } catch (error: unknown) {
      if (runPreflightEpochRef.current !== epoch) return;
      const detail = error instanceof Error ? error.message : String(error);
      if (target.kind !== "physical") finishActiveRun("error", detail);
      targetStateRef.current = "error";
      setTargetState("error");
      setTargetDetail(detail);
      diagnosticLog.record({
        event: "target.run-command-failed",
        level: "error",
        terminal: true,
        message: `${target.kind} XRP Run command failed: ${detail}`,
      });
    } finally {
      if (runPreflightEpochRef.current === epoch) {
        runStartingRef.current = false;
        setRunStarting(false);
      }
      finishTargetCommand();
    }
  };

  const changeWorld = async (nextWorldId: string) => {
    finishActiveRun("ready", "Run ended because the world changed");
    clearDisplayedRun();
    beginTargetCommand();
    try {
      await target.setSimulationScenario?.(nextWorldId);
      // Publish the selection only after the shared target acknowledges it.
      // Otherwise another tab can Run while the selector already depicts a
      // world that the target has not applied yet.
      setSelectedWorldId(nextWorldId);
    } catch (error: unknown) {
      const detail = error instanceof Error ? error.message : String(error);
      targetStateRef.current = "error";
      setTargetState("error");
      setTargetDetail(detail);
      diagnosticLog.record({
        event: "world.change-failed",
        level: "error",
        terminal: true,
        message: `World change to ${nextWorldId} failed: ${detail}`,
      });
    } finally {
      finishTargetCommand();
    }
  };

  const reconnectRunAutosaveFolder = async () => {
    if (!rememberedAutosaveFolder) {
      return;
    }
    beginFolderInteraction();
    try {
      const permission = await requestCourseFolderPermission(
        rememberedAutosaveFolder,
      );
      if (permission !== "granted") {
        setRunAutosaveDetail(
          `Folder access was not granted. Run data remains in this browser session.`,
        );
        diagnosticLog.record({
          event: "project-folder.reconnect-denied",
          level: "warning",
          message: `Project folder ${rememberedAutosaveFolder.name} was not reconnected.`,
        });
        return;
      }
      setRunAutosaveDetail(`Opening ${rememberedAutosaveFolder.name}…`);
      refreshFolderRef.current();
      diagnosticLog.record({
        event: "project-folder.reconnected",
        message: `Project folder ${rememberedAutosaveFolder.name} is writable.`,
      });
    } catch (error: unknown) {
      if (!wasCancelled(error)) {
        const detail = error instanceof Error ? error.message : String(error);
        setRunAutosaveDetail(`Folder reconnection failed: ${detail}`);
        diagnosticLog.record({
          event: "project-folder.reconnect-failed",
          level: "error",
          terminal: true,
          message: `Project folder reconnection failed: ${detail}`,
        });
      }
    } finally {
      finishFolderInteraction();
    }
  };

  const exportRecording = async () => {
    if (!latestRun) return;
    const run = latestRun;
    const runFolder =
      latestRunDestinationRef.current ?? resolveRunFolder(run.project);
    exportActiveRef.current = true;
    setExportState("telemetry-csv");
    setExportDetail("Locating the run's Project folder…");
    try {
      const fileName = timestampedName("xrp-telemetry", "csv");
      const destination = await prepareExportDestination(
        (await runFolder).folder,
        fileName,
        "text/csv",
      );
      if (!destination) {
        setExportDetail("Export canceled.");
        diagnosticLog.record({
          event: "export.cancelled",
          message: "Telemetry and notes CSV export was cancelled.",
        });
        return;
      }
      setExportDetail(`Saving CSV to ${destination.description}…`);
      const csv = monitorRunToCsv(run.recording, run.annotations);
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
      await destination.save(blob);
      setExportDetail(exportCompletionDetail(destination));
      diagnosticLog.record({
        event: `export.${destination.completion}`,
        terminal: true,
        message: `Telemetry and notes CSV: ${exportCompletionDetail(destination)}`,
      });
    } catch (error: unknown) {
      const detail = error instanceof Error ? error.message : String(error);
      setExportDetail(detail);
      diagnosticLog.record({
        event: "export.failed",
        level: "error",
        terminal: true,
        message: `Telemetry and notes CSV export failed: ${detail}`,
      });
    } finally {
      exportActiveRef.current = false;
      setExportState("idle");
      retryPendingOfflineShellReload();
    }
  };

  const commitRuntimeParameter = async (
    name: string,
    nextValue: RuntimeParameterValue,
    revision: number,
  ) => {
    setRuntimeUpdateError("");
    beginTargetCommand();
    try {
      await target.setRuntimeParameter(name, nextValue);
      if (runtimeUpdateRevisions.current.get(name) !== revision) return;
      setRuntimeDrafts((current) => {
        const next = { ...current };
        delete next[name];
        return next;
      });
    } catch (error: unknown) {
      if (runtimeUpdateRevisions.current.get(name) !== revision) return;
      const detail = error instanceof Error ? error.message : String(error);
      setRuntimeUpdateError(detail);
      diagnosticLog.record({
        event: "runtime-parameter.update-failed",
        level: "error",
        terminal: true,
        message: `Live control ${name} could not be updated: ${detail}`,
      });
      setRuntimeDrafts((current) => {
        const next = { ...current };
        delete next[name];
        return next;
      });
    } finally {
      finishTargetCommand();
    }
  };

  const setRuntimeParameter = (
    name: string,
    nextValue: RuntimeParameterValue,
    debounce = false,
  ) => {
    const revision = ++nextRuntimeUpdateRevision.current;
    runtimeUpdateRevisions.current.set(name, revision);
    setRuntimeDrafts((current) => ({ ...current, [name]: nextValue }));
    const previous = runtimeUpdateTimers.current.get(name);
    if (previous) {
      clearTimeout(previous);
    }
    if (!debounce) {
      runtimeUpdateTimers.current.delete(name);
      void commitRuntimeParameter(name, nextValue, revision);
      return;
    }
    runtimeUpdateTimers.current.set(
      name,
      setTimeout(() => {
        runtimeUpdateTimers.current.delete(name);
        void commitRuntimeParameter(name, nextValue, revision);
      }, 140),
    );
  };

  const viewingSavedRun = Boolean(
    savedRunId && latestRun?.id === savedRunId && !activeRunId,
  );
  const displayedProgramPlots = useMemo(
    () =>
      !activeRunId &&
      latestRun &&
      (viewingSavedRun || availableProgramPlots.length === 0)
        ? [
            ...new Map(
              latestRun.recording.samples.flatMap(
                (sample) =>
                  sample.plotValues?.map(
                    (plot) => [plot.name, plot] as const,
                  ) ?? [],
              ),
            ).values(),
          ]
        : availableProgramPlots,
    [activeRunId, viewingSavedRun, latestRun, availableProgramPlots],
  );
  const programPlotDefinitions = useMemo(
    () => displayedProgramPlots.map(runtimePlotDefinition),
    [displayedProgramPlots],
  );
  const visiblePlots: SignalPlotDefinition[] = [
    ...SIGNAL_PLOTS.filter((plot) => monitorSettings.plots[plot.id]).map(
      (plot) =>
        withTargetSeriesVisibility(plot, monitorSettings.showTargetValues),
    ),
    ...programPlotDefinitions.filter(
      (plot) => programPlotVisibility[plot.id.replace(/^program:/, "")] ?? true,
    ),
  ];

  const addAnnotation = (sampleAtNote: TelemetrySample, label: string) => {
    const noteRunId =
      runDatasetController.activeId ?? runDatasetController.latest?.id;
    if (
      pendingRunNotesRef.current.size >= 64 &&
      noteRunId &&
      !pendingRunNotesRef.current.has(noteRunId)
    ) {
      throw new Error(
        "Download and discard retained unsaved notes before adding notes to another run.",
      );
    }
    const annotation = createMonitorAnnotation(
      [sampleAtNote],
      sampleAtNote.tMs,
      label,
    );
    if (!annotation) return;
    const updatedRun = runDatasetController.addAnnotation(annotation);
    annotationsRef.current = [...runDatasetController.currentAnnotations()];
    setAnnotations(annotationsRef.current);
    if (updatedRun) {
      setLatestRun(updatedRun);
      updateSavedRunAnnotations(updatedRun);
    }
    setAnnotationsVisible(true);
  };

  const displayedRunSamples = activeRunId
    ? plotSamples
    : (latestRun?.recording.samples ?? plotSamples);
  const plotsWithChangedUnits = useMemo(
    () =>
      displayedProgramPlots
        .filter((plot) =>
          displayedRunSamples.some((sample) =>
            sample.plotValues?.some(
              (value) =>
                value.name === plot.name &&
                (value.unit ?? "") !== (plot.unit ?? ""),
            ),
          ),
        )
        .map((plot) => plot.label),
    [displayedProgramPlots, displayedRunSamples],
  );
  const displayedRunHistorySource = activeRunId ?? latestRun?.recording ?? null;
  const requestAnnotation = (selected: TelemetrySample) => {
    const runId =
      runDatasetController.activeId ?? runDatasetController.latest?.id;
    if (!runId) return;
    const alternatives = displayedRunSamples.filter(
      (candidate) =>
        candidate.source === selected.source && candidate.tMs === selected.tMs,
    );
    setNoteRequest({
      runId,
      sample: selected,
      alternatives: alternatives.includes(selected)
        ? alternatives
        : [selected, ...alternatives],
    });
  };
  const reviewAnnotation = (note: MonitorAnnotation) => {
    const runId =
      runDatasetController.activeId ?? runDatasetController.latest?.id;
    if (!runId) return;
    const selected = displayedRunSamples.find((candidate) =>
      annotationMatchesSample(note, candidate),
    ) ?? {
      ...centeredWorldPreview(note.source),
      ...note,
      leftWheelSpeedMmS: Number.NaN,
      rightWheelSpeedMmS: Number.NaN,
    };
    setNoteRequest({
      runId,
      sample: selected,
      alternatives: [selected],
      note,
      number:
        annotations.findIndex((candidate) => candidate.id === note.id) + 1,
    });
  };
  const saveNoteRequest = (
    selected: TelemetrySample,
    label: string,
    request: NoteRequest,
  ) => {
    const currentRunId =
      runDatasetController.activeId ?? runDatasetController.latest?.id;
    if (request.runId !== currentRunId)
      throw new Error(
        "The displayed run changed. Copy this note before closing; it has not been attached to the new run.",
      );
    if (request.note) {
      const current = runDatasetController
        .currentAnnotations()
        .find((note) => note.id === request.note!.id);
      if (
        !current ||
        current.label !== request.note.label ||
        current.revision !== request.note.revision
      )
        throw new Error(
          "This note changed while the editor was open. Copy your text and reopen the note before saving.",
        );
      const updated = runDatasetController.updateAnnotation(
        request.note.id,
        label,
      );
      annotationsRef.current = [...runDatasetController.currentAnnotations()];
      setAnnotations(annotationsRef.current);
      if (updated) {
        setLatestRun(updated);
        updateSavedRunAnnotations(updated);
      }
    } else addAnnotation(selected, label);
    setNoteFeedback(
      `${request.note ? "Note updated" : "Note added"}. ${runDatasetController.isActive ? "It will save with this run." : "Check the run save status."}`,
    );
  };
  const noteEditorDraftChanged = useCallback(
    (active: boolean) => setAnnotationDraftActive("note-editor", active),
    [setAnnotationDraftActive],
  );
  const stopFromNoteEditor = async () => {
    runPreflightEpochRef.current += 1;
    runStartingRef.current = false;
    setRunStarting(false);
    beginTargetCommand();
    try {
      await target.stop();
    } finally {
      finishTargetCommand();
    }
  };

  const exportPlots = async (format: "svg" | "png") => {
    if (
      activeRunId !== null ||
      latestRun === null ||
      visiblePlots.length === 0 ||
      latestRun.recording.samples.length === 0
    )
      return;
    const run = latestRun;
    const runFolder =
      latestRunDestinationRef.current ?? resolveRunFolder(run.project);
    const nextState = format === "svg" ? "plots-svg" : "plots-png";
    exportActiveRef.current = true;
    setExportState(nextState);
    setExportDetail("Locating the run's Project folder…");
    try {
      const fileName = timestampedName("xrp-plots", format);
      const destination = await prepareExportDestination(
        (await runFolder).folder,
        fileName,
        format === "svg" ? "image/svg+xml" : "image/png",
      );
      if (!destination) {
        setExportDetail("Export canceled.");
        diagnosticLog.record({
          event: "export.cancelled",
          message: `${format.toUpperCase()} plot export was cancelled.`,
        });
        return;
      }
      setExportDetail(`Preparing ${format.toUpperCase()}…`);
      const { createSignalPlotsSvg, svgToPng } = await loadMonitorExport();
      const svg = createSignalPlotsSvg(
        run.recording.samples,
        visiblePlots,
        monitorSettings.timeWindowS,
        annotationsVisible ? annotations : [],
      );
      let blob: Blob;
      if (format === "svg") {
        blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
      } else {
        blob = await svgToPng(svg);
      }
      setExportDetail(
        `Saving ${format.toUpperCase()} to ${destination.description}…`,
      );
      await destination.save(blob);
      setExportDetail(exportCompletionDetail(destination));
      diagnosticLog.record({
        event: `export.${destination.completion}`,
        terminal: true,
        message: `${format.toUpperCase()} plots: ${exportCompletionDetail(destination)}`,
      });
    } catch (error: unknown) {
      const detail = error instanceof Error ? error.message : String(error);
      setExportDetail(detail);
      diagnosticLog.record({
        event: "export.failed",
        level: "error",
        terminal: true,
        message: `${format.toUpperCase()} plot export failed: ${detail}`,
      });
    } finally {
      exportActiveRef.current = false;
      setExportState("idle");
      retryPendingOfflineShellReload();
    }
  };

  const exportWorldReplay = async () => {
    if (!latestRun) return;
    const run = latestRun;
    const runFolder =
      latestRunDestinationRef.current ?? resolveRunFolder(run.project);
    exportActiveRef.current = true;
    setExportState("world-webm");
    setExportDetail("Locating the run's Project folder…");
    try {
      const fileName = timestampedName("xrp-world-animation", "webm");
      const destination = await prepareExportDestination(
        (await runFolder).folder,
        fileName,
        "video/webm",
      );
      if (!destination) {
        setExportDetail("Export canceled.");
        diagnosticLog.record({
          event: "export.cancelled",
          message: "World animation export was cancelled.",
        });
        return;
      }
      setExportDetail("Preparing world animation…");
      const { createWorldReplayWebm } = await loadMonitorExport();
      let shownProgress = -1;
      const blob = await createWorldReplayWebm({
        samples: run.recording.samples,
        annotations: annotationsVisible ? run.annotations : [],
        world: run.world,
        onProgress: (fraction) => {
          const progress = Math.floor(fraction * 100);
          if (progress !== shownProgress) {
            shownProgress = progress;
            setExportDetail(`Creating world animation · ${progress}%`);
          }
        },
      });
      setExportDetail(`Saving world animation to ${destination.description}…`);
      await destination.save(blob);
      setExportDetail(exportCompletionDetail(destination));
      diagnosticLog.record({
        event: `export.${destination.completion}`,
        terminal: true,
        message: `World animation: ${exportCompletionDetail(destination)}`,
      });
    } catch (error: unknown) {
      const detail = error instanceof Error ? error.message : String(error);
      setExportDetail(detail);
      diagnosticLog.record({
        event: "export.failed",
        level: "error",
        terminal: true,
        message: `World animation export failed: ${detail}`,
      });
    } finally {
      exportActiveRef.current = false;
      setExportState("idle");
      retryPendingOfflineShellReload();
    }
  };

  const setPlotVisible = (id: SignalPlotId, visible: boolean) => {
    setMonitorSettings((current) => ({
      ...current,
      plots: { ...current.plots, [id]: visible },
    }));
  };

  const setProgramPlotVisible = (name: string, visible: boolean) => {
    setProgramPlotVisibility((current) => ({ ...current, [name]: visible }));
  };

  const setLayoutValue = (
    key: keyof MonitorSettings["layout"],
    nextValue: number,
  ) => {
    setMonitorSettings((current) => ({
      ...current,
      layout: { ...current.layout, [key]: nextValue },
    }));
  };

  const layoutStyle = {
    "--monitor-top-height": `${monitorSettings.layout.topHeightPercent}%`,
  } as CSSProperties;
  const topRegionStyle = {
    "--monitor-primary-width": `${monitorSettings.layout.worldWidthPercent}%`,
  } as CSSProperties;
  const isRunning =
    runStarting ||
    activeRunId !== null ||
    targetState === "running" ||
    targetState === "loading";
  targetStateRef.current = targetState;
  runStartingRef.current = runStarting;

  useEffect(() => {
    const beforeUnload = (event: BeforeUnloadEvent) => {
      const needsProtection =
        runStartingRef.current ||
        runDatasetController.isActive ||
        isActiveRunState(targetStateRef.current) ||
        exportActiveRef.current ||
        runArchiveCountRef.current > 0 ||
        retainedRunArchivesRef.current.size > 0 ||
        annotationDraftIdsRef.current.size > 0 ||
        pendingRunNotesRef.current.size > 0 ||
        (runDatasetController.latest && !latestRunFolderRef.current);
      if (runStartingRef.current) {
        // A folder read may precede target.run(), so cancel that local work too.
        runPreflightEpochRef.current += 1;
        runStartingRef.current = false;
        setRunStarting(false);
        setTargetDetail("Run preparation cancelled. Use Run to start again.");
      }
      if (!needsProtection) return;
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", beforeUnload);
    return () => window.removeEventListener("beforeunload", beforeUnload);
  }, [runDatasetController]);

  useEffect(
    () =>
      registerOfflineShellBeforeReload(async () => {
        const activity = () => ({
          targetCommandActive:
            targetCommandCountRef.current > 0 ||
            runtimeUpdateTimers.current.size > 0,
          runActive:
            runStartingRef.current ||
            runDatasetController.isActive ||
            isActiveRunState(targetStateRef.current),
          exportActive: exportActiveRef.current,
          recordingActive: runDatasetController.isActive,
          retainedRecording: runDatasetController.latest !== null,
          retainedAnnotations:
            annotationsRef.current.length > 0 ||
            pendingRunNotesRef.current.size > 0,
          annotationDraftActive: annotationDraftIdsRef.current.size > 0,
          folderInteractionActive: folderInteractionCountRef.current > 0,
          saveActive:
            runArchiveCountRef.current > 0 ||
            retainedRunArchivesRef.current.size > 0,
        });
        if (!monitorReloadIsSafe(activity())) return false;
        await runArchiveQueue.current;
        return monitorReloadIsSafe(activity());
      }),
    [runDatasetController],
  );

  useEffect(() => {
    if (
      monitorReloadIsSafe({
        targetCommandActive:
          targetCommandCountRef.current > 0 ||
          runtimeUpdateTimers.current.size > 0,
        runActive: runStarting || isRunning,
        exportActive: exportState !== "idle",
        recordingActive: activeRunId !== null,
        retainedRecording: latestRun !== null,
        retainedAnnotations:
          annotations.length > 0 || pendingRunNotesRef.current.size > 0,
        annotationDraftActive: annotationDraftIdsRef.current.size > 0,
        folderInteractionActive: folderInteractionCountRef.current > 0,
        saveActive:
          runArchiveCountRef.current > 0 ||
          retainedRunArchivesRef.current.size > 0,
      })
    ) {
      retryPendingOfflineShellReload();
    }
  }, [
    exportState,
    folderInteractionRevision,
    isRunning,
    annotations.length,
    activeRunId,
    latestRun,
    runStarting,
  ]);
  const worldPreviewSample = useMemo(
    () => centeredWorldPreview(target.kind),
    [target.kind],
  );
  const worldSample = viewingSavedRun
    ? (latestRun?.recording.samples.at(-1) ?? worldPreviewSample)
    : sample?.poseAvailable
      ? sample
      : worldPreviewSample;
  const displayedUltrasoundMm = normalizeUltrasoundRangeMm(sample?.rangeMm);
  const telemetryRateHz = recentTelemetryRateHz(
    telemetryRateSamplesRef.current,
  );
  const completedRunDurationS = latestRun?.recording.samples.length
    ? Math.max(
        0,
        (latestRun.recording.samples.at(-1)!.tMs -
          latestRun.recording.samples[0]!.tMs) /
          1_000,
      )
    : 0;
  const completedPoseSamples =
    latestRun?.recording.samples.filter((recorded) => recorded.poseAvailable)
      .length ?? 0;
  const replayExportUnavailable =
    exportState !== "idle"
      ? "The current export is still being created."
      : activeRunId
        ? "Wait for the current run to finish before exporting its animation."
        : completedPoseSamples < 2
          ? "Run a program to create an animation."
          : !webmExportSupported()
            ? "WebM animation export is unavailable in this browser."
            : "";
  const groundTruthPose =
    sample &&
    (sample.groundTruthPoseAvailable ??
      (sample.source === "virtual" && sample.poseAvailable))
      ? {
          x: sample.groundTruthXmm ?? sample.xMm,
          y: sample.groundTruthYmm ?? sample.yMm,
          heading: sample.groundTruthHeadingRad ?? sample.headingRad,
        }
      : null;
  const estimatedPose =
    sample &&
    (sample.estimatedPoseAvailable ??
      (sample.source === "physical" && sample.poseAvailable))
      ? {
          x: sample.estimatedXmm ?? sample.xMm,
          y: sample.estimatedYmm ?? sample.yMm,
          heading: sample.estimatedHeadingRad ?? sample.headingRad,
        }
      : null;
  const projectStatusLabel =
    currentProject?.name ??
    (autosaveFolder
      ? `${autosaveFolder.name} loads on Run`
      : "No project selected");
  const physicalConnectionFailed =
    target.kind === "physical" && targetState === "error";
  const retainedArchiveCount = retainedRunArchivesRef.current.size;
  const retainedArchiveFailed = [
    ...retainedRunArchivesRef.current.values(),
  ].some((retained) => retained.error && !retained.saving);
  const showRecovery =
    physicalConnectionFailed ||
    Boolean(recordingAdmissionDetail) ||
    retainedArchiveCount > 0 ||
    Boolean(folderReadError) ||
    Boolean(control && !control.owned) ||
    (!autosaveFolder && !projectProviderAvailable);

  return (
    <div
      className={`app-shell ${embeddedApplication ? "embedded-app" : ""} ${showRecovery ? "monitor-recovery-visible" : ""}`}
      data-monitor-surface={monitorSurfaceActive ? "active" : "paused"}
    >
      <header className="app-header">
        <div className="brand" aria-label="UCSBXRP">
          <span className="brand-mark">UCSB</span>
          <span className="brand-xrp">XRP</span>
        </div>
        <AppNavigation active="monitor" />
        <div className="toolbar">
          <button
            aria-label={isRunning ? "Stop" : "Run"}
            className={`command-run-button monitor-run-button header-icon-button ${isRunning ? "danger-button" : "primary-button"}`}
            disabled={!isRunning && !canRunCurrent}
            onClick={runOrStop}
            title={
              isRunning
                ? "Stop the running program."
                : retainedRunArchivesRef.current.size > 0
                  ? "Wait for this run to finish saving, or recover retained runs before starting another run."
                  : virtualRuntimePreparing
                    ? "Chrome is preparing the Virtual XRP. This page refreshes once automatically, then Run becomes available."
                    : runStarting
                      ? "Compiling the default project before Run."
                      : !autosaveFolder && !projectProviderAvailable
                        ? rememberedAutosaveFolder
                          ? `Reconnect ${rememberedAutosaveFolder.name} before running.`
                          : "Choose a Working folder and create or open a project in the IDE before running."
                        : currentProject?.stale
                          ? `Compile and run the current IDE project: ${currentProject.name}.`
                          : currentProject
                            ? `Run ${currentProject.name} (${currentProject.entrypoint}, ${currentProject.revision.slice(0, 8)}).`
                            : autosaveFolder
                              ? `Compile and run ${autosaveFolder.name}.`
                              : "Open a project in the IDE before Run."
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
              targetState === "disconnected" ||
              targetState === "connecting" ||
              (target.kind === "physical" && targetState === "error")
            }
            onClick={reset}
            title="Stop the program and restore the selected XRP to its initial course state."
          >
            <ResetIcon />
            <span className="visually-hidden">Reset</span>
          </button>
          <SplitWorkspaceLink />
        </div>
        <div className="header-statuses">
          {runStarting ||
          targetState === "connecting" ||
          targetState === "loading" ||
          targetState === "error" ? (
            <OperationStatus
              pending={targetState !== "error"}
              phase={
                runStarting && targetState === "ready"
                  ? "Preparing the project for Run. Stop cancels this request."
                  : targetDetail
              }
            />
          ) : null}
          <div
            aria-live="polite"
            className="connection-pill"
            data-testid="target-status"
            role="status"
            title={targetDetail}
          >
            <span aria-hidden="true" className={`status-dot ${targetState}`} />
            <span>
              {target.kind === "virtual" ? "Virtual XRP" : "Physical XRP"} ·{" "}
              {targetState} · {projectStatusLabel}
            </span>
          </div>
        </div>
      </header>

      {showRecovery ? (
        <div className="monitor-notices">
          {recordingAdmissionDetail || retainedArchiveCount > 0 ? (
            <section className="monitor-connection-recovery monitor-run-recovery">
              <OperationStatus
                pending={!recordingAdmissionDetail && !retainedArchiveFailed}
                phase={
                  recordingAdmissionDetail ||
                  (retainedArchiveFailed
                    ? `${retainedArchiveCount} retained run${retainedArchiveCount === 1 ? " needs" : "s need"} recovery. Retry saving or download the retained data before starting another run.`
                    : `Saving or verifying ${retainedArchiveCount} retained run${retainedArchiveCount === 1 ? "" : "s"}… Run becomes available when saving finishes. Exports remain available.`)
                }
              />
              <button onClick={() => setControlsOpen(true)} type="button">
                Review run data
              </button>
            </section>
          ) : null}
          {folderReadError ? (
            <section className="monitor-connection-recovery" role="status">
              <span>{folderReadError}</span>
              <button onClick={() => refreshFolderRef.current()} type="button">
                Refresh Project folder
              </button>
              <a href="../workspace/?mode=ide" target="_top">
                Open IDE
              </a>
            </section>
          ) : null}
          {control && !control.owned ? (
            <section className="monitor-connection-recovery" role="status">
              <span>{control.detail}</span>
              {control.canTakeover && target.claimControl ? (
                <button
                  onClick={() =>
                    void target.claimControl!().catch((error: unknown) =>
                      setTargetDetail(String(error)),
                    )
                  }
                >
                  Take control of this XRP
                </button>
              ) : null}
            </section>
          ) : null}
          {!autosaveFolder && !projectProviderAvailable ? (
            <section className="monitor-connection-recovery" role="status">
              <span>
                Create or open a Project to run a program and save its data.
              </span>
              <a href="../workspace/?mode=ide" target="_top">
                Open IDE
              </a>
            </section>
          ) : null}
          {physicalConnectionFailed ? (
            <section className="monitor-connection-recovery" role="alert">
              <div>
                <strong>Physical XRP connection lost</strong>
                <span>{targetDetail}</span>
              </div>
              <button
                className="primary-button"
                onClick={() => setConnectionAttempt((attempt) => attempt + 1)}
                type="button"
              >
                Reconnect XRP
              </button>
              <a href="../commission/" target="_top">
                Set up or repair XRP
              </a>
            </section>
          ) : null}
        </div>
      ) : null}

      <div
        className={`monitor-workspace ${controlsOpen ? "controls-open" : "controls-collapsed"}`}
      >
        {controlsOpen ? (
          <aside
            aria-label="Monitor controls"
            className="monitor-controls"
            data-testid="monitor-controls"
            ref={controlsRef}
          >
            <div className="monitor-controls-panel">
              <div className="monitor-controls-cap">
                <strong>Controls</strong>
                <button
                  aria-label="Collapse monitor controls"
                  className="monitor-controls-collapse"
                  onClick={() => setControlsOpen(false)}
                  title="Collapse plot, run-data, and export controls."
                >
                  ‹
                </button>
              </div>
              <div className="monitor-controls-scroll">
                {physicalConnectionFailed ? (
                  <div className="target-recovery" role="alert">
                    <strong>XRP not reachable</strong>
                    <p>
                      {targetPreference.physicalConnection === "access_point"
                        ? `Connect this computer to ${targetPreference.lastObservedNetwork?.ssid ?? "the XRP hotspot"}, then select Reconnect.`
                        : `Connect this computer and the XRP to ${targetPreference.lastObservedNetwork?.ssid ?? "the same Wi-Fi network"}, then select Reconnect.`}
                    </p>
                    <a href="../commission/" target="_top">
                      Set up or repair XRP
                    </a>
                  </div>
                ) : null}
                <section
                  aria-labelledby="signal-controls-title"
                  className="monitor-control-group signal-control-group"
                >
                  <div className="signal-controls-heading">
                    <h2 id="signal-controls-title">Plot signals</h2>
                    <button
                      disabled={activeRunId !== null || latestRun === null}
                      onClick={() => clearDisplayedRun()}
                      title="Clear the completed run, plots, and notes. Saved files are not deleted."
                    >
                      Clear run
                    </button>
                  </div>
                  <label className="monitor-field time-window-field">
                    <span>Time window</span>
                    <span className="time-window-value">
                      {monitorSettings.timeWindowS} s
                    </span>
                    <input
                      aria-label="Strip chart time window"
                      max="30"
                      min="2"
                      onChange={(event) =>
                        setMonitorSettings((current) => ({
                          ...current,
                          timeWindowS: Number(event.target.value),
                        }))
                      }
                      step="1"
                      title="Set the amount of recent telemetry visible in each plot."
                      type="range"
                      value={monitorSettings.timeWindowS}
                    />
                  </label>
                  <label
                    className="check-row target-values-choice"
                    title="Show requested values alongside measured signals where a plot defines a target. Drive command is already an applied output, not a target."
                  >
                    <input
                      checked={monitorSettings.showTargetValues}
                      onChange={(event) =>
                        setMonitorSettings((current) => ({
                          ...current,
                          showTargetValues: event.target.checked,
                        }))
                      }
                      type="checkbox"
                    />
                    <span>Show target values</span>
                  </label>
                  <div className="signal-choices">
                    {SIGNAL_PLOTS.map((plot) => (
                      <label
                        className="check-row"
                        key={plot.id}
                        title={plot.description}
                      >
                        <input
                          checked={monitorSettings.plots[plot.id]}
                          onChange={(event) =>
                            setPlotVisible(plot.id, event.target.checked)
                          }
                          type="checkbox"
                        />
                        <span>{plot.label}</span>
                        <small>{plot.unit}</small>
                      </label>
                    ))}
                    {displayedProgramPlots.map((plot) => (
                      <label
                        className="check-row program-signal-choice"
                        key={plot.name}
                        title={`${plot.label} is published by this program.`}
                      >
                        <input
                          checked={programPlotVisibility[plot.name] ?? true}
                          onChange={(event) =>
                            setProgramPlotVisible(
                              plot.name,
                              event.target.checked,
                            )
                          }
                          type="checkbox"
                        />
                        <span>{plot.label}</span>
                        <small>{plot.unit ?? ""}</small>
                      </label>
                    ))}
                  </div>
                </section>

                <section
                  aria-labelledby="recording-controls-title"
                  className="monitor-control-group recording-control-group"
                >
                  <h2 id="recording-controls-title">Run data</h2>
                  <div
                    className="recording-summary"
                    role="status"
                    title="Run collects telemetry automatically and keeps the most recently completed run ready to inspect or export."
                  >
                    <span data-testid="recording-count">
                      {activeRunId
                        ? `Current run · ${runDatasetController.sampleCount.toLocaleString()} samples`
                        : latestRun
                          ? `${latestRun.project?.name ?? "Last run"} · ${latestRun.recording.samples.length.toLocaleString()} samples · ${completedRunDurationS.toFixed(1)} s`
                          : "Run a program to collect data."}
                    </span>
                    <span data-testid="run-autosave-status">
                      {runAutosaveDetail}
                    </span>
                  </div>
                  {autosaveFolder && autosaveProjectId ? (
                    <SavedRunPicker
                      key={autosaveProjectId}
                      folder={autosaveFolder}
                      projectId={autosaveProjectId}
                      disabled={
                        isRunning ||
                        runStarting ||
                        activeRunId !== null ||
                        exportState !== "idle" ||
                        pendingRunNotesRef.current.size > 0
                      }
                      onOpen={openSavedRun}
                    />
                  ) : null}
                  {[...retainedRunArchivesRef.current.values()]
                    .filter((retained) => retained.error)
                    .map((retained) => (
                      <div className="recording-actions" key={retained.run.id}>
                        <span>
                          {retained.saving
                            ? "Retrying run save"
                            : "Unsaved run"}
                          : {retained.run.project?.name ?? retained.run.id}.{" "}
                          {new Date(
                            retained.run.startedAt,
                          ).toLocaleTimeString()}{" "}
                          ·{" "}
                          {retained.run.recording.samples.length.toLocaleString()}{" "}
                          samples. {retained.error}
                        </span>
                        <button
                          disabled={retained.saving}
                          onClick={() => retryRunArchive(retained)}
                        >
                          Retry run save
                        </button>
                        <button
                          onClick={() =>
                            downloadBlob(
                              new Blob(
                                [
                                  JSON.stringify(
                                    {
                                      schemaVersion: 1,
                                      kind: "ucsb-xrp-run-recovery",
                                      runs: [archiveForRun(retained.run)],
                                    },
                                    null,
                                    2,
                                  ) + "\n",
                                ],
                                { type: "application/json" },
                              ),
                              `UCSBXRP-run-${retained.run.id}.json`,
                            )
                          }
                        >
                          Download retained run
                        </button>
                        {discardRunId === retained.run.id ? (
                          <>
                            <span role="alert">
                              Discard the retained run from{" "}
                              {retained.run.project?.name ?? "this Project"},
                              started{" "}
                              {new Date(
                                retained.run.startedAt,
                              ).toLocaleString()}{" "}
                              ({retained.run.id})? This removes this page's
                              recovery copy. A download request does not confirm
                              that a recovery file was saved.
                            </span>
                            <button
                              autoFocus
                              onClick={() => setDiscardRunId(null)}
                            >
                              Keep recovery
                            </button>
                            <button
                              disabled={retained.saving}
                              onClick={() => {
                                retainedRunArchivesRef.current.delete(
                                  retained.run.id,
                                );
                                setDiscardRunId(null);
                                refreshPendingRunNotes(
                                  (revision) => revision + 1,
                                );
                                retryPendingOfflineShellReload();
                              }}
                            >
                              Discard this run
                            </button>
                          </>
                        ) : (
                          <button
                            disabled={retained.saving}
                            onClick={() => setDiscardRunId(retained.run.id)}
                            title="Review which retained run will be discarded before removing its recovery copy."
                          >
                            Discard retained run
                          </button>
                        )}
                      </div>
                    ))}
                  {[...pendingRunNotesRef.current.values()].map((pending) => (
                    <div className="recording-actions" key={pending.runId}>
                      <span>
                        Unsaved notes: {pending.project?.name ?? pending.runId}
                      </span>
                      <button
                        onClick={() =>
                          downloadBlob(
                            new Blob(
                              [JSON.stringify(pending, null, 2) + "\n"],
                              { type: "application/json" },
                            ),
                            `UCSBXRP-notes-${pending.runId}.json`,
                          )
                        }
                      >
                        Download retained notes
                      </button>
                      <button
                        onClick={() => {
                          pendingRunNotesRef.current.delete(pending.runId);
                          refreshPendingRunNotes((revision) => revision + 1);
                          retryPendingOfflineShellReload();
                        }}
                      >
                        Discard retained notes
                      </button>
                    </div>
                  ))}
                  {!autosaveFolder && rememberedAutosaveFolder ? (
                    <div className="recording-actions">
                      <button
                        onClick={reconnectRunAutosaveFolder}
                        title={`Restore write access to ${rememberedAutosaveFolder.name}.`}
                      >
                        Reconnect project
                      </button>
                    </div>
                  ) : !autosaveFolder ? (
                    <div className="recording-actions">
                      <a
                        className="monitor-project-link"
                        href="../workspace/?mode=ide"
                        title="Open the IDE to choose a Working folder and create or open a Project."
                      >
                        Open a Project in the IDE
                      </a>
                    </div>
                  ) : null}
                  <MonitorNotes
                    annotations={annotations}
                    canAdd={Boolean(
                      (activeRunId || latestRun) && displayedRunSamples.length,
                    )}
                    visible={annotationsVisible}
                    onAdd={() => {
                      const selected = displayedRunSamples.at(-1);
                      if (selected) requestAnnotation(selected);
                    }}
                    onEdit={reviewAnnotation}
                    onToggle={() =>
                      setAnnotationsVisible((visible) => !visible)
                    }
                    feedback={noteFeedback}
                  />
                  <div className="export-section">
                    <h3>Export</h3>
                    {latestRun?.recording.samples[0]?.source === "virtual" ? (
                      <p className="annotation-hint">
                        Virtual updates may share a timestamp. CSV
                        observation_seq preserves their order.
                      </p>
                    ) : null}
                    <div
                      className="export-actions"
                      aria-label="Export data and views"
                    >
                      <button
                        disabled={exportState !== "idle" || latestRun === null}
                        onClick={() => void exportRecording()}
                        title="Save telemetry and any notes from the completed run as one unit-labeled CSV file."
                      >
                        Export run data as CSV
                      </button>
                      <button
                        disabled={
                          exportState !== "idle" ||
                          activeRunId !== null ||
                          latestRun === null ||
                          latestRun.recording.samples.length === 0 ||
                          visiblePlots.length === 0
                        }
                        onClick={() => void exportPlots("svg")}
                        title="Save every visible strip plot as one editable vector graphic."
                      >
                        Export plots as SVG
                      </button>
                      <button
                        disabled={
                          exportState !== "idle" ||
                          activeRunId !== null ||
                          latestRun === null ||
                          latestRun.recording.samples.length === 0 ||
                          visiblePlots.length === 0
                        }
                        onClick={() => void exportPlots("png")}
                        title="Save every visible strip plot as one high-resolution PNG image."
                      >
                        Export plots as PNG
                      </button>
                      <button
                        aria-describedby="world-replay-export-hint"
                        disabled={Boolean(replayExportUnavailable)}
                        onClick={() => void exportWorldReplay()}
                        title="Create a WebM animation from the completed run. Long runs are accelerated to at most 20 seconds."
                      >
                        Export world animation as WebM
                      </button>
                    </div>
                    <span className="export-hint" id="world-replay-export-hint">
                      {replayExportUnavailable ||
                        "Creates a video from the completed run; it does not rerun the robot."}
                    </span>
                  </div>
                  {exportDetail ? (
                    <span className="export-detail" role="status">
                      {exportDetail}
                    </span>
                  ) : null}
                </section>
              </div>
            </div>
          </aside>
        ) : (
          <button
            aria-label="Open monitor controls"
            className="monitor-controls-restore"
            onClick={() => setControlsOpen(true)}
            title="Open plot, run-data, and export controls."
            type="button"
          >
            <span aria-hidden="true">›</span>
          </button>
        )}

        <main
          className={`dashboard-grid ${plotsOpen ? "plots-open" : "plots-collapsed"}`}
          style={layoutStyle}
        >
          <div
            className={`dashboard-region top-region ${liveSidebarOpen ? "live-sidebar-open" : "live-sidebar-collapsed"}`}
            style={topRegionStyle}
          >
            <section
              className={`world-panel dashboard-pane ${viewingSavedRun ? "saved-run-world" : ""}`}
            >
              {viewingSavedRun && latestRun ? (
                <div className="saved-run-banner" role="status">
                  <span>
                    Saved trial ·{" "}
                    {new Date(latestRun.startedAt).toLocaleString()} ·{" "}
                    {latestRun.project?.name}. World and plots show this trial;
                    Live telemetry shows the current XRP.
                  </span>
                  <button
                    disabled={
                      pendingRunNotesRef.current.size > 0 ||
                      runArchiveCountRef.current > 0
                    }
                    onClick={clearDisplayedRun}
                  >
                    Return to current XRP
                  </button>
                </div>
              ) : null}
              <WorldView
                active={monitorSurfaceActive}
                annotations={worldHistoryCleared ? [] : annotations}
                catalog={
                  viewingSavedRun && latestRun
                    ? {
                        defaultWorldId: latestRun.worldId,
                        worlds: [latestRun.world],
                      }
                    : worldCatalog
                }
                historyBackfill={
                  worldHistoryCleared ? null : activeRunWorldBackfill
                }
                historySource={
                  worldHistoryCleared ? null : displayedRunHistorySource
                }
                onWorldChange={
                  target.kind === "virtual" && !viewingSavedRun
                    ? (nextWorldId) => void changeWorld(nextWorldId)
                    : undefined
                }
                onSelectAnnotation={reviewAnnotation}
                sample={worldSample}
                samples={worldHistoryCleared ? [] : displayedRunSamples}
                selectedWorldId={
                  viewingSavedRun && latestRun
                    ? latestRun.worldId
                    : selectedWorldId
                }
                worldSelectionDisabled={
                  viewingSavedRun ||
                  targetState === "loading" ||
                  targetState === "running"
                }
                showAnnotations={annotationsVisible}
              />
            </section>

            {liveSidebarOpen ? (
              <>
                <ResizableSeparator
                  label="Resize world and live telemetry"
                  maximum={78}
                  minimum={48}
                  onChange={(next) => setLayoutValue("worldWidthPercent", next)}
                  orientation="vertical"
                  value={monitorSettings.layout.worldWidthPercent}
                />

                <section className="values-panel dashboard-pane">
                  <div className="monitor-live-cap">
                    <strong>Live</strong>
                    <button
                      aria-label="Collapse live controls and telemetry"
                      className="monitor-live-collapse"
                      onClick={() => setLiveSidebarOpen(false)}
                      title="Collapse live controls and telemetry."
                      type="button"
                    >
                      <span aria-hidden="true">›</span>
                    </button>
                  </div>
                  <RuntimeControls
                    canControl={control === null || control.owned}
                    drafts={runtimeDrafts}
                    error={runtimeUpdateError}
                    onChange={setRuntimeParameter}
                    runtime={runtimeState}
                    targetState={targetState}
                  />
                  <div className="section-heading">
                    <h2>Live telemetry</h2>
                  </div>
                  <div className="values-content">
                    {sample ? (
                      <dl className="live-values">
                        {groundTruthPose ? (
                          <>
                            <div title="Simulator ground-truth x position in millimeters.">
                              <dt>simulator true x</dt>
                              <dd data-testid="x-mm">
                                {value(groundTruthPose.x)} mm
                              </dd>
                            </div>
                            <div title="Simulator ground-truth y position in millimeters.">
                              <dt>simulator true y</dt>
                              <dd>{value(groundTruthPose.y)} mm</dd>
                            </div>
                            <div title="Simulator ground-truth counterclockwise heading from world +x.">
                              <dt>simulator true heading θ</dt>
                              <dd>{value(groundTruthPose.heading, 3)} rad</dd>
                            </div>
                          </>
                        ) : null}
                        {estimatedPose ? (
                          <>
                            <div title="Position estimated by the course Odometry component.">
                              <dt>odometry x</dt>
                              <dd
                                data-testid={
                                  groundTruthPose ? undefined : "x-mm"
                                }
                              >
                                {value(estimatedPose.x)} mm
                              </dd>
                            </div>
                            <div title="Position estimated by the course Odometry component.">
                              <dt>odometry y</dt>
                              <dd>{value(estimatedPose.y)} mm</dd>
                            </div>
                            <div title="Heading estimated by the course Odometry component.">
                              <dt>odometry heading θ</dt>
                              <dd>{value(estimatedPose.heading, 3)} rad</dd>
                            </div>
                          </>
                        ) : null}
                        <div title="Wheel-speed estimates calculated by SensorModel from recent encoder counts and sample times. The wheel controller uses the same estimates.">
                          <dt>Wheel speeds L/R</dt>
                          <dd data-testid="left-speed">
                            {value(sample.leftWheelSpeedMmS)} /{" "}
                            {value(sample.rightWheelSpeedMmS)} mm/s
                          </dd>
                        </div>
                        <div title="Signed left and right wheel distance calculated by SensorModel from encoder counts.">
                          <dt>wheel distance L/R</dt>
                          <dd data-testid="wheel-distance">
                            {value(sample.leftWheelDistanceMm ?? null)} /{" "}
                            {value(sample.rightWheelDistanceMm ?? null)} mm
                          </dd>
                        </div>
                        {sample.targetLeftWheelSpeedMmS != null ||
                        sample.targetRightWheelSpeedMmS != null ? (
                          <div title="Left and right wheel speeds requested by DifferentialDrive.">
                            <dt>target wheel speed L/R</dt>
                            <dd>
                              {value(sample.targetLeftWheelSpeedMmS ?? null)} /{" "}
                              {value(sample.targetRightWheelSpeedMmS ?? null)}{" "}
                              mm/s
                            </dd>
                          </div>
                        ) : null}
                        {sample.requestedForwardSpeedMmS != null ||
                        sample.requestedTurnRateRadS != null ? (
                          <div title="Forward speed and turn rate requested by the running program.">
                            <dt>requested speed v / yaw rate ω</dt>
                            <dd>
                              {value(sample.requestedForwardSpeedMmS ?? null)}{" "}
                              mm/s ·{" "}
                              {value(sample.requestedTurnRateRadS ?? null, 3)}{" "}
                              rad/s
                            </dd>
                          </div>
                        ) : null}
                        <div title="Dimensionless left and right motor drive command, from −1 to +1.">
                          <dt>drive command uL/uR</dt>
                          <dd data-testid="motor-effort">
                            {value(sample.leftEffort, 2)} /{" "}
                            {value(sample.rightEffort, 2)}
                          </dd>
                        </div>
                        <div title="Elapsed program or simulator time.">
                          <dt>time</dt>
                          <dd>{value(sample.tMs / 1000, 2)} s</dd>
                        </div>
                        <div title="Forward ultrasonic distance reading.">
                          <dt>ultrasound distance</dt>
                          <dd
                            className={
                              displayedUltrasoundMm === null
                                ? "alert-value"
                                : undefined
                            }
                            data-testid="range-mm"
                          >
                            {displayedUltrasoundMm === null
                              ? "Out of range"
                              : `${value(displayedUltrasoundMm)} mm`}
                          </dd>
                        </div>
                        <div title="Acceleration along the IMU x, y, and z axes.">
                          <dt>acceleration ax/ay/az</dt>
                          <dd>
                            {vector(
                              sample.accelerationMg,
                              milligravityToMetersPerSecondSquared,
                              2,
                            )}{" "}
                            m/s²
                          </dd>
                        </div>
                        <div title="Yaw rate about the vertical z axis.">
                          <dt>yaw rate ωz</dt>
                          <dd>
                            {sample.angularRateMdps
                              ? value(
                                  millidegreesPerSecondToRadiansPerSecond(
                                    sample.angularRateMdps[2],
                                  ),
                                  3,
                                )
                              : "—"}{" "}
                            rad/s
                          </dd>
                        </div>
                        {sample.sensorError ? (
                          <div title="Latest sensor-service error.">
                            <dt>sensor status</dt>
                            <dd className="alert-value">
                              {sample.sensorError}
                            </dd>
                          </div>
                        ) : null}
                        <div
                          className="telemetry-secondary-start"
                          title="Current state of the XRP USER button."
                        >
                          <dt>USER button</dt>
                          <dd>
                            {sample.buttonPressed ? "pressed" : "released"}
                          </dd>
                        </div>
                        <div title="Measured motor-supply voltage.">
                          <dt>motor supply</dt>
                          <dd>{value(sample.batteryV, 2)} V</dd>
                        </div>
                        <div title="Temperature reported by the inertial sensor.">
                          <dt>IMU temperature</dt>
                          <dd>{value(sample.temperatureC, 1)} °C</dd>
                        </div>
                        <div title="Raw left and right encoder counts.">
                          <dt>encoder counts L/R</dt>
                          <dd data-testid="encoder-counts">
                            {sample.leftEncoderCount} /{" "}
                            {sample.rightEncoderCount}
                          </dd>
                        </div>
                        <div
                          title={
                            sample.source === "virtual"
                              ? "Received virtual observations per second of simulator time, not the physics or control-loop frequency. Distinct updates can share one timestamp."
                              : "Retained physical sensor acquisitions per second of acquisition time, not the browser refresh or control-loop frequency."
                          }
                        >
                          <dt>Telemetry rate</dt>
                          <dd data-testid="telemetry-rate">
                            {telemetryRateHz === null
                              ? "—"
                              : `${telemetryRateHz.toFixed(1)} Hz`}
                          </dd>
                        </div>
                      </dl>
                    ) : (
                      <div className="telemetry-placeholder" role="status">
                        No telemetry received. Unavailable values remain blank.
                      </div>
                    )}
                    {runtimeState.watches.length > 0 ? (
                      <section
                        aria-labelledby="watch-values-title"
                        className="watch-values"
                      >
                        <h3 id="watch-values-title">Watch values</h3>
                        <dl
                          aria-label="Program watch values"
                          className="runtime-watches"
                        >
                          {runtimeState.watches.map((watch) => (
                            <div
                              key={watch.name}
                              title={`Current ${watch.label}`}
                            >
                              <dt>{watch.label}</dt>
                              <dd>
                                {typeof watch.value === "number"
                                  ? watch.value.toLocaleString(undefined, {
                                      maximumFractionDigits: 4,
                                    })
                                  : String(watch.value)}
                                {watch.unit ? ` ${watch.unit}` : ""}
                              </dd>
                            </div>
                          ))}
                        </dl>
                      </section>
                    ) : null}
                  </div>
                </section>
              </>
            ) : (
              <button
                aria-label="Open live controls and telemetry"
                className="monitor-live-restore"
                onClick={() => setLiveSidebarOpen(true)}
                title="Open live controls and telemetry."
                type="button"
              >
                <span aria-hidden="true">‹</span>
              </button>
            )}
          </div>

          {plotsOpen ? (
            <ResizableSeparator
              label="Resize upper and lower monitor regions"
              maximum={75}
              minimum={35}
              onChange={(next) => setLayoutValue("topHeightPercent", next)}
              orientation="horizontal"
              value={monitorSettings.layout.topHeightPercent}
            />
          ) : (
            <div aria-hidden="true" className="plot-separator-placeholder" />
          )}

          <div className="dashboard-region bottom-region">
            <button
              aria-controls="plots-panel-content"
              aria-expanded={plotsOpen}
              aria-label={`${plotsOpen ? "Collapse" : "Expand"} plots`}
              className="plots-toggle"
              onClick={() => setPlotsOpen((current) => !current)}
              title={`${plotsOpen ? "Collapse" : "Expand"} plots`}
              type="button"
            >
              <span aria-hidden="true">{plotsOpen ? "⌃" : "⌄"}</span>
            </button>
            <section
              aria-label="Signal plots"
              className="plots-panel dashboard-pane"
            >
              <div
                className="plots-content"
                hidden={!plotsOpen}
                id="plots-panel-content"
              >
                {plotsWithChangedUnits.length ? (
                  <p className="plot-unit-notice" role="status">
                    Units changed for {plotsWithChangedUnits.join(", ")}. Each
                    plot shows its current unit; the CSV retains every recorded
                    value and unit. Use one unit per signal for comparison.
                  </p>
                ) : null}
                {plotsOpen &&
                (sample || latestRun?.recording.samples.length) &&
                visiblePlots.length > 0 ? (
                  <div className="strip-chart-stack">
                    {visiblePlots.map((plot) => (
                      <section className="strip-chart" key={plot.id}>
                        <SignalPlot
                          active={monitorSurfaceActive && plotsOpen}
                          annotations={annotations}
                          definition={plot}
                          onRequestAnnotation={
                            activeRunId || latestRun
                              ? requestAnnotation
                              : undefined
                          }
                          samples={displayedRunSamples}
                          showAnnotations={annotationsVisible}
                          timeWindowS={monitorSettings.timeWindowS}
                        />
                      </section>
                    ))}
                  </div>
                ) : plotsOpen ? (
                  <div className="telemetry-placeholder" role="status">
                    {sample
                      ? "Choose at least one signal in Controls."
                      : "Signal histories appear when telemetry connects."}
                  </div>
                ) : null}
              </div>
            </section>
          </div>
          {noteRequest ? (
            <MonitorNoteEditor
              request={noteRequest}
              onSubmit={saveNoteRequest}
              onClose={() => setNoteRequest(null)}
              onDraftChange={noteEditorDraftChanged}
              canStop={isRunning || runStarting || activeRunId !== null}
              onStop={stopFromNoteEditor}
            />
          ) : null}
        </main>
      </div>
    </div>
  );
}
