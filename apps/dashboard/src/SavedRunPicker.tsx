import { useEffect, useRef, useState } from "react";
import type { CourseDirectoryHandle } from "../../shared/course-folder";
import type { MonitorRunDataset } from "./monitor-run-dataset";
import {
  listSavedRuns,
  readSavedRun,
  type SavedRunSummary,
} from "./saved-run-reader";

/** Read a committed trial without starting, resetting, or selecting a robot. */
export function SavedRunPicker({
  folder,
  projectId,
  disabled,
  onOpen,
}: {
  folder: CourseDirectoryHandle;
  projectId: string;
  disabled: boolean;
  onOpen(run: MonitorRunDataset, folder: CourseDirectoryHandle): void;
}) {
  const [runs, setRuns] = useState<SavedRunSummary[] | null>(null);
  const [selected, setSelected] = useState("");
  const [busy, setBusy] = useState(false);
  const [detail, setDetail] = useState("");
  const epoch = useRef(0);
  const current = useRef({ folder, projectId, disabled, onOpen });
  current.current = { folder, projectId, disabled, onOpen };
  useEffect(() => {
    epoch.current += 1;
    setRuns(null);
    setSelected("");
    setBusy(false);
    setDetail("");
    return () => {
      epoch.current += 1;
    };
  }, [folder, projectId]);

  const read = async (open: boolean) => {
    if (disabled || busy) return;
    const revision = ++epoch.current;
    setBusy(true);
    setDetail(open ? "Opening saved run…" : "Reading saved runs…");
    try {
      if (open) {
        const run = await readSavedRun(folder, projectId, selected);
        if (revision !== epoch.current) return;
        if (
          current.current.disabled ||
          current.current.folder !== folder ||
          current.current.projectId !== projectId
        )
          throw new Error(
            "The run or Project changed. Stop the current run, then reopen the saved trial.",
          );
        current.current.onOpen(run, folder);
        setRuns(null);
        setDetail("");
      } else {
        const found = await listSavedRuns(folder, projectId);
        if (
          revision !== epoch.current ||
          current.current.folder !== folder ||
          current.current.projectId !== projectId
        )
          return;
        setRuns(found);
        setSelected(found[0]?.runId ?? "");
        setDetail(
          found.length
            ? "Choose a saved trial. Opening it does not run the robot."
            : "No completed runs have been saved in this Project yet.",
        );
      }
    } catch (error) {
      if (revision === epoch.current)
        setDetail(error instanceof Error ? error.message : String(error));
    } finally {
      if (revision === epoch.current) setBusy(false);
    }
  };

  return (
    <div className="saved-run-picker">
      {runs === null ? (
        <button disabled={disabled || busy} onClick={() => void read(false)}>
          Open saved run…
        </button>
      ) : (
        <>
          {runs.length > 0 ? (
            <label>
              Saved trial
              <select
                value={selected}
                disabled={disabled || busy}
                onChange={(event) => setSelected(event.target.value)}
              >
                {runs.map((run) => (
                  <option key={run.runId} value={run.runId}>
                    {new Date(run.startedAt).toLocaleString()} · {run.target} ·{" "}
                    {run.name}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          <div className="saved-run-picker-actions">
            {runs.length > 0 ? (
              <button
                disabled={disabled || busy || !selected}
                onClick={() => void read(true)}
              >
                Open trial
              </button>
            ) : null}
            <button
              disabled={busy}
              onClick={() => {
                setRuns(null);
                setDetail("");
              }}
            >
              Cancel
            </button>
          </div>
        </>
      )}
      {detail ? <span role="status">{detail}</span> : null}
    </div>
  );
}
