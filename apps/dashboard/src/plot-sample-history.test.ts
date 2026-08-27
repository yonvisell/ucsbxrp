import { describe, expect, it } from "vitest";

import type { TelemetrySample } from "@ucsb-xrp/target";

import { PlotSampleHistory } from "./plot-sample-history";

function sample(seq: number, source: TelemetrySample["source"] = "virtual") {
  return { seq, source } as TelemetrySample;
}

function harness(maximumSamples = 3) {
  const published: (readonly TelemetrySample[])[] = [];
  const frames = new Map<number, (timestamp: number) => void>();
  const cancelled: number[] = [];
  let nextFrame = 1;
  const history = new PlotSampleHistory(
    maximumSamples,
    (samples) => published.push(samples),
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
  it("retains every sample and publishes only once per display frame", () => {
    const { flush, frames, history, published } = harness();
    history.append(sample(1));
    history.append(sample(2));
    history.append(sample(3));

    expect(frames.size).toBe(1);
    expect(published).toEqual([]);
    flush();
    expect(published.map((values) => values.map(({ seq }) => seq))).toEqual([
      [1, 2, 3],
    ]);
  });

  it("preserves chronological order after the fixed buffer wraps", () => {
    const { flush, history, published } = harness();
    for (let seq = 1; seq <= 5; seq += 1) history.append(sample(seq));
    flush();

    expect(history.snapshot().map(({ seq }) => seq)).toEqual([3, 4, 5]);
    expect(published.at(-1)?.map(({ seq }) => seq)).toEqual([3, 4, 5]);
  });

  it("starts a new history when the source or sequence epoch changes", () => {
    const { flush, history, published } = harness();
    history.append(sample(8));
    history.append(sample(9));
    history.append(sample(1));
    flush();
    expect(published.at(-1)?.map(({ seq }) => seq)).toEqual([1]);

    history.append(sample(2, "physical"));
    flush();
    expect(published.at(-1)?.map(({ seq, source }) => [seq, source])).toEqual([
      [2, "physical"],
    ]);
  });

  it("ignores duplicate samples and clear cancels pending publication", () => {
    const { cancelled, flush, frames, history, published } = harness();
    history.append(sample(1));
    history.append(sample(1));
    expect(frames.size).toBe(1);

    history.clear();
    expect(cancelled).toEqual([1]);
    expect(history.snapshot()).toEqual([]);
    expect(published).toEqual([[]]);
    flush();
    expect(published).toEqual([[]]);
  });
});
