import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import {
  COURSE_ARENA_BOUNDS,
  XRP_CHASSIS_LENGTH_MM,
  XRP_ULTRASONIC_FIELD_OF_VIEW_DEG,
  XRP_ULTRASONIC_FIELD_OF_VIEW_RAD,
  XRP_ULTRASONIC_RAY_COUNT,
  XRP_ULTRASONIC_RAY_OFFSETS_RAD,
  XRP_ULTRASONIC_SENSOR_OFFSET_MM,
  XrpSimulator,
  defaultWorld,
  parseWorldCatalog,
  simulatorConfigForScenario,
  simulatorConfigForWorld,
  ultrasonicSensorOrigin,
} from "./index";

const allGeometryWorldSource = readFileSync(
  new URL("../../../tests/fixtures/world/all-geometry.json", import.meta.url),
  "utf8",
);
const challengeSixWorldSource = readFileSync(
  new URL(
    "../../../vendor/current/starters/challenge_6/world.json",
    import.meta.url,
  ),
  "utf8",
);
const challengeSevenWorldSource = readFileSync(
  new URL(
    "../../../vendor/current/starters/challenge_7/world.json",
    import.meta.url,
  ),
  "utf8",
);
const challengeNineWorldSource = readFileSync(
  new URL(
    "../../../vendor/current/starters/challenge_9/world.json",
    import.meta.url,
  ),
  "utf8",
);

describe("deterministic XRP planar simulator", () => {
  it("uses the centered 10 ft by 4 ft course arena by default", () => {
    expect(COURSE_ARENA_BOUNDS).toEqual({
      minimumXmm: -1524,
      minimumYmm: -609.6,
      maximumXmm: 1524,
      maximumYmm: 609.6,
    });
    expect(defaultWorld().label).toBe("Course arena");
    expect(new XrpSimulator().config.worldBounds).toEqual(COURSE_ARENA_BOUNDS);
  });

  it("repeats exactly for the same fixed-step input", () => {
    const run = () => {
      const simulator = new XrpSimulator();
      simulator.setMotorEffort("left", 0.55);
      simulator.setMotorEffort("right", 0.55);
      for (let index = 0; index < 100; index += 1) {
        simulator.step();
      }
      return simulator.state;
    };

    expect(run()).toEqual(run());
  });

  it("moves forward and exposes encoder quantization", () => {
    const simulator = new XrpSimulator({
      rightResponseScale: 1,
      rightStartEffort: 0.12,
    });
    simulator.setMotorEffort("left", 0.6);
    simulator.setMotorEffort("right", 0.6);
    for (let index = 0; index < 50; index += 1) {
      simulator.step();
    }

    expect(simulator.state.pose.xMm).toBeGreaterThan(100);
    expect(simulator.state.pose.yMm).toBeCloseTo(0, 9);
    expect(simulator.state.pose.headingRad).toBeCloseTo(0, 9);
    expect(simulator.state.leftEncoderCount).toBeGreaterThan(0);
    expect(simulator.state.leftEncoderCount).toBe(
      simulator.state.rightEncoderCount,
    );
  });

  it("uses the course-positive counterclockwise turn convention", () => {
    const simulator = new XrpSimulator({ rightResponseScale: 1 });
    simulator.setMotorEffort("left", 0.3);
    simulator.setMotorEffort("right", 0.7);
    for (let index = 0; index < 50; index += 1) {
      simulator.step();
    }

    expect(simulator.state.pose.headingRad).toBeGreaterThan(0);
    expect(simulator.state.pose.yMm).toBeGreaterThan(0);
  });

  it("resets all derived state", () => {
    const simulator = new XrpSimulator();
    simulator.setMotorEffort("left", 0.8);
    simulator.step();
    simulator.reset({ xMm: 10, yMm: 20, headingRad: 4 });

    expect(simulator.state.seq).toBe(0);
    expect(simulator.state.leftEncoderCount).toBe(0);
    expect(simulator.state.leftEffort).toBe(0);
    expect(simulator.state.pose.xMm).toBe(10);
    expect(simulator.state.pose.headingRad).toBeGreaterThanOrEqual(-Math.PI);
    expect(simulator.state.pose.headingRad).toBeLessThan(Math.PI);
  });

  it("coasts to a finite stopped state after effort becomes zero", () => {
    const simulator = new XrpSimulator({
      rightResponseScale: 1,
      rightStartEffort: 0.12,
    });
    simulator.setMotorEffort("left", 0.6);
    simulator.setMotorEffort("right", 0.6);
    for (let index = 0; index < 50; index += 1) {
      simulator.step();
    }
    const xAtZeroCommand = simulator.state.pose.xMm;

    simulator.stop();
    expect(simulator.state.leftEffort).toBe(0);
    expect(simulator.state.leftWheelSpeedMmS).toBeGreaterThan(0);

    for (let index = 0; index < 300; index += 1) {
      simulator.step();
    }

    expect(simulator.state.pose.xMm).toBeGreaterThan(xAtZeroCommand);
    expect(simulator.state.leftWheelSpeedMmS).toBe(0);
    expect(simulator.state.rightWheelSpeedMmS).toBe(0);
  });

  it("reports range to the nearest obstacle and updates it with pose", () => {
    const simulator = new XrpSimulator({
      rangeSensorOffsetMm: 0,
      worldBounds: {
        minimumXmm: -500,
        minimumYmm: -500,
        maximumXmm: 500,
        maximumYmm: 500,
      },
      obstacles: [
        {
          minimumXmm: 200,
          minimumYmm: -50,
          maximumXmm: 250,
          maximumYmm: 50,
        },
      ],
    });

    expect(simulator.state.rangeMm).toBeCloseTo(200, 9);
    simulator.reset({ xMm: 0, yMm: 0, headingRad: Math.PI / 2 });
    expect(simulator.state.rangeMm).toBeCloseTo(500, 9);
  });

  it("uses the shared HC-SR04 origin and 15-degree fan geometry", () => {
    expect(XRP_ULTRASONIC_FIELD_OF_VIEW_DEG).toBe(15);
    expect(XRP_ULTRASONIC_FIELD_OF_VIEW_RAD).toBeCloseTo(Math.PI / 12, 15);
    expect(XRP_ULTRASONIC_RAY_COUNT).toBe(9);
    expect(XRP_ULTRASONIC_RAY_OFFSETS_RAD).toHaveLength(9);
    expect(XRP_ULTRASONIC_RAY_OFFSETS_RAD[0]).toBeCloseTo(-Math.PI / 24, 15);
    expect(XRP_ULTRASONIC_RAY_OFFSETS_RAD[4]).toBe(0);
    expect(XRP_ULTRASONIC_RAY_OFFSETS_RAD[8]).toBeCloseTo(Math.PI / 24, 15);
    expect(XRP_CHASSIS_LENGTH_MM / 2 - XRP_ULTRASONIC_SENSOR_OFFSET_MM).toBe(
      26.25,
    );
    const origin = ultrasonicSensorOrigin({
      xMm: 10,
      yMm: 20,
      headingRad: Math.PI / 2,
    });
    expect(origin.xMm).toBeCloseTo(10, 12);
    expect(origin.yMm).toBeCloseTo(90, 12);
  });

  it("detects the nearest obstacle inside the fan but off the center ray", () => {
    const simulator = new XrpSimulator({
      worldBounds: {
        minimumXmm: -500,
        minimumYmm: -500,
        maximumXmm: 500,
        maximumYmm: 500,
      },
      obstacles: [
        {
          minimumXmm: 270,
          minimumYmm: 25,
          maximumXmm: 300,
          maximumYmm: 40,
        },
      ],
    });

    // The center ray at y=0 misses. The +7.5-degree ray reaches x=270 from
    // the 70 mm sensor origin and intersects the obstacle's lower edge.
    const expectedRangeMm = 200 / Math.cos(Math.PI / 24);
    expect(simulator.state.rangeMm).toBeCloseTo(expectedRangeMm, 9);
  });

  it("prevents penetration while encoders continue to represent wheel travel", () => {
    const simulator = new XrpSimulator({
      rightResponseScale: 1,
      rightStartEffort: 0.12,
      obstacles: [
        {
          minimumXmm: 150,
          minimumYmm: -100,
          maximumXmm: 250,
          maximumYmm: 100,
        },
      ],
    });
    simulator.setMotorEffort("left", 0.8);
    simulator.setMotorEffort("right", 0.8);
    for (let index = 0; index < 100; index += 1) {
      simulator.step();
    }

    expect(simulator.state.collision).toBe(true);
    expect(simulator.state.pose.xMm).toBeLessThanOrEqual(65);
    expect(simulator.state.leftEncoderCount).toBeGreaterThan(0);
    expect(simulator.state.accelerationMg[2]).toBe(1000);
    expect(simulator.state.batteryV).toBeGreaterThan(0);
  });

  it("provides a named delivery-gate observation scenario", () => {
    const simulator = new XrpSimulator(
      simulatorConfigForScenario("delivery-gate-blocked"),
    );

    expect(simulator.state.rangeMm).toBeCloseTo(280, 9);
    expect(simulator.config.obstacles).toHaveLength(1);
  });
});

describe("project world configuration", () => {
  const worldSource = (markers: unknown[], obstacles: unknown[] = []): string =>
    JSON.stringify({
      default_world: "lab",
      worlds: [
        {
          id: "lab",
          label: "Lab",
          bounds: {
            minimum_x_mm: 0,
            minimum_y_mm: 0,
            maximum_x_mm: 800,
            maximum_y_mm: 600,
          },
          initial_pose: { x_mm: 100, y_mm: 100, heading_rad: 0 },
          obstacles,
          markers,
        },
      ],
    });

  it("samples Challenge 9 track and finish geometry as normalized darkness", () => {
    const catalog = parseWorldCatalog(challengeNineWorldSource);
    const world = catalog.worlds[0]!;
    const simulator = new XrpSimulator(simulatorConfigForWorld(world));
    simulator.reset(world.initialPose);

    expect(world.tracks).toHaveLength(2);
    expect(simulator.state.leftReflectance).toBe(1);
    expect(simulator.state.rightReflectance).toBe(1);
    simulator.reset({ xMm: 0, yMm: 0, headingRad: 0 });
    expect(simulator.state.leftReflectance).toBe(0);
    expect(simulator.state.rightReflectance).toBe(0);
  });

  it("retains an optional final heading on a named waypoint", () => {
    const catalog = parseWorldCatalog(
      worldSource([
        {
          type: "waypoint",
          name: "finish",
          x_mm: 700,
          y_mm: 500,
          heading_rad: 1.2,
        },
      ]),
    );

    expect(catalog.worlds[0]?.markers[0]).toEqual({
      type: "waypoint",
      name: "finish",
      label: undefined,
      xMm: 700,
      yMm: 500,
      headingRad: 1.2,
    });
  });

  it("accepts every display marker without changing navigation or physics", () => {
    const catalog = parseWorldCatalog(allGeometryWorldSource);
    const world = catalog.worlds[0]!;

    expect(world.markers.map((marker) => marker.type)).toEqual([
      "start_line",
      "start_box",
      "waypoint",
      "marker",
      "finish_line",
      "waypoint",
      "finish_box",
    ]);
    expect(
      world.markers
        .filter((marker) => marker.type === "waypoint")
        .map((marker) => marker.name),
    ).toEqual(["first_goal", "second_goal"]);
    expect(world.markers[3]?.additionalProperties).toEqual({
      instructor_note: "Retained for a later editor",
    });

    const simulator = new XrpSimulator({
      ...simulatorConfigForWorld(world),
      rangeSensorOffsetMm: 0,
    });
    simulator.reset(world.initialPose);
    expect(simulator.config.obstacles).toEqual(world.obstacles);
    expect(simulator.state.rangeMm).toBeCloseTo(520, 9);
  });

  it("can keep the course boundary out of ultrasonic range without changing collision bounds", () => {
    const source = JSON.parse(worldSource([])) as {
      worlds: Array<Record<string, unknown>>;
    };
    source.worlds[0]!.range_sensor = { include_arena_boundary: false };
    const world = parseWorldCatalog(JSON.stringify(source)).worlds[0]!;
    const simulator = new XrpSimulator({
      ...simulatorConfigForWorld(world),
      rangeSensorOffsetMm: 0,
    });
    simulator.reset(world.initialPose);

    expect(world.includeArenaBoundaryInRange).toBe(false);
    expect(simulator.config.includeWorldBoundaryInRange).toBe(false);
    expect(simulator.state.rangeMm).toBeNull();
    expect(simulator.config.worldBounds).toEqual(world.bounds);

    simulator.reset({
      xMm: world.bounds.maximumXmm - 90,
      yMm: 0,
      headingRad: 0,
    });
    simulator.setMotorEffort("left", 0.8);
    simulator.setMotorEffort("right", 0.8);
    for (let index = 0; index < 30; index += 1) simulator.step();
    expect(simulator.state.collision).toBe(true);
    expect(simulator.state.pose.xMm).toBeLessThanOrEqual(
      world.bounds.maximumXmm - 85,
    );
  });

  it("uses explicit Challenge 6 and 7 walls without shrinking the course arena", () => {
    const challengeSix = parseWorldCatalog(challengeSixWorldSource);
    const noRange = challengeSix.worlds.find(
      (world) => world.id === "no-range",
    )!;
    const noRangeSimulator = new XrpSimulator(simulatorConfigForWorld(noRange));
    noRangeSimulator.reset(noRange.initialPose);
    expect(noRange.bounds).toEqual(COURSE_ARENA_BOUNDS);
    expect(noRangeSimulator.state.rangeMm).toBeNull();

    const challengeSeven = parseWorldCatalog(challengeSevenWorldSource);
    const station = challengeSeven.worlds.find(
      (world) => world.id === "localization-station",
    )!;
    const missingY = challengeSeven.worlds.find(
      (world) => world.id === "missing-y-reference",
    )!;
    const stationSimulator = new XrpSimulator(simulatorConfigForWorld(station));
    stationSimulator.reset(station.initialPose);
    expect(stationSimulator.state.rangeMm).toBeCloseTo(830, 6);
    stationSimulator.reset({ ...station.initialPose, headingRad: Math.PI / 2 });
    expect(stationSimulator.state.rangeMm).toBeCloseTo(430, 6);
    const missingYSimulator = new XrpSimulator(
      simulatorConfigForWorld(missingY),
    );
    missingYSimulator.reset({
      ...missingY.initialPose,
      headingRad: Math.PI / 2,
    });
    expect(missingY.bounds).toEqual(COURSE_ARENA_BOUNDS);
    expect(missingYSimulator.state.rangeMm).toBeNull();
  });

  it("rejects ambiguous names and geometry outside the arena walls", () => {
    expect(() =>
      parseWorldCatalog(
        worldSource([
          { type: "waypoint", name: "goal", x_mm: 100, y_mm: 100 },
          { type: "waypoint", name: "goal", x_mm: 200, y_mm: 100 },
        ]),
      ),
    ).toThrow("marker names must be unique");

    expect(() =>
      parseWorldCatalog(
        worldSource([
          {
            type: "start_line",
            x1_mm: -1,
            y1_mm: 100,
            x2_mm: 0,
            y2_mm: 200,
          },
        ]),
      ),
    ).toThrow("must be inside the world bounds");

    expect(() =>
      parseWorldCatalog(
        worldSource(
          [],
          [
            {
              type: "wall",
              feature: "gate",
              minimum_x_mm: 100,
              minimum_y_mm: 100,
              maximum_x_mm: 200,
              maximum_y_mm: 200,
            },
            {
              type: "block",
              feature: "gate",
              minimum_x_mm: 300,
              minimum_y_mm: 100,
              maximum_x_mm: 400,
              maximum_y_mm: 200,
            },
          ],
        ),
      ),
    ).toThrow("obstacle feature names must be unique");
  });
});
