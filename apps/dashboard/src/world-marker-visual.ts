import type { WorldMarker } from "@ucsb-xrp/target";

export interface WorldMarkerVisualStyle {
  color: string;
  dashed: boolean;
  fillColor?: string;
  fillOpacity?: number;
  shape: "line" | "box" | "ring" | "diamond";
}

const START_STYLE: WorldMarkerVisualStyle = {
  color: "#5a8a68",
  dashed: false,
  fillColor: "#e8f6eb",
  fillOpacity: 0.78,
  shape: "line",
};
const FINISH_STYLE: WorldMarkerVisualStyle = {
  color: "#2f6d54",
  dashed: true,
  shape: "line",
};

export function worldMarkerVisualStyle(
  marker: WorldMarker,
): WorldMarkerVisualStyle {
  switch (marker.type) {
    case "start_line":
      return START_STYLE;
    case "start_box":
      return { ...START_STYLE, shape: "box" };
    case "finish_line":
      return FINISH_STYLE;
    case "finish_box":
      return { ...FINISH_STYLE, shape: "box" };
    case "waypoint":
      return {
        color: "#315f85",
        dashed: false,
        shape: "ring",
      };
    case "marker":
      return {
        color: "#8a6200",
        dashed: false,
        shape: "diamond",
      };
  }
}

export function worldMarkerLabelPosition(marker: WorldMarker): {
  xMm: number;
  yMm: number;
} {
  switch (marker.type) {
    case "start_line":
    case "finish_line":
      return {
        xMm: (marker.x1Mm + marker.x2Mm) / 2,
        yMm: (marker.y1Mm + marker.y2Mm) / 2 + 30,
      };
    case "start_box":
    case "finish_box":
      return {
        xMm: (marker.minimumXmm + marker.maximumXmm) / 2,
        yMm: marker.maximumYmm + 30,
      };
    case "waypoint":
    case "marker":
      return { xMm: marker.xMm, yMm: marker.yMm + 34 };
  }
}
