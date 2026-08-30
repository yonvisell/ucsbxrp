import { describe, expect, it } from "vitest";

import type { TelemetrySample } from "@ucsb-xrp/target";

import {
  appendTelemetryRateSample,
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
  const flush = (timestamp = 0) => {
    const scheduled = [...frames.entries()];
    frames.clear();
    for (const [, callback] of scheduled) callback(timestamp);
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

  it("ignores repeated virtual-state publications without erasing rate intervals", () => {
    const retained: TelemetrySample[] = [];
    for (const seq of [0, 0, 1, 1, 2, 2, 3, 3]) {
      appendTelemetryRateSample(retained, sample(seq));
    }

    expect(retained.map(({ seq }) => seq)).toEqual([0, 1, 2, 3]);
    expect(recentTelemetryRateHz(retained)).toBeCloseTo(50);
  });

  it("starts a new rate epoch only on source change or sequence rollback", () => {
    const retained: TelemetrySample[] = [];
    appendTelemetryRateSample(retained, sample(8));
    appendTelemetryRateSample(retained, sample(9));
    appendTelemetryRateSample(retained, sample(9));
    expect(retained.map(({ seq }) => seq)).toEqual([8, 9]);

    appendTelemetryRateSample(retained, sample(1));
    expect(retained.map(({ seq }) => seq)).toEqual([1]);

    appendTelemetryRateSample(retained, sample(2, "physical"));
    expect(retained.map(({ seq, source }) => [seq, source])).toEqual([
      [2, "physical"],
    ]);
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

  it("publishes the newest physical state on each display frame without replay latency", () => {
    const { flush, frames, history, published } = harness(20);
    for (let seq = 1; seq <= 11; seq += 1) {
      history.append(sample(seq, "physical"), true);
    }

    expect(frames.size).toBe(1);
    flush(0);
    expect(published.at(-1)?.sample?.seq).toBe(11);
    expect(published.at(-1)?.samples.map(({ seq }) => seq)).toEqual([
      1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11,
    ]);
    expect(frames.size).toBe(0);

    for (let seq = 12; seq <= 16; seq += 1) {
      history.append(sample(seq, "physical"), true);
    }

    flush(16);
    expect(published.at(-1)?.sample?.seq).toBe(16);
    expect(published.at(-1)?.samples.map(({ seq }) => seq)).toEqual([
      1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16,
    ]);
    expect(published).toHaveLength(2);
    expect(frames.size).toBe(0);
  });

  it("coalesces a wrapped physical burst into the newest state and bounded history", () => {
    const { flush, history, published } = harness(4);
    for (let seq = 1; seq <= 12; seq += 1) {
      history.append(sample(seq, "physical"), true);
    }

    flush(16);
    expect(published).toHaveLength(1);
    expect(published[0]?.sample?.seq).toBe(12);
    expect(published[0]?.samples.map(({ seq }) => seq)).toEqual([
      9, 10, 11, 12,
    ]);
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
