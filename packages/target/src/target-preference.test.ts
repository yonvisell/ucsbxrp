import { beforeEach, describe, expect, it } from "vitest";

import {
  DEFAULT_TARGET_PREFERENCE,
  TARGET_PREFERENCE_KEY,
  XRP_ACCESS_POINT_ENDPOINT,
  loadTargetPreference,
  physicalEndpointForPreference,
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
      physicalConnection: "station",
      physicalEndpoint: "http://192.168.7.30",
    });
    expect(loadTargetPreference()).toEqual({
      kind: "physical",
      physicalConnection: "station",
      physicalEndpoint: "http://192.168.7.30",
    });
  });

  it("uses the fixed XRP hotspot endpoint without discarding the station address", () => {
    const preference = {
      kind: "physical" as const,
      physicalConnection: "access_point" as const,
      physicalEndpoint: "http://192.168.7.34",
    };

    expect(physicalEndpointForPreference(preference)).toBe(
      XRP_ACCESS_POINT_ENDPOINT,
    );
    expect(preference.physicalEndpoint).toBe("http://192.168.7.34");
  });

  it("migrates the station-only stored record without changing its route", () => {
    localStorage.setItem(
      TARGET_PREFERENCE_KEY,
      JSON.stringify({
        kind: "physical",
        physicalEndpoint: "http://192.168.7.34",
      }),
    );

    expect(loadTargetPreference()).toEqual({
      kind: "physical",
      physicalConnection: "station",
      physicalEndpoint: "http://192.168.7.34",
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
