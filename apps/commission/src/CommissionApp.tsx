import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import courseRelease from "../../../vendor/current/release.json";

import {
  localNetworkRequestInit,
  targetPreferenceForCommissionedRobot,
} from "@ucsb-xrp/target";

import { CourseHeader } from "../../shared/CourseHeader";
import {
  DiagnosticLogWriter,
  diagnosticLogFileName,
} from "../../shared/diagnostic-log";
import {
  chooseWorkspaceFolder,
  courseFolderPermission,
  loadRememberedWorkspaceFolder,
  loadWorkspaceManifest,
  replaceRememberedWorkspaceFolder,
  requireWorkingFolderParent,
  requestCourseFolderPermission,
  WorkspaceManifestError,
  type CourseDirectoryHandle,
} from "../../shared/course-folder";
import { updateWorkspaceTargetPreference } from "../../shared/workspace-target-preference";
import {
  readOfflineShellStatus,
  registerOfflineShellBeforeReload,
  retryPendingOfflineShellReload,
  waitForOfflineShell,
} from "../../shared/offline-shell";
import {
  FirmwareRequiredError,
  chooseFirmwareVolume,
  commissionDevice,
  feedCommissioningWatchdog,
  inspectDevice,
  installFirmware,
  loadCommissioningManifest,
  requireMatchingCommissioningRelease,
  robotHostnameForId,
  hotspotSsidForLastName,
  HOTSPOT_SSID_PREFIX,
  readExistingNetworkProfile,
  waitForReenumeratedPort,
  type CommissioningManifest,
  type CommissioningProgress,
  type CommissioningResult,
  type ExistingNetworkProfile,
  type NetworkSelection,
} from "./commissioner";
import {
  openRawRepl,
  findGrantedXrpPort,
  requestXrpPort,
  SerialPortOpenError,
  supportsWebSerial,
  touchUf2Bootloader,
  type MicroPythonSession,
  type SerialPortLike,
} from "./web-serial";
import { commissionReloadIsSafe } from "./commission-release-reload";
import {
  createSetupLogEntry,
  renderSetupLog,
  setupDiagnosticEvent,
  setupSessionStartMessage,
  verifySetupDiagnosticFolder,
  type SetupDiagnosticRecord,
  type SetupLogEntry,
  type SetupLogLevel,
} from "./setup-log";

type Stage =
  | "loading"
  | "folder"
  | "usb"
  | "network"
  | "installing"
  | "firmware"
  | "firmware-volume"
  | "wifi"
  | "complete";

interface PhysicalInfo {
  protocol: number;
  protocolRevision?: number;
  serviceVersion: string;
  courseRelease: string;
  runtimeRelease?: string;
  runtimeReleaseSequence?: number;
  runtimeGeneration?: number;
  runtimeManifestSha256?: string;
  courseApiRevision?: string;
  robotId?: string;
  bootId: string;
  robotName: string;
  address: string;
}

interface PhysicalStateProbe {
  bootId: string;
}

class XrpServiceProbeError extends Error {
  constructor(
    readonly kind: "http" | "version" | "identity",
    message: string,
  ) {
    super(message);
    this.name = "XrpServiceProbeError";
  }
}

class XrpServiceProbeTimeoutError extends Error {
  constructor(
    requestName: string,
    readonly timeoutMs: number,
  ) {
    super(
      `No response to the XRP ${requestName} request within ${timeoutMs / 1_000} seconds.`,
    );
    this.name = "XrpServiceProbeTimeoutError";
  }
}

const WIFI_INFO_PROBE_TIMEOUT_MS = 5_000;
const WIFI_STATE_PROBE_TIMEOUT_MS = 1_000;
const WIFI_PROBE_INTERVAL_MS = 1_250;

async function fetchXrpService(
  endpoint: string,
  path: string,
  requestName: string,
  timeoutMs: number,
): Promise<Response> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(
      `${endpoint}${path}`,
      localNetworkRequestInit(endpoint, {
        cache: "no-store",
        method: "GET",
        signal: controller.signal,
      }),
    );
  } catch (error: unknown) {
    if (controller.signal.aborted) {
      throw new XrpServiceProbeTimeoutError(requestName, timeoutMs);
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

function errorDetail(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function wasCancelled(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "name" in error &&
    (error.name === "AbortError" || error.name === "NotFoundError")
  );
}

function manifestLocation(): URL {
  return new URL(
    `${import.meta.env.BASE_URL}course/commissioning/releases/${courseRelease.release_sequence}/manifest.json`,
    window.location.origin,
  );
}

function workflowStep(stage: Stage): number {
  if (stage === "loading" || stage === "folder") return 1;
  if (
    stage === "usb" ||
    stage === "network" ||
    stage === "firmware" ||
    stage === "firmware-volume"
  )
    return 2;
  if (stage === "installing") return 3;
  return 4;
}

function navigationDestinationName(destination: string): string {
  if (destination.includes("/ide/")) return "IDE";
  if (destination.includes("/monitor/")) return "Monitor";
  if (destination.includes("/guide/")) return "Guide";
  if (destination.includes("/reference/")) return "API reference";
  return "Home";
}

function newDiagnosticSessionId(): string {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `setup-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function browserDescription(): string {
  const userAgentData = (
    navigator as Navigator & {
      userAgentData?: {
        brands?: Array<{ brand: string; version: string }>;
      };
    }
  ).userAgentData;
  const brands = userAgentData?.brands
    ?.filter(({ brand }) => !brand.toLocaleLowerCase().includes("not"))
    .map(({ brand, version }) => `${brand} ${version}`)
    .join(", ");
  return brands || navigator.userAgent || "unknown";
}

function operatingSystemDescription(): string {
  const platform = (
    navigator as Navigator & { userAgentData?: { platform?: string } }
  ).userAgentData?.platform;
  return platform || navigator.platform || "unknown";
}

export function networkChoiceVisibility(
  profile: ExistingNetworkProfile | null,
): {
  keepCurrent: boolean;
  robotHotspot: boolean;
  existingWifi: true;
} {
  return {
    keepCurrent: hasUsableNetworkProfile(profile),
    // Keeping an existing hotspot and selecting a second hotspot choice would
    // represent the same action. Its optional name remains editable below.
    robotHotspot: profile?.mode !== "access_point",
    existingWifi: true,
  };
}

export function hasUsableNetworkProfile(
  profile: ExistingNetworkProfile | null,
): boolean {
  if (!profile?.present) return false;
  if (profile.mode === "access_point") return true;
  return profile.mode === "station" && Boolean(profile.stationSsid?.trim());
}

export function CommissionApp() {
  const manifestUrl = useMemo(manifestLocation, []);
  const [manifest, setManifest] = useState<CommissioningManifest | null>(null);
  const [stage, setStage] = useState<Stage>("loading");
  const [folder, setFolder] = useState<CourseDirectoryHandle | null>(null);
  const [folderVerified, setFolderVerified] = useState(false);
  const [detail, setDetail] = useState("Loading the current course release…");
  const [error, setError] = useState("");
  const [existingNetwork, setExistingNetwork] =
    useState<ExistingNetworkProfile | null>(null);
  const [inspectedRobotId, setInspectedRobotId] = useState("");
  const [networkMode, setNetworkMode] = useState<
    "keep" | "access_point" | "station"
  >("access_point");
  const [stationSsid, setStationSsid] = useState("");
  const [stationPassword, setStationPassword] = useState("");
  const [hotspotLastName, setHotspotLastName] = useState("");
  const [progress, setProgress] = useState<CommissioningProgress | null>(null);
  const [installElapsedSeconds, setInstallElapsedSeconds] = useState(0);
  const [result, setResult] = useState<CommissioningResult | null>(null);
  const [authorizedPort, setAuthorizedPort] = useState<SerialPortLike | null>(
    null,
  );
  const [checkingAuthorizedPort, setCheckingAuthorizedPort] = useState(false);
  const [selectingRobot, setSelectingRobot] = useState(false);
  const [folderInteractionActive, setFolderInteractionActive] = useState(false);
  const [interactionRevision, setInteractionRevision] = useState(0);
  const [replUnavailable, setReplUnavailable] = useState(false);
  const [checkingWifi, setCheckingWifi] = useState(false);
  const [wifiProbeEnabled, setWifiProbeEnabled] = useState(false);
  const [wifiAttempts, setWifiAttempts] = useState(0);
  const [wifiIssue, setWifiIssue] = useState("");
  const [wifiNeedsRepair, setWifiNeedsRepair] = useState(false);
  const [setupLogEntries, setSetupLogEntries] = useState<SetupLogEntry[]>([]);
  const [setupLogSaveError, setSetupLogSaveError] = useState("");
  const [setupLogCopied, setSetupLogCopied] = useState(false);
  const [diagnosticLogReady, setDiagnosticLogReady] = useState(false);
  const [navigationDestination, setNavigationDestination] = useState("");
  const sessionRef = useRef<MicroPythonSession | null>(null);
  const portRef = useRef<SerialPortLike | null>(null);
  const navigatingRef = useRef(false);
  const wifiCheckInFlightRef = useRef(false);
  const wifiAttemptRef = useRef(0);
  const lastWifiLoggedIssueRef = useRef("");
  const lastInstallProgressPhaseRef = useRef("");
  const watchdogFeedInFlightRef = useRef(false);
  const folderRef = useRef<CourseDirectoryHandle | null>(null);
  const manifestReleaseRef = useRef(courseRelease.release_id);
  const setupLogEntriesRef = useRef<SetupLogEntry[]>([]);
  const setupDiagnosticEntriesRef = useRef<SetupDiagnosticRecord[]>([]);
  const setupDiagnosticSequenceRef = useRef(0);
  const diagnosticVerificationSequenceRef = useRef(0);
  const diagnosticFolderRef = useRef<CourseDirectoryHandle | null>(null);
  const diagnosticSessionIdRef = useRef<string | null>(null);
  const diagnosticLogRef = useRef<DiagnosticLogWriter | null>(null);
  if (!diagnosticSessionIdRef.current) {
    diagnosticSessionIdRef.current = newDiagnosticSessionId();
  }
  if (!diagnosticLogRef.current) {
    diagnosticLogRef.current = new DiagnosticLogWriter({
      app: "Setup",
      courseRelease: courseRelease.release_id,
      sessionId: diagnosticSessionIdRef.current,
      onWriteError: (logError) => {
        setDiagnosticLogReady(false);
        setSetupLogSaveError(logError.message);
      },
    });
  }
  const folderInteractionCountRef = useRef(0);
  const serialInteractionCountRef = useRef(0);

  const beginFolderInteraction = useCallback(() => {
    folderInteractionCountRef.current += 1;
    setFolderInteractionActive(true);
  }, []);

  const finishFolderInteraction = useCallback(() => {
    folderInteractionCountRef.current = Math.max(
      0,
      folderInteractionCountRef.current - 1,
    );
    setFolderInteractionActive(folderInteractionCountRef.current > 0);
    setInteractionRevision((current) => current + 1);
  }, []);

  const beginSerialInteraction = useCallback(() => {
    serialInteractionCountRef.current += 1;
  }, []);

  const finishSerialInteraction = useCallback(() => {
    serialInteractionCountRef.current = Math.max(
      0,
      serialInteractionCountRef.current - 1,
    );
    setInteractionRevision((current) => current + 1);
  }, []);

  const hotspotName = useMemo(() => {
    try {
      return {
        error: "",
        ssid: hotspotSsidForLastName(hotspotLastName),
      };
    } catch (hotspotError) {
      return { error: errorDetail(hotspotError), ssid: undefined };
    }
  }, [hotspotLastName]);
  const visibleNetworkChoices = networkChoiceVisibility(existingNetwork);

  const recordSetup = useCallback(
    (step: string, message: string, level: SetupLogLevel = "info") => {
      const entry = createSetupLogEntry(step, message, level);
      const diagnosticRecord = {
        entry,
        eventId: `${diagnosticSessionIdRef.current}:setup:${setupDiagnosticSequenceRef.current++}`,
      };
      const next = [...setupLogEntriesRef.current, entry].slice(-160);
      setupLogEntriesRef.current = next;
      setupDiagnosticEntriesRef.current = [
        ...setupDiagnosticEntriesRef.current,
        diagnosticRecord,
      ].slice(-160);
      setSetupLogEntries(next);
      if (diagnosticFolderRef.current) {
        diagnosticLogRef.current?.record(
          setupDiagnosticEvent(diagnosticRecord),
        );
      }
    },
    [],
  );

  useEffect(() => {
    const recordWindowError = (event: ErrorEvent) => {
      const detail =
        event.error instanceof Error
          ? `${event.error.message}${event.error.stack ? `\n${event.error.stack}` : ""}`
          : event.message;
      recordSetup(
        "Application",
        `Unexpected browser error: ${detail}`,
        "error",
      );
    };
    const recordUnhandledRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      const detail =
        reason instanceof Error
          ? `${reason.message}${reason.stack ? `\n${reason.stack}` : ""}`
          : String(reason);
      recordSetup(
        "Application",
        `Unexpected browser task failure: ${detail}`,
        "error",
      );
    };
    window.addEventListener("error", recordWindowError);
    window.addEventListener("unhandledrejection", recordUnhandledRejection);
    return () => {
      window.removeEventListener("error", recordWindowError);
      window.removeEventListener(
        "unhandledrejection",
        recordUnhandledRejection,
      );
    };
  }, [recordSetup]);

  const bindDiagnosticFolder = useCallback(
    async (selected: CourseDirectoryHandle) => {
      const writer = diagnosticLogRef.current;
      if (!writer) throw new Error("The diagnostic log is unavailable.");
      setDiagnosticLogReady(false);
      diagnosticFolderRef.current = null;
      await writer.flush();
      const verificationEventId = `${diagnosticSessionIdRef.current}:folder:${diagnosticVerificationSequenceRef.current++}`;
      await verifySetupDiagnosticFolder(
        writer,
        selected,
        setupDiagnosticEntriesRef.current,
        verificationEventId,
      );
      diagnosticFolderRef.current = selected;
      setDiagnosticLogReady(true);
      setSetupLogSaveError("");
    },
    [],
  );

  useEffect(() => {
    let disposed = false;
    const initialize = async () => {
      try {
        await waitForOfflineShell();
        const [loadedManifest, rememberedFolder] = await Promise.all([
          loadCommissioningManifest(manifestUrl),
          loadRememberedWorkspaceFolder(),
        ]);
        requireMatchingCommissioningRelease(
          loadedManifest,
          courseRelease.release_id,
        );
        if (disposed) return;
        manifestReleaseRef.current = loadedManifest.releaseId;
        setManifest(loadedManifest);
        const offlineStatus = readOfflineShellStatus();
        const appIdentity =
          offlineStatus.state === "development"
            ? "local development"
            : offlineStatus.version
              ? `app build ${offlineStatus.version.slice(0, 12)}`
              : "app build pending";
        recordSetup(
          "Session start",
          setupSessionStartMessage({
            build: appIdentity,
            courseRelease: loadedManifest.releaseId,
            browser: browserDescription(),
            operatingSystem: operatingSystemDescription(),
            capabilities: [
              `language ${navigator.language || "unknown"}`,
              `secure context ${window.isSecureContext ? "yes" : "no"}`,
              `display mode ${window.matchMedia("(display-mode: standalone)").matches ? "installed app" : "browser tab"}`,
              `folder access ${"showDirectoryPicker" in window ? "available" : "unavailable"}`,
              `Web Serial ${supportsWebSerial() ? "available" : "unavailable"}`,
              `Web Locks ${navigator.locks ? "available" : "unavailable"}`,
              `service worker ${"serviceWorker" in navigator ? "available" : "unavailable"}`,
              `service worker controller ${navigator.serviceWorker?.controller ? "active" : "none"}`,
            ],
          }),
        );
        if (rememberedFolder) {
          const permission = await courseFolderPermission(rememberedFolder);
          if (!disposed && permission === "granted") {
            try {
              await requireWorkingFolderParent(rememberedFolder);
              await loadWorkspaceManifest(rememberedFolder);
              recordSetup(
                "Folder",
                `Checking write access to ${rememberedFolder.name}.`,
              );
              await bindDiagnosticFolder(rememberedFolder);
              if (disposed) return;
              folderRef.current = rememberedFolder;
              setFolder(rememberedFolder);
              setFolderVerified(true);
              recordSetup(
                "Folder",
                `Write and read verified in ${rememberedFolder.name}.`,
                "success",
              );
              setDetail(
                `${rememberedFolder.name} is the Working folder. Connect the XRP by USB-C to continue.`,
              );
              setStage("usb");
              return;
            } catch (folderError) {
              recordSetup(
                "Folder",
                `Remembered folder failed its write check: ${errorDetail(folderError)}`,
                "error",
              );
              setError(errorDetail(folderError));
            }
          } else if (!disposed) {
            folderRef.current = rememberedFolder;
            setFolder(rememberedFolder);
            setFolderVerified(false);
            setDetail(
              `${rememberedFolder.name} is the remembered Working folder. Reconnect it or choose a different folder.`,
            );
            setStage("folder");
            return;
          }
        }
        if (!disposed) {
          setStage("folder");
          setDetail(
            "Choose one Working folder that will contain your named Project folders.",
          );
        }
      } catch (initializationError) {
        if (!disposed) {
          setStage("loading");
          setDetail("Setup did not load one complete course release.");
          setError(errorDetail(initializationError));
          recordSetup(
            "Start",
            `Setup could not initialize: ${errorDetail(initializationError)}`,
            "error",
          );
        }
      }
    };
    void initialize();
    return () => {
      disposed = true;
      const session = sessionRef.current;
      sessionRef.current = null;
      void session?.resetAndClose();
    };
  }, [bindDiagnosticFolder, manifestUrl, recordSetup]);

  const chooseFolder = useCallback(async () => {
    setError("");
    beginFolderInteraction();
    try {
      const selected = await chooseWorkspaceFolder();
      await requireWorkingFolderParent(selected);
      await loadWorkspaceManifest(selected);
      recordSetup("Folder", `Checking write access to ${selected.name}.`);
      await bindDiagnosticFolder(selected);
      const remembered = await replaceRememberedWorkspaceFolder(selected);
      if (!remembered.remembered) {
        throw new Error(
          "Chrome could not remember this folder. Choose it again.",
        );
      }
      folderRef.current = selected;
      setFolder(selected);
      setFolderVerified(true);
      recordSetup(
        "Folder",
        `Write and read verified in ${selected.name}; it is now the Working folder.`,
        "success",
      );
      setDetail(
        "Keep the XRP connected by USB-C through the controller check and course-software update.",
      );
      setStage("usb");
    } catch (folderError) {
      if (!wasCancelled(folderError)) {
        const message = errorDetail(folderError);
        setError(
          folderError instanceof WorkspaceManifestError
            ? message
            : `The selected Working folder could not be written and read. ${message}`,
        );
        recordSetup(
          "Folder",
          folderError instanceof WorkspaceManifestError
            ? message
            : `Write check failed: ${message}`,
          "error",
        );
      }
    } finally {
      finishFolderInteraction();
    }
  }, [
    beginFolderInteraction,
    bindDiagnosticFolder,
    finishFolderInteraction,
    recordSetup,
  ]);

  const continueWithFolder = useCallback(async () => {
    const selected = folderRef.current;
    if (!selected) return;
    setError("");
    beginFolderInteraction();
    try {
      await requireWorkingFolderParent(selected);
      await loadWorkspaceManifest(selected);
      if (!folderVerified) {
        const permission = await requestCourseFolderPermission(selected);
        if (permission !== "granted") {
          setError(
            `Chrome does not currently have write access to ${selected.name}. Reconnect it or choose a different folder.`,
          );
          return;
        }
        recordSetup("Folder", `Checking write access to ${selected.name}.`);
        await bindDiagnosticFolder(selected);
        const remembered = await replaceRememberedWorkspaceFolder(selected);
        if (!remembered.remembered) {
          throw new Error(`Chrome could not remember ${selected.name}.`);
        }
        setFolderVerified(true);
        recordSetup(
          "Folder",
          `Write and read verified in ${selected.name}.`,
          "success",
        );
      }
      setDetail(
        "Keep the XRP connected by USB-C through the controller check and course-software update.",
      );
      setStage("usb");
    } catch (folderError) {
      const message = errorDetail(folderError);
      setError(message);
      recordSetup("Folder", `Write check failed: ${message}`, "error");
    } finally {
      finishFolderInteraction();
    }
  }, [
    beginFolderInteraction,
    bindDiagnosticFolder,
    finishFolderInteraction,
    folderVerified,
    recordSetup,
  ]);

  useEffect(() => {
    if (stage !== "usb" || !manifest || !supportsWebSerial()) return;
    let disposed = false;
    beginSerialInteraction();
    setCheckingAuthorizedPort(true);
    setDetail(
      "Checking whether Chrome already has permission to use the connected XRP…",
    );
    void findGrantedXrpPort(manifest.controller)
      .then((port) => {
        if (disposed) return;
        setAuthorizedPort(port);
        setDetail(
          port
            ? "Chrome recognizes a previously approved SparkFun XRP controller. Confirm it below to start the USB check."
            : "Connect the XRP by USB-C, then choose it. Chrome requires its device chooser the first time this site uses the controller.",
        );
      })
      .catch((portError) => {
        if (disposed) return;
        setAuthorizedPort(null);
        setError(errorDetail(portError));
      })
      .finally(() => {
        finishSerialInteraction();
        if (!disposed) setCheckingAuthorizedPort(false);
      });
    return () => {
      disposed = true;
    };
  }, [beginSerialInteraction, finishSerialInteraction, manifest, stage]);

  const inspectPort = useCallback(
    async (port: SerialPortLike) => {
      if (!manifest) return;
      setError("");
      setInspectedRobotId("");
      setDetail("Checking the XRP controller and course runtime…");
      recordSetup("USB", "Selected an XRP and opened its serial connection.");
      portRef.current = port;
      setAuthorizedPort(port);
      let session: MicroPythonSession;
      try {
        session = await openRawRepl(port);
      } catch (replError) {
        sessionRef.current = null;
        if (replError instanceof SerialPortOpenError) {
          portRef.current = null;
          const message = replError.message;
          setError(message);
          setDetail(
            "The XRP was found, but Chrome could not use its USB connection.",
          );
          recordSetup(
            "USB",
            `USB connection could not be opened: ${message}`,
            "error",
          );
          setStage("usb");
          return;
        }
        setReplUnavailable(true);
        setStage("firmware");
        setDetail(
          "Chrome found the XRP, but MicroPython setup did not start. Try the USB check once more, or install the course firmware to continue.",
        );
        recordSetup(
          "USB",
          `USB setup mode was not available: ${errorDetail(replError)}`,
          "warning",
        );
        return;
      }
      sessionRef.current = session;
      try {
        const inspection = await inspectDevice(session, manifest);
        setInspectedRobotId(inspection.robotId);
        setReplUnavailable(false);
        const profile = await readExistingNetworkProfile(session);
        await feedCommissioningWatchdog(session);
        setExistingNetwork(profile);
        if (hasUsableNetworkProfile(profile)) {
          setNetworkMode("keep");
          setStationSsid(profile.stationSsid ?? "");
          setDetail(
            "The controller is compatible. Keep its current network or choose a different one.",
          );
          recordSetup(
            "USB",
            "Verified the RP2350 controller, MicroPython runtime, and existing network profile.",
            "success",
          );
        } else {
          setNetworkMode("access_point");
          setStationSsid("");
          setDetail(
            profile.present
              ? "The controller is compatible, but its saved network settings are incomplete. Choose a robot hotspot or a local Wi-Fi network."
              : "The controller is compatible. A device-specific XRP hotspot is the default.",
          );
          recordSetup(
            "USB",
            profile.present
              ? "Verified the RP2350 controller and MicroPython runtime; the incomplete network profile will be replaced."
              : "Verified the RP2350 controller and MicroPython runtime; no course network profile was installed.",
            profile.present ? "warning" : "success",
          );
        }
        setStage("network");
      } catch (inspectionError) {
        if (inspectionError instanceof FirmwareRequiredError) {
          setReplUnavailable(false);
          setStage("firmware");
          setDetail(inspectionError.message);
          recordSetup("Firmware", inspectionError.message, "warning");
        } else {
          const message = errorDetail(inspectionError);
          setError(message);
          recordSetup("USB", `Inspection failed: ${message}`, "error");
          await session.resetAndClose();
          sessionRef.current = null;
          setStage("usb");
        }
      }
    },
    [manifest, recordSetup],
  );

  const selectRobot = useCallback(async () => {
    if (!manifest || selectingRobot) return;
    setError("");
    setSelectingRobot(true);
    beginSerialInteraction();
    setDetail(
      "Chrome opened its device picker. Select the SparkFun XRP controller and choose Connect; setup then continues automatically.",
    );
    recordSetup("USB", "Opening the browser device picker.");
    try {
      await inspectPort(await requestXrpPort(manifest.controller));
    } catch (serialError) {
      if (wasCancelled(serialError)) {
        setDetail(
          "The device chooser closed without selecting an XRP. No changes were made.",
        );
        recordSetup("USB", "Device selection was cancelled.");
      } else {
        const message = errorDetail(serialError);
        setError(message);
        recordSetup("USB", `Device selection failed: ${message}`, "error");
      }
    } finally {
      finishSerialInteraction();
      setSelectingRobot(false);
    }
  }, [
    beginSerialInteraction,
    finishSerialInteraction,
    inspectPort,
    manifest,
    recordSetup,
    selectingRobot,
  ]);

  const confirmAuthorizedRobot = useCallback(async () => {
    if (!authorizedPort || selectingRobot) return;
    setSelectingRobot(true);
    beginSerialInteraction();
    try {
      await inspectPort(authorizedPort);
    } finally {
      finishSerialInteraction();
      setSelectingRobot(false);
    }
  }, [
    authorizedPort,
    beginSerialInteraction,
    finishSerialInteraction,
    inspectPort,
    selectingRobot,
  ]);

  useEffect(() => {
    if ((stage !== "network" && stage !== "firmware") || !sessionRef.current) {
      return;
    }
    const feed = async () => {
      if (watchdogFeedInFlightRef.current || !sessionRef.current) return;
      watchdogFeedInFlightRef.current = true;
      try {
        await feedCommissioningWatchdog(sessionRef.current);
      } catch (feedError) {
        const message = errorDetail(feedError);
        setError(message);
        recordSetup("USB", `Serial connection was lost: ${message}`, "error");
        const failedSession = sessionRef.current;
        sessionRef.current = null;
        portRef.current = null;
        try {
          await failedSession?.resetAndClose();
        } catch {
          // A USB disconnect can close the browser stream before cleanup runs.
        }
        setStage("usb");
      } finally {
        watchdogFeedInFlightRef.current = false;
      }
    };
    const timer = window.setInterval(() => void feed(), 2_000);
    return () => clearInterval(timer);
  }, [recordSetup, stage]);

  const enterFirmwareMode = useCallback(async () => {
    const port = portRef.current;
    if (!port) return;
    setError("");
    setDetail("Opening the XRP firmware drive…");
    recordSetup("Firmware", "Restarting the controller in firmware mode.");
    try {
      const session = sessionRef.current;
      if (session) {
        try {
          await session.executeWithoutFollow(
            "import machine\nmachine.bootloader()",
          );
        } finally {
          await session.close();
          sessionRef.current = null;
        }
      } else {
        await touchUf2Bootloader(port);
      }
      setStage("firmware-volume");
      setDetail(
        "When the RP2350 drive appears, select it to install the verified course firmware.",
      );
      recordSetup("Firmware", "The RP2350 firmware drive is ready to select.");
    } catch (firmwareModeError) {
      const message = errorDetail(firmwareModeError);
      setError(message);
      recordSetup(
        "Firmware",
        `Could not enter firmware mode: ${message}`,
        "error",
      );
    }
  }, [recordSetup]);

  const writeFirmware = useCallback(async () => {
    if (!manifest) return;
    setError("");
    try {
      const volume = await chooseFirmwareVolume();
      setDetail("Writing and verifying the course MicroPython firmware…");
      recordSetup(
        "Firmware",
        "Writing the bundled RP2350 MicroPython firmware.",
      );
      await installFirmware({ volume, manifest, manifestUrl });
      setDetail("Firmware installed. Waiting for the XRP to reconnect…");
      recordSetup(
        "Firmware",
        "Firmware transfer completed; waiting for the MicroPython USB device.",
        "success",
      );
      await new Promise((resolve) => window.setTimeout(resolve, 1_500));
      const port = await waitForReenumeratedPort(manifest.controller);
      if (port) {
        await inspectPort(port);
      } else {
        setStage("usb");
        setDetail(
          "Firmware installed. Select the reconnected XRP to continue.",
        );
        recordSetup(
          "Firmware",
          "Firmware installed; waiting for the reconnected USB device.",
        );
      }
    } catch (firmwareError) {
      if (!wasCancelled(firmwareError)) {
        const message = errorDetail(firmwareError);
        setError(message);
        recordSetup("Firmware", `Firmware update failed: ${message}`, "error");
      }
    }
  }, [inspectPort, manifest, manifestUrl, recordSetup]);

  const beginCommissioning = useCallback(async () => {
    if (!manifest || !sessionRef.current) return;
    const namedHotspotRequested =
      hotspotName.ssid !== undefined &&
      hotspotName.ssid !== existingNetwork?.accessPointSsid;
    const network: NetworkSelection =
      networkMode === "station"
        ? {
            mode: "station",
            ssid: stationSsid,
            password: stationPassword,
          }
        : networkMode === "keep" && !namedHotspotRequested
          ? { mode: "keep" }
          : { mode: "access_point", ssid: hotspotName.ssid };
    setError("");
    setProgress(null);
    setInstallElapsedSeconds(0);
    lastInstallProgressPhaseRef.current = "";
    setStage("installing");
    recordSetup(
      "Install",
      network.mode === "station"
        ? `Checking course software and configuring Wi-Fi ${network.ssid}.`
        : network.mode === "keep"
          ? "Checking course software and retaining the installed network profile."
          : `Checking course software and configuring ${network.ssid ?? "the robot hotspot"}.`,
    );
    try {
      await waitForOfflineShell();
      const completed = await commissionDevice({
        session: sessionRef.current,
        manifest,
        manifestUrl,
        robotId: inspectedRobotId,
        network,
        onProgress: (next) => {
          setProgress(next);
          setDetail(next.detail);
          const logKey = `${next.phase}:${next.detail}`;
          if (lastInstallProgressPhaseRef.current !== logKey) {
            lastInstallProgressPhaseRef.current = logKey;
            recordSetup("Install", next.detail);
          }
        },
      });
      sessionRef.current = null;
      setStationPassword("");
      const workspace = folderRef.current;
      if (!workspace || !inspectedRobotId) {
        throw new Error(
          "The Working folder or XRP identity was lost during setup. Select the XRP again.",
        );
      }
      setResult(completed);
      wifiAttemptRef.current = 0;
      lastWifiLoggedIssueRef.current = "";
      setWifiAttempts(0);
      setWifiIssue("");
      setWifiNeedsRepair(false);
      setWifiProbeEnabled(false);
      const stationFallback =
        network.mode === "station" &&
        completed.network.mode === "access_point" &&
        completed.network.fallback;
      setDetail(
        stationFallback
          ? `The XRP could not join ${network.ssid} and started ${completed.network.ssid} instead. Join that robot hotspot from this computer's Wi-Fi menu, then check the connection.`
          : completed.network.mode === "station"
            ? `The XRP joined ${completed.network.ssid}. Confirm that this computer is on the same network before checking the robot connection.`
            : `USB setup is complete. Before checking the robot, join ${completed.network.ssid} from the computer's Wi-Fi menu and return to this page.`,
      );
      recordSetup(
        "Install",
        `${stationFallback ? `Station connection to ${network.ssid} failed; using robot hotspot. ` : ""}Verified ${completed.installedFiles} changed and ${completed.unchangedFiles} unchanged files; XRP restarted on ${completed.network.ssid} at ${completed.network.address}.`,
        "success",
      );
      setStage("wifi");
    } catch (commissioningError) {
      const message = errorDetail(commissioningError);
      const failedSession = sessionRef.current;
      sessionRef.current = null;
      portRef.current = null;
      try {
        await failedSession?.resetAndClose();
      } catch {
        // A USB disconnect can close the browser stream before cleanup runs.
      }
      setError(message);
      recordSetup(
        "Install",
        `Course software update failed: ${message}`,
        "error",
      );
      setDetail(
        "Setup stopped before the final connection check. Review the message above, then select the XRP again; verified file updates are retained.",
      );
      setStage("usb");
    }
  }, [
    manifest,
    manifestUrl,
    existingNetwork?.accessPointSsid,
    hotspotName.ssid,
    inspectedRobotId,
    networkMode,
    recordSetup,
    stationPassword,
    stationSsid,
  ]);

  const verifyWifi = useCallback(async () => {
    if (
      !manifest ||
      !result ||
      wifiCheckInFlightRef.current ||
      navigatingRef.current
    )
      return;
    wifiCheckInFlightRef.current = true;
    setCheckingWifi(true);
    const attempt = wifiAttemptRef.current + 1;
    wifiAttemptRef.current = attempt;
    setWifiAttempts(attempt);
    const endpoint = `http://${result.network.address}`;
    try {
      const response = await fetchXrpService(
        endpoint,
        "/api/v1/info",
        "identity",
        WIFI_INFO_PROBE_TIMEOUT_MS,
      );
      if (!response.ok) {
        throw new XrpServiceProbeError(
          "http",
          `The XRP service replied with HTTP ${response.status}.`,
        );
      }
      const info = (await response.json()) as PhysicalInfo;
      if (
        info.protocol !== manifest.compatibility.protocolVersion ||
        info.protocolRevision !== manifest.compatibility.protocolRevision ||
        info.courseApiRevision !== manifest.compatibility.courseApiRevision ||
        info.runtimeReleaseSequence !== manifest.releaseSequence ||
        info.runtimeGeneration !== result.activationGeneration ||
        info.runtimeManifestSha256 !== result.runtimeManifestSha256
      ) {
        throw new XrpServiceProbeError(
          "version",
          "The XRP replied, but it did not start the course runtime that was just installed. Reconnect it by USB-C and run repair again.",
        );
      }
      const verifiedRobotId = info.robotId?.trim().toLocaleLowerCase();
      if (
        !verifiedRobotId ||
        !inspectedRobotId ||
        verifiedRobotId !== inspectedRobotId.toLocaleLowerCase()
      ) {
        throw new XrpServiceProbeError(
          "identity",
          "The XRP reached over Wi-Fi is not the controller selected over USB-C. Check the robot and network, then try again.",
        );
      }
      const expectedHostname = robotHostnameForId(verifiedRobotId);
      if (info.robotName.toLocaleLowerCase() !== expectedHostname) {
        throw new XrpServiceProbeError(
          "identity",
          "The XRP started with an outdated network name. Reconnect it by USB-C and run repair again.",
        );
      }
      const stateResponse = await fetchXrpService(
        endpoint,
        "/api/v1/state?afterLogSeq=0",
        "state",
        WIFI_STATE_PROBE_TIMEOUT_MS,
      );
      if (!stateResponse.ok) {
        throw new XrpServiceProbeError(
          "http",
          `The XRP state service replied with HTTP ${stateResponse.status}.`,
        );
      }
      const state = (await stateResponse.json()) as PhysicalStateProbe;
      if (!state.bootId || state.bootId !== info.bootId) {
        throw new XrpServiceProbeError(
          "version",
          "The XRP restarted during its connection check. Try the connection check again.",
        );
      }
      const verifiedAddress = info.address?.trim() || result.network.address;
      const workspace = folderRef.current;
      if (!workspace) {
        throw new Error(
          "Choose a Working folder before commissioning the XRP.",
        );
      }
      await updateWorkspaceTargetPreference(
        (current) =>
          targetPreferenceForCommissionedRobot(current, {
            robotId: verifiedRobotId,
            hostname: info.robotName,
            requestedMode: result.network.requested_mode,
            mode: result.network.mode,
            address: `http://${verifiedAddress}`,
            ssid: result.network.ssid,
            fallback: result.network.fallback,
          }),
        workspace,
      );
      setWifiIssue("");
      setWifiNeedsRepair(false);
      setDetail(`${info.robotName} is commissioned and ready.`);
      recordSetup(
        "XRP connection",
        `Verified ${info.robotName} at ${verifiedAddress} on attempt ${attempt}.`,
        "success",
      );
      setStage("complete");
      await diagnosticLogRef.current?.flush();
    } catch (probeError) {
      if (probeError instanceof WorkspaceManifestError) {
        const issue = probeError.message;
        setError(issue);
        setWifiIssue(issue);
        setWifiProbeEnabled(false);
        recordSetup("XRP settings", issue, "error");
        return;
      }
      const serviceFailure = probeError instanceof XrpServiceProbeError;
      const issue =
        probeError instanceof XrpServiceProbeTimeoutError
          ? probeError.message
          : wasCancelled(probeError)
            ? "The XRP connection check was cancelled."
            : serviceFailure
              ? probeError.message
              : `The browser could not reach the XRP (${errorDetail(probeError)}).`;
      setWifiIssue(issue);
      setWifiNeedsRepair(serviceFailure);
      if (serviceFailure) setWifiProbeEnabled(false);
      const issueKind = serviceFailure ? probeError.kind : "network";
      const logKey = `${issueKind}:${issue}`;
      if (
        attempt === 1 ||
        attempt % 5 === 0 ||
        lastWifiLoggedIssueRef.current !== logKey
      ) {
        lastWifiLoggedIssueRef.current = logKey;
        recordSetup(
          "XRP connection",
          `Attempt ${attempt}: ${issue}`,
          "warning",
        );
      }
    } finally {
      wifiCheckInFlightRef.current = false;
      setCheckingWifi(false);
    }
  }, [inspectedRobotId, manifest, recordSetup, result]);

  useEffect(() => {
    if (stage !== "wifi" || !wifiProbeEnabled) return;
    void verifyWifi();
    const timer = window.setInterval(
      () => void verifyWifi(),
      WIFI_PROBE_INTERVAL_MS,
    );
    return () => clearInterval(timer);
  }, [stage, verifyWifi, wifiProbeEnabled]);

  const startWifiVerification = useCallback(() => {
    if (!result || wifiProbeEnabled) return;
    setError("");
    setWifiIssue("");
    setWifiNeedsRepair(false);
    setWifiProbeEnabled(true);
    setDetail(`Checking the XRP at ${result.network.address}…`);
    recordSetup(
      "XRP connection",
      `Computer network confirmed by the user; checking ${result.network.address}.`,
    );
  }, [recordSetup, result, wifiProbeEnabled]);

  const returnToUsb = useCallback(() => {
    setResult(null);
    setWifiAttempts(0);
    setWifiIssue("");
    setWifiNeedsRepair(false);
    setWifiProbeEnabled(false);
    wifiAttemptRef.current = 0;
    lastWifiLoggedIssueRef.current = "";
    setDetail("Keep the XRP connected by USB-C, then select it again.");
    setStage("usb");
    recordSetup("XRP connection", "Returned to USB setup for another repair.");
  }, [recordSetup]);

  const copySetupLog = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(
        renderSetupLog(setupLogEntriesRef.current, manifestReleaseRef.current),
      );
      setSetupLogCopied(true);
      window.setTimeout(() => setSetupLogCopied(false), 1_500);
    } catch (copyError) {
      setSetupLogSaveError(
        `The setup log could not be copied: ${errorDetail(copyError)}`,
      );
    }
  }, []);

  const closeUsbSession = useCallback(async () => {
    const session = sessionRef.current;
    sessionRef.current = null;
    portRef.current = null;
    try {
      await session?.resetAndClose();
    } catch {
      // A disconnected controller may already have closed the browser stream.
    }
  }, []);

  const goBack = useCallback(async () => {
    if (stage === "loading" || stage === "installing" || stage === "complete")
      return;
    setError("");
    if (stage === "folder") return;
    if (stage === "usb") {
      setStage("folder");
      setDetail(
        folderRef.current
          ? `${folderRef.current.name} is the current Working folder. Use it or choose a different folder.`
          : "Choose a Working folder to continue.",
      );
      return;
    }
    if (stage === "wifi") {
      returnToUsb();
      return;
    }
    await closeUsbSession();
    setExistingNetwork(null);
    setAuthorizedPort(null);
    setStage("usb");
    setDetail("Select the connected XRP to repeat the USB check.");
  }, [closeUsbSession, returnToUsb, stage]);

  const exitSetup = useCallback(
    async (destination: string) => {
      if (stage === "installing" || navigatingRef.current) return;
      const destinationName = navigationDestinationName(destination);
      navigatingRef.current = true;
      setNavigationDestination(destinationName);
      setDetail(`Closing the USB connection and opening ${destinationName}…`);
      await diagnosticLogRef.current?.flush();
      await closeUsbSession();
      window.location.assign(new URL(destination, window.location.href));
    },
    [closeUsbSession, stage],
  );

  useEffect(() => {
    if (stage !== "installing") return;
    const startedAt = performance.now();
    setInstallElapsedSeconds(0);
    const elapsedTimer = window.setInterval(
      () =>
        setInstallElapsedSeconds(
          Math.max(0, Math.floor((performance.now() - startedAt) / 1_000)),
        ),
      250,
    );
    const keepSetupOpen = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", keepSetupOpen);
    return () => {
      clearInterval(elapsedTimer);
      window.removeEventListener("beforeunload", keepSetupOpen);
    };
  }, [stage]);

  useEffect(() => {
    const currentActivity = () =>
      commissionReloadIsSafe({
        appReady: manifest !== null && stage !== "loading",
        folderInteractionActive: folderInteractionCountRef.current > 0,
        serialInteractionActive:
          serialInteractionCountRef.current > 0 ||
          sessionRef.current !== null ||
          stage === "network" ||
          stage === "firmware" ||
          stage === "firmware-volume",
        installActive: stage === "installing",
        networkHandoffActive:
          stage === "wifi" || checkingWifi || wifiProbeEnabled,
        navigationActive: navigatingRef.current || stage === "complete",
      });
    const unregister = registerOfflineShellBeforeReload(async () => {
      if (!currentActivity()) return false;
      await diagnosticLogRef.current?.flush();
      return currentActivity();
    });
    if (currentActivity()) retryPendingOfflineShellReload();
    return unregister;
  }, [
    checkingWifi,
    folderInteractionActive,
    interactionRevision,
    manifest,
    stage,
    wifiProbeEnabled,
  ]);

  useEffect(() => {
    const flushDiagnosticLog = () => {
      void diagnosticLogRef.current?.flush();
    };
    window.addEventListener("pagehide", flushDiagnosticLog);
    return () => window.removeEventListener("pagehide", flushDiagnosticLog);
  }, []);

  const activeStep = workflowStep(stage);
  const progressPercent =
    progress?.phase === "compare"
      ? 12
      : progress?.phase === "install" && progress.total
        ? 18 + Math.round(((progress.completed ?? 0) / progress.total) * 62)
        : progress?.phase === "verify"
          ? 84
          : progress?.phase === "network"
            ? 93
            : progress?.phase === "reset"
              ? 100
              : 8;
  const installPhaseOrder = [
    "compare",
    "install",
    "verify",
    "network",
    "reset",
  ];
  const installPhaseIndex = progress
    ? installPhaseOrder.indexOf(progress.phase)
    : -1;

  return (
    <div className="commission-app">
      <CourseHeader
        active="commission"
        className="commission-header"
        navigationDisabled={
          stage === "installing" || Boolean(navigationDestination)
        }
        onNavigate={(href) => void exitSetup(href)}
      />
      <main className="commission-layout">
        <aside aria-label="Setup progress" className="commission-steps">
          {[
            [1, "Working folder"],
            [2, "XRP over USB"],
            [3, "Install and verify"],
            [4, "Verify robot connection"],
          ].map(([number, label]) => (
            <div
              className={
                Number(number) < activeStep
                  ? "done"
                  : Number(number) === activeStep
                    ? "active"
                    : ""
              }
              key={label}
            >
              <span>{Number(number) < activeStep ? "✓" : number}</span>
              <strong>{label}</strong>
            </div>
          ))}
          <div className="commission-offline">
            {folder ? <small>Working folder: {folder.name}</small> : null}
          </div>
        </aside>

        <section className="commission-panel" aria-live="polite">
          {stage === "loading" ? <h1>Preparing setup</h1> : null}
          {stage === "folder" ? <h1>Choose a Working folder</h1> : null}
          {stage === "usb" ? <h1>Connect the XRP by USB-C</h1> : null}
          {stage === "network" ? <h1>Choose the robot network</h1> : null}
          {stage === "installing" ? <h1>Updating the XRP</h1> : null}
          {stage === "firmware" ? (
            <h1>
              {replUnavailable
                ? "USB setup mode did not start"
                : "Install course firmware"}
            </h1>
          ) : null}
          {stage === "firmware-volume" ? (
            <h1>Install course firmware</h1>
          ) : null}
          {stage === "wifi" ? <h1>Verify the robot connection</h1> : null}
          {stage === "complete" ? <h1>XRP ready</h1> : null}
          <p className="commission-detail">{detail}</p>
          {navigationDestination ? (
            <p
              className="commission-navigation-status"
              data-testid="setup-navigation-status"
              role="status"
            >
              Opening {navigationDestination}…
            </p>
          ) : null}

          {error ? (
            <p className="commission-error" role="alert">
              {error}
            </p>
          ) : null}

          {stage === "loading" && error ? (
            <button
              className="primary-button"
              onClick={() => window.location.reload()}
            >
              Reload setup
            </button>
          ) : null}

          {stage === "folder" ? (
            <div className="commission-actions">
              <div className="commission-action-row">
                {folder ? (
                  <button
                    className="primary-button"
                    onClick={continueWithFolder}
                  >
                    {folderVerified
                      ? `Use ${folder.name}`
                      : `Reconnect ${folder.name}`}
                  </button>
                ) : null}
                <button
                  className={folder ? undefined : "primary-button"}
                  onClick={chooseFolder}
                >
                  {folder ? "Choose different folder" : "Choose Working folder"}
                </button>
              </div>
              <p>
                Choose one parent Working folder for your UCSBXRP work. Each
                project gets its own named Project folder inside it; source, run
                data, and automatic copies stay with that project. The
                cumulative troubleshooting log is saved directly in the Working
                folder. Chrome stores the course apps separately.
              </p>
            </div>
          ) : null}

          {stage === "usb" ? (
            <div className="commission-actions">
              {authorizedPort ? (
                <div className="recognized-xrp">
                  <span aria-hidden="true">✓</span>
                  <div>
                    <strong>SparkFun XRP Controller (RP2350)</strong>
                    <small>Previously approved in this Chrome profile</small>
                  </div>
                  <button
                    className="primary-button"
                    disabled={selectingRobot}
                    onClick={() => void confirmAuthorizedRobot()}
                  >
                    Use this XRP
                  </button>
                </div>
              ) : null}
              <button
                className={authorizedPort ? undefined : "primary-button"}
                disabled={
                  !manifest ||
                  !supportsWebSerial() ||
                  selectingRobot ||
                  checkingAuthorizedPort
                }
                onClick={selectRobot}
              >
                {selectingRobot
                  ? "Waiting for device choice…"
                  : checkingAuthorizedPort
                    ? "Checking USB…"
                    : authorizedPort
                      ? "Choose another XRP"
                      : "Choose connected XRP"}
              </button>
              <p>
                {supportsWebSerial()
                  ? "Chrome can recognize only devices this site was previously allowed to use. On first use, Choose connected XRP opens the required system device chooser; select XRP Controller, which may appear as ‘Board in FS mode’."
                  : "Robot setup requires desktop Chrome or Edge; this browser does not provide USB device access."}
              </p>
            </div>
          ) : null}

          {stage === "network" ? (
            <div className="network-options">
              <p className="network-explainer">
                USB-C remains connected while the wizard installs and verifies
                the robot. The selected network is then used locally for Run,
                Monitor, and telemetry. Existing Wi-Fi needs no computer network
                change; robot-hotspot mode requires joining the named hotspot
                once.
              </p>
              {visibleNetworkChoices.keepCurrent ? (
                <label>
                  <input
                    checked={networkMode === "keep"}
                    name="network-mode"
                    onChange={() => setNetworkMode("keep")}
                    type="radio"
                  />
                  <span>
                    <strong>
                      {existingNetwork?.mode === "access_point"
                        ? `Keep ${existingNetwork.accessPointSsid ?? "the current robot hotspot"}`
                        : `Keep ${existingNetwork?.stationSsid ?? "the current Wi-Fi network"}`}
                    </strong>
                    <small>
                      {existingNetwork?.mode === "station"
                        ? "Current robot Wi-Fi"
                        : "Current robot hotspot"}
                    </small>
                  </span>
                </label>
              ) : null}
              {visibleNetworkChoices.robotHotspot ? (
                <label>
                  <input
                    checked={networkMode === "access_point"}
                    name="network-mode"
                    onChange={() => setNetworkMode("access_point")}
                    type="radio"
                  />
                  <span>
                    <strong>
                      {existingNetwork?.present
                        ? "Switch to robot hotspot"
                        : "Robot hotspot"}
                    </strong>
                    <small>No router or campus network is required.</small>
                  </span>
                </label>
              ) : null}
              <label>
                <input
                  checked={networkMode === "station"}
                  name="network-mode"
                  onChange={() => setNetworkMode("station")}
                  type="radio"
                />
                <span>
                  <strong>
                    {existingNetwork?.mode === "station"
                      ? "Connect to another Wi-Fi network"
                      : "Connect to a Wi-Fi network"}
                  </strong>
                  <small>Use the same local network as this computer.</small>
                </span>
              </label>
              {networkMode === "station" ? (
                <div className="station-fields">
                  <label>
                    Network name
                    <input
                      autoComplete="off"
                      onChange={(event) => setStationSsid(event.target.value)}
                      value={stationSsid}
                    />
                  </label>
                  <label>
                    Wi-Fi password
                    <input
                      autoComplete="off"
                      onChange={(event) =>
                        setStationPassword(event.target.value)
                      }
                      type="password"
                      value={stationPassword}
                    />
                  </label>
                  <small>
                    The password is sent over USB and is not saved by the web
                    app. Wi-Fi passwords contain at least 8 characters.
                  </small>
                </div>
              ) : null}
              {networkMode === "access_point" ||
              (networkMode === "keep" &&
                existingNetwork?.mode === "access_point") ? (
                <div className="hotspot-fields">
                  <label>
                    Enter one team member&apos;s last name to give this robot a
                    unique Wi-Fi hotspot name (optional)
                    <input
                      aria-invalid={hotspotName.error ? "true" : undefined}
                      autoComplete="off"
                      maxLength={23}
                      onChange={(event) =>
                        setHotspotLastName(event.target.value)
                      }
                      placeholder="VISELL"
                      spellCheck={false}
                      value={hotspotLastName}
                    />
                  </label>
                  <small>
                    Hotspot:{" "}
                    {hotspotName.ssid ?? `${HOTSPOT_SSID_PREFIX}<NAME>`}. Leave
                    this blank to use the current or device-specific name.
                  </small>
                  {hotspotName.error ? (
                    <small className="field-error" role="alert">
                      {hotspotName.error}
                    </small>
                  ) : null}
                </div>
              ) : null}
              <button
                className="primary-button"
                disabled={
                  (networkMode === "station" &&
                    (!stationSsid.trim() || stationPassword.length < 8)) ||
                  (networkMode !== "station" && Boolean(hotspotName.error))
                }
                onClick={beginCommissioning}
              >
                Install or repair course software
              </button>
            </div>
          ) : null}

          {stage === "installing" ? (
            <div className="commission-progress">
              <div>
                <span style={{ width: `${progressPercent}%` }} />
              </div>
              <small>
                {progress?.total
                  ? `${progress.completed ?? 0} of ${progress.total} changed files`
                  : "Checking the installed release"}
                {` · ${installElapsedSeconds} s elapsed`}
              </small>
              <ol aria-label="Installation stages">
                {[
                  "Compare installed files",
                  "Update changed files",
                  "Verify course software",
                  "Configure robot network",
                  "Restart the XRP",
                ].map((label, index) => (
                  <li
                    className={
                      index < installPhaseIndex
                        ? "done"
                        : index === installPhaseIndex
                          ? "active"
                          : ""
                    }
                    key={label}
                  >
                    <span>{index < installPhaseIndex ? "✓" : index + 1}</span>
                    {label}
                  </li>
                ))}
              </ol>
              <p>
                Keep this page and the USB-C connection open until restart
                completes.
              </p>
            </div>
          ) : null}

          {stage === "firmware" ? (
            <div className="commission-actions">
              {replUnavailable && authorizedPort ? (
                <button
                  className="primary-button"
                  disabled={selectingRobot}
                  onClick={confirmAuthorizedRobot}
                >
                  {selectingRobot ? "Checking…" : "Try USB check again"}
                </button>
              ) : null}
              <button
                className={replUnavailable ? undefined : "primary-button"}
                onClick={enterFirmwareMode}
              >
                Install course firmware
              </button>
              <p>
                This uses the exact MicroPython release bundled with the course.
              </p>
            </div>
          ) : null}

          {stage === "firmware-volume" ? (
            <div className="commission-actions">
              <button className="primary-button" onClick={writeFirmware}>
                Select RP2350 drive
              </button>
              <p>
                The drive appears briefly, then the XRP restarts automatically.
              </p>
            </div>
          ) : null}

          {stage === "wifi" && result ? (
            <div className="wifi-handoff">
              <dl>
                <div>
                  <dt>Network</dt>
                  <dd>{result.network.ssid}</dd>
                </div>
                {result.network.mode === "access_point" ? (
                  <div>
                    <dt>Password</dt>
                    <dd>{manifest?.networkDefaults.password}</dd>
                  </div>
                ) : null}
                <div>
                  <dt>XRP address</dt>
                  <dd>{result.network.address}</dd>
                </div>
              </dl>
              <ol className="wifi-steps">
                {result.network.mode === "access_point" ? (
                  <>
                    <li>Open the computer&apos;s Wi-Fi menu.</li>
                    <li>
                      Join <strong>{result.network.ssid}</strong> using the
                      password shown above.
                    </li>
                    <li>Return to this setup page and use the button below.</li>
                  </>
                ) : (
                  <>
                    <li>
                      On this computer, stay connected to{" "}
                      <strong>{result.network.ssid}</strong>.
                    </li>
                    <li>
                      If the Wi-Fi menu shows another network, join{" "}
                      <strong>{result.network.ssid}</strong> first.
                    </li>
                    <li>Use the button below to check the robot service.</li>
                  </>
                )}
              </ol>
              <div
                className={
                  wifiNeedsRepair
                    ? "wifi-probe-status needs-repair"
                    : "wifi-probe-status"
                }
                role="status"
              >
                <strong>
                  {wifiNeedsRepair
                    ? "Robot service needs repair"
                    : !wifiProbeEnabled
                      ? "Connection not checked yet"
                      : wifiAttempts
                        ? `Waiting for XRP · attempt ${wifiAttempts}`
                        : "Checking the XRP"}
                </strong>
                <span>
                  {wifiIssue ||
                    (wifiProbeEnabled
                      ? "Checking the robot service at the address above."
                      : "The wizard waits for you to finish the computer network step before it checks the XRP.")}
                </span>
              </div>
              <button
                className="primary-button"
                disabled={checkingWifi}
                onClick={wifiProbeEnabled ? verifyWifi : startWifiVerification}
              >
                {checkingWifi
                  ? "Checking…"
                  : wifiProbeEnabled
                    ? "Check again now"
                    : wifiNeedsRepair
                      ? "Check XRP again"
                      : result.network.mode === "access_point"
                        ? `I joined ${result.network.ssid} — check XRP`
                        : `Check XRP on ${result.network.ssid}`}
              </button>
              <p className="wifi-instruction">
                If the browser asks to find and connect to devices on the local
                network, choose <strong>Allow</strong>. After the robot replies,
                use <strong>Open IDE</strong> to continue.
              </p>
              <details className="connection-help">
                <summary>Connection help</summary>
                <ul>
                  <li>
                    RESET and BOOT are not used here; USB installation has
                    already finished.
                  </li>
                  <li>
                    In this browser's site settings for this page, allow local
                    network access.
                  </li>
                  <li>
                    On macOS, Chrome must also be enabled under System Settings
                    → Privacy &amp; Security → Local Network.
                  </li>
                </ul>
              </details>
            </div>
          ) : null}

          {stage === "complete" ? (
            <div className="commission-success">
              <span aria-hidden="true">✓</span>
              <div>
                <strong>Robot setup is complete</strong>
                <p>
                  {result?.network.ssid
                    ? `${result.network.ssid} was verified for Run and telemetry.`
                    : "The robot connection was verified."}
                  {folder ? ` ${folder.name} is the Working folder.` : ""}
                </p>
                <button
                  className="primary-button"
                  disabled={Boolean(navigationDestination)}
                  onClick={() => void exitSetup("../workspace/?mode=ide")}
                  type="button"
                >
                  Open IDE
                </button>
              </div>
            </div>
          ) : null}

          <details className="setup-log" aria-live="off">
            <summary>
              <span>Setup log</span>
              <small>
                {setupLogEntries.length}{" "}
                {setupLogEntries.length === 1 ? "event" : "events"} ·{" "}
                {folder && diagnosticLogReady
                  ? `saved as ${diagnosticLogFileName}`
                  : "copy available; log file not connected"}
              </small>
            </summary>
            <div className="setup-log-body">
              <pre aria-label="Setup log">
                {renderSetupLog(
                  setupLogEntries,
                  manifest?.releaseId ?? manifestReleaseRef.current,
                )}
              </pre>
              <div className="setup-log-footer">
                <button type="button" onClick={copySetupLog}>
                  {setupLogCopied ? "Copied" : "Copy log"}
                </button>
                {setupLogSaveError ? (
                  <small role="alert">{setupLogSaveError}</small>
                ) : folder && diagnosticLogReady ? (
                  <small>
                    Saved as {diagnosticLogFileName} in the Working folder.
                  </small>
                ) : null}
              </div>
            </div>
          </details>
          {stage !== "loading" && stage !== "complete" ? (
            <nav
              className="commission-navigation"
              aria-label="Setup navigation"
            >
              {stage !== "folder" ? (
                <button
                  disabled={
                    stage === "installing" || Boolean(navigationDestination)
                  }
                  onClick={() => void goBack()}
                  type="button"
                >
                  {stage === "wifi" ? "Repair again by USB" : "Back"}
                </button>
              ) : null}
              <button
                disabled={
                  stage === "installing" || Boolean(navigationDestination)
                }
                onClick={() => void exitSetup("../")}
                type="button"
              >
                Exit setup
              </button>
            </nav>
          ) : null}
        </section>
      </main>
    </div>
  );
}
