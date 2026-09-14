import { useCallback, useEffect, useRef, useState } from "react";
import { DEFAULT_TARGET_PREFERENCE, type RobotProfile } from "@ucsb-xrp/target";
import {
  loadRememberedWorkspaceFolder,
  subscribeCourseFolderChanged,
  WorkspaceManifestError,
  type CourseDirectoryHandle,
} from "./course-folder";
import {
  loadWorkspaceTargetPreference,
  updateWorkspaceTargetPreference,
} from "./workspace-target-preference";

type RobotProfileUpdate = (current: RobotProfile) => RobotProfile;

/** A mounted session retains its folder binding until it explicitly adopts another. */
export function useTargetPreference(
  options: {
    canApplySharedChange?: () => boolean;
    retainTarget?: boolean;
  } = {},
) {
  const [preference, setPreference] = useState(DEFAULT_TARGET_PREFERENCE);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [otherWorkspace, setOtherWorkspace] = useState<string | null>(null);
  const epoch = useRef(0);
  const readEpoch = useRef(0);
  const readyRef = useRef(false);
  const boundWorkspace = useRef<CourseDirectoryHandle | null>(null);
  const preferenceRef = useRef(preference);
  const optionsRef = useRef(options);
  optionsRef.current = options;
  preferenceRef.current = preference;
  const writeQueue = useRef<Promise<void>>(Promise.resolve());

  const adoptWorkspace = useCallback(
    async (workspace: CourseDirectoryHandle) => {
      const revision = ++epoch.current;
      const loaded = await loadWorkspaceTargetPreference(workspace);
      if (revision !== epoch.current) return;
      boundWorkspace.current = workspace;
      preferenceRef.current = loaded;
      setPreference(loaded);
      setOtherWorkspace(null);
      setError(null);
      readyRef.current = true;
      setReady(true);
    },
    [],
  );

  const updatePreference = useCallback((update: RobotProfileUpdate) => {
    const previous = preferenceRef.current;
    const proposed = update(previous);
    preferenceRef.current = proposed;
    setPreference(proposed);
    setError(null);
    const revision = ++epoch.current;
    const folder = boundWorkspace.current;
    const operation = writeQueue.current.then(async () => {
      if (revision !== epoch.current) return;
      const saved = await updateWorkspaceTargetPreference(update, folder, {
        assertCurrent: () => {
          if (revision !== epoch.current)
            throw new DOMException("Target selection changed", "AbortError");
        },
      });
      if (revision !== epoch.current) return;
      preferenceRef.current = saved;
      setPreference(saved);
    });
    writeQueue.current = operation.catch((failure: unknown) => {
      if (revision !== epoch.current) return;
      preferenceRef.current = previous;
      setPreference(previous);
      setError(failure instanceof Error ? failure.message : String(failure));
    });
  }, []);

  useEffect(() => {
    let disposed = false;
    const readSharedPreference = async () => {
      const revision = ++readEpoch.current;
      const requestedAt = epoch.current;
      try {
        const remembered = await loadRememberedWorkspaceFolder();
        if (
          disposed ||
          revision !== readEpoch.current ||
          requestedAt !== epoch.current
        )
          return;
        const bound = boundWorkspace.current;
        if (bound && remembered) {
          const same =
            bound === remembered ||
            (bound.isSameEntry && (await bound.isSameEntry(remembered)));
          if (
            disposed ||
            revision !== readEpoch.current ||
            requestedAt !== epoch.current
          )
            return;
          if (!same) {
            setOtherWorkspace(remembered.name);
            return;
          }
        } else if (bound && !remembered) {
          setOtherWorkspace("a different or disconnected Working folder");
          return;
        }
        const folder = bound ?? remembered;
        const loaded = await loadWorkspaceTargetPreference(folder);
        if (
          disposed ||
          revision !== readEpoch.current ||
          requestedAt !== epoch.current
        )
          return;
        if (
          readyRef.current &&
          optionsRef.current.retainTarget &&
          JSON.stringify(loaded) !== JSON.stringify(preferenceRef.current)
        ) {
          setOtherWorkspace(
            `${folder?.name ?? "this Working folder"} (different XRP settings)`,
          );
          return;
        }
        if (
          readyRef.current &&
          optionsRef.current.canApplySharedChange?.() === false
        )
          return;
        boundWorkspace.current = folder;
        preferenceRef.current = loaded;
        setPreference(loaded);
        setError(null);
      } catch (failure) {
        if (
          disposed ||
          revision !== readEpoch.current ||
          requestedAt !== epoch.current
        )
          return;
        if (!readyRef.current && failure instanceof WorkspaceManifestError) {
          setPreference(DEFAULT_TARGET_PREFERENCE);
          setError(null);
        } else
          setError(
            failure instanceof Error ? failure.message : String(failure),
          );
      } finally {
        if (
          !disposed &&
          revision === readEpoch.current &&
          requestedAt === epoch.current
        ) {
          readyRef.current = true;
          setReady(true);
        }
      }
    };
    void readSharedPreference();
    const unsubscribe = subscribeCourseFolderChanged(() => {
      void readSharedPreference();
    });
    return () => {
      disposed = true;
      epoch.current += 1;
      unsubscribe();
    };
  }, []);

  return [
    preference,
    updatePreference,
    ready,
    error,
    adoptWorkspace,
    otherWorkspace,
  ] as const;
}
