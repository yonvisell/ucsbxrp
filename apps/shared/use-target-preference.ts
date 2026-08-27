import { useCallback, useEffect, useState } from "react";

import {
  loadTargetPreference,
  storeTargetPreference,
  TARGET_PREFERENCE_KEY,
  type TargetPreference,
} from "@ucsb-xrp/target";

type TargetPreferenceUpdate = (current: TargetPreference) => TargetPreference;

/**
 * Keep IDE and Monitor on one explicitly selected robot connection.
 *
 * localStorage is the small browser-local configuration file. Apps read it;
 * only a user selection or a verified robot response writes a replacement.
 */
export function useTargetPreference() {
  const [preference, setPreference] = useState(loadTargetPreference);

  const updatePreference = useCallback((update: TargetPreferenceUpdate) => {
    const next = update(loadTargetPreference());
    storeTargetPreference(next);
    setPreference(next);
  }, []);

  useEffect(() => {
    const readSharedPreference = (event: StorageEvent) => {
      if (event.key === TARGET_PREFERENCE_KEY) {
        setPreference(loadTargetPreference());
      }
    };
    window.addEventListener("storage", readSharedPreference);
    return () => window.removeEventListener("storage", readSharedPreference);
  }, []);

  return [preference, updatePreference] as const;
}
