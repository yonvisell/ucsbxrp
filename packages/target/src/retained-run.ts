import type {
  SynchronizedProject,
  TargetEvent,
  TargetRunEnvelope,
} from "./types";

/** One bounded lifecycle record, independent of retained program-output lines. */
export class RetainedRun {
  private run: TargetRunEnvelope | null = null;
  private project: SynchronizedProject | null = null;
  private explicitLifecycle = false;

  clear(): void {
    this.run = null;
    this.project = null;
    this.explicitLifecycle = false;
  }
  get completed(): boolean {
    return this.run?.finishedAtMs !== undefined;
  }
  discardedOutput(count = 1): void {
    if (this.run)
      this.run = {
        ...this.run,
        droppedOutputLines: (this.run.droppedOutputLines ?? 0) + count,
      };
  }
  observe(event: TargetEvent): void {
    if (event.type === "project") this.project = event.project;
    if (event.type === "run") {
      this.explicitLifecycle = true;
      this.run = {
        ...event,
        ...(this.run?.runId === event.runId
          ? {
              droppedOutputLines: Math.max(
                this.run.droppedOutputLines ?? 0,
                event.droppedOutputLines ?? 0,
              ),
            }
          : {}),
      };
    } else if (
      event.type === "console" &&
      event.action === "run" &&
      event.phase === "request"
    ) {
      const runId = event.requestId ?? event.eventId;
      if (runId && this.run?.runId !== runId) {
        this.explicitLifecycle = false;
        this.run = {
          runId,
          startedAtMs: event.timestampMs ?? Date.now(),
          state: "loading",
          detail: event.line,
          ...(this.project
            ? {
                projectId: this.project.projectId,
                projectName: this.project.name,
                projectRevision: this.project.revision,
                entrypoint: this.project.entrypoint,
              }
            : {}),
        };
      }
    } else if (event.type === "status" && this.run && !this.completed) {
      const terminal =
        !this.explicitLifecycle &&
        (event.state === "ready" ||
          event.state === "error" ||
          event.state === "disconnected");
      this.run = {
        ...this.run,
        state: event.state,
        detail: event.detail,
        ...(terminal && this.run.finishedAtMs === undefined
          ? { finishedAtMs: Date.now() }
          : {}),
      };
    } else if (
      event.type === "console" &&
      event.action === "reset" &&
      event.phase === "result"
    ) {
      if (this.run && !this.completed && !this.explicitLifecycle)
        this.run = {
          ...this.run,
          state: "ready",
          detail: event.line,
          finishedAtMs: event.timestampMs ?? Date.now(),
        };
    }
  }
  snapshot(): TargetRunEnvelope | null {
    return this.run ? { ...this.run } : null;
  }
}
