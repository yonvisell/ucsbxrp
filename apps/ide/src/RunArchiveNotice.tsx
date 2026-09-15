import { useEffect, useState, useSyncExternalStore } from "react";
import type { TargetClient } from "@ucsb-xrp/target";

import {
  downloadBlob,
  monitorRunToCsv,
} from "../../dashboard/src/monitor-export-core";
import {
  completedRunMetadata,
  completedRunOutput,
} from "../../shared/run-archive-format";
import {
  registerOfflineShellBeforeReload,
  retryPendingOfflineShellReload,
} from "../../shared/offline-shell";
import { RunArchiveRecorder } from "./run-archive-recorder";

export function useRunArchiveRecorder(target: TargetClient) {
  const [recorder] = useState(() => new RunArchiveRecorder());
  const state = useSyncExternalStore(recorder.subscribe, recorder.snapshot);
  useEffect(() => {
    target.setTelemetryEnabled?.(true);
    const unsubscribe = target.subscribe((event) =>
      recorder.receive(event, target.kind),
    );
    return () => {
      unsubscribe();
      recorder.finish("disconnected", "Target connection changed");
      target.setTelemetryEnabled?.(false);
    };
  }, [recorder, target]);

  useEffect(() => {
    const protectRun = (event: BeforeUnloadEvent) => {
      if (!recorder.needsProtection) return;
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", protectRun);
    const releaseGuard = registerOfflineShellBeforeReload(() =>
      recorder.flush(),
    );
    const unsubscribe = recorder.subscribe(retryPendingOfflineShellReload);
    return () => {
      window.removeEventListener("beforeunload", protectRun);
      releaseGuard();
      unsubscribe();
    };
  }, [recorder]);
  return { recorder, state };
}

export function RunArchiveNotice({
  recorder,
}: {
  recorder: RunArchiveRecorder;
}) {
  const state = useSyncExternalStore(recorder.subscribe, recorder.snapshot);
  const [downloadAttemptIds, setDownloadAttemptIds] = useState<
    readonly string[]
  >([]);
  const [downloadError, setDownloadError] = useState("");
  const attemptedUnsavedIds = downloadAttemptIds.filter((id) =>
    recorder.unsavedRuns().some((run) => run.id === id),
  );
  if (state.unsaved === 0) return null;
  const download = () => {
    const runs = recorder.unsavedRuns();
    const recovery = {
      schemaVersion: 1,
      kind: "ucsb-xrp-run-recovery",
      runs: runs.map((run) => ({
        runId: run.id,
        projectId: run.project?.projectId ?? null,
        metadata: `${JSON.stringify(completedRunMetadata(run), null, 2)}\n`,
        telemetry: monitorRunToCsv(run.recording, run.annotations),
        output: completedRunOutput(run),
      })),
    };
    try {
      downloadBlob(
        new Blob([JSON.stringify(recovery, null, 2) + "\n"], {
          type: "application/json",
        }),
        "UCSB-XRP-unsaved-runs.json",
      );
      // Starting a download cannot establish whether the browser saved it.
      // Keep this exact batch protected until the student confirms the file.
      setDownloadAttemptIds(runs.map((run) => run.id));
      setDownloadError("");
    } catch (error) {
      setDownloadAttemptIds([]);
      setDownloadError(
        `The browser could not start the download. ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  };
  return (
    <section className="connection-recovery" role="alert">
      <div>
        <strong>
          {state.unsaved} unsaved run{state.unsaved === 1 ? "" : "s"}
        </strong>
        <span>{state.detail}</span>
      </div>
      <button disabled={state.pending > 0} onClick={() => recorder.retry()}>
        Retry run save
      </button>
      <button onClick={download}>Download unsaved run data</button>
      {downloadError ? <span role="status">{downloadError}</span> : null}
      {attemptedUnsavedIds.length > 0 ? (
        <div>
          <p>
            After your browser finishes saving{" "}
            <strong>UCSB-XRP-unsaved-runs.json</strong>, confirm below. If the
            download was canceled or blocked, download it again. The Project
            folder has not been repaired.
          </p>
          {attemptedUnsavedIds.length < state.unsaved ? (
            <p>
              This confirmation covers {attemptedUnsavedIds.length} of the{" "}
              {state.unsaved} unsaved runs. Newer runs still need recovery.
            </p>
          ) : null}
          <button
            disabled={state.pending > 0}
            onClick={() => {
              recorder.acknowledgeRecoverySaved(attemptedUnsavedIds);
              setDownloadAttemptIds([]);
            }}
          >
            I saved the recovery file
          </button>
        </div>
      ) : null}
    </section>
  );
}
