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
 * Correlates one Monitor Run request with the active IDE project snapshot.
 * The first IDE remains active until it closes or another IDE explicitly
 * takes over; opening a tab never changes project authority by itself.
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
    private readonly onProviderUnavailable: () => void = () => undefined,
  ) {}

  register(port: Port, takeover = false): boolean {
    if (this.provider === port) return true;
    if (this.provider !== null && !takeover) return false;
    const previous = this.provider;
    this.provider = port;
    if (previous !== null) {
      this.rejectForPort(
        previous,
        "The active IDE changed before it provided the current project.",
      );
    }
    return true;
  }

  unregister(port: Port): boolean {
    if (this.provider !== port) return false;
    this.provider = null;
    this.rejectForPort(
      port,
      "The IDE closed before it provided the current project.",
    );
    return true;
  }

  hasProvider(): boolean {
    return this.provider !== null;
  }

  providerIs(port: Port): boolean {
    return this.provider === port;
  }

  request(): Promise<ProjectRunSnapshot> {
    const provider = this.provider;
    if (provider === null) {
      return Promise.reject(
        new Error(
          "No active IDE project is available. Open the IDE or choose Use this project in an open IDE.",
        ),
      );
    }

    const requestId = `project-run-${this.nextRequest++}`;
    return new Promise<ProjectRunSnapshot>((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.pending.delete(requestId);
        if (this.provider === provider) {
          this.provider = null;
          this.rejectForPort(
            provider,
            "The active IDE stopped responding before it provided the current project.",
          );
          this.onProviderUnavailable();
        }
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
