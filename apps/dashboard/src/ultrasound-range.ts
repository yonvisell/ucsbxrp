/** XRPLib documents the HC-SR04 measurement range as 20–4000 mm. */
export const XRP_ULTRASOUND_MAXIMUM_MM = 4_000;

/** Short diagnostic fan used when the sensor has no valid distance. */
export const UNAVAILABLE_ULTRASOUND_FAN_MM = 160;

/**
 * Defensively normalize telemetry from current and older XRP runtimes.
 * Invalid values and readings beyond the sensor's stated range are unavailable,
 * not distances. This also rejects XRPLib's 655350 mm timeout sentinel.
 */
export function normalizeUltrasoundRangeMm(value: unknown): number | null {
  return typeof value === "number" &&
    Number.isFinite(value) &&
    value > 0 &&
    value <= XRP_ULTRASOUND_MAXIMUM_MM
    ? value
    : null;
}

export function normalizeTelemetryUltrasound<
  Sample extends { rangeMm: number | null },
>(sample: Sample): Sample {
  const rangeMm = normalizeUltrasoundRangeMm(sample.rangeMm);
  return Object.is(rangeMm, sample.rangeMm) ? sample : { ...sample, rangeMm };
}
