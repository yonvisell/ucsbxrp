import { useId } from "react";

type DiagramSide = "top" | "right" | "bottom" | "left";

export interface DiagramNode {
  id: string;
  column: number;
  row: number;
  label: string;
  details?: readonly string[];
  href?: string;
  kind?: "program" | "student" | "service" | "target";
}

export interface DiagramEdge {
  from: string;
  to: string;
  label: string;
  fromSide?: DiagramSide;
  toSide?: DiagramSide;
  via?: readonly { column: number; row: number }[];
  labelAt?: { column: number; row: number };
}

interface FlowDiagramProps {
  caption: string;
  columns: number;
  description: string;
  edges: readonly DiagramEdge[];
  nodes: readonly DiagramNode[];
  rows: number;
  title: string;
}

const columnWidth = 220;
const rowHeight = 112;
const nodeWidth = 188;
const nodeHeight = 62;
const margin = 28;

function nodeOrigin(node: DiagramNode) {
  return {
    x: margin + node.column * columnWidth,
    y: margin + node.row * rowHeight,
  };
}

function anchor(node: DiagramNode, side: DiagramSide) {
  const { x, y } = nodeOrigin(node);
  if (side === "top") return { x: x + nodeWidth / 2, y };
  if (side === "right") return { x: x + nodeWidth, y: y + nodeHeight / 2 };
  if (side === "bottom") return { x: x + nodeWidth / 2, y: y + nodeHeight };
  return { x, y: y + nodeHeight / 2 };
}

function gridPoint(point: { column: number; row: number }) {
  return {
    x: margin + point.column * columnWidth + nodeWidth / 2,
    y: margin + point.row * rowHeight + nodeHeight / 2,
  };
}

export function FlowDiagram({
  caption,
  columns,
  description,
  edges,
  nodes,
  rows,
  title,
}: FlowDiagramProps) {
  const instanceId = useId().replaceAll(":", "");
  const titleId = `${instanceId}-title`;
  const descriptionId = `${instanceId}-description`;
  const markerId = `${instanceId}-arrow`;
  const nodeById = new Map(nodes.map((node) => [node.id, node]));
  const width = margin * 2 + (columns - 1) * columnWidth + nodeWidth;
  const height = margin * 2 + (rows - 1) * rowHeight + nodeHeight;

  return (
    <figure className="flow-diagram">
      <div className="flow-diagram-canvas">
        <svg
          aria-labelledby={`${titleId} ${descriptionId}`}
          className="flow-diagram-svg"
          role="img"
          viewBox={`0 0 ${width} ${height}`}
        >
          <title id={titleId}>{title}</title>
          <desc id={descriptionId}>{description}</desc>
          <defs>
            <marker
              id={markerId}
              markerHeight="7"
              markerWidth="7"
              orient="auto-start-reverse"
              refX="6"
              refY="3.5"
              viewBox="0 0 7 7"
            >
              <path d="M 0 0 L 7 3.5 L 0 7 z" />
            </marker>
          </defs>

          <g className="diagram-edges">
            {edges.map((edge) => {
              const from = nodeById.get(edge.from);
              const to = nodeById.get(edge.to);
              if (!from || !to) return null;
              const points = [
                anchor(from, edge.fromSide ?? "right"),
                ...(edge.via ?? []).map(gridPoint),
                anchor(to, edge.toSide ?? "left"),
              ];
              const labelPoint = edge.labelAt
                ? gridPoint(edge.labelAt)
                : points[Math.floor(points.length / 2)]!;
              return (
                <g key={`${edge.from}-${edge.to}-${edge.label}`}>
                  <polyline
                    markerEnd={`url(#${markerId})`}
                    points={points
                      .map((point) => `${point.x},${point.y}`)
                      .join(" ")}
                  />
                  <text x={labelPoint.x} y={labelPoint.y - 7}>
                    {edge.label}
                  </text>
                </g>
              );
            })}
          </g>

          <g className="diagram-nodes">
            {nodes.map((node) => {
              const { x, y } = nodeOrigin(node);
              const content = (
                <g>
                  <rect
                    className={`diagram-node ${node.kind ?? "service"}`}
                    height={nodeHeight}
                    rx="3"
                    width={nodeWidth}
                    x={x}
                    y={y}
                  />
                  <text className="diagram-node-label" x={x + 10} y={y + 22}>
                    {node.label}
                  </text>
                  {(node.details ?? []).slice(0, 2).map((line, index) => (
                    <text
                      className="diagram-node-detail"
                      key={line}
                      x={x + 10}
                      y={y + 40 + index * 13}
                    >
                      {line}
                    </text>
                  ))}
                </g>
              );
              return node.href ? (
                <a href={node.href} key={node.id}>
                  {content}
                </a>
              ) : (
                <g key={node.id}>{content}</g>
              );
            })}
          </g>
        </svg>
      </div>
      <dl className="flow-diagram-fallback">
        {edges.map((edge) => (
          <div key={`${edge.from}-${edge.to}-${edge.label}`}>
            <dt>
              {nodeById.get(edge.from)?.label} → {nodeById.get(edge.to)?.label}
            </dt>
            <dd>{edge.label}</dd>
          </div>
        ))}
      </dl>
      <figcaption>{caption}</figcaption>
    </figure>
  );
}
