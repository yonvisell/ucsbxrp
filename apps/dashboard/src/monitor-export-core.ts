import {
  telemetryRecordingToCsv,
  type TelemetryRecordingSnapshot,
  type TelemetrySample,
} from "@ucsb-xrp/target";

export interface MonitorAnnotation {
  id: string;
  label: string;
  source: TelemetrySample["source"];
  seq: number;
  tMs: number;
  poseAvailable: boolean;
  xMm: number;
  yMm: number;
}

function csvCell(value: string | number | boolean): string {
  const text = typeof value === "boolean" ? (value ? "1" : "0") : String(value);
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

/** Add run notes to the matching telemetry rows in the ordinary data export. */
export function monitorRunToCsv(
  recording: TelemetryRecordingSnapshot,
  annotations: readonly MonitorAnnotation[],
): string {
  const source = telemetryRecordingToCsv(recording).trimEnd().split("\n");
  const notesBySample = new Map<string, string[]>();
  for (const annotation of annotations) {
    const key = `${annotation.source}:${annotation.seq}`;
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
      ? (notesBySample.get(`${sample.source}:${sample.seq}`) ?? []).join(" | ")
      : "";
    return `${row},${csvCell(notes)}`;
  });
  return `${header},note\n${rows.length > 0 ? `${rows.join("\n")}\n` : ""}`;
}

/** Export plot and world notes as one small, analysis-ready table. */
export function monitorAnnotationsToCsv(
  annotations: readonly MonitorAnnotation[],
): string {
  const header = "source,sequence,time_s,label,pose_available,x_mm,y_mm";
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
    id: `${nearest.source}-${nearest.seq}-${createdAtMs}`,
    label: cleanLabel,
    source: nearest.source,
    seq: nearest.seq,
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
  return (
    typeof MediaRecorder !== "undefined" &&
    "captureStream" in HTMLCanvasElement.prototype &&
    ["video/webm;codecs=vp8", "video/webm;codecs=vp9", "video/webm"].some(
      (type) => MediaRecorder.isTypeSupported(type),
    )
  );
}
