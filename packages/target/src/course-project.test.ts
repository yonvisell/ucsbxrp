import { describe, expect, it } from "vitest";

import { COURSE_ARENA_BOUNDS } from "@ucsb-xrp/simulator";

import {
  COURSE_PROJECT_TEMPLATES,
  COURSE_STARTERS,
  createNextChallengeProject,
  courseProjectTemplate,
  courseStarter,
  nextChallengeTemplate,
} from "./course-project";

describe("course starter catalog", () => {
  it("bundles all eight complete projects in course order", () => {
    expect(COURSE_STARTERS.map((starter) => starter.id)).toEqual([
      "challenge_1",
      "challenge_2",
      "challenge_3",
      "challenge_4",
      "challenge_5",
      "challenge_6",
      "challenge_7",
      "challenge_8",
    ]);
    for (const starter of COURSE_STARTERS) {
      expect(starter.project.entrypoint).toBe("main.py");
      expect(starter.project.files["main.py"]).toBeTruthy();
      expect(starter.project.files["README.md"]).toContain("Challenge");
      expect(starter.project.files["component_checks.py"]).toContain(
        "without starting either robot",
      );
      expect(starter.project.files["component_checks.py"]).toContain(
        "run_component_checks",
      );
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

  it("groups student challenges, complete variants, demos, and tutorials", () => {
    const templatesOfKind = (
      kind: (typeof COURSE_PROJECT_TEMPLATES)[number]["kind"],
    ) => COURSE_PROJECT_TEMPLATES.filter((template) => template.kind === kind);
    expect(templatesOfKind("challenge")).toHaveLength(8);
    expect(templatesOfKind("complete-challenge")).toHaveLength(8);
    expect(templatesOfKind("demo").length).toBeGreaterThanOrEqual(2);
    expect(templatesOfKind("tutorial")).toHaveLength(5);

    for (let number = 1; number <= 8; number += 1) {
      const student = courseProjectTemplate(`challenge_${number}`);
      const complete = courseProjectTemplate(`complete_challenge_${number}`);
      expect(complete.project.files["course_setup.py"]).toContain(
        "Student implementation files are intentionally absent",
      );
      expect(complete.project.files["course_setup.py"]).not.toMatch(
        /^from .*student/im,
      );
      expect(complete.project.files["course_setup.py"]).not.toContain(
        "USE_STUDENT_",
      );
      expect(complete.project.files["component_checks.py"]).toBeUndefined();
      for (const component of student.components) {
        expect(complete.project.files[component.file]).toBeUndefined();
      }
      expect(complete.project.files["README.md"]).toContain(
        "Student component files and component checks are intentionally absent",
      );
      expect(complete.project.files["README.md"]).not.toMatch(
        /Test components|USE_STUDENT_|What you implement|Continue from Challenge/,
      );
      for (const link of complete.project.files["README.md"]!.matchAll(
        /\]\(([^)]+)\)/g,
      )) {
        expect(
          complete.project.files[link[1]!],
          `${complete.id} README link ${link[1]}`,
        ).toBeDefined();
      }
      expect(complete.project.files["main.py"]).toBe(
        student.project.files["main.py"],
      );
      const courseSetupImport = complete.project.files["main.py"]!.match(
        /from course_setup import\s*(?:\(([\s\S]*?)\)|([^\n]+))/,
      );
      expect(
        courseSetupImport,
        `${complete.id} course_setup import`,
      ).not.toBeNull();
      const importedFactories = (
        courseSetupImport![1] ?? courseSetupImport![2]!
      )
        .split(",")
        .map((name) => name.trim())
        .filter(Boolean);
      for (const factory of importedFactories) {
        expect(
          complete.project.files["course_setup.py"],
          `${complete.id} defines ${factory}`,
        ).toMatch(new RegExp(`^def ${factory}\\(`, "m"));
      }
      expect(complete.components).toHaveLength(0);
      expect(complete.predecessorId).toBeNull();
    }
    const demo = courseProjectTemplate("demo_obstacle_turn");
    expect(demo.project.files["main.py"]).toContain("drive_until_close");
    expect(demo.project.files["main.py"]).toContain("turn_quarter_turn");
    expect(demo.project.files["main.py"]).toContain("live.number");
    const spiral = courseProjectTemplate("demo_spiral");
    expect(spiral.project.files["main.py"]).toContain(
      "spiral_winding_turns_per_m",
    );
    expect(spiral.project.files["main.py"]).toContain(
      "OBSTACLE_STOP_MM = 150.0",
    );
    for (const demoId of [
      "demo_random_snake",
      "demo_roomba",
      "demo_ucsb_logo",
    ]) {
      expect(
        Object.keys(courseProjectTemplate(demoId).project.files).sort(),
      ).toEqual([
        "README.md",
        "course_setup.py",
        "main.py",
        "robot_config.py",
        "world.json",
      ]);
    }
    const snake = courseProjectTemplate("demo_random_snake");
    expect(snake.project.files["main.py"]).toContain("pi / 2.0");
    expect(snake.project.files["main.py"]).toContain(
      "direction = -1.0 if random.unit() < 0.5 else 1.0",
    );
    const roomba = courseProjectTemplate("demo_roomba");
    expect(roomba.project.files["main.py"]).toContain(
      "OBSTACLE_THRESHOLD_MM = 250.0",
    );
    expect(roomba.project.files["main.py"]).toContain(
      "MAXIMUM_CONSECUTIVE_MISSING_RANGES = 10",
    );
    const logo = courseProjectTemplate("demo_ucsb_logo");
    expect(logo.project.files["main.py"]).toContain(
      "ROUTE = WORLD.waypoints()",
    );
    expect(
      logo.project.files["world.json"]!.match(/"type": "waypoint"/g),
    ).toHaveLength(28);
    const tutorial = courseProjectTemplate("micropython_tutorial");
    expect(tutorial.project.entrypoint).toBe("main.py");
    expect(tutorial.project.files["student_work.py"]).toContain(
      "average_speed_mm_s",
    );
    expect(tutorial.project.files["README.md"]).toContain("Start with **Run**");
    expect(Object.keys(tutorial.project.files)).toHaveLength(5);

    const drawing = courseProjectTemplate("tutorial_virtual_drawing");
    expect(drawing.project.files["student_work.py"]).toContain(
      "class DrawingSegment",
    );
    expect(drawing.project.files["main.py"]).toContain("robot.step");

    const robotPrograms = courseProjectTemplate("tutorial_robot_programs");
    expect(robotPrograms.project.files["student_work.py"]).toContain(
      "run_robot_program",
    );
    expect(robotPrograms.project.files["README.md"]).toContain(
      "Robot.step controls the sample time",
    );

    const telemetry = courseProjectTemplate("tutorial_behavior_telemetry");
    expect(telemetry.project.files["student_work.py"]).toContain("live.number");
    expect(telemetry.project.files["student_work.py"]).toContain(
      "publish_telemetry",
    );
    expect(telemetry.project.files["world.json"]).toContain("Range target");

    const physicalPreflight = courseProjectTemplate(
      "tutorial_physical_preflight",
    );
    expect(physicalPreflight.project.files["main.py"]).toContain(
      "robot.step(STOP_COMMAND, read_range=True)",
    );
    expect(physicalPreflight.project.files["main.py"]).not.toContain(
      "sleep_ms",
    );
    expect(
      physicalPreflight.project.files["README.md"]!.replace(/\s+/g, " "),
    ).toContain("Set up or Repair");
    for (const template of COURSE_PROJECT_TEMPLATES) {
      expect(template.project.files["world.json"]).toContain('"worlds"');
    }
  });

  it("declares the challenge sequence and student component progression", () => {
    expect(nextChallengeTemplate("challenge_1")?.id).toBe("challenge_2");
    expect(nextChallengeTemplate("challenge_5")?.id).toBe("challenge_6");
    expect(nextChallengeTemplate("challenge_8")).toBeNull();
    expect(nextChallengeTemplate("demo_spiral")).toBeNull();

    const second = courseProjectTemplate("challenge_2");
    expect(second.predecessorId).toBe("challenge_1");
    expect(second.components.map((component) => component.name)).toEqual([
      "SensorModel",
      "WheelSpeedController",
      "DifferentialDrive",
      "Odometry",
    ]);
    expect(
      second.components
        .filter((component) => component.carryForward)
        .map((component) => component.file),
    ).toEqual(["sensor_model.py", "wheel_speed_controller.py"]);
    expect(
      courseProjectTemplate("challenge_8").components.map(
        (component) => component.name,
      ),
    ).toEqual([
      "SensorModel",
      "WheelSpeedController",
      "DifferentialDrive",
      "Odometry",
      "NavigationController",
      "GridPlanner",
      "RangeSafetyController",
      "PoseCorrector",
      "VisitOrderPlanner",
    ]);
  });

  it("keeps every public project world in the full course arena", () => {
    const expectedBounds = {
      minimum_x_mm: COURSE_ARENA_BOUNDS.minimumXmm,
      minimum_y_mm: COURSE_ARENA_BOUNDS.minimumYmm,
      maximum_x_mm: COURSE_ARENA_BOUNDS.maximumXmm,
      maximum_y_mm: COURSE_ARENA_BOUNDS.maximumYmm,
    };
    for (const template of COURSE_PROJECT_TEMPLATES) {
      const catalog = JSON.parse(template.project.files["world.json"]!) as {
        worlds: Array<{ bounds: Record<string, number> }>;
      };
      for (const world of catalog.worlds) {
        expect(world.bounds, `${template.id} world bounds`).toEqual(
          expectedBounds,
        );
      }
    }
  });

  it("creates a self-contained next challenge with only declared work carried forward", () => {
    const first = courseProjectTemplate("challenge_1").project;
    const current = {
      ...first,
      files: {
        ...first.files,
        "sensor_model.py": "# completed sensor model\n",
        "wheel_speed_controller.py": "# completed wheel controller\n",
        "course_setup.py": first.files["course_setup.py"]!.replace(
          "USE_STUDENT_SENSOR_MODEL = False",
          "USE_STUDENT_SENSOR_MODEL = True",
        ).replace(
          "USE_STUDENT_WHEEL_SPEED_CONTROLLER = False",
          "USE_STUDENT_WHEEL_SPEED_CONTROLLER = True",
        ),
        "main.py": "# a changed Challenge 1 task\n",
        "notes.txt": "not part of the next challenge\n",
      },
    };

    const next = createNextChallengeProject("challenge_1", current);
    const canonical = courseProjectTemplate("challenge_2").project;

    expect(next.name).toBe(canonical.name);
    expect(next.entrypoint).toBe("main.py");
    expect(next.files["sensor_model.py"]).toBe("# completed sensor model\n");
    expect(next.files["wheel_speed_controller.py"]).toBe(
      "# completed wheel controller\n",
    );
    expect(next.files["main.py"]).toBe(canonical.files["main.py"]);
    expect(next.files["notes.txt"]).toBeUndefined();
    expect(next.files["course_setup.py"]).toContain(
      "USE_STUDENT_SENSOR_MODEL = True",
    );
    expect(next.files["course_setup.py"]).toContain(
      "USE_STUDENT_WHEEL_SPEED_CONTROLLER = True",
    );
    expect(next.files["course_setup.py"]).toContain(
      "USE_STUDENT_DIFFERENTIAL_DRIVE = False",
    );
    expect(next.files["course_setup.py"]).toContain(
      "USE_STUDENT_ODOMETRY = False",
    );
    expect(first.files["sensor_model.py"]).not.toBe(
      "# completed sensor model\n",
    );
  });

  it("carries exactly the declared components through every challenge transition", () => {
    for (let challenge = 1; challenge < 8; challenge += 1) {
      const currentId = `challenge_${challenge}`;
      const current = courseProjectTemplate(currentId).project;
      const nextTemplate = nextChallengeTemplate(currentId)!;
      const markedFiles = Object.fromEntries(
        nextTemplate.components
          .filter((component) => component.carryForward)
          .map((component) => [
            component.file,
            `# carried ${component.name} from ${currentId}\n`,
          ]),
      );
      const next = createNextChallengeProject(currentId, {
        ...current,
        files: {
          ...current.files,
          ...markedFiles,
          "course_setup.py": nextTemplate.components
            .filter((component) => component.carryForward)
            .reduce(
              (source, component) =>
                source.replace(
                  `${component.selectionFlag} = False`,
                  `${component.selectionFlag} = True`,
                ),
              current.files["course_setup.py"]!,
            ),
        },
      });

      for (const component of nextTemplate.components) {
        if (component.carryForward) {
          expect(next.files[component.file]).toBe(markedFiles[component.file]);
          expect(next.files["course_setup.py"]).toContain(
            `${component.selectionFlag} = True`,
          );
        } else {
          expect(next.files[component.file]).toBe(
            nextTemplate.project.files[component.file],
          );
          expect(next.files["course_setup.py"]).toContain(
            `${component.selectionFlag} = False`,
          );
        }
      }
    }
  });

  it("preserves incomplete and partially selected component states", () => {
    const first = courseProjectTemplate("challenge_1").project;
    const partial = {
      ...first,
      files: {
        ...first.files,
        "sensor_model.py": "# sensor work in progress\n",
        "wheel_speed_controller.py": "# checked wheel controller\n",
        "course_setup.py": first.files["course_setup.py"]!.replace(
          "USE_STUDENT_WHEEL_SPEED_CONTROLLER = False",
          "USE_STUDENT_WHEEL_SPEED_CONTROLLER = True",
        ),
      },
    };

    const next = createNextChallengeProject("challenge_1", partial);

    expect(next.files["sensor_model.py"]).toBe("# sensor work in progress\n");
    expect(next.files["wheel_speed_controller.py"]).toBe(
      "# checked wheel controller\n",
    );
    expect(next.files["course_setup.py"]).toContain(
      "USE_STUDENT_SENSOR_MODEL = False",
    );
    expect(next.files["course_setup.py"]).toContain(
      "USE_STUDENT_WHEEL_SPEED_CONTROLLER = True",
    );
  });

  it("rejects incomplete or terminal challenge progression", () => {
    const first = courseProjectTemplate("challenge_1").project;
    expect(() =>
      createNextChallengeProject("challenge_1", {
        ...first,
        files: { ...first.files, "sensor_model.py": undefined as never },
      }),
    ).toThrow("sensor_model.py");
    expect(() =>
      createNextChallengeProject(
        "challenge_8",
        courseProjectTemplate("challenge_8").project,
      ),
    ).toThrow("No challenge follows");
  });
});
