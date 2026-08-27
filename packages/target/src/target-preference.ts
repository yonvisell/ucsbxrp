export type TargetKind = "virtual" | "physical";
export type PhysicalConnectionMode = "access_point" | "station";

export interface TargetPreference {
  kind: TargetKind;
  physicalConnection: PhysicalConnectionMode;
  physicalEndpoint: string;
}

export const TARGET_PREFERENCE_KEY = "ucsb-xrp-target-v1";
export const XRP_ACCESS_POINT_ENDPOINT = "http://192.168.4.1";
export const XRP_LOCAL_ENDPOINT = "http://ucsb-xrp.local";
export const DEFAULT_TARGET_PREFERENCE: TargetPreference = {
  kind: "virtual",
  physicalConnection: "station",
  physicalEndpoint: XRP_LOCAL_ENDPOINT,
};

export function physicalEndpointForPreference(value: TargetPreference): string {
  return value.physicalConnection === "access_point"
    ? XRP_ACCESS_POINT_ENDPOINT
    : value.physicalEndpoint;
}

export function physicalEndpointCandidates(
  value: TargetPreference,
): readonly string[] {
  if (value.physicalConnection === "access_point") {
    return [XRP_ACCESS_POINT_ENDPOINT];
  }
  // A router may assign a different address after either device restarts. The
  // local hostname is a second address on the same selected Wi-Fi network.
  // Do not silently try the robot hotspot: the computer cannot use that
  // network until the student explicitly joins it.
  return [...new Set([value.physicalEndpoint, XRP_LOCAL_ENDPOINT])];
}

export function targetPreferenceForPhysicalNetwork(
  current: TargetPreference,
  network: {
    mode: PhysicalConnectionMode;
    address: string;
  },
): TargetPreference {
  if (
    current.physicalConnection === network.mode &&
    current.physicalEndpoint === network.address
  ) {
    return current;
  }
  return {
    ...current,
    physicalConnection: network.mode,
    physicalEndpoint: network.address,
  };
}

export function loadTargetPreference(): TargetPreference {
  try {
    const raw = localStorage.getItem(TARGET_PREFERENCE_KEY);
    if (!raw) {
      return DEFAULT_TARGET_PREFERENCE;
    }
    const value = JSON.parse(raw) as Partial<TargetPreference>;
    // Stored records from the station-only release had no connection field.
    // Preserve their existing endpoint instead of silently switching networks.
    const hasStoredEndpoint =
      typeof value.physicalEndpoint === "string" &&
      value.physicalEndpoint.trim().length > 0;
    const physicalConnection =
      value.physicalConnection === "access_point" ||
      value.physicalConnection === "station"
        ? value.physicalConnection
        : hasStoredEndpoint
          ? "station"
          : DEFAULT_TARGET_PREFERENCE.physicalConnection;
    return {
      kind: value.kind === "physical" ? "physical" : "virtual",
      physicalConnection,
      physicalEndpoint:
        physicalConnection === "access_point"
          ? XRP_ACCESS_POINT_ENDPOINT
          : hasStoredEndpoint
            ? value.physicalEndpoint!
            : DEFAULT_TARGET_PREFERENCE.physicalEndpoint,
    };
  } catch {
    return DEFAULT_TARGET_PREFERENCE;
  }
}

export function storeTargetPreference(value: TargetPreference): void {
  localStorage.setItem(TARGET_PREFERENCE_KEY, JSON.stringify(value));
}
