import {
  telemetryProgramPlotColumns,
  telemetryRecordingMetadata,
} from "@ucsb-xrp/target";

import { monitorRunToCsv } from "../dashboard/src/monitor-export-core";
import type { MonitorRunDataset } from "../dashboard/src/monitor-run-dataset";
import type { RunArchive } from "../dashboard/src/monitor-run-archive";

/** The IDE recorder and Monitor write one interoperable archive format. */
export function completedRunMetadata(run: MonitorRunDataset) {
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
    telemetry: telemetryRecordingMetadata(run.recording),
    programPlots: telemetryProgramPlotColumns(run.recording),
    droppedOutputLines: run.droppedOutputLines ?? 0,
    outputTimeline: run.output,
    annotations: run.annotations,
  };
}

export function completedRunOutput(run: MonitorRunDataset): string {
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

export function archiveForRun(run: MonitorRunDataset): RunArchive {
  if (!run.project?.projectId)
    throw new Error(
      "This run has no saved Project identity. Download the run before closing this page.",
    );
  return {
    runId: run.id,
    projectId: run.project.projectId,
    metadata: `${JSON.stringify(completedRunMetadata(run), null, 2)}\n`,
    telemetry: monitorRunToCsv(run.recording, run.annotations),
    output: completedRunOutput(run),
  };
}
