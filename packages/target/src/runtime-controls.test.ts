import { describe, expect, it } from "vitest";

import { encodeRuntimeParameter, parseRuntimeState } from "./runtime-controls";
import type { RuntimeParameter } from "./types";

describe("runtime controls", () => {
  it("encodes bounded sliders, toggles, and choices for atomic transport", () => {
    const speed: RuntimeParameter = {
      name: "speed",
      label: "Cruise speed",
      kind: "number",
      value: 100,
      minimum: 50,
      maximum: 200,
      step: 5,
      unit: "mm/s",
    };
    expect(encodeRuntimeParameter(speed, 175)).toBe(25);
    expect(
      encodeRuntimeParameter(
        { name: "enabled", label: "Enabled", kind: "toggle", value: true },
        false,
      ),
    ).toBe(0);
    expect(
      encodeRuntimeParameter(
        {
          name: "direction",
          label: "Direction",
          kind: "choice",
          value: "left",
          options: ["left", "right"],
        },
        "right",
      ),
    ).toBe(1);
  });

  it("rejects values that cannot be represented by the declaration", () => {
    const speed: RuntimeParameter = {
      name: "speed",
      label: "Cruise speed",
      kind: "number",
      value: 100,
      minimum: 50,
      maximum: 200,
      step: 5,
    };
    expect(() => encodeRuntimeParameter(speed, 203)).toThrow(/range/);
    expect(encodeRuntimeParameter(speed, 103)).toBe(11);
    expect(() =>
      encodeRuntimeParameter(
        {
          ...speed,
          maximum: 3_000_000_000,
          step: 1,
        },
        3_000_000_000,
      ),
    ).toThrow(/too many steps/);
  });

  it("parses a bounded runtime snapshot", () => {
    expect(
      parseRuntimeState(
        '{"revision":3,"parameters":[],"watches":[{"name":"error","label":"Error","value":2.5,"unit":"mm"}]}',
      ).watches[0]?.unit,
    ).toBe("mm");
    expect(
      parseRuntimeState(
        '{"revision":4,"parameters":[],"watches":[],"plots":[{"name":"error","label":"Position error","value":2.5,"unit":"mm"}]}',
      ).plots[0],
    ).toEqual({
      name: "error",
      label: "Position error",
      value: 2.5,
      unit: "mm",
    });
    expect(() => parseRuntimeState('{"parameters":[]}')).toThrow(/malformed/);
  });

  it("rejects malformed declarations before rendering student data", () => {
    expect(() =>
      parseRuntimeState(
        '{"revision":1,"parameters":[{"name":"speed","label":"Speed","kind":"number","value":500,"minimum":0,"maximum":200,"step":5}],"watches":[]}',
      ),
    ).toThrow(/malformed/);
    expect(() =>
      parseRuntimeState(
        '{"revision":1,"parameters":[{"name":"enabled","label":"Enabled","kind":"toggle","value":"yes"}],"watches":[]}',
      ),
    ).toThrow(/malformed/);
    expect(() =>
      parseRuntimeState(
        '{"revision":1,"parameters":[],"watches":[{"name":"error","label":"Error","value":null}]}',
      ),
    ).toThrow(/malformed/);
    expect(
      parseRuntimeState(
        '{"revision":1,"parameters":[{"name":"speed","label":"Speed","kind":"number","value":0,"minimum":0,"maximum":1,"step":0.3}],"watches":[]}',
      ).parameters[0]?.maximum,
    ).toBe(1);
  });
});
