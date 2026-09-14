/** One setup context; invalidated work may finish I/O but cannot publish or commit. */
export class SetupAttempt {
  private current = new AbortController();

  get signal(): AbortSignal {
    return this.current.signal;
  }

  invalidate(): void {
    this.current.abort(new DOMException("Setup context changed", "AbortError"));
    this.current = new AbortController();
  }

  isCurrent(signal: AbortSignal): boolean {
    return this.current.signal === signal && !signal.aborted;
  }

  requireCurrent(signal: AbortSignal): void {
    if (!this.isCurrent(signal))
      throw new DOMException("Setup context changed", "AbortError");
  }
}
