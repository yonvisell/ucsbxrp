import { useEffect, useMemo, useRef, useState } from "react";

import {
  addWorld,
  deleteWorld,
  duplicateWorld,
  makeDefaultWorld,
  parseWorldDocument,
  updateWorldIdentity,
  worldEditorDiagnostic,
  type ParsedWorldDocument,
  type WorldEditorDiagnostic,
  type WorldObjectSelection,
} from "./world-editor-model";
import { WorldEditorCanvas } from "./WorldEditorCanvas";
import { WorldEditorInspector } from "./WorldEditorInspector";

interface WorldEditorProps {
  source: string;
  onChange: (source: string) => void;
}

interface ValidWorldState {
  source: string;
  document: ParsedWorldDocument;
}

function DiagnosticCard({
  title,
  diagnostic,
  actions,
}: {
  title: string;
  diagnostic: WorldEditorDiagnostic;
  actions?: React.ReactNode;
}) {
  return (
    <div className="world-editor-invalid" role="alert">
      <strong>{title}</strong>
      <p>{diagnostic.summary}</p>
      <p>{diagnostic.guidance}</p>
      {actions}
      <details>
        <summary>Technical details</summary>
        <code>{diagnostic.technical}</code>
      </details>
    </div>
  );
}

export function WorldEditor({ source, onChange }: WorldEditorProps) {
  const parsed = useMemo(() => {
    try {
      return { document: parseWorldDocument(source), error: "" };
    } catch (error) {
      return {
        document: null,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }, [source]);
  const [selectedWorldId, setSelectedWorldId] = useState("");
  const [selection, setSelection] = useState<WorldObjectSelection>({
    kind: "initial_pose",
  });
  const [snap, setSnap] = useState(25);
  const [message, setMessage] = useState("");
  const [graphicDiagnostic, setGraphicDiagnostic] =
    useState<WorldEditorDiagnostic | null>(null);
  const [lastValid, setLastValid] = useState<ValidWorldState | null>(() => {
    try {
      return { source, document: parseWorldDocument(source) };
    } catch {
      return null;
    }
  });
  const jsonDetailsRef = useRef<HTMLDetailsElement | null>(null);
  const jsonTextRef = useRef<HTMLTextAreaElement | null>(null);

  const displayed = parsed.document
    ? { source, document: parsed.document }
    : lastValid;
  const catalog = displayed?.document.catalog ?? null;
  const editorSource = displayed?.source ?? source;
  const sourceInvalid = Boolean(parsed.error);
  const world =
    catalog?.worlds.find((candidate) => candidate.id === selectedWorldId) ??
    catalog?.worlds[0] ??
    null;
  const activeWorldId = world?.id ?? "";

  useEffect(() => {
    if (!parsed.document) return;
    setLastValid({ source, document: parsed.document });
  }, [parsed.document, source]);

  useEffect(() => {
    setGraphicDiagnostic(null);
    setMessage("");
  }, [source]);

  useEffect(() => {
    if (!catalog) return;
    if (!catalog.worlds.some((candidate) => candidate.id === selectedWorldId)) {
      setSelectedWorldId(catalog.defaultWorldId);
      setSelection({ kind: "initial_pose" });
    }
  }, [catalog, selectedWorldId]);

  useEffect(() => {
    if (!world) return;
    if (
      (selection.kind === "obstacle" &&
        selection.index >= world.obstacles.length) ||
      (selection.kind === "marker" && selection.index >= world.markers.length)
    ) {
      setSelection({ kind: "initial_pose" });
    }
  }, [selection, world]);

  function run(operation: () => void) {
    try {
      operation();
      setMessage("");
      setGraphicDiagnostic(null);
    } catch (error) {
      setMessage("");
      setGraphicDiagnostic(worldEditorDiagnostic(editorSource, error));
    }
  }

  function reportGraphicError(error: string) {
    setMessage("");
    setGraphicDiagnostic(
      error ? worldEditorDiagnostic(editorSource, error) : null,
    );
  }

  function reviewAdvancedJson() {
    if (jsonDetailsRef.current) jsonDetailsRef.current.open = true;
    jsonTextRef.current?.focus();
  }

  const sourceDiagnostic = parsed.error
    ? worldEditorDiagnostic(source, parsed.error, lastValid?.source)
    : null;

  return (
    <div className="world-editor">
      <div className="world-editor-world-row">
        <label>
          World
          <select
            aria-label="World to edit"
            disabled={!catalog}
            value={activeWorldId}
            onChange={(event) => {
              setSelectedWorldId(event.target.value);
              setSelection({ kind: "initial_pose" });
            }}
          >
            {catalog?.worlds.map((candidate) => (
              <option key={candidate.id} value={candidate.id}>
                {candidate.label}
                {candidate.id === catalog.defaultWorldId ? " · default" : ""}
              </option>
            ))}
          </select>
        </label>
        <div className="world-editor-world-actions">
          <button
            type="button"
            disabled={!catalog || sourceInvalid}
            onClick={() =>
              run(() => {
                const result = addWorld(editorSource);
                onChange(result.source);
                setSelectedWorldId(result.worldId);
                setSelection({ kind: "initial_pose" });
              })
            }
          >
            Add world
          </button>
          <button
            type="button"
            disabled={!world || sourceInvalid}
            onClick={() =>
              run(() => {
                const result = duplicateWorld(editorSource, activeWorldId);
                onChange(result.source);
                setSelectedWorldId(result.worldId);
                setSelection({ kind: "initial_pose" });
              })
            }
          >
            Duplicate
          </button>
          <button
            type="button"
            disabled={!world || sourceInvalid || catalog?.worlds.length === 1}
            onClick={() =>
              run(() => {
                const result = deleteWorld(editorSource, activeWorldId);
                onChange(result.source);
                setSelectedWorldId(result.worldId);
                setSelection({ kind: "initial_pose" });
              })
            }
          >
            Delete
          </button>
          <button
            type="button"
            disabled={
              !world ||
              sourceInvalid ||
              catalog?.defaultWorldId === activeWorldId
            }
            onClick={() =>
              run(() => onChange(makeDefaultWorld(editorSource, activeWorldId)))
            }
          >
            Make default
          </button>
        </div>
      </div>

      {world && (
        <div className="world-editor-identity">
          <label>
            World ID
            <input
              disabled={sourceInvalid}
              pattern="[a-z][a-z0-9_-]*"
              value={world.id}
              onChange={(event) => {
                const value = event.target.value;
                if (!/^[a-z][a-z0-9_-]*$/.test(value)) return;
                if (
                  catalog?.worlds.some(
                    (candidate) =>
                      candidate.id === value && candidate.id !== activeWorldId,
                  )
                ) {
                  setMessage(`World ID '${value}' is already in use.`);
                  return;
                }
                run(() => {
                  const result = updateWorldIdentity(
                    editorSource,
                    activeWorldId,
                    "id",
                    value,
                  );
                  onChange(result.source);
                  setSelectedWorldId(result.worldId);
                });
              }}
            />
          </label>
          <label>
            Display name
            <input
              disabled={sourceInvalid}
              value={world.label}
              onChange={(event) => {
                const value = event.target.value;
                if (!value.trim()) return;
                run(() => {
                  const result = updateWorldIdentity(
                    editorSource,
                    activeWorldId,
                    "label",
                    value,
                  );
                  onChange(result.source);
                });
              }}
            />
          </label>
          <label className="world-editor-snap">
            Snap
            <select
              aria-label="Grid snap"
              value={snap}
              onChange={(event) => setSnap(Number(event.target.value))}
            >
              <option value={0}>Off</option>
              <option value={10}>10 mm</option>
              <option value={25}>25 mm</option>
              <option value={50}>50 mm</option>
              <option value={100}>100 mm</option>
            </select>
          </label>
        </div>
      )}

      {sourceDiagnostic && (
        <DiagnosticCard
          title="World JSON needs attention."
          diagnostic={sourceDiagnostic}
          actions={
            <div className="world-editor-invalid-actions">
              {lastValid && (
                <button
                  type="button"
                  onClick={() => onChange(lastValid.source)}
                >
                  Restore last valid world configuration
                </button>
              )}
              <button type="button" onClick={reviewAdvancedJson}>
                Review Advanced world.json
              </button>
            </div>
          }
        />
      )}

      {graphicDiagnostic && !sourceDiagnostic && (
        <DiagnosticCard
          title="That edit was not applied."
          diagnostic={graphicDiagnostic}
        />
      )}

      {world && (
        <fieldset
          className={`world-editor-layout${sourceInvalid ? " is-read-only" : ""}`}
          disabled={sourceInvalid}
        >
          <WorldEditorCanvas
            source={editorSource}
            world={world}
            selection={selection}
            snap={snap}
            onChange={onChange}
            onError={reportGraphicError}
            onSelectionChange={setSelection}
          />
          <WorldEditorInspector
            source={editorSource}
            world={world}
            selection={selection}
            onChange={onChange}
            onError={reportGraphicError}
            onSelectionChange={setSelection}
          />
        </fieldset>
      )}

      {message && (
        <p className="world-editor-message" role="status">
          {message}
        </p>
      )}
      <details className="world-editor-json" ref={jsonDetailsRef}>
        <summary>Advanced world.json</summary>
        <p>
          The graphic editor and this JSON edit the same project data. Use JSON
          for additional fields; unknown fields are retained by graphic edits.
        </p>
        <textarea
          aria-label="World configuration JSON"
          className="code-input large-code-input"
          rows={18}
          spellCheck={false}
          value={source}
          onChange={(event) => onChange(event.target.value)}
          ref={jsonTextRef}
        />
      </details>
    </div>
  );
}
