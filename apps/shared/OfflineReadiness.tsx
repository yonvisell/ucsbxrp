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
  installing: "Saving course apps in Chrome",
  unsupported: "Course apps not saved",
  error: "Course apps not fully saved",
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
      ? "Course apps saved in Chrome"
      : stateText[status.state];
  const detail =
    status.state === "ready"
      ? `Chrome has saved ${appName} and the other UCSBXRP course apps for this site in this Chrome profile. They can reopen without internet. This browser copy is not stored in a project folder. A project without a selected folder has only a temporary recovery copy in Chrome, and unsaved recordings and program output last only for the current session. Clearing this site's data removes the saved course apps, settings, recovery copies, and remembered folder access, but it does not remove external project files. Course release ${courseRelease.release_id}; build ${status.version ?? "current"}.`
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
      <span>{stateLabel}</span>
    </div>
  );
}
