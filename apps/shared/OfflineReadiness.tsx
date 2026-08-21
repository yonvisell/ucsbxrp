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
  installing: "Preparing offline use",
  ready: "Works without internet",
  unsupported: "Offline use unavailable",
  error: "Offline setup incomplete",
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
      ? `The web apps and course release are saved in this browser. Robot connectivity is separate. Course release ${courseRelease.release_id}; build ${status.version ?? "current"}.`
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
