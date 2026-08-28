import { useEffect, useState } from "react";

import courseRelease from "../../vendor/current/release.json";
import {
  OFFLINE_SHELL_EVENT,
  readOfflineShellStatus,
  type OfflineShellState,
  type OfflineShellStatus,
} from "./offline-shell";

const stateText: Record<Exclude<OfflineShellState, "ready">, string> = {
  development: "Local development",
  installing: "Preparing offline copy",
  unsupported: "Offline copy unavailable",
  error: "Offline copy unavailable",
};

interface OfflineReadinessProps {
  appName?: string;
  pendingUpdateDetail?: string;
}

export function OfflineReadiness({
  appName = "Course tools",
  pendingUpdateDetail,
}: OfflineReadinessProps) {
  const [status, setStatus] = useState(readOfflineShellStatus);

  useEffect(() => {
    const handleState = (event: Event) => {
      setStatus((event as CustomEvent<OfflineShellStatus>).detail);
    };
    window.addEventListener(OFFLINE_SHELL_EVENT, handleState);
    setStatus(readOfflineShellStatus());
    return () => window.removeEventListener(OFFLINE_SHELL_EVENT, handleState);
  }, []);

  const stateLabel = status.updateVersion
    ? "Course update ready"
    : status.state === "ready"
      ? "Ready without internet"
      : stateText[status.state];
  const detail = status.updateVersion
    ? (pendingUpdateDetail ??
      "A newer UCSBXRP course release is saved in Chrome. This page will reopen after its current run, save, setup step, or export is complete.")
    : status.state === "ready"
      ? `Chrome saved ${appName} and every UCSBXRP course page in this browser profile. Reopen the bookmarked course address without internet. Project files stay in the selected Working folder; without one, the built-in project is a read-only preview.`
      : status.state === "development"
        ? `Course release ${courseRelease.release_id}; this local development page does not save the course apps in Chrome.`
        : (status.message ??
          `Course release ${courseRelease.release_id}: ${stateLabel}.`);

  return (
    <div
      aria-label={detail}
      aria-live="polite"
      className={`offline-readiness ${status.state}`}
      data-testid="offline-readiness"
      role="status"
      title={detail}
    >
      <span aria-hidden="true" className="offline-readiness-dot" />
      <a className="offline-readiness-label" href="../guide/#offline-use">
        {stateLabel}
      </a>
    </div>
  );
}
