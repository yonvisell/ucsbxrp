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
  VirtualTargetClient,
  type TargetEvent,
  type TargetRunState,
} from "@ucsb-xrp/target";

import {
  chooseWorkingFolder,
  loadRecoveredProject,
  normalizedProjectPath,
  projectPathError,
  readProjectFolder,
  storeRecoveredProject,
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

const settingsKey = "ucsb-xrp-ide-settings-v1";
const defaultSettings: IdeSettings = {
  editorFontSize: 11,
  consoleFontSize: 11,
  tabSize: 4,
  wordWrap: "off",
};
const noRunMessage =
  "No run yet. Validate the project, then run it on the virtual XRP.";

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
  const target = useMemo(() => new VirtualTargetClient(), []);
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
  const [consoleEntries, setConsoleEntries] = useState<ConsoleEntry[]>([]);
  const [consoleTab, setConsoleTab] = useState<"status" | "details">("status");
  const [outputPanelOpen, setOutputPanelOpen] = useState(true);
  const [projectPanelOpen, setProjectPanelOpen] = useState(
    initiallyShowProjectPanel,
  );
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settings, setSettings] = useState<IdeSettings>(loadSettings);
  const [newFileOpen, setNewFileOpen] = useState(false);
  const [newFilePath, setNewFilePath] = useState("");
  const [newFileError, setNewFileError] = useState("");
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
    } else {
      initializedProjectEffect.current = true;
    }
  }, [project]);

  useEffect(() => {
    localStorage.setItem(settingsKey, JSON.stringify(settings));
  }, [settings]);

  const canCommand =
    targetState === "ready" ||
    targetState === "running" ||
    targetState === "error";
  const isRunning = targetState === "running" || targetState === "loading";
  const projectFiles = useMemo(
    () => Object.keys(project.files).sort((a, b) => a.localeCompare(b)),
    [project.files],
  );

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

  const runVirtual = useCallback(async () => {
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

  const resetVirtual = useCallback(async () => {
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
      setOperationDetail(`Saving ${Object.keys(project.files).length} files…`);
      await writeProjectFolder(folder, project.files);
      if (!workingFolder) {
        setWorkingFolder(folder);
        setProject((current) => ({ ...current, name: folder.name }));
      }
      setFolderDirty(false);
      setOperationDetail(`Saved all project files to ${folder.name}.`);
    } catch (error) {
      if (!wasCancelled(error)) {
        setOperationDetail(errorDetail(error));
      }
    }
  }, [project.files, workingFolder]);

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

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const command = event.metaKey || event.ctrlKey;
      if (command && event.key.toLowerCase() === "s") {
        event.preventDefault();
        void saveProjectFiles();
      } else if (command && event.key === "Enter" && event.shiftKey) {
        event.preventDefault();
        void validateCode();
      } else if (command && event.key === "Enter") {
        event.preventDefault();
        void runVirtual();
      } else if (command && event.key === ",") {
        event.preventDefault();
        setSettingsOpen((open) => !open);
      } else if (event.key === "Escape") {
        setSettingsOpen(false);
        setNewFileOpen(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [runVirtual, saveProjectFiles, validateCode]);

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
          <button
            disabled={!canCommand || isRunning}
            onClick={validateCode}
            title="Compile all Python files with MicroPython (⌘/Ctrl+Shift+Enter)"
          >
            Validate code
          </button>
          <button
            className="primary-button"
            disabled={!canCommand || isRunning}
            onClick={runVirtual}
            title="Run main.py on the virtual XRP (⌘/Ctrl+Enter)"
          >
            Run virtual XRP
          </button>
          <button
            className="danger-button"
            disabled={!isRunning}
            onClick={stopProgram}
          >
            Stop program
          </button>
          <button disabled={!canCommand} onClick={resetVirtual}>
            Reset virtual XRP
          </button>
          <div className="toolbar-spacer" />
          <a
            className="tool-link"
            href="/dashboard/"
            rel="noopener noreferrer"
            target="_blank"
          >
            XRP Monitor ↗
          </a>
          <a
            className="tool-link"
            href="/guide/"
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
        <div
          className="connection-pill"
          data-testid="target-status"
          title={targetDetail}
        >
          <span className={`status-dot ${targetState}`} />
          <span>Virtual XRP · {targetState}</span>
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
              <button
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
            <div className="file-list">
              {projectFiles.map((path) => (
                <button
                  className={`file-row ${path === activePath ? "active" : ""}`}
                  key={path}
                  onClick={() => openFile(path)}
                  type="button"
                >
                  <span className="file-type-icon">{fileIcon(path)}</span>
                  <span className="file-path">{path}</span>
                </button>
              ))}
            </div>
            <div className="project-storage">
              <span>WORKING FOLDER</span>
              <strong title={storageDetail}>{storageDetail}</strong>
            </div>
            <div className="course-release">
              <span>COURSE RELEASE</span>
              <strong>0.1.0 · Stage 1</strong>
            </div>
          </aside>
        ) : (
          <button
            className="project-reopen"
            onClick={() => setProjectPanelOpen(true)}
            title="Show project files"
          >
            Project files ›
          </button>
        )}

        <section
          className={`editor-stack ${outputPanelOpen ? "" : "output-collapsed"}`}
        >
          <div className="editor-panel panel">
            <div
              className="editor-tabbar"
              role="tablist"
              aria-label="Open files"
            >
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
                  padding: { top: 8 },
                  renderLineHighlight: "gutter",
                  scrollBeyondLastLine: false,
                  stickyScroll: { enabled: false },
                  tabFocusMode: false,
                  tabSize: settings.tabSize,
                  wordWrap: settings.wordWrap,
                }}
                path={activePath}
                theme="vs-dark"
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
                  <small data-testid="check-result">{checkDetail}</small>
                </div>
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
                  <small>{operationDetail}</small>
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
                  <span className="console-placeholder">{noRunMessage}</span>
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
              The RP2350 USB baseline and canonical course library are verified
              on the attached XRP. Physical-target controls will appear after
              the correlated command/telemetry protocol, supervisory device
              service, and Wi-Fi acceptance tests are complete.
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
                <dt>Run virtual XRP</dt>
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
              autoFocus
              id="new-file-path"
              onChange={(event) => {
                setNewFilePath(event.target.value);
                setNewFileError("");
              }}
              placeholder="controllers/straight_line.py"
              value={newFilePath}
            />
            <small className={newFileError ? "dialog-error" : ""}>
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
    </div>
  );
}
