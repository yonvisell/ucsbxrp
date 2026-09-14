export interface CachedShellManifest {
  version: string;
  cache_name: string;
  assets: Array<{ url: string }>;
}

export function isShellManifest(value: unknown): value is CachedShellManifest {
  if (!value || typeof value !== "object") return false;
  const manifest = value as Partial<CachedShellManifest>;
  return (
    typeof manifest.version === "string" &&
    /^[a-f0-9]{20}$/.test(manifest.version) &&
    typeof manifest.cache_name === "string" &&
    manifest.cache_name.startsWith("ucsb-xrp-course-shell-") &&
    manifest.cache_name.endsWith(`-${manifest.version}`) &&
    Array.isArray(manifest.assets) &&
    manifest.assets.length > 0 &&
    manifest.assets.length <= 10_000 &&
    manifest.assets.every((asset) => asset && typeof asset.url === "string")
  );
}

export async function verifyShellCache(
  storage: CacheStorage,
  manifest: CachedShellManifest,
  manifestUrl: string,
): Promise<void> {
  if (!(await storage.has(manifest.cache_name))) {
    throw new Error("Offline cache was not created");
  }
  const cache = await storage.open(manifest.cache_name);
  const stored = new Set((await cache.keys()).map((request) => request.url));
  const required = [
    manifestUrl,
    ...manifest.assets.map((asset) => new URL(asset.url, manifestUrl).href),
  ];
  const missing = required.find((url) => !stored.has(url));
  if (missing) throw new Error(`Offline cache is incomplete: ${missing}`);
}

/** Inspect local bytes only; an internet check cannot delay cached readiness. */
export async function findCachedShell(
  storage: CacheStorage,
  manifestUrl: string,
  documentAssets: readonly string[],
): Promise<CachedShellManifest | null> {
  const names = (await storage.keys()).reverse();
  for (const name of names) {
    if (!/^ucsb-xrp-course-shell-[a-f0-9]{10}-[a-f0-9]{20}$/.test(name)) {
      continue;
    }
    try {
      const cache = await storage.open(name);
      const response = await cache.match(manifestUrl);
      if (!response) continue;
      const manifest: unknown = await response.json();
      if (!isShellManifest(manifest) || manifest.cache_name !== name) continue;
      const assets = new Set(
        manifest.assets.map(
          (asset) => new URL(asset.url, manifestUrl).pathname,
        ),
      );
      if (!documentAssets.every((asset) => assets.has(asset))) continue;
      await verifyShellCache(storage, manifest, manifestUrl);
      return manifest;
    } catch {
      // A failed/incomplete installation is not a usable fallback.
    }
  }
  return null;
}

export async function withDeadline<T>(
  operation: Promise<T>,
  timeoutMs: number,
  message: string,
): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      operation,
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error(message)), timeoutMs);
      }),
    ]);
  } finally {
    clearTimeout(timer);
  }
}
