import { useEffect, useState } from "react";

import courseRelease from "../../vendor/current/release.json";
import {
  OFFLINE_SHELL_EVENT,
  readOfflineShellStatus,
  type OfflineShellState,
  type OfflineShellStatus,
} from "./offline-shell";

const stateText: Record<Exclude<OfflineShellState, "ready">, string> = {
  development: "Development build",
  installing: "Preparing offline use",
  unsupported: "Offline use unavailable",
  error: "Offline setup incomplete",
};

interface OfflineReadinessProps {
  appName?: string;
}

export function OfflineReadiness({
  appName = "Course tools",
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

  const stateLabel =
    status.state === "ready"
      ? `${appName} available offline`
      : stateText[status.state];
  const detail =
    status.state === "ready"
      ? `Chrome has saved the web apps and course release in browser storage. No Node server or internet connection is needed after this page loads; robot connectivity and project folders are separate. Course release ${courseRelease.release_id}; build ${status.version ?? "current"}.`
      : status.state === "development"
        ? `Course release ${courseRelease.release_id}; this development build does not save an offline browser copy.`
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
      <span>{stateLabel}</span>
    </div>
  );
}
