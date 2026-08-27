import { describe, expect, it, vi } from "vitest";

import { OfflineReleaseCoordinator } from "../../shared/offline-release-coordinator";
import {
  monitorReloadIsSafe,
  type MonitorReloadActivity,
} from "./monitor-release-reload";

const idle: MonitorReloadActivity = {
  runActive: false,
  exportActive: false,
  recordingActive: false,
  retainedRecording: false,
};

async function finishAttempt() {
  await Promise.resolve();
  await Promise.resolve();
}

describe("Monitor course-update reload", () => {
  it.each([
    "runActive",
    "exportActive",
    "recordingActive",
    "retainedRecording",
  ] as const)("is not safe while %s", (activity) => {
    expect(monitorReloadIsSafe({ ...idle, [activity]: true })).toBe(false);
  });

  it("defers during a target run and retries when the target is idle", async () => {
    let activity = { ...idle, runActive: true };
    const reload = vi.fn();
    const coordinator = new OfflineReleaseCoordinator({ reload });
    coordinator.registerBeforeReload(() => monitorReloadIsSafe(activity));

    coordinator.request({ version: "release-b", reason: "release-update" });
    await finishAttempt();
    expect(reload).not.toHaveBeenCalled();

    activity = idle;
    coordinator.retry();
    await finishAttempt();
    expect(reload).toHaveBeenCalledOnce();
  });

  it("retains a stopped recording until it is explicitly cleared", async () => {
    let activity = { ...idle, retainedRecording: true };
    const reload = vi.fn();
    const coordinator = new OfflineReleaseCoordinator({ reload });
    coordinator.registerBeforeReload(() => monitorReloadIsSafe(activity));

    coordinator.request({ version: "release-b", reason: "release-update" });
    await finishAttempt();
    activity = idle;
    coordinator.retry();
    await finishAttempt();

    expect(reload).toHaveBeenCalledOnce();
  });

  it("waits for the completed-run archive before reloading", async () => {
    let finishArchive: (() => void) | undefined;
    const archive = new Promise<void>((resolve) => {
      finishArchive = resolve;
    });
    const reload = vi.fn();
    const coordinator = new OfflineReleaseCoordinator({ reload });
    coordinator.registerBeforeReload(async () => {
      if (!monitorReloadIsSafe(idle)) return false;
      await archive;
      return monitorReloadIsSafe(idle);
    });

    coordinator.request({ version: "release-b", reason: "release-update" });
    await finishAttempt();
    expect(reload).not.toHaveBeenCalled();

    finishArchive?.();
    await finishAttempt();
    expect(reload).toHaveBeenCalledOnce();
  });
});
