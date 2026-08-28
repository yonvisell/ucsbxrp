import { useCallback, useEffect, useRef, useState } from "react";

import { DEFAULT_TARGET_PREFERENCE, type RobotProfile } from "@ucsb-xrp/target";

import { subscribeCourseFolderChanged } from "./course-folder";
import {
  loadWorkspaceTargetPreference,
  updateWorkspaceTargetPreference,
} from "./workspace-target-preference";

type RobotProfileUpdate = (current: RobotProfile) => RobotProfile;

/** Keep IDE and Monitor aligned with the Working-folder robot record. */
export function useTargetPreference() {
  const [preference, setPreference] = useState(DEFAULT_TARGET_PREFERENCE);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const revisionRef = useRef(0);
  const preferenceRef = useRef(preference);
  preferenceRef.current = preference;

  const updatePreference = useCallback((update: RobotProfileUpdate) => {
    const previous = preferenceRef.current;
    setPreference(update(previous));
    setError(null);
    const revision = ++revisionRef.current;
    void updateWorkspaceTargetPreference(update)
      .then((saved) => {
        if (revision !== revisionRef.current) return;
        setPreference(saved);
        setError(null);
      })
      .catch((failure: unknown) => {
        if (revision !== revisionRef.current) return;
        setPreference(previous);
        setError(failure instanceof Error ? failure.message : String(failure));
      });
  }, []);

  useEffect(() => {
    let disposed = false;
    const readSharedPreference = async () => {
      try {
        const loaded = await loadWorkspaceTargetPreference();
        if (!disposed) {
          setPreference(loaded);
          setError(null);
        }
      } catch (failure) {
        if (!disposed) {
          setError(
            failure instanceof Error ? failure.message : String(failure),
          );
        }
      } finally {
        if (!disposed) setReady(true);
      }
    };
    void readSharedPreference();
    const unsubscribe = subscribeCourseFolderChanged(() => {
      void readSharedPreference();
    });
    return () => {
      disposed = true;
      unsubscribe();
    };
  }, []);

  return [preference, updatePreference, ready, error] as const;
}
