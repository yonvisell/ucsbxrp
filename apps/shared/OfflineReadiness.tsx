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
  installing: "Preparing course apps for offline use",
  unsupported: "Offline course apps unavailable",
  error: "Course apps are not available offline",
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
      ? "Course apps available offline"
      : stateText[status.state];
  const detail = status.updateVersion
    ? (pendingUpdateDetail ??
      "A newer UCSBXRP course release is saved in Chrome. This page will reopen after its current run, save, setup step, or export is complete.")
    : status.state === "ready"
      ? `Chrome saved a local copy of ${appName} and the other UCSBXRP course apps for this site. Reopen them from this browser profile without internet. Project files are separate and stay in the selected Working folder. If no Working folder is selected, project changes remain in this browser only.`
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
