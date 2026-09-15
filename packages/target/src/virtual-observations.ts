import type { XrpSimulatorState } from "@ucsb-xrp/simulator";
import type {
  TelemetryObservationKind,
  TelemetrySample,
  TelemetryTiming,
} from "./types";
import type { CourseTelemetryState } from "./worker-protocol";
import { virtualTelemetrySample } from "./virtual-telemetry";

/** Observation order is independent of physics advancement and course updates. */
export class VirtualObservations {
  private nextSequence = 0;

  capture(
    state: XrpSimulatorState,
    course: CourseTelemetryState | null,
    kind: TelemetryObservationKind,
    physicsStepSeq = state.seq,
    acquisition?: TelemetryTiming | null,
  ): TelemetrySample {
    const newestAcquisition =
      acquisition &&
      (!course?.timing ||
        (acquisition.clockId === course.timing.clockId &&
          acquisition.acquisitionSeq !== null &&
          course.timing.acquisitionSeq !== null &&
          acquisition.acquisitionSeq > course.timing.acquisitionSeq))
        ? acquisition
        : course?.timing;
    return {
      ...virtualTelemetrySample(state, course, course?.plotValues ?? []),
      ...(newestAcquisition
        ? {
            timing: { ...newestAcquisition },
            ...(newestAcquisition.diagnostics ?? {}),
            ...(newestAcquisition.plots
              ? {
                  plotValues: newestAcquisition.plots.map((plot) => ({
                    ...plot,
                  })),
                }
              : {}),
          }
        : {}),
      observationSeq: this.nextSequence++,
      observationKind: kind,
      physicsStepSeq,
      ...(course?.publicationSeq !== undefined
        ? { courseSnapshotSeq: course.publicationSeq }
        : {}),
      ...(course?.publishedAtMs !== undefined
        ? { coursePublishedAtMs: course.publishedAtMs }
        : {}),
    };
  }
}
