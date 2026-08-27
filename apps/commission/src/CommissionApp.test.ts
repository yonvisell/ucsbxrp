import { describe, expect, it } from "vitest";

import { networkChoiceVisibility } from "./CommissionApp";

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
});
