import { describe, expect, it } from "vitest";

import { XrpSimulator, simulatorConfigForScenario } from "./index";

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
