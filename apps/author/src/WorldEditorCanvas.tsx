import { useRef, type PointerEvent as ReactPointerEvent } from "react";

import type {
  WorldDefinition,
  WorldMarker,
  WorldObstacle,
} from "@ucsb-xrp/simulator";

import {
  snapWorldValue,
  updateWorldNumbers,
  worldEditorWarnings,
  worldItemLabel,
  worldSelectionValues,
  type WorldObjectSelection,
} from "./world-editor-model";

const VIEW_WIDTH = 800;
const VIEW_HEIGHT = 520;
const VIEW_PADDING = 42;

type DragHandle =
  | "move"
  | "line-1"
  | "line-2"
  | "rect-min-min"
  | "rect-min-max"
  | "rect-max-min"
  | "rect-max-max"
  | "heading";

interface DragState {
  source: string;
  selection: WorldObjectSelection;
  handle: DragHandle;
  startX: number;
  startY: number;
  values: Readonly<Record<string, number>>;
}

interface WorldTransform {
  x: (xMm: number) => number;
  y: (yMm: number) => number;
  worldX: (x: number) => number;
  worldY: (y: number) => number;
  width: number;
  height: number;
}

interface WorldEditorCanvasProps {
  source: string;
  world: WorldDefinition;
  selection: WorldObjectSelection;
  snap: number;
  onChange: (source: string) => void;
  onError: (message: string) => void;
  onSelectionChange: (selection: WorldObjectSelection) => void;
}

function selectionKey(selection: WorldObjectSelection): string {
  return selection.kind === "obstacle" || selection.kind === "marker"
    ? `${selection.kind}-${selection.index}`
    : selection.kind;
}

function worldTransform(world: WorldDefinition): WorldTransform {
  const availableWidth = VIEW_WIDTH - VIEW_PADDING * 2;
  const availableHeight = VIEW_HEIGHT - VIEW_PADDING * 2;
  const worldWidth = world.bounds.maximumXmm - world.bounds.minimumXmm;
  const worldHeight = world.bounds.maximumYmm - world.bounds.minimumYmm;
  const scale = Math.min(
    availableWidth / worldWidth,
    availableHeight / worldHeight,
  );
  const width = worldWidth * scale;
  const height = worldHeight * scale;
  const left = (VIEW_WIDTH - width) / 2;
  const top = (VIEW_HEIGHT - height) / 2;
  return {
    x: (xMm) => left + (xMm - world.bounds.minimumXmm) * scale,
    y: (yMm) => top + (world.bounds.maximumYmm - yMm) * scale,
    worldX: (x) => world.bounds.minimumXmm + (x - left) / scale,
    worldY: (y) => world.bounds.maximumYmm - (y - top) / scale,
    width,
    height,
  };
}

function gridSpacing(world: WorldDefinition): number {
  const extent = Math.max(
    world.bounds.maximumXmm - world.bounds.minimumXmm,
    world.bounds.maximumYmm - world.bounds.minimumYmm,
  );
  if (extent <= 1_500) return 100;
  if (extent <= 3_000) return 250;
  if (extent <= 6_000) return 500;
  return 1_000;
}

function gridValues(minimum: number, maximum: number, spacing: number) {
  const result: number[] = [];
  for (
    let value = Math.ceil(minimum / spacing) * spacing;
    value <= maximum;
    value += spacing
  ) {
    result.push(value);
  }
  return result;
}

function robotPolygon(
  world: WorldDefinition,
  transform: WorldTransform,
): string {
  const cos = Math.cos(world.initialPose.headingRad);
  const sin = Math.sin(world.initialPose.headingRad);
  return [
    [-110, -90],
    [110, -90],
    [110, 90],
    [-110, 90],
  ]
    .map(([x = 0, y = 0]) => {
      const worldX = world.initialPose.xMm + x * cos - y * sin;
      const worldY = world.initialPose.yMm + x * sin + y * cos;
      return `${transform.x(worldX)},${transform.y(worldY)}`;
    })
    .join(" ");
}

export function WorldEditorCanvas({
  source,
  world,
  selection,
  snap,
  onChange,
  onError,
  onSelectionChange,
}: WorldEditorCanvasProps) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const dragRef = useRef<DragState | null>(null);
  const transform = worldTransform(world);

  function apply(sourceUpdate: () => string) {
    try {
      onChange(sourceUpdate());
      onError("");
    } catch (error) {
      onError(error instanceof Error ? error.message : String(error));
    }
  }

  function pointFromEvent(event: ReactPointerEvent<SVGSVGElement>) {
    const matrix = svgRef.current?.getScreenCTM();
    if (!matrix) return null;
    const point = new DOMPoint(event.clientX, event.clientY).matrixTransform(
      matrix.inverse(),
    );
    return { x: transform.worldX(point.x), y: transform.worldY(point.y) };
  }

  function beginDrag(
    event: ReactPointerEvent<SVGElement>,
    nextSelection: WorldObjectSelection,
    handle: DragHandle,
  ) {
    const svg = svgRef.current;
    const matrix = svg?.getScreenCTM();
    if (!svg || !matrix) return;
    const point = new DOMPoint(event.clientX, event.clientY).matrixTransform(
      matrix.inverse(),
    );
    dragRef.current = {
      source,
      selection: nextSelection,
      handle,
      startX: transform.worldX(point.x),
      startY: transform.worldY(point.y),
      values: worldSelectionValues(world, nextSelection),
    };
    onSelectionChange(nextSelection);
    svg.setPointerCapture(event.pointerId);
    event.preventDefault();
    event.stopPropagation();
  }

  function moveDrag(event: ReactPointerEvent<SVGSVGElement>) {
    const drag = dragRef.current;
    const point = pointFromEvent(event);
    if (!drag || !point) return;
    const dx = point.x - drag.startX;
    const dy = point.y - drag.startY;
    const snapped = (value: number) => snapWorldValue(value, snap);
    const values: Record<string, number> = {};
    const original = drag.values;
    if (drag.handle === "heading") {
      values.heading_rad = Math.atan2(
        point.y - (original.y_mm ?? 0),
        point.x - (original.x_mm ?? 0),
      );
    } else if (drag.handle === "line-1" || drag.handle === "line-2") {
      const endpoint = drag.handle === "line-1" ? "1" : "2";
      values[`x${endpoint}_mm`] = snapped(point.x);
      values[`y${endpoint}_mm`] = snapped(point.y);
    } else if (drag.handle.startsWith("rect-")) {
      const horizontal =
        drag.handle.includes("min-min") || drag.handle.includes("min-max")
          ? "minimum_x_mm"
          : "maximum_x_mm";
      const vertical =
        drag.handle.includes("min-min") || drag.handle.includes("max-min")
          ? "minimum_y_mm"
          : "maximum_y_mm";
      const nextX = snapped(point.x);
      const nextY = snapped(point.y);
      if (
        (horizontal === "minimum_x_mm" &&
          nextX < (original.maximum_x_mm ?? Infinity)) ||
        (horizontal === "maximum_x_mm" &&
          nextX > (original.minimum_x_mm ?? -Infinity))
      ) {
        values[horizontal] = nextX;
      }
      if (
        (vertical === "minimum_y_mm" &&
          nextY < (original.maximum_y_mm ?? Infinity)) ||
        (vertical === "maximum_y_mm" &&
          nextY > (original.minimum_y_mm ?? -Infinity))
      ) {
        values[vertical] = nextY;
      }
    } else if (drag.selection.kind === "initial_pose") {
      values.x_mm = snapped((original.x_mm ?? 0) + dx);
      values.y_mm = snapped((original.y_mm ?? 0) + dy);
    } else if (drag.selection.kind === "marker" && "x_mm" in original) {
      values.x_mm = snapped((original.x_mm ?? 0) + dx);
      values.y_mm = snapped((original.y_mm ?? 0) + dy);
    } else if ("x1_mm" in original) {
      values.x1_mm = snapped((original.x1_mm ?? 0) + dx);
      values.y1_mm = snapped((original.y1_mm ?? 0) + dy);
      values.x2_mm = snapped((original.x2_mm ?? 0) + dx);
      values.y2_mm = snapped((original.y2_mm ?? 0) + dy);
    } else {
      values.minimum_x_mm = snapped((original.minimum_x_mm ?? 0) + dx);
      values.minimum_y_mm = snapped((original.minimum_y_mm ?? 0) + dy);
      values.maximum_x_mm = snapped((original.maximum_x_mm ?? 0) + dx);
      values.maximum_y_mm = snapped((original.maximum_y_mm ?? 0) + dy);
    }
    apply(() =>
      updateWorldNumbers(drag.source, world.id, drag.selection, values),
    );
  }

  function endDrag(event: ReactPointerEvent<SVGSVGElement>) {
    if (
      dragRef.current &&
      event.currentTarget.hasPointerCapture(event.pointerId)
    ) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    dragRef.current = null;
  }

  function renderRectangle(
    item:
      | WorldObstacle
      | Extract<WorldMarker, { type: "start_box" | "finish_box" }>,
    nextSelection: WorldObjectSelection,
    className: string,
  ) {
    const selected = selectionKey(selection) === selectionKey(nextSelection);
    const left = transform.x(item.minimumXmm);
    const right = transform.x(item.maximumXmm);
    const top = transform.y(item.maximumYmm);
    const bottom = transform.y(item.minimumYmm);
    const handles: Array<[DragHandle, number, number]> = [
      ["rect-min-min", left, bottom],
      ["rect-min-max", left, top],
      ["rect-max-min", right, bottom],
      ["rect-max-max", right, top],
    ];
    return (
      <g key={selectionKey(nextSelection)}>
        <rect
          aria-label={worldItemLabel(
            item,
            "index" in nextSelection ? nextSelection.index : 0,
          )}
          className={`${className}${selected ? " is-selected" : ""}`}
          height={bottom - top}
          width={right - left}
          x={left}
          y={top}
          onPointerDown={(event) => beginDrag(event, nextSelection, "move")}
        />
        {selected &&
          handles.map(([handle, x, y]) => (
            <circle
              aria-label={`Resize ${item.type}`}
              className="world-editor-handle"
              cx={x}
              cy={y}
              key={handle}
              r={6}
              onPointerDown={(event) => beginDrag(event, nextSelection, handle)}
            />
          ))}
      </g>
    );
  }

  function renderMarker(marker: WorldMarker, index: number) {
    const nextSelection: WorldObjectSelection = { kind: "marker", index };
    const selected = selectionKey(selection) === selectionKey(nextSelection);
    if (marker.type === "start_box" || marker.type === "finish_box") {
      return renderRectangle(marker, nextSelection, `world-${marker.type}`);
    }
    if (marker.type === "start_line" || marker.type === "finish_line") {
      return (
        <g key={`marker-${index}`}>
          <line
            aria-label={worldItemLabel(marker, index)}
            className={`world-${marker.type}${selected ? " is-selected" : ""}`}
            x1={transform.x(marker.x1Mm)}
            x2={transform.x(marker.x2Mm)}
            y1={transform.y(marker.y1Mm)}
            y2={transform.y(marker.y2Mm)}
            onPointerDown={(event) => beginDrag(event, nextSelection, "move")}
          />
          {selected && (
            <>
              <circle
                aria-label={`Move ${marker.type} first endpoint`}
                className="world-editor-handle"
                cx={transform.x(marker.x1Mm)}
                cy={transform.y(marker.y1Mm)}
                r={6}
                onPointerDown={(event) =>
                  beginDrag(event, nextSelection, "line-1")
                }
              />
              <circle
                aria-label={`Move ${marker.type} second endpoint`}
                className="world-editor-handle"
                cx={transform.x(marker.x2Mm)}
                cy={transform.y(marker.y2Mm)}
                r={6}
                onPointerDown={(event) =>
                  beginDrag(event, nextSelection, "line-2")
                }
              />
            </>
          )}
        </g>
      );
    }
    const x = transform.x(marker.xMm);
    const y = transform.y(marker.yMm);
    const waypointNumber = world.markers
      .slice(0, index + 1)
      .filter((candidate) => candidate.type === "waypoint").length;
    return (
      <g
        aria-label={worldItemLabel(marker, index)}
        className={`world-point world-${marker.type}${selected ? " is-selected" : ""}`}
        key={`marker-${index}`}
        onPointerDown={(event) => beginDrag(event, nextSelection, "move")}
      >
        {marker.type === "waypoint" ? (
          <circle cx={x} cy={y} r={10} />
        ) : (
          <path
            d={`M ${x} ${y - 10} L ${x + 10} ${y} L ${x} ${y + 10} L ${x - 10} ${y} Z`}
          />
        )}
        <text x={x + 13} y={y - 10}>
          {marker.type === "waypoint"
            ? waypointNumber
            : (marker.label ?? marker.name ?? "Marker")}
        </text>
      </g>
    );
  }

  const spacing = gridSpacing(world);
  const warnings = worldEditorWarnings(world);
  const headingX =
    world.initialPose.xMm + Math.cos(world.initialPose.headingRad) * 180;
  const headingY =
    world.initialPose.yMm + Math.sin(world.initialPose.headingRad) * 180;

  return (
    <div className="world-editor-canvas-panel">
      <svg
        aria-label={`Graphic editor for ${world.label}`}
        className="world-editor-canvas"
        onPointerDown={() => onSelectionChange({ kind: "bounds" })}
        onPointerMove={moveDrag}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        preserveAspectRatio="xMidYMid meet"
        ref={svgRef}
        role="img"
        viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
      >
        <defs>
          <clipPath id={`world-bounds-${world.id}`}>
            <rect
              height={transform.height}
              width={transform.width}
              x={transform.x(world.bounds.minimumXmm)}
              y={transform.y(world.bounds.maximumYmm)}
            />
          </clipPath>
        </defs>
        <rect
          className="world-arena"
          height={transform.height}
          width={transform.width}
          x={transform.x(world.bounds.minimumXmm)}
          y={transform.y(world.bounds.maximumYmm)}
        />
        <g clipPath={`url(#world-bounds-${world.id})`}>
          {gridValues(
            world.bounds.minimumXmm,
            world.bounds.maximumXmm,
            spacing,
          ).map((value) => (
            <line
              className={value === 0 ? "world-grid-axis" : "world-grid-line"}
              key={`x-${value}`}
              x1={transform.x(value)}
              x2={transform.x(value)}
              y1={transform.y(world.bounds.minimumYmm)}
              y2={transform.y(world.bounds.maximumYmm)}
            />
          ))}
          {gridValues(
            world.bounds.minimumYmm,
            world.bounds.maximumYmm,
            spacing,
          ).map((value) => (
            <line
              className={value === 0 ? "world-grid-axis" : "world-grid-line"}
              key={`y-${value}`}
              x1={transform.x(world.bounds.minimumXmm)}
              x2={transform.x(world.bounds.maximumXmm)}
              y1={transform.y(value)}
              y2={transform.y(value)}
            />
          ))}
          <g
            aria-label="Initial XRP pose"
            className={`world-initial-pose${selection.kind === "initial_pose" ? " is-selected" : ""}`}
            onPointerDown={(event) =>
              beginDrag(event, { kind: "initial_pose" }, "move")
            }
          >
            <polygon points={robotPolygon(world, transform)} />
            <line
              x1={transform.x(world.initialPose.xMm)}
              x2={transform.x(headingX)}
              y1={transform.y(world.initialPose.yMm)}
              y2={transform.y(headingY)}
            />
          </g>
          {world.obstacles.map((obstacle, index) =>
            renderRectangle(
              obstacle,
              { kind: "obstacle", index },
              `world-obstacle world-${obstacle.type}`,
            ),
          )}
          {world.markers.map(renderMarker)}
          {selection.kind === "initial_pose" && (
            <circle
              aria-label="Move initial XRP pose"
              className="world-editor-heading-handle"
              cx={transform.x(world.initialPose.xMm)}
              cy={transform.y(world.initialPose.yMm)}
              r={7}
              onPointerDown={(event) =>
                beginDrag(event, { kind: "initial_pose" }, "move")
              }
            />
          )}
          <circle
            aria-label="Set initial XRP heading"
            className="world-editor-heading-handle"
            cx={transform.x(headingX)}
            cy={transform.y(headingY)}
            r={7}
            onPointerDown={(event) =>
              beginDrag(event, { kind: "initial_pose" }, "heading")
            }
          />
        </g>
      </svg>
      <div className="world-editor-canvas-note">
        Drag items to move them. Selected rectangles and lines show resize
        handles. Dimensions are millimeters.
      </div>
      {warnings.map((warning) => (
        <div className="world-editor-warning" key={warning.code}>
          Warning: {warning.message}
        </div>
      ))}
    </div>
  );
}
