import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";

import {
  PhysicalTargetClient,
  TelemetryRecorder,
  VirtualTargetClient,
  loadTargetPreference,
  millidegreesPerSecondToRadiansPerSecond,
  milligravityToMetersPerSecondSquared,
  storeTargetPreference,
  telemetryRecordingToCsv,
  type TargetClient,
  type TargetEvent,
  type TargetRunState,
  type TelemetrySample,
  type SimulationScenario,
  type SynchronizedProject,
  type RuntimeParameterValue,
  type RuntimeState,
} from "@ucsb-xrp/target";

import { OfflineReadiness } from "../../shared/OfflineReadiness";
import { ResizableSeparator } from "../../shared/ResizableSeparator";
import {
  chooseCourseFolder,
  courseFolderChangedKey,
  courseFolderPermission,
  loadRememberedCourseFolder,
  rememberCourseFolder,
  requestCourseFolderPermission,
  withCourseFolderWriteLock,
  writeRotatingTextBundle,
  type CourseDirectoryHandle,
} from "../../shared/course-folder";
import { SIGNAL_PLOTS, SignalPlot, type SignalPlotId } from "./SignalPlot";
import { WorldView } from "./WorldView";

interface ConsoleEntry {
  id: number;
  stream: "stdout" | "stderr" | "system";
  line: string;
}

const simulationScenarioKey = "ucsb-xrp-simulation-scenario-v1";
const monitorSettingsKey = "ucsb-xrp-monitor-settings-v2";
const maximumPlotSamples = 1_200;
const lastArchivedRunKey = "ucsb-xrp-last-archived-run-v1";
const emptyRuntimeState: RuntimeState = {
  revision: 0,
  parameters: [],
  watches: [],
};

function isActiveRunState(state: TargetRunState): boolean {
  return state === "loading" || state === "running";
}

function wasCancelled(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError";
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
    "motor-effort": true,
    range: false,
    acceleration: false,
    "angular-rate": false,
  },
  layout: {
    topHeightPercent: 57,
    worldWidthPercent: 82,
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
          84,
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

function loadSimulationScenario(): SimulationScenario {
  const stored = window.localStorage.getItem(simulationScenarioKey);
  return stored === "delivery-gate-blocked" ? stored : "open";
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
  const [targetPreference, setTargetPreference] =
    useState(loadTargetPreference);
  const [simulationScenario, setSimulationScenario] = useState(
    loadSimulationScenario,
  );
  const [monitorSettings, setMonitorSettings] =
    useState<MonitorSettings>(loadMonitorSettings);
  const [controlsOpen, setControlsOpen] = useState(
    initiallyShowMonitorControls,
  );
  const simulationScenarioRef = useRef(simulationScenario);
  const target = useMemo<TargetClient>(
    () =>
      targetPreference.kind === "physical"
        ? new PhysicalTargetClient(targetPreference.physicalEndpoint)
        : new VirtualTargetClient(),
    [targetPreference.kind, targetPreference.physicalEndpoint],
  );
  const recorder = useMemo(() => new TelemetryRecorder(), []);
  const automaticRecorder = useMemo(() => new TelemetryRecorder(), []);
  const [sample, setSample] = useState<TelemetrySample | null>(null);
  const [plotSamples, setPlotSamples] = useState<readonly TelemetrySample[]>(
    [],
  );
  const [targetState, setTargetState] =
    useState<TargetRunState>("disconnected");
  const [targetDetail, setTargetDetail] = useState("Not connected");
  const [currentProject, setCurrentProject] =
    useState<SynchronizedProject | null>(null);
  const [consoleEntries, setConsoleEntries] = useState<ConsoleEntry[]>([]);
  const [recordingActive, setRecordingActive] = useState(false);
  const [runtimeState, setRuntimeState] =
    useState<RuntimeState>(emptyRuntimeState);
  const [runtimeDrafts, setRuntimeDrafts] = useState<
    Record<string, RuntimeParameterValue>
  >({});
  const [runtimeUpdateError, setRuntimeUpdateError] = useState("");
  const [liveProgramOpen, setLiveProgramOpen] = useState(false);
  const [recordedSamples, setRecordedSamples] = useState(0);
  const [droppedSamples, setDroppedSamples] = useState(0);
  const [autosaveFolder, setAutosaveFolder] =
    useState<CourseDirectoryHandle | null>(null);
  const [rememberedAutosaveFolder, setRememberedAutosaveFolder] =
    useState<CourseDirectoryHandle | null>(null);
  const [runAutosaveDetail, setRunAutosaveDetail] = useState(
    "Choose a project folder in the IDE, or choose a data folder here.",
  );
  const nextConsoleId = useRef(1);
  const autosaveFolderRef = useRef<CourseDirectoryHandle | null>(null);
  const currentProjectRef = useRef<SynchronizedProject | null>(null);
  const automaticRunActive = useRef(false);
  const automaticRunStartedAt = useRef("");
  const automaticRunProject = useRef<SynchronizedProject | null>(null);
  const automaticRunOutput = useRef<ConsoleEntry[]>([]);
  const runArchiveQueue = useRef<Promise<void>>(Promise.resolve());
  const runtimeUpdateTimers = useRef(
    new Map<string, ReturnType<typeof setTimeout>>(),
  );
  const openedLiveProgram = useRef(false);

  useEffect(() => {
    storeTargetPreference(targetPreference);
  }, [targetPreference]);

  useEffect(() => {
    if (targetState === "running") {
      return;
    }
    for (const timer of runtimeUpdateTimers.current.values()) {
      clearTimeout(timer);
    }
    runtimeUpdateTimers.current.clear();
    setRuntimeDrafts({});
  }, [targetState]);

  useEffect(() => {
    simulationScenarioRef.current = simulationScenario;
    window.localStorage.setItem(simulationScenarioKey, simulationScenario);
  }, [simulationScenario]);

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
    let disposed = false;
    const refreshFolder = async () => {
      const folder = await loadRememberedCourseFolder();
      if (disposed || folder === null) {
        return;
      }
      setRememberedAutosaveFolder(folder);
      const permission = await courseFolderPermission(folder);
      if (disposed) {
        return;
      }
      if (permission === "granted") {
        setAutosaveFolder(folder);
        setRunAutosaveDetail(`Runs auto-save to ${folder.name}.`);
      } else {
        setAutosaveFolder(null);
        setRunAutosaveDetail(
          `Reconnect ${folder.name} once to resume run auto-save.`,
        );
      }
    };
    const folderChanged = (event: StorageEvent) => {
      if (event.key === courseFolderChangedKey) {
        void refreshFolder();
      }
    };
    void refreshFolder();
    window.addEventListener("storage", folderChanged);
    return () => {
      disposed = true;
      window.removeEventListener("storage", folderChanged);
    };
  }, []);

  const archiveAutomaticRun = useCallback(
    (finalState: TargetRunState, finalDetail: string) => {
      if (!automaticRunActive.current) {
        return;
      }
      automaticRunActive.current = false;
      const recording = automaticRecorder.stop();
      const folder = autosaveFolderRef.current;
      const startedAt = automaticRunStartedAt.current;
      const finishedAt = new Date().toISOString();
      const projectAtStart = automaticRunProject.current;
      const output = automaticRunOutput.current;
      automaticRunOutput.current = [];
      if (!folder) {
        setRunAutosaveDetail(
          "Run finished; browser data remains visible, but no auto-save folder is connected.",
        );
        return;
      }

      const firstSample = recording.samples[0];
      const lastSample = recording.samples.at(-1);
      const fingerprint = JSON.stringify({
        source: target.kind,
        revision: projectAtStart?.revision ?? null,
        first: firstSample ? [firstSample.seq, firstSample.tMs] : null,
        last: lastSample ? [lastSample.seq, lastSample.tMs] : null,
        outputCount: output.length,
        firstOutput: output[0]?.line ?? null,
        lastOutput: output.at(-1)?.line ?? null,
      });
      const metadata = {
        schemaVersion: 1,
        startedAt,
        finishedAt,
        target: target.kind,
        finalState,
        finalDetail,
        project: projectAtStart,
        telemetrySamples: recording.samples.length,
        droppedTelemetrySamples: recording.droppedSamples,
      };
      const outputText = [
        "UCSB XRP monitored run",
        `Started: ${startedAt}`,
        `Finished: ${finishedAt}`,
        `Target: ${target.kind}`,
        `Project: ${projectAtStart?.name ?? "unavailable"}`,
        `Result: ${finalState} · ${finalDetail}`,
        "",
        ...output.map((entry) => `[${entry.stream}] ${entry.line}`),
        "",
      ].join("\n");

      const writeArchive = async () => {
        try {
          if (localStorage.getItem(lastArchivedRunKey) === fingerprint) {
            return;
          }
        } catch {
          // The folder write remains useful when localStorage is unavailable.
        }
        await writeRotatingTextBundle(folder, [
          { baseName: "run", extension: "txt", content: outputText },
          {
            baseName: "telemetry",
            extension: "csv",
            content: telemetryRecordingToCsv(recording),
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
      };

      const queued = runArchiveQueue.current.then(async () => {
        await withCourseFolderWriteLock("run", writeArchive);
      });
      runArchiveQueue.current = queued.then(
        () => undefined,
        () => undefined,
      );
      void queued
        .then(() => {
          setRunAutosaveDetail(
            `Saved ${recording.samples.length} telemetry samples and program output to ${folder.name}.`,
          );
        })
        .catch((error: unknown) => {
          setRunAutosaveDetail(
            `Run auto-save failed: ${error instanceof Error ? error.message : String(error)}`,
          );
        });
    },
    [automaticRecorder, target.kind],
  );

  useEffect(() => {
    const updateFromOtherApp = (event: StorageEvent) => {
      if (event.key === "ucsb-xrp-target-v1") {
        setTargetPreference(loadTargetPreference());
      }
    };
    window.addEventListener("storage", updateFromOtherApp);
    return () => window.removeEventListener("storage", updateFromOtherApp);
  }, []);

  useEffect(() => {
    setConsoleEntries([]);
    setCurrentProject(null);
    setRuntimeState(emptyRuntimeState);
    setRuntimeDrafts({});
    setRuntimeUpdateError("");
    nextConsoleId.current = 1;
    const unsubscribe = target.subscribe((event: TargetEvent) => {
      if (event.type === "telemetry") {
        setSample(event.sample);
        setPlotSamples((samples) => {
          const previous = samples.at(-1);
          if (
            previous?.seq === event.sample.seq &&
            previous.source === event.sample.source
          ) {
            return samples;
          }
          const retained =
            previous &&
            (event.sample.seq < previous.seq ||
              event.sample.source !== previous.source)
              ? []
              : samples.slice(-(maximumPlotSamples - 1));
          return [...retained, event.sample];
        });
        recorder.capture(event.sample);
        automaticRecorder.capture(event.sample);
        if (recorder.isRecording) {
          setRecordedSamples(recorder.sampleCount);
          setDroppedSamples(recorder.droppedSampleCount);
        }
      } else if (event.type === "status") {
        const nextRunActive = isActiveRunState(event.state);
        if (nextRunActive && !automaticRunActive.current) {
          automaticRunActive.current = true;
          automaticRunStartedAt.current = new Date().toISOString();
          automaticRunProject.current = currentProjectRef.current;
          automaticRunOutput.current = [];
          automaticRecorder.start();
          setRunAutosaveDetail(
            autosaveFolderRef.current
              ? `Capturing this run for ${autosaveFolderRef.current.name}…`
              : "Capturing this run in the Monitor; no auto-save folder is connected.",
          );
        } else if (!nextRunActive && automaticRunActive.current) {
          archiveAutomaticRun(event.state, event.detail);
        }
        setTargetState(event.state);
        setTargetDetail(event.detail);
      } else if (event.type === "project") {
        currentProjectRef.current = event.project;
        if (
          automaticRunActive.current &&
          automaticRunProject.current === null
        ) {
          automaticRunProject.current = event.project;
        }
        setCurrentProject(event.project);
      } else if (event.type === "runtime") {
        setRuntimeState(event.state);
        if (
          !openedLiveProgram.current &&
          (event.state.parameters.length > 0 || event.state.watches.length > 0)
        ) {
          openedLiveProgram.current = true;
          setRuntimeUpdateError("");
          setLiveProgramOpen(true);
        }
      } else if (event.type === "console") {
        const entry = {
          id: nextConsoleId.current++,
          stream: event.stream,
          line: event.line,
        };
        if (automaticRunActive.current) {
          automaticRunOutput.current = [
            ...automaticRunOutput.current.slice(-1_999),
            entry,
          ];
        }
        setConsoleEntries((entries) => [...entries.slice(-99), entry]);
      }
    });
    setTargetState("connecting");
    setSample(null);
    setPlotSamples([]);
    currentProjectRef.current = null;
    let disposed = false;
    const connect = async () => {
      try {
        await target.connect();
        if (target.kind === "virtual") {
          await target.setSimulationScenario?.(simulationScenarioRef.current);
        }
      } catch (error: unknown) {
        if (!disposed) {
          setTargetState("error");
          setTargetDetail(
            error instanceof Error ? error.message : String(error),
          );
        }
      }
    };
    void connect();
    return () => {
      disposed = true;
      if (automaticRunActive.current) {
        archiveAutomaticRun("disconnected", "Target connection changed");
      }
      unsubscribe();
      for (const timer of runtimeUpdateTimers.current.values()) {
        clearTimeout(timer);
      }
      runtimeUpdateTimers.current.clear();
      target.disconnect();
    };
  }, [archiveAutomaticRun, automaticRecorder, recorder, target]);

  const reset = async () => {
    try {
      await target.reset();
      setConsoleEntries([]);
    } catch (error: unknown) {
      setTargetState("error");
      setTargetDetail(error instanceof Error ? error.message : String(error));
    }
  };

  const runOrStop = async () => {
    try {
      if (targetState === "running" || targetState === "loading") {
        await target.stop();
      } else {
        await target.runCurrent();
      }
    } catch (error: unknown) {
      setTargetState("error");
      setTargetDetail(error instanceof Error ? error.message : String(error));
    }
  };

  const changeSimulationScenario = async (nextScenario: SimulationScenario) => {
    setSimulationScenario(nextScenario);
    try {
      await target.setSimulationScenario?.(nextScenario);
    } catch (error: unknown) {
      setTargetState("error");
      setTargetDetail(error instanceof Error ? error.message : String(error));
    }
  };

  const chooseRunAutosaveFolder = async () => {
    try {
      const folder = await chooseCourseFolder();
      setRememberedAutosaveFolder(folder);
      setAutosaveFolder(folder);
      setRunAutosaveDetail(`Runs auto-save to ${folder.name}.`);
      void rememberCourseFolder(folder);
    } catch (error: unknown) {
      if (!wasCancelled(error)) {
        setRunAutosaveDetail(
          `Folder selection failed: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }
  };

  const reconnectRunAutosaveFolder = async () => {
    if (!rememberedAutosaveFolder) {
      return;
    }
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
        `Runs auto-save to ${rememberedAutosaveFolder.name}.`,
      );
    } catch (error: unknown) {
      if (!wasCancelled(error)) {
        setRunAutosaveDetail(
          `Folder reconnection failed: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }
  };

  const startRecording = () => {
    recorder.start();
    setRecordingActive(true);
    setRecordedSamples(0);
    setDroppedSamples(0);
  };

  const stopRecording = () => {
    const recording = recorder.stop();
    setRecordingActive(false);
    setRecordedSamples(recording.samples.length);
    setDroppedSamples(recording.droppedSamples);
  };

  const clearRecording = () => {
    recorder.clear();
    setRecordingActive(false);
    setRecordedSamples(0);
    setDroppedSamples(0);
  };

  const exportRecording = () => {
    const csv = telemetryRecordingToCsv(recorder.snapshot());
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const timestamp = new Date().toISOString().replaceAll(":", "-");
    link.href = url;
    link.download = `xrp-telemetry-${timestamp}.csv`;
    document.body.append(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
  };

  const commitRuntimeParameter = async (
    name: string,
    nextValue: RuntimeParameterValue,
  ) => {
    setRuntimeUpdateError("");
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

  const visiblePlots = SIGNAL_PLOTS.filter(
    (plot) => monitorSettings.plots[plot.id],
  );

  const setPlotVisible = (id: SignalPlotId, visible: boolean) => {
    setMonitorSettings((current) => ({
      ...current,
      plots: { ...current.plots, [id]: visible },
    }));
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
  const bottomRegionStyle = {
    "--monitor-primary-width": `${monitorSettings.layout.plotsWidthPercent}%`,
  } as CSSProperties;
  const isRunning = targetState === "running" || targetState === "loading";
  const canRunCurrent =
    (targetState === "ready" || targetState === "error") &&
    currentProject !== null &&
    !currentProject.stale;
  const worldPreviewSample = useMemo(
    () => centeredWorldPreview(target.kind),
    [target.kind],
  );
  const worldSample = sample?.poseAvailable ? sample : worldPreviewSample;

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="brand" aria-label="UCSBXRP Monitor">
          <span className="brand-mark">UCSB</span>
          <span className="brand-name">XRP Monitor</span>
        </div>
        <div className="toolbar">
          <button
            className={`monitor-run-button ${isRunning ? "danger-button" : "primary-button"}`}
            disabled={!isRunning && !canRunCurrent}
            onClick={runOrStop}
            title={
              isRunning
                ? "Stop the running program."
                : currentProject?.stale
                  ? "The IDE project changed. Run or synchronize it in the IDE first."
                  : currentProject
                    ? `Run ${currentProject.name} (${currentProject.entrypoint}, ${currentProject.revision.slice(0, 8)}).`
                    : "Run or synchronize a project in the IDE first."
            }
          >
            {isRunning ? "Stop" : "Run"}
          </button>
          <button
            disabled={
              targetState === "disconnected" || targetState === "connecting"
            }
            onClick={reset}
            title="Restart the target and restore its initial state."
          >
            Reset
          </button>
          <div className="toolbar-spacer" />
          <nav aria-label="Application links" className="header-nav">
            <a
              className="tool-link"
              href="../ide/"
              rel="noopener noreferrer"
              target="_blank"
              title="Open the IDE in a new tab."
            >
              IDE ↗
            </a>
            <span aria-hidden="true" className="header-link-separator">
              |
            </span>
          </nav>
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
        </div>
      </header>

      <div
        className={`monitor-workspace ${controlsOpen ? "controls-open" : "controls-collapsed"}`}
      >
        <aside
          aria-label="Monitor controls"
          className="monitor-controls"
          data-testid="monitor-controls"
        >
          {controlsOpen ? (
            <div className="monitor-controls-panel">
              <div className="monitor-controls-cap">
                <strong>Controls</strong>
                <button
                  aria-label="Collapse monitor controls"
                  className="monitor-controls-collapse"
                  onClick={() => setControlsOpen(false)}
                  title="Collapse display and recording controls."
                >
                  ‹
                </button>
              </div>
              <div className="monitor-controls-scroll">
                <section
                  aria-labelledby="signal-controls-title"
                  className="monitor-control-group"
                >
                  <h2 id="signal-controls-title">Signals</h2>
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
                </section>

                <details
                  className="monitor-control-group live-program-group"
                  onToggle={(event) =>
                    setLiveProgramOpen(event.currentTarget.open)
                  }
                  open={liveProgramOpen}
                >
                  <summary title="Adjust parameters declared by the running program.">
                    <span>Live controls</span>
                    <small>{runtimeState.parameters.length} controls</small>
                  </summary>
                  <div className="live-program-content">
                    {runtimeState.parameters.length === 0 ? (
                      <p className="live-program-empty">
                        A running project can declare compact controls here.
                      </p>
                    ) : (
                      <div
                        aria-label="Live control parameters"
                        className="runtime-parameters"
                      >
                        {runtimeState.parameters.map((parameter) => {
                          const shownValue =
                            runtimeDrafts[parameter.name] ??
                            parameter.pendingValue ??
                            parameter.value;
                          if (parameter.kind === "number") {
                            return (
                              <label
                                className="runtime-number"
                                data-pending={
                                  parameter.pendingValue !== undefined ||
                                  runtimeDrafts[parameter.name] !== undefined
                                }
                                data-runtime-parameter={parameter.name}
                                data-runtime-value={String(shownValue)}
                                key={parameter.name}
                                title={`Adjust ${parameter.label.toLowerCase()} while the program runs. The value is applied at its next sample boundary.`}
                              >
                                <span>{parameter.label}</span>
                                <output>
                                  {Number(shownValue).toLocaleString(
                                    undefined,
                                    {
                                      maximumFractionDigits: 4,
                                    },
                                  )}
                                  {parameter.unit ? ` ${parameter.unit}` : ""}
                                </output>
                                <input
                                  aria-label={parameter.label}
                                  disabled={targetState !== "running"}
                                  max={parameter.maximum}
                                  min={parameter.minimum}
                                  onChange={(event) =>
                                    setRuntimeParameter(
                                      parameter.name,
                                      Number(event.target.value),
                                      true,
                                    )
                                  }
                                  step={parameter.step}
                                  type="range"
                                  value={Number(shownValue)}
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
                                  runtimeDrafts[parameter.name] !== undefined
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
                                    setRuntimeParameter(
                                      parameter.name,
                                      event.target.checked,
                                    )
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
                                runtimeDrafts[parameter.name] !== undefined
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
                                      onChange={() =>
                                        setRuntimeParameter(
                                          parameter.name,
                                          option,
                                        )
                                      }
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
                    {runtimeUpdateError ? (
                      <p className="runtime-update-error" role="alert">
                        {runtimeUpdateError}
                      </p>
                    ) : null}
                  </div>
                </details>

                <section
                  aria-labelledby="recording-controls-title"
                  className="monitor-control-group"
                >
                  <h2 id="recording-controls-title">Recording</h2>
                  <div className="recording-summary" role="status">
                    <strong className={recordingActive ? "active" : ""}>
                      {recordingActive
                        ? "Recording telemetry"
                        : recordedSamples > 0
                          ? "Recording stopped"
                          : "Recorder ready"}
                    </strong>
                    <span data-testid="recording-count">
                      {recordedSamples.toLocaleString()} / 30,000 samples
                      {droppedSamples > 0
                        ? ` · ${droppedSamples.toLocaleString()} older dropped`
                        : ""}
                    </span>
                  </div>
                  <div className="recording-actions">
                    <button
                      disabled={recordingActive || sample === null}
                      onClick={startRecording}
                      title="Begin keeping incoming telemetry in this browser session."
                    >
                      Record
                    </button>
                    <button
                      disabled={!recordingActive}
                      onClick={stopRecording}
                      title="Stop adding samples to the current recording."
                    >
                      Stop
                    </button>
                    <button
                      disabled={recordedSamples === 0}
                      onClick={exportRecording}
                      title="Download the recorded telemetry as a unit-labeled CSV file."
                    >
                      Export CSV
                    </button>
                    <button
                      disabled={recordedSamples === 0 && !recordingActive}
                      onClick={clearRecording}
                      title="Discard the current in-browser recording."
                    >
                      Clear
                    </button>
                  </div>
                  <div className="run-autosave-summary">
                    <span data-testid="run-autosave-status" role="status">
                      {runAutosaveDetail}
                    </span>
                    <button
                      onClick={
                        !autosaveFolder && rememberedAutosaveFolder
                          ? reconnectRunAutosaveFolder
                          : chooseRunAutosaveFolder
                      }
                      title={
                        !autosaveFolder && rememberedAutosaveFolder
                          ? `Restore write access to ${rememberedAutosaveFolder.name}.`
                          : "Choose where monitored run telemetry and output are saved."
                      }
                    >
                      {!autosaveFolder && rememberedAutosaveFolder
                        ? "Reconnect folder"
                        : autosaveFolder
                          ? "Change folder"
                          : "Choose folder"}
                    </button>
                  </div>
                </section>
              </div>
              <div className="monitor-controls-footer">
                <a
                  href="../guide/"
                  rel="noopener noreferrer"
                  target="_blank"
                  title="Open course and robot guidance in a new tab."
                >
                  Guide ↗
                </a>
                <span aria-hidden="true" className="footer-separator">
                  |
                </span>
                <OfflineReadiness />
              </div>
            </div>
          ) : (
            <button
              aria-label="Open monitor controls"
              className="monitor-controls-restore"
              onClick={() => setControlsOpen(true)}
              title="Open signal display and recording controls."
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
                onScenarioChange={
                  target.kind === "virtual"
                    ? (nextScenario) =>
                        void changeSimulationScenario(nextScenario)
                    : undefined
                }
                poseLabel={
                  sample?.poseAvailable
                    ? sample.source === "virtual"
                      ? "virtual pose"
                      : "estimated pose"
                    : "centered preview · no pose"
                }
                sample={worldSample}
                scenario={target.kind === "virtual" ? simulationScenario : null}
                scenarioDisabled={
                  targetState === "loading" || targetState === "running"
                }
              />
            </section>

            <ResizableSeparator
              label="Resize world and live values"
              maximum={84}
              minimum={48}
              onChange={(next) => setLayoutValue("worldWidthPercent", next)}
              orientation="vertical"
              value={monitorSettings.layout.worldWidthPercent}
            />

            <section className="values-panel dashboard-pane">
              <div className="section-heading">
                <h2>Live values</h2>
              </div>
              <div className="values-content">
                {sample ? (
                  <dl className="live-values">
                    {sample.poseAvailable ? (
                      <>
                        <div title="World x position in millimeters.">
                          <dt>x</dt>
                          <dd data-testid="x-mm">{value(sample.xMm)} mm</dd>
                        </div>
                        <div title="World y position in millimeters.">
                          <dt>y</dt>
                          <dd>{value(sample.yMm)} mm</dd>
                        </div>
                        <div title="Counterclockwise heading from world +x.">
                          <dt>heading θ</dt>
                          <dd>{value(sample.headingRad, 3)} rad</dd>
                        </div>
                      </>
                    ) : null}
                    <div title="Measured left and right wheel speed.">
                      <dt>wheel speed L/R</dt>
                      <dd data-testid="left-speed">
                        {value(sample.leftWheelSpeedMmS)} /{" "}
                        {value(sample.rightWheelSpeedMmS)} mm/s
                      </dd>
                    </div>
                    <div title="Dimensionless left and right motor drive command, from −1 to +1.">
                      <dt>drive command uL/uR</dt>
                      <dd data-testid="motor-effort">
                        {value(sample.leftEffort, 2)} /{" "}
                        {value(sample.rightEffort, 2)}
                      </dd>
                    </div>
                    <div title="Raw left and right encoder counts.">
                      <dt>encoder counts L/R</dt>
                      <dd>
                        {sample.leftEncoderCount} / {sample.rightEncoderCount}
                      </dd>
                    </div>
                    <div title="Elapsed program or simulator time.">
                      <dt>time</dt>
                      <dd>{value(sample.tMs / 1000, 2)} s</dd>
                    </div>
                    <div title="Forward ultrasonic distance reading.">
                      <dt>forward range</dt>
                      <dd data-testid="range-mm">{value(sample.rangeMm)} mm</dd>
                    </div>
                    <div title="Current state of the XRP USER button.">
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

          <div
            className="dashboard-region bottom-region"
            style={bottomRegionStyle}
          >
            <section
              aria-label="Signal histories"
              className="plots-panel dashboard-pane"
            >
              {sample && visiblePlots.length > 0 ? (
                <div className="strip-chart-stack">
                  {visiblePlots.map((plot) => (
                    <section className="strip-chart" key={plot.id}>
                      <SignalPlot
                        id={plot.id}
                        samples={plotSamples}
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

            <ResizableSeparator
              label="Resize plots and program output"
              maximum={84}
              minimum={42}
              onChange={(next) => setLayoutValue("plotsWidthPercent", next)}
              orientation="vertical"
              value={monitorSettings.layout.plotsWidthPercent}
            />

            <section className="logs-panel dashboard-pane">
              <div className="section-heading">
                <h2>Program output</h2>
                <button
                  disabled={consoleEntries.length === 0}
                  onClick={() => setConsoleEntries([])}
                  title="Remove visible program and service output."
                >
                  Clear
                </button>
              </div>
              <div className="dashboard-logs" role="log" aria-live="polite">
                {consoleEntries.length === 0 ? (
                  <span className="log-placeholder">
                    Program output appears here when a run starts.
                  </span>
                ) : (
                  consoleEntries.map((entry) => (
                    <div className={`log-line ${entry.stream}`} key={entry.id}>
                      <span>{entry.stream === "stderr" ? "!" : "›"}</span>
                      <span>{entry.line}</span>
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}
