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
  courseFolderPermission,
  autosaveDirectoryName,
  loadRememberedProjectFolder,
  loadRememberedWorkspaceFolder,
  requestCourseFolderPermission,
  subscribeCourseFolderChanged,
  withCourseFolderWriteLock,
  writeCourseFile,
  writeCourseTextFile,
  writeRotatingTextBundle,
  type CourseDirectoryHandle,
  type CourseFileHandle,
} from "../../shared/course-folder";
import { readProjectFolder } from "../../ide/src/project-files";
import {
  SIGNAL_PLOTS,
  SignalPlot,
  runtimePlotDefinition,
  type SignalPlotDefinition,
  type SignalPlotId,
} from "./SignalPlot";
import { WorldView } from "./WorldView";
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

function completedRunMetadata(run: MonitorRunDataset) {
  return {
    schemaVersion: 2,
    runId: run.id,
    startedAt: run.startedAt,
    finishedAt: run.finishedAt,
    target: run.target,
    worldId: run.worldId,
    world: run.world,
    finalState: run.finalState,
    finalDetail: run.finalDetail,
    project: run.project,
    telemetrySamples: run.recording.samples.length,
    droppedTelemetrySamples: run.recording.droppedSamples,
    annotations: run.annotations,
  };
}

function completedRunOutput(run: MonitorRunDataset): string {
  return [
    "UCSB XRP run",
    `Started: ${run.startedAt}`,
    `Finished: ${run.finishedAt}`,
    `Target: ${run.target}`,
    `Project: ${run.project?.name ?? "unavailable"}`,
    `Result: ${run.finalState} · ${run.finalDetail}`,
    "",
    ...run.output.map((entry) => `[${entry.stream}] ${entry.line}`),
    "",
  ].join("\n");
}

const monitorSettingsKey = "ucsb-xrp-monitor-settings-v3";
const maximumPlotSamples = 1_800;
const lastArchivedRunKey = "ucsb-xrp-last-archived-run-v1";
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
  save(blob: Blob): Promise<void>;
}

async function prepareExportDestination(
  folder: CourseDirectoryHandle | null,
  fileName: string,
  mimeType: string,
): Promise<ExportDestination | null> {
  if (folder) {
    const path = `exports/${fileName}`;
    return {
      description: `./${folder.name}/${path}`,
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
    description: `Downloads/${fileName}`,
    save: async (blob) => downloadBlob(blob, fileName),
  };
}

interface MonitorSettings {
  timeWindowS: number;
  plots: Record<SignalPlotId, boolean>;
  layout: {
    topHeightPercent: number;
    worldWidthPercent: number;
    plotsWidthPercent: number;
  };
}

const defaultMonitorSettings: MonitorSettings = {
  timeWindowS: 10,
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
    const stored = JSON.parse(
      window.localStorage.getItem(monitorSettingsKey) ?? "null",
    ) as Partial<MonitorSettings> | null;
    const timeWindowS = Number(stored?.timeWindowS);
    return {
      timeWindowS:
        Number.isFinite(timeWindowS) && timeWindowS >= 2 && timeWindowS <= 30
          ? timeWindowS
          : defaultMonitorSettings.timeWindowS,
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

interface RuntimeControlsProps {
  drafts: Record<string, RuntimeParameterValue>;
  error: string;
  onChange(
    name: string,
    value: RuntimeParameterValue,
    debounce?: boolean,
  ): void;
  runtime: RuntimeState;
  targetState: TargetRunState;
  open: boolean;
  onToggle(): void;
}

function RuntimeControls({
  drafts,
  error,
  onChange,
  runtime,
  targetState,
  open,
  onToggle,
}: RuntimeControlsProps) {
  return (
    <section
      aria-labelledby="live-controls-title"
      className={`live-controls-panel ${open ? "open" : "collapsed"}`}
    >
      <div
        className="live-program-heading"
        title="Adjust parameters declared by the running program."
      >
        <h2 id="live-controls-title">Live controls</h2>
        {runtime.parameters.length > 0 ? (
          <small>{runtime.parameters.length} controls</small>
        ) : null}
        <button
          aria-controls="live-controls-content"
          aria-expanded={open}
          aria-label={`${open ? "Collapse" : "Expand"} live controls`}
          className="panel-collapse-button"
          onClick={onToggle}
          title={`${open ? "Collapse" : "Expand"} live controls`}
          type="button"
        >
          <span aria-hidden="true">{open ? "⌃" : "⌄"}</span>
        </button>
      </div>
      <div
        className="live-program-content"
        hidden={!open}
        id="live-controls-content"
      >
        {runtime.parameters.length === 0 ? (
          <p className="live-program-empty">No controls in this program.</p>
        ) : (
          <div
            aria-label="Live control parameters"
            className="runtime-parameters"
          >
            {runtime.parameters.map((parameter) => {
              const shownValue =
                drafts[parameter.name] ??
                parameter.pendingValue ??
                parameter.value;
              if (parameter.kind === "number") {
                const shownNumber = Number(shownValue);
                const shownText = shownNumber.toLocaleString(undefined, {
                  maximumFractionDigits: 4,
                });
                return (
                  <label
                    className="runtime-number"
                    data-pending={
                      parameter.pendingValue !== undefined ||
                      drafts[parameter.name] !== undefined
                    }
                    data-runtime-parameter={parameter.name}
                    data-runtime-value={shownText}
                    key={parameter.name}
                    title={`Adjust ${parameter.label.toLowerCase()} while the program runs. The value is applied at its next sample boundary.`}
                  >
                    <span>{parameter.label}</span>
                    <output
                      aria-label={`${parameter.label} ${shownText}${parameter.unit ? ` ${parameter.unit}` : ""}`}
                    >
                      {shownText}
                      {parameter.unit ? ` ${parameter.unit}` : ""}
                    </output>
                    <input
                      aria-label={parameter.label}
                      disabled={targetState !== "running"}
                      max={parameter.maximum}
                      min={parameter.minimum}
                      onChange={(event) =>
                        onChange(
                          parameter.name,
                          Number(event.target.value),
                          true,
                        )
                      }
                      step={parameter.step}
                      type="range"
                      value={shownNumber}
                    />
                  </label>
                );
              }
              if (parameter.kind === "toggle") {
                return (
                  <label
                    className="runtime-toggle"
                    data-pending={
                      parameter.pendingValue !== undefined ||
                      drafts[parameter.name] !== undefined
                    }
                    data-runtime-parameter={parameter.name}
                    data-runtime-value={String(shownValue)}
                    key={parameter.name}
                    title={`Turn ${parameter.label.toLowerCase()} on or off while the program runs.`}
                  >
                    <span>{parameter.label}</span>
                    <input
                      checked={Boolean(shownValue)}
                      disabled={targetState !== "running"}
                      onChange={(event) =>
                        onChange(parameter.name, event.target.checked)
                      }
                      type="checkbox"
                    />
                  </label>
                );
              }
              return (
                <fieldset
                  className="runtime-choice"
                  data-pending={
                    parameter.pendingValue !== undefined ||
                    drafts[parameter.name] !== undefined
                  }
                  data-runtime-parameter={parameter.name}
                  data-runtime-value={String(shownValue)}
                  key={parameter.name}
                  title={`Choose ${parameter.label.toLowerCase()} while the program runs.`}
                >
                  <legend>{parameter.label}</legend>
                  <div>
                    {parameter.options?.map((option) => (
                      <label key={option}>
                        <input
                          checked={shownValue === option}
                          disabled={targetState !== "running"}
                          name={`runtime-${parameter.name}`}
                          onChange={() => onChange(parameter.name, option)}
                          type="radio"
                        />
                        <span>{option}</span>
                      </label>
                    ))}
                  </div>
                </fieldset>
              );
            })}
          </div>
        )}
        {error ? (
          <p className="runtime-update-error" role="alert">
            {error}
          </p>
        ) : null}
      </div>
    </section>
  );
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
  const [liveControlsOpen, setLiveControlsOpen] = useState(true);
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
  const [folderInteractionRevision, setFolderInteractionRevision] = useState(0);
  const [rememberedAutosaveFolder, setRememberedAutosaveFolder] =
    useState<CourseDirectoryHandle | null>(null);
  const [runAutosaveDetail, setRunAutosaveDetail] = useState(
    "Choose a Working folder and project in the IDE.",
  );
  const [annotations, setAnnotations] = useState<MonitorAnnotation[]>([]);
  const [annotationsVisible, setAnnotationsVisible] = useState(true);
  const [exportState, setExportState] = useState<
    "idle" | "telemetry-csv" | "plots-svg" | "plots-png" | "world-webm"
  >("idle");
  const [exportDetail, setExportDetail] = useState("");
  const nextConsoleId = useRef(1);
  const autosaveFolderRef = useRef<CourseDirectoryHandle | null>(null);
  const activeRunFolderRef = useRef<CourseDirectoryHandle | null>(null);
  const latestRunFolderRef = useRef<CourseDirectoryHandle | null>(null);
  const diagnosticFolderRef = useRef<CourseDirectoryHandle | null>(null);
  const autosaveFolderRemembered = useRef(false);
  const currentProjectRef = useRef<SynchronizedProject | null>(null);
  const projectProviderAvailableRef = useRef(false);
  const annotationsRef = useRef<MonitorAnnotation[]>([]);
  const runArchiveQueue = useRef<Promise<void>>(Promise.resolve());
  const targetStateRef = useRef<TargetRunState>("disconnected");
  const runStartingRef = useRef(false);
  const exportActiveRef = useRef(false);
  const runtimeUpdateTimers = useRef(
    new Map<string, ReturnType<typeof setTimeout>>(),
  );
  const latestRuntimeStateRef = useRef<RuntimeState>(emptyRuntimeState);
  const folderInteractionCountRef = useRef(0);
  const runArchiveCountRef = useRef(0);
  const targetCommandCountRef = useRef(0);
  const annotationDraftIdsRef = useRef(new Set<string>());
  const telemetryRateSamplesRef = useRef<TelemetrySample[]>([]);
  const nextRunIdRef = useRef(1);
  const observedRunRequestIdsRef = useRef(new Set<string>());
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
        const next = Object.fromEntries(
          state.plots.map((plot) => [plot.name, current[plot.name] ?? false]),
        );
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
    setRuntimeDrafts({});
    retryPendingOfflineShellReload();
  }, [targetState]);

  useEffect(() => {
    window.localStorage.setItem(
      monitorSettingsKey,
      JSON.stringify(monitorSettings),
    );
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
    const refreshFolder = async (preserveUnrememberedFolder = false) => {
      beginFolderInteraction();
      try {
        const revision = ++refreshRevision;
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
          setRunAutosaveDetail(
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
          setRunAutosaveDetail(
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
          const opened = await readProjectFolder(folder);
          if (disposed || revision !== refreshRevision) {
            return;
          }
          const descriptor = await describeProject(opened.project);
          autosaveFolderRef.current = folder;
          setAutosaveFolder(folder);
          if (currentProjectRef.current === null) {
            currentProjectRef.current = descriptor;
            setCurrentProject(descriptor);
          }
          setRunAutosaveDetail(`Runs save automatically to ${folder.name}.`);
        } else {
          autosaveFolderRef.current = null;
          setAutosaveFolder(null);
          setRunAutosaveDetail(
            `Reconnect project folder ${folder.name} to resume run saving.`,
          );
        }
      } catch (error: unknown) {
        if (disposed) return;
        const detail = error instanceof Error ? error.message : String(error);
        autosaveFolderRemembered.current = false;
        autosaveFolderRef.current = null;
        setRememberedAutosaveFolder(null);
        setAutosaveFolder(null);
        setRunAutosaveDetail(
          `Open the IDE to reconnect the Working folder. ${detail}`,
        );
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
    const folderChanged = () => {
      const sharedFolderCanChange = autosaveFolderRemembered.current;
      diagnosticFolderRef.current = null;
      diagnosticLog.detachWorkingFolder();
      if (sharedFolderCanChange) {
        // Stop writes immediately; loading the replacement handle is asynchronous.
        autosaveFolderRef.current = null;
        setAutosaveFolder(null);
      }
      void refreshFolder(!sharedFolderCanChange);
    };
    void refreshFolder();
    const unsubscribe = subscribeCourseFolderChanged(folderChanged);
    return () => {
      disposed = true;
      unsubscribe();
      void diagnosticLog.flush();
    };
  }, [beginFolderInteraction, diagnosticLog, finishFolderInteraction]);

  const archiveCompletedRun = useCallback(
    (run: MonitorRunDataset, folder: CourseDirectoryHandle | null) => {
      const recording = run.recording;
      if (!folder) {
        setRunAutosaveDetail(
          "Run data was not saved; reconnect the Project folder in the IDE.",
        );
        diagnosticLog.record({
          event: "run.archive-skipped",
          level: "warning",
          message: `Run ${run.id} was not saved because no Project folder was available.`,
        });
        return;
      }

      const firstSample = recording.samples[0];
      const lastSample = recording.samples.at(-1);
      const fingerprint = JSON.stringify({
        id: run.id,
        source: run.target,
        revision: run.project?.revision ?? null,
        first: firstSample ? [firstSample.seq, firstSample.tMs] : null,
        last: lastSample ? [lastSample.seq, lastSample.tMs] : null,
        outputCount: run.output.length,
        firstOutput: run.output[0]?.line ?? null,
        lastOutput: run.output.at(-1)?.line ?? null,
      });
      const metadata = completedRunMetadata(run);
      const outputText = completedRunOutput(run);

      const writeArchive = async (): Promise<boolean> => {
        try {
          if (localStorage.getItem(lastArchivedRunKey) === fingerprint) {
            return true;
          }
        } catch {
          // The folder write remains useful when localStorage is unavailable.
        }
        await writeRotatingTextBundle(folder, [
          { baseName: "run", extension: "txt", content: outputText },
          {
            baseName: "telemetry",
            extension: "csv",
            content: monitorRunToCsv(recording, run.annotations),
          },
          {
            baseName: "run",
            extension: "json",
            content: `${JSON.stringify(metadata, null, 2)}\n`,
          },
        ]);
        try {
          localStorage.setItem(lastArchivedRunKey, fingerprint);
        } catch {
          // The files are already complete.
        }
        return true;
      };

      const queued = runArchiveQueue.current.then(async () => {
        return withCourseFolderWriteLock("run", writeArchive);
      });
      runArchiveCountRef.current += 1;
      runArchiveQueue.current = queued.then(
        () => undefined,
        () => undefined,
      );
      void queued
        .then((saved) => {
          setRunAutosaveDetail(
            saved
              ? `Saved automatically to ${folder.name}.`
              : "Not saved because the project folder changed.",
          );
          diagnosticLog.record({
            event: saved ? "run.archive-saved" : "run.archive-skipped",
            level: saved ? "info" : "warning",
            message: saved
              ? `Run ${run.id} was saved to Project folder ${folder.name}.`
              : `Run ${run.id} was not saved because the Project folder changed.`,
          });
        })
        .catch((error: unknown) => {
          const detail = error instanceof Error ? error.message : String(error);
          setRunAutosaveDetail(`Run save failed: ${detail}`);
          diagnosticLog.record({
            event: "run.archive-failed",
            level: "error",
            terminal: true,
            message: `Run ${run.id} could not be saved: ${detail}`,
          });
        })
        .finally(() => {
          runArchiveCountRef.current = Math.max(
            0,
            runArchiveCountRef.current - 1,
          );
          retryPendingOfflineShellReload();
        });
    },
    [diagnosticLog],
  );

  const finishActiveRun = useCallback(
    (finalState: TargetRunState, finalDetail: string) => {
      const run = runDatasetController.complete(
        finalState,
        finalDetail,
        new Date().toISOString(),
      );
      if (!run) return null;
      const runFolder = activeRunFolderRef.current;
      activeRunFolderRef.current = null;
      latestRunFolderRef.current = runFolder;
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

  const clearDisplayedRun = useCallback(
    (options?: { clearLiveTelemetry?: boolean }) => {
      runDatasetController.clear();
      setActiveRunId(null);
      setLatestRun(null);
      setActiveRunWorldBackfill(null);
      latestRunFolderRef.current = null;
      if (options?.clearLiveTelemetry) {
        telemetryRateSamplesRef.current = [];
        monitorVisualHistory.clearAll();
      } else {
        monitorVisualHistory.clearHistory();
      }
      annotationsRef.current = [];
      setAnnotations([]);
      setExportDetail("");
      retryPendingOfflineShellReload();
    },
    [monitorVisualHistory, runDatasetController],
  );

  const beginRunDataset = useCallback(
    (
      source: TelemetrySample["source"],
      identity?: { id: string; startedAtMs?: number; replayed?: boolean },
    ): string => {
      if (runDatasetController.activeId) {
        return runDatasetController.activeId;
      }
      const runId =
        identity?.id ?? `${source}-${Date.now()}-${nextRunIdRef.current++}`;
      const catalog = worldCatalogRef.current;
      const selectedWorld =
        catalog.worlds.find(
          (world) => world.id === selectedWorldIdRef.current,
        ) ?? catalog.worlds[0]!;
      runDatasetController.begin({
        id: runId,
        target: source,
        project: currentProjectRef.current,
        worldId: selectedWorld.id,
        world: selectedWorld,
        startedAt: new Date(identity?.startedAtMs ?? Date.now()).toISOString(),
      });
      activeRunFolderRef.current = autosaveFolderRef.current;
      setActiveRunId(runId);
      setActiveRunWorldBackfill(null);
      monitorVisualHistory.clearHistory();
      annotationsRef.current = [];
      setAnnotations([]);
      setExportDetail("");
      setRunAutosaveDetail(
        autosaveFolderRef.current
          ? `Will save automatically to ${autosaveFolderRef.current.name}.`
          : "Run data will not be saved; reconnect the Project folder in the IDE.",
      );
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

  const updateSavedRunAnnotations = useCallback((run: MonitorRunDataset) => {
    const folder = latestRunFolderRef.current;
    if (!folder) return;
    const update = runArchiveQueue.current.then(async () => {
      await withCourseFolderWriteLock("run", async () => {
        await writeCourseTextFile(
          folder,
          `${autosaveDirectoryName}/telemetry-1.csv`,
          monitorRunToCsv(run.recording, run.annotations),
        );
        await writeCourseTextFile(
          folder,
          `${autosaveDirectoryName}/run-1.json`,
          `${JSON.stringify(completedRunMetadata(run), null, 2)}\n`,
        );
      });
    });
    runArchiveQueue.current = update.catch(() => undefined);
  }, []);

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
      } else if (event.type === "status") {
        targetStateRef.current = event.state;
        const retained = replayedRunRef.current?.boundary;
        if (
          (event.state === "running" ||
            (event.state === "connecting" && retained !== undefined)) &&
          !runDatasetController.isActive
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
                }
              : undefined,
          );
        }
        const nextRunActive =
          isActiveRunState(event.state) ||
          (event.state === "connecting" && runDatasetController.isActive);
        if (!nextRunActive && runDatasetController.isActive) {
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
            !runDatasetController.isActive &&
            replayed.samples.length > 0
          ) {
            const catalog = worldCatalogRef.current;
            const selectedWorld =
              catalog.worlds.find(
                (world) => world.id === selectedWorldIdRef.current,
              ) ?? catalog.worlds[0]!;
            const restored = runDatasetController.restore({
              id: event.runId,
              target: target.kind,
              project: currentProjectRef.current,
              worldId: selectedWorld.id,
              world: selectedWorld,
              startedAt: new Date(event.startedAtMs).toISOString(),
              finishedAt: new Date(
                event.finishedAtMs ?? event.startedAtMs,
              ).toISOString(),
              finalState: event.state,
              finalDetail: event.detail,
              recording: {
                schemaVersion: 3,
                samples: replayed.samples,
                droppedSamples: 0,
              },
              output: replayed.output,
              annotations: [],
            });
            activeRunFolderRef.current = null;
            latestRunFolderRef.current = null;
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
        if (
          event.action === "reset" &&
          event.phase === "result" &&
          event.replayed !== true
        ) {
          finishActiveRun("ready", "Run ended by Reset");
          clearDisplayedRun({ clearLiveTelemetry: true });
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
        if (
          event.action === "run" &&
          event.phase === "request" &&
          event.replayed !== true
        ) {
          const requestIdentity = event.requestId ?? event.eventId;
          const observed = observedRunRequestIdsRef.current;
          if (!requestIdentity || !observed.has(requestIdentity)) {
            if (requestIdentity) {
              observed.add(requestIdentity);
              while (observed.size > 32) {
                observed.delete(observed.values().next().value!);
              }
            }
            // Run may be pressed in either IDE or Monitor. The target's
            // structured Run event is the shared start boundary; Reset and
            // connection transitions do not emit it and therefore cannot
            // create an empty or mislabeled run.
            beginRunDataset(target.kind, {
              id:
                requestIdentity ??
                `${target.kind}-${event.timestampMs ?? Date.now()}`,
              startedAtMs: event.timestampMs,
            });
          }
        }
        const entry = {
          id: event.eventId ?? `monitor-target-${nextConsoleId.current++}`,
          stream: event.stream,
          line: event.line,
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
    clearDisplayedRun,
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
    autosaveFolder !== null &&
    !virtualRuntimePreparing &&
    (targetState === "ready" ||
      (target.kind === "virtual" && targetState === "error"));

  const runOrStop = async () => {
    const stopping = targetState === "running" || targetState === "loading";
    if (runStarting || (!stopping && !canRunCurrent)) {
      return;
    }
    beginTargetCommand();
    try {
      if (stopping) {
        await target.stop();
      } else {
        runStartingRef.current = true;
        setRunStarting(true);
        beginRunDataset(target.kind);
        if (projectProviderAvailable) {
          await target.runCurrent();
        } else {
          const folder = autosaveFolderRef.current;
          if (!folder) {
            throw new Error(
              "Choose a Working folder and project in the IDE before running.",
            );
          }
          const opened = await readProjectFolder(folder);
          await target.run(
            opened.project,
            monitorProjectId(folder, opened.project.session),
          );
        }
      }
    } catch (error: unknown) {
      const detail = error instanceof Error ? error.message : String(error);
      finishActiveRun("error", detail);
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
      runStartingRef.current = false;
      setRunStarting(false);
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
      setAutosaveFolder(rememberedAutosaveFolder);
      setRunAutosaveDetail(
        `Runs save automatically to ${rememberedAutosaveFolder.name}.`,
      );
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
    exportActiveRef.current = true;
    setExportState("telemetry-csv");
    try {
      const fileName = timestampedName("xrp-telemetry", "csv");
      const destination = await prepareExportDestination(
        latestRunFolderRef.current,
        fileName,
        "text/csv",
      );
      if (!destination) {
        diagnosticLog.record({
          event: "export.cancelled",
          message: "Telemetry and notes CSV export was cancelled.",
        });
        return;
      }
      const csv = monitorRunToCsv(latestRun.recording, latestRun.annotations);
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
      await destination.save(blob);
      setExportDetail(`Saved ${destination.description}`);
      diagnosticLog.record({
        event: "export.saved",
        terminal: true,
        message: `Telemetry and notes CSV saved to ${destination.description}.`,
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
  ) => {
    setRuntimeUpdateError("");
    beginTargetCommand();
    try {
      await target.setRuntimeParameter(name, nextValue);
      setRuntimeDrafts((current) => {
        const next = { ...current };
        delete next[name];
        return next;
      });
    } catch (error: unknown) {
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
    setRuntimeDrafts((current) => ({ ...current, [name]: nextValue }));
    const previous = runtimeUpdateTimers.current.get(name);
    if (previous) {
      clearTimeout(previous);
    }
    if (!debounce) {
      runtimeUpdateTimers.current.delete(name);
      void commitRuntimeParameter(name, nextValue);
      return;
    }
    runtimeUpdateTimers.current.set(
      name,
      setTimeout(() => {
        runtimeUpdateTimers.current.delete(name);
        void commitRuntimeParameter(name, nextValue);
      }, 140),
    );
  };

  const programPlotDefinitions = useMemo(
    () => availableProgramPlots.map(runtimePlotDefinition),
    [availableProgramPlots],
  );
  const visiblePlots: SignalPlotDefinition[] = [
    ...SIGNAL_PLOTS.filter((plot) => monitorSettings.plots[plot.id]),
    ...programPlotDefinitions.filter((plot) =>
      Boolean(programPlotVisibility[plot.id.replace(/^program:/, "")]),
    ),
  ];

  const addAnnotation = (sampleAtNote: TelemetrySample, label: string) => {
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
  const displayedRunHistorySource = activeRunId ?? latestRun?.recording ?? null;

  const exportPlots = async (format: "svg" | "png") => {
    if (
      activeRunId !== null ||
      latestRun === null ||
      visiblePlots.length === 0 ||
      latestRun.recording.samples.length === 0
    )
      return;
    const nextState = format === "svg" ? "plots-svg" : "plots-png";
    exportActiveRef.current = true;
    setExportState(nextState);
    try {
      const fileName = timestampedName("xrp-plots", format);
      const destination = await prepareExportDestination(
        latestRunFolderRef.current,
        fileName,
        format === "svg" ? "image/svg+xml" : "image/png",
      );
      if (!destination) {
        diagnosticLog.record({
          event: "export.cancelled",
          message: `${format.toUpperCase()} plot export was cancelled.`,
        });
        return;
      }
      setExportDetail(`Preparing ${format.toUpperCase()}…`);
      const { createSignalPlotsSvg, svgToPng } = await loadMonitorExport();
      const svg = createSignalPlotsSvg(
        latestRun.recording.samples,
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
      await destination.save(blob);
      setExportDetail(`Saved ${destination.description}`);
      diagnosticLog.record({
        event: "export.saved",
        terminal: true,
        message: `${format.toUpperCase()} plots saved to ${destination.description}.`,
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
    exportActiveRef.current = true;
    setExportState("world-webm");
    try {
      const fileName = timestampedName("xrp-world-animation", "webm");
      const destination = await prepareExportDestination(
        latestRunFolderRef.current,
        fileName,
        "video/webm",
      );
      if (!destination) {
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
        samples: latestRun.recording.samples,
        annotations: annotationsVisible ? latestRun.annotations : [],
        world: latestRun.world,
        onProgress: (fraction) => {
          const progress = Math.floor(fraction * 100);
          if (progress !== shownProgress) {
            shownProgress = progress;
            setExportDetail(`Creating world animation · ${progress}%`);
          }
        },
      });
      await destination.save(blob);
      setExportDetail(`Saved ${destination.description}`);
      diagnosticLog.record({
        event: "export.saved",
        terminal: true,
        message: `World animation saved to ${destination.description}.`,
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
  const isRunning = targetState === "running" || targetState === "loading";
  targetStateRef.current = targetState;
  runStartingRef.current = runStarting;

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
          retainedAnnotations: annotationsRef.current.length > 0,
          annotationDraftActive: annotationDraftIdsRef.current.size > 0,
          folderInteractionActive: folderInteractionCountRef.current > 0,
          saveActive: runArchiveCountRef.current > 0,
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
        retainedAnnotations: annotations.length > 0,
        annotationDraftActive: annotationDraftIdsRef.current.size > 0,
        folderInteractionActive: folderInteractionCountRef.current > 0,
        saveActive: runArchiveCountRef.current > 0,
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
  const worldSample = sample?.poseAvailable ? sample : worldPreviewSample;
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

  return (
    <div
      className={`app-shell ${embeddedApplication ? "embedded-app" : ""} ${physicalConnectionFailed ? "monitor-recovery-visible" : ""}`}
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
            disabled={runStarting || (!isRunning && !canRunCurrent)}
            onClick={runOrStop}
            title={
              isRunning
                ? "Stop the running program."
                : virtualRuntimePreparing
                  ? "Chrome is preparing the Virtual XRP. This page refreshes once automatically, then Run becomes available."
                  : runStarting
                    ? "Compiling the default project before Run."
                    : !autosaveFolder
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
                    {availableProgramPlots.map((plot) => (
                      <label
                        className="check-row program-signal-choice"
                        key={plot.name}
                        title={`${plot.label} is published by the running program.`}
                      >
                        <input
                          checked={programPlotVisibility[plot.name] ?? false}
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
                  <div className="annotation-tools">
                    <span className="annotation-hint">
                      Right-click a plot to add a note to this run.
                    </span>
                    {annotations.length > 0 ? (
                      <button
                        aria-pressed={annotationsVisible}
                        className="annotation-visibility"
                        onClick={() =>
                          setAnnotationsVisible((visible) => !visible)
                        }
                        title="Show or hide all current plot and world notes."
                      >
                        {`${annotationsVisible ? "Hide" : "Show"} notes · ${annotations.length}`}
                      </button>
                    ) : null}
                  </div>
                  <div className="export-section">
                    <h3>Export</h3>
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
          <div className="dashboard-region top-region" style={topRegionStyle}>
            <section className="world-panel dashboard-pane">
              <WorldView
                active={monitorSurfaceActive}
                annotations={annotations}
                catalog={worldCatalog}
                historyBackfill={activeRunWorldBackfill}
                historySource={displayedRunHistorySource}
                onWorldChange={
                  target.kind === "virtual"
                    ? (nextWorldId) => void changeWorld(nextWorldId)
                    : undefined
                }
                sample={worldSample}
                samples={displayedRunSamples}
                selectedWorldId={selectedWorldId}
                worldSelectionDisabled={
                  targetState === "loading" || targetState === "running"
                }
                showAnnotations={annotationsVisible}
              />
            </section>

            <ResizableSeparator
              label="Resize world and live telemetry"
              maximum={78}
              minimum={48}
              onChange={(next) => setLayoutValue("worldWidthPercent", next)}
              orientation="vertical"
              value={monitorSettings.layout.worldWidthPercent}
            />

            <section className="values-panel dashboard-pane">
              <RuntimeControls
                drafts={runtimeDrafts}
                error={runtimeUpdateError}
                onChange={setRuntimeParameter}
                onToggle={() => setLiveControlsOpen((current) => !current)}
                open={liveControlsOpen}
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
                            data-testid={groundTruthPose ? undefined : "x-mm"}
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
                      <dt>measured wheel speed L/R</dt>
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
                          {value(sample.targetRightWheelSpeedMmS ?? null)} mm/s
                        </dd>
                      </div>
                    ) : null}
                    {sample.requestedForwardSpeedMmS != null ||
                    sample.requestedTurnRateRadS != null ? (
                      <div title="Forward speed and turn rate requested by the running program.">
                        <dt>requested speed v / yaw rate ω</dt>
                        <dd>
                          {value(sample.requestedForwardSpeedMmS ?? null)} mm/s
                          · {value(sample.requestedTurnRateRadS ?? null, 3)}{" "}
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
                        <dd className="alert-value">{sample.sensorError}</dd>
                      </div>
                    ) : null}
                    <div
                      className="telemetry-secondary-start"
                      title="Current state of the XRP USER button."
                    >
                      <dt>USER button</dt>
                      <dd>{sample.buttonPressed ? "pressed" : "released"}</dd>
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
                        {sample.leftEncoderCount} / {sample.rightEncoderCount}
                      </dd>
                    </div>
                    <div title="Recent telemetry sample rate calculated from XRP or simulator timestamps.">
                      <dt>telemetry sample rate</dt>
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
                        <div key={watch.name} title={`Current ${watch.label}`}>
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
            <section
              aria-labelledby="plots-panel-title"
              className="plots-panel dashboard-pane"
            >
              <div className="section-heading plots-heading">
                <h2 id="plots-panel-title">Plots</h2>
                <small>{visiblePlots.length} selected</small>
                <button
                  aria-controls="plots-panel-content"
                  aria-expanded={plotsOpen}
                  aria-label={`${plotsOpen ? "Collapse" : "Expand"} plots`}
                  className="panel-collapse-button"
                  onClick={() => setPlotsOpen((current) => !current)}
                  title={`${plotsOpen ? "Collapse" : "Expand"} plots`}
                  type="button"
                >
                  <span aria-hidden="true">{plotsOpen ? "⌃" : "⌄"}</span>
                </button>
              </div>
              <div
                className="plots-content"
                hidden={!plotsOpen}
                id="plots-panel-content"
              >
                {plotsOpen && sample && visiblePlots.length > 0 ? (
                  <div className="strip-chart-stack">
                    {visiblePlots.map((plot) => (
                      <section className="strip-chart" key={plot.id}>
                        <SignalPlot
                          active={monitorSurfaceActive && plotsOpen}
                          annotations={annotations}
                          definition={plot}
                          onAddAnnotation={
                            activeRunId || latestRun ? addAnnotation : undefined
                          }
                          onAnnotationDraftChange={setAnnotationDraftActive}
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
        </main>
      </div>
    </div>
  );
}
