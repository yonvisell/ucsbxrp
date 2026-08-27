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
  private reloadRequested: OfflineShellReloadRequest | null = null;
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
    if (
      this.attemptInProgress ||
      this.pending === null ||
      this.reloadRequested === this.pending
    ) {
      return;
    }
    void this.attempt(this.pending);
  }

  /** Confirm that the requested navigation actually began. */
  confirmReload(request: OfflineShellReloadRequest) {
    if (this.reloadRequested === request) {
      this.reloadRequested = null;
    }
    if (this.pending === request) {
      this.pending = null;
    }
  }

  /** Keep the update pending when beforeunload cancels the navigation. */
  resumeAfterCancelledReload(request: OfflineShellReloadRequest) {
    if (this.reloadRequested === request) {
      this.reloadRequested = null;
    }
  }

  get pendingRequest(): OfflineShellReloadRequest | null {
    return this.pending;
  }

  private async attempt(request: OfflineShellReloadRequest) {
    this.attemptInProgress = true;
    const handler = this.beforeReload;
    let ready = false;
    try {
      // Interactive applications register their safety guard after the first
      // React render. Until then, keeping the update pending is safer than
      // reloading during startup or a restored browser interaction.
      ready = handler !== null && (await handler(request)) === true;
    } catch (error) {
      this.options.reportError?.(error);
    } finally {
      this.attemptInProgress = false;
    }

    if (ready && this.pending === request && this.beforeReload === handler) {
      this.reloadRequested = request;
      this.options.reload(request);
      return;
    }

    // A newer release may have arrived while an asynchronous save was running.
    if (
      this.pending !== null &&
      (this.pending !== request || this.beforeReload !== handler)
    ) {
      this.retry();
    }
  }
}
