import { describe, expect, it } from "vitest";

import type { TelemetrySample } from "@ucsb-xrp/target";

import {
  MonitorVisualHistory,
  type MonitorVisualSnapshot,
  recentTelemetryRateHz,
} from "./plot-sample-history";

function sample(seq: number, source: TelemetrySample["source"] = "virtual") {
  return { seq, source, tMs: seq * 20 } as TelemetrySample;
}

function harness(maximumSamples = 3) {
  const published: MonitorVisualSnapshot[] = [];
  const frames = new Map<number, (timestamp: number) => void>();
  const cancelled: number[] = [];
  let nextFrame = 1;
  const history = new MonitorVisualHistory(
    maximumSamples,
    (snapshot) => published.push(snapshot),
    (callback) => {
      const id = nextFrame++;
      frames.set(id, callback);
      return id;
    },
    (id) => {
      cancelled.push(id);
      frames.delete(id);
    },
  );
  const flush = () => {
    const scheduled = [...frames.entries()];
    frames.clear();
    for (const [, callback] of scheduled) callback(0);
  };
  return { cancelled, flush, frames, history, published };
}

describe("PlotSampleHistory", () => {
  it("estimates source rate from timestamps and sequence steps", () => {
    expect(
      recentTelemetryRateHz([sample(1), sample(2), sample(3)]),
    ).toBeCloseTo(50);
    expect(
      recentTelemetryRateHz([
        { ...sample(10), tMs: 1_000 },
        { ...sample(15), tMs: 1_100 },
      ]),
    ).toBeCloseTo(50);
    expect(recentTelemetryRateHz([sample(1)])).toBeNull();
  });

  it("retains every sample and publishes only once per display frame", () => {
    const { flush, frames, history, published } = harness();
    history.append(sample(1), true);
    history.append(sample(2), true);
    history.append(sample(3), true);

    expect(frames.size).toBe(1);
    expect(published).toEqual([]);
    flush();
    expect(published.at(-1)?.sample?.seq).toBe(3);
    expect(published.at(-1)?.samples.map(({ seq }) => seq)).toEqual([1, 2, 3]);
  });

  it("preserves chronological order after the fixed buffer wraps", () => {
    const { flush, history, published } = harness();
    for (let seq = 1; seq <= 5; seq += 1) history.append(sample(seq), true);
    flush();

    expect(history.snapshot().samples.map(({ seq }) => seq)).toEqual([3, 4, 5]);
    expect(published.at(-1)?.samples.map(({ seq }) => seq)).toEqual([3, 4, 5]);
  });

  it("starts a new history when the source or sequence epoch changes", () => {
    const { flush, history, published } = harness();
    history.append(sample(8), true);
    history.append(sample(9), true);
    history.append(sample(1), true);
    flush();
    expect(published.at(-1)?.samples.map(({ seq }) => seq)).toEqual([1]);

    history.append(sample(2, "physical"), true);
    flush();
    expect(
      published.at(-1)?.samples.map(({ seq, source }) => [seq, source]),
    ).toEqual([[2, "physical"]]);
  });

  it("keeps latest-only samples out of retained run history", () => {
    const { flush, history, published } = harness();
    history.append(sample(1), false);
    history.append(sample(2), false);
    flush();

    expect(published.at(-1)?.sample?.seq).toBe(2);
    expect(published.at(-1)?.samples).toEqual([]);
  });

  it("retains hidden samples and publishes one current snapshot on resume", () => {
    const { flush, frames, history, published } = harness();
    history.setActive(false);
    history.append(sample(1), true);
    history.append(sample(2), true);
    expect(frames.size).toBe(0);
    expect(published).toEqual([]);

    history.setActive(true);
    expect(frames.size).toBe(1);
    flush();
    expect(published.at(-1)?.sample?.seq).toBe(2);
    expect(published.at(-1)?.samples.map(({ seq }) => seq)).toEqual([1, 2]);
  });

  it("clear cancels a pending publication without clearing the latest value", () => {
    const { cancelled, flush, frames, history, published } = harness();
    history.append(sample(1), true);
    history.append(sample(1), true);
    expect(frames.size).toBe(1);

    history.clearHistory();
    expect(cancelled).toEqual([1]);
    expect(history.snapshot().samples).toEqual([]);
    expect(history.snapshot().sample?.seq).toBe(1);
    expect(published.at(-1)?.samples).toEqual([]);
    expect(published.at(-1)?.sample?.seq).toBe(1);
    flush();
    expect(published).toHaveLength(1);
  });
});
