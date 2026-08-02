import { describe, expect, it } from "vitest";

import { COURSE_STARTERS, courseStarter } from "./course-project";

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
});
