import { useEffect, useMemo, useRef, useState } from "react";

import {
  VirtualTargetClient,
  type TargetEvent,
  type TargetRunState,
  type TelemetrySample,
} from "@ucsb-xrp/target";

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
  const [sample, setSample] = useState<TelemetrySample | null>(null);
  const [targetState, setTargetState] =
    useState<TargetRunState>("disconnected");
  const [targetDetail, setTargetDetail] = useState("Not connected");
  const [consoleEntries, setConsoleEntries] = useState<ConsoleEntry[]>([]);
  const nextConsoleId = useRef(1);

  useEffect(() => {
    const unsubscribe = target.subscribe((event: TargetEvent) => {
      if (event.type === "telemetry") {
        setSample(event.sample);
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
  }, [target]);

  const reset = async () => {
    await target.reset();
    setConsoleEntries([]);
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
          <a className="tool-link" href="/ide/">
            Back to IDE
          </a>
          <a
            className="tool-link"
            href="/guide/"
            rel="noopener noreferrer"
            target="_blank"
          >
            Help &amp; robot setup ↗
          </a>
        </div>
        <div
          className="connection-pill"
          data-testid="target-status"
          title={targetDetail}
        >
          <span className={`status-dot ${targetState}`} />
          <span>Virtual XRP · {targetState}</span>
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
                  {value(sample.leftEffort, 2)} / {value(sample.rightEffort, 2)}
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
