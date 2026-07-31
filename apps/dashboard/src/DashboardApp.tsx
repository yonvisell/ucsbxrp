import { useEffect, useMemo, useRef, useState } from "react";

import {
  TelemetryRecorder,
  VirtualTargetClient,
  telemetryRecordingToCsv,
  type TargetEvent,
  type TargetRunState,
  type TelemetrySample,
} from "@ucsb-xrp/target";

import { OfflineReadiness } from "../../shared/OfflineReadiness";
import { SignalPlot } from "./SignalPlot";
import { WorldView } from "./WorldView";

interface ConsoleEntry {
  id: number;
  stream: "stdout" | "stderr" | "system";
  line: string;
}

function value(value: number, digits = 1): string {
  return Number.isFinite(value) ? value.toFixed(digits) : "—";
}

export function DashboardApp() {
  const target = useMemo(() => new VirtualTargetClient(), []);
  const recorder = useMemo(() => new TelemetryRecorder(), []);
  const [sample, setSample] = useState<TelemetrySample | null>(null);
  const [targetState, setTargetState] =
    useState<TargetRunState>("disconnected");
  const [targetDetail, setTargetDetail] = useState("Not connected");
  const [consoleEntries, setConsoleEntries] = useState<ConsoleEntry[]>([]);
  const [recordingActive, setRecordingActive] = useState(false);
  const [recordedSamples, setRecordedSamples] = useState(0);
  const [droppedSamples, setDroppedSamples] = useState(0);
  const nextConsoleId = useRef(1);

  useEffect(() => {
    const unsubscribe = target.subscribe((event: TargetEvent) => {
      if (event.type === "telemetry") {
        setSample(event.sample);
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
    target.connect().catch((error: unknown) => {
      setTargetState("error");
      setTargetDetail(error instanceof Error ? error.message : String(error));
    });
    return () => {
      unsubscribe();
      target.disconnect();
    };
  }, [recorder, target]);

  const reset = async () => {
    await target.reset();
    setConsoleEntries([]);
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
            Reset virtual XRP
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
            <span>Virtual XRP · {targetState}</span>
          </div>
        </div>
      </header>

      <main className="dashboard-grid">
        <section className="world-panel panel">
          <div className="panel-header">
            <h2 className="panel-title">World</h2>
            <span className="panel-meta">ground truth · millimeters</span>
          </div>
          {sample ? (
            <WorldView sample={sample} />
          ) : (
            <div className="telemetry-placeholder" role="status">
              Waiting for the first telemetry sample…
            </div>
          )}
        </section>

        <section className="plot-panel panel">
          <div className="panel-header">
            <h2 className="panel-title">Wheel speed</h2>
            <span className="panel-meta">mm/s</span>
          </div>
          {sample ? (
            <SignalPlot sample={sample} />
          ) : (
            <div className="telemetry-placeholder" role="status">
              Wheel-speed data will appear when telemetry is connected.
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
            <div className="recording-bar" aria-label="Telemetry recording">
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
            </div>
            {sample ? (
              <dl className="live-values">
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
                  <dt>simulated time</dt>
                  <dd>{value(sample.tMs / 1000, 2)} s</dd>
                </div>
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
                No run yet. Validate the project in the IDE, then run it on the
                virtual XRP.
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
  );
}
