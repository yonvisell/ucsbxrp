import { describe, expect, it } from "vitest";

import {
  commissioningEndpointCandidates,
  hasUsableNetworkProfile,
  networkChoiceVisibility,
  stationFallbackReason,
} from "./CommissionApp";

describe("commissioning network choices", () => {
  it("does not duplicate an installed hotspot with another hotspot choice", () => {
    expect(
      networkChoiceVisibility({
        present: true,
        mode: "access_point",
        accessPointSsid: "UCSB-XRP-TEAM",
      }),
    ).toEqual({
      keepCurrent: true,
      robotHotspot: false,
      existingWifi: true,
    });
  });

  it("offers keep, hotspot, and different-Wi-Fi actions for station mode", () => {
    expect(
      networkChoiceVisibility({
        present: true,
        mode: "station",
        stationSsid: "COURSE-NETWORK",
        stationPasswordConfigured: true,
      }),
    ).toEqual({
      keepCurrent: true,
      robotHotspot: true,
      existingWifi: true,
    });
  });

  it("offers only the two actual network modes on a new XRP", () => {
    expect(networkChoiceVisibility(null)).toEqual({
      keepCurrent: false,
      robotHotspot: true,
      existingWifi: true,
    });
  });

  it("does not preserve an incomplete station profile during repair", () => {
    const incomplete = {
      present: true,
      mode: "station" as const,
      stationSsid: "",
    };
    expect(hasUsableNetworkProfile(incomplete)).toBe(false);
    expect(networkChoiceVisibility(incomplete)).toEqual({
      keepCurrent: false,
      robotHotspot: true,
      existingWifi: true,
    });
  });

  it("keeps complete hotspot and station profiles", () => {
    expect(
      hasUsableNetworkProfile({ present: true, mode: "access_point" }),
    ).toBe(true);
    expect(
      hasUsableNetworkProfile({
        present: true,
        mode: "station",
        stationSsid: "Course network",
        stationPasswordConfigured: true,
      }),
    ).toBe(true);
  });

  it("does not keep a station profile whose password is missing", () => {
    expect(
      hasUsableNetworkProfile({
        present: true,
        mode: "station",
        stationSsid: "Course network",
        stationPasswordConfigured: false,
      }),
    ).toBe(false);
  });

  it("turns station fallback statuses into corrective explanations", () => {
    expect(stationFallbackReason("wrong_password", "Pink")).toContain(
      "rejected the password",
    );
    expect(stationFallbackReason("network_not_found", "Pink")).toContain(
      "2.4 GHz",
    );
    expect(stationFallbackReason("waiting_for_ip", "Pink")).toContain(
      "network address",
    );
    expect(stationFallbackReason("connect_failed", "Pink")).toContain(
      "could not join",
    );
  });

  it("discovers station service by stable local name before the pre-restart address", () => {
    expect(
      commissioningEndpointCandidates(
        { mode: "station", address: "192.168.7.34" },
        "4c91fae8f1775aa4",
      ),
    ).toEqual([
      "http://ucsb-xrp-4c91fae8f1775aa4.local",
      "http://192.168.7.34",
    ]);
    expect(
      commissioningEndpointCandidates(
        { mode: "access_point", address: "192.168.4.1" },
        "4c91fae8f1775aa4",
      ),
    ).toEqual(["http://192.168.4.1"]);
  });
});
