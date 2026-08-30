import { useEffect, useState } from "react";

import {
  OFFLINE_SHELL_EVENT,
  readOfflineShellStatus,
  type OfflineShellStatus,
} from "./offline-shell";
import {
  offlineReadinessDetail,
  offlineReadinessLabel,
} from "./offline-readiness";

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

  const stateLabel = offlineReadinessLabel(status);
  const detail = offlineReadinessDetail(status, {
    appName,
    pendingUpdateDetail,
  });

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
