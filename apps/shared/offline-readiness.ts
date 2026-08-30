import courseRelease from "../../vendor/current/release.json";

import type { OfflineShellState, OfflineShellStatus } from "./offline-shell";

const stateText: Record<Exclude<OfflineShellState, "ready">, string> = {
  development: "Local development",
  installing: "Preparing offline copy",
  unsupported: "Offline copy unavailable",
  error: "Offline copy unavailable",
};

export function offlineReadinessLabel(status: OfflineShellStatus): string {
  if (status.updateVersion) return "Course update ready";
  if (status.state === "ready") return "Ready without internet";
  return stateText[status.state];
}

export function offlineReadinessDetail(
  status: OfflineShellStatus,
  {
    appName = "Course tools",
    pendingUpdateDetail,
  }: { appName?: string; pendingUpdateDetail?: string } = {},
): string {
  const stateLabel = offlineReadinessLabel(status);
  if (status.updateVersion) {
    return (
      pendingUpdateDetail ??
      "A newer UCSBXRP course release is saved in Chrome. This page will reopen after its current run, save, setup step, or export is complete."
    );
  }
  if (status.state === "ready") {
    return `Chrome saved ${appName} and every UCSBXRP course page in this browser profile. Reopen the bookmarked course address without internet. Project files stay in the selected Working folder; without one, the built-in project is a read-only preview.`;
  }
  if (status.state === "development") {
    return `Course release ${courseRelease.release_id}; this local development page does not save the course apps in Chrome.`;
  }
  return (
    status.message ??
    `Course release ${courseRelease.release_id}: ${stateLabel}.`
  );
}
