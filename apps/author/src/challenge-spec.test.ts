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
      "World waypoint-slalom bounds must have positive width and height.",
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
    spec.source_id = "challenge_2";
    spec.files = { ...spec.files, "challenge.py": "ROUTE = ()\n" };
    expect(validateChallengeSpec(spec)).toEqual([]);
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
