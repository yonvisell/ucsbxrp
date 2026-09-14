import { afterEach, describe, expect, it, vi } from "vitest";

import {
  findCachedShell,
  withDeadline,
  type CachedShellManifest,
} from "./offline-cache";

const manifestUrl = "https://course.example/ucsbxrp/offline-manifest.json";

function manifest(version: string, asset: string): CachedShellManifest {
  return {
    version: version.repeat(20),
    cache_name: `ucsb-xrp-course-shell-0123456789-${version.repeat(20)}`,
    assets: [{ url: asset }],
  };
}

function cacheFixture(
  manifests: CachedShellManifest[],
  incomplete?: string,
): CacheStorage {
  const entries = new Map(manifests.map((item) => [item.cache_name, item]));
  return {
    keys: async () => [...entries.keys()],
    has: async (name: string) => entries.has(name),
    open: async (name: string) => {
      const item = entries.get(name)!;
      return {
        match: async (url: string) =>
          url === manifestUrl ? Response.json(item) : undefined,
        keys: async () => [
          new Request(manifestUrl),
          ...(name === incomplete
            ? []
            : item.assets.map(
                (asset) => new Request(new URL(asset.url, manifestUrl)),
              )),
        ],
      } as unknown as Cache;
    },
  } as CacheStorage;
}

afterEach(() => vi.useRealTimers());

describe("cached shell readiness", () => {
  it("selects the complete local shell for the executing document without a network call", async () => {
    const a = manifest("a", "/ucsbxrp/assets/ide-a.js");
    const b = manifest("b", "/ucsbxrp/assets/ide-b.js");
    expect(
      await findCachedShell(cacheFixture([a, b]), manifestUrl, [
        a.assets[0]!.url,
      ]),
    ).toEqual(a);
    expect(
      await findCachedShell(cacheFixture([a, b]), manifestUrl, [
        b.assets[0]!.url,
      ]),
    ).toEqual(b);
  });

  it("never announces a partially installed generation as ready", async () => {
    const a = manifest("a", "/ucsbxrp/assets/common.js");
    const b = manifest("b", "/ucsbxrp/assets/common.js");
    expect(
      await findCachedShell(
        cacheFixture([a, b], b.cache_name),
        manifestUrl,
        [],
      ),
    ).toEqual(a);
    expect(
      await findCachedShell(cacheFixture([b], b.cache_name), manifestUrl, []),
    ).toBeNull();
  });

  it("settles a stalled update without waiting for its network promise", async () => {
    vi.useFakeTimers();
    const result = withDeadline(
      new Promise<void>(() => undefined),
      500,
      "Update unavailable",
    );
    const assertion = expect(result).rejects.toThrow("Update unavailable");
    await vi.advanceTimersByTimeAsync(500);
    await assertion;
    expect(vi.getTimerCount()).toBe(0);
  });
});
