import {
  DEFAULT_WORLD_CATALOG,
  type SynchronizedProject,
  type TargetEvent,
  type TargetKind,
  type TargetRunState,
} from "@ucsb-xrp/target";

import {
  MonitorRunDatasetController,
  type MonitorRunDataset,
} from "../../dashboard/src/monitor-run-dataset";
import { saveRunArchive } from "../../dashboard/src/monitor-run-archive";
import { normalizeTelemetryUltrasound } from "../../dashboard/src/ultrasound-range";
import {
  loadRememberedWorkspaceFolder,
  type CourseDirectoryHandle,
} from "../../shared/course-folder";
import {
  loadProjectBinding,
  resolveProjectFolderById,
} from "../../shared/project-binding";
import { archiveForRun } from "../../shared/run-archive-format";

type RunBoundary = Extract<TargetEvent, { type: "run" | "run-history" }>;
type Destination = { folder: CourseDirectoryHandle | null; error?: string };

export interface RunArchiveRecorderState {
  phase:
    "idle" | "recording" | "saving" | "saved" | "recovery-confirmed" | "error";
  detail: string;
  pending: number;
  unsaved: number;
}

interface SaveJob {
  run: MonitorRunDataset;
  destination: Promise<Destination>;
  pending: boolean;
  error?: string;
}

function projectFromBoundary(event: RunBoundary): SynchronizedProject | null {
  if (!event.projectRevision || !event.projectName || !event.entrypoint)
    return null;
  return {
    projectId: event.projectId,
    name: event.projectName,
    revision: event.projectRevision,
    entrypoint: event.entrypoint,
    stale: false,
  };
}

async function resolveDestination(
  project: SynchronizedProject | null,
): Promise<Destination> {
  try {
    if (!project?.projectId)
      throw new Error("The run does not have a saved Project identity.");
    const binding = await loadProjectBinding(project.projectId);
    if (binding) return { folder: binding.folder };
    const workspace = await loadRememberedWorkspaceFolder();
    return {
      folder: workspace
        ? await resolveProjectFolderById(workspace, project.projectId)
        : null,
    };
  } catch (error) {
    return { folder: null, error: String(error) };
  }
}

/** Collects exact run events without a visual Monitor or a second target client. */
export class RunArchiveRecorder {
  private readonly dataset = new MonitorRunDatasetController(30_000);
  private world = DEFAULT_WORLD_CATALOG.worlds[0]!;
  private destination: Promise<Destination> | null = null;
  private replay: RunBoundary | null = null;
  private nextOutput = 0;
  private queue: Promise<void> = Promise.resolve();
  private readonly jobs = new Map<string, SaveJob>();
  private readonly settledIds = new Set<string>();
  private readonly listeners = new Set<() => void>();
  private state: RunArchiveRecorderState = {
    phase: "idle",
    detail: "Run data will save to its Project folder.",
    pending: 0,
    unsaved: 0,
  };

  constructor(
    private readonly resolve: (
      project: SynchronizedProject | null,
    ) => Promise<Destination> = resolveDestination,
    private readonly save: (
      folder: CourseDirectoryHandle,
      run: MonitorRunDataset,
    ) => Promise<void> = (folder, run) =>
      saveRunArchive(folder, archiveForRun(run)),
  ) {}

  snapshot = (): RunArchiveRecorderState => this.state;

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  get needsProtection(): boolean {
    return this.dataset.isActive || this.jobs.size > 0;
  }

  /** A failed archive needs a Project save or explicit recovery-file confirmation. */
  get canStartRun(): boolean {
    return this.jobs.size === 0;
  }

  receive(event: TargetEvent, target: TargetKind): void {
    if (event.type === "world") {
      this.world =
        event.catalog.worlds.find(
          (world) => world.id === event.selectedWorldId,
        ) ?? event.catalog.worlds[0]!;
    } else if (event.type === "run" || event.type === "run-history") {
      if (event.phase === "begin") {
        if (this.settledIds.has(event.runId) || this.jobs.has(event.runId))
          return;
        if (this.dataset.activeId === event.runId) return;
        if (this.dataset.isActive)
          this.finish(
            "disconnected",
            "A different run replaced the unfinished run",
          );
        const project = projectFromBoundary(event);
        this.dataset.begin({
          id: event.runId,
          target,
          project,
          worldId: this.world.id,
          world: this.world,
          startedAt: new Date(event.startedAtMs).toISOString(),
        });
        // Capture authority at the boundary; later Project selections never
        // substitute their current folder for this run's destination.
        this.destination = this.resolve(project).catch((error) => ({
          folder: null,
          error: String(error),
        }));
        this.replay = event.type === "run-history" ? event : null;
        this.dataset.reportRetainedTelemetryDropped(
          event.retainedTelemetryDropped,
        );
        this.update("recording", `Recording ${project?.name ?? "XRP run"}…`);
      } else if (this.dataset.activeId === event.runId) {
        this.dataset.reportRetainedTelemetryDropped(
          event.retainedTelemetryDropped,
        );
        this.dataset.reportDroppedOutput(event.droppedOutputLines);
        this.replay = null;
        if (event.type === "run" || event.finishedAtMs !== undefined)
          this.finish(event.state, event.detail, event.finishedAtMs);
      }
    } else if (event.type === "telemetry") {
      this.dataset.capture(normalizeTelemetryUltrasound(event.sample));
    } else if (event.type === "console") {
      if (
        event.replayed &&
        (!this.replay || this.replay.runId !== event.requestId)
      )
        return;
      this.dataset.addOutput({
        id: event.eventId ?? `ide-recording-${this.nextOutput++}`,
        stream: event.stream,
        line: event.line,
        ...(event.timestampMs === undefined
          ? {}
          : { timestampMs: event.timestampMs }),
        ...(event.targetTimeMs === undefined
          ? {}
          : { targetTimeMs: event.targetTimeMs }),
        ...(event.targetClockId === undefined
          ? {}
          : { targetClockId: event.targetClockId }),
      });
    }
  }

  finish(state: TargetRunState, detail: string, atMs = Date.now()): void {
    const run = this.dataset.complete(
      state,
      detail,
      new Date(atMs).toISOString(),
    );
    if (!run) return;
    const job: SaveJob = {
      run,
      destination: this.destination ?? Promise.resolve({ folder: null }),
      pending: false,
    };
    this.destination = null;
    this.replay = null;
    this.jobs.set(run.id, job);
    this.enqueue(job);
  }

  async flush(): Promise<boolean> {
    await this.queue;
    return !this.needsProtection;
  }

  retry(): void {
    for (const job of this.jobs.values()) {
      if (job.pending) continue;
      // Reconnect may restore permission, but resolve only the original ID.
      job.destination = this.resolve(job.run.project).catch((error) => ({
        folder: null,
        error: String(error),
      }));
      this.enqueue(job);
    }
  }

  unsavedRuns(): readonly MonitorRunDataset[] {
    return [...this.jobs.values()]
      .filter((job) => !job.pending)
      .map((job) => job.run);
  }

  /** Called only when the user confirms that the attempted recovery file was saved. */
  acknowledgeRecoverySaved(ids: readonly string[]): void {
    let acknowledged = false;
    for (const id of ids) {
      if (this.jobs.get(id)?.pending !== false) continue;
      this.jobs.delete(id);
      this.rememberSettled(id);
      acknowledged = true;
    }
    if (!acknowledged) return;
    this.update(
      "recovery-confirmed",
      "You confirmed saving the recovery file. This run was not saved to its Project folder.",
    );
  }

  private rememberSettled(id: string): void {
    this.settledIds.add(id);
    if (this.settledIds.size > 8)
      this.settledIds.delete(this.settledIds.values().next().value!);
  }

  private enqueue(job: SaveJob): void {
    job.pending = true;
    job.error = undefined;
    this.update(
      "saving",
      `Saving run data for ${job.run.project?.name ?? "XRP run"}…`,
    );
    this.queue = this.queue.then(async () => {
      try {
        const destination = await job.destination;
        if (!destination.folder)
          throw new Error(
            destination.error ?? "Reconnect the run's Project folder.",
          );
        await this.save(destination.folder, job.run);
        this.jobs.delete(job.run.id);
        this.rememberSettled(job.run.id);
        this.update("saved", `Run saved to ${destination.folder.name}.`);
      } catch (error) {
        job.pending = false;
        job.error = error instanceof Error ? error.message : String(error);
        this.update(
          "error",
          `Run data was not saved: ${job.error} Retry or download it before closing.`,
        );
      }
    });
  }

  private update(
    phase: RunArchiveRecorderState["phase"],
    detail: string,
  ): void {
    const jobs = [...this.jobs.values()];
    const failed = jobs.find((job) => !job.pending);
    const pending = jobs.filter((job) => job.pending).length;
    this.state = {
      phase: failed
        ? "error"
        : this.dataset.isActive
          ? "recording"
          : pending > 0
            ? "saving"
            : phase,
      detail:
        failed && phase !== "error"
          ? `Earlier run data is unsaved: ${failed.error ?? "save failed"}. Retry or download it before closing.`
          : phase === "saved" && this.dataset.isActive
            ? "Recording the current run…"
            : phase === "saved" && pending > 0
              ? "Saving remaining run data…"
              : detail,
      pending,
      unsaved: jobs.filter((job) => !job.pending).length,
    };
    for (const listener of this.listeners) listener();
  }
}
