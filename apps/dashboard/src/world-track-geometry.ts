import type { WorldTrack } from "@ucsb-xrp/simulator";

export interface WorldTrackSegment {
  readonly end: WorldTrack["points"][number];
  readonly start: WorldTrack["points"][number];
}

/** Return each centerline segment, including the closing edge when requested. */
export function worldTrackSegments(
  track: WorldTrack,
): readonly WorldTrackSegment[] {
  const segments: WorldTrackSegment[] = [];
  for (let index = 1; index < track.points.length; index += 1) {
    segments.push({
      start: track.points[index - 1]!,
      end: track.points[index]!,
    });
  }
  if (track.closed) {
    segments.push({ start: track.points.at(-1)!, end: track.points[0]! });
  }
  return segments;
}

/** Map normalized floor darkness to a neutral gray visible on the arena floor. */
export function worldTrackColor(darkness: number): string {
  const channel = Math.round(238 - 188 * darkness);
  const hex = channel.toString(16).padStart(2, "0");
  return `#${hex}${hex}${hex}`;
}
