import { beforeEach, describe, expect, it } from "vitest";

import {
  DEFAULT_TARGET_PREFERENCE,
  TARGET_PREFERENCE_KEY,
  loadTargetPreference,
  storeTargetPreference,
} from "./target-preference";

describe("shared target preference", () => {
  beforeEach(() => {
    const values = new Map<string, string>();
    Object.defineProperty(globalThis, "localStorage", {
      configurable: true,
      value: {
        clear: () => values.clear(),
        getItem: (key: string) => values.get(key) ?? null,
        setItem: (key: string, value: string) => values.set(key, value),
      },
    });
  });

  it("defaults to the virtual XRP", () => {
    expect(loadTargetPreference()).toEqual(DEFAULT_TARGET_PREFERENCE);
  });

  it("round trips the physical address used by both apps", () => {
    storeTargetPreference({
      kind: "physical",
      physicalEndpoint: "http://192.168.7.30",
    });
    expect(loadTargetPreference()).toEqual({
      kind: "physical",
      physicalEndpoint: "http://192.168.7.30",
    });
  });

  it("repairs invalid stored values", () => {
    localStorage.setItem(
      TARGET_PREFERENCE_KEY,
      JSON.stringify({ kind: "unknown", physicalEndpoint: "" }),
    );
    expect(loadTargetPreference()).toEqual(DEFAULT_TARGET_PREFERENCE);
  });
});
