import type { TelemetrySample } from "@ucsb-xrp/target";
import type { MonitorAnnotation } from "./monitor-export-core";

/** Prefer the newest observation at an equally near time; never interpolate. */
export function nearestObservation(
  samples: readonly TelemetrySample[],
  timeMs: number,
): TelemetrySample | null {
  return samples.reduce<TelemetrySample | null>(
    (best, sample) =>
      !best || Math.abs(sample.tMs - timeMs) <= Math.abs(best.tMs - timeMs)
        ? sample
        : best,
    null,
  );
}

export function annotationMatchesSample(
  note: MonitorAnnotation,
  sample: TelemetrySample,
): boolean {
  return (
    note.source === sample.source &&
    (note.observationSeq === undefined
      ? note.seq === sample.seq && note.tMs === sample.tMs
      : note.observationSeq === sample.observationSeq)
  );
}

export function retainedVisibleAnnotations(
  notes: readonly MonitorAnnotation[],
  samples: readonly TelemetrySample[],
  startMs: number,
  endMs: number,
): MonitorAnnotation[] {
  if (!notes.length) return [];
  const identities = new Set<string>();
  for (const sample of samples) {
    identities.add(`${sample.source}:sample:${sample.seq}:${sample.tMs}`);
    if (sample.observationSeq !== undefined)
      identities.add(`${sample.source}:observation:${sample.observationSeq}`);
  }
  return notes.filter(
    (note) =>
      note.tMs >= startMs &&
      note.tMs <= endMs &&
      identities.has(
        note.observationSeq === undefined
          ? `${note.source}:sample:${note.seq}:${note.tMs}`
          : `${note.source}:observation:${note.observationSeq}`,
      ),
  );
}

export function observationDescription(
  sample: Pick<TelemetrySample, "source" | "observationSeq" | "seq" | "tMs">,
): string {
  return `${(sample.tMs / 1_000).toFixed(3)} s · ${sample.observationSeq === undefined ? "sample" : "observation"} ${sample.observationSeq ?? sample.seq}`;
}

export function inspectionValue(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value))
    return "Unavailable";
  if (value === 0) return "0";
  return Math.abs(value) < 0.001 || Math.abs(value) >= 100_000
    ? value.toExponential(3)
    : Number(value.toPrecision(5)).toString();
}

export function escapeInspectionHtml(value: string): string {
  return value.replace(
    /[&<>"']/g,
    (character) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        character
      ]!,
  );
}
