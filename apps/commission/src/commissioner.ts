import {
  findGrantedXrpPort,
  type ExpectedUsbController,
  type MicroPythonSession,
  type ReplResult,
  type SerialPortLike,
} from "./web-serial";

export interface CommissioningBootstrapFile {
  destination: string;
  url: string;
  bytes: number;
  sha256: string;
  source: string;
}

export interface CommissioningRuntimeFile {
  path: string;
  url: string;
  bytes: number;
  sha256: string;
  source: string;
}

export interface CommissioningCompatibility {
  serviceVersion: string;
  protocolVersion: number;
  protocolRevision: number;
  bootstrapVersion: number;
  courseApiRevision: string;
  courseLibraryVersion: string;
  minimumRobotReleaseSequence: number;
}

export interface CommissioningManifest {
  schemaVersion: 2;
  releaseId: string;
  releaseSequence: number;
  compatibility: CommissioningCompatibility;
  controller: ExpectedUsbController & { id: string };
  micropython: {
    version: string;
    board: string;
    firmware: {
      asset: string;
      url: string;
      bytes: number;
      sha256: string;
    };
  };
  xrplib: {
    version: string;
    requiredModules: string[];
  };
  networkDefaults: {
    mode: "access_point";
    password: string;
    address: string;
  };
  bootstrapFiles: CommissioningBootstrapFile[];
  runtime: {
    manifest: {
      url: string;
      bytes: number;
      sha256: string;
    };
    files: CommissioningRuntimeFile[];
  };
}

export interface DeviceInspection {
  implementation: string;
  version: [number, number, number];
  machine: string;
  robotId: string;
  mpy: number | null;
  modules: string[];
}

export interface ExistingNetworkProfile {
  present: boolean;
  version?: number;
  mode?: "access_point" | "station";
  stationSsid?: string;
  accessPointSsid?: string;
}

export type NetworkSelection =
  | { mode: "keep" }
  | { mode: "access_point"; ssid?: string }
  | { mode: "station"; ssid: string; password: string };

export interface PublicNetworkState {
  ready: boolean;
  mode: "access_point" | "station";
  requested_mode: "access_point" | "station";
  fallback: boolean;
  ssid: string;
  address: string;
  status: string;
  station_status?: string;
  channel?: number;
}

export interface CommissioningResult {
  releaseId: string;
  releaseSequence: number;
  serviceVersion: string;
  runtimeManifestSha256: string;
  activationGeneration: number;
  installedFiles: number;
  unchangedFiles: number;
  network: PublicNetworkState;
}

export interface CommissioningProgress {
  phase: "inspect" | "compare" | "install" | "verify" | "network" | "reset";
  detail: string;
  completed?: number;
  total?: number;
}

export type ProgressReporter = (progress: CommissioningProgress) => void;

const INSPECTION_MARKER = "__UCSB_XRP_INSPECTION__=";
const NETWORK_PROFILE_MARKER = "__UCSB_XRP_NETWORK_PROFILE__=";
const HASH_MARKER = "__UCSB_XRP_HASHES__=";
const RUNTIME_STATE_MARKER = "__UCSB_XRP_RUNTIME_STATE__=";
const VERIFY_MARKER = "__UCSB_XRP_VERIFY__=";
const NETWORK_RESULT_MARKER = "__UCSB_XRP_NETWORK__=";
const NETWORK_HOSTNAME_MARKER = "__UCSB_XRP_NETWORK_HOSTNAME__=";
const INSTALL_WATCHDOG_MS = 8_388;
const textEncoder = new TextEncoder();
export const HOTSPOT_SSID_PREFIX = "UCSB-XRP-";

/** Build the stable local-network name assigned to one verified controller. */
export function robotHostnameForId(robotId: string): string {
  const normalized = robotId.trim().toLocaleLowerCase();
  if (!/^[0-9a-f]+$/.test(normalized)) {
    throw new Error("The XRP controller did not report a stable identity.");
  }
  // The RP2350 identity is currently 64 bits. Keeping the final 64 bits also
  // bounds the DNS label if a future MicroPython build reports a longer ID.
  return `ucsb-xrp-${normalized.slice(-16)}`;
}

/** Convert the optional team name field into a portable Wi-Fi SSID. */
export function hotspotSsidForLastName(value: string): string | undefined {
  const suffix = value.trim().toUpperCase();
  if (!suffix) return undefined;
  if (!/^[A-Z0-9-]+$/.test(suffix)) {
    throw new Error(
      "Use only letters, numbers, and hyphens in the hotspot name.",
    );
  }
  const ssid = `${HOTSPOT_SSID_PREFIX}${suffix}`;
  if (textEncoder.encode(ssid).length > 32) {
    throw new Error("The hotspot name can contain at most 23 characters.");
  }
  return ssid;
}

export class FirmwareRequiredError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FirmwareRequiredError";
  }
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isSha256(value: unknown): value is string {
  return typeof value === "string" && /^[0-9a-f]{64}$/.test(value);
}

function isCommissioningAsset(value: unknown): boolean {
  return (
    isObject(value) &&
    typeof value.url === "string" &&
    typeof value.bytes === "number" &&
    value.bytes >= 0 &&
    isSha256(value.sha256)
  );
}

function assertManifest(
  value: unknown,
): asserts value is CommissioningManifest {
  if (
    !isObject(value) ||
    value.schemaVersion !== 2 ||
    typeof value.releaseId !== "string" ||
    typeof value.releaseSequence !== "number" ||
    !isObject(value.compatibility) ||
    typeof value.compatibility.serviceVersion !== "string" ||
    typeof value.compatibility.protocolVersion !== "number" ||
    typeof value.compatibility.protocolRevision !== "number" ||
    typeof value.compatibility.bootstrapVersion !== "number" ||
    typeof value.compatibility.courseApiRevision !== "string" ||
    typeof value.compatibility.courseLibraryVersion !== "string" ||
    typeof value.compatibility.minimumRobotReleaseSequence !== "number" ||
    !isObject(value.controller) ||
    typeof value.controller.usbVendorId !== "number" ||
    typeof value.controller.usbProductId !== "number" ||
    !isObject(value.micropython) ||
    typeof value.micropython.version !== "string" ||
    !isObject(value.xrplib) ||
    !Array.isArray(value.xrplib.requiredModules) ||
    !isObject(value.networkDefaults) ||
    !Array.isArray(value.bootstrapFiles) ||
    value.bootstrapFiles.length !== 2 ||
    !value.bootstrapFiles.every(
      (entry) =>
        isCommissioningAsset(entry) &&
        isObject(entry) &&
        (entry.destination === "/course_boot.py" ||
          entry.destination === "/main.py"),
    ) ||
    !isObject(value.runtime) ||
    !isObject(value.runtime.manifest) ||
    !isCommissioningAsset(value.runtime.manifest) ||
    !Array.isArray(value.runtime.files) ||
    value.runtime.files.length === 0 ||
    !value.runtime.files.every(
      (entry) =>
        isCommissioningAsset(entry) &&
        isObject(entry) &&
        typeof entry.path === "string" &&
        isSafeRuntimePath(entry.path),
    )
  ) {
    throw new Error("The commissioning release manifest is incomplete.");
  }
  const bootstrapDestinations = value.bootstrapFiles.map(
    (entry) => entry.destination,
  );
  const runtimePaths = value.runtime.files.map((entry) => entry.path);
  if (
    new Set(bootstrapDestinations).size !== bootstrapDestinations.length ||
    new Set(runtimePaths).size !== runtimePaths.length
  ) {
    throw new Error("The commissioning release contains duplicate file paths.");
  }
}

export async function loadCommissioningManifest(
  manifestUrl: URL,
  fetchImplementation: typeof fetch = globalThis.fetch,
): Promise<CommissioningManifest> {
  const response = await fetchImplementation(manifestUrl, {
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error(
      `Commissioning release could not be loaded (${response.status}).`,
    );
  }
  const value: unknown = await response.json();
  assertManifest(value);
  return value;
}

export function requireMatchingCommissioningRelease(
  manifest: CommissioningManifest,
  applicationRelease: string,
): void {
  if (manifest.releaseId !== applicationRelease) {
    throw new Error(
      `Setup loaded robot files for ${manifest.releaseId}, but this page is ${applicationRelease}. Reload Setup to finish the course update. No robot files were changed.`,
    );
  }
}

function checkedResult(result: ReplResult, operation: string): string {
  if (result.stderr.trim()) {
    throw new Error(`${operation} failed: ${result.stderr.trim()}`);
  }
  return result.stdout;
}

function markedJson<T>(output: string, marker: string): T {
  const line = output
    .split(/\r?\n/)
    .find((candidate) => candidate.startsWith(marker));
  if (!line) {
    throw new Error("The XRP returned an incomplete commissioning response.");
  }
  return JSON.parse(line.slice(marker.length)) as T;
}

function pythonLiteral(value: unknown): string {
  return JSON.stringify(value);
}

export async function inspectDevice(
  session: MicroPythonSession,
  manifest: CommissioningManifest,
): Promise<DeviceInspection> {
  const modules = pythonLiteral(manifest.xrplib.requiredModules);
  const result = await session.execute(
    `import binascii, json, machine, os, sys\n` +
      `mods=[]\n` +
      `for name in ${modules}:\n` +
      ` try:\n  __import__(name)\n  mods.append(name)\n` +
      ` except Exception:\n  pass\n` +
      `v=sys.implementation.version\n` +
      `u=os.uname()\n` +
      `info={'implementation':sys.implementation.name,'version':[v[0],v[1],v[2]],'machine':u.machine,'robotId':binascii.hexlify(machine.unique_id()).decode(),'mpy':getattr(sys.implementation,'_mpy',None),'modules':mods}\n` +
      `print(${pythonLiteral(INSPECTION_MARKER)}+json.dumps(info))`,
  );
  const inspection = markedJson<DeviceInspection>(
    checkedResult(result, "Controller inspection"),
    INSPECTION_MARKER,
  );
  const expectedVersion = manifest.micropython.version
    .split(".")
    .map((part) => Number.parseInt(part, 10));
  const versionMatches = expectedVersion.every(
    (part, index) => inspection.version[index] === part,
  );
  const machine = inspection.machine.toLocaleLowerCase();
  const robotId = inspection.robotId?.trim().toLocaleLowerCase();
  if (
    inspection.implementation !== "micropython" ||
    !machine.includes("sparkfun xrp controller") ||
    !machine.includes("rp2350") ||
    !versionMatches
  ) {
    throw new FirmwareRequiredError(
      `This XRP needs the course MicroPython ${manifest.micropython.version} firmware.`,
    );
  }
  if (!robotId || !/^[0-9a-f]+$/.test(robotId)) {
    throw new Error("The XRP controller did not report a stable identity.");
  }
  inspection.robotId = robotId;
  return inspection;
}

export async function readExistingNetworkProfile(
  session: MicroPythonSession,
): Promise<ExistingNetworkProfile> {
  const result = await session.execute(
    `import json\n` +
      `try:\n` +
      ` c=json.load(open('/xrp_wifi.json'))\n` +
      ` s=c.get('station') if isinstance(c.get('station'),dict) else {}\n` +
      ` a=c.get('access_point') if isinstance(c.get('access_point'),dict) else {}\n` +
      ` p={'present':True,'version':c.get('version'),'mode':c.get('mode'),'stationSsid':s.get('ssid') or c.get('ssid'),'accessPointSsid':a.get('ssid')}\n` +
      `except Exception:\n p={'present':False}\n` +
      `print(${pythonLiteral(NETWORK_PROFILE_MARKER)}+json.dumps(p))`,
  );
  return markedJson<ExistingNetworkProfile>(
    checkedResult(result, "Network profile inspection"),
    NETWORK_PROFILE_MARKER,
  );
}

export async function feedCommissioningWatchdog(
  session: MicroPythonSession,
): Promise<void> {
  checkedResult(
    await session.execute(
      `import machine\n` +
        `__ucsb_commission_wd=machine.WDT(timeout=${INSTALL_WATCHDOG_MS})\n` +
        `__ucsb_commission_wd.feed()`,
    ),
    "Maintaining the USB setup session",
  );
}

function remoteHashCode(paths: readonly string[]): string {
  return (
    `import binascii, hashlib, json\n` +
    `out={}\n` +
    `for p in ${pythonLiteral(paths)}:\n` +
    ` try:\n` +
    `  h=hashlib.sha256()\n` +
    `  f=open(p,'rb')\n` +
    `  while True:\n` +
    `   b=f.read(1024)\n` +
    `   if not b: break\n` +
    `   h.update(b)\n` +
    `  f.close()\n` +
    `  out[p]=binascii.hexlify(h.digest()).decode()\n` +
    ` except OSError:\n  out[p]=None\n` +
    `print(${pythonLiteral(HASH_MARKER)}+json.dumps(out))`
  );
}

async function remoteHashes(
  session: MicroPythonSession,
  paths: readonly string[],
): Promise<Record<string, string | null>> {
  const result = await session.execute(remoteHashCode(paths), 20_000);
  return markedJson<Record<string, string | null>>(
    checkedResult(result, "File verification"),
    HASH_MARKER,
  );
}

function hexDigest(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer), (value) =>
    value.toString(16).padStart(2, "0"),
  ).join("");
}

async function sha256(data: Uint8Array): Promise<string> {
  const copy = new Uint8Array(data);
  return hexDigest(await crypto.subtle.digest("SHA-256", copy));
}

async function fetchVerifiedAsset(
  manifestUrl: URL,
  entry: { url: string; bytes: number; sha256: string },
  fetchImplementation: typeof fetch,
): Promise<Uint8Array> {
  const response = await fetchImplementation(new URL(entry.url, manifestUrl));
  if (!response.ok) {
    throw new Error(
      `Commissioning file could not be loaded (${response.status}).`,
    );
  }
  const data = new Uint8Array(await response.arrayBuffer());
  if (
    data.byteLength !== entry.bytes ||
    (await sha256(data)) !== entry.sha256
  ) {
    throw new Error(
      "A commissioning file failed its browser-side integrity check.",
    );
  }
  return data;
}

function base64(data: Uint8Array): string {
  let binary = "";
  for (const value of data) {
    binary += String.fromCharCode(value);
  }
  return btoa(binary);
}

async function writeDeviceFile(
  session: MicroPythonSession,
  destination: string,
  data: Uint8Array,
): Promise<void> {
  const temporary = `${destination}.commissioning`;
  checkedResult(
    await session.execute(
      `import binascii, machine, os\n` +
        `wd=machine.WDT(timeout=${INSTALL_WATCHDOG_MS})\n` +
        `wd.feed()\n` +
        `f=open(${pythonLiteral(temporary)},'wb')\n` +
        `w=f.write`,
    ),
    `Opening ${destination}`,
  );
  for (let offset = 0; offset < data.length; offset += 768) {
    const encoded = base64(data.slice(offset, offset + 768));
    checkedResult(
      await session.execute(
        `w(binascii.a2b_base64(${pythonLiteral(encoded)}))\nwd.feed()`,
      ),
      `Writing ${destination}`,
    );
  }
  checkedResult(
    await session.execute(
      `f.close()\n` +
        `try: os.remove(${pythonLiteral(destination)})\n` +
        `except OSError: pass\n` +
        `os.rename(${pythonLiteral(temporary)},${pythonLiteral(destination)})\n` +
        `wd.feed()`,
    ),
    `Finishing ${destination}`,
  );
}

function parentDirectories(paths: readonly string[]): string[] {
  const directories = new Set<string>();
  for (const path of paths) {
    const parts = path.replace(/^\/+/, "").split("/").slice(0, -1);
    let directory = "";
    for (const part of parts) {
      directory += `/${part}`;
      directories.add(directory);
    }
  }
  return [...directories].sort(
    (left, right) =>
      left.split("/").length - right.split("/").length ||
      left.localeCompare(right),
  );
}

async function ensureInstallDirectories(
  session: MicroPythonSession,
  paths: readonly string[],
) {
  const directories = parentDirectories(paths);
  checkedResult(
    await session.execute(
      `import machine, os\n` +
        `wd=machine.WDT(timeout=${INSTALL_WATCHDOG_MS})\n` +
        `for p in ${pythonLiteral(directories)}:\n` +
        ` try: os.mkdir(p)\n` +
        ` except OSError: pass\n` +
        `wd.feed()`,
    ),
    "Preparing XRP software folders",
  );
}

type RuntimeSlot = "a" | "b";

interface ActivationRecord {
  generation: number;
  slot: RuntimeSlot;
  releaseId: string;
  releaseSequence: number;
  runtimeManifestSha256: string;
}

interface RuntimeMarker {
  generation: number;
  slot: RuntimeSlot;
  runtimeManifestSha256: string;
}

interface RuntimeState {
  records: Array<ActivationRecord | null>;
  confirmed: RuntimeMarker | null;
  attempted: RuntimeMarker | null;
  slotManifests: Record<RuntimeSlot, unknown>;
}

function slotRoot(slot: RuntimeSlot): string {
  return `/course_runtime/slots/${slot}`;
}

function slotFilePath(slot: RuntimeSlot, path: string): string {
  return `${slotRoot(slot)}/${path}`;
}

function slotManifestPath(slot: RuntimeSlot): string {
  return slotFilePath(slot, "runtime-manifest.json");
}

function isActivationRecord(value: unknown): value is ActivationRecord {
  return (
    isObject(value) &&
    typeof value.generation === "number" &&
    (value.slot === "a" || value.slot === "b") &&
    typeof value.releaseId === "string" &&
    typeof value.releaseSequence === "number" &&
    typeof value.runtimeManifestSha256 === "string"
  );
}

function isRuntimeMarker(value: unknown): value is RuntimeMarker {
  return (
    isObject(value) &&
    typeof value.generation === "number" &&
    (value.slot === "a" || value.slot === "b") &&
    typeof value.runtimeManifestSha256 === "string"
  );
}

function markerMatches(
  record: ActivationRecord,
  marker: RuntimeMarker | null,
): boolean {
  return (
    marker !== null &&
    marker.generation === record.generation &&
    marker.slot === record.slot &&
    marker.runtimeManifestSha256 === record.runtimeManifestSha256
  );
}

async function readRuntimeState(
  session: MicroPythonSession,
): Promise<RuntimeState> {
  const result = await session.execute(
    `import json\n` +
      `def _ucsb_read_json(p):\n` +
      ` try:\n` +
      `  f=open(p)\n  v=json.load(f)\n  f.close()\n  return v\n` +
      ` except Exception:\n  return None\n` +
      `s={'records':[_ucsb_read_json('/course_runtime/active.0.json'),_ucsb_read_json('/course_runtime/active.1.json')],'confirmed':_ucsb_read_json('/course_runtime/confirmed.json'),'attempted':_ucsb_read_json('/course_runtime/attempted.json'),'slotManifests':{'a':_ucsb_read_json('/course_runtime/slots/a/runtime-manifest.json'),'b':_ucsb_read_json('/course_runtime/slots/b/runtime-manifest.json')}}\n` +
      `print(${pythonLiteral(RUNTIME_STATE_MARKER)}+json.dumps(s))`,
  );
  const raw = markedJson<{
    records?: unknown[];
    confirmed?: unknown;
    attempted?: unknown;
    slotManifests?: { a?: unknown; b?: unknown };
  }>(checkedResult(result, "Runtime inspection"), RUNTIME_STATE_MARKER);
  return {
    records: Array.isArray(raw.records)
      ? raw.records.map((record) =>
          isActivationRecord(record) ? record : null,
        )
      : [],
    confirmed: isRuntimeMarker(raw.confirmed) ? raw.confirmed : null,
    attempted: isRuntimeMarker(raw.attempted) ? raw.attempted : null,
    slotManifests: {
      a: raw.slotManifests?.a ?? null,
      b: raw.slotManifests?.b ?? null,
    },
  };
}

function orderedRecords(state: RuntimeState): ActivationRecord[] {
  return state.records
    .filter((record): record is ActivationRecord => record !== null)
    .sort((left, right) => right.generation - left.generation);
}

function effectiveRecord(state: RuntimeState): ActivationRecord | null {
  const records = orderedRecords(state);
  return (
    records.find((record) => markerMatches(record, state.confirmed)) ??
    records[0] ??
    null
  );
}

function manifestFilePaths(value: unknown): string[] {
  if (!isObject(value) || !Array.isArray(value.files)) return [];
  return value.files.flatMap((file) =>
    isObject(file) &&
    typeof file.path === "string" &&
    isSafeRuntimePath(file.path)
      ? [file.path]
      : [],
  );
}

function isSafeRuntimePath(path: string): boolean {
  const parts = path.split("/");
  return (
    path.length > 0 &&
    !path.startsWith("/") &&
    parts.every(
      (part) =>
        part.length > 0 &&
        part !== "." &&
        part !== ".." &&
        /^[A-Za-z0-9_.-]+$/.test(part),
    )
  );
}

async function removeDeviceFiles(
  session: MicroPythonSession,
  paths: readonly string[],
): Promise<void> {
  if (paths.length === 0) return;
  checkedResult(
    await session.execute(
      `import os\n` +
        `for p in ${pythonLiteral(paths)}:\n` +
        ` try: os.remove(p)\n` +
        ` except OSError: pass`,
    ),
    "Removing obsolete course files",
  );
}

function networkConfig(
  selection: Exclude<NetworkSelection, { mode: "keep" }>,
  defaults: CommissioningManifest["networkDefaults"],
  hostname: string,
) {
  const accessPoint = {
    password: defaults.password,
    ifconfig: [
      defaults.address,
      "255.255.255.0",
      defaults.address,
      defaults.address,
    ],
    ...(selection.mode === "access_point" && selection.ssid
      ? { ssid: selection.ssid }
      : {}),
  };
  const value: Record<string, unknown> = {
    version: 2,
    mode: selection.mode,
    hostname,
    access_point: accessPoint,
    fallback_to_access_point: true,
  };
  if (selection.mode === "station") {
    const ssid = selection.ssid.trim();
    if (!ssid || selection.password.length < 8) {
      throw new Error("Existing Wi-Fi needs its network name and password.");
    }
    value.station = { ssid, password: selection.password };
  }
  return value;
}

async function applyNetworkSelection(
  session: MicroPythonSession,
  selection: NetworkSelection,
  defaults: CommissioningManifest["networkDefaults"],
  hostname: string,
): Promise<void> {
  if (selection.mode === "keep") {
    // Retain the selected network and its credentials, but replace the old
    // classroom-wide hostname with this controller's stable local name.
    const result = await session.execute(
      `import json, os\n` +
        `p='/xrp_wifi.json'\nt=p+'.commissioning'\n` +
        `c=json.load(open(p))\n` +
        `if c.get('hostname')!=${pythonLiteral(hostname)}:\n` +
        ` c['hostname']=${pythonLiteral(hostname)}\n` +
        ` f=open(t,'w')\n json.dump(c,f)\n f.close()\n` +
        ` try: os.remove(p)\n except OSError: pass\n` +
        ` os.rename(t,p)\n` +
        `print(${pythonLiteral(NETWORK_HOSTNAME_MARKER)}+c['hostname'])`,
    );
    const output = checkedResult(result, "Updating the XRP network name");
    if (
      !output.split(/\r?\n/).includes(`${NETWORK_HOSTNAME_MARKER}${hostname}`)
    ) {
      throw new Error("The XRP network name could not be verified.");
    }
    return;
  }
  const bytes = textEncoder.encode(
    JSON.stringify(networkConfig(selection, defaults, hostname)),
  );
  await writeDeviceFile(session, "/xrp_wifi.json", bytes);
}

async function verifyInstalledRuntime(
  session: MicroPythonSession,
  manifest: CommissioningManifest,
  slot: RuntimeSlot,
): Promise<void> {
  const result = await session.execute(
    `import gc, json, sys\n` +
      `for name in tuple(sys.modules):\n` +
      ` if name=='ucsb_xrp' or name.startswith('ucsb_xrp.') or name=='ucsb_xrp_reference' or name.startswith('ucsb_xrp_reference.') or name=='ucsb_xrp_service' or name.startswith('ucsb_xrp_service.'):\n` +
      `  del sys.modules[name]\n` +
      `gc.collect()\n` +
      `p=${pythonLiteral(slotFilePath(slot, "lib"))}\n` +
      `while p in sys.path: sys.path.remove(p)\n` +
      `sys.path.insert(0,p)\n` +
      `import ucsb_xrp, ucsb_xrp_service\n` +
      `mods=[]\n` +
      `for name in ${pythonLiteral(manifest.xrplib.requiredModules)}:\n` +
      ` __import__(name)\n mods.append(name)\n` +
      `v={'library':ucsb_xrp.__version__,'protocol':ucsb_xrp_service.PROTOCOL_VERSION,'modules':mods}\n` +
      `print(${pythonLiteral(VERIFY_MARKER)}+json.dumps(v))`,
    20_000,
  );
  const value = markedJson<{
    library: string;
    protocol: number;
    modules: string[];
  }>(checkedResult(result, "Runtime verification"), VERIFY_MARKER);
  const mismatches: string[] = [];
  if (value.library !== manifest.compatibility.courseLibraryVersion) {
    mismatches.push(
      `course library ${value.library} (expected ${manifest.compatibility.courseLibraryVersion})`,
    );
  }
  if (value.protocol !== manifest.compatibility.protocolVersion) {
    mismatches.push(
      `protocol ${value.protocol} (expected ${manifest.compatibility.protocolVersion})`,
    );
  }
  const missingModules = manifest.xrplib.requiredModules.filter(
    (module) => !value.modules.includes(module),
  );
  if (missingModules.length > 0) {
    mismatches.push(`missing ${missingModules.join(", ")}`);
  }
  if (mismatches.length > 0) {
    throw new Error(`Installed runtime mismatch: ${mismatches.join("; ")}.`);
  }
}

async function activateNetwork(
  session: MicroPythonSession,
): Promise<PublicNetworkState> {
  const result = await session.execute(
    `import json, machine\n` +
      `import course_boot\ncourse_boot.prepare_runtime_imports()\n` +
      `from ucsb_xrp_service.networking import activate_network, public_network_state\n` +
      `wd=machine.WDT(timeout=${INSTALL_WATCHDOG_MS})\nwd.feed()\n` +
      `c=json.load(open('/xrp_wifi.json'))\n` +
      `r=activate_network(c,timeout_ms=45000,watchdog=wd)\nwd.feed()\n` +
      `p=public_network_state(r)\np['ready']=bool(r.get('ready'))\n` +
      `print(${pythonLiteral(NETWORK_RESULT_MARKER)}+json.dumps(p))`,
    55_000,
  );
  const network = markedJson<PublicNetworkState>(
    checkedResult(result, "XRP Wi-Fi setup"),
    NETWORK_RESULT_MARKER,
  );
  if (!network.ready || !network.address || !network.ssid) {
    throw new Error("The XRP did not start a usable Wi-Fi network.");
  }
  return network;
}

async function verifyBootstrapFiles(
  session: MicroPythonSession,
  manifest: CommissioningManifest,
): Promise<void> {
  const paths = manifest.bootstrapFiles
    .map((entry) => entry.destination)
    .filter((path) => path.endsWith(".py"));
  checkedResult(
    await session.execute(
      `for p in ${pythonLiteral(paths)}:\n` +
        ` f=open(p)\n s=f.read()\n f.close()\n compile(s,p,'exec')`,
    ),
    "Bootstrap verification",
  );
}

function activationRecordBytes(record: ActivationRecord): Uint8Array {
  return textEncoder.encode(
    `${JSON.stringify({ schemaVersion: 1, ...record })}\n`,
  );
}

function recordIsSame(
  left: ActivationRecord | null,
  right: ActivationRecord | null,
): boolean {
  return (
    left !== null &&
    right !== null &&
    left.generation === right.generation &&
    left.slot === right.slot &&
    left.runtimeManifestSha256 === right.runtimeManifestSha256
  );
}

export async function commissionDevice(options: {
  session: MicroPythonSession;
  manifest: CommissioningManifest;
  manifestUrl: URL;
  robotId: string;
  network: NetworkSelection;
  onProgress?: ProgressReporter;
  fetch?: typeof fetch;
}): Promise<CommissioningResult> {
  const {
    session,
    manifest,
    manifestUrl,
    robotId,
    network,
    onProgress = () => undefined,
    fetch: fetchImplementation = globalThis.fetch,
  } = options;
  const hostname = robotHostnameForId(robotId);
  let resetStarted = false;
  try {
    onProgress({
      phase: "compare",
      detail: "Inspecting the installed release…",
    });
    const state = await readRuntimeState(session);
    const bootstrapPaths = manifest.bootstrapFiles.map(
      (entry) => entry.destination,
    );
    const slotManifestPaths = [slotManifestPath("a"), slotManifestPath("b")];
    const initialHashes = await remoteHashes(session, [
      ...bootstrapPaths,
      ...slotManifestPaths,
    ]);

    // Ignore activation records whose referenced manifest is absent or has a
    // different digest. They were never a complete published runtime.
    const verifiedState: RuntimeState = {
      ...state,
      records: state.records.map((record) =>
        record &&
        initialHashes[slotManifestPath(record.slot)] ===
          record.runtimeManifestSha256
          ? record
          : null,
      ),
    };
    const records = orderedRecords(verifiedState);
    const newer = records.find(
      (record) => record.releaseSequence > manifest.releaseSequence,
    );
    if (newer) {
      throw new Error(
        `This XRP has newer course runtime ${newer.releaseId}. Reload the live course page before changing the robot. No robot files were changed.`,
      );
    }

    const effective = effectiveRecord(verifiedState);
    const newest = records[0] ?? null;
    const expectedManifestHash = manifest.runtime.manifest.sha256;
    const effectiveHasExpectedIdentity =
      effective !== null &&
      effective.releaseSequence === manifest.releaseSequence &&
      effective.runtimeManifestSha256 === expectedManifestHash;

    let targetSlot: RuntimeSlot = effective?.slot === "a" ? "b" : "a";
    let targetHashes: Record<string, string | null> = {};
    let useExistingEffective = false;
    if (
      effectiveHasExpectedIdentity &&
      initialHashes[slotManifestPath(effective.slot)] === expectedManifestHash
    ) {
      const paths = manifest.runtime.files.map((entry) =>
        slotFilePath(effective.slot, entry.path),
      );
      targetHashes = await remoteHashes(session, paths);
      useExistingEffective = manifest.runtime.files.every(
        (entry) =>
          targetHashes[slotFilePath(effective.slot, entry.path)] ===
          entry.sha256,
      );
      if (useExistingEffective) targetSlot = effective.slot;
    }

    if (!useExistingEffective) {
      const paths = [
        ...manifest.runtime.files.map((entry) =>
          slotFilePath(targetSlot, entry.path),
        ),
        slotManifestPath(targetSlot),
      ];
      targetHashes = await remoteHashes(session, paths);
    }

    const runtimeChanged = manifest.runtime.files.filter(
      (entry) =>
        targetHashes[slotFilePath(targetSlot, entry.path)] !== entry.sha256,
    );
    const bootstrapChanged = manifest.bootstrapFiles.filter(
      (entry) => initialHashes[entry.destination] !== entry.sha256,
    );
    const expectedRelativePaths = new Set(
      manifest.runtime.files.map((entry) => entry.path),
    );
    const obsolete = manifestFilePaths(verifiedState.slotManifests[targetSlot])
      .filter((path) => !expectedRelativePaths.has(path))
      .map((path) => slotFilePath(targetSlot, path));
    const installedManifestDiffers =
      initialHashes[slotManifestPath(targetSlot)] !== expectedManifestHash;
    const publishRuntimeManifest =
      installedManifestDiffers ||
      runtimeChanged.length > 0 ||
      obsolete.length > 0;

    // Fetch and hash every required asset before the first device write. A
    // stale Service Worker therefore cannot construct a mixed robot release.
    const [runtimeDownloads, bootstrapDownloads, runtimeManifestData] =
      await Promise.all([
        Promise.all(
          runtimeChanged.map(async (entry) => ({
            entry,
            data: await fetchVerifiedAsset(
              manifestUrl,
              entry,
              fetchImplementation,
            ),
          })),
        ),
        Promise.all(
          bootstrapChanged.map(async (entry) => ({
            entry,
            data: await fetchVerifiedAsset(
              manifestUrl,
              entry,
              fetchImplementation,
            ),
          })),
        ),
        publishRuntimeManifest
          ? fetchVerifiedAsset(
              manifestUrl,
              manifest.runtime.manifest,
              fetchImplementation,
            )
          : Promise.resolve<Uint8Array | null>(null),
      ]);

    const activationStable =
      useExistingEffective &&
      markerMatches(effective!, verifiedState.confirmed) &&
      recordIsSame(effective, newest);
    const activationGeneration = activationStable
      ? effective!.generation
      : Math.max(0, ...records.map((record) => record.generation)) + 1;
    const activation: ActivationRecord = {
      generation: activationGeneration,
      slot: targetSlot,
      releaseId: manifest.releaseId,
      releaseSequence: manifest.releaseSequence,
      runtimeManifestSha256: expectedManifestHash,
    };
    const activationPath = `/course_runtime/active.${(activationGeneration - 1) % 2}.json`;
    const allInstallPaths = [
      ...manifest.runtime.files.map((entry) =>
        slotFilePath(targetSlot, entry.path),
      ),
      slotManifestPath(targetSlot),
      ...bootstrapPaths,
      activationPath,
    ];
    await ensureInstallDirectories(session, allInstallPaths);

    const totalChanged =
      runtimeDownloads.length +
      bootstrapDownloads.length +
      (publishRuntimeManifest ? 1 : 0);
    let installed = 0;
    if (runtimeChanged.length > 0 || obsolete.length > 0) {
      // The inactive slot stops being bootable before its first mutation. Any
      // older activation record that names it therefore cannot start a
      // partially replaced runtime after a power interruption.
      await removeDeviceFiles(session, [slotManifestPath(targetSlot)]);
    }
    for (const { entry, data } of runtimeDownloads) {
      onProgress({
        phase: "install",
        detail: "Writing the new course runtime…",
        completed: installed,
        total: totalChanged,
      });
      await writeDeviceFile(
        session,
        slotFilePath(targetSlot, entry.path),
        data,
      );
      installed += 1;
    }

    await removeDeviceFiles(session, obsolete);

    onProgress({ phase: "verify", detail: "Verifying the new runtime…" });
    const expectedRuntime = new Map(
      manifest.runtime.files.map((entry) => [
        slotFilePath(targetSlot, entry.path),
        entry.sha256,
      ]),
    );
    let hashes = await remoteHashes(session, [...expectedRuntime.keys()]);
    for (const [path, hash] of expectedRuntime) {
      if (hashes[path] !== hash) {
        throw new Error(`Readback verification failed for ${path}.`);
      }
    }

    if (runtimeManifestData) {
      await writeDeviceFile(
        session,
        slotManifestPath(targetSlot),
        runtimeManifestData,
      );
      installed += 1;
    }
    hashes = await remoteHashes(session, [slotManifestPath(targetSlot)]);
    if (hashes[slotManifestPath(targetSlot)] !== expectedManifestHash) {
      throw new Error("The staged runtime manifest failed verification.");
    }
    await verifyInstalledRuntime(session, manifest, targetSlot);

    // The bootstrap changes rarely. Validate their syntax and install
    // course_boot.py before the tiny main.py entrypoint during first migration.
    for (const { entry, data } of [...bootstrapDownloads].sort((left, right) =>
      left.entry.destination === "/main.py"
        ? 1
        : right.entry.destination === "/main.py"
          ? -1
          : 0,
    )) {
      onProgress({
        phase: "install",
        detail: "Updating the robot startup files…",
        completed: installed,
        total: totalChanged,
      });
      await writeDeviceFile(session, entry.destination, data);
      installed += 1;
    }
    await verifyBootstrapFiles(session, manifest);

    if (!activationStable) {
      // Publishing one small activation record is the only operation that
      // makes the staged slot bootable. The other activation record remains a
      // complete fallback if power disappears during this write.
      await writeDeviceFile(
        session,
        activationPath,
        activationRecordBytes(activation),
      );
    }
    onProgress({
      phase: "verify",
      detail: `Course runtime ${manifest.releaseId} is ready.`,
    });

    onProgress({ phase: "network", detail: "Preparing XRP Wi-Fi…" });
    await applyNetworkSelection(
      session,
      network,
      manifest.networkDefaults,
      hostname,
    );
    const activeNetwork = await activateNetwork(session);

    onProgress({ phase: "reset", detail: "Restarting the XRP…" });
    resetStarted = true;
    await session.resetAndClose();
    return {
      releaseId: manifest.releaseId,
      releaseSequence: manifest.releaseSequence,
      serviceVersion: manifest.compatibility.serviceVersion,
      runtimeManifestSha256: expectedManifestHash,
      activationGeneration,
      installedFiles: installed,
      unchangedFiles:
        manifest.runtime.files.length +
        manifest.bootstrapFiles.length +
        1 -
        runtimeDownloads.length -
        bootstrapDownloads.length -
        (publishRuntimeManifest ? 1 : 0),
      network: activeNetwork,
    };
  } catch (error) {
    if (!resetStarted) {
      resetStarted = true;
      try {
        await session.resetAndClose();
      } catch {
        // USB may already have disappeared; preserve the original failure.
      }
    }
    throw error;
  }
}

interface FirmwareFileHandle {
  createWritable(): Promise<{
    write(data: Uint8Array): Promise<void>;
    close(): Promise<void>;
  }>;
}

interface FirmwareDirectoryHandle {
  readonly name: string;
  getFileHandle(
    name: string,
    options: { create: true },
  ): Promise<FirmwareFileHandle>;
}

export async function chooseFirmwareVolume(): Promise<FirmwareDirectoryHandle> {
  const picker = (
    window as Window & {
      showDirectoryPicker?: (options: {
        id: string;
        mode: "readwrite";
      }) => Promise<FirmwareDirectoryHandle>;
    }
  ).showDirectoryPicker;
  if (!picker) {
    throw new Error("Firmware repair requires desktop Chrome or Edge.");
  }
  const volume = await picker({ id: "ucsb-xrp-firmware", mode: "readwrite" });
  if (!/^(RP2350|RPI-RP2)$/i.test(volume.name)) {
    throw new Error("Select the mounted RP2350 or RPI-RP2 firmware drive.");
  }
  return volume;
}

export async function installFirmware(options: {
  volume: FirmwareDirectoryHandle;
  manifest: CommissioningManifest;
  manifestUrl: URL;
  fetch?: typeof fetch;
  writeWaitMs?: number;
  closeWaitMs?: number;
}): Promise<void> {
  const firmware = options.manifest.micropython.firmware;
  const data = await fetchVerifiedAsset(
    options.manifestUrl,
    firmware,
    options.fetch ?? globalThis.fetch,
  );
  const handle = await options.volume.getFileHandle(firmware.asset, {
    create: true,
  });
  const writable = await handle.createWritable();
  // A complete UF2 transfer makes the RP2350 reboot and remove its temporary
  // volume. Depending on the macOS/Chrome version, either write() or close()
  // can remain pending after that expected removal. The caller accepts the
  // transfer only after the MicroPython USB device reappears and is inspected.
  const writeOutcome = writable.write(data).then(
    () => ({ state: "written" as const }),
    (error: unknown) => ({ state: "error" as const, error }),
  );
  const writeResult = await Promise.race([
    writeOutcome,
    wait(options.writeWaitMs ?? 1_500).then(() => ({
      state: "pending" as const,
    })),
  ]);
  if (writeResult.state === "error") throw writeResult.error;
  if (writeResult.state === "pending") return;

  const closeOutcome = writable.close().then(
    () => ({ state: "closed" as const }),
    (error: unknown) => ({ state: "error" as const, error }),
  );
  const outcome = await Promise.race([
    closeOutcome,
    wait(options.closeWaitMs ?? 750).then(() => ({
      state: "pending" as const,
    })),
  ]);
  if (outcome.state === "error") throw outcome.error;
}

function wait(milliseconds: number): Promise<void> {
  return new Promise((resolve) => globalThis.setTimeout(resolve, milliseconds));
}

export async function waitForReenumeratedPort(
  controller: ExpectedUsbController,
  timeoutMs = 20_000,
): Promise<SerialPortLike | null> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const port = await findGrantedXrpPort(controller);
    if (port) {
      return port;
    }
    await wait(500);
  }
  return null;
}
