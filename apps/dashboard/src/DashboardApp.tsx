import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";

import {
  DEFAULT_COURSE_PROJECT,
  DEFAULT_WORLD_CATALOG,
  PhysicalTargetClient,
  VirtualTargetClient,
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

import { OfflineReadiness } from "../../shared/OfflineReadiness";
import { AppNavigation } from "../../shared/AppNavigation";
import { isEmbeddedApplication } from "../../shared/embedded-application";
import { ResetIcon, RunStopIcon } from "../../shared/HeaderIcons";
import { SplitWorkspaceLink } from "../../shared/SplitWorkspaceLink";
import { ResizableSeparator } from "../../shared/ResizableSeparator";
import { useTargetPreference } from "../../shared/use-target-preference";
import {
  registerOfflineShellBeforeReload,
  retryPendingOfflineShellReload,
  virtualRunNeedsPreparation,
} from "../../shared/offline-shell";
import { useProjectBootstrapPending } from "../../shared/use-project-bootstrap";
import {
  courseFolderPermission,
  autosaveDirectoryName,
  loadRememberedProjectFolder,
  requestCourseFolderPermission,
  subscribeCourseFolderChanged,
  withCourseFolderWriteLock,
  writeCourseFile,
  writeCourseTextFile,
  writeRotatingTextBundle,
  type CourseDirectoryHandle,
  type CourseFileHandle,
} from "../../shared/course-folder";
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
} from "./monitor-run-dataset";
import { monitorReloadIsSafe } from "./monitor-release-reload";
import {
  PlotSampleHistory,
  recentTelemetryRateHz,
} from "./plot-sample-history";

interface ConsoleEntry {
  id: string;
  stream: "stdout" | "stderr" | "system";
  line: string;
}

function completedRunMetadata(run: MonitorRunDataset) {
  return {
    schemaVersion: 2,
    runId: run.id,
    startedAt: run.startedAt,
    finishedAt: run.finishedAt,
    target: run.target,
    worldId: run.worldId,
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
}

function RuntimeControls({
  drafts,
  error,
  onChange,
  runtime,
  targetState,
}: RuntimeControlsProps) {
  return (
    <section
      aria-labelledby="live-controls-title"
      className="live-controls-panel"
    >
      <div
        className="live-program-heading"
        title="Adjust parameters declared by the running program."
      >
        <h2 id="live-controls-title">Live controls</h2>
        {runtime.parameters.length > 0 ? (
          <small>{runtime.parameters.length} controls</small>
        ) : null}
      </div>
      <div className="live-program-content">
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
  const projectBootstrapPending = useProjectBootstrapPending();
  const [targetPreference, updateTargetPreference] = useTargetPreference();
  const [connectionAttempt, setConnectionAttempt] = useState(0);
  const [worldCatalog, setWorldCatalog] = useState<WorldCatalog>(
    DEFAULT_WORLD_CATALOG,
  );
  const [selectedWorldId, setSelectedWorldId] = useState(
    DEFAULT_WORLD_CATALOG.defaultWorldId,
  );
  const selectedWorldIdRef = useRef(selectedWorldId);
  selectedWorldIdRef.current = selectedWorldId;
  const [monitorSettings, setMonitorSettings] =
    useState<MonitorSettings>(loadMonitorSettings);
  const [controlsOpen, setControlsOpen] = useState(
    initiallyShowMonitorControls,
  );
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
  const [sample, setSample] = useState<TelemetrySample | null>(null);
  const [plotSamples, setPlotSamples] = useState<readonly TelemetrySample[]>(
    [],
  );
  const plotSampleHistory = useMemo(
    () =>
      new PlotSampleHistory(
        maximumPlotSamples,
        setPlotSamples,
        (callback) => window.requestAnimationFrame(callback),
        (frameId) => window.cancelAnimationFrame(frameId),
      ),
    [],
  );
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
    "Open or create a project in the IDE to save run data with its source.",
  );
  const [annotations, setAnnotations] = useState<MonitorAnnotation[]>([]);
  const [annotationsVisible, setAnnotationsVisible] = useState(true);
  const [exportState, setExportState] = useState<
    "idle" | "telemetry-csv" | "plots-svg" | "plots-png" | "world-webm"
  >("idle");
  const [exportDetail, setExportDetail] = useState("");
  const nextConsoleId = useRef(1);
  const autosaveFolderRef = useRef<CourseDirectoryHandle | null>(null);
  const autosaveFolderEpoch = useRef(0);
  const autosaveFolderRemembered = useRef(false);
  const currentProjectRef = useRef<SynchronizedProject | null>(null);
  const annotationsRef = useRef<MonitorAnnotation[]>([]);
  const runArchiveQueue = useRef<Promise<void>>(Promise.resolve());
  const targetStateRef = useRef<TargetRunState>("disconnected");
  const runStartingRef = useRef(false);
  const exportActiveRef = useRef(false);
  const runtimeUpdateTimers = useRef(
    new Map<string, ReturnType<typeof setTimeout>>(),
  );
  const projectBootstrapPendingRef = useRef(projectBootstrapPending);
  const folderInteractionCountRef = useRef(0);
  const runArchiveCountRef = useRef(0);
  const targetCommandCountRef = useRef(0);
  const annotationDraftIdsRef = useRef(new Set<string>());
  const telemetryRateSamplesRef = useRef<TelemetrySample[]>([]);
  const nextRunIdRef = useRef(1);

  projectBootstrapPendingRef.current = projectBootstrapPending;

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
    let disposed = false;
    let refreshRevision = 0;
    const refreshFolder = async (preserveUnrememberedFolder = false) => {
      beginFolderInteraction();
      try {
        const revision = ++refreshRevision;
        const folder = await loadRememberedProjectFolder();
        if (disposed || revision !== refreshRevision) {
          return;
        }
        if (folder === null) {
          if (preserveUnrememberedFolder && !autosaveFolderRemembered.current) {
            return;
          }
          autosaveFolderRemembered.current = false;
          autosaveFolderRef.current = null;
          setRememberedAutosaveFolder(null);
          setAutosaveFolder(null);
          setRunAutosaveDetail(
            "Not saved to disk · connect a project folder in the IDE.",
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
          autosaveFolderRef.current = folder;
          setAutosaveFolder(folder);
          setRunAutosaveDetail(`Runs save automatically to ${folder.name}.`);
        } else {
          autosaveFolderRef.current = null;
          setAutosaveFolder(null);
          setRunAutosaveDetail(
            `Reconnect project folder ${folder.name} to resume run saving.`,
          );
        }
      } finally {
        finishFolderInteraction();
      }
    };
    const folderChanged = () => {
      const sharedFolderCanChange = autosaveFolderRemembered.current;
      if (sharedFolderCanChange) {
        // Stop writes immediately; loading the replacement handle is asynchronous.
        autosaveFolderEpoch.current += 1;
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
    };
  }, [beginFolderInteraction, finishFolderInteraction]);

  const archiveCompletedRun = useCallback((run: MonitorRunDataset) => {
    const recording = run.recording;
    const folder = autosaveFolderRef.current;
    const folderEpoch = autosaveFolderEpoch.current;
    if (!folder) {
      setRunAutosaveDetail(
        "Not saved to disk · connect a project folder in the IDE.",
      );
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
      if (
        autosaveFolderRef.current === null ||
        autosaveFolderEpoch.current !== folderEpoch
      ) {
        return false;
      }
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
      })
      .catch((error: unknown) => {
        setRunAutosaveDetail(
          `Run save failed: ${error instanceof Error ? error.message : String(error)}`,
        );
      })
      .finally(() => {
        runArchiveCountRef.current = Math.max(
          0,
          runArchiveCountRef.current - 1,
        );
        retryPendingOfflineShellReload();
      });
  }, []);

  const finishActiveRun = useCallback(
    (finalState: TargetRunState, finalDetail: string) => {
      const run = runDatasetController.complete(
        finalState,
        finalDetail,
        new Date().toISOString(),
      );
      if (!run) return null;
      setActiveRunId(null);
      setLatestRun(run);
      annotationsRef.current = [...run.annotations];
      setAnnotations([...run.annotations]);
      setPlotSamples(run.recording.samples);
      archiveCompletedRun(run);
      return run;
    },
    [archiveCompletedRun, runDatasetController],
  );

  const updateSavedRunAnnotations = useCallback((run: MonitorRunDataset) => {
    const folder = autosaveFolderRef.current;
    const folderEpoch = autosaveFolderEpoch.current;
    if (!folder) return;
    const update = runArchiveQueue.current.then(async () => {
      if (
        autosaveFolderRef.current === null ||
        autosaveFolderEpoch.current !== folderEpoch
      ) {
        return;
      }
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
    runDatasetController.clear();
    setActiveRunId(null);
    setLatestRun(null);
    setCurrentProject(null);
    setRuntimeState(emptyRuntimeState);
    setAvailableProgramPlots([]);
    setProgramPlotVisibility({});
    setRuntimeDrafts({});
    setRuntimeUpdateError("");
    nextConsoleId.current = 1;
    const unsubscribe = target.subscribe((event: TargetEvent) => {
      if (event.type === "telemetry") {
        setSample(event.sample);
        const rateSamples = telemetryRateSamplesRef.current;
        const previousRateSample = rateSamples.at(-1);
        if (
          previousRateSample &&
          (previousRateSample.source !== event.sample.source ||
            event.sample.seq <= previousRateSample.seq)
        ) {
          rateSamples.length = 0;
        }
        rateSamples.push(event.sample);
        if (rateSamples.length > 41) rateSamples.shift();

        const capturedByRun = runDatasetController.capture(event.sample);
        if (capturedByRun) {
          const telemetryRestarted = plotSampleHistory.append(event.sample);
          if (telemetryRestarted && !runDatasetController.isActive) {
            annotationsRef.current = [];
            setAnnotations([]);
          }
        }
      } else if (event.type === "status") {
        targetStateRef.current = event.state;
        const nextRunActive = isActiveRunState(event.state);
        if (nextRunActive && !runDatasetController.isActive) {
          const runId = `${target.kind}-${Date.now()}-${nextRunIdRef.current++}`;
          runDatasetController.begin({
            id: runId,
            target: target.kind,
            project: currentProjectRef.current,
            worldId: selectedWorldIdRef.current,
            startedAt: new Date().toISOString(),
          });
          setActiveRunId(runId);
          setLatestRun(null);
          plotSampleHistory.clear();
          annotationsRef.current = [];
          setAnnotations([]);
          setExportDetail("");
          setRunAutosaveDetail(
            autosaveFolderRef.current
              ? `Will save automatically to ${autosaveFolderRef.current.name}.`
              : "Not saved to disk · connect a project folder in the IDE.",
          );
        } else if (!nextRunActive && runDatasetController.isActive) {
          finishActiveRun(event.state, event.detail);
        }
        setTargetState(event.state);
        setTargetDetail(event.detail);
      } else if (event.type === "physical-network") {
        updateTargetPreference((current) =>
          targetPreferenceForPhysicalNetwork(current, event),
        );
      } else if (event.type === "project") {
        const projectChanged =
          currentProjectRef.current?.revision !== event.project?.revision;
        currentProjectRef.current = event.project;
        if (
          projectChanged &&
          runDatasetController.isActive &&
          !runDatasetController.acceptProject(event.project)
        ) {
          finishActiveRun(
            "ready",
            "Run data ended because the project changed",
          );
        }
        if (projectChanged && !runDatasetController.isActive) {
          runDatasetController.clear();
          setLatestRun(null);
          plotSampleHistory.clear();
          annotationsRef.current = [];
          setAnnotations([]);
        }
        setCurrentProject(event.project);
      } else if (event.type === "project-provider") {
        setProjectProviderAvailable(event.available);
      } else if (event.type === "runtime") {
        setRuntimeState(event.state);
        if (event.state.plots.length > 0) {
          setAvailableProgramPlots(event.state.plots);
          setProgramPlotVisibility((current) =>
            Object.fromEntries(
              event.state.plots.map((plot) => [
                plot.name,
                current[plot.name] ?? false,
              ]),
            ),
          );
        }
      } else if (event.type === "world") {
        setWorldCatalog(event.catalog);
        setSelectedWorldId(event.selectedWorldId);
      } else if (event.type === "console") {
        const entry = {
          id: event.eventId ?? `monitor-target-${nextConsoleId.current++}`,
          stream: event.stream,
          line: event.line,
        };
        runDatasetController.addOutput(entry);
      }
    });
    beginTargetCommand();
    targetStateRef.current = "connecting";
    setTargetState("connecting");
    setSample(null);
    telemetryRateSamplesRef.current = [];
    plotSampleHistory.clear();
    annotationsRef.current = [];
    setAnnotations([]);
    currentProjectRef.current = null;
    setProjectProviderAvailable(false);
    let disposed = false;
    const connect = async () => {
      try {
        await target.connect();
      } catch (error: unknown) {
        if (!disposed) {
          targetStateRef.current = "error";
          setTargetState("error");
          setTargetDetail(
            error instanceof Error ? error.message : String(error),
          );
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
      plotSampleHistory.clear(false);
      target.disconnect();
    };
  }, [
    beginTargetCommand,
    finishActiveRun,
    finishTargetCommand,
    plotSampleHistory,
    runDatasetController,
    target,
  ]);

  const reset = async () => {
    finishActiveRun("ready", "Run ended by Reset");
    runDatasetController.clear();
    setActiveRunId(null);
    setLatestRun(null);
    plotSampleHistory.clear();
    annotationsRef.current = [];
    setAnnotations([]);
    setExportDetail("");
    beginTargetCommand();
    try {
      await target.reset();
    } catch (error: unknown) {
      targetStateRef.current = "error";
      setTargetState("error");
      setTargetDetail(error instanceof Error ? error.message : String(error));
    } finally {
      finishTargetCommand();
    }
  };

  const canRunCurrent =
    !virtualRuntimePreparing &&
    !projectBootstrapPending &&
    (targetState === "ready" ||
      (target.kind === "virtual" && targetState === "error")) &&
    (projectProviderAvailable || target.kind === "virtual");

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
        try {
          await target.runCurrent();
        } catch (error) {
          if (
            target.kind !== "virtual" ||
            !(error instanceof Error) ||
            (!error.message.includes("No project is ready") &&
              !error.message.includes("No active IDE project"))
          ) {
            throw error;
          }
          setTargetDetail(
            `Compiling ${DEFAULT_COURSE_PROJECT.name ?? "the default project"}…`,
          );
          await target.run(DEFAULT_COURSE_PROJECT);
        }
      }
    } catch (error: unknown) {
      targetStateRef.current = "error";
      setTargetState("error");
      setTargetDetail(error instanceof Error ? error.message : String(error));
    } finally {
      runStartingRef.current = false;
      setRunStarting(false);
      finishTargetCommand();
    }
  };

  const changeWorld = async (nextWorldId: string) => {
    finishActiveRun("ready", "Run ended because the world changed");
    clearDisplayedRun();
    setSelectedWorldId(nextWorldId);
    beginTargetCommand();
    try {
      await target.setSimulationScenario?.(nextWorldId);
    } catch (error: unknown) {
      targetStateRef.current = "error";
      setTargetState("error");
      setTargetDetail(error instanceof Error ? error.message : String(error));
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
        return;
      }
      setAutosaveFolder(rememberedAutosaveFolder);
      setRunAutosaveDetail(
        `Runs save automatically to ${rememberedAutosaveFolder.name}.`,
      );
    } catch (error: unknown) {
      if (!wasCancelled(error)) {
        setRunAutosaveDetail(
          `Folder reconnection failed: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    } finally {
      finishFolderInteraction();
    }
  };

  const clearDisplayedRun = () => {
    runDatasetController.clear();
    setActiveRunId(null);
    setLatestRun(null);
    plotSampleHistory.clear();
    annotationsRef.current = [];
    setAnnotations([]);
    setExportDetail("");
    retryPendingOfflineShellReload();
  };

  const exportRecording = async () => {
    if (!latestRun) return;
    exportActiveRef.current = true;
    setExportState("telemetry-csv");
    try {
      const fileName = timestampedName("xrp-telemetry", "csv");
      const destination = await prepareExportDestination(
        autosaveFolder,
        fileName,
        "text/csv",
      );
      if (!destination) return;
      const csv = monitorRunToCsv(latestRun.recording, latestRun.annotations);
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
      await destination.save(blob);
      setExportDetail(`Saved ${destination.description}`);
    } catch (error) {
      setExportDetail(error instanceof Error ? error.message : String(error));
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
      setRuntimeUpdateError(
        error instanceof Error ? error.message : String(error),
      );
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

  const programPlotDefinitions = availableProgramPlots.map(
    runtimePlotDefinition,
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

  const displayedRunSamples = latestRun?.recording.samples ?? plotSamples;

  const exportPlots = async (format: "svg" | "png") => {
    if (visiblePlots.length === 0 || displayedRunSamples.length === 0) return;
    const nextState = format === "svg" ? "plots-svg" : "plots-png";
    exportActiveRef.current = true;
    setExportState(nextState);
    try {
      const fileName = timestampedName("xrp-plots", format);
      const destination = await prepareExportDestination(
        autosaveFolder,
        fileName,
        format === "svg" ? "image/svg+xml" : "image/png",
      );
      if (!destination) return;
      setExportDetail(`Preparing ${format.toUpperCase()}…`);
      const { createSignalPlotsSvg, svgToPng } = await loadMonitorExport();
      const svg = createSignalPlotsSvg(
        displayedRunSamples,
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
    } catch (error) {
      setExportDetail(error instanceof Error ? error.message : String(error));
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
        autosaveFolder,
        fileName,
        "video/webm",
      );
      if (!destination) return;
      setExportDetail("Preparing world animation…");
      const { createWorldReplayWebm } = await loadMonitorExport();
      let shownProgress = -1;
      const blob = await createWorldReplayWebm({
        samples: latestRun.recording.samples,
        annotations: annotationsVisible ? latestRun.annotations : [],
        world:
          worldCatalog.worlds.find((world) => world.id === selectedWorldId) ??
          worldCatalog.worlds[0]!,
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
    } catch (error) {
      setExportDetail(error instanceof Error ? error.message : String(error));
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
          projectBootstrapPending: projectBootstrapPendingRef.current,
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
        projectBootstrapPending,
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
    projectBootstrapPending,
    activeRunId,
    latestRun,
    runStarting,
  ]);
  const worldPreviewSample = useMemo(
    () => centeredWorldPreview(target.kind),
    [target.kind],
  );
  const worldSample = sample?.poseAvailable ? sample : worldPreviewSample;
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

  return (
    <div className={`app-shell ${embeddedApplication ? "embedded-app" : ""}`}>
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
                  : projectBootstrapPending
                    ? "Opening the saved IDE project before Run."
                    : runStarting
                      ? "Compiling the default project before Run."
                      : !projectProviderAvailable && target.kind === "physical"
                        ? "Open the IDE to choose the project for the physical XRP."
                        : !projectProviderAvailable
                          ? `Compile and run ${DEFAULT_COURSE_PROJECT.name ?? "the default project"}.`
                          : currentProject?.stale
                            ? `Compile and run the current IDE project: ${currentProject.name}.`
                            : currentProject
                              ? `Run ${currentProject.name} (${currentProject.entrypoint}, ${currentProject.revision.slice(0, 8)}).`
                              : target.kind === "virtual"
                                ? `Compile and run ${DEFAULT_COURSE_PROJECT.name ?? "the default project"}.`
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
              {targetState}
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
          <OfflineReadiness
            appName="Monitor"
            pendingUpdateDetail="A newer UCSBXRP release is ready. Finish the current run or export, then clear the displayed run; Monitor will reopen on the new release."
          />
        </div>
      </header>

      <div
        className={`monitor-workspace ${controlsOpen ? "controls-open" : "controls-collapsed"}`}
      >
        <aside
          aria-label="Monitor controls"
          className="monitor-controls"
          data-testid="monitor-controls"
          ref={controlsRef}
        >
          {controlsOpen ? (
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
                {target.kind === "physical" && targetState === "error" ? (
                  <div className="target-recovery" role="alert">
                    <strong>XRP not reachable</strong>
                    <p>
                      {targetPreference.physicalConnection === "access_point"
                        ? "Run and telemetry use Wi-Fi, not USB. Join the UCSB-XRP hotspot. The Monitor remains available while this computer is connected to the robot hotspot."
                        : "Run and telemetry use Wi-Fi, not USB. Connect this computer to the same local Wi-Fi as the XRP."}
                    </p>
                    <a href="../ide/" target="_blank" rel="noopener noreferrer">
                      Connection settings in IDE ↗
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
                      onClick={clearDisplayedRun}
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
                          ? `Last run · ${latestRun.recording.samples.length.toLocaleString()} samples · ${completedRunDurationS.toFixed(1)} s`
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
                          displayedRunSamples.length === 0 ||
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
                          displayedRunSamples.length === 0 ||
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
          ) : (
            <button
              aria-label="Open monitor controls"
              className="monitor-controls-restore"
              onClick={() => setControlsOpen(true)}
              title="Open plot, run-data, and export controls."
            >
              <span>controls</span>
              <b aria-hidden="true">›</b>
            </button>
          )}
        </aside>

        <main className="dashboard-grid" style={layoutStyle}>
          <div className="dashboard-region top-region" style={topRegionStyle}>
            <section className="world-panel dashboard-pane">
              <WorldView
                annotations={annotations}
                catalog={worldCatalog}
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
                      <dd data-testid="range-mm">{value(sample.rangeMm)} mm</dd>
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

          <ResizableSeparator
            label="Resize upper and lower monitor regions"
            maximum={75}
            minimum={35}
            onChange={(next) => setLayoutValue("topHeightPercent", next)}
            orientation="horizontal"
            value={monitorSettings.layout.topHeightPercent}
          />

          <div className="dashboard-region bottom-region">
            <section
              aria-label="Signal histories"
              className="plots-panel dashboard-pane"
            >
              {sample && visiblePlots.length > 0 ? (
                <div className="strip-chart-stack">
                  {visiblePlots.map((plot) => (
                    <section className="strip-chart" key={plot.id}>
                      <SignalPlot
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
              ) : (
                <div className="telemetry-placeholder" role="status">
                  {sample
                    ? "Choose at least one signal in Controls."
                    : "Signal histories appear when telemetry connects."}
                </div>
              )}
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}
