export type TargetKind = "virtual" | "physical";
export type PhysicalConnectionMode = "access_point" | "station";

export interface TargetPreference {
  kind: TargetKind;
  physicalConnection: PhysicalConnectionMode;
  physicalEndpoint: string;
}

export const TARGET_PREFERENCE_KEY = "ucsb-xrp-target-v1";
export const XRP_ACCESS_POINT_ENDPOINT = "http://192.168.42.1";
export const DEFAULT_TARGET_PREFERENCE: TargetPreference = {
  kind: "virtual",
  physicalConnection: "access_point",
  physicalEndpoint: "http://192.168.7.30",
};

export function physicalEndpointForPreference(value: TargetPreference): string {
  return value.physicalConnection === "access_point"
    ? XRP_ACCESS_POINT_ENDPOINT
    : value.physicalEndpoint;
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
      physicalEndpoint: hasStoredEndpoint
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
