import { useEffect, useState } from "react";

import courseRelease from "../../vendor/current/release.json";
import {
  OFFLINE_SHELL_EVENT,
  readOfflineShellStatus,
  type OfflineShellState,
  type OfflineShellStatus,
} from "./offline-shell";

const stateText: Record<OfflineShellState, string> = {
  development: "cache disabled",
  installing: "preparing offline",
  ready: "offline ready",
  unsupported: "offline unsupported",
  error: "offline incomplete",
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
      ? `Course release ${courseRelease.release_id} is completely cached for offline use.`
      : status.state === "development"
        ? `Course release ${courseRelease.release_id}; development servers do not install an offline cache.`
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
      <span>
        {courseRelease.release_id} · {stateLabel}
      </span>
    </div>
  );
}
