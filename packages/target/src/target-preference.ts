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
  const preferred = physicalEndpointForPreference(value);
  const alternate =
    value.physicalConnection === "access_point"
      ? value.physicalEndpoint
      : XRP_ACCESS_POINT_ENDPOINT;
  // A router may assign a different address after either device restarts.
  // The XRP publishes this stable local hostname, so try it before asking the
  // student to discover or type a new numeric address.
  return [
    ...new Set([preferred, XRP_LOCAL_ENDPOINT, alternate].filter(Boolean)),
  ];
}

export function targetPreferenceForPhysicalNetwork(
  current: TargetPreference,
  network: {
    mode: PhysicalConnectionMode;
    address: string;
  },
): TargetPreference {
  if (network.mode === "access_point") {
    if (current.physicalConnection === "access_point") {
      return current;
    }
    return {
      ...current,
      physicalConnection: "access_point",
      // The access-point address is fixed. Keep the last station address so
      // switching back to an existing network remains a one-step operation.
    };
  }
  if (
    current.physicalConnection === "station" &&
    current.physicalEndpoint === network.address
  ) {
    return current;
  }
  return {
    ...current,
    physicalConnection: "station",
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
