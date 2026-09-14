import { describe, expect, it } from "vitest";
import { SimulationClock } from "./simulation-clock";

describe("virtual program clock", () => {
  it("includes computation and complete long delays with one time authority", () => {
    let now = 500;
    const clock = new SimulationClock(5, () => now);
    let physicsMs = 0;
    const advance = () =>
      clock.advance(() => {
        physicsMs += 5;
      });
    now += 20;
    advance();
    now += 980;
    advance();
    expect(physicsMs).toBe(1000);
    now += 6000;
    advance();
    expect(physicsMs).toBe(7000);
    expect(clock.elapsedMs()).toBe(7000);
  });

  it("preserves fractional steps and matches one delay to many short delays", () => {
    let now = 0;
    const one = new SimulationClock(5, () => now);
    const many = new SimulationClock(5, () => now);
    let oneSteps = 0,
      manySteps = 0;
    for (let i = 1; i <= 1200; i++) {
      now = i * 5.001;
      many.advance(() => manySteps++);
    }
    one.advance(() => oneSteps++);
    expect(oneSteps).toBe(manySteps);
    expect(oneSteps).toBe(1200);
    now = 6005;
    expect(one.advance(() => oneSteps++)).toBe(1);
  });

  it("starts after loading, never moves backwards, and bounds cancellation work", () => {
    let now = 0;
    const clock = new SimulationClock(5, () => now);
    now = 10000;
    clock.reset();
    expect(clock.elapsedMs()).toBe(0);
    now = 10010;
    expect(clock.elapsedMs()).toBe(10);
    now = 10005;
    expect(clock.elapsedMs()).toBe(10);
    now = 100000;
    let steps = 0;
    expect(() =>
      clock.advance(
        () => steps++,
        () => steps < 128,
      ),
    ).toThrow("cancelled");
    expect(steps).toBe(128);
  });
});
