/**
 * Program time is elapsed monotonic wall time, including Python calculation.
 * Physics uses fixed steps; the sub-step remainder is retained without changing
 * the hardware clock or discarding time after a delayed browser wakeup.
 */
export class SimulationClock {
  private originMs: number;
  private latestMs = 0;
  private integratedSteps = 0;

  constructor(
    readonly fixedStepMs: number,
    private readonly now: () => number = () => performance.now(),
  ) {
    if (!Number.isFinite(fixedStepMs) || fixedStepMs <= 0) {
      throw new Error("The simulation step must be positive and finite");
    }
    this.originMs = now();
  }

  reset(): void {
    this.originMs = this.now();
    this.latestMs = 0;
    this.integratedSteps = 0;
  }

  elapsedMs(): number {
    this.latestMs = Math.max(this.latestMs, this.now() - this.originMs, 0);
    return this.latestMs;
  }

  advance(
    step: () => void,
    continueRunning: () => boolean = () => true,
  ): number {
    const desiredSteps = Math.floor(this.elapsedMs() / this.fixedStepMs);
    const startingStep = this.integratedSteps;
    while (this.integratedSteps < desiredSteps) {
      // A shared cancellation flag can interrupt a long suspension catch-up.
      if (!continueRunning()) throw new Error("Virtual run cancelled");
      const boundary = Math.min(desiredSteps, this.integratedSteps + 128);
      while (this.integratedSteps < boundary) {
        step();
        this.integratedSteps += 1;
      }
    }
    return this.integratedSteps - startingStep;
  }
}
