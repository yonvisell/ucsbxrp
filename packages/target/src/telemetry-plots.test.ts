import { describe, expect, it } from "vitest";
import { decodeSamplePlots } from "./telemetry-plots";

describe("sample plot decoding", () => {
  it("resolves changing sample values from a bounded shared descriptor dictionary", () => {
    const descriptors = [
      { name: "speed", label: "Speed", unit: "mm/s" },
      { name: "error", label: "Error", unit: "" },
    ];
    expect(
      decodeSamplePlots(
        [
          [
            [0, 10],
            [1, -2],
          ],
          null,
          [[0, 30]],
        ],
        descriptors,
        3,
      ),
    ).toEqual([
      [
        { ...descriptors[0], value: 10 },
        { ...descriptors[1], value: -2 },
      ],
      [],
      [{ ...descriptors[0], value: 30 }],
    ]);
  });
  it("preserves legacy object rows and unavailable samples without latest-state fill", () => {
    const value = { name: "speed", label: "Speed", value: 12 };
    expect(decodeSamplePlots([[value], [], null], undefined, 3)).toEqual([
      [value],
      [],
      [],
    ]);
    expect(decodeSamplePlots(undefined, undefined, 2)).toBeNull();
    expect(decodeSamplePlots(null, [], 0)).toBeNull();
  });
  it("rejects unaligned rows, bad references, duplicate names, and excessive metadata", () => {
    const d = [{ name: "speed", label: "Speed" }];
    for (const row of [
      [[[1, 4]]],
      [[[-1, 4]]],
      [[[0, null]]],
      [
        [
          [0, 1],
          [0, 2],
        ],
      ],
      null,
    ]) {
      expect(() => decodeSamplePlots(row, d, 1)).toThrow();
    }
    expect(() => decodeSamplePlots([], d, 1)).toThrow();
    expect(() =>
      decodeSamplePlots(
        [[]],
        Array.from({ length: 257 }, () => d[0]),
        1,
      ),
    ).toThrow();
  });
});
