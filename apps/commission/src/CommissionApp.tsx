import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  localNetworkRequestInit,
  storeTargetPreference,
  type TargetPreference,
} from "@ucsb-xrp/target";

import { OfflineReadiness } from "../../shared/OfflineReadiness";
import {
  chooseCourseFolder,
  courseFolderPermission,
  handCourseFolderToIde,
  loadRememberedCourseFolder,
  rememberCourseFolder,
  requestCourseFolderPermission,
  type CourseDirectoryHandle,
} from "../../shared/course-folder";
import { waitForOfflineShell } from "../../shared/offline-shell";
import {
  FirmwareRequiredError,
  chooseFirmwareVolume,
  commissionDevice,
  feedCommissioningWatchdog,
  inspectDevice,
  installFirmware,
  loadCommissioningManifest,
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
  requestXrpPort,
  supportsWebSerial,
  touchUf2Bootloader,
  type MicroPythonSession,
  type SerialPortLike,
} from "./web-serial";
import {
  createSetupLogEntry,
  renderSetupLog,
  saveSetupLog,
  setupLogPath,
  verifySetupLogFolder,
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
  serviceVersion: string;
  courseRelease: string;
  robotName: string;
  address: string;
}

class XrpServiceProbeError extends Error {
  constructor(
    readonly kind: "http" | "version",
    message: string,
  ) {
    super(message);
    this.name = "XrpServiceProbeError";
  }
}

function errorDetail(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function wasCancelled(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError";
}

function manifestLocation(): URL {
  return new URL(
    `${import.meta.env.BASE_URL}course/commissioning/manifest.json`,
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

export function CommissionApp() {
  const manifestUrl = useMemo(manifestLocation, []);
  const [manifest, setManifest] = useState<CommissioningManifest | null>(null);
  const [stage, setStage] = useState<Stage>("loading");
  const [folder, setFolder] = useState<CourseDirectoryHandle | null>(null);
  const [detail, setDetail] = useState("Loading the current course release…");
  const [error, setError] = useState("");
  const [existingNetwork, setExistingNetwork] =
    useState<ExistingNetworkProfile | null>(null);
  const [networkMode, setNetworkMode] = useState<
    "keep" | "access_point" | "station"
  >("access_point");
  const [stationSsid, setStationSsid] = useState("");
  const [stationPassword, setStationPassword] = useState("");
  const [progress, setProgress] = useState<CommissioningProgress | null>(null);
  const [result, setResult] = useState<CommissioningResult | null>(null);
  const [checkingWifi, setCheckingWifi] = useState(false);
  const [wifiAttempts, setWifiAttempts] = useState(0);
  const [wifiIssue, setWifiIssue] = useState("");
  const [wifiNeedsRepair, setWifiNeedsRepair] = useState(false);
  const [setupLogEntries, setSetupLogEntries] = useState<SetupLogEntry[]>([]);
  const [setupLogSaveError, setSetupLogSaveError] = useState("");
  const [setupLogCopied, setSetupLogCopied] = useState(false);
  const sessionRef = useRef<MicroPythonSession | null>(null);
  const portRef = useRef<SerialPortLike | null>(null);
  const navigatingRef = useRef(false);
  const wifiCheckInFlightRef = useRef(false);
  const wifiAttemptRef = useRef(0);
  const lastWifiLoggedIssueRef = useRef("");
  const lastInstallProgressPhaseRef = useRef("");
  const watchdogFeedInFlightRef = useRef(false);
  const folderRef = useRef<CourseDirectoryHandle | null>(null);
  const folderNeedsPickerRef = useRef(false);
  const manifestReleaseRef = useRef("");
  const setupLogEntriesRef = useRef<SetupLogEntry[]>([]);
  const setupLogWriteRef = useRef<Promise<void>>(Promise.resolve());

  const recordSetup = useCallback(
    (step: string, message: string, level: SetupLogLevel = "info") => {
      const next = [
        ...setupLogEntriesRef.current,
        createSetupLogEntry(step, message, level),
      ].slice(-160);
      setupLogEntriesRef.current = next;
      setSetupLogEntries(next);
      const activeFolder = folderRef.current;
      if (!activeFolder) return;
      setupLogWriteRef.current = setupLogWriteRef.current
        .catch(() => undefined)
        .then(() =>
          saveSetupLog(activeFolder, next, manifestReleaseRef.current),
        )
        .then(() => setSetupLogSaveError(""))
        .catch((logError) => {
          setSetupLogSaveError(
            `The setup log could not be saved: ${errorDetail(logError)}`,
          );
        });
    },
    [],
  );

  useEffect(() => {
    let disposed = false;
    const initialize = async () => {
      try {
        const [loadedManifest, rememberedFolder] = await Promise.all([
          loadCommissioningManifest(manifestUrl),
          loadRememberedCourseFolder(),
        ]);
        if (disposed) return;
        manifestReleaseRef.current = loadedManifest.releaseId;
        setManifest(loadedManifest);
        recordSetup(
          "Start",
          `Loaded course release ${loadedManifest.releaseId}.`,
        );
        if (rememberedFolder) {
          const permission = await courseFolderPermission(rememberedFolder);
          if (!disposed && permission === "granted") {
            try {
              recordSetup(
                "Folder",
                `Checking write access to ${rememberedFolder.name}.`,
              );
              await verifySetupLogFolder(
                rememberedFolder,
                setupLogEntriesRef.current,
                loadedManifest.releaseId,
              );
              if (disposed) return;
              folderRef.current = rememberedFolder;
              setFolder(rememberedFolder);
              recordSetup(
                "Folder",
                `Write and read verified in ${rememberedFolder.name}.`,
                "success",
              );
              setDetail(
                `${rememberedFolder.name} is ready for project files and automatic copies.`,
              );
              setStage("usb");
              return;
            } catch (folderError) {
              folderNeedsPickerRef.current = true;
              recordSetup(
                "Folder",
                `Remembered folder failed its write check: ${errorDetail(folderError)}`,
                "error",
              );
              setError(
                "The remembered project folder could not be written and read. Choose the folder again or select another folder.",
              );
            }
          }
        }
        if (!disposed) {
          setStage("folder");
          setDetail(
            "Choose the local project folder the IDE will use after setup.",
          );
        }
      } catch (initializationError) {
        if (!disposed) {
          setStage("folder");
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
      void sessionRef.current?.close();
    };
  }, [manifestUrl, recordSetup]);

  const chooseFolder = useCallback(async () => {
    setError("");
    try {
      let selected = folderNeedsPickerRef.current
        ? null
        : await loadRememberedCourseFolder();
      if (selected) {
        const permission = await requestCourseFolderPermission(selected);
        if (permission !== "granted") selected = null;
      }
      selected ??= await chooseCourseFolder();
      recordSetup("Folder", `Checking write access to ${selected.name}.`);
      await verifySetupLogFolder(
        selected,
        setupLogEntriesRef.current,
        manifestReleaseRef.current,
      );
      await rememberCourseFolder(selected);
      handCourseFolderToIde();
      folderNeedsPickerRef.current = false;
      folderRef.current = selected;
      setFolder(selected);
      recordSetup(
        "Folder",
        `Write and read verified in ${selected.name}; setup log created.`,
        "success",
      );
      setDetail(
        `${selected.name} is ready. The web tools are also saving their offline copy in Chrome.`,
      );
      setStage("usb");
    } catch (folderError) {
      if (!wasCancelled(folderError)) {
        folderNeedsPickerRef.current = true;
        const message = errorDetail(folderError);
        setError(`The project folder write check failed. ${message}`);
        recordSetup("Folder", `Write check failed: ${message}`, "error");
      }
    }
  }, [recordSetup]);

  const inspectPort = useCallback(
    async (port: SerialPortLike) => {
      if (!manifest) return;
      setError("");
      setDetail("Checking the XRP controller and course runtime…");
      recordSetup("USB", "Selected an XRP and opened its serial connection.");
      portRef.current = port;
      let session: MicroPythonSession;
      try {
        session = await openRawRepl(port);
      } catch (replError) {
        sessionRef.current = null;
        setStage("firmware");
        setDetail(
          "The XRP needs the course MicroPython firmware before its files can be installed.",
        );
        recordSetup(
          "Firmware",
          `The expected MicroPython REPL was not available: ${errorDetail(replError)}`,
          "warning",
        );
        return;
      }
      sessionRef.current = session;
      try {
        await inspectDevice(session, manifest);
        const profile = await readExistingNetworkProfile(session);
        await feedCommissioningWatchdog(session);
        setExistingNetwork(profile);
        if (profile.present) {
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
          setDetail(
            "The controller is compatible. A device-specific XRP hotspot is the default.",
          );
          recordSetup(
            "USB",
            "Verified the RP2350 controller and MicroPython runtime; no course network profile was installed.",
            "success",
          );
        }
        setStage("network");
      } catch (inspectionError) {
        if (inspectionError instanceof FirmwareRequiredError) {
          setStage("firmware");
          setDetail(inspectionError.message);
          recordSetup("Firmware", inspectionError.message, "warning");
        } else {
          const message = errorDetail(inspectionError);
          setError(message);
          recordSetup("USB", `Inspection failed: ${message}`, "error");
          await session.close();
          sessionRef.current = null;
          setStage("usb");
        }
      }
    },
    [manifest, recordSetup],
  );

  const selectRobot = useCallback(async () => {
    if (!manifest) return;
    setError("");
    recordSetup("USB", "Opening the browser device picker.");
    try {
      await inspectPort(await requestXrpPort(manifest.controller));
    } catch (serialError) {
      if (!wasCancelled(serialError)) {
        const message = errorDetail(serialError);
        setError(message);
        recordSetup("USB", `Device selection failed: ${message}`, "error");
      }
    }
  }, [inspectPort, manifest, recordSetup]);

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
        setStage("usb");
        await sessionRef.current?.close();
        sessionRef.current = null;
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
        "Firmware write and readback completed.",
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
    const network: NetworkSelection =
      networkMode === "station"
        ? {
            mode: "station",
            ssid: stationSsid,
            password: stationPassword,
          }
        : networkMode === "keep"
          ? { mode: "keep" }
          : { mode: "access_point" };
    setError("");
    setProgress(null);
    lastInstallProgressPhaseRef.current = "";
    setStage("installing");
    recordSetup(
      "Install",
      network.mode === "station"
        ? `Starting repair and configuring existing Wi-Fi ${network.ssid}.`
        : network.mode === "keep"
          ? "Starting repair and retaining the installed network profile."
          : "Starting repair and configuring the robot hotspot.",
    );
    try {
      await waitForOfflineShell();
      const completed = await commissionDevice({
        session: sessionRef.current,
        manifest,
        manifestUrl,
        network,
        onProgress: (next) => {
          setProgress(next);
          setDetail(next.detail);
          if (lastInstallProgressPhaseRef.current !== next.phase) {
            lastInstallProgressPhaseRef.current = next.phase;
            recordSetup("Install", next.detail);
          }
        },
      });
      sessionRef.current = null;
      setStationPassword("");
      setResult(completed);
      const preference: TargetPreference = {
        kind: "physical",
        physicalConnection:
          completed.network.mode === "station" ? "station" : "access_point",
        physicalEndpoint: `http://${completed.network.address}`,
      };
      storeTargetPreference(preference);
      handCourseFolderToIde();
      wifiAttemptRef.current = 0;
      lastWifiLoggedIssueRef.current = "";
      setWifiAttempts(0);
      setWifiIssue("");
      setWifiNeedsRepair(false);
      setDetail(
        completed.network.mode === "station"
          ? `XRP joined ${completed.network.ssid}. Verifying its course service…`
          : `Join ${completed.network.ssid} from the computer's Wi-Fi menu. This page will remain available offline.`,
      );
      recordSetup(
        "Install",
        `Verified ${completed.installedFiles} changed and ${completed.unchangedFiles} unchanged files; XRP restarted on ${completed.network.ssid} at ${completed.network.address}.`,
        "success",
      );
      setStage("wifi");
    } catch (commissioningError) {
      const message = errorDetail(commissioningError);
      setError(message);
      recordSetup("Install", `Repair failed: ${message}`, "error");
      setStage("network");
    }
  }, [
    manifest,
    manifestUrl,
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
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 3_000);
    try {
      const response = await fetch(
        `${endpoint}/api/v1/info`,
        localNetworkRequestInit(endpoint, {
          cache: "no-store",
          method: "GET",
          signal: controller.signal,
        }),
      );
      if (!response.ok) {
        throw new XrpServiceProbeError(
          "http",
          `The XRP service replied with HTTP ${response.status}.`,
        );
      }
      const info = (await response.json()) as PhysicalInfo;
      if (
        info.protocol !== 1 ||
        info.serviceVersion !== manifest.serviceVersion ||
        info.courseRelease !== manifest.releaseId
      ) {
        throw new XrpServiceProbeError(
          "version",
          "The XRP replied, but its course service version does not match this web release.",
        );
      }
      navigatingRef.current = true;
      setWifiIssue("");
      setWifiNeedsRepair(false);
      setDetail(`${info.robotName} is commissioned and ready.`);
      recordSetup(
        "XRP connection",
        `Verified ${info.robotName} at ${result.network.address} on attempt ${attempt}.`,
        "success",
      );
      setStage("complete");
      window.setTimeout(() => {
        window.location.assign(new URL("../ide/", window.location.href));
      }, 900);
    } catch (probeError) {
      const serviceFailure = probeError instanceof XrpServiceProbeError;
      const issue = wasCancelled(probeError)
        ? "No response within three seconds."
        : serviceFailure
          ? probeError.message
          : `Chrome could not reach the XRP (${errorDetail(probeError)}).`;
      setWifiIssue(issue);
      setWifiNeedsRepair(serviceFailure);
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
      clearTimeout(timeout);
      wifiCheckInFlightRef.current = false;
      setCheckingWifi(false);
    }
  }, [manifest, recordSetup, result]);

  useEffect(() => {
    if (stage !== "wifi") return;
    void verifyWifi();
    const timer = window.setInterval(() => void verifyWifi(), 2_000);
    return () => clearInterval(timer);
  }, [stage, verifyWifi]);

  const returnToUsb = useCallback(() => {
    setResult(null);
    setWifiAttempts(0);
    setWifiIssue("");
    setWifiNeedsRepair(false);
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

  return (
    <div className="commission-app">
      <header className="commission-header">
        <a className="commission-brand" href="../" aria-label="UCSBXRP home">
          <span>UCSB</span>XRP
        </a>
        <a href="../ide/">IDE ↗</a>
      </header>
      <main className="commission-layout">
        <aside aria-label="Setup progress" className="commission-steps">
          {[
            [1, "Course folder"],
            [2, "XRP over USB"],
            [3, "Install and verify"],
            [4, "Connect to XRP"],
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
            <OfflineReadiness />
            {folder ? <small>Projects: {folder.name}</small> : null}
          </div>
        </aside>

        <section className="commission-panel" aria-live="polite">
          <p className="commission-kicker">ROBOT SETUP &amp; REPAIR</p>
          {stage === "loading" ? <h1>Preparing setup</h1> : null}
          {stage === "folder" ? <h1>Choose a project folder</h1> : null}
          {stage === "usb" ? <h1>Connect the XRP by USB-C</h1> : null}
          {stage === "network" ? <h1>Choose how the XRP connects</h1> : null}
          {stage === "installing" ? <h1>Updating the XRP</h1> : null}
          {stage === "firmware" || stage === "firmware-volume" ? (
            <h1>Install course firmware</h1>
          ) : null}
          {stage === "wifi" ? <h1>Connect to the XRP</h1> : null}
          {stage === "complete" ? <h1>XRP ready</h1> : null}
          <p className="commission-detail">{detail}</p>

          {error ? (
            <p className="commission-error" role="alert">
              {error}
            </p>
          ) : null}

          {stage === "folder" ? (
            <div className="commission-actions">
              <button className="primary-button" onClick={chooseFolder}>
                Choose project folder
              </button>
              <p>
                Source files and four automatic copies go here. Chrome keeps the
                web application itself available offline.
              </p>
            </div>
          ) : null}

          {stage === "usb" ? (
            <div className="commission-actions">
              <button
                className="primary-button"
                disabled={!manifest || !supportsWebSerial()}
                onClick={selectRobot}
              >
                Select connected XRP
              </button>
              <p>
                {supportsWebSerial()
                  ? "Chrome shows one device picker. Setup then checks and repairs the controller automatically."
                  : "Open this page in current desktop Chrome or Edge to use USB setup."}
              </p>
            </div>
          ) : null}

          {stage === "network" ? (
            <div className="network-options">
              {existingNetwork?.present ? (
                <label>
                  <input
                    checked={networkMode === "keep"}
                    name="network-mode"
                    onChange={() => setNetworkMode("keep")}
                    type="radio"
                  />
                  <span>
                    <strong>Keep current network</strong>
                    <small>
                      {existingNetwork.mode === "station"
                        ? (existingNetwork.stationSsid ?? "Existing Wi-Fi")
                        : (existingNetwork.accessPointSsid ?? "Robot hotspot")}
                    </small>
                  </span>
                </label>
              ) : null}
              <label>
                <input
                  checked={networkMode === "access_point"}
                  name="network-mode"
                  onChange={() => setNetworkMode("access_point")}
                  type="radio"
                />
                <span>
                  <strong>Robot hotspot</strong>
                  <small>
                    Recommended for student use; no router required.
                  </small>
                </span>
              </label>
              <label>
                <input
                  checked={networkMode === "station"}
                  name="network-mode"
                  onChange={() => setNetworkMode("station")}
                  type="radio"
                />
                <span>
                  <strong>Existing Wi-Fi</strong>
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
                      autoComplete="current-password"
                      onChange={(event) =>
                        setStationPassword(event.target.value)
                      }
                      type="password"
                      value={stationPassword}
                    />
                  </label>
                  <small>
                    The password is sent over USB and is not saved by the web
                    app.
                  </small>
                </div>
              ) : null}
              <button className="primary-button" onClick={beginCommissioning}>
                Install or repair XRP
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
              </small>
            </div>
          ) : null}

          {stage === "firmware" ? (
            <div className="commission-actions">
              <button className="primary-button" onClick={enterFirmwareMode}>
                Prepare firmware update
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
                    : wifiAttempts
                      ? `Waiting for XRP · attempt ${wifiAttempts}`
                      : "Waiting for XRP"}
                </strong>
                <span>
                  {wifiIssue ||
                    "Checking the robot service at the address above."}
                </span>
              </div>
              <button disabled={checkingWifi} onClick={verifyWifi}>
                {checkingWifi ? "Checking…" : "Check connection"}
              </button>
              <p className="wifi-instruction">
                {result.network.mode === "access_point"
                  ? `Join ${result.network.ssid} in the computer's Wi-Fi menu, then return to this page.`
                  : `Keep this computer on ${result.network.ssid}.`}{" "}
                If Chrome asks to find and connect to devices on the local
                network, choose <strong>Allow</strong>. The IDE opens when the
                robot replies.
              </p>
              <details className="connection-help">
                <summary>Connection help</summary>
                <ul>
                  <li>
                    RESET and BOOT are not used here; USB installation has
                    already finished.
                  </li>
                  <li>
                    In Chrome's site settings for this page, allow local network
                    access.
                  </li>
                  <li>
                    On macOS, Chrome must also be enabled under System Settings
                    → Privacy &amp; Security → Local Network.
                  </li>
                </ul>
                <button type="button" onClick={returnToUsb}>
                  Return to USB setup
                </button>
              </details>
            </div>
          ) : null}

          {stage === "complete" ? (
            <div className="commission-success">
              <span aria-hidden="true">✓</span>
              <p>Opening the IDE with Physical XRP selected…</p>
            </div>
          ) : null}

          <details className="setup-log" aria-live="off">
            <summary>
              <span>Setup log</span>
              <small>
                {setupLogEntries.length}{" "}
                {setupLogEntries.length === 1 ? "event" : "events"} ·{" "}
                {folder
                  ? `saved to ${setupLogPath}`
                  : "saved after folder selection"}
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
                ) : folder ? (
                  <small>Write and read access verified.</small>
                ) : null}
              </div>
            </div>
          </details>
        </section>
      </main>
    </div>
  );
}
