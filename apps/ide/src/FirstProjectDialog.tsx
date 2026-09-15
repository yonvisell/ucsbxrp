import { useState } from "react";
import {
  chooseWorkspaceFolder,
  requireWorkingFolderParent,
  supportsCourseFolders,
  type CourseDirectoryHandle,
} from "../../shared/course-folder";
import { OperationStatus } from "../../shared/OperationStatus";
import { isCourseRepositoryFolder } from "./project-files";
import { nextFirstProjectName } from "./first-project";

export function FirstProjectDialog({
  physicalSelected,
  workspace,
  needsReconnect,
  onReconnect,
  onCreate,
  onOpenExisting,
  onPreview,
}: {
  physicalSelected: boolean;
  workspace: CourseDirectoryHandle | null;
  needsReconnect: boolean;
  onReconnect(): void;
  onCreate(parent: CourseDirectoryHandle, name: string): Promise<void>;
  onOpenExisting(): void;
  onPreview(): void;
}) {
  const [parent, setParent] = useState(workspace);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");

  const chooseParent = async (create: boolean) => {
    if (busy) return;
    setError("");
    setBusy("Choose the folder that will contain your Projects.");
    try {
      const selected = await chooseWorkspaceFolder();
      await requireWorkingFolderParent(selected);
      if (await isCourseRepositoryFolder(selected))
        throw new Error(
          "Choose a folder for student Projects outside the course software repository.",
        );
      setParent(selected);
      if (create) await createIn(selected);
    } catch (reason) {
      if (reason instanceof DOMException && reason.name === "AbortError")
        setError("Folder selection cancelled. No project was created.");
      else setError(reason instanceof Error ? reason.message : String(reason));
    } finally {
      setBusy("");
    }
  };
  const createIn = async (selected: CourseDirectoryHandle) => {
    setBusy("Finding an available project name…");
    const name = await nextFirstProjectName(selected);
    setBusy(`Creating ${selected.name}/${name}…`);
    await onCreate(selected, name);
  };
  const create = async () => {
    if (busy) return;
    if (!parent) return chooseParent(true);
    setError("");
    try {
      await createIn(parent);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : String(reason));
    } finally {
      setBusy("");
    }
  };
  return (
    <div
      className="modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="first-project-title"
      onKeyDown={(event) => {
        if (event.key === "Escape" && !busy) onPreview();
      }}
    >
      <form
        className="new-file-dialog"
        onSubmit={(event) => {
          event.preventDefault();
          void create();
        }}
      >
        <h2 id="first-project-title">Create your first Project</h2>
        <p>
          {physicalSelected
            ? "Your commissioned XRP remains selected. Save the starter program in a Project folder. Creating the Project does not start a run."
            : "The Virtual XRP is ready to use without a robot. Save its starter program in a Project folder so edits and run data are retained."}
        </p>
        {needsReconnect && !parent ? (
          <>
            <p>
              A saved Working folder needs access. Reconnect it to find your
              existing work.
            </p>
            <button
              type="button"
              autoFocus
              disabled={Boolean(busy)}
              onClick={onReconnect}
            >
              Reconnect existing work
            </button>
          </>
        ) : null}
        {supportsCourseFolders() ? (
          <>
            <p>
              {parent
                ? `Working folder: ${parent.name}`
                : "Choose Documents or another local folder to contain your Projects. The browser will ask for access."}
            </p>
            {parent ? (
              <button
                type="button"
                disabled={Boolean(busy)}
                onClick={() => void chooseParent(false)}
              >
                Choose a different Working folder
              </button>
            ) : null}
            <p>
              Your Project will be named <code>my_demo_spiral_01</code>, or the
              next unused number, and will contain the Expanding spiral program.
              You can change its display name later using{" "}
              <strong>Rename project</strong>.
            </p>
          </>
        ) : (
          <p>
            Project folders require desktop Chrome or Edge. Preview and source
            export remain available in this browser.
          </p>
        )}
        {busy ? <OperationStatus phase={busy} /> : null}
        {error ? <p role="alert">{error}</p> : null}
        <div className="dialog-actions">
          <button type="button" disabled={Boolean(busy)} onClick={onPreview}>
            Use read-only preview
          </button>
          <button
            type="button"
            disabled={Boolean(busy)}
            onClick={onOpenExisting}
          >
            Open existing Project
          </button>
          {supportsCourseFolders() ? (
            <button
              className="primary-button"
              disabled={Boolean(busy)}
              autoFocus={!needsReconnect}
              type="submit"
            >
              {parent ? "Create Project" : "Choose folder and create Project"}
            </button>
          ) : null}
        </div>
      </form>
    </div>
  );
}
