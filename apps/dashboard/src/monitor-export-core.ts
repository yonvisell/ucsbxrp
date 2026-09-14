import {
  telemetryRecordingToCsv,
  type TelemetryRecordingSnapshot,
  type TelemetrySample,
} from "@ucsb-xrp/target";

import { csvRows, encodeCsvCell } from "./csv-records";

export interface MonitorAnnotation {
  id: string;
  label: string;
  source: TelemetrySample["source"];
  seq: number;
  observationSeq?: number;
  physicsStepSeq?: number;
  tMs: number;
  poseAvailable: boolean;
  xMm: number;
  yMm: number;
}

function csvCell(value: string | number | boolean): string {
  const text = typeof value === "boolean" ? (value ? "1" : "0") : String(value);
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function observationKey(
  source: string,
  seq: number,
  observationSeq?: number,
): string {
  return observationSeq === undefined
    ? `${source}:seq:${seq}`
    : `${source}:observation:${observationSeq}`;
}

/** Add run notes to the matching telemetry rows in the ordinary data export. */
export function monitorRunToCsv(
  recording: TelemetryRecordingSnapshot,
  annotations: readonly MonitorAnnotation[],
): string {
  const source = csvRows(telemetryRecordingToCsv(recording));
  const notesBySample = new Map<string, string[]>();
  for (const annotation of annotations) {
    const key = observationKey(
      annotation.source,
      annotation.seq,
      annotation.observationSeq,
    );
    notesBySample.set(key, [
      ...(notesBySample.get(key) ?? []),
      annotation.label,
    ]);
  }
  const header = source.shift();
  if (!header) return "note\n";
  const rows = source.map((row, index) => {
    const sample = recording.samples[index];
    const notes = sample
      ? [
          ...(notesBySample.get(
            observationKey(sample.source, sample.seq, sample.observationSeq),
          ) ?? []),
          ...(sample.observationSeq === undefined
            ? []
            : (notesBySample.get(observationKey(sample.source, sample.seq)) ??
              [])),
        ].join(" | ")
      : "";
    return `${row.cells.join(",")},${encodeCsvCell(notes)}${row.ending}`;
  });
  return `${header.cells.join(",")},note${header.ending}${rows.join("")}`;
}

/** Export plot and world notes as one small, analysis-ready table. */
export function monitorAnnotationsToCsv(
  annotations: readonly MonitorAnnotation[],
): string {
  const header =
    "source,sequence,time_s,label,pose_available,x_mm,y_mm,observation_seq,physics_step_seq";
  const rows = [...annotations]
    .sort((left, right) => left.tMs - right.tMs)
    .map((annotation) =>
      [
        annotation.source,
        annotation.seq,
        annotation.tMs / 1_000,
        annotation.label,
        annotation.poseAvailable,
        annotation.poseAvailable ? annotation.xMm : "",
        annotation.poseAvailable ? annotation.yMm : "",
        annotation.observationSeq ?? "",
        annotation.physicsStepSeq ?? "",
      ]
        .map(csvCell)
        .join(","),
    );
  return `${header}\n${rows.length > 0 ? `${rows.join("\n")}\n` : ""}`;
}

export function createMonitorAnnotation(
  samples: readonly TelemetrySample[],
  requestedTimeMs: number,
  label: string,
  createdAtMs = Date.now(),
): MonitorAnnotation | null {
  const cleanLabel = label.trim();
  if (samples.length === 0 || cleanLabel === "") return null;

  const nearest = samples.reduce((best, candidate) =>
    Math.abs(candidate.tMs - requestedTimeMs) <
    Math.abs(best.tMs - requestedTimeMs)
      ? candidate
      : best,
  );
  return {
    id: `${nearest.source}-${nearest.observationSeq === undefined ? nearest.seq : `observation-${nearest.observationSeq}`}-${createdAtMs}`,
    label: cleanLabel,
    source: nearest.source,
    seq: nearest.seq,
    ...(nearest.observationSeq === undefined
      ? {}
      : { observationSeq: nearest.observationSeq }),
    ...(nearest.physicsStepSeq === undefined
      ? {}
      : { physicsStepSeq: nearest.physicsStepSeq }),
    // Time and pose describe the same retained telemetry sample.
    tMs: nearest.tMs,
    poseAvailable: nearest.poseAvailable,
    xMm: nearest.xMm,
    yMm: nearest.yMm,
  };
}

export function timestampedName(prefix: string, extension: string): string {
  return `${prefix}-${new Date().toISOString().replaceAll(":", "-")}.${extension}`;
}

export function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

export function webmExportSupported(): boolean {
  const canvasCaptureTrack = (
    globalThis as typeof globalThis & {
      CanvasCaptureMediaStreamTrack?: { prototype: object };
    }
  ).CanvasCaptureMediaStreamTrack;
  return (
    typeof MediaRecorder !== "undefined" &&
    typeof HTMLCanvasElement !== "undefined" &&
    "captureStream" in HTMLCanvasElement.prototype &&
    canvasCaptureTrack !== undefined &&
    "requestFrame" in canvasCaptureTrack.prototype &&
    ["video/webm;codecs=vp8", "video/webm;codecs=vp9", "video/webm"].some(
      (type) => MediaRecorder.isTypeSupported(type),
    )
  );
}
