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
  installing: "Saving course tools in Chrome",
  unsupported: "Course tools not saved",
  error: "Course tools not fully saved",
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
      ? `Chrome has saved the course apps and course release in this site's browser storage, including ${appName}. They can reopen without internet and do not need a Node server. Project files remain in the selected workspace or browser recovery storage; clearing site data removes the saved apps. Course release ${courseRelease.release_id}; build ${status.version ?? "current"}.`
      : status.state === "development"
        ? `Course release ${courseRelease.release_id}; the local development server does not save a browser copy.`
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
