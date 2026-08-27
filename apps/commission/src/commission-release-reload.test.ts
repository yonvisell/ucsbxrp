import { describe, expect, it, vi } from "vitest";

import { OfflineReleaseCoordinator } from "../../shared/offline-release-coordinator";
import {
  commissionReloadIsSafe,
  type CommissionReloadActivity,
} from "./commission-release-reload";

const idle: CommissionReloadActivity = {
  appReady: true,
  folderInteractionActive: false,
  serialInteractionActive: false,
  installActive: false,
  networkHandoffActive: false,
  navigationActive: false,
};

const unsafeActivities: readonly [string, Partial<CommissionReloadActivity>][] =
  [
    ["application startup", { appReady: false }],
    ["working-folder picker or write check", { folderInteractionActive: true }],
    ["USB device selection or inspection", { serialInteractionActive: true }],
    ["course software installation", { installActive: true }],
    ["robot network handoff", { networkHandoffActive: true }],
    ["navigation after setup", { navigationActive: true }],
  ];

async function finishAttempt() {
  await Promise.resolve();
  await Promise.resolve();
}

describe("commissioning course-update reload", () => {
  it.each(unsafeActivities)("is not safe during %s", (_label, change) => {
    expect(commissionReloadIsSafe({ ...idle, ...change })).toBe(false);
  });

  it("applies a pending update after commissioning becomes idle", async () => {
    let activity: CommissionReloadActivity = {
      ...idle,
      serialInteractionActive: true,
    };
    const reload = vi.fn();
    const coordinator = new OfflineReleaseCoordinator({ reload });
    coordinator.registerBeforeReload(() => commissionReloadIsSafe(activity));

    coordinator.request({ version: "release-b", reason: "release-update" });
    await finishAttempt();
    expect(reload).not.toHaveBeenCalled();

    activity = idle;
    coordinator.retry();
    await finishAttempt();

    expect(reload).toHaveBeenCalledOnce();
  });
});
