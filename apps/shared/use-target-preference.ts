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
  const revisionRef = useRef(0);

  const updatePreference = useCallback((update: RobotProfileUpdate) => {
    setPreference((current) => update(current));
    const revision = ++revisionRef.current;
    void updateWorkspaceTargetPreference(update)
      .then((saved) => {
        if (revision === revisionRef.current) setPreference(saved);
      })
      .catch(() => {
        if (revision !== revisionRef.current) return;
        void loadWorkspaceTargetPreference().then(setPreference);
      });
  }, []);

  useEffect(() => {
    let disposed = false;
    const readSharedPreference = async () => {
      const loaded = await loadWorkspaceTargetPreference();
      if (!disposed) setPreference(loaded);
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

  return [preference, updatePreference] as const;
}
