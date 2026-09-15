import { useLayoutEffect, useState } from "react";

/** Rename project metadata; native directory handles do not support portable rename. */
export function ProjectNameEditor({
  name,
  folderName,
  disabled,
  onRename,
  onDraftChange,
}: {
  name: string;
  folderName: string;
  disabled: boolean;
  onRename(name: string): void;
  onDraftChange(active: boolean): void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(name);
  useLayoutEffect(() => {
    onDraftChange(editing);
    return () => onDraftChange(false);
  }, [editing, onDraftChange]);
  if (!editing)
    return (
      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          setDraft(name);
          setEditing(true);
        }}
      >
        Rename project…
      </button>
    );
  return (
    <form
      className="project-name-editor"
      onSubmit={(event) => {
        event.preventDefault();
        if (disabled || !draft.trim()) return;
        onRename(draft.trim());
        setEditing(false);
      }}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          event.stopPropagation();
          setEditing(false);
        }
      }}
    >
      <label>
        Project display name
        <input
          autoFocus
          required
          maxLength={120}
          value={draft}
          disabled={disabled}
          onChange={(event) => setDraft(event.target.value)}
        />
      </label>
      <small>
        Folder on disk: {folderName}. Renaming changes the title, not this
        folder.
      </small>
      <div>
        <button type="submit" disabled={disabled || !draft.trim()}>
          Save name
        </button>
        <button type="button" onClick={() => setEditing(false)}>
          Cancel
        </button>
      </div>
    </form>
  );
}
