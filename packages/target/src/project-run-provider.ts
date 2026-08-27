import type { ProjectRunSnapshot } from "./types";

export interface ProjectRunSnapshotRequest {
  type: "project-run-snapshot-request";
  requestId: string;
}

export interface ProjectRunSnapshotResponse {
  type: "project-run-snapshot";
  requestId: string;
  snapshot?: ProjectRunSnapshot;
  error?: string;
}

interface PendingSnapshot<Port> {
  port: Port;
  resolve: (snapshot: ProjectRunSnapshot) => void;
  reject: (error: Error) => void;
  timeout: ReturnType<typeof setTimeout>;
}

const PROVIDER_RESPONSE_TIMEOUT_MS = 1_000;

/**
 * Correlates one Monitor Run request with the current IDE project snapshot.
 * The retained target project remains available only when no IDE is registered.
 */
export class ProjectRunProviderBroker<Port> {
  private provider: Port | null = null;
  private nextRequest = 1;
  private readonly pending = new Map<string, PendingSnapshot<Port>>();

  constructor(
    private readonly send: (
      port: Port,
      request: ProjectRunSnapshotRequest,
    ) => void,
  ) {}

  register(port: Port): void {
    if (this.provider === port) return;
    const previous = this.provider;
    this.provider = port;
    if (previous !== null) {
      this.rejectForPort(
        previous,
        "The active IDE changed before it provided the current project.",
      );
    }
  }

  unregister(port: Port): void {
    if (this.provider !== port) return;
    this.provider = null;
    this.rejectForPort(
      port,
      "The IDE closed before it provided the current project.",
    );
  }

  request(): Promise<ProjectRunSnapshot | null> {
    const provider = this.provider;
    if (provider === null) return Promise.resolve(null);

    const requestId = `project-run-${this.nextRequest++}`;
    return new Promise<ProjectRunSnapshot>((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.pending.delete(requestId);
        reject(
          new Error(
            "The IDE did not provide the current project. Keep the IDE open, then try Run again.",
          ),
        );
      }, PROVIDER_RESPONSE_TIMEOUT_MS);
      this.pending.set(requestId, { port: provider, resolve, reject, timeout });
      this.send(provider, { type: "project-run-snapshot-request", requestId });
    });
  }

  accept(port: Port, response: ProjectRunSnapshotResponse): boolean {
    const pending = this.pending.get(response.requestId);
    if (!pending || pending.port !== port) return false;

    this.pending.delete(response.requestId);
    clearTimeout(pending.timeout);
    if (response.error) {
      pending.reject(new Error(response.error));
    } else if (response.snapshot) {
      pending.resolve(response.snapshot);
    } else {
      pending.reject(new Error("The IDE returned no project to run."));
    }
    return true;
  }

  private rejectForPort(port: Port, detail: string): void {
    for (const [requestId, pending] of this.pending) {
      if (pending.port !== port) continue;
      this.pending.delete(requestId);
      clearTimeout(pending.timeout);
      pending.reject(new Error(detail));
    }
  }
}
