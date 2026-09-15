import {
  TelemetryRecorder,
  type SynchronizedProject,
  type TargetRunState,
  type TelemetryRecordingSnapshot,
  type TelemetrySample,
  type WorldDefinition,
} from "@ucsb-xrp/target";

import type { MonitorAnnotation } from "./monitor-export-core";

export interface MonitorRunOutput {
  id: string;
  stream: "stdout" | "stderr" | "system";
  line: string;
  timestampMs?: number;
  targetTimeMs?: number;
  targetClockId?: string;
}

export interface MonitorRunDataset {
  id: string;
  target: TelemetrySample["source"];
  project: SynchronizedProject | null;
  worldId: string;
  world: WorldDefinition;
  startedAt: string;
  finishedAt: string;
  finalState: TargetRunState;
  finalDetail: string;
  recording: TelemetryRecordingSnapshot;
  output: readonly MonitorRunOutput[];
  droppedOutputLines?: number;
  annotations: readonly MonitorAnnotation[];
}

interface ActiveRun {
  id: string;
  target: TelemetrySample["source"];
  project: SynchronizedProject | null;
  worldId: string;
  world: WorldDefinition;
  startedAt: string;
}

/**
 * Owns one Monitor run from its first loading state through completion.
 *
 * Plots, notes, folder archives, and explicit exports all read the resulting
 * dataset. Samples from a stale target are rejected rather than being mixed
 * into a run after the student changes between the virtual and physical XRP.
 */
export class MonitorRunDatasetController {
  private readonly recorder: TelemetryRecorder;
  private active: ActiveRun | null = null;
  private output: MonitorRunOutput[] = [];
  private annotations: MonitorAnnotation[] = [];
  private completed: MonitorRunDataset | null = null;
  private discardedOutput = 0;
  private upstreamDiscardedOutput = 0;
  private retainedTelemetryDropped = 0;

  constructor(maximumSamples = 30_000) {
    this.recorder = new TelemetryRecorder(maximumSamples);
  }

  get isActive(): boolean {
    return this.active !== null;
  }

  get activeId(): string | null {
    return this.active?.id ?? null;
  }

  get sampleCount(): number {
    return this.recorder.sampleCount;
  }

  get latest(): MonitorRunDataset | null {
    return this.completed;
  }

  /** One bounded copy for a newly visible World; never used per sample/frame. */
  activeRecordingSnapshot(): TelemetryRecordingSnapshot | null {
    return this.active ? this.withRetainedLoss(this.recorder.snapshot()) : null;
  }

  /** Only the prefix missed before this Monitor joined, not live ring eviction. */
  reportRetainedTelemetryDropped(count = 0): void {
    if (!this.active || !Number.isSafeInteger(count) || count < 0) return;
    this.retainedTelemetryDropped = Math.max(
      this.retainedTelemetryDropped,
      count,
    );
  }

  private withRetainedLoss(
    recording: TelemetryRecordingSnapshot,
  ): TelemetryRecordingSnapshot {
    return {
      ...recording,
      droppedSamples: recording.droppedSamples + this.retainedTelemetryDropped,
    };
  }

  /** Fill a late project descriptor, but reject a different project mid-run. */
  acceptProject(project: SynchronizedProject | null): boolean {
    if (!this.active) return true;
    if (!this.active.project && project) {
      this.active = { ...this.active, project: { ...project } };
      return true;
    }
    return (
      this.active.project?.revision === project?.revision &&
      this.active.project?.projectId === project?.projectId
    );
  }

  currentAnnotations(): readonly MonitorAnnotation[] {
    return this.annotations;
  }

  begin(options: {
    id: string;
    target: TelemetrySample["source"];
    project: SynchronizedProject | null;
    worldId: string;
    world: WorldDefinition;
    startedAt: string;
  }): void {
    this.active = {
      ...options,
      project: options.project ? { ...options.project } : null,
      world: structuredClone(options.world),
    };
    this.output = [];
    this.discardedOutput = 0;
    this.upstreamDiscardedOutput = 0;
    this.retainedTelemetryDropped = 0;
    this.annotations = [];
    this.completed = null;
    this.recorder.start();
  }

  capture(sample: TelemetrySample): boolean {
    if (!this.active || sample.source !== this.active.target) return false;
    this.recorder.capture(sample);
    return true;
  }

  addOutput(entry: MonitorRunOutput): void {
    if (!this.active || this.output.some((item) => item.id === entry.id))
      return;
    if (this.output.length >= 2_000) this.discardedOutput += 1;
    this.output = [...this.output.slice(-1_999), { ...entry }];
  }

  reportDroppedOutput(count = 0): void {
    this.upstreamDiscardedOutput = Math.max(
      this.upstreamDiscardedOutput,
      count,
    );
  }

  addAnnotation(annotation: MonitorAnnotation): MonitorRunDataset | null {
    if (!this.active && !this.completed) return null;
    if (this.annotations.length >= 1_024)
      throw new Error(
        "This run has reached its 1,024-note limit. Existing notes are retained; export the run before collecting more.",
      );
    this.annotations = [...this.annotations, { ...annotation }];
    if (this.completed) {
      this.completed = {
        ...this.completed,
        annotations: this.annotations.map((item) => ({ ...item })),
      };
    }
    return this.completed;
  }

  updateAnnotation(id: string, label: string): MonitorRunDataset | null {
    const note = this.annotations.find((candidate) => candidate.id === id);
    const cleanLabel = label.trim();
    if (!note || !cleanLabel)
      throw new Error("The note is no longer available in this run.");
    if (cleanLabel === note.label) return this.completed;
    this.annotations = this.annotations.map((candidate) =>
      candidate === note
        ? {
            ...note,
            label: cleanLabel,
            previousLabel: note.label,
            revision: (note.revision ?? 0) + 1,
          }
        : candidate,
    );
    if (this.completed)
      this.completed = {
        ...this.completed,
        annotations: this.annotations.map((item) => ({ ...item })),
      };
    return this.completed;
  }

  restoreAnnotations(
    saved: readonly MonitorAnnotation[],
  ): MonitorRunDataset | null {
    if (!this.active && !this.completed) return null;
    const merged = new Map(saved.map((note) => [note.id, { ...note }]));
    for (const local of this.annotations) {
      const disk = merged.get(local.id);
      const acknowledged =
        disk &&
        (local.revision ?? 0) <= (disk.revision ?? 0) &&
        local.label === disk.label &&
        local.source === disk.source &&
        local.seq === disk.seq &&
        local.observationSeq === disk.observationSeq &&
        local.tMs === disk.tMs &&
        local.xMm === disk.xMm &&
        local.yMm === disk.yMm;
      // Exact acknowledgments clear the pending edit base. Unacknowledged local
      // edits survive even when another Monitor has advanced farther on disk.
      if (
        !disk ||
        (!acknowledged &&
          (local.previousLabel !== undefined ||
            (local.revision ?? 0) >= (disk.revision ?? 0)))
      )
        merged.set(local.id, local);
    }
    if (merged.size > 1_024)
      throw new Error(
        "The combined notes exceed this run's limit. Local notes remain available for export.",
      );
    this.annotations = [...merged.values()];
    if (this.completed)
      this.completed = {
        ...this.completed,
        annotations: this.annotations.map((note) => ({ ...note })),
      };
    return this.completed;
  }

  complete(
    finalState: TargetRunState,
    finalDetail: string,
    finishedAt: string,
  ): MonitorRunDataset | null {
    if (!this.active) return null;
    const active = this.active;
    this.active = null;
    this.completed = {
      ...active,
      finishedAt,
      finalState,
      finalDetail,
      recording: this.withRetainedLoss(this.recorder.stop()),
      output: this.output.map((entry) => ({ ...entry })),
      droppedOutputLines: this.discardedOutput + this.upstreamDiscardedOutput,
      annotations: this.annotations.map((annotation) => ({ ...annotation })),
    };
    return this.completed;
  }

  /** Display retained target history without creating another saved run. */
  restore(run: MonitorRunDataset): MonitorRunDataset {
    this.recorder.clear();
    this.active = null;
    this.retainedTelemetryDropped = 0;
    this.output = run.output.map((entry) => ({ ...entry }));
    this.annotations = run.annotations.map((annotation) => ({ ...annotation }));
    this.completed = {
      ...run,
      project: run.project ? { ...run.project } : null,
      world: structuredClone(run.world),
      recording: {
        ...run.recording,
        samples: run.recording.samples.map((sample) => ({
          ...sample,
          accelerationMg: sample.accelerationMg
            ? [...sample.accelerationMg]
            : null,
          angularRateMdps: sample.angularRateMdps
            ? [...sample.angularRateMdps]
            : null,
          plotValues: sample.plotValues?.map((plot) => ({ ...plot })),
        })),
      },
      output: this.output,
      annotations: this.annotations,
    };
    return this.completed;
  }

  clear(): void {
    this.recorder.clear();
    this.active = null;
    this.output = [];
    this.annotations = [];
    this.completed = null;
    this.retainedTelemetryDropped = 0;
  }
}
