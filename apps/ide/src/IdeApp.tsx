import Editor from "@monaco-editor/react";
import {
  type FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  COURSE_STARTERS,
  PhysicalTargetClient,
  VirtualTargetClient,
  loadTargetPreference,
  storeTargetPreference,
  type TargetClient,
  type TargetEvent,
  type TargetKind,
  type TargetRunState,
} from "@ucsb-xrp/target";

import { OfflineReadiness } from "../../shared/OfflineReadiness";
import {
  chooseWorkingFolder,
  deleteProjectFile,
  duplicateProjectFile,
  loadRecoveredProject,
  normalizedProjectPath,
  projectPathError,
  readProjectFolder,
  removeProjectFolderFiles,
  renameProjectFile,
  setProjectEntrypoint,
  storeRecoveredProject,
  suggestedDuplicatePath,
  supportsWorkingFolders,
  writeProjectFolder,
  type CourseDirectoryHandle,
  type ProjectSnapshot,
} from "./project-files";

interface ConsoleEntry {
  id: number;
  stream: "stdout" | "stderr" | "system";
  line: string;
}

interface IdeSettings {
  editorFontSize: number;
  consoleFontSize: number;
  tabSize: 2 | 4;
  wordWrap: "off" | "on";
}

type PathOperation = "rename" | "duplicate";

const settingsKey = "ucsb-xrp-ide-settings-v1";
const defaultSettings: IdeSettings = {
  editorFontSize: 11,
  consoleFontSize: 11,
  tabSize: 4,
  wordWrap: "off",
};
function loadSettings(): IdeSettings {
  try {
    const raw = localStorage.getItem(settingsKey);
    if (!raw) {
      return defaultSettings;
    }
    const value = JSON.parse(raw) as Partial<IdeSettings>;
    return {
      editorFontSize:
        typeof value.editorFontSize === "number" &&
        value.editorFontSize >= 10 &&
        value.editorFontSize <= 20
          ? value.editorFontSize
          : defaultSettings.editorFontSize,
      consoleFontSize:
        typeof value.consoleFontSize === "number" &&
        value.consoleFontSize >= 9 &&
        value.consoleFontSize <= 16
          ? value.consoleFontSize
          : defaultSettings.consoleFontSize,
      tabSize: value.tabSize === 2 ? 2 : 4,
      wordWrap: value.wordWrap === "on" ? "on" : "off",
    };
  } catch {
    return defaultSettings;
  }
}

function errorDetail(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function wasCancelled(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError";
}

function fileIcon(path: string): string {
  if (path.endsWith(".py")) {
    return "PY";
  }
  if (path.endsWith(".json")) {
    return "{}";
  }
  if (path.endsWith(".md")) {
    return "MD";
  }
  return "TXT";
}

function editorLanguage(path: string): string {
  if (path.endsWith(".py")) {
    return "python";
  }
  if (path.endsWith(".json")) {
    return "json";
  }
  if (path.endsWith(".md")) {
    return "markdown";
  }
  return "plaintext";
}

function initiallyShowProjectPanel(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) {
    return true;
  }
  return window.matchMedia("(min-width: 761px)").matches;
}

export function IdeApp() {
  const initialProject = useMemo(() => loadRecoveredProject(), []);
  const [settings, setSettings] = useState<IdeSettings>(loadSettings);
  const [targetPreference, setTargetPreference] =
    useState(loadTargetPreference);
  const target = useMemo<TargetClient>(
    () =>
      targetPreference.kind === "physical"
        ? new PhysicalTargetClient(targetPreference.physicalEndpoint)
        : new VirtualTargetClient(),
    [targetPreference.kind, targetPreference.physicalEndpoint],
  );
  const [project, setProject] = useState<ProjectSnapshot>(initialProject);
  const [activePath, setActivePath] = useState(initialProject.entrypoint);
  const [openPaths, setOpenPaths] = useState([initialProject.entrypoint]);
  const [workingFolder, setWorkingFolder] =
    useState<CourseDirectoryHandle | null>(null);
  const [folderDirty, setFolderDirty] = useState(false);
  const [operationDetail, setOperationDetail] = useState(
    "Browser recovery is active. Choose Open folder to work in a local project folder.",
  );
  const [targetState, setTargetState] =
    useState<TargetRunState>("disconnected");
  const [targetDetail, setTargetDetail] = useState("Not connected");
  const [checkDetail, setCheckDetail] = useState("Not validated");
  const [checkOk, setCheckOk] = useState<boolean | null>(null);
  const [syncDetail, setSyncDetail] = useState("Not synchronized");
  const [syncOk, setSyncOk] = useState<boolean | null>(null);
  const [consoleEntries, setConsoleEntries] = useState<ConsoleEntry[]>([]);
  const [consoleTab, setConsoleTab] = useState<"status" | "details">("status");
  const [outputPanelOpen, setOutputPanelOpen] = useState(true);
  const [projectPanelOpen, setProjectPanelOpen] = useState(
    initiallyShowProjectPanel,
  );
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [selectedStarterId, setSelectedStarterId] = useState(
    COURSE_STARTERS[0]!.id,
  );
  const [newFileOpen, setNewFileOpen] = useState(false);
  const [newFilePath, setNewFilePath] = useState("");
  const [newFileError, setNewFileError] = useState("");
  const [pathOperation, setPathOperation] = useState<PathOperation | null>(
    null,
  );
  const [pathDraft, setPathDraft] = useState("");
  const [pathOperationError, setPathOperationError] = useState("");
  const [deletePath, setDeletePath] = useState<string | null>(null);
  const [pendingFolderDeletions, setPendingFolderDeletions] = useState(
    () => new Set<string>(),
  );
  const nextConsoleId = useRef(1);
  const initializedProjectEffect = useRef(false);

  useEffect(() => {
    const unsubscribe = target.subscribe((event: TargetEvent) => {
      if (event.type === "status") {
        setTargetState(event.state);
        setTargetDetail(event.detail);
      } else if (event.type === "console") {
        setConsoleEntries((entries) => [
          ...entries.slice(-199),
          {
            id: nextConsoleId.current++,
            stream: event.stream,
            line: event.line,
          },
        ]);
      }
    });
    setTargetState("connecting");
    target.connect().catch((error: unknown) => {
      setTargetState("error");
      setTargetDetail(errorDetail(error));
    });
    return () => {
      unsubscribe();
      target.disconnect();
    };
  }, [target]);

  useEffect(() => {
    storeRecoveredProject(project);
    if (initializedProjectEffect.current) {
      setCheckOk(null);
      setCheckDetail("Changes not validated");
      setSyncOk(null);
      setSyncDetail("Changes not synchronized");
    } else {
      initializedProjectEffect.current = true;
    }
  }, [project]);

  useEffect(() => {
    localStorage.setItem(settingsKey, JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    storeTargetPreference(targetPreference);
  }, [targetPreference]);

  useEffect(() => {
    const updateFromOtherApp = (event: StorageEvent) => {
      if (event.key === "ucsb-xrp-target-v1") {
        setTargetPreference(loadTargetPreference());
      }
    };
    window.addEventListener("storage", updateFromOtherApp);
    return () => window.removeEventListener("storage", updateFromOtherApp);
  }, []);

  const canCommand = targetState === "ready" || targetState === "running";
  const isRunning = targetState === "running" || targetState === "loading";
  const projectFiles = useMemo(
    () => Object.keys(project.files).sort((a, b) => a.localeCompare(b)),
    [project.files],
  );
  const replacementEntrypoint = projectFiles.find(
    (path) => path !== activePath && path.endsWith(".py"),
  );
  const canDeleteActiveFile =
    projectFiles.length > 1 &&
    (activePath !== project.entrypoint || replacementEntrypoint !== undefined);

  const openFile = useCallback((path: string) => {
    setOpenPaths((paths) => (paths.includes(path) ? paths : [...paths, path]));
    setActivePath(path);
  }, []);

  const closeFile = useCallback(
    (path: string) => {
      setOpenPaths((paths) => {
        if (paths.length === 1) {
          return paths;
        }
        const index = paths.indexOf(path);
        const remaining = paths.filter((candidate) => candidate !== path);
        if (path === activePath) {
          setActivePath(
            remaining[Math.min(index, remaining.length - 1)] ??
              project.entrypoint,
          );
        }
        return remaining;
      });
    },
    [activePath, project.entrypoint],
  );

  const updateActiveFile = useCallback(
    (content: string) => {
      setProject((current) => ({
        ...current,
        files: { ...current.files, [activePath]: content },
      }));
      setFolderDirty(true);
      setOperationDetail(
        workingFolder
          ? "Changes are recovered in this browser. Save files to update the working folder."
          : "Changes are recovered in this browser.",
      );
    },
    [activePath, workingFolder],
  );

  const validateCode = useCallback(async () => {
    if (!canCommand || isRunning) {
      return;
    }
    setOutputPanelOpen(true);
    setConsoleTab("status");
    setCheckDetail("Compiling Python project files with MicroPython…");
    try {
      const result = await target.check(project);
      setCheckOk(result.ok);
      setCheckDetail(result.detail);
    } catch (error) {
      setCheckOk(false);
      setCheckDetail(errorDetail(error));
    }
  }, [canCommand, isRunning, project, target]);

  const synchronizeProject = useCallback(async () => {
    if (!canCommand || isRunning) {
      return;
    }
    setOutputPanelOpen(true);
    setConsoleTab("status");
    setSyncDetail("Synchronizing the complete project…");
    try {
      await target.synchronize(project);
      setSyncOk(true);
      setSyncDetail(
        target.kind === "physical"
          ? "The complete project is current on the XRP."
          : "The project is ready for the virtual XRP.",
      );
    } catch (error) {
      setSyncOk(false);
      setSyncDetail(errorDetail(error));
    }
  }, [canCommand, isRunning, project, target]);

  const runTarget = useCallback(async () => {
    if (!canCommand || isRunning) {
      return;
    }
    setOutputPanelOpen(true);
    setConsoleEntries([]);
    setConsoleTab("details");
    try {
      await target.run(project);
    } catch (error) {
      setTargetState("error");
      setTargetDetail(errorDetail(error));
    }
  }, [canCommand, isRunning, project, target]);

  const stopProgram = useCallback(async () => {
    if (!isRunning) {
      return;
    }
    setOutputPanelOpen(true);
    setConsoleTab("details");
    await target.stop();
  }, [isRunning, target]);

  const resetTarget = useCallback(async () => {
    if (!canCommand) {
      return;
    }
    setOutputPanelOpen(true);
    setConsoleTab("status");
    await target.reset();
    setConsoleEntries([]);
  }, [canCommand, target]);

  const openWorkingFolder = useCallback(async () => {
    try {
      const folder = await chooseWorkingFolder();
      setOperationDetail(`Reading ${folder.name}…`);
      const result = await readProjectFolder(folder);
      setWorkingFolder(folder);
      setProject(result.project);
      setActivePath(result.project.entrypoint);
      setOpenPaths([result.project.entrypoint]);
      setFolderDirty(false);
      setPendingFolderDeletions(new Set());
      setCheckOk(null);
      setCheckDetail("Not validated");
      setConsoleEntries([]);
      setOperationDetail(
        `Opened ${folder.name}: ${Object.keys(result.project.files).length} supported file${
          Object.keys(result.project.files).length === 1 ? "" : "s"
        }${result.skipped ? `; ${result.skipped} item${result.skipped === 1 ? "" : "s"} skipped` : ""}.`,
      );
    } catch (error) {
      if (!wasCancelled(error)) {
        setOperationDetail(errorDetail(error));
      }
    }
  }, []);

  const saveProjectFiles = useCallback(async () => {
    try {
      const folder = workingFolder ?? (await chooseWorkingFolder());
      let removedFiles = 0;
      setOperationDetail(`Saving ${Object.keys(project.files).length} files…`);
      await writeProjectFolder(folder, project);
      if (workingFolder && pendingFolderDeletions.size > 0) {
        removedFiles = await removeProjectFolderFiles(
          folder,
          pendingFolderDeletions,
        );
      }
      if (!workingFolder) {
        setWorkingFolder(folder);
        setProject((current) => ({ ...current, name: folder.name }));
      }
      setFolderDirty(false);
      setPendingFolderDeletions(new Set());
      setOperationDetail(
        `Saved ${Object.keys(project.files).length} project file${
          Object.keys(project.files).length === 1 ? "" : "s"
        } to ${folder.name}${
          removedFiles > 0
            ? `; removed ${removedFiles} deleted file${removedFiles === 1 ? "" : "s"}`
            : ""
        }.`,
      );
    } catch (error) {
      if (!wasCancelled(error)) {
        setOperationDetail(errorDetail(error));
      }
    }
  }, [pendingFolderDeletions, project, workingFolder]);

  const loadCourseStarter = useCallback(() => {
    const starter = COURSE_STARTERS.find(
      (candidate) => candidate.id === selectedStarterId,
    );
    if (!starter) {
      return;
    }
    const snapshot: ProjectSnapshot = {
      name: starter.id.replace("_", "-"),
      entrypoint: starter.project.entrypoint,
      files: { ...starter.project.files },
    };
    setProject(snapshot);
    setActivePath(snapshot.entrypoint);
    setOpenPaths([snapshot.entrypoint]);
    setWorkingFolder(null);
    setPendingFolderDeletions(new Set());
    setFolderDirty(true);
    setCheckOk(null);
    setCheckDetail("Not validated");
    setSyncOk(null);
    setSyncDetail("Not synchronized");
    setConsoleEntries([]);
    setOperationDetail(
      `${starter.label} loaded. Choose Save files to create its working folder.`,
    );
  }, [selectedStarterId]);

  const createFile = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const error = projectPathError(newFilePath);
      if (error) {
        setNewFileError(error);
        return;
      }
      const path = normalizedProjectPath(newFilePath);
      if (path in project.files) {
        setNewFileError("That file already exists.");
        return;
      }
      setProject((current) => ({
        ...current,
        files: { ...current.files, [path]: "" },
      }));
      setPendingFolderDeletions((current) => {
        const next = new Set(current);
        next.delete(path);
        return next;
      });
      setFolderDirty(true);
      setNewFileOpen(false);
      setNewFilePath("");
      setNewFileError("");
      setOperationDetail(
        `${path} created in browser recovery. Save files to write it to the working folder.`,
      );
      openFile(path);
    },
    [newFilePath, openFile, project.files],
  );

  const beginPathOperation = useCallback(
    (operation: PathOperation) => {
      setPathOperation(operation);
      setPathDraft(
        operation === "rename"
          ? activePath
          : suggestedDuplicatePath(activePath, project.files),
      );
      setPathOperationError("");
    },
    [activePath, project.files],
  );

  const applyPathOperation = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!pathOperation) {
        return;
      }
      try {
        const nextPath = normalizedProjectPath(pathDraft);
        const nextProject =
          pathOperation === "rename"
            ? renameProjectFile(project, activePath, nextPath)
            : duplicateProjectFile(project, activePath, nextPath);
        setProject(nextProject);
        setPendingFolderDeletions((current) => {
          const next = new Set(current);
          next.delete(nextPath);
          if (pathOperation === "rename") {
            next.add(activePath);
          }
          return next;
        });
        if (pathOperation === "rename") {
          setOpenPaths((paths) =>
            paths.map((path) => (path === activePath ? nextPath : path)),
          );
        } else {
          setOpenPaths((paths) =>
            paths.includes(nextPath) ? paths : [...paths, nextPath],
          );
        }
        setActivePath(nextPath);
        setFolderDirty(true);
        setOperationDetail(
          pathOperation === "rename"
            ? `Renamed ${activePath} to ${nextPath}. Save files to update the working folder.`
            : `Duplicated ${activePath} as ${nextPath}. Save files to write the copy.`,
        );
        setPathOperation(null);
        setPathDraft("");
        setPathOperationError("");
      } catch (error) {
        setPathOperationError(errorDetail(error));
      }
    },
    [activePath, pathDraft, pathOperation, project],
  );

  const confirmDeleteFile = useCallback(() => {
    if (!deletePath) {
      return;
    }
    try {
      const nextProject = deleteProjectFile(project, deletePath);
      setProject(nextProject);
      setPendingFolderDeletions((current) => new Set([...current, deletePath]));
      setOpenPaths((paths) => {
        const remaining = paths.filter((path) => path !== deletePath);
        return remaining.length > 0 ? remaining : [nextProject.entrypoint];
      });
      if (activePath === deletePath) {
        setActivePath(nextProject.entrypoint);
      }
      setFolderDirty(true);
      setOperationDetail(
        `${deletePath} removed from the project. Save files to remove it from the working folder.`,
      );
      setDeletePath(null);
    } catch (error) {
      setOperationDetail(errorDetail(error));
      setDeletePath(null);
    }
  }, [activePath, deletePath, project]);

  const useActiveFileAsEntrypoint = useCallback(() => {
    try {
      setProject((current) => setProjectEntrypoint(current, activePath));
      setFolderDirty(true);
      setOperationDetail(
        `${activePath} is now the startup file. Save files to preserve this setting with the working folder.`,
      );
    } catch (error) {
      setOperationDetail(errorDetail(error));
    }
  }, [activePath]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSettingsOpen(false);
        setNewFileOpen(false);
        setPathOperation(null);
        setDeletePath(null);
        return;
      }
      if (newFileOpen || pathOperation || deletePath) {
        return;
      }
      const command = event.metaKey || event.ctrlKey;
      if (command && event.key.toLowerCase() === "s") {
        event.preventDefault();
        void saveProjectFiles();
      } else if (command && event.key === "Enter" && event.shiftKey) {
        event.preventDefault();
        void validateCode();
      } else if (command && event.key === "Enter") {
        event.preventDefault();
        void runTarget();
      } else if (command && event.key === ",") {
        event.preventDefault();
        setSettingsOpen((open) => !open);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [
    deletePath,
    newFileOpen,
    pathOperation,
    runTarget,
    saveProjectFiles,
    validateCode,
  ]);

  useEffect(() => {
    if (!newFileOpen && !pathOperation && !deletePath) {
      return;
    }
    const keepFocusInDialog = (event: KeyboardEvent) => {
      if (event.key !== "Tab") {
        return;
      }
      const dialog = document.querySelector<HTMLElement>(
        '.modal-backdrop[aria-modal="true"]',
      );
      const controls = dialog
        ? Array.from(
            dialog.querySelectorAll<HTMLElement>(
              'button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])',
            ),
          )
        : [];
      if (controls.length === 0) {
        return;
      }
      const first = controls[0]!;
      const last = controls[controls.length - 1]!;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", keepFocusInDialog);
    return () => window.removeEventListener("keydown", keepFocusInDialog);
  }, [deletePath, newFileOpen, pathOperation]);

  const storageDetail = workingFolder
    ? `${workingFolder.name}${folderDirty ? " · folder has unsaved changes" : " · folder current"}`
    : folderDirty
      ? "Browser recovery only · choose Save files to select a folder"
      : "Browser recovery only";

  return (
    <div className="app-shell ide-app">
      <header className="app-header">
        <div className="brand" aria-label="UCSB XRP IDE">
          <span className="brand-mark">UCSB</span>
          <span className="brand-name">XRP IDE</span>
        </div>
        <div className="toolbar" role="toolbar" aria-label="Project commands">
          <select
            aria-label="Execution target"
            className="target-select"
            onChange={(event) =>
              setTargetPreference((current) => ({
                ...current,
                kind: event.target.value as TargetKind,
              }))
            }
            value={targetPreference.kind}
          >
            <option value="virtual">Virtual XRP</option>
            <option value="physical">Physical XRP</option>
          </select>
          <button
            disabled={!canCommand || isRunning}
            onClick={validateCode}
            title="Compile all Python files with MicroPython (⌘/Ctrl+Shift+Enter)"
          >
            Validate code
          </button>
          {target.kind === "physical" ? (
            <button
              disabled={!canCommand || isRunning}
              onClick={synchronizeProject}
              title="Transfer the complete project to the physical XRP"
            >
              Sync project
            </button>
          ) : null}
          <button
            className="primary-button"
            disabled={!canCommand || isRunning}
            onClick={runTarget}
            title={`Run ${project.entrypoint} on the ${target.kind} XRP (⌘/Ctrl+Enter)`}
          >
            {target.kind === "virtual" ? "Run virtual XRP" : "Run on XRP"}
          </button>
          <button
            className="danger-button"
            disabled={!isRunning}
            onClick={stopProgram}
          >
            Stop program
          </button>
          <button disabled={!canCommand} onClick={resetTarget}>
            {target.kind === "virtual" ? "Reset virtual XRP" : "Reset XRP"}
          </button>
          <div className="toolbar-spacer" />
          <a
            className="tool-link"
            href="../dashboard/"
            rel="noopener noreferrer"
            target="_blank"
          >
            XRP Monitor ↗
          </a>
          <a
            className="tool-link"
            href="../guide/"
            rel="noopener noreferrer"
            target="_blank"
          >
            Help &amp; robot setup ↗
          </a>
          <button
            aria-expanded={settingsOpen}
            className="quiet-button"
            onClick={() => setSettingsOpen((open) => !open)}
            title="IDE settings (⌘/Ctrl+,)"
          >
            Settings
          </button>
        </div>
        <div className="header-statuses">
          <OfflineReadiness />
          <div
            aria-live="polite"
            className="connection-pill"
            data-testid="target-status"
            role="status"
            title={targetDetail}
          >
            <span aria-hidden="true" className={`status-dot ${targetState}`} />
            <span>
              {target.kind === "virtual" ? "Virtual XRP" : "Physical XRP"} ·{" "}
              {targetState}
            </span>
          </div>
        </div>
      </header>

      <main
        className={`ide-workspace ${projectPanelOpen ? "" : "project-collapsed"}`}
      >
        {projectPanelOpen ? (
          <aside className="project-rail panel" aria-label="Project files">
            <div className="panel-header project-heading">
              <h2 className="panel-title">Project files</h2>
              <button
                aria-label="Collapse project files"
                className="icon-button"
                onClick={() => setProjectPanelOpen(false)}
                title="Collapse project files"
              >
                ‹
              </button>
            </div>
            <div className="project-actions">
              <div className="starter-actions">
                <select
                  aria-label="Course starter"
                  onChange={(event) => setSelectedStarterId(event.target.value)}
                  value={selectedStarterId}
                >
                  {COURSE_STARTERS.map((starter) => (
                    <option key={starter.id} value={starter.id}>
                      {starter.shortLabel}
                    </option>
                  ))}
                </select>
                <button
                  onClick={loadCourseStarter}
                  title="Start a fresh browser-recovered project from this course challenge"
                >
                  Load starter
                </button>
              </div>
              <button
                className="open-folder-button"
                disabled={!supportsWorkingFolders()}
                onClick={openWorkingFolder}
                title="Open a local folder with read and write access"
              >
                Open folder
              </button>
              <button
                onClick={() => {
                  setNewFileOpen(true);
                  setNewFileError("");
                }}
              >
                New file
              </button>
              <button
                onClick={saveProjectFiles}
                title="Save all files to the working folder (⌘/Ctrl+S)"
              >
                Save files
              </button>
            </div>
            <div className="project-name" title={project.name}>
              {project.name}
            </div>
            <div
              className="file-actions"
              aria-label={`Actions for ${activePath}`}
            >
              <button onClick={() => beginPathOperation("rename")}>
                Rename
              </button>
              <button onClick={() => beginPathOperation("duplicate")}>
                Duplicate
              </button>
              <button
                disabled={
                  activePath === project.entrypoint ||
                  !activePath.endsWith(".py")
                }
                onClick={useActiveFileAsEntrypoint}
                title={
                  !activePath.endsWith(".py")
                    ? "Only Python files can be startup files"
                    : activePath === project.entrypoint
                      ? "This is already the startup file"
                      : `Run ${activePath} when the project starts`
                }
              >
                {activePath === project.entrypoint
                  ? "Startup file"
                  : "Use as startup"}
              </button>
              <button
                className="danger-button"
                disabled={!canDeleteActiveFile}
                onClick={() => setDeletePath(activePath)}
                title={
                  canDeleteActiveFile
                    ? `Delete ${activePath} from the project`
                    : "A project must retain a Python startup file"
                }
              >
                Delete
              </button>
            </div>
            <div className="startup-file" title={project.entrypoint}>
              Starts with <strong>{project.entrypoint}</strong>
            </div>
            <div className="file-list">
              {projectFiles.map((path) => (
                <button
                  aria-label={`Open ${path}${
                    path === project.entrypoint ? " (startup file)" : ""
                  }`}
                  aria-current={path === activePath ? "true" : undefined}
                  className={`file-row ${path === activePath ? "active" : ""}`}
                  key={path}
                  onClick={() => openFile(path)}
                  type="button"
                >
                  <span className="file-type-icon">{fileIcon(path)}</span>
                  <span className="file-path">{path}</span>
                  {path === project.entrypoint ? (
                    <span className="startup-badge">START</span>
                  ) : null}
                </button>
              ))}
            </div>
            <div className="project-storage">
              <span>WORKING FOLDER</span>
              <strong title={storageDetail}>{storageDetail}</strong>
            </div>
            <div className="course-release">
              <span>COURSE RELEASE</span>
              <strong>UCSB-XRP 0.2.0-dev</strong>
            </div>
          </aside>
        ) : null}

        <section
          className={`editor-stack ${outputPanelOpen ? "" : "output-collapsed"}`}
        >
          <div className="editor-panel panel">
            <div
              className="editor-tabbar"
              role="tablist"
              aria-label="Open files"
            >
              {!projectPanelOpen ? (
                <button
                  className="project-reopen"
                  onClick={() => setProjectPanelOpen(true)}
                  title="Show project files"
                >
                  Project files ›
                </button>
              ) : null}
              {openPaths.map((path) => (
                <div
                  className={`editor-tab ${path === activePath ? "active" : ""}`}
                  key={path}
                  role="presentation"
                >
                  <button
                    aria-selected={path === activePath}
                    className="tab-select"
                    onClick={() => setActivePath(path)}
                    role="tab"
                    title={path}
                  >
                    <span className="file-type-icon">{fileIcon(path)}</span>
                    <span>{path.split("/").at(-1)}</span>
                  </button>
                  <button
                    aria-label={`Close ${path}`}
                    className="tab-close"
                    disabled={openPaths.length === 1}
                    onClick={() => closeFile(path)}
                    title={`Close ${path}`}
                  >
                    ×
                  </button>
                </div>
              ))}
              <span className="autosave-label">
                {folderDirty ? "Recovered · folder not saved" : "Recovered"}
              </span>
            </div>
            <div className="editor-frame" data-testid="python-editor">
              <Editor
                language={editorLanguage(activePath)}
                onChange={(value) => updateActiveFile(value ?? "")}
                options={{
                  ariaLabel: `${activePath} editor`,
                  automaticLayout: true,
                  detectIndentation: false,
                  fontFamily: "SFMono-Regular, Consolas, monospace",
                  fontSize: settings.editorFontSize,
                  insertSpaces: true,
                  lineHeight: Math.round(settings.editorFontSize * 1.65),
                  minimap: { enabled: false },
                  padding: { top: 5 },
                  renderLineHighlight: "gutter",
                  scrollBeyondLastLine: false,
                  stickyScroll: { enabled: false },
                  tabFocusMode: false,
                  tabSize: settings.tabSize,
                  wordWrap: settings.wordWrap,
                }}
                path={activePath}
                theme="vs"
                value={project.files[activePath] ?? ""}
              />
            </div>
          </div>

          <section
            className={`console-panel panel ${outputPanelOpen ? "" : "collapsed"}`}
            aria-label="Run information"
          >
            <div className="console-header">
              <div
                className="console-tabs"
                role="tablist"
                aria-label="Run information"
              >
                <button
                  aria-selected={consoleTab === "status"}
                  className={consoleTab === "status" ? "active" : ""}
                  onClick={() => {
                    setConsoleTab("status");
                    setOutputPanelOpen(true);
                  }}
                  role="tab"
                >
                  Status
                </button>
                <button
                  aria-selected={consoleTab === "details"}
                  className={consoleTab === "details" ? "active" : ""}
                  onClick={() => {
                    setConsoleTab("details");
                    setOutputPanelOpen(true);
                  }}
                  role="tab"
                >
                  Details
                  {consoleEntries.length > 0
                    ? ` (${consoleEntries.length})`
                    : ""}
                </button>
              </div>
              <div className="console-actions">
                {outputPanelOpen && consoleTab === "details" ? (
                  <button
                    className="clear-output"
                    disabled={consoleEntries.length === 0}
                    onClick={() => setConsoleEntries([])}
                  >
                    Clear output
                  </button>
                ) : null}
                <button
                  aria-expanded={outputPanelOpen}
                  className="output-toggle"
                  onClick={() => setOutputPanelOpen((open) => !open)}
                >
                  {outputPanelOpen ? "Collapse output" : "Expand output"}
                </button>
              </div>
            </div>
            {outputPanelOpen && consoleTab === "status" ? (
              <div className="status-grid" role="tabpanel">
                <div>
                  <span>Target</span>
                  <strong>{targetState}</strong>
                  <small>{targetDetail}</small>
                </div>
                <div>
                  <span>Validation</span>
                  <strong
                    className={
                      checkOk === true
                        ? "pass"
                        : checkOk === false
                          ? "fail"
                          : ""
                    }
                  >
                    {checkOk === true
                      ? "Passed"
                      : checkOk === false
                        ? "Failed"
                        : "Not current"}
                  </strong>
                  <small aria-live="polite" data-testid="check-result">
                    {checkDetail}
                  </small>
                </div>
                {target.kind === "physical" ? (
                  <div>
                    <span>Physical project</span>
                    <strong
                      className={
                        syncOk === true
                          ? "pass"
                          : syncOk === false
                            ? "fail"
                            : ""
                      }
                    >
                      {syncOk === true
                        ? "Synchronized"
                        : syncOk === false
                          ? "Sync failed"
                          : "Not current"}
                    </strong>
                    <small aria-live="polite">{syncDetail}</small>
                  </div>
                ) : null}
                <div>
                  <span>Project</span>
                  <strong>
                    {projectFiles.length} file
                    {projectFiles.length === 1 ? "" : "s"}
                  </strong>
                  <small>{storageDetail}</small>
                </div>
                <div>
                  <span>File operation</span>
                  <strong>
                    {workingFolder ? workingFolder.name : "Recovery"}
                  </strong>
                  <small aria-live="polite">{operationDetail}</small>
                </div>
              </div>
            ) : outputPanelOpen ? (
              <div
                className="console-output"
                role="log"
                aria-live="polite"
                style={{ fontSize: `${settings.consoleFontSize}px` }}
              >
                {consoleEntries.length === 0 ? (
                  <span className="console-placeholder">
                    No run yet. Validate the project, then run it on the{" "}
                    {target.kind === "virtual" ? "virtual" : "physical"} XRP.
                  </span>
                ) : (
                  consoleEntries.map((entry) => (
                    <div
                      className={`console-line ${entry.stream}`}
                      key={entry.id}
                    >
                      <span className="console-marker">
                        {entry.stream === "stderr"
                          ? "!"
                          : entry.stream === "system"
                            ? "•"
                            : "›"}
                      </span>
                      <span>{entry.line}</span>
                    </div>
                  ))
                )}
              </div>
            ) : null}
          </section>
        </section>
      </main>

      {settingsOpen ? (
        <aside
          aria-label="IDE settings"
          className="settings-drawer"
          data-testid="settings-panel"
        >
          <div className="settings-heading">
            <div>
              <span>IDE</span>
              <h2>Settings</h2>
            </div>
            <button
              aria-label="Close settings"
              className="icon-button"
              onClick={() => setSettingsOpen(false)}
            >
              ×
            </button>
          </div>
          <label className="setting-row">
            <span>Execution target</span>
            <select
              onChange={(event) =>
                setTargetPreference((current) => ({
                  ...current,
                  kind: event.target.value as TargetKind,
                }))
              }
              value={targetPreference.kind}
            >
              <option value="virtual">Virtual XRP</option>
              <option value="physical">Physical XRP</option>
            </select>
          </label>
          {targetPreference.kind === "physical" ? (
            <label className="setting-row">
              <span>Physical XRP address</span>
              <input
                aria-describedby="physical-address-help"
                defaultValue={targetPreference.physicalEndpoint}
                onBlur={(event) =>
                  setTargetPreference((current) => ({
                    ...current,
                    physicalEndpoint: event.target.value,
                  }))
                }
                spellCheck={false}
                type="url"
              />
              <small id="physical-address-help">
                Setup reports this address. It is shared with XRP Monitor.
              </small>
            </label>
          ) : null}
          <label className="setting-row">
            <span>
              Editor font size <strong>{settings.editorFontSize} px</strong>
            </span>
            <input
              max="20"
              min="10"
              onChange={(event) =>
                setSettings((current) => ({
                  ...current,
                  editorFontSize: Number(event.target.value),
                }))
              }
              type="range"
              value={settings.editorFontSize}
            />
          </label>
          <label className="setting-row">
            <span>
              Output font size <strong>{settings.consoleFontSize} px</strong>
            </span>
            <input
              max="16"
              min="9"
              onChange={(event) =>
                setSettings((current) => ({
                  ...current,
                  consoleFontSize: Number(event.target.value),
                }))
              }
              type="range"
              value={settings.consoleFontSize}
            />
          </label>
          <label className="setting-row">
            <span>Indent width</span>
            <select
              onChange={(event) =>
                setSettings((current) => ({
                  ...current,
                  tabSize: Number(event.target.value) === 2 ? 2 : 4,
                }))
              }
              value={settings.tabSize}
            >
              <option value="2">2 spaces</option>
              <option value="4">4 spaces</option>
            </select>
          </label>
          <label className="setting-row">
            <span>Long lines</span>
            <select
              onChange={(event) =>
                setSettings((current) => ({
                  ...current,
                  wordWrap: event.target.value === "on" ? "on" : "off",
                }))
              }
              value={settings.wordWrap}
            >
              <option value="off">Scroll horizontally</option>
              <option value="on">Wrap in editor</option>
            </select>
          </label>
          <section className="settings-note">
            <h3>Target connection</h3>
            <p>
              Virtual and physical targets use the same project. On a physical
              XRP, validate, synchronize the complete project, then run. USB is
              used only for setup or repair; ordinary work uses the shared LAN.
            </p>
          </section>
          <section className="settings-note shortcuts-note">
            <h3>Shortcuts</h3>
            <dl>
              <div>
                <dt>Save files</dt>
                <dd>⌘/Ctrl+S</dd>
              </div>
              <div>
                <dt>Validate code</dt>
                <dd>⌘/Ctrl+Shift+Enter</dd>
              </div>
              <div>
                <dt>Run selected target</dt>
                <dd>⌘/Ctrl+Enter</dd>
              </div>
              <div>
                <dt>Settings</dt>
                <dd>⌘/Ctrl+,</dd>
              </div>
            </dl>
          </section>
        </aside>
      ) : null}

      {newFileOpen ? (
        <div
          aria-labelledby="new-file-title"
          aria-modal="true"
          className="modal-backdrop"
          role="dialog"
        >
          <form className="new-file-dialog" onSubmit={createFile}>
            <span className="dialog-kicker">PROJECT</span>
            <h2 id="new-file-title">Create a file</h2>
            <label htmlFor="new-file-path">Project-relative path</label>
            <input
              aria-describedby="new-file-help"
              aria-invalid={newFileError ? "true" : undefined}
              autoFocus
              id="new-file-path"
              onChange={(event) => {
                setNewFilePath(event.target.value);
                setNewFileError("");
              }}
              placeholder="controllers/straight_line.py"
              value={newFilePath}
            />
            <small
              aria-live="polite"
              className={newFileError ? "dialog-error" : ""}
              id="new-file-help"
            >
              {newFileError ||
                "Folders in the path are created when the project is saved."}
            </small>
            <div className="dialog-actions">
              <button
                onClick={() => {
                  setNewFileOpen(false);
                  setNewFilePath("");
                  setNewFileError("");
                }}
                type="button"
              >
                Cancel
              </button>
              <button className="primary-button" type="submit">
                Create file
              </button>
            </div>
          </form>
        </div>
      ) : null}

      {pathOperation ? (
        <div
          aria-labelledby="file-operation-title"
          aria-modal="true"
          className="modal-backdrop"
          role="dialog"
        >
          <form className="new-file-dialog" onSubmit={applyPathOperation}>
            <span className="dialog-kicker">PROJECT FILE</span>
            <h2 id="file-operation-title">
              {pathOperation === "rename" ? "Rename file" : "Duplicate file"}
            </h2>
            <p className="dialog-context">
              {pathOperation === "rename"
                ? `Choose a new path for ${activePath}.`
                : `Choose a path for the copy of ${activePath}.`}
            </p>
            <label htmlFor="file-operation-path">Project-relative path</label>
            <input
              aria-describedby="file-operation-help"
              aria-invalid={pathOperationError ? "true" : undefined}
              autoFocus
              id="file-operation-path"
              onChange={(event) => {
                setPathDraft(event.target.value);
                setPathOperationError("");
              }}
              value={pathDraft}
            />
            <small
              aria-live="polite"
              className={pathOperationError ? "dialog-error" : ""}
              id="file-operation-help"
            >
              {pathOperationError ||
                "Use a path inside the project, such as student/controller.py."}
            </small>
            <div className="dialog-actions">
              <button
                onClick={() => {
                  setPathOperation(null);
                  setPathDraft("");
                  setPathOperationError("");
                }}
                type="button"
              >
                Cancel
              </button>
              <button className="primary-button" type="submit">
                {pathOperation === "rename" ? "Rename file" : "Create copy"}
              </button>
            </div>
          </form>
        </div>
      ) : null}

      {deletePath ? (
        <div
          aria-labelledby="delete-file-title"
          aria-modal="true"
          className="modal-backdrop"
          role="alertdialog"
        >
          <div className="new-file-dialog">
            <span className="dialog-kicker">CONFIRM DELETION</span>
            <h2 id="delete-file-title">Delete {deletePath}?</h2>
            <p className="dialog-context">
              This removes the file from browser recovery now. Select Save files
              to remove the same file from the current working folder.
              {deletePath === project.entrypoint && replacementEntrypoint
                ? ` ${replacementEntrypoint} will become the startup file.`
                : ""}
            </p>
            <div className="dialog-actions">
              <button
                autoFocus
                onClick={() => setDeletePath(null)}
                type="button"
              >
                Keep file
              </button>
              <button
                className="danger-button confirm-danger"
                onClick={confirmDeleteFile}
                type="button"
              >
                Delete file
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
