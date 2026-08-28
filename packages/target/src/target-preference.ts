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

/** Runtime view of the robot record stored in the Working-folder manifest. */
export interface RobotProfile {
  schemaVersion: 2;
  kind: TargetKind;
  robotId?: string;
  /** Hostname verified from this robot after commissioning, without `.local`. */
  hostname?: string;
  physicalConnection: PhysicalConnectionMode;
  stationEndpoint: string;
  accessPointEndpoint: string;
  lastObservedNetwork?: PhysicalNetworkObservation;
}

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

function normalizedHostname(value: unknown): string | undefined {
  const hostname = nonemptyString(value)
    ?.toLocaleLowerCase()
    .replace(/\.local\.?$/, "");
  if (
    !hostname ||
    hostname.length > 63 ||
    !/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(hostname)
  ) {
    return undefined;
  }
  return hostname;
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
  const hostnameEndpoint = value.hostname
    ? `http://${value.hostname}.local`
    : XRP_LOCAL_ENDPOINT;
  // The identity-specific hostname survives DHCP address changes. Keep the
  // last verified address as a direct fallback on the same network.
  return [...new Set([hostnameEndpoint, value.stationEndpoint])];
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
    hostname?: string;
    observedAtMs?: number;
  },
): RobotProfile {
  const observedRobotId = normalizedRobotId(network.robotId);
  const observedHostname = normalizedHostname(network.hostname);
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
    ...(observedHostname ? { hostname: observedHostname } : {}),
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
    hostname: string;
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
  const hostname = normalizedHostname(result.hostname);
  if (!hostname) {
    throw new Error("The commissioned XRP did not report a valid network name");
  }
  const replacingRobot = Boolean(
    current.robotId && current.robotId !== robotId,
  );
  const base: RobotProfile = {
    ...current,
    kind: "physical",
    robotId,
    hostname,
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
    hostname,
    observedAtMs: result.observedAtMs,
  });
  // Commissioning records the network that was actually verified. If a
  // requested station join fell back to the robot hotspot, the next IDE must
  // use that hotspot route instead of the unreachable requested station.
  return { ...observed, physicalConnection: result.mode };
}
