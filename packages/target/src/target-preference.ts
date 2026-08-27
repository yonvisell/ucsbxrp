export type TargetKind = "virtual" | "physical";
export type PhysicalConnectionMode = "access_point" | "station";

export interface PhysicalNetworkObservation {
  mode: PhysicalConnectionMode;
  address: string;
  ssid?: string;
  requestedMode?: PhysicalConnectionMode;
  fallback?: boolean;
  observedAtMs: number;
}

/**
 * One browser-local record owns the selected target and the known robot.
 *
 * The selected network is user intent. A verified connection on that station
 * network refreshes its route, while a hotspot or fallback observation never
 * replaces it. `lastObservedNetwork` retains the evidence shown to the user.
 */
export interface RobotProfile {
  schemaVersion: 2;
  kind: TargetKind;
  robotId?: string;
  physicalConnection: PhysicalConnectionMode;
  stationEndpoint: string;
  accessPointEndpoint: string;
  lastObservedNetwork?: PhysicalNetworkObservation;
}

/** Compatibility name retained while IDE and Monitor adopt RobotProfile. */
export type TargetPreference = RobotProfile;

export const TARGET_PREFERENCE_KEY = "ucsb-xrp-robot-profile-v2";
export const LEGACY_TARGET_PREFERENCE_KEY = "ucsb-xrp-target-v1";
export const XRP_ACCESS_POINT_ENDPOINT = "http://192.168.4.1";
export const XRP_LOCAL_ENDPOINT = "http://ucsb-xrp.local";

export const DEFAULT_TARGET_PREFERENCE: RobotProfile = {
  schemaVersion: 2,
  kind: "virtual",
  physicalConnection: "station",
  stationEndpoint: XRP_LOCAL_ENDPOINT,
  accessPointEndpoint: XRP_ACCESS_POINT_ENDPOINT,
};

function nonemptyString(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function physicalMode(value: unknown): PhysicalConnectionMode | undefined {
  return value === "station" || value === "access_point" ? value : undefined;
}

function normalizedRobotId(value: unknown): string | undefined {
  return nonemptyString(value)?.toLocaleLowerCase();
}

function normalizeObservation(
  value: unknown,
): PhysicalNetworkObservation | undefined {
  if (typeof value !== "object" || value === null) return undefined;
  const candidate = value as Partial<PhysicalNetworkObservation>;
  const mode = physicalMode(candidate.mode);
  const address = nonemptyString(candidate.address);
  const observedAtMs = candidate.observedAtMs;
  if (
    !mode ||
    !address ||
    typeof observedAtMs !== "number" ||
    !Number.isFinite(observedAtMs)
  ) {
    return undefined;
  }
  const requestedMode = physicalMode(candidate.requestedMode);
  const ssid = nonemptyString(candidate.ssid);
  return {
    mode,
    address,
    ...(ssid ? { ssid } : {}),
    ...(requestedMode ? { requestedMode } : {}),
    ...(typeof candidate.fallback === "boolean"
      ? { fallback: candidate.fallback }
      : {}),
    observedAtMs,
  };
}

function normalizeProfile(value: unknown): RobotProfile | null {
  if (typeof value !== "object" || value === null) return null;
  const candidate = value as Partial<RobotProfile>;
  if (candidate.schemaVersion !== 2) return null;
  const stationEndpoint = nonemptyString(candidate.stationEndpoint);
  if (!stationEndpoint) return null;
  const observation = normalizeObservation(candidate.lastObservedNetwork);
  const robotId = normalizedRobotId(candidate.robotId);
  return {
    schemaVersion: 2,
    kind: candidate.kind === "physical" ? "physical" : "virtual",
    physicalConnection:
      physicalMode(candidate.physicalConnection) ??
      DEFAULT_TARGET_PREFERENCE.physicalConnection,
    stationEndpoint,
    // The course hotspot has one fixed route. Ignore drift in stored data.
    accessPointEndpoint: XRP_ACCESS_POINT_ENDPOINT,
    ...(robotId ? { robotId } : {}),
    ...(observation ? { lastObservedNetwork: observation } : {}),
  };
}

function migrateLegacyPreference(value: unknown): RobotProfile | null {
  if (typeof value !== "object" || value === null) return null;
  const candidate = value as {
    kind?: unknown;
    physicalConnection?: unknown;
    physicalEndpoint?: unknown;
  };
  const storedEndpoint = nonemptyString(candidate.physicalEndpoint);
  const connection =
    physicalMode(candidate.physicalConnection) ??
    (storedEndpoint ? "station" : DEFAULT_TARGET_PREFERENCE.physicalConnection);

  // Some v1 AP records still carry the last station address, while later v1
  // records replaced it with 192.168.4.1. Preserve a distinct station value
  // whenever the old record contains one; otherwise use hostname discovery.
  const stationEndpoint =
    storedEndpoint && storedEndpoint !== XRP_ACCESS_POINT_ENDPOINT
      ? storedEndpoint
      : XRP_LOCAL_ENDPOINT;
  return {
    schemaVersion: 2,
    kind: candidate.kind === "physical" ? "physical" : "virtual",
    physicalConnection: connection,
    stationEndpoint,
    accessPointEndpoint: XRP_ACCESS_POINT_ENDPOINT,
  };
}

export function physicalEndpointForPreference(value: RobotProfile): string {
  return value.physicalConnection === "access_point"
    ? value.accessPointEndpoint
    : value.stationEndpoint;
}

export function physicalEndpointCandidates(
  value: RobotProfile,
): readonly string[] {
  if (value.physicalConnection === "access_point") {
    return [value.accessPointEndpoint];
  }
  // A router may assign a different address after either device restarts. The
  // local hostname is a second address on the same selected Wi-Fi network.
  // Do not silently try the robot hotspot: the computer cannot use that
  // network until the student explicitly joins it.
  return [...new Set([value.stationEndpoint, XRP_LOCAL_ENDPOINT])];
}

/** Apply an explicit IDE or commissioning network choice. */
export function targetPreferenceForConfiguredNetwork(
  current: RobotProfile,
  network: {
    mode: PhysicalConnectionMode;
    stationAddress?: string;
  },
): RobotProfile {
  const stationAddress = nonemptyString(network.stationAddress);
  const stationEndpoint =
    network.mode === "station" && stationAddress
      ? stationAddress
      : current.stationEndpoint;
  if (
    current.physicalConnection === network.mode &&
    current.stationEndpoint === stationEndpoint &&
    current.accessPointEndpoint === XRP_ACCESS_POINT_ENDPOINT
  ) {
    return current;
  }
  const next: RobotProfile = {
    ...current,
    physicalConnection: network.mode,
    stationEndpoint,
    accessPointEndpoint: XRP_ACCESS_POINT_ENDPOINT,
  };
  return next;
}

/** Retain a verified network report and refresh only a proven station route. */
export function targetPreferenceForPhysicalNetwork(
  current: RobotProfile,
  network: {
    mode: PhysicalConnectionMode;
    address: string;
    ssid?: string;
    requestedMode?: PhysicalConnectionMode;
    fallback?: boolean;
    robotId?: string;
    observedAtMs?: number;
  },
): RobotProfile {
  const observedRobotId = normalizedRobotId(network.robotId);
  if (
    current.robotId &&
    observedRobotId &&
    current.robotId !== observedRobotId
  ) {
    throw new Error(
      `Connected XRP identity ${observedRobotId} does not match ${current.robotId}`,
    );
  }
  const address = nonemptyString(network.address);
  if (!address) return current;
  const ssid = nonemptyString(network.ssid);
  const requestedMode = physicalMode(network.requestedMode);
  const verifiedStationEndpoint =
    network.mode === "station" && network.fallback !== true
      ? address
      : current.stationEndpoint;
  return {
    ...current,
    stationEndpoint: verifiedStationEndpoint,
    ...(current.robotId || !observedRobotId
      ? {}
      : { robotId: observedRobotId }),
    lastObservedNetwork: {
      mode: network.mode,
      address,
      ...(ssid ? { ssid } : {}),
      ...(requestedMode ? { requestedMode } : {}),
      ...(typeof network.fallback === "boolean"
        ? { fallback: network.fallback }
        : {}),
      observedAtMs: network.observedAtMs ?? Date.now(),
    },
  };
}

/** Replace the selected robot after USB and Wi-Fi identity agree. */
export function targetPreferenceForCommissionedRobot(
  current: RobotProfile,
  result: {
    robotId: string;
    requestedMode: PhysicalConnectionMode;
    mode: PhysicalConnectionMode;
    address: string;
    ssid?: string;
    fallback?: boolean;
    observedAtMs?: number;
  },
): RobotProfile {
  const robotId = normalizedRobotId(result.robotId);
  if (!robotId) {
    throw new Error("The commissioned XRP did not report a stable identity");
  }
  const replacingRobot = Boolean(
    current.robotId && current.robotId !== robotId,
  );
  const base: RobotProfile = {
    ...current,
    kind: "physical",
    robotId,
    stationEndpoint: replacingRobot
      ? XRP_LOCAL_ENDPOINT
      : current.stationEndpoint,
    accessPointEndpoint: XRP_ACCESS_POINT_ENDPOINT,
  };
  if (replacingRobot) delete base.lastObservedNetwork;
  const configured = targetPreferenceForConfiguredNetwork(base, {
    mode: result.requestedMode,
    // A station address is a configured route only when station mode actually
    // succeeded. An AP fallback must not replace it.
    stationAddress:
      result.requestedMode === "station" && result.mode === "station"
        ? result.address
        : undefined,
  });
  const observed = targetPreferenceForPhysicalNetwork(configured, {
    mode: result.mode,
    address: result.address,
    ssid: result.ssid,
    requestedMode: result.requestedMode,
    fallback: result.fallback,
    robotId,
    observedAtMs: result.observedAtMs,
  });
  // Commissioning records the network that was actually verified. If a
  // requested station join fell back to the robot hotspot, the next IDE must
  // use that hotspot route instead of the unreachable requested station.
  return { ...observed, physicalConnection: result.mode };
}

export function loadTargetPreference(): RobotProfile {
  try {
    const current = normalizeProfile(
      JSON.parse(localStorage.getItem(TARGET_PREFERENCE_KEY) ?? "null"),
    );
    if (current) return current;

    const legacy = migrateLegacyPreference(
      JSON.parse(localStorage.getItem(LEGACY_TARGET_PREFERENCE_KEY) ?? "null"),
    );
    if (!legacy) return DEFAULT_TARGET_PREFERENCE;
    // Keep the v1 record intact so returning to an older app build remains
    // possible. All current tabs use the independent v2 profile from now on.
    localStorage.setItem(TARGET_PREFERENCE_KEY, JSON.stringify(legacy));
    return legacy;
  } catch {
    return DEFAULT_TARGET_PREFERENCE;
  }
}

export function storeTargetPreference(value: RobotProfile): void {
  const normalized = normalizeProfile(value);
  if (!normalized) {
    throw new Error("Robot profile is incomplete");
  }
  localStorage.setItem(TARGET_PREFERENCE_KEY, JSON.stringify(normalized));
}
