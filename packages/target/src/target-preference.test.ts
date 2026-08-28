import { describe, expect, it } from "vitest";

import {
  DEFAULT_TARGET_PREFERENCE,
  XRP_ACCESS_POINT_ENDPOINT,
  XRP_LOCAL_ENDPOINT,
  physicalEndpointCandidates,
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
  it("normalizes robot identity and refreshes the verified station route", () => {
    const profile = targetPreferenceForPhysicalNetwork(stationProfile(), {
      mode: "station",
      address: "http://192.168.7.31",
      ssid: "Pink",
      requestedMode: "station",
      fallback: false,
      robotId: "ROBOT-A",
      hostname: "UCSB-XRP-ROBOT-A",
      observedAtMs: 42,
    });
    expect(profile.stationEndpoint).toBe("http://192.168.7.31");
    expect(profile.hostname).toBe("ucsb-xrp-robot-a");
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
      XRP_LOCAL_ENDPOINT,
      "http://192.168.7.44",
    ]);
  });

  it("uses only the route for the explicitly selected network", () => {
    const station = stationProfile();
    expect(physicalEndpointCandidates(station)).toEqual([
      XRP_LOCAL_ENDPOINT,
      "http://192.168.7.30",
    ]);

    const hotspot = targetPreferenceForConfiguredNetwork(station, {
      mode: "access_point",
    });
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
    expect(stationAgain.stationEndpoint).toBe("http://192.168.7.30");
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
    expect(physicalEndpointCandidates(observed)).toEqual([
      XRP_LOCAL_ENDPOINT,
      "http://192.168.7.30",
    ]);
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
        hostname: "UCSB-XRP-4C91FAE8F1775AA4",
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
      hostname: "ucsb-xrp-4c91fae8f1775aa4",
      physicalConnection: "station",
      stationEndpoint: "http://192.168.7.25",
      accessPointEndpoint: XRP_ACCESS_POINT_ENDPOINT,
    });
    expect(physicalEndpointCandidates(commissioned)).toEqual([
      "http://ucsb-xrp-4c91fae8f1775aa4.local",
      "http://192.168.7.25",
    ]);
  });

  it("uses the verified hotspot after a commissioned station fallback", () => {
    const commissioned = targetPreferenceForCommissionedRobot(
      stationProfile(),
      {
        robotId: "robot-a",
        hostname: "ucsb-xrp-robot-a",
        requestedMode: "station",
        mode: "access_point",
        address: XRP_ACCESS_POINT_ENDPOINT,
        ssid: "UCSB-XRP-ROBOT-A",
        fallback: true,
        observedAtMs: 201,
      },
    );
    expect(commissioned.physicalConnection).toBe("access_point");
    expect(commissioned.stationEndpoint).toBe("http://192.168.7.30");
    expect(commissioned.lastObservedNetwork?.mode).toBe("access_point");
    expect(physicalEndpointCandidates(commissioned)).toEqual([
      XRP_ACCESS_POINT_ENDPOINT,
    ]);
  });
});
