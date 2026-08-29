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
    return this.active ? this.recorder.snapshot() : null;
  }

  /** Fill a late project descriptor, but reject a different project mid-run. */
  acceptProject(project: SynchronizedProject | null): boolean {
    if (!this.active) return true;
    if (!this.active.project && project) {
      this.active = { ...this.active, project: { ...project } };
      return true;
    }
    return this.active.project?.revision === project?.revision;
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
    this.output = [...this.output.slice(-1_999), { ...entry }];
  }

  addAnnotation(annotation: MonitorAnnotation): MonitorRunDataset | null {
    if (!this.active && !this.completed) return null;
    this.annotations = [...this.annotations, { ...annotation }].slice(-24);
    if (this.completed) {
      this.completed = {
        ...this.completed,
        annotations: this.annotations.map((item) => ({ ...item })),
      };
    }
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
      recording: this.recorder.stop(),
      output: this.output.map((entry) => ({ ...entry })),
      annotations: this.annotations.map((annotation) => ({ ...annotation })),
    };
    return this.completed;
  }

  /** Display retained target history without creating another saved run. */
  restore(run: MonitorRunDataset): MonitorRunDataset {
    this.recorder.clear();
    this.active = null;
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
  }
}
