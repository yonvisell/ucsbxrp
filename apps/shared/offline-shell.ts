export type OfflineShellState =
  "development" | "installing" | "ready" | "unsupported" | "error";

export interface OfflineShellStatus {
  state: OfflineShellState;
  version?: string;
  message?: string;
}

interface OfflineManifest {
  version: string;
  cache_name: string;
  assets: Array<{ url: string }>;
}

export const OFFLINE_SHELL_EVENT = "ucsb-xrp:offline-shell-state";
const offlineShellVersionKey = "ucsb-xrp-offline-shell-version-v1";
const offlineShellReloadKey = "ucsb-xrp-offline-shell-reload-v1";
const isolationReloadKey = "ucsb-xrp-isolation-reload-v1";
const courseShellCachePrefix = "ucsb-xrp-course-shell-";
let offlinePreparation: Promise<void> = Promise.resolve();

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
      detail: { state, ...options },
    }),
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
  const previousVersion = window.localStorage.getItem(offlineShellVersionKey);
  window.localStorage.setItem(offlineShellVersionKey, manifest.version);
  publishState("ready", { version: manifest.version });

  // A newly activated worker cannot replace JavaScript already executing in
  // this tab. Reload once per build so a long-open classroom tab does not keep
  // presenting an older interface after the offline shell has updated.
  if (
    offlineShellUpdateNeedsReload(
      previousVersion,
      manifest.version,
      window.sessionStorage.getItem(offlineShellReloadKey),
    ) ||
    offlineShellIsolationNeedsReload(
      globalThis.crossOriginIsolated,
      manifest.version,
      window.sessionStorage.getItem(isolationReloadKey),
    )
  ) {
    window.sessionStorage.setItem(offlineShellReloadKey, manifest.version);
    window.sessionStorage.setItem(isolationReloadKey, manifest.version);
    window.location.reload();
  }
}

export function registerOfflineShell() {
  const supported =
    "serviceWorker" in navigator &&
    "caches" in window &&
    window.isSecureContext;
  const initialState = initialOfflineShellState(
    import.meta.env.PROD,
    supported,
  );
  publishState(initialState);

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
