import {
  DEFAULT_TARGET_PREFERENCE,
  XRP_ACCESS_POINT_ENDPOINT,
  type RobotProfile,
} from "@ucsb-xrp/target";

import {
  loadRememberedWorkspaceFolder,
  loadWorkspaceManifest,
  mutateWorkspaceManifest,
  type CourseDirectoryHandle,
  type WorkspaceManifest,
  type WorkspaceManifestRobot,
} from "./course-folder";

type RobotProfileUpdate = (current: RobotProfile) => RobotProfile;

function endpoint(address: string): string {
  const trimmed = address.trim();
  if (!trimmed) return "";
  return /^https?:\/\//i.test(trimmed) ? trimmed : `http://${trimmed}`;
}

function address(endpointValue: string): string {
  try {
    return new URL(endpointValue).host;
  } catch {
    return endpointValue.replace(/^https?:\/\//i, "").replace(/\/$/, "");
  }
}

function selectedTarget(manifest: WorkspaceManifest | null) {
  return manifest?.settings?.target === "physical" ? "physical" : "virtual";
}

/** Derive the runtime connection from the one Working-folder manifest. */
export function targetPreferenceFromWorkspaceManifest(
  manifest: WorkspaceManifest | null,
): RobotProfile {
  const kind = selectedTarget(manifest);
  const robot = manifest?.robot;
  if (!robot) return DEFAULT_TARGET_PREFERENCE;

  const hostname = robot.name
    .trim()
    .toLocaleLowerCase()
    .replace(/\.local\.?$/, "");
  const verifiedEndpoint = endpoint(robot.address);
  return {
    schemaVersion: 2,
    kind,
    robotId: robot.id.trim().toLocaleLowerCase(),
    hostname,
    physicalConnection: robot.networkMode,
    stationEndpoint:
      robot.networkMode === "station"
        ? verifiedEndpoint
        : `http://${hostname}.local`,
    accessPointEndpoint: XRP_ACCESS_POINT_ENDPOINT,
    lastObservedNetwork: {
      mode: robot.networkMode,
      address: verifiedEndpoint,
      ...(robot.ssid ? { ssid: robot.ssid } : {}),
      observedAtMs: 0,
    },
  };
}

function robotRecord(
  profile: RobotProfile,
  previous: WorkspaceManifestRobot | undefined,
): WorkspaceManifestRobot | undefined {
  const id = profile.robotId?.trim().toLocaleLowerCase();
  const name = profile.hostname
    ?.trim()
    .toLocaleLowerCase()
    .replace(/\.local\.?$/, "");
  if (!id || !name) return previous;

  const observation = profile.lastObservedNetwork;
  const observedOnSelectedNetwork =
    observation?.mode === profile.physicalConnection;
  const selectedEndpoint =
    profile.physicalConnection === "access_point"
      ? profile.accessPointEndpoint
      : profile.stationEndpoint;
  const observedAddress = observedOnSelectedNetwork
    ? address(observation.address)
    : "";
  return {
    id,
    name,
    networkMode: profile.physicalConnection,
    ssid:
      (observedOnSelectedNetwork ? observation.ssid?.trim() : undefined) ??
      previous?.ssid ??
      "",
    address: observedAddress || address(selectedEndpoint),
  };
}

function manifestForTargetPreference(
  manifest: WorkspaceManifest,
  preference: RobotProfile,
): WorkspaceManifest {
  const robot = robotRecord(preference, manifest.robot);
  return {
    ...manifest,
    ...(robot ? { robot } : {}),
    settings: {
      ...(manifest.settings ?? {}),
      target: preference.kind,
    },
  };
}

export async function loadWorkspaceTargetPreference(
  workspace?: CourseDirectoryHandle | null,
): Promise<RobotProfile> {
  const folder = workspace ?? (await loadRememberedWorkspaceFolder());
  if (!folder) return DEFAULT_TARGET_PREFERENCE;
  return targetPreferenceFromWorkspaceManifest(
    await loadWorkspaceManifest(folder),
  );
}

/** Persist a target or verified network change in .ucsbxrp.json. */
export async function updateWorkspaceTargetPreference(
  update: RobotProfileUpdate,
  workspace?: CourseDirectoryHandle | null,
): Promise<RobotProfile> {
  const folder = workspace ?? (await loadRememberedWorkspaceFolder());
  if (!folder) {
    throw new Error("Choose a Working folder before selecting an XRP");
  }

  let updated = DEFAULT_TARGET_PREFERENCE;
  const manifest = await mutateWorkspaceManifest(folder, (current) => {
    updated = update(targetPreferenceFromWorkspaceManifest(current));
    return manifestForTargetPreference(current, updated);
  });
  if (!manifest) {
    throw new Error("The XRP setting could not be saved to .ucsbxrp.json");
  }
  return updated;
}
