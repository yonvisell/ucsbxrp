import { useEffect, useMemo, useRef, useState } from "react";

import {
  PhysicalTargetClient,
  SIMULATION_SCENARIOS,
  TelemetryRecorder,
  VirtualTargetClient,
  loadTargetPreference,
  storeTargetPreference,
  telemetryRecordingToCsv,
  type TargetClient,
  type TargetEvent,
  type TargetKind,
  type TargetPreference,
  type TargetRunState,
  type TelemetrySample,
  type SimulationScenario,
} from "@ucsb-xrp/target";

import { OfflineReadiness } from "../../shared/OfflineReadiness";
import { SIGNAL_PLOTS, SignalPlot, type SignalPlotId } from "./SignalPlot";
import { WorldView } from "./WorldView";

interface ConsoleEntry {
  id: number;
  stream: "stdout" | "stderr" | "system";
  line: string;
}

const simulationScenarioKey = "ucsb-xrp-simulation-scenario-v1";
const monitorSettingsKey = "ucsb-xrp-monitor-settings-v1";
const maximumPlotSamples = 1_200;

interface MonitorSettings {
  timeWindowS: number;
  plots: Record<SignalPlotId, boolean>;
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
};

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

function vector(values: [number, number, number] | null, digits = 0): string {
  return values ? values.map((item) => value(item, digits)).join(" / ") : "—";
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
  const [sample, setSample] = useState<TelemetrySample | null>(null);
  const [plotSamples, setPlotSamples] = useState<readonly TelemetrySample[]>(
    [],
  );
  const [targetState, setTargetState] =
    useState<TargetRunState>("disconnected");
  const [targetDetail, setTargetDetail] = useState("Not connected");
  const [consoleEntries, setConsoleEntries] = useState<ConsoleEntry[]>([]);
  const [recordingActive, setRecordingActive] = useState(false);
  const [recordedSamples, setRecordedSamples] = useState(0);
  const [droppedSamples, setDroppedSamples] = useState(0);
  const nextConsoleId = useRef(1);

  useEffect(() => {
    storeTargetPreference(targetPreference);
  }, [targetPreference]);

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
    const updateFromOtherApp = (event: StorageEvent) => {
      if (event.key === "ucsb-xrp-target-v1") {
        setTargetPreference(loadTargetPreference());
      }
    };
    window.addEventListener("storage", updateFromOtherApp);
    return () => window.removeEventListener("storage", updateFromOtherApp);
  }, []);

  useEffect(() => {
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
        if (recorder.isRecording) {
          setRecordedSamples(recorder.sampleCount);
          setDroppedSamples(recorder.droppedSampleCount);
        }
      } else if (event.type === "status") {
        setTargetState(event.state);
        setTargetDetail(event.detail);
      } else {
        setConsoleEntries((entries) => [
          ...entries.slice(-99),
          {
            id: nextConsoleId.current++,
            stream: event.stream,
            line: event.line,
          },
        ]);
      }
    });
    setTargetState("connecting");
    setSample(null);
    setPlotSamples([]);
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
      unsubscribe();
      target.disconnect();
    };
  }, [recorder, target]);

  const reset = async () => {
    await target.reset();
    setConsoleEntries([]);
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

  const visiblePlots = SIGNAL_PLOTS.filter(
    (plot) => monitorSettings.plots[plot.id],
  );

  const setPlotVisible = (id: SignalPlotId, visible: boolean) => {
    setMonitorSettings((current) => ({
      ...current,
      plots: { ...current.plots, [id]: visible },
    }));
  };

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="brand" aria-label="UCSB XRP Monitor">
          <span className="brand-mark">UCSB</span>
          <span className="brand-name">XRP Monitor</span>
        </div>
        <div className="toolbar">
          <button
            className="danger-button"
            disabled={targetState !== "running" && targetState !== "loading"}
            onClick={() => target.stop()}
          >
            Stop program
          </button>
          <button
            disabled={
              targetState === "disconnected" || targetState === "connecting"
            }
            onClick={reset}
          >
            {target.kind === "virtual" ? "Reset virtual XRP" : "Reset XRP"}
          </button>
          <div className="toolbar-spacer" />
          <a className="tool-link" href="../ide/">
            Back to IDE
          </a>
          <a
            className="tool-link"
            href="../guide/"
            rel="noopener noreferrer"
            target="_blank"
          >
            Help &amp; robot setup ↗
          </a>
        </div>
        <div className="header-statuses">
          <OfflineReadiness />
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
                <strong>Monitor controls</strong>
                <button
                  aria-label="Collapse monitor controls"
                  className="monitor-controls-collapse"
                  onClick={() => setControlsOpen(false)}
                >
                  ‹
                </button>
              </div>
              <div className="monitor-controls-scroll">
                <fieldset className="monitor-control-group">
                  <legend>Target</legend>
                  <label className="monitor-field">
                    <span>Execution target</span>
                    <select
                      aria-label="Telemetry target"
                      onChange={(event) =>
                        setTargetPreference((current: TargetPreference) => ({
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
                  {target.kind === "virtual" ? (
                    <label className="monitor-field">
                      <span>Course environment</span>
                      <select
                        aria-label="Virtual environment"
                        disabled={
                          targetState === "loading" || targetState === "running"
                        }
                        onChange={(event) =>
                          void changeSimulationScenario(
                            event.target.value as SimulationScenario,
                          )
                        }
                        value={simulationScenario}
                      >
                        {Object.entries(SIMULATION_SCENARIOS).map(
                          ([scenario, configuration]) => (
                            <option key={scenario} value={scenario}>
                              {configuration.label}
                            </option>
                          ),
                        )}
                      </select>
                    </label>
                  ) : (
                    <label className="monitor-field">
                      <span>Robot address</span>
                      <input
                        aria-label="Physical XRP address"
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
                    </label>
                  )}
                  <p className="monitor-control-detail" title={targetDetail}>
                    {targetDetail}
                  </p>
                </fieldset>

                <fieldset className="monitor-control-group">
                  <legend>Scrolling signals</legend>
                  <p className="monitor-control-help">
                    Show only the measurements useful for the current test.
                  </p>
                  <div className="signal-choices">
                    {SIGNAL_PLOTS.map((plot) => (
                      <label className="check-row" key={plot.id}>
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
                    <span>Visible time</span>
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
                      type="range"
                      value={monitorSettings.timeWindowS}
                    />
                  </label>
                </fieldset>

                <fieldset className="monitor-control-group">
                  <legend>Telemetry recording</legend>
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
                    >
                      Start recording
                    </button>
                    <button disabled={!recordingActive} onClick={stopRecording}>
                      Stop recording
                    </button>
                    <button
                      disabled={recordedSamples === 0}
                      onClick={exportRecording}
                    >
                      Export CSV
                    </button>
                    <button
                      disabled={recordedSamples === 0 && !recordingActive}
                      onClick={clearRecording}
                    >
                      Clear recording
                    </button>
                  </div>
                </fieldset>
              </div>
            </div>
          ) : (
            <button
              aria-label="Open monitor controls"
              className="monitor-controls-restore"
              onClick={() => setControlsOpen(true)}
            >
              <span>controls</span>
              <b aria-hidden="true">›</b>
            </button>
          )}
        </aside>

        <main className="dashboard-grid">
          <section className="world-panel panel">
            <div className="panel-header">
              <h2 className="panel-title">World</h2>
              <span className="panel-meta">
                {sample?.poseAvailable
                  ? `${sample.source === "virtual" ? "ground truth" : "estimated pose"} · millimeters`
                  : "waiting for a pose channel"}
              </span>
            </div>
            {sample?.poseAvailable ? (
              <WorldView
                sample={sample}
                scenario={target.kind === "virtual" ? simulationScenario : null}
              />
            ) : sample ? (
              <div className="telemetry-placeholder" role="status">
                Physical sensors are live. The world view will appear when the
                running project publishes an estimated pose.
              </div>
            ) : (
              <div className="telemetry-placeholder" role="status">
                Waiting for the first telemetry sample…
              </div>
            )}
          </section>

          <section className="plots-panel panel">
            <div className="panel-header">
              <h2 className="panel-title">Scrolling signals</h2>
              <span className="panel-meta">
                {visiblePlots.length} shown · {monitorSettings.timeWindowS} s
              </span>
            </div>
            {sample && visiblePlots.length > 0 ? (
              <div className="strip-chart-stack">
                {visiblePlots.map((plot) => (
                  <section className="strip-chart" key={plot.id}>
                    <div className="strip-chart-header">
                      <h3>{plot.label}</h3>
                      <span>{plot.unit}</span>
                    </div>
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
                  ? "Select one or more scrolling signals in Monitor controls."
                  : "Signal histories will appear when telemetry is connected."}
              </div>
            )}
          </section>

          <section className="values-panel panel">
            <div className="panel-header">
              <h2 className="panel-title">Live values</h2>
              <span className="panel-meta">
                {sample ? `seq ${sample.seq}` : "awaiting telemetry"}
              </span>
            </div>
            <div className="values-content">
              {sample ? (
                <dl className="live-values">
                  {sample.poseAvailable ? (
                    <>
                      <div>
                        <dt>x</dt>
                        <dd data-testid="x-mm">{value(sample.xMm)} mm</dd>
                      </div>
                      <div>
                        <dt>y</dt>
                        <dd>{value(sample.yMm)} mm</dd>
                      </div>
                      <div>
                        <dt>heading</dt>
                        <dd>{value(sample.headingRad, 3)} rad</dd>
                      </div>
                    </>
                  ) : null}
                  <div>
                    <dt>left speed</dt>
                    <dd data-testid="left-speed">
                      {value(sample.leftWheelSpeedMmS)} mm/s
                    </dd>
                  </div>
                  <div>
                    <dt>right speed</dt>
                    <dd>{value(sample.rightWheelSpeedMmS)} mm/s</dd>
                  </div>
                  <div>
                    <dt title="Normalized left and right motor commands">
                      motor effort L/R
                    </dt>
                    <dd data-testid="motor-effort">
                      {value(sample.leftEffort, 2)} /{" "}
                      {value(sample.rightEffort, 2)}
                    </dd>
                  </div>
                  <div>
                    <dt>encoders</dt>
                    <dd>
                      {sample.leftEncoderCount} / {sample.rightEncoderCount}
                    </dd>
                  </div>
                  <div>
                    <dt>elapsed time</dt>
                    <dd>{value(sample.tMs / 1000, 2)} s</dd>
                  </div>
                  <div>
                    <dt>range</dt>
                    <dd data-testid="range-mm">{value(sample.rangeMm)} mm</dd>
                  </div>
                  <div>
                    <dt>USER button</dt>
                    <dd>{sample.buttonPressed ? "pressed" : "released"}</dd>
                  </div>
                  <div>
                    <dt>motor supply</dt>
                    <dd>{value(sample.batteryV, 2)} V</dd>
                  </div>
                  <div>
                    <dt>IMU temperature</dt>
                    <dd>{value(sample.temperatureC, 1)} °C</dd>
                  </div>
                  <div>
                    <dt title="Accelerometer x, y, and z axes">
                      acceleration x/y/z
                    </dt>
                    <dd>{vector(sample.accelerationMg)} mg</dd>
                  </div>
                  <div>
                    <dt title="Gyroscope x, y, and z axes">
                      angular rate x/y/z
                    </dt>
                    <dd>{vector(sample.angularRateMdps)} mdps</dd>
                  </div>
                  <div>
                    <dt>collision</dt>
                    <dd
                      className={sample.collision ? "alert-value" : undefined}
                    >
                      {sample.collision ? "contact" : "clear"}
                    </dd>
                  </div>
                  {sample.sensorError ? (
                    <div>
                      <dt>sensor status</dt>
                      <dd className="alert-value">{sample.sensorError}</dd>
                    </div>
                  ) : null}
                </dl>
              ) : (
                <div className="telemetry-placeholder" role="status">
                  No telemetry received yet. Values are intentionally blank.
                </div>
              )}
            </div>
          </section>

          <section className="logs-panel panel">
            <div className="panel-header">
              <h2 className="panel-title">Program output</h2>
              <div className="logs-tools">
                <span className="panel-meta">{targetDetail}</span>
                <button
                  disabled={consoleEntries.length === 0}
                  onClick={() => setConsoleEntries([])}
                >
                  Clear output
                </button>
              </div>
            </div>
            <div className="dashboard-logs" role="log" aria-live="polite">
              {consoleEntries.length === 0 ? (
                <span className="log-placeholder">
                  No run yet. Validate the project in the IDE, then run it on
                  the
                  {target.kind === "virtual" ? " virtual" : " physical"} XRP.
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
        </main>
      </div>
    </div>
  );
}
