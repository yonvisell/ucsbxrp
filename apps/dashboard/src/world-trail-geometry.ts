import * as THREE from "three";

import type { TelemetrySample } from "@ucsb-xrp/target";

const COMPONENTS_PER_SEGMENT = 6;
const DEFAULT_MAXIMUM_SEGMENTS = 30_000;

function samplesConnect(
  previous: TelemetrySample,
  current: TelemetrySample,
): boolean {
  return Boolean(
    previous.poseAvailable &&
    current.poseAvailable &&
    previous.source === current.source &&
    current.seq > previous.seq &&
    current.tMs >= previous.tMs,
  );
}

function sameSampleBoundary(
  left: TelemetrySample,
  right: TelemetrySample,
): boolean {
  return (
    left.source === right.source &&
    left.seq === right.seq &&
    left.tMs === right.tMs
  );
}

/** Build independent path segments so a reset or source change cannot join poses. */
export function worldTrailSegmentPoints(
  samples: readonly TelemetrySample[],
): THREE.Vector3[] {
  const points: THREE.Vector3[] = [];
  for (let index = 1; index < samples.length; index += 1) {
    const previous = samples[index - 1]!;
    const current = samples[index]!;
    if (!samplesConnect(previous, current)) continue;
    points.push(
      new THREE.Vector3(previous.xMm, previous.yMm, 1),
      new THREE.Vector3(current.xMm, current.yMm, 1),
    );
  }
  return points;
}

export interface WorldTrailGeometryUpdate {
  readonly appendedSamples: number;
  readonly changed: boolean;
  readonly rebuilt: boolean;
}

/**
 * Owns one reusable line-segment buffer. Normal live snapshots append only the
 * samples newer than the previous snapshot; a missing boundary denotes a new
 * history source or reset and performs one bounded rebuild.
 */
export class WorldTrailGeometry {
  readonly geometry = new THREE.BufferGeometry();

  private positions = new Float32Array(0);
  private positionAttribute = new THREE.BufferAttribute(this.positions, 3);
  private segmentCountValue = 0;
  private nextSegmentSlot = 0;
  private lastSample: TelemetrySample | null = null;
  private posePointCountValue = 0;
  private maximumSegmentMmValue = 0;

  constructor(readonly maximumSegments = DEFAULT_MAXIMUM_SEGMENTS) {
    if (!Number.isInteger(maximumSegments) || maximumSegments < 1) {
      throw new Error("maximumSegments must be a positive integer");
    }
    this.geometry.setAttribute("position", this.positionAttribute);
    this.geometry.setDrawRange(0, 0);
  }

  get segmentCount(): number {
    return this.segmentCountValue;
  }

  get posePointCount(): number {
    return this.posePointCountValue;
  }

  get maximumSegmentMm(): number {
    return this.maximumSegmentMmValue;
  }

  update(
    samples: readonly TelemetrySample[],
    forceRebuild = false,
  ): WorldTrailGeometryUpdate {
    if (samples.length === 0) {
      const changed = this.lastSample !== null || this.segmentCountValue > 0;
      this.clear();
      return { appendedSamples: 0, changed, rebuilt: changed };
    }

    if (forceRebuild) {
      this.rebuild(samples);
      return {
        appendedSamples: samples.length,
        changed: true,
        rebuilt: true,
      };
    }

    if (this.lastSample !== null) {
      let previousBoundaryIndex = -1;
      for (let index = samples.length - 1; index >= 0; index -= 1) {
        if (sameSampleBoundary(samples[index]!, this.lastSample)) {
          previousBoundaryIndex = index;
          break;
        }
      }
      if (previousBoundaryIndex >= 0) {
        const appendedSamples = samples.length - previousBoundaryIndex - 1;
        if (appendedSamples === 0) {
          return { appendedSamples: 0, changed: false, rebuilt: false };
        }
        this.positionAttribute.clearUpdateRanges();
        for (
          let index = previousBoundaryIndex + 1;
          index < samples.length;
          index += 1
        ) {
          const previous = samples[index - 1]!;
          const current = samples[index]!;
          if (current.poseAvailable) this.posePointCountValue += 1;
          if (samplesConnect(previous, current)) {
            this.appendSegment(previous, current, true);
          }
        }
        this.lastSample = samples.at(-1)!;
        this.geometry.setDrawRange(0, this.segmentCountValue * 2);
        return { appendedSamples, changed: true, rebuilt: false };
      }
    }

    this.rebuild(samples);
    return {
      appendedSamples: samples.length,
      changed: true,
      rebuilt: true,
    };
  }

  clear(): void {
    this.segmentCountValue = 0;
    this.nextSegmentSlot = 0;
    this.lastSample = null;
    this.posePointCountValue = 0;
    this.maximumSegmentMmValue = 0;
    this.geometry.setDrawRange(0, 0);
  }

  dispose(): void {
    this.geometry.dispose();
  }

  private rebuild(samples: readonly TelemetrySample[]): void {
    this.clear();
    this.positionAttribute.clearUpdateRanges();
    for (const sample of samples) {
      if (sample.poseAvailable) this.posePointCountValue += 1;
    }
    for (let index = 1; index < samples.length; index += 1) {
      const previous = samples[index - 1]!;
      const current = samples[index]!;
      if (samplesConnect(previous, current)) {
        this.appendSegment(previous, current, false);
      }
    }
    this.positionAttribute.clearUpdateRanges();
    if (this.segmentCountValue > 0) {
      this.positionAttribute.addUpdateRange(
        0,
        this.segmentCountValue * COMPONENTS_PER_SEGMENT,
      );
      this.positionAttribute.needsUpdate = true;
    }
    this.lastSample = samples.at(-1)!;
    this.geometry.setDrawRange(0, this.segmentCountValue * 2);
  }

  private appendSegment(
    previous: TelemetrySample,
    current: TelemetrySample,
    markUpdateRange: boolean,
  ): void {
    const slot =
      this.segmentCountValue < this.maximumSegments
        ? this.segmentCountValue
        : this.nextSegmentSlot;
    if (this.segmentCountValue < this.maximumSegments) {
      this.segmentCountValue += 1;
      if (this.segmentCountValue === this.maximumSegments) {
        this.nextSegmentSlot = 0;
      }
    } else {
      this.nextSegmentSlot = (this.nextSegmentSlot + 1) % this.maximumSegments;
    }
    this.ensureCapacity(this.segmentCountValue);

    const offset = slot * COMPONENTS_PER_SEGMENT;
    this.positions[offset] = previous.xMm;
    this.positions[offset + 1] = previous.yMm;
    this.positions[offset + 2] = 1;
    this.positions[offset + 3] = current.xMm;
    this.positions[offset + 4] = current.yMm;
    this.positions[offset + 5] = 1;
    if (markUpdateRange) {
      this.positionAttribute.addUpdateRange(offset, COMPONENTS_PER_SEGMENT);
      this.positionAttribute.needsUpdate = true;
    }
    this.maximumSegmentMmValue = Math.max(
      this.maximumSegmentMmValue,
      Math.hypot(current.xMm - previous.xMm, current.yMm - previous.yMm),
    );
  }

  private ensureCapacity(requiredSegments: number): void {
    const currentCapacity = this.positions.length / COMPONENTS_PER_SEGMENT;
    if (requiredSegments <= currentCapacity) return;
    let nextCapacity = Math.max(64, currentCapacity * 2);
    while (nextCapacity < requiredSegments) nextCapacity *= 2;
    nextCapacity = Math.min(nextCapacity, this.maximumSegments);
    const nextPositions = new Float32Array(
      nextCapacity * COMPONENTS_PER_SEGMENT,
    );
    nextPositions.set(this.positions);
    this.positions = nextPositions;
    this.positionAttribute = new THREE.BufferAttribute(this.positions, 3);
    this.positionAttribute.needsUpdate = true;
    this.geometry.setAttribute("position", this.positionAttribute);
  }
}
