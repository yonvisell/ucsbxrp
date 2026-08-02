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
    )
  ) {
    window.sessionStorage.setItem(offlineShellReloadKey, manifest.version);
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
