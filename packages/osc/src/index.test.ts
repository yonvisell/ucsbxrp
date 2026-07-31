import { describe, expect, it } from "vitest";

import { decodeOscMessage, encodeOscMessage } from "./index";

describe("OSC 1.0 message codec", () => {
  it("matches the canonical padded int message layout", () => {
    const encoded = new Uint8Array(
      encodeOscMessage({
        address: "/x",
        arguments: [{ type: "i", value: 42 }],
      }),
    );

    expect(Array.from(encoded)).toEqual([
      47, 120, 0, 0, 44, 105, 0, 0, 0, 0, 0, 42,
    ]);
  });

  it("round trips the course argument subset", () => {
    const decoded = decodeOscMessage(
      encodeOscMessage({
        address: "/telemetry/wheels",
        arguments: [
          { type: "i", value: 27 },
          { type: "f", value: 123.5 },
          { type: "s", value: "left" },
        ],
      }),
    );

    expect(decoded.address).toBe("/telemetry/wheels");
    expect(decoded.arguments[0]).toEqual({ type: "i", value: 27 });
    const floatArgument = decoded.arguments[1];
    expect(floatArgument?.type).toBe("f");
    expect(floatArgument?.value).toBeCloseTo(123.5);
    expect(decoded.arguments[2]).toEqual({ type: "s", value: "left" });
  });

  it("rejects malformed or unsupported messages", () => {
    expect(() =>
      encodeOscMessage({ address: "telemetry", arguments: [] }),
    ).toThrow("begin with");

    expect(() =>
      decodeOscMessage(Uint8Array.from([47, 120, 0, 0, 44, 100, 0, 0]).buffer),
    ).toThrow("Unsupported");
  });
});
