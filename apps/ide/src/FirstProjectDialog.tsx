import { useEffect, useState } from "react";
import {
  chooseWorkspaceFolder,
  requireWorkingFolderParent,
  supportsCourseFolders,
  type CourseDirectoryHandle,
} from "../../shared/course-folder";
import { OperationStatus } from "../../shared/OperationStatus";
import {
  isCourseRepositoryFolder,
  projectFolderNameError,
} from "./project-files";
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
  const [name, setName] = useState("XRP_Project_01");
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  useEffect(() => {
    if (!parent) return;
    let active = true;
    setBusy("Checking available project names…");
    void nextFirstProjectName(parent)
      .then((available) => {
        if (active) setName(available);
      })
      .catch((reason: unknown) => {
        if (active) setError(String(reason));
      })
      .finally(() => {
        if (active) setBusy("");
      });
    return () => {
      active = false;
    };
  }, [parent]);

  const chooseParent = async () => {
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
    } catch (reason) {
      if (reason instanceof DOMException && reason.name === "AbortError")
        setError("Folder selection cancelled. No project was created.");
      else setError(reason instanceof Error ? reason.message : String(reason));
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
          if (!parent || busy) return;
          const invalid = projectFolderNameError(name);
          if (invalid) {
            setError(invalid);
            return;
          }
          setError("");
          setBusy(`Creating ${parent.name}/${name}…`);
          void onCreate(parent, name)
            .catch((reason: unknown) =>
              setError(
                reason instanceof Error ? reason.message : String(reason),
              ),
            )
            .finally(() => setBusy(""));
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
            <button type="button" autoFocus onClick={onReconnect}>
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
            <button
              type="button"
              autoFocus={!needsReconnect}
              disabled={Boolean(busy)}
              onClick={() => void chooseParent()}
            >
              {parent
                ? "Choose a different Working folder"
                : "Choose Working folder"}
            </button>
            {parent ? (
              <>
                <label className="dialog-field">
                  Project folder name
                  <input
                    value={name}
                    disabled={Boolean(busy)}
                    onChange={(event) => setName(event.target.value)}
                  />
                </label>
                <p>
                  Creates {parent.name}/{name}. Includes the Expanding spiral
                  program.
                </p>
              </>
            ) : null}
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
          {parent ? (
            <button
              className="primary-button"
              disabled={Boolean(busy)}
              type="submit"
            >
              Create Project
            </button>
          ) : null}
        </div>
      </form>
    </div>
  );
}
