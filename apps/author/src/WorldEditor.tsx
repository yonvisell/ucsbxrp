import { useEffect, useMemo, useState } from "react";

import {
  addWorld,
  deleteWorld,
  duplicateWorld,
  makeDefaultWorld,
  parseWorldDocument,
  updateWorldIdentity,
  type WorldObjectSelection,
} from "./world-editor-model";
import { WorldEditorCanvas } from "./WorldEditorCanvas";
import { WorldEditorInspector } from "./WorldEditorInspector";

interface WorldEditorProps {
  source: string;
  onChange: (source: string) => void;
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

  const catalog = parsed.document?.catalog ?? null;
  const world =
    catalog?.worlds.find((candidate) => candidate.id === selectedWorldId) ??
    catalog?.worlds[0] ??
    null;
  const activeWorldId = world?.id ?? "";

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
    } catch (error) {
      setMessage(error instanceof Error ? error.message : String(error));
    }
  }

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
            disabled={!catalog}
            onClick={() =>
              run(() => {
                const result = addWorld(source);
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
            disabled={!world}
            onClick={() =>
              run(() => {
                const result = duplicateWorld(source, activeWorldId);
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
            disabled={!world || catalog?.worlds.length === 1}
            onClick={() =>
              run(() => {
                const result = deleteWorld(source, activeWorldId);
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
            disabled={!world || catalog?.defaultWorldId === activeWorldId}
            onClick={() =>
              run(() => onChange(makeDefaultWorld(source, activeWorldId)))
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
                    source,
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
              value={world.label}
              onChange={(event) => {
                const value = event.target.value;
                if (!value.trim()) return;
                run(() => {
                  const result = updateWorldIdentity(
                    source,
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

      {parsed.error ? (
        <div className="world-editor-invalid" role="alert">
          <strong>Graphic editor unavailable.</strong>
          <span>{parsed.error}</span>
          <span>
            The text below is unchanged. Correct it in Advanced world.json to
            restore the graphic editor.
          </span>
        </div>
      ) : (
        world && (
          <div className="world-editor-layout">
            <WorldEditorCanvas
              source={source}
              world={world}
              selection={selection}
              snap={snap}
              onChange={onChange}
              onError={setMessage}
              onSelectionChange={setSelection}
            />
            <WorldEditorInspector
              source={source}
              world={world}
              selection={selection}
              onChange={onChange}
              onError={setMessage}
              onSelectionChange={setSelection}
            />
          </div>
        )
      )}

      {message && (
        <p className="world-editor-message" role="status">
          {message}
        </p>
      )}
      <details className="world-editor-json">
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
        />
      </details>
    </div>
  );
}
