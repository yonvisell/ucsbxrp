import { useCallback, useEffect, useRef, useState } from "react";

import {
  PROJECT_BOOTSTRAP_KEY,
  projectBootstrapExpiresAt,
  projectBootstrapIsPending,
} from "./project-bootstrap";

/** Reflect whether another open course tab is still resolving the IDE project. */
export function useProjectBootstrapPending(): boolean {
  const [pending, setPending] = useState(projectBootstrapIsPending);
  const expiryTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const refresh = useCallback(() => {
    if (expiryTimer.current !== null) clearTimeout(expiryTimer.current);
    setPending(projectBootstrapIsPending());
    const expiresAt = projectBootstrapExpiresAt();
    if (expiresAt !== null && expiresAt > Date.now()) {
      expiryTimer.current = setTimeout(refresh, expiresAt - Date.now() + 1);
    }
  }, []);

  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key === PROJECT_BOOTSTRAP_KEY) refresh();
    };
    window.addEventListener("storage", handleStorage);
    refresh();
    return () => {
      window.removeEventListener("storage", handleStorage);
      if (expiryTimer.current !== null) clearTimeout(expiryTimer.current);
    };
  }, [refresh]);

  return pending;
}
