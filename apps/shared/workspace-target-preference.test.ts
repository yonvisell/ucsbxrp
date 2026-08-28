import { describe, expect, it } from "vitest";

import { XRP_ACCESS_POINT_ENDPOINT } from "@ucsb-xrp/target";

import { targetPreferenceFromWorkspaceManifest } from "./workspace-target-preference";

describe("Working-folder target preference", () => {
  it("derives a commissioned station robot from .ucsbxrp.json", () => {
    const profile = targetPreferenceFromWorkspaceManifest({
      schemaVersion: 1,
      activeProject: "ExpandingSpiral",
      settings: { target: "physical" },
      robot: {
        id: "4C91FAE8F1775AA4",
        name: "UCSB-XRP-4C91FAE8F1775AA4",
        networkMode: "station",
        ssid: "Pink",
        address: "192.168.7.25",
      },
    });

    expect(profile).toMatchObject({
      kind: "physical",
      robotId: "4c91fae8f1775aa4",
      hostname: "ucsb-xrp-4c91fae8f1775aa4",
      physicalConnection: "station",
      stationEndpoint: "http://192.168.7.25",
      accessPointEndpoint: XRP_ACCESS_POINT_ENDPOINT,
    });
  });

  it("uses the fixed hotspot route only when the manifest says hotspot", () => {
    const profile = targetPreferenceFromWorkspaceManifest({
      schemaVersion: 1,
      activeProject: null,
      settings: { target: "physical" },
      robot: {
        id: "robot-a",
        name: "ucsb-xrp-visell",
        networkMode: "access_point",
        ssid: "UCSB-XRP-VISELL",
        address: "192.168.4.1",
      },
    });

    expect(profile.physicalConnection).toBe("access_point");
    expect(profile.accessPointEndpoint).toBe(XRP_ACCESS_POINT_ENDPOINT);
    expect(profile.stationEndpoint).toBe("http://ucsb-xrp-visell.local");
  });
});
