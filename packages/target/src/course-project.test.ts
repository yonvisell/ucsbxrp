import { describe, expect, it } from "vitest";

import {
  COURSE_PROJECT_TEMPLATES,
  COURSE_STARTERS,
  courseProjectTemplate,
  courseStarter,
} from "./course-project";

describe("course starter catalog", () => {
  it("bundles all five complete projects in course order", () => {
    expect(COURSE_STARTERS.map((starter) => starter.id)).toEqual([
      "challenge_1",
      "challenge_2",
      "challenge_3",
      "challenge_4",
      "challenge_5",
    ]);
    for (const starter of COURSE_STARTERS) {
      expect(starter.project.entrypoint).toBe("main.py");
      expect(starter.project.files["main.py"]).toBeTruthy();
      expect(Object.keys(starter.project.files).length).toBeGreaterThanOrEqual(
        5,
      );
    }
  });

  it("looks up a starter without silently falling back", () => {
    expect(courseStarter("challenge_3").label).toContain("Waypoint Courier");
    expect(() => courseStarter("challenge_9")).toThrow(
      "Unknown course starter",
    );
  });

  it("groups challenges, a sensor-driven demo, and a staged tutorial", () => {
    expect(COURSE_PROJECT_TEMPLATES.map((template) => template.kind)).toEqual([
      "challenge",
      "challenge",
      "challenge",
      "challenge",
      "challenge",
      "demo",
      "tutorial",
    ]);
    const demo = courseProjectTemplate("demo_obstacle_turn");
    expect(demo.project.files["main.py"]).toContain("drive_until_close");
    expect(demo.project.files["main.py"]).toContain("turn_left");
    const tutorial = courseProjectTemplate("micropython_tutorial");
    expect(tutorial.project.entrypoint).toBe("1_values_and_functions.py");
    expect(tutorial.project.files["7_finite_state_machine.py"]).toContain(
      "next_state",
    );
    expect(Object.keys(tutorial.project.files)).toHaveLength(9);
  });
});
