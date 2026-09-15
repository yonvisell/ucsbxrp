import type {
  TelemetryDiagnostics,
  TelemetrySample,
  TelemetryTiming,
} from "./types";
import { parseRuntimeState } from "./runtime-controls";

/** Version 1 additive row metadata; packed-v1's original binary row is unchanged. */
export const telemetryTimingFields = [
  "rawDeviceTimeMs",
  "acquiredAtMs",
  "acquisitionSeq",
  "rangeAcquiredAtMs",
  "rangeSeq",
  "diagnosticsAcquiredAtMs",
  "diagnosticsSeq",
  "rawLeftEncoderCount",
  "rawRightEncoderCount",
  "rawRangeMm",
  "publishedAtMs",
  "sampleDtMs",
  "samplePeriodMs",
  "overrunMs",
] as const;

export function decodeTelemetryTiming(
  value: unknown,
  clockId: string,
): TelemetryTiming | undefined {
  if (value === undefined || value === null) return undefined;
  if (!Array.isArray(value) || value.length !== 16 || clockId.length > 200)
    throw new Error("Invalid telemetry timing record");
  const result: Record<string, unknown> = {
    version: 1,
    clockId,
    clockBasis: "first-acquisition",
  };
  telemetryTimingFields.forEach((field, index) => {
    const number = value[index];
    if (
      number !== null &&
      (typeof number !== "number" || !Number.isFinite(number))
    )
      throw new Error(`Invalid timing ${field}`);
    if (
      number !== null &&
      !["rawLeftEncoderCount", "rawRightEncoderCount"].includes(field) &&
      number < 0
    )
      throw new Error(`Negative timing ${field}`);
    if (
      [
        "rawDeviceTimeMs",
        "acquisitionSeq",
        "rangeSeq",
        "diagnosticsSeq",
        "rawLeftEncoderCount",
        "rawRightEncoderCount",
      ].includes(field) &&
      number !== null &&
      !Number.isSafeInteger(number)
    )
      throw new Error(`Invalid integer ${field}`);
    result[field] = number;
  });
  if (!["raw", "course", "stop"].includes(value[14]))
    throw new Error("Invalid timing kind");
  result.kind = value[14];
  if (typeof value[15] !== "boolean")
    throw new Error("Invalid range sampling flag");
  result.rangeSampled = value[15];
  return result as unknown as TelemetryTiming;
}

export function applyTelemetryTimingPage(
  samples: readonly TelemetrySample[],
  timing: unknown,
  diagnostics: unknown,
  clockId: string,
): TelemetrySample[] {
  if (
    timing !== undefined &&
    (!Array.isArray(timing) || timing.length !== samples.length)
  )
    throw new Error("Unaligned telemetry timing");
  if (
    diagnostics !== undefined &&
    (!Array.isArray(diagnostics) || diagnostics.length !== samples.length)
  )
    throw new Error("Unaligned telemetry diagnostics");
  return samples.map((sample, index) => {
    const value = Array.isArray(timing)
      ? decodeTelemetryTiming(timing[index], clockId)
      : sample.timing;
    const row = Array.isArray(diagnostics) ? diagnostics[index] : undefined;
    if (row === undefined || row === null)
      return { ...sample, ...(value ? { timing: value } : {}) };
    return {
      ...sample,
      ...(value ? { timing: value } : {}),
      ...decodeTelemetryDiagnostics(row),
    };
  });
}

export function decodeTelemetryDiagnostics(row: unknown): TelemetryDiagnostics {
  if (!Array.isArray(row) || row.length !== 5)
    throw new Error("Invalid telemetry diagnostics");
  const vector = (item: unknown): [number, number, number] | null => {
    if (item === null) return null;
    if (
      !Array.isArray(item) ||
      item.length !== 3 ||
      item.some((n) => typeof n !== "number" || !Number.isFinite(n))
    )
      throw new Error("Invalid diagnostics vector");
    return [...item] as [number, number, number];
  };
  if (
    row
      .slice(2, 4)
      .some((n) => n !== null && (typeof n !== "number" || !Number.isFinite(n)))
  )
    throw new Error("Invalid diagnostics value");
  if (row[4] !== null && (typeof row[4] !== "string" || row[4].length > 512))
    throw new Error("Invalid diagnostics error");
  return {
    accelerationMg: vector(row[0]),
    angularRateMdps: vector(row[1]),
    temperatureC: row[2],
    batteryV: row[3],
    sensorError: row[4],
  };
}

export function decodeVirtualAcquisition(
  encoded: unknown,
  clockId: string,
): TelemetryTiming | undefined {
  const value: unknown = JSON.parse(String(encoded));
  if (!value || typeof value !== "object" || Array.isArray(value))
    return decodeTelemetryTiming(value, clockId);
  const publication = value as {
    timing?: unknown;
    diagnostics?: unknown;
    plots?: unknown;
  };
  const timing = decodeTelemetryTiming(publication.timing, clockId);
  return timing
    ? {
        ...timing,
        diagnostics: decodeTelemetryDiagnostics(publication.diagnostics),
        ...(timing.kind === "raw"
          ? {
              plots: parseRuntimeState(
                JSON.stringify({
                  revision: 0,
                  parameters: [],
                  watches: [],
                  plots: publication.plots ?? [],
                }),
              ).plots,
            }
          : {}),
      }
    : undefined;
}
