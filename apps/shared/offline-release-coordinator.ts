export type OfflineShellReloadReason = "release-update" | "isolation";

export interface OfflineShellReloadRequest {
  version: string;
  reason: OfflineShellReloadReason;
}

export type PrepareForOfflineShellReload = (
  request: OfflineShellReloadRequest,
) => boolean | Promise<boolean>;

interface OfflineReleaseCoordinatorOptions {
  reload: (request: OfflineShellReloadRequest) => void;
  reportError?: (error: unknown) => void;
}

/**
 * Holds a course update until the current application has saved its work and
 * reports that reloading is safe. A false result keeps the newest request
 * pending; the application retries it when its run or save state changes.
 */
export class OfflineReleaseCoordinator {
  private beforeReload: PrepareForOfflineShellReload | null = null;
  private pending: OfflineShellReloadRequest | null = null;
  private attemptInProgress = false;

  constructor(private readonly options: OfflineReleaseCoordinatorOptions) {}

  registerBeforeReload(handler: PrepareForOfflineShellReload): () => void {
    this.beforeReload = handler;
    this.retry();
    return () => {
      if (this.beforeReload === handler) {
        this.beforeReload = null;
      }
    };
  }

  request(request: OfflineShellReloadRequest) {
    if (
      this.pending?.version === request.version &&
      this.pending.reason === request.reason
    ) {
      return;
    }
    this.pending = request;
    this.retry();
  }

  retry() {
    if (this.attemptInProgress || this.pending === null) {
      return;
    }
    void this.attempt(this.pending);
  }

  get pendingRequest(): OfflineShellReloadRequest | null {
    return this.pending;
  }

  private async attempt(request: OfflineShellReloadRequest) {
    this.attemptInProgress = true;
    let ready = false;
    try {
      ready =
        this.beforeReload === null ||
        (await this.beforeReload(request)) === true;
    } catch (error) {
      this.options.reportError?.(error);
    } finally {
      this.attemptInProgress = false;
    }

    if (ready && this.pending === request) {
      this.pending = null;
      this.options.reload(request);
      return;
    }

    // A newer release may have arrived while an asynchronous save was running.
    if (this.pending !== null && this.pending !== request) {
      this.retry();
    }
  }
}
