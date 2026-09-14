import {
  OfflineReleaseCoordinator,
  type OfflineShellReloadRequest,
  type PrepareForOfflineShellReload,
} from "./offline-release-coordinator";
import {
  findCachedShell,
  isShellManifest,
  verifyShellCache,
  withDeadline,
  type CachedShellManifest,
} from "./offline-cache";

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

export const OFFLINE_SHELL_EVENT = "ucsb-xrp:offline-shell-state";
export const OFFLINE_SHELL_RELEASE_EVENT = "ucsb-xrp:release-ready";
const offlineShellVersionKey = "ucsb-xrp-offline-shell-version-v1";
const offlineShellReloadKey = "ucsb-xrp-offline-shell-reload-v1";
const isolationReloadKey = "ucsb-xrp-isolation-reload-v1";
const courseShellCachePrefix = "ucsb-xrp-course-shell-";
let offlinePreparation: Promise<void> = Promise.resolve();
let loadedOfflineShellVersion: string | null = null;
let releaseChannel: BroadcastChannel | null = null;
let documentCacheName: string | null = null;
let applicationReloadGuard: PrepareForOfflineShellReload | null = null;

/** The workspace remains mounted until every embedded app has saved and stopped. */
export async function prepareEmbeddedApplicationsForReload(
  request: OfflineShellReloadRequest,
): Promise<boolean> {
  const frames = Array.from(document.querySelectorAll("iframe"));
  const results = await Promise.all(
    frames.map(
      (frame) =>
        new Promise<boolean>((resolve) => {
          const child = frame.contentWindow;
          if (
            !child ||
            new URL(frame.src, window.location.href).origin !==
              window.location.origin
          ) {
            resolve(false);
            return;
          }
          const id = crypto.randomUUID();
          const finish = (ready: boolean) => {
            clearTimeout(timer);
            window.removeEventListener("message", receive);
            resolve(ready);
          };
          const receive = (event: MessageEvent) => {
            if (
              event.source === child &&
              event.origin === window.location.origin &&
              event.data?.type === "ucsb-xrp-frame-reload-result" &&
              event.data.id === id
            )
              finish(event.data.ready === true);
          };
          const timer = setTimeout(() => finish(false), 2_000);
          window.addEventListener("message", receive);
          child.postMessage(
            { type: "ucsb-xrp-frame-reload-query", id, request },
            window.location.origin,
          );
        }),
    ),
  );
  return results.every(Boolean);
}

function notifyParentReloadState() {
  if (window.parent !== window)
    window.parent.postMessage(
      { type: "ucsb-xrp-frame-reload-retry" },
      window.location.origin,
    );
}

function storedSetting(kind: "localStorage" | "sessionStorage", key: string) {
  try {
    return window[kind].getItem(key);
  } catch {
    return null;
  }
}

function storeSetting(
  kind: "localStorage" | "sessionStorage",
  key: string,
  value: string | null,
): boolean {
  try {
    if (value === null) window[kind].removeItem(key);
    else window[kind].setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

function identifyDocumentCache() {
  if (!documentCacheName) return;
  navigator.serviceWorker.controller?.postMessage({
    type: "ucsb-xrp-shell-client",
    cacheName: documentCacheName,
  });
}

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
  storeSetting("sessionStorage", offlineShellReloadKey, version);
  storeSetting("sessionStorage", isolationReloadKey, version);
}

function removeMatchingReloadMarkers(version: string) {
  if (storedSetting("sessionStorage", offlineShellReloadKey) === version) {
    storeSetting("sessionStorage", offlineShellReloadKey, null);
  }
  if (storedSetting("sessionStorage", isolationReloadKey) === version) {
    storeSetting("sessionStorage", isolationReloadKey, null);
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

export function isLocalPreviewHostname(hostname: string): boolean {
  const value = hostname.trim().toLocaleLowerCase();
  return (
    value === "127.0.0.1" ||
    value === "localhost" ||
    value === "::1" ||
    value === "[::1]" ||
    value.endsWith(".localhost")
  );
}

function installsOfflineShellOnThisOrigin(): boolean {
  // Automated production previews exercise the deployed offline path. An
  // ordinary local preview stays cache-free so source changes appear at once.
  return (
    import.meta.env.PROD &&
    (!isLocalPreviewHostname(window.location.hostname) || navigator.webdriver)
  );
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

export function offlineShellAssetsNeedReload(
  documentAssetPaths: readonly string[],
  manifestAssetPaths: readonly string[],
): boolean {
  const currentAssets = new Set(manifestAssetPaths);
  return documentAssetPaths.some((asset) => !currentAssets.has(asset));
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
  applicationReloadGuard = handler;
  const unregister = reloadCoordinator.registerBeforeReload(handler);
  notifyParentReloadState();
  return () => {
    unregister();
    if (applicationReloadGuard === handler) applicationReloadGuard = null;
  };
}

/** Retry a deferred update after the program stops or a project save finishes. */
export function retryPendingOfflineShellReload() {
  reloadCoordinator.retry();
  notifyParentReloadState();
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
    storedSetting("sessionStorage", offlineShellReloadKey),
  );
}

function receiveReleaseReady(version: string) {
  dispatchReleaseReady(version, "peer");
  if (peerReleaseNeedsReload(version)) {
    requestOfflineShellReload({ version, reason: "release-update" });
  }
}

function startReleaseCoordination(basePath: string) {
  window.addEventListener("message", (event: MessageEvent) => {
    if (event.origin !== window.location.origin) return;
    if (
      event.data?.type === "ucsb-xrp-frame-reload-query" &&
      event.source === window.parent &&
      window.parent !== window &&
      typeof event.data.id === "string"
    ) {
      const { id, request } = event.data;
      if (
        !request ||
        typeof request.version !== "string" ||
        !["release-update", "isolation"].includes(request.reason)
      )
        return;
      const guard = applicationReloadGuard;
      void Promise.resolve()
        .then(() => guard?.(request) ?? false)
        .catch(() => false)
        .then((ready) => {
          window.parent.postMessage(
            {
              type: "ucsb-xrp-frame-reload-result",
              id,
              ready: ready === true && guard === applicationReloadGuard,
            },
            window.location.origin,
          );
        });
    } else if (
      event.data?.type === "ucsb-xrp-frame-reload-retry" &&
      Array.from(document.querySelectorAll("iframe")).some(
        (frame) => frame.contentWindow === event.source,
      )
    ) {
      reloadCoordinator.retry();
    }
  });
  loadedOfflineShellVersion = storedSetting(
    "localStorage",
    offlineShellVersionKey,
  );
  if (typeof BroadcastChannel !== "undefined") {
    releaseChannel?.close();
    try {
      releaseChannel = new BroadcastChannel(
        `ucsb-xrp-release-ready:${basePath}`,
      );
    } catch {
      releaseChannel = null;
    }
    releaseChannel?.addEventListener(
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
    const version = storedSetting("localStorage", offlineShellVersionKey);
    if (version !== null && peerReleaseNeedsReload(version)) {
      requestOfflineShellReload({ version, reason: "release-update" });
    }
  };
  window.addEventListener("pageshow", reconcileKnownRelease);
  window.addEventListener("focus", reconcileKnownRelease);
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.addEventListener(
      "controllerchange",
      identifyDocumentCache,
    );
    navigator.serviceWorker.addEventListener(
      "message",
      (event: MessageEvent) => {
        if (event.data?.type === "ucsb-xrp-shell-identify")
          identifyDocumentCache();
      },
    );
    window.addEventListener("pageshow", identifyDocumentCache);
    window.addEventListener("focus", identifyDocumentCache);
  }
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
          installsOfflineShellOnThisOrigin(),
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
          "Wait for Course apps available offline before changing Wi-Fi.",
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
              "Wait for Course apps available offline before changing Wi-Fi.",
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
    const timer = setTimeout(() => {
      worker.removeEventListener("statechange", handleStateChange);
      reject(
        new Error(
          "Course download is taking too long. Reconnect to the internet and retry.",
        ),
      );
    }, 90_000);
    const handleStateChange = () => {
      if (worker.state === "activated") {
        clearTimeout(timer);
        worker.removeEventListener("statechange", handleStateChange);
        resolve();
      } else if (worker.state === "redundant") {
        clearTimeout(timer);
        worker.removeEventListener("statechange", handleStateChange);
        reject(new Error("The new offline worker became redundant"));
      }
    };
    worker.addEventListener("statechange", handleStateChange);
  });
}

async function verifyPrecache(manifestUrl: string) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 4_000);
  try {
    const response = await fetch(manifestUrl, {
      cache: "no-store",
      signal: controller.signal,
    });
    if (!response.ok)
      throw new Error(`Offline manifest request failed (${response.status})`);
    const manifest: unknown = await response.json();
    if (!isShellManifest(manifest))
      throw new Error("Offline manifest is malformed");
    await verifyShellCache(caches, manifest, manifestUrl);
    return manifest;
  } finally {
    clearTimeout(timer);
  }
}

function currentDocumentAssets(basePath: string): string[] {
  return [
    ...Array.from(document.scripts, (script) => script.src),
    ...Array.from(document.styleSheets, (sheet) => sheet.href ?? ""),
  ]
    .filter(Boolean)
    .map((source) => new URL(source, window.location.href))
    .filter(
      (url) =>
        url.origin === window.location.origin &&
        url.pathname.startsWith(`${basePath}assets/`),
    )
    .map((url) => url.pathname);
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

  const cached = hasActiveWorker()
    ? await findCachedShell(
        caches,
        manifestUrl,
        currentDocumentAssets(basePath),
      )
    : null;
  if (cached) {
    documentCacheName = cached.cache_name;
    loadedOfflineShellVersion = cached.version;
    identifyDocumentCache();
    publishState("ready", { version: cached.version });
  }

  try {
    if (navigator.onLine || !hasActiveWorker()) {
      try {
        registration = await withDeadline(
          navigator.serviceWorker.register(workerUrl, {
            scope: basePath,
            updateViaCache: "none",
          }),
          5_000,
          "Course update check timed out.",
        );
        // register() may reuse a long-lived registration without immediately
        // checking its script. Ask explicitly while online so a classroom tab
        // left open between sessions receives the current build promptly.
        if (navigator.onLine && hasActiveWorker()) {
          registration = await withDeadline(
            registration.update(),
            5_000,
            "Course update check timed out.",
          );
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
    await withDeadline(
      navigator.serviceWorker.ready,
      10_000,
      "The offline copy could not start. Reload to retry.",
    );
    const manifest = await verifyPrecache(manifestUrl);
    acceptVerifiedShell(manifest, basePath);
  } catch (error) {
    if (!cached) throw error;
    // A failed update never withdraws a separately verified cached release.
  }
}

function acceptVerifiedShell(manifest: CachedShellManifest, basePath: string) {
  const documentAssets = currentDocumentAssets(basePath);
  const manifestAssets = manifest.assets.map(
    (asset) => new URL(asset.url, window.location.origin).pathname,
  );
  const documentNeedsReload = offlineShellAssetsNeedReload(
    documentAssets,
    manifestAssets,
  );
  if (!documentCacheName && !documentNeedsReload) {
    documentCacheName = manifest.cache_name;
    identifyDocumentCache();
  }
  storeSetting("localStorage", offlineShellVersionKey, manifest.version);
  publishState("ready", { version: manifest.version });
  announceReleaseReady(manifest.version);

  // A newly activated worker cannot replace JavaScript already executing in
  // this tab. Coordinate one safe reload across every open course application.
  const updateNeedsReload = offlineShellUpdateNeedsReload(
    loadedOfflineShellVersion,
    manifest.version,
    storedSetting("sessionStorage", offlineShellReloadKey),
  );
  const isolationNeedsReload =
    offlineShellIsolationNeedsReload(
      globalThis.crossOriginIsolated,
      manifest.version,
      storedSetting("sessionStorage", isolationReloadKey),
    ) && storeSetting("sessionStorage", "ucsb-xrp-storage-check", "available");
  if (documentNeedsReload || updateNeedsReload || isolationNeedsReload) {
    requestOfflineShellReload({
      version: manifest.version,
      reason:
        documentNeedsReload || updateNeedsReload
          ? "release-update"
          : "isolation",
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
    installsOfflineShellOnThisOrigin(),
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
