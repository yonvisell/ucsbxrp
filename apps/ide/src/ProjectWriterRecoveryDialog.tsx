import { useState } from "react";
import type { CourseDirectoryHandle } from "../../shared/course-folder";
import { OperationStatus } from "../../shared/OperationStatus";
import {
  releaseSelectedProjectWriters,
  type ProjectWriterRecord,
} from "./project-writer-admission";

export function ProjectWriterRecoveryDialog({
  folder,
  records,
  onClose,
  onReleased,
}: {
  folder: CourseDirectoryHandle;
  records: ProjectWriterRecord[];
  onClose(): void;
  onReleased(): void;
}) {
  const [confirmed, setConfirmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  return (
    <div
      className="modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="writer-recovery-title"
    >
      <div className="new-file-dialog">
        <h2 id="writer-recovery-title">Project writer recovery</h2>
        <p>
          {folder.name} has {records.length} pending writer records. Close every
          other UCSBXRP editor of this folder, including other browsers and
          computers, before releasing them. A suspended editor can still have
          unsaved work.
        </p>
        <p>
          This releases only the selected writer records. Source and
          interrupted-save recovery copies remain on disk. An old timestamp does
          not prove a writer has finished.
        </p>
        <details>
          <summary>Selected writer records</summary>
          <ul>
            {records.map((record) => (
              <li key={record.fileName}>
                <code>{record.fileName}</code>
              </li>
            ))}
          </ul>
        </details>
        <label>
          <input
            type="checkbox"
            checked={confirmed}
            disabled={busy}
            onChange={(event) => setConfirmed(event.target.checked)}
          />
          All other editors of this folder are closed.
        </label>
        {error ? <p role="alert">{error}</p> : null}
        {busy ? (
          <OperationStatus phase="Checking and releasing the selected writer records…" />
        ) : null}
        <div className="dialog-actions">
          <button autoFocus disabled={busy} onClick={onClose}>
            Keep records
          </button>
          <button
            disabled={!confirmed || busy}
            onClick={() => {
              setBusy(true);
              setError("");
              void releaseSelectedProjectWriters(folder, records)
                .then(onReleased)
                .catch((reason: unknown) =>
                  setError(
                    reason instanceof Error ? reason.message : String(reason),
                  ),
                )
                .finally(() => setBusy(false));
            }}
          >
            Release selected writer records
          </button>
        </div>
      </div>
    </div>
  );
}
