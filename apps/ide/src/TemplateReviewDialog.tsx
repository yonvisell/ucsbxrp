import type { TemplateUpdateComparison } from "./project-provenance";

export function TemplateReviewDialog({
  comparison,
  onClose,
  onCreate,
}: {
  comparison: TemplateUpdateComparison;
  onClose(): void;
  onCreate(): void;
}) {
  return (
    <div
      className="modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="template-review-title"
    >
      <div className="new-file-dialog">
        <h2 id="template-review-title">Review supplied template</h2>
        <p>{comparison.reason}</p>
        <p>
          Available in {comparison.supplied.creationRelease}. An updated Project
          is a separate copy. Edited source, component work, and Project
          settings are retained.
        </p>
        {comparison.status !== "unknown" ? (
          <>
            <p>
              Update {comparison.update.length} files; add{" "}
              {comparison.add.length}; preserve {comparison.preserve.length}.
            </p>
            {comparison.update.length + comparison.add.length > 0 ? (
              <details open>
                <summary>Supplied changes</summary>
                <ul>
                  {[...comparison.update, ...comparison.add].map((path) => (
                    <li key={path}>
                      <code>{path}</code>
                    </li>
                  ))}
                </ul>
              </details>
            ) : null}
            {comparison.conflicts.length > 0 ? (
              <details open>
                <summary>Retained files that need manual comparison</summary>
                <ul>
                  {comparison.conflicts.map(({ path, reason }) => (
                    <li key={path}>
                      <code>{path}</code>: {reason.replaceAll("-", " ")}
                    </li>
                  ))}
                </ul>
                <p>
                  These files will keep their existing contents in the updated
                  copy.
                </p>
              </details>
            ) : null}
          </>
        ) : null}
        <div className="dialog-actions">
          <button onClick={onClose} autoFocus>
            Close
          </button>
          {comparison.status === "available" ? (
            <button className="primary-button" onClick={onCreate}>
              Create updated Project…
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
