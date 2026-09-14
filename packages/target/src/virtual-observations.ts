import type { XrpSimulatorState } from "@ucsb-xrp/simulator";
import type { TelemetryObservationKind, TelemetrySample } from "./types";
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
  ): TelemetrySample {
    return {
      ...virtualTelemetrySample(state, course, course?.plotValues ?? []),
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
