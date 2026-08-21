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
      ? `${appName} saved in Chrome`
      : stateText[status.state];
  const detail =
    status.state === "ready"
      ? `Chrome has saved ${appName} and the other course apps for this site. The same Chrome profile can reopen them without internet. Project files remain in their project folders; a project without a selected folder has only a recovery copy in Chrome. Clearing this site's data removes the saved apps and recovery copies, but not project folders. Course release ${courseRelease.release_id}; build ${status.version ?? "current"}.`
      : status.state === "development"
        ? `Course release ${courseRelease.release_id}; this local preview does not install the offline copy.`
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
