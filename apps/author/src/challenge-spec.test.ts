import { describe, expect, it } from "vitest";

import exampleSource from "../../../docs/examples/waypoint_slalom.challenge.json?raw";
import {
  authoringCommand,
  linesFromText,
  specificationFilename,
  suppliedFilesFromText,
  validateChallengeSpec,
  type ChallengeSpec,
} from "./challenge-spec";

describe("challenge authoring specification", () => {
  it("accepts the complete waypoint slalom example", () => {
    const spec = JSON.parse(exampleSource) as ChallengeSpec;
    expect(validateChallengeSpec(spec)).toEqual([]);
    expect(specificationFilename(spec)).toBe("challenge_6.challenge.json");
    expect(authoringCommand(specificationFilename(spec))).toBe(
      "python3 scripts/challenge_authoring.py create --spec challenge_6.challenge.json",
    );
  });

  it("reports missing teaching evidence and malformed world bounds", () => {
    const spec = JSON.parse(exampleSource) as ChallengeSpec;
    spec.evidence = [];
    const world = spec.world.worlds as Array<Record<string, unknown>>;
    world[0]!.bounds = {
      minimum_x_mm: 10,
      minimum_y_mm: 0,
      maximum_x_mm: 5,
      maximum_y_mm: 100,
    };
    const errors = validateChallengeSpec(spec);
    expect(errors).toContain(
      "Evidence must contain at least one nonempty item.",
    );
    expect(errors).toContain(
      "World JSON: worlds[0].bounds must have positive width and height",
    );
  });

  it("rejects unsafe student declarations and malformed world markers", () => {
    const spec = JSON.parse(exampleSource) as ChallengeSpec;
    spec.student_implementations = [
      {
        file: "../controller.py",
        class_name: "not-a-class",
        selection_flag: "USE_STUDENT_CONTROLLER",
        responsibility: "Return a motion command.",
      },
    ];
    const world = (spec.world.worlds as Array<Record<string, unknown>>)[0]!;
    world.markers = [
      {
        type: "start_line",
        x1_mm: -250,
        y1_mm: 0,
        x2_mm: 0,
        y2_mm: 0,
      },
    ];

    const errors = validateChallengeSpec(spec);
    expect(errors).toContain(
      "Student implementation 1 needs a safe project-relative Python file.",
    );
    expect(errors).toContain(
      "Student implementation 1 needs a valid Python class name.",
    );
    expect(errors).toContain(
      "World JSON: worlds[0].markers[0] must be inside the world bounds",
    );
  });

  it("rejects a world that does not satisfy the copied program flow", () => {
    const spec = JSON.parse(exampleSource) as ChallengeSpec;
    spec.source_id = "challenge_2";
    expect(validateChallengeSpec(spec)).toContain(
      "challenge_2 source requires a waypoint named turn.",
    );
  });

  it("allows a complete challenge loader to define different world names", () => {
    const spec = JSON.parse(exampleSource) as ChallengeSpec;
    spec.source_id = "challenge_4";
    spec.files = { ...spec.files, "challenge.py": "ROUTE = ()\n" };
    expect(validateChallengeSpec(spec)).toEqual([]);
  });

  it("requires complete source for a newly declared component", () => {
    const spec = JSON.parse(exampleSource) as ChallengeSpec;
    spec.student_implementations.push({
      file: "route_analyzer.py",
      class_name: "RouteAnalyzer",
      selection_flag: "USE_STUDENT_ROUTE_ANALYZER",
      responsibility: "Return a route-error summary from recorded poses.",
    });
    expect(validateChallengeSpec(spec)).toContain(
      "Student implementation 2 needs a complete route_analyzer.py project-file override.",
    );

    spec.files = {
      ...spec.files,
      "route_analyzer.py": "class WrongName:\n    pass\n",
    };
    expect(validateChallengeSpec(spec)).toContain(
      "The route_analyzer.py override must define class RouteAnalyzer.",
    );

    spec.files["route_analyzer.py"] = "class RouteAnalyzer:\n    pass\n";
    expect(validateChallengeSpec(spec)).toEqual([]);
  });

  it("uses catalog metadata for inherited class and selection identities", () => {
    const spec = JSON.parse(exampleSource) as ChallengeSpec;
    spec.student_implementations[0]!.class_name = "RenamedNavigator";
    spec.student_implementations[0]!.selection_flag =
      "USE_STUDENT_RENAMED_NAVIGATOR";

    const errors = validateChallengeSpec(spec);
    expect(errors).toContain(
      "navigation_controller.py defines NavigationController in the starting challenge, not RenamedNavigator.",
    );
    expect(errors).toContain(
      "RenamedNavigator must retain selection flag USE_STUDENT_NAVIGATION_CONTROLLER.",
    );
  });

  it("parses compact line-oriented form fields without empty entries", () => {
    expect(linesFromText(" first \n\n second\n")).toEqual(["first", "second"]);
    expect(
      suppliedFilesFromText(
        "world.json | Defines the world\nRobot | Runs control",
      ),
    ).toEqual([
      { name: "world.json", use: "Defines the world" },
      { name: "Robot", use: "Runs control" },
    ]);
  });
});
