import { describe, expect, it, vi } from "vitest";

import { ProjectRunProviderBroker } from "./project-run-provider";

describe("ProjectRunProviderBroker", () => {
  it("keeps the first provider until another explicitly takes over", () => {
    const broker = new ProjectRunProviderBroker<string>(() => undefined);

    expect(broker.register("ide-a")).toBe(true);
    expect(broker.register("ide-b")).toBe(false);
    expect(broker.providerIs("ide-a")).toBe(true);
    expect(broker.register("ide-b", true)).toBe(true);
    expect(broker.providerIs("ide-b")).toBe(true);
  });

  it("rejects Run when no active IDE project is available", async () => {
    const broker = new ProjectRunProviderBroker<string>(() => undefined);

    await expect(broker.request()).rejects.toThrow("No active IDE project");
  });

  it("rejects an in-flight snapshot when ownership changes", async () => {
    vi.useFakeTimers();
    try {
      const broker = new ProjectRunProviderBroker<string>(() => undefined);
      broker.register("ide-a");
      const pending = broker.request();

      broker.register("ide-b", true);

      await expect(pending).rejects.toThrow("active IDE changed");
    } finally {
      vi.useRealTimers();
    }
  });

  it("does not let a displaced IDE unregister the new owner", () => {
    const broker = new ProjectRunProviderBroker<string>(() => undefined);
    broker.register("ide-a");
    broker.register("ide-b", true);

    expect(broker.unregister("ide-a")).toBe(false);
    expect(broker.providerIs("ide-b")).toBe(true);
    expect(broker.unregister("ide-b")).toBe(true);
    expect(broker.hasProvider()).toBe(false);
  });

  it("releases an IDE that no longer answers snapshot requests", async () => {
    vi.useFakeTimers();
    try {
      const providerUnavailable = vi.fn();
      const broker = new ProjectRunProviderBroker<string>(
        () => undefined,
        providerUnavailable,
      );
      broker.register("closed-ide");

      const pending = broker.request();
      const rejection = expect(pending).rejects.toThrow(
        "did not provide the current project",
      );
      await vi.advanceTimersByTimeAsync(1_000);

      await rejection;
      expect(broker.hasProvider()).toBe(false);
      expect(providerUnavailable).toHaveBeenCalledOnce();
    } finally {
      vi.useRealTimers();
    }
  });
});
