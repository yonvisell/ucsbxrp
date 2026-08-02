import { useEffect, useState } from "react";

import courseRelease from "../../vendor/current/release.json";
import {
  OFFLINE_SHELL_EVENT,
  readOfflineShellStatus,
  type OfflineShellState,
  type OfflineShellStatus,
} from "./offline-shell";

const stateText: Record<OfflineShellState, string> = {
  development: "Development build",
  installing: "Saving web tools",
  ready: "Web tools work offline",
  unsupported: "Offline copy unavailable",
  error: "Offline copy incomplete",
};

export function OfflineReadiness() {
  const [status, setStatus] = useState(readOfflineShellStatus);

  useEffect(() => {
    const handleState = (event: Event) => {
      setStatus((event as CustomEvent<OfflineShellStatus>).detail);
    };
    window.addEventListener(OFFLINE_SHELL_EVENT, handleState);
    setStatus(readOfflineShellStatus());
    return () => window.removeEventListener(OFFLINE_SHELL_EVENT, handleState);
  }, []);

  const stateLabel = stateText[status.state];
  const detail =
    status.state === "ready"
      ? `The IDE, Monitor, MicroPython runtime, starters, and library are saved in this browser and can reopen without internet. Course release ${courseRelease.release_id}.`
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
