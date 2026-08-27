import { describe, expect, it, vi } from "vitest";

import {
  OfflineReleaseCoordinator,
  type OfflineShellReloadRequest,
} from "./offline-release-coordinator";

const update: OfflineShellReloadRequest = {
  version: "release-b",
  reason: "release-update",
};

async function finishAttempt() {
  await Promise.resolve();
  await Promise.resolve();
}

describe("offline release coordinator", () => {
  it("reloads an application without transient state immediately", async () => {
    const reload = vi.fn();
    const coordinator = new OfflineReleaseCoordinator({ reload });

    coordinator.request(update);
    await finishAttempt();

    expect(reload).toHaveBeenCalledOnce();
    expect(reload).toHaveBeenCalledWith(update);
  });

  it("awaits the application save callback before reloading", async () => {
    let finishSave: ((ready: boolean) => void) | undefined;
    const reload = vi.fn();
    const coordinator = new OfflineReleaseCoordinator({ reload });
    coordinator.registerBeforeReload(
      () =>
        new Promise<boolean>((resolve) => {
          finishSave = resolve;
        }),
    );

    coordinator.request(update);
    await finishAttempt();
    expect(reload).not.toHaveBeenCalled();

    finishSave?.(true);
    await finishAttempt();
    expect(reload).toHaveBeenCalledWith(update);
  });

  it("keeps an update pending while a program is running", async () => {
    let running = true;
    const reload = vi.fn();
    const coordinator = new OfflineReleaseCoordinator({ reload });
    coordinator.registerBeforeReload(() => !running);

    coordinator.request(update);
    await finishAttempt();
    expect(reload).not.toHaveBeenCalled();
    expect(coordinator.pendingRequest).toEqual(update);

    running = false;
    coordinator.retry();
    await finishAttempt();
    expect(reload).toHaveBeenCalledWith(update);
  });

  it("does not discard an update when saving fails", async () => {
    const error = new Error("folder write failed");
    const reportError = vi.fn();
    const reload = vi.fn();
    const coordinator = new OfflineReleaseCoordinator({ reload, reportError });
    coordinator.registerBeforeReload(() => {
      throw error;
    });

    coordinator.request(update);
    await finishAttempt();

    expect(reload).not.toHaveBeenCalled();
    expect(reportError).toHaveBeenCalledWith(error);
    expect(coordinator.pendingRequest).toEqual(update);
  });

  it("reloads only the newest release received during a save", async () => {
    let finishSave: ((ready: boolean) => void) | undefined;
    const reload = vi.fn();
    const coordinator = new OfflineReleaseCoordinator({ reload });
    coordinator.registerBeforeReload(
      () =>
        new Promise<boolean>((resolve) => {
          finishSave = resolve;
        }),
    );

    coordinator.request(update);
    await finishAttempt();
    coordinator.request({ version: "release-c", reason: "release-update" });
    finishSave?.(true);
    await finishAttempt();
    expect(reload).not.toHaveBeenCalled();

    finishSave?.(true);
    await finishAttempt();
    expect(reload).toHaveBeenCalledOnce();
    expect(reload).toHaveBeenCalledWith({
      version: "release-c",
      reason: "release-update",
    });
  });
});
