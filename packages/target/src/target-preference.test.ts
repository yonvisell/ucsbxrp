import { beforeEach, describe, expect, it } from "vitest";

import {
  DEFAULT_TARGET_PREFERENCE,
  TARGET_PREFERENCE_KEY,
  XRP_ACCESS_POINT_ENDPOINT,
  XRP_LOCAL_ENDPOINT,
  loadTargetPreference,
  physicalEndpointCandidates,
  physicalEndpointForPreference,
  storeTargetPreference,
  targetPreferenceForPhysicalNetwork,
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

  it("uses only the explicitly selected XRP hotspot endpoint", () => {
    const preference = {
      kind: "physical" as const,
      physicalConnection: "access_point" as const,
      physicalEndpoint: "http://192.168.7.34",
    };

    expect(physicalEndpointForPreference(preference)).toBe(
      XRP_ACCESS_POINT_ENDPOINT,
    );
    expect(physicalEndpointCandidates(preference)).toEqual([
      XRP_ACCESS_POINT_ENDPOINT,
    ]);
  });

  it("tries the verified station address before the local hostname", () => {
    expect(
      physicalEndpointCandidates({
        kind: "physical",
        physicalConnection: "station",
        physicalEndpoint: "http://192.168.7.34",
      }),
    ).toEqual(["http://192.168.7.34", XRP_LOCAL_ENDPOINT]);
  });

  it("uses the XRP hostname when a router changed its DHCP address", () => {
    expect(
      physicalEndpointCandidates({
        kind: "physical",
        physicalConnection: "station",
        physicalEndpoint: "http://192.168.7.30",
      }),
    ).toContain(XRP_LOCAL_ENDPOINT);
  });

  it("adopts the network and address that the XRP actually reports", () => {
    const station = targetPreferenceForPhysicalNetwork(
      {
        kind: "physical",
        physicalConnection: "access_point",
        physicalEndpoint: "http://192.168.7.30",
      },
      { mode: "station", address: "http://192.168.7.25" },
    );
    expect(station).toEqual({
      kind: "physical",
      physicalConnection: "station",
      physicalEndpoint: "http://192.168.7.25",
    });
    expect(
      targetPreferenceForPhysicalNetwork(station, {
        mode: "access_point",
        address: XRP_ACCESS_POINT_ENDPOINT,
      }),
    ).toEqual({
      kind: "physical",
      physicalConnection: "access_point",
      physicalEndpoint: XRP_ACCESS_POINT_ENDPOINT,
    });
  });

  it("keeps the same preference object when the reported network is unchanged", () => {
    const station = {
      kind: "physical" as const,
      physicalConnection: "station" as const,
      physicalEndpoint: "http://192.168.7.25",
    };
    expect(
      targetPreferenceForPhysicalNetwork(station, {
        mode: "station",
        address: "http://192.168.7.25",
      }),
    ).toBe(station);

    const hotspot = {
      ...station,
      physicalConnection: "access_point" as const,
      physicalEndpoint: XRP_ACCESS_POINT_ENDPOINT,
    };
    expect(
      targetPreferenceForPhysicalNetwork(hotspot, {
        mode: "access_point",
        address: XRP_ACCESS_POINT_ENDPOINT,
      }),
    ).toBe(hotspot);
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
