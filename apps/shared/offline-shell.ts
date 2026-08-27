import {
  OfflineReleaseCoordinator,
  type OfflineShellReloadRequest,
  type PrepareForOfflineShellReload,
} from "./offline-release-coordinator";

export type OfflineShellState =
  "development" | "installing" | "ready" | "unsupported" | "error";

export interface OfflineShellStatus {
  state: OfflineShellState;
  version?: string;
  message?: string;
  updateVersion?: string;
}

interface OfflineShellRegistrationOptions {
  /** Read-only pages may adopt a completed course update immediately. */
  reloadWithoutAppState?: boolean;
}

interface OfflineManifest {
  version: string;
  cache_name: string;
  assets: Array<{ url: string }>;
}

export const OFFLINE_SHELL_EVENT = "ucsb-xrp:offline-shell-state";
export const OFFLINE_SHELL_RELEASE_EVENT = "ucsb-xrp:release-ready";
const offlineShellVersionKey = "ucsb-xrp-offline-shell-version-v1";
const offlineShellReloadKey = "ucsb-xrp-offline-shell-reload-v1";
const isolationReloadKey = "ucsb-xrp-isolation-reload-v1";
const courseShellCachePrefix = "ucsb-xrp-course-shell-";
let offlinePreparation: Promise<void> = Promise.resolve();
let loadedOfflineShellVersion: string | null = null;
let releaseChannel: BroadcastChannel | null = null;

interface OfflineShellReleaseSignal {
  type: "release-ready";
  version: string;
}

interface NavigationReloadResult {
  committed: Promise<unknown>;
}

interface NavigationApi {
  reload(): NavigationReloadResult;
}

function storeReloadMarkers(version: string) {
  window.sessionStorage.setItem(offlineShellReloadKey, version);
  window.sessionStorage.setItem(isolationReloadKey, version);
}

function removeMatchingReloadMarkers(version: string) {
  if (window.sessionStorage.getItem(offlineShellReloadKey) === version) {
    window.sessionStorage.removeItem(offlineShellReloadKey);
  }
  if (window.sessionStorage.getItem(isolationReloadKey) === version) {
    window.sessionStorage.removeItem(isolationReloadKey);
  }
}

const reloadCoordinator = new OfflineReleaseCoordinator({
  reload: (request) => {
    const navigationApi = (window as unknown as { navigation?: NavigationApi })
      .navigation;
    if (navigationApi) {
      storeReloadMarkers(request.version);
      let navigationResult: NavigationReloadResult;
      try {
        navigationResult = navigationApi.reload();
      } catch {
        removeMatchingReloadMarkers(request.version);
        reloadCoordinator.resumeAfterCancelledReload(request);
        return;
      }
      void navigationResult.committed.catch(() => {
        removeMatchingReloadMarkers(request.version);
        reloadCoordinator.resumeAfterCancelledReload(request);
      });
      return;
    }

    const confirmNavigation = () => {
      storeReloadMarkers(request.version);
      reloadCoordinator.confirmReload(request);
      publishPendingRelease(null);
    };
    window.addEventListener("pagehide", confirmNavigation, { once: true });
    window.location.reload();
    window.setTimeout(() => {
      window.removeEventListener("pagehide", confirmNavigation);
      reloadCoordinator.resumeAfterCancelledReload(request);
    }, 1_000);
  },
  reportError: (error) => {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`Course update is waiting for the application: ${message}`);
  },
});

export function initialOfflineShellState(
  production: boolean,
  supported: boolean,
): OfflineShellState {
  if (!production) {
    return "development";
  }
  return supported ? "installing" : "unsupported";
}

export function offlineShellUpdateNeedsReload(
  previousVersion: string | null,
  currentVersion: string,
  lastReloadedVersion: string | null,
): boolean {
  return (
    previousVersion !== null &&
    previousVersion !== currentVersion &&
    lastReloadedVersion !== currentVersion
  );
}

export function offlineShellIsolationNeedsReload(
  isolated: boolean,
  currentVersion: string,
  lastReloadedVersion: string | null,
): boolean {
  return !isolated && lastReloadedVersion !== currentVersion;
}

export function virtualRunNeedsPreparation(
  production: boolean,
  isolated: boolean,
): boolean {
  return production && !isolated;
}

/**
 * Runs before this tab adopts a newly saved course release. Return false while
 * a program is running; resolve true only after any pending project write has
 * finished. The release remains pending until the application retries it.
 */
export function registerOfflineShellBeforeReload(
  handler: PrepareForOfflineShellReload,
): () => void {
  return reloadCoordinator.registerBeforeReload(handler);
}

/** Retry a deferred update after the program stops or a project save finishes. */
export function retryPendingOfflineShellReload() {
  reloadCoordinator.retry();
}

function requestOfflineShellReload(request: OfflineShellReloadRequest) {
  publishPendingRelease(request.version);
  reloadCoordinator.request(request);
}

function isReleaseSignal(value: unknown): value is OfflineShellReleaseSignal {
  return (
    typeof value === "object" &&
    value !== null &&
    (value as Partial<OfflineShellReleaseSignal>).type === "release-ready" &&
    typeof (value as Partial<OfflineShellReleaseSignal>).version === "string" &&
    (value as Partial<OfflineShellReleaseSignal>).version !== ""
  );
}

function dispatchReleaseReady(version: string, source: "local" | "peer") {
  window.dispatchEvent(
    new CustomEvent(OFFLINE_SHELL_RELEASE_EVENT, {
      detail: { version, source },
    }),
  );
}

function peerReleaseNeedsReload(version: string): boolean {
  return offlineShellUpdateNeedsReload(
    loadedOfflineShellVersion,
    version,
    window.sessionStorage.getItem(offlineShellReloadKey),
  );
}

function receiveReleaseReady(version: string) {
  dispatchReleaseReady(version, "peer");
  if (peerReleaseNeedsReload(version)) {
    requestOfflineShellReload({ version, reason: "release-update" });
  }
}

function startReleaseCoordination(basePath: string) {
  loadedOfflineShellVersion = window.localStorage.getItem(
    offlineShellVersionKey,
  );
  if (typeof BroadcastChannel !== "undefined") {
    releaseChannel?.close();
    releaseChannel = new BroadcastChannel(`ucsb-xrp-release-ready:${basePath}`);
    releaseChannel.addEventListener(
      "message",
      (event: MessageEvent<unknown>) => {
        if (isReleaseSignal(event.data)) {
          receiveReleaseReady(event.data.version);
        }
      },
    );
  }

  // A suspended tab can miss a channel message. The version already stored by
  // the installing tab provides the same deterministic check when it returns.
  const reconcileKnownRelease = () => {
    const version = window.localStorage.getItem(offlineShellVersionKey);
    if (version !== null && peerReleaseNeedsReload(version)) {
      requestOfflineShellReload({ version, reason: "release-update" });
    }
  };
  window.addEventListener("pageshow", reconcileKnownRelease);
  window.addEventListener("focus", reconcileKnownRelease);
}

function announceReleaseReady(version: string) {
  const signal: OfflineShellReleaseSignal = {
    type: "release-ready",
    version,
  };
  releaseChannel?.postMessage(signal);
  dispatchReleaseReady(version, "local");
}

function publishState(
  state: OfflineShellState,
  options: { version?: string; message?: string } = {},
) {
  document.documentElement.dataset.offlineShellState = state;
  if (options.version === undefined) {
    delete document.documentElement.dataset.offlineShellVersion;
  } else {
    document.documentElement.dataset.offlineShellVersion = options.version;
  }
  if (options.message === undefined) {
    delete document.documentElement.dataset.offlineShellMessage;
  } else {
    document.documentElement.dataset.offlineShellMessage = options.message;
  }
  window.dispatchEvent(
    new CustomEvent(OFFLINE_SHELL_EVENT, {
      detail: {
        state,
        ...options,
        updateVersion:
          document.documentElement.dataset.offlineShellUpdateVersion,
      },
    }),
  );
}

function publishPendingRelease(version: string | null) {
  if (version === null) {
    delete document.documentElement.dataset.offlineShellUpdateVersion;
  } else {
    document.documentElement.dataset.offlineShellUpdateVersion = version;
  }
  const status = readOfflineShellStatus();
  window.dispatchEvent(
    new CustomEvent(OFFLINE_SHELL_EVENT, { detail: status }),
  );
}

export function readOfflineShellStatus(): OfflineShellStatus {
  const state = document.documentElement.dataset.offlineShellState;
  const knownStates: OfflineShellState[] = [
    "development",
    "installing",
    "ready",
    "unsupported",
    "error",
  ];
  return {
    state: knownStates.includes(state as OfflineShellState)
      ? (state as OfflineShellState)
      : initialOfflineShellState(
          import.meta.env.PROD,
          "serviceWorker" in navigator &&
            "caches" in window &&
            window.isSecureContext,
        ),
    version: document.documentElement.dataset.offlineShellVersion,
    message: document.documentElement.dataset.offlineShellMessage,
    updateVersion: document.documentElement.dataset.offlineShellUpdateVersion,
  };
}

export function waitForOfflineShell(
  timeoutMs = 60_000,
): Promise<OfflineShellStatus> {
  const current = readOfflineShellStatus();
  if (current.state === "development") {
    return offlinePreparation.then(readOfflineShellStatus);
  }
  if (current.state === "ready") {
    return Promise.resolve(current);
  }
  if (current.state === "error" || current.state === "unsupported") {
    return Promise.reject(
      new Error(
        current.message ??
          "Wait for Course apps saved in Chrome before changing Wi-Fi.",
      ),
    );
  }
  return new Promise((resolve, reject) => {
    const finish = () => {
      window.removeEventListener(OFFLINE_SHELL_EVENT, onState);
      clearTimeout(timeout);
    };
    const onState = (event: Event) => {
      const status = (event as CustomEvent<OfflineShellStatus>).detail;
      if (status.state === "ready") {
        finish();
        resolve(status);
      } else if (status.state === "error" || status.state === "unsupported") {
        finish();
        reject(
          new Error(
            status.message ??
              "Wait for Course apps saved in Chrome before changing Wi-Fi.",
          ),
        );
      }
    };
    const timeout = window.setTimeout(() => {
      finish();
      reject(new Error("The course apps did not finish saving in Chrome."));
    }, timeoutMs);
    window.addEventListener(OFFLINE_SHELL_EVENT, onState);
  });
}

async function removeProductionShellFromDevelopment(basePath: string) {
  if (!("serviceWorker" in navigator) || !("caches" in window)) return;

  const scope = new URL(basePath, window.location.origin).toString();
  const registrations = await navigator.serviceWorker.getRegistrations();
  const matching = registrations.filter(
    (registration) => registration.scope === scope,
  );
  const controlledByOldShell =
    matching.length > 0 && Boolean(navigator.serviceWorker.controller);
  await Promise.all(matching.map((registration) => registration.unregister()));
  const cacheNames = await caches.keys();
  await Promise.all(
    cacheNames
      .filter((name) => name.startsWith(courseShellCachePrefix))
      .map((name) => caches.delete(name)),
  );

  // Unregistering does not detach a worker from a document it already
  // controls. Reload once so development cannot read a stale production
  // commissioning bundle from that worker.
  if (controlledByOldShell) {
    window.location.reload();
    await new Promise<void>(() => undefined);
  }
}

async function waitForWorker(worker: ServiceWorker) {
  if (worker.state === "activated") {
    return;
  }
  if (worker.state === "redundant") {
    throw new Error("The new offline worker became redundant");
  }

  await new Promise<void>((resolve, reject) => {
    const handleStateChange = () => {
      if (worker.state === "activated") {
        worker.removeEventListener("statechange", handleStateChange);
        resolve();
      } else if (worker.state === "redundant") {
        worker.removeEventListener("statechange", handleStateChange);
        reject(new Error("The new offline worker became redundant"));
      }
    };
    worker.addEventListener("statechange", handleStateChange);
  });
}

async function verifyPrecache(manifestUrl: string) {
  const response = await fetch(manifestUrl, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Offline manifest request failed (${response.status})`);
  }
  const manifest = (await response.json()) as OfflineManifest;
  if (
    typeof manifest.version !== "string" ||
    typeof manifest.cache_name !== "string" ||
    !Array.isArray(manifest.assets)
  ) {
    throw new Error("Offline manifest is malformed");
  }

  if (!(await caches.has(manifest.cache_name))) {
    throw new Error("Offline cache was not created");
  }
  const cache = await caches.open(manifest.cache_name);
  const cachedUrls = new Set(
    (await cache.keys()).map((request) => request.url),
  );
  const requiredUrls = [
    manifestUrl,
    ...manifest.assets.map((asset) =>
      new URL(asset.url, window.location.origin).toString(),
    ),
  ];
  const missingUrl = requiredUrls.find((url) => !cachedUrls.has(url));
  if (missingUrl !== undefined) {
    throw new Error(`Offline cache is incomplete: ${missingUrl}`);
  }

  return manifest;
}

async function installOfflineShell(basePath: string) {
  const scopeUrl = new URL(basePath, window.location.origin).toString();
  const workerUrl = new URL(
    `${basePath}service-worker.js`,
    window.location.origin,
  );
  const manifestUrl = new URL(
    `${basePath}offline-manifest.json`,
    window.location.origin,
  ).toString();
  let registration = await navigator.serviceWorker.getRegistration(scopeUrl);
  const hasActiveWorker = () =>
    registration?.active !== null && registration?.active !== undefined;

  if (navigator.onLine || !hasActiveWorker()) {
    try {
      registration = await navigator.serviceWorker.register(workerUrl, {
        scope: basePath,
        updateViaCache: "none",
      });
      // register() may reuse a long-lived registration without immediately
      // checking its script. Ask explicitly while online so a classroom tab
      // left open between sessions receives the current build promptly.
      if (navigator.onLine && hasActiveWorker()) {
        registration = await registration.update();
      }
    } catch (error) {
      if (!hasActiveWorker()) {
        throw error;
      }
    }
  }
  if (registration === undefined) {
    throw new Error("Offline worker registration is unavailable");
  }
  const changingWorker = registration.installing ?? registration.waiting;
  if (changingWorker !== null) {
    await waitForWorker(changingWorker);
  }
  await navigator.serviceWorker.ready;
  const manifest = await verifyPrecache(manifestUrl);
  window.localStorage.setItem(offlineShellVersionKey, manifest.version);
  publishState("ready", { version: manifest.version });
  announceReleaseReady(manifest.version);

  // A newly activated worker cannot replace JavaScript already executing in
  // this tab. Coordinate one safe reload across every open course application.
  const updateNeedsReload = offlineShellUpdateNeedsReload(
    loadedOfflineShellVersion,
    manifest.version,
    window.sessionStorage.getItem(offlineShellReloadKey),
  );
  const isolationNeedsReload = offlineShellIsolationNeedsReload(
    globalThis.crossOriginIsolated,
    manifest.version,
    window.sessionStorage.getItem(isolationReloadKey),
  );
  if (updateNeedsReload || isolationNeedsReload) {
    requestOfflineShellReload({
      version: manifest.version,
      reason: updateNeedsReload ? "release-update" : "isolation",
    });
  } else {
    loadedOfflineShellVersion = manifest.version;
  }
}

export function registerOfflineShell(
  options: OfflineShellRegistrationOptions = {},
) {
  if (options.reloadWithoutAppState) {
    registerOfflineShellBeforeReload(() => true);
  }
  const supported =
    "serviceWorker" in navigator &&
    "caches" in window &&
    window.isSecureContext;
  const initialState = initialOfflineShellState(
    import.meta.env.PROD,
    supported,
  );
  publishState(initialState);

  if (initialState !== "unsupported") {
    startReleaseCoordination(import.meta.env.BASE_URL);
  }

  if (initialState === "development") {
    offlinePreparation = removeProductionShellFromDevelopment(
      import.meta.env.BASE_URL,
    ).catch((error: unknown) => {
      const message = error instanceof Error ? error.message : String(error);
      console.warn(`Old course app storage could not be removed: ${message}`);
    });
    return;
  }

  if (initialState !== "installing") {
    return;
  }

  const start = () => {
    void installOfflineShell(import.meta.env.BASE_URL).catch(
      (error: unknown) => {
        const message = error instanceof Error ? error.message : String(error);
        publishState("error", { message });
        console.warn(`Offline shell is unavailable: ${message}`);
      },
    );
  };

  if (document.readyState === "complete") {
    start();
  } else {
    window.addEventListener("load", start, { once: true });
  }
}
