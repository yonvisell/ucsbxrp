import { describe, expect, it } from "vitest";

import { COURSE_ARENA_BOUNDS } from "@ucsb-xrp/simulator";

import {
  COURSE_PROJECT_TEMPLATES,
  COURSE_STARTERS,
  describeChallengeProjectTransition,
  courseProjectTemplate,
  courseStarter,
} from "./course-project";

describe("course starter catalog", () => {
  it("bundles the published challenges, including standalone experimental 9", () => {
    expect(COURSE_STARTERS.map((starter) => starter.id)).toEqual([
      "challenge_1",
      "challenge_2",
      "challenge_3",
      "challenge_4",
      "challenge_5",
      "challenge_6",
      "challenge_7",
      "challenge_8",
      "challenge_9",
    ]);
    for (const starter of COURSE_STARTERS) {
      expect(starter.project.entrypoint).toBe("main.py");
      expect(starter.project.files["main.py"]).toBeTruthy();
      expect(starter.project.files["README.md"]).toContain("Challenge");
      expect(starter.project.files["component_checks.py"]).toBeTruthy();
      expect(Object.keys(starter.project.files).length).toBeGreaterThanOrEqual(
        5,
      );
    }
  });

  it("looks up a starter without silently falling back", () => {
    expect(courseStarter("challenge_3").label).toContain("Waypoint Courier");
    expect(() => courseStarter("challenge_10")).toThrow(
      "Unknown course starter",
    );
  });

  it("groups student challenges, complete variants, demos, and tutorials", () => {
    const templatesOfKind = (
      kind: (typeof COURSE_PROJECT_TEMPLATES)[number]["kind"],
    ) => COURSE_PROJECT_TEMPLATES.filter((template) => template.kind === kind);
    expect(templatesOfKind("challenge")).toHaveLength(9);
    expect(templatesOfKind("complete-challenge")).toHaveLength(9);
    expect(templatesOfKind("demo").length).toBeGreaterThanOrEqual(2);
    expect(templatesOfKind("tutorial")).toHaveLength(5);

    for (let number = 1; number <= 9; number += 1) {
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

  it("declares project component sets without encoding a teaching order", () => {
    const second = courseProjectTemplate("challenge_2");
    expect(second.components.map((component) => component.name)).toEqual([
      "SensorModel",
      "WheelSpeedController",
      "DifferentialDrive",
      "Odometry",
    ]);
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
    expect(
      courseProjectTemplate("challenge_9").components.map(
        (component) => component.name,
      ),
    ).toEqual(["LineFollower"]);
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

  it("creates a self-contained selected challenge without changing the source", () => {
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
        "notes.txt": "student observations\n",
        "helpers.py": "def clamp(value):\n    return value\n",
      },
    };

    const transition = describeChallengeProjectTransition(
      "challenge_1",
      "challenge_2",
      current,
    );
    const next = transition.project;
    const canonical = courseProjectTemplate("challenge_2").project;

    expect(next.name).toBe(canonical.name);
    expect(next.entrypoint).toBe("main.py");
    expect(next.files["sensor_model.py"]).toBe("# completed sensor model\n");
    expect(next.files["wheel_speed_controller.py"]).toBe(
      "# completed wheel controller\n",
    );
    expect(next.files["main.py"]).toBe(canonical.files["main.py"]);
    expect(next.files["notes.txt"]).toBe("student observations\n");
    expect(next.files["helpers.py"]).toContain("def clamp");
    expect(next.files["robot_config.py"]).toContain("NAVIGATION_CONFIG");
    expect(next.files["robot_config.py"]).toContain("turn_rate_rad_s=0.8");
    expect(next.files["robot_config.py"]).not.toContain("STRAIGHT_CONFIG");
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
    expect(transition.preserve).toEqual(
      expect.arrayContaining([
        "helpers.py",
        "notes.txt",
        "sensor_model.py",
        "wheel_speed_controller.py",
      ]),
    );
    expect(transition.merge).toEqual(["robot_config.py"]);
    expect(transition.replace).toEqual(
      expect.arrayContaining([
        "README.md",
        "challenge.py",
        "component_checks.py",
        "course_setup.py",
        "main.py",
        "world.json",
      ]),
    );
    expect(transition.add).toEqual(
      expect.arrayContaining(["differential_drive.py", "odometry.py"]),
    );
    expect(first.files["sensor_model.py"]).not.toBe(
      "# completed sensor model\n",
    );
  });

  it("can carry work between challenges independently of catalog order", () => {
    const source = courseProjectTemplate("challenge_5").project;
    const target = courseProjectTemplate("challenge_2").project;
    const transition = describeChallengeProjectTransition(
      "challenge_5",
      "challenge_2",
      {
        ...source,
        files: {
          ...source.files,
          "odometry.py": "# revised odometry\n",
          "notes.txt": "compare both challenges\n",
          "course_setup.py": source.files["course_setup.py"]!.replace(
            "USE_STUDENT_ODOMETRY = False",
            "USE_STUDENT_ODOMETRY = True",
          ),
        },
      },
    );

    expect(transition.project.name).toBe(target.name);
    expect(transition.project.files["main.py"]).toBe(target.files["main.py"]);
    expect(transition.project.files["odometry.py"]).toBe(
      "# revised odometry\n",
    );
    expect(transition.project.files["notes.txt"]).toBe(
      "compare both challenges\n",
    );
    expect(transition.project.files["course_setup.py"]).toContain(
      "USE_STUDENT_ODOMETRY = True",
    );
    expect(transition.preserve).toContain("notes.txt");
    expect(
      transition.project.files["navigation_controller.py"],
    ).toBeUndefined();
    expect(transition.project.files["grid_planner.py"]).toBeUndefined();
    expect(transition.omit).toEqual(
      expect.arrayContaining(["grid_planner.py", "navigation_controller.py"]),
    );
    expect(source.files["navigation_controller.py"]).toBeDefined();
  });

  it("keeps a standalone project minimal and reports omitted source components", () => {
    const source = courseProjectTemplate("challenge_5").project;
    const transition = describeChallengeProjectTransition(
      "challenge_5",
      "challenge_9",
      {
        ...source,
        files: { ...source.files, "notes.txt": "line test notes\n" },
      },
    );

    expect(transition.project.files["line_follower.py"]).toBeDefined();
    expect(transition.project.files["sensor_model.py"]).toBeUndefined();
    expect(transition.project.files["grid_planner.py"]).toBeUndefined();
    expect(transition.project.files["notes.txt"]).toBe("line test notes\n");
    expect(transition.project.files["robot_config.py"]).toContain(
      "LINE_FOLLOWER_SETTINGS",
    );
    expect(transition.omit).toEqual(
      expect.arrayContaining([
        "differential_drive.py",
        "grid_planner.py",
        "navigation_controller.py",
        "odometry.py",
        "sensor_model.py",
        "wheel_speed_controller.py",
      ]),
    );
  });

  it("preserves a target component whenever the current project contains it", () => {
    const second = courseProjectTemplate("challenge_2").project;
    const transition = describeChallengeProjectTransition(
      "challenge_2",
      "challenge_5",
      {
        ...second,
        files: {
          ...second.files,
          "grid_planner.py": "# retained grid planner\n",
        },
      },
    );

    expect(transition.project.files["grid_planner.py"]).toBe(
      "# retained grid planner\n",
    );
    expect(transition.preserve).toContain("grid_planner.py");
    expect(transition.project.files["course_setup.py"]).toContain(
      "USE_STUDENT_GRID_PLANNER = False",
    );
  });

  it("preserves incomplete and partially selected shared component states", () => {
    const first = courseProjectTemplate("challenge_1").project;
    const transition = describeChallengeProjectTransition(
      "challenge_1",
      "challenge_2",
      {
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
      },
    );
    const next = transition.project;

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

  it("rejects invalid challenge transition choices", () => {
    const first = courseProjectTemplate("challenge_1").project;
    expect(() =>
      describeChallengeProjectTransition("challenge_1", "challenge_1", first),
    ).toThrow("different challenge");
    expect(() =>
      describeChallengeProjectTransition("challenge_1", "demo_spiral", first),
    ).toThrow("two student challenges");
    expect(() =>
      describeChallengeProjectTransition("challenge_1", "challenge_2", {
        ...first,
        files: { ...first.files, "course_setup.py": undefined as never },
      }),
    ).toThrow("course_setup.py");
  });
});
