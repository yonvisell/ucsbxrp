export class RunOwnerLease<Owner> {
  private owner: Owner | null = null;
  private runId: number | null = null;
  private deadlineMs = 0;

  constructor(readonly timeoutMs: number) {
    if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) {
      throw new Error("Run-owner lease timeout must be positive and finite");
    }
  }

  begin(owner: Owner, runId: number, nowMs: number): void {
    this.owner = owner;
    this.runId = runId;
    this.deadlineMs = nowMs + this.timeoutMs;
  }

  heartbeat(owner: Owner, runId: number, nowMs: number): boolean {
    if (!this.owns(owner, runId)) {
      return false;
    }
    this.deadlineMs = nowMs + this.timeoutMs;
    return true;
  }

  owns(owner: Owner, runId: number): boolean {
    return this.owner === owner && this.runId === runId;
  }

  ownsPort(owner: Owner): boolean {
    return this.owner === owner && this.runId !== null;
  }

  ownerFor(runId: number): Owner | null {
    return this.runId === runId ? this.owner : null;
  }

  expired(nowMs: number): boolean {
    return this.runId !== null && nowMs >= this.deadlineMs;
  }

  clear(): void {
    this.owner = null;
    this.runId = null;
    this.deadlineMs = 0;
  }
}
