import type { TelemetrySample } from "@ucsb-xrp/target";

export interface MonitorAnnotation {
  id: string;
  label: string;
  tMs: number;
  poseAvailable: boolean;
  xMm: number;
  yMm: number;
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
