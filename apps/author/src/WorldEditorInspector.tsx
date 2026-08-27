import { useState } from "react";

import type { WorldDefinition, WorldObstacle } from "@ucsb-xrp/simulator";

import {
  addWorldItem,
  deleteWorldItem,
  reorderWaypoint,
  updateWorldNumber,
  updateWorldText,
  worldItemLabel,
  worldSelectionValues,
  type WorldAddItemType,
  type WorldObjectSelection,
} from "./world-editor-model";

interface WorldEditorInspectorProps {
  source: string;
  world: WorldDefinition;
  selection: WorldObjectSelection;
  onChange: (source: string) => void;
  onError: (message: string) => void;
  onSelectionChange: (selection: WorldObjectSelection) => void;
}

function NumberField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <label>
      {label}
      <input
        inputMode="decimal"
        type="number"
        value={Number.isFinite(value) ? value : ""}
        onChange={(event) => {
          const next = event.currentTarget.valueAsNumber;
          if (Number.isFinite(next)) onChange(next);
        }}
      />
    </label>
  );
}

export function WorldEditorInspector({
  source,
  world,
  selection,
  onChange,
  onError,
  onSelectionChange,
}: WorldEditorInspectorProps) {
  const [addType, setAddType] = useState<WorldAddItemType>("wall");
  const selectedItem =
    selection.kind === "obstacle"
      ? world.obstacles[selection.index]
      : selection.kind === "marker"
        ? world.markers[selection.index]
        : null;
  const selectedValues = worldSelectionValues(world, selection);

  function run(operation: () => void) {
    try {
      operation();
      onError("");
    } catch (error) {
      onError(error instanceof Error ? error.message : String(error));
    }
  }

  function changeNumber(field: string, value: number) {
    run(() =>
      onChange(updateWorldNumber(source, world.id, selection, field, value)),
    );
  }

  return (
    <aside className="world-editor-inspector">
      <div className="world-editor-add-row">
        <select
          aria-label="World item type"
          value={addType}
          onChange={(event) =>
            setAddType(event.target.value as WorldAddItemType)
          }
        >
          <option value="wall">Wall</option>
          <option value="block">Block</option>
          <option value="start_line">Start line</option>
          <option value="finish_line">Finish line</option>
          <option value="start_box">Start box</option>
          <option value="finish_box">Finish box</option>
          <option value="waypoint">Waypoint</option>
          <option value="marker">Visual marker</option>
        </select>
        <button
          type="button"
          onClick={() =>
            run(() => {
              const result = addWorldItem(source, world.id, addType);
              onChange(result.source);
              onSelectionChange(result.selection);
            })
          }
        >
          Add item
        </button>
      </div>
      <div className="world-editor-object-list" aria-label="World items">
        <button
          className={selection.kind === "bounds" ? "is-selected" : ""}
          type="button"
          onClick={() => onSelectionChange({ kind: "bounds" })}
        >
          Arena bounds
        </button>
        <button
          className={selection.kind === "initial_pose" ? "is-selected" : ""}
          type="button"
          onClick={() => onSelectionChange({ kind: "initial_pose" })}
        >
          Initial XRP pose
        </button>
        {world.obstacles.map((obstacle, index) => (
          <button
            className={
              selection.kind === "obstacle" && selection.index === index
                ? "is-selected"
                : ""
            }
            key={`obstacle-list-${index}`}
            type="button"
            onClick={() => onSelectionChange({ kind: "obstacle", index })}
          >
            {worldItemLabel(obstacle, index)}
          </button>
        ))}
        {world.markers.map((marker, index) => (
          <button
            className={
              selection.kind === "marker" && selection.index === index
                ? "is-selected"
                : ""
            }
            key={`marker-list-${index}`}
            type="button"
            onClick={() => onSelectionChange({ kind: "marker", index })}
          >
            {worldItemLabel(marker, index)}
          </button>
        ))}
      </div>

      <div className="world-editor-properties">
        <h3>
          {selection.kind === "bounds"
            ? "Arena bounds"
            : selection.kind === "initial_pose"
              ? "Initial XRP pose"
              : selectedItem
                ? worldItemLabel(
                    selectedItem,
                    "index" in selection ? selection.index : 0,
                  )
                : "Item"}
        </h3>
        {selectedItem &&
          (selection.kind === "obstacle" || selection.kind === "marker") && (
            <div className="world-editor-text-properties">
              <label>
                {selection.kind === "obstacle" ? "Feature name" : "Name"}
                <input
                  value={
                    selection.kind === "obstacle"
                      ? ((selectedItem as WorldObstacle).feature ?? "")
                      : "name" in selectedItem
                        ? (selectedItem.name ?? "")
                        : ""
                  }
                  onChange={(event) =>
                    run(() =>
                      onChange(
                        updateWorldText(
                          source,
                          world.id,
                          selection,
                          selection.kind === "obstacle" ? "feature" : "name",
                          event.target.value,
                        ),
                      ),
                    )
                  }
                />
              </label>
              <label>
                Label
                <input
                  value={selectedItem.label ?? ""}
                  onChange={(event) =>
                    run(() =>
                      onChange(
                        updateWorldText(
                          source,
                          world.id,
                          selection,
                          "label",
                          event.target.value,
                        ),
                      ),
                    )
                  }
                />
              </label>
            </div>
          )}
        <div className="world-editor-number-grid">
          {Object.entries(selectedValues).map(([field, value]) => (
            <NumberField
              key={field}
              label={field.replaceAll("_", " ")}
              value={value}
              onChange={(next) => changeNumber(field, next)}
            />
          ))}
        </div>
        {selection.kind === "marker" &&
          world.markers[selection.index]?.type === "waypoint" && (
            <div className="world-editor-reorder">
              <span>Route order</span>
              <button
                type="button"
                onClick={() =>
                  run(() => {
                    const result = reorderWaypoint(
                      source,
                      world.id,
                      selection.index,
                      -1,
                    );
                    onChange(result.source);
                    onSelectionChange({
                      kind: "marker",
                      index: result.markerIndex,
                    });
                  })
                }
              >
                Earlier
              </button>
              <button
                type="button"
                onClick={() =>
                  run(() => {
                    const result = reorderWaypoint(
                      source,
                      world.id,
                      selection.index,
                      1,
                    );
                    onChange(result.source);
                    onSelectionChange({
                      kind: "marker",
                      index: result.markerIndex,
                    });
                  })
                }
              >
                Later
              </button>
            </div>
          )}
        {(selection.kind === "obstacle" || selection.kind === "marker") && (
          <button
            className="world-editor-delete-item"
            type="button"
            onClick={() =>
              run(() => {
                onChange(deleteWorldItem(source, world.id, selection));
                onSelectionChange({ kind: "initial_pose" });
              })
            }
          >
            Delete selected item
          </button>
        )}
      </div>
    </aside>
  );
}
