import { describe, expect, it } from "vitest";

import {
  XrpSimulator,
  parseWorldCatalog,
  simulatorConfigForScenario,
} from "./index";

describe("deterministic XRP planar simulator", () => {
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
