import { runInNewContext } from "node:vm";
import { afterEach, describe, expect, it, vi } from "vitest";

const buildModule = "../../scripts/offline-build.mjs";
const { renderServiceWorker } = (await import(buildModule)) as {
  renderServiceWorker(manifest: unknown): string;
};
const prefix = "ucsb-xrp-course-shell-0123456789-";
const cacheName = (version: string) => prefix + version.repeat(20);
const origin = "https://course.example";

class MemoryCaches {
  entries = new Map<string, Map<string, Response>>();
  async keys() {
    return [...this.entries.keys()];
  }
  async delete(name: string) {
    return this.entries.delete(name);
  }
  async open(name: string) {
    if (!this.entries.has(name)) this.entries.set(name, new Map());
    const entries = this.entries.get(name)!;
    const key = (value: string | Request) =>
      typeof value === "string" ? value : value.url;
    return {
      keys: async () => [...entries.keys()].map((url) => new Request(url)),
      match: async (url: string | Request) => entries.get(key(url))?.clone(),
      put: async (url: string | Request, response: Response) => {
        entries.set(key(url), response);
      },
      delete: async (url: string | Request) => entries.delete(key(url)),
    };
  }
}

async function workerFixture() {
  const caches = new MemoryCaches();
  for (const version of ["a", "b", "c"]) await caches.open(cacheName(version));
  const listeners = new Map<string, (event: Record<string, unknown>) => void>();
  let clients = ["a", "c"].map((id) => ({
    id,
    url: `${origin}/ide/`,
    postMessage: vi.fn(),
  }));
  const fetch = vi.fn();
  runInNewContext(
    renderServiceWorker({
      base_path: "/",
      version: "c".repeat(20),
      cache_name: cacheName("c"),
      assets: [],
    }),
    {
      self: {
        location: { origin },
        clients: {
          matchAll: async () => clients,
          claim: async () => undefined,
        },
        addEventListener: (
          type: string,
          handler: (event: Record<string, unknown>) => void,
        ) => listeners.set(type, handler),
      },
      caches,
      Response,
      Headers,
      Request,
      URL,
      AbortController,
      fetch,
      setTimeout,
      clearTimeout,
    },
  );
  const fire = (type: string, data: Record<string, unknown>) => {
    let result: Promise<unknown> = Promise.resolve();
    listeners.get(type)!({
      ...data,
      waitUntil: (pending: Promise<unknown>) => {
        result = pending;
      },
      respondWith: (pending: Promise<unknown>) => {
        result = pending;
      },
    });
    return result;
  };
  return {
    caches,
    fetch,
    fire,
    closeA() {
      clients = clients.filter((client) => client.id !== "a");
    },
  };
}

afterEach(() => vi.useRealTimers());

describe("generated offline worker", () => {
  it("retains release A through B and C while A has a live document", async () => {
    const fixture = await workerFixture();
    await fixture.fire("message", {
      source: { id: "a" },
      data: { type: "ucsb-xrp-shell-client", cacheName: cacheName("a") },
    });
    await fixture.fire("message", {
      source: { id: "c" },
      data: { type: "ucsb-xrp-shell-client", cacheName: cacheName("c") },
    });
    expect(await fixture.caches.keys()).toContain(cacheName("a"));
    fixture.closeA();
    await fixture.fire("message", {
      source: { id: "c" },
      data: { type: "ucsb-xrp-shell-client", cacheName: cacheName("c") },
    });
    expect(await fixture.caches.keys()).not.toContain(cacheName("a"));
    expect(await fixture.caches.keys()).toContain(cacheName("b"));
  });

  it("preserves an unidentified suspended client's assets", async () => {
    const fixture = await workerFixture();
    await fixture.fire("activate", {});
    expect(await fixture.caches.keys()).toContain(cacheName("a"));
  });

  it("falls back to cached metadata when an online request never responds", async () => {
    vi.useFakeTimers();
    const fixture = await workerFixture();
    const cache = await fixture.caches.open(cacheName("c"));
    await cache.put(
      `${origin}/offline-manifest.json`,
      Response.json({ version: "cached" }),
    );
    fixture.fetch.mockImplementation(
      (request: Request) =>
        new Promise((_, reject) => {
          request.signal.addEventListener(
            "abort",
            () => reject(new Error("aborted")),
            { once: true },
          );
        }),
    );
    const response = fixture.fire("fetch", {
      request: new Request(`${origin}/offline-manifest.json`),
    });
    await vi.advanceTimersByTimeAsync(2_500);
    expect(await ((await response) as Response).json()).toEqual({
      version: "cached",
    });
    expect(vi.getTimerCount()).toBe(0);
  });
});
