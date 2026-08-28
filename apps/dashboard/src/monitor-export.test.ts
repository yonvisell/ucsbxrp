import { describe, expect, it } from "vitest";

import { DEFAULT_WORLD_CATALOG, type TelemetrySample } from "@ucsb-xrp/target";

import {
  createMonitorAnnotation,
  createSignalPlotsSvg,
  monitorAnnotationsToCsv,
  monitorRunToCsv,
  worldCanvasTransform,
  worldReplayPlan,
  type MonitorAnnotation,
} from "./monitor-export";

function sample(tMs: number, xMm: number): TelemetrySample {
  return {
    tMs,
    seq: tMs,
    source: "virtual",
    poseAvailable: true,
    xMm,
    yMm: xMm / 2,
    headingRad: tMs / 10_000,
    leftEffort: 0.4,
    rightEffort: 0.35,
    leftWheelSpeedMmS: 90 + xMm / 10,
    rightWheelSpeedMmS: 85 + xMm / 10,
    leftEncoderCount: tMs,
    rightEncoderCount: tMs,
    collision: false,
    rangeMm: 500 - xMm,
    buttonPressed: false,
    accelerationMg: [0, 0, 1_000],
    angularRateMdps: [0, 0, 2_000],
    temperatureC: 25,
    batteryV: 6.1,
    sensorError: null,
  };
}

describe("monitor exports", () => {
  const samples = [sample(0, 0), sample(5_000, 80), sample(10_000, 160)];
  const annotation: MonitorAnnotation = {
    id: "note-1",
    label: "turn & inspect",
    source: "virtual",
    seq: 5_000,
    tMs: 5_000,
    poseAvailable: true,
    xMm: 80,
    yMm: 40,
  };

  it("anchors each note to the nearest retained telemetry sample", () => {
    expect(
      createMonitorAnnotation(samples, 6_200, "  turn begins  ", 123),
    ).toEqual({
      id: "virtual-5000-123",
      label: "turn begins",
      source: "virtual",
      seq: 5_000,
      tMs: 5_000,
      poseAvailable: true,
      xMm: 80,
      yMm: 40,
    });
    expect(createMonitorAnnotation([], 0, "note", 123)).toBeNull();
    expect(createMonitorAnnotation(samples, 0, "  ", 123)).toBeNull();
  });

  it("exports every selected plot as one self-contained vector graphic", () => {
    const svg = createSignalPlotsSvg(samples, ["wheel-speed", "range"], 10, [
      annotation,
    ]);

    expect(svg).toContain('width="1200" height="480"');
    expect(svg).toContain("Wheel speed · mm/s");
    expect(svg).toContain("Ultrasound distance · mm");
    expect(svg).toContain("5.00 s · turn &amp; inspect");
    expect(svg).toContain("<path");
    expect(svg).not.toContain("NaN");
  });

  it("exports notes as a compact CSV with escaped labels", () => {
    const csv = monitorAnnotationsToCsv([
      annotation,
      {
        ...annotation,
        id: "note-2",
        label: 'stop, then "inspect"',
        tMs: 8_000,
      },
    ]);

    expect(csv).toContain(
      "source,sequence,time_s,label,pose_available,x_mm,y_mm",
    );
    expect(csv).toContain("virtual,5000,5,turn & inspect,1,80,40");
    expect(csv).toContain('virtual,5000,8,"stop, then ""inspect""",1,80,40');
  });

  it("places run notes on their matching telemetry rows", () => {
    const csv = monitorRunToCsv(
      { schemaVersion: 3, samples, droppedSamples: 0 },
      [annotation],
    );
    const rows = csv.trimEnd().split("\n");

    expect(rows[0]).toMatch(/,note$/);
    expect(rows[1]).toMatch(/,$/);
    expect(rows[2]).toMatch(/,turn & inspect$/);
  });

  it("bounds long world replays and preserves real time for short ones", () => {
    const short = worldReplayPlan(samples, 20, 30);
    expect(short.playbackRate).toBe(1);
    expect(short.frameCount).toBe(301);

    const long = worldReplayPlan([sample(0, 0), sample(120_000, 100)], 20, 30);
    expect(long.playbackRate).toBe(6);
    expect(long.frameCount).toBe(601);

    const afterReset = worldReplayPlan(
      [sample(0, 0), sample(10_000, 80), sample(0, 0), sample(2_000, 30)],
      20,
      30,
    );
    expect(afterReset.durationMs).toBe(2_000);
  });

  it("rejects a world replay without a published pose", () => {
    expect(() =>
      worldReplayPlan(
        [sample(0, 0), sample(100, 1)].map((value) => ({
          ...value,
          poseAvailable: false,
        })),
      ),
    ).toThrow("no published robot pose");
  });

  it("uses one physical scale for both axes in world animations", () => {
    const world = DEFAULT_WORLD_CATALOG.worlds[0]!;
    const transform = worldCanvasTransform(world, 960, 720);
    const widthMm = world.bounds.maximumXmm - world.bounds.minimumXmm;
    const heightMm = world.bounds.maximumYmm - world.bounds.minimumYmm;

    expect(transform.worldWidthPx / widthMm).toBeCloseTo(
      transform.scalePxPerMm,
    );
    expect(transform.worldHeightPx / heightMm).toBeCloseTo(
      transform.scalePxPerMm,
    );
    expect(transform.worldWidthPx).toBeLessThanOrEqual(960 - 56);
    expect(transform.worldHeightPx).toBeLessThanOrEqual(720 - 56);
  });
});
