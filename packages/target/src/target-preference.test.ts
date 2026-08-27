import { beforeEach, describe, expect, it } from "vitest";

import {
  DEFAULT_TARGET_PREFERENCE,
  LEGACY_TARGET_PREFERENCE_KEY,
  TARGET_PREFERENCE_KEY,
  XRP_ACCESS_POINT_ENDPOINT,
  XRP_LOCAL_ENDPOINT,
  loadTargetPreference,
  physicalEndpointCandidates,
  physicalEndpointForPreference,
  storeTargetPreference,
  targetPreferenceForCommissionedRobot,
  targetPreferenceForConfiguredNetwork,
  targetPreferenceForPhysicalNetwork,
  type RobotProfile,
} from "./target-preference";

function stationProfile(): RobotProfile {
  return {
    schemaVersion: 2,
    kind: "physical",
    robotId: "robot-a",
    physicalConnection: "station",
    stationEndpoint: "http://192.168.7.30",
    accessPointEndpoint: XRP_ACCESS_POINT_ENDPOINT,
  };
}

describe("shared robot profile", () => {
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

  it("defaults to the virtual XRP with distinct station and hotspot routes", () => {
    expect(loadTargetPreference()).toEqual(DEFAULT_TARGET_PREFERENCE);
  });

  it("round trips robot identity, configured routes, and the last observation", () => {
    const profile = targetPreferenceForPhysicalNetwork(stationProfile(), {
      mode: "station",
      address: "http://192.168.7.31",
      ssid: "Pink",
      requestedMode: "station",
      fallback: false,
      robotId: "ROBOT-A",
      observedAtMs: 42,
    });
    storeTargetPreference(profile);
    expect(loadTargetPreference()).toEqual(profile);
    expect(profile.stationEndpoint).toBe("http://192.168.7.31");
  });

  it("refreshes a stale station route only after the selected robot proves it", () => {
    const refreshed = targetPreferenceForPhysicalNetwork(stationProfile(), {
      mode: "station",
      address: "http://192.168.7.44",
      ssid: "Pink",
      requestedMode: "station",
      fallback: false,
      robotId: "robot-a",
      observedAtMs: 43,
    });

    expect(refreshed.stationEndpoint).toBe("http://192.168.7.44");
    expect(physicalEndpointCandidates(refreshed)).toEqual([
      "http://192.168.7.44",
      XRP_LOCAL_ENDPOINT,
    ]);
  });

  it("uses only the route for the explicitly selected network", () => {
    const station = stationProfile();
    expect(physicalEndpointForPreference(station)).toBe("http://192.168.7.30");
    expect(physicalEndpointCandidates(station)).toEqual([
      "http://192.168.7.30",
      XRP_LOCAL_ENDPOINT,
    ]);

    const hotspot = targetPreferenceForConfiguredNetwork(station, {
      mode: "access_point",
    });
    expect(physicalEndpointForPreference(hotspot)).toBe(
      XRP_ACCESS_POINT_ENDPOINT,
    );
    expect(physicalEndpointCandidates(hotspot)).toEqual([
      XRP_ACCESS_POINT_ENDPOINT,
    ]);
  });

  it("preserves the station route through station to AP to station choices", () => {
    const station = stationProfile();
    const hotspot = targetPreferenceForConfiguredNetwork(station, {
      mode: "access_point",
    });
    expect(hotspot).toMatchObject({
      physicalConnection: "access_point",
      stationEndpoint: "http://192.168.7.30",
      accessPointEndpoint: XRP_ACCESS_POINT_ENDPOINT,
    });

    const stationAgain = targetPreferenceForConfiguredNetwork(hotspot, {
      mode: "station",
    });
    expect(physicalEndpointForPreference(stationAgain)).toBe(
      "http://192.168.7.30",
    );
  });

  it("records a station fallback without overwriting the configured station route", () => {
    const current = stationProfile();
    const observed = targetPreferenceForPhysicalNetwork(current, {
      mode: "access_point",
      requestedMode: "station",
      fallback: true,
      address: XRP_ACCESS_POINT_ENDPOINT,
      ssid: "UCSB-XRP-ROBOT-A",
      robotId: "robot-a",
      observedAtMs: 100,
    });

    expect(observed).toMatchObject({
      physicalConnection: "station",
      stationEndpoint: "http://192.168.7.30",
      accessPointEndpoint: XRP_ACCESS_POINT_ENDPOINT,
      lastObservedNetwork: {
        mode: "access_point",
        requestedMode: "station",
        fallback: true,
        address: XRP_ACCESS_POINT_ENDPOINT,
      },
    });
    expect(physicalEndpointForPreference(observed)).toBe("http://192.168.7.30");
  });

  it("adopts a verified identity once and rejects a different robot", () => {
    const unidentified = { ...stationProfile(), robotId: undefined };
    const identified = targetPreferenceForPhysicalNetwork(unidentified, {
      mode: "station",
      address: "http://192.168.7.30",
      robotId: "robot-a",
      observedAtMs: 1,
    });
    expect(identified.robotId).toBe("robot-a");
    expect(() =>
      targetPreferenceForPhysicalNetwork(identified, {
        mode: "station",
        address: "http://192.168.7.40",
        robotId: "robot-b",
        observedAtMs: 2,
      }),
    ).toThrow(/does not match/);
    expect(identified.stationEndpoint).toBe("http://192.168.7.30");
  });

  it("stores a successful commissioned station route", () => {
    const commissioned = targetPreferenceForCommissionedRobot(
      DEFAULT_TARGET_PREFERENCE,
      {
        robotId: "4C91FAE8F1775AA4",
        requestedMode: "station",
        mode: "station",
        address: "http://192.168.7.25",
        ssid: "Pink",
        fallback: false,
        observedAtMs: 200,
      },
    );
    expect(commissioned).toMatchObject({
      kind: "physical",
      robotId: "4c91fae8f1775aa4",
      physicalConnection: "station",
      stationEndpoint: "http://192.168.7.25",
      accessPointEndpoint: XRP_ACCESS_POINT_ENDPOINT,
    });
  });

  it("does not turn a commissioned station fallback into the configured route", () => {
    const commissioned = targetPreferenceForCommissionedRobot(
      stationProfile(),
      {
        robotId: "robot-a",
        requestedMode: "station",
        mode: "access_point",
        address: XRP_ACCESS_POINT_ENDPOINT,
        ssid: "UCSB-XRP-ROBOT-A",
        fallback: true,
        observedAtMs: 201,
      },
    );
    expect(commissioned.physicalConnection).toBe("station");
    expect(commissioned.stationEndpoint).toBe("http://192.168.7.30");
    expect(commissioned.lastObservedNetwork?.mode).toBe("access_point");
  });

  it("migrates a v1 station record without deleting or changing it", () => {
    const legacy = JSON.stringify({
      kind: "physical",
      physicalEndpoint: "http://192.168.7.34",
    });
    localStorage.setItem(LEGACY_TARGET_PREFERENCE_KEY, legacy);

    expect(loadTargetPreference()).toEqual({
      schemaVersion: 2,
      kind: "physical",
      physicalConnection: "station",
      stationEndpoint: "http://192.168.7.34",
      accessPointEndpoint: XRP_ACCESS_POINT_ENDPOINT,
    });
    expect(localStorage.getItem(LEGACY_TARGET_PREFERENCE_KEY)).toBe(legacy);
    expect(
      JSON.parse(localStorage.getItem(TARGET_PREFERENCE_KEY)!),
    ).toMatchObject({
      schemaVersion: 2,
      stationEndpoint: "http://192.168.7.34",
    });
  });

  it("preserves a distinct station address carried by a v1 AP record", () => {
    localStorage.setItem(
      LEGACY_TARGET_PREFERENCE_KEY,
      JSON.stringify({
        kind: "physical",
        physicalConnection: "access_point",
        physicalEndpoint: "http://192.168.7.34",
      }),
    );
    expect(loadTargetPreference()).toMatchObject({
      physicalConnection: "access_point",
      stationEndpoint: "http://192.168.7.34",
      accessPointEndpoint: XRP_ACCESS_POINT_ENDPOINT,
    });
  });

  it("repairs invalid stored values", () => {
    localStorage.setItem(
      TARGET_PREFERENCE_KEY,
      JSON.stringify({ schemaVersion: 2, kind: "unknown" }),
    );
    expect(loadTargetPreference()).toEqual(DEFAULT_TARGET_PREFERENCE);
  });
});
