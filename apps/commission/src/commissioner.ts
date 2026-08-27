import {
  findGrantedXrpPort,
  type ExpectedUsbController,
  type MicroPythonSession,
  type ReplResult,
  type SerialPortLike,
} from "./web-serial";

export interface CommissioningFile {
  destination: string;
  url: string;
  bytes: number;
  sha256: string;
  source: string;
}

export interface CommissioningManifest {
  schemaVersion: 1;
  releaseId: string;
  serviceVersion: string;
  courseLibraryVersion: string;
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
  files: CommissioningFile[];
}

export interface DeviceInspection {
  implementation: string;
  version: [number, number, number];
  machine: string;
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
  serviceVersion: string;
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
const VERIFY_MARKER = "__UCSB_XRP_VERIFY__=";
const NETWORK_RESULT_MARKER = "__UCSB_XRP_NETWORK__=";
const INSTALL_WATCHDOG_MS = 8_388;
const textEncoder = new TextEncoder();
export const HOTSPOT_SSID_PREFIX = "UCSB-XRP-";

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

function assertManifest(
  value: unknown,
): asserts value is CommissioningManifest {
  if (
    !isObject(value) ||
    value.schemaVersion !== 1 ||
    typeof value.releaseId !== "string" ||
    typeof value.serviceVersion !== "string" ||
    typeof value.courseLibraryVersion !== "string" ||
    !isObject(value.controller) ||
    typeof value.controller.usbVendorId !== "number" ||
    typeof value.controller.usbProductId !== "number" ||
    !isObject(value.micropython) ||
    typeof value.micropython.version !== "string" ||
    !isObject(value.xrplib) ||
    !Array.isArray(value.xrplib.requiredModules) ||
    !isObject(value.networkDefaults) ||
    !Array.isArray(value.files)
  ) {
    throw new Error("The commissioning release manifest is incomplete.");
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
    `import json, os, sys\n` +
      `mods=[]\n` +
      `for name in ${modules}:\n` +
      ` try:\n  __import__(name)\n  mods.append(name)\n` +
      ` except Exception:\n  pass\n` +
      `v=sys.implementation.version\n` +
      `u=os.uname()\n` +
      `info={'implementation':sys.implementation.name,'version':[v[0],v[1],v[2]],'machine':u.machine,'mpy':getattr(sys.implementation,'_mpy',None),'modules':mods}\n` +
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
        `os.rename(${pythonLiteral(temporary)},${pythonLiteral(destination)})\n` +
        `wd.feed()`,
    ),
    `Finishing ${destination}`,
  );
}

async function ensureInstallDirectories(session: MicroPythonSession) {
  checkedResult(
    await session.execute(
      `import machine, os\n` +
        `wd=machine.WDT(timeout=${INSTALL_WATCHDOG_MS})\n` +
        `for p in ('/lib','/lib/ucsb_xrp','/lib/ucsb_xrp_reference','/lib/ucsb_xrp_service'):\n` +
        ` try: os.mkdir(p)\n` +
        ` except OSError: pass\n` +
        `wd.feed()`,
    ),
    "Preparing course folders",
  );
}

function networkConfig(
  selection: Exclude<NetworkSelection, { mode: "keep" }>,
  defaults: CommissioningManifest["networkDefaults"],
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
    hostname: "ucsb-xrp",
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
): Promise<void> {
  if (selection.mode === "keep") {
    checkedResult(
      await session.execute(
        `import json\n` +
          `from ucsb_xrp_service.networking import normalize_config\n` +
          `c=normalize_config(json.load(open('/xrp_wifi.json')))\n` +
          `f=open('/xrp_wifi.json','w')\njson.dump(c,f)\nf.close()`,
      ),
      "Updating the saved network profile",
    );
    return;
  }
  const bytes = textEncoder.encode(
    JSON.stringify(networkConfig(selection, defaults)),
  );
  await writeDeviceFile(session, "/xrp_wifi.json", bytes);
}

async function verifyInstalledRuntime(
  session: MicroPythonSession,
  manifest: CommissioningManifest,
): Promise<void> {
  const result = await session.execute(
    `import gc, json, sys\n` +
      `for name in tuple(sys.modules):\n` +
      ` if name=='ucsb_xrp' or name.startswith('ucsb_xrp.') or name=='ucsb_xrp_reference' or name.startswith('ucsb_xrp_reference.') or name=='ucsb_xrp_service' or name.startswith('ucsb_xrp_service.'):\n` +
      `  del sys.modules[name]\n` +
      `gc.collect()\n` +
      `import ucsb_xrp, ucsb_xrp_service\n` +
      `mods=[]\n` +
      `for name in ${pythonLiteral(manifest.xrplib.requiredModules)}:\n` +
      ` __import__(name)\n mods.append(name)\n` +
      `v={'library':ucsb_xrp.__version__,'service':ucsb_xrp_service.SERVICE_VERSION,'modules':mods}\n` +
      `print(${pythonLiteral(VERIFY_MARKER)}+json.dumps(v))`,
    20_000,
  );
  const value = markedJson<{
    library: string;
    service: string;
    modules: string[];
  }>(checkedResult(result, "Runtime verification"), VERIFY_MARKER);
  const mismatches: string[] = [];
  if (value.library !== manifest.courseLibraryVersion) {
    mismatches.push(
      `course library ${value.library} (expected ${manifest.courseLibraryVersion})`,
    );
  }
  if (value.service !== manifest.serviceVersion) {
    mismatches.push(
      `course service ${value.service} (expected ${manifest.serviceVersion})`,
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

export async function commissionDevice(options: {
  session: MicroPythonSession;
  manifest: CommissioningManifest;
  manifestUrl: URL;
  network: NetworkSelection;
  onProgress?: ProgressReporter;
  fetch?: typeof fetch;
}): Promise<CommissioningResult> {
  const {
    session,
    manifest,
    manifestUrl,
    network,
    onProgress = () => undefined,
    fetch: fetchImplementation = globalThis.fetch,
  } = options;
  let resetStarted = false;
  try {
    onProgress({ phase: "compare", detail: "Comparing course files…" });
    await ensureInstallDirectories(session);
    const expected = new Map(
      manifest.files.map((entry) => [entry.destination, entry.sha256]),
    );
    let hashes = await remoteHashes(session, [...expected.keys()]);
    const changed = manifest.files.filter(
      (entry) => hashes[entry.destination] !== entry.sha256,
    );

    // Verify one coherent release in the browser before changing the XRP. If
    // an old Service Worker supplied any stale file, commissioning stops here
    // and leaves the installed robot files untouched.
    const downloaded = await Promise.all(
      changed.map(async (entry) => ({
        entry,
        data: await fetchVerifiedAsset(manifestUrl, entry, fetchImplementation),
      })),
    );

    let installed = 0;
    for (const { entry, data } of downloaded) {
      onProgress({
        phase: "install",
        detail: "Updating course software…",
        completed: installed,
        total: changed.length,
      });
      await writeDeviceFile(session, entry.destination, data);
      installed += 1;
    }

    onProgress({ phase: "verify", detail: "Verifying installed files…" });
    hashes = await remoteHashes(session, [...expected.keys()]);
    for (const [path, hash] of expected) {
      if (hashes[path] !== hash) {
        throw new Error(`Readback verification failed for ${path}.`);
      }
    }
    onProgress({
      phase: "verify",
      detail: "Loading the installed course software…",
    });
    await verifyInstalledRuntime(session, manifest);
    onProgress({
      phase: "verify",
      detail: `Installed course release ${manifest.releaseId} verified.`,
    });

    onProgress({ phase: "network", detail: "Preparing XRP Wi-Fi…" });
    await applyNetworkSelection(session, network, manifest.networkDefaults);
    const activeNetwork = await activateNetwork(session);

    onProgress({ phase: "reset", detail: "Restarting the XRP…" });
    resetStarted = true;
    await session.resetAndClose();
    return {
      releaseId: manifest.releaseId,
      serviceVersion: manifest.serviceVersion,
      installedFiles: installed,
      unchangedFiles: manifest.files.length - installed,
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
  await writable.write(data);
  await writable.close();
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
