import { describe, expect, it } from "vitest";

import type { ChallengeSpec } from "./challenge-spec";
import {
  challengeAuthorDraftFingerprint,
  challengeAuthorReloadIsSafe,
} from "./author-release-reload";

const exampleSpec: ChallengeSpec = {
  schema_version: 1,
  source_id: "challenge_1",
  id: "challenge_6",
  title: "Example",
  summary: "Example summary",
  objective: "Reach the goal.",
  student_implementations: [],
  supplied_files: [],
  program_flow: "main.py runs the task.",
  evidence: [],
  work_sequence: [],
  world: {},
  files: {},
};

function draft(filesSource = JSON.stringify(exampleSpec.files ?? {})) {
  return {
    spec: exampleSpec,
    worldSource: JSON.stringify(exampleSpec.world),
    filesSource,
    evidenceSource: exampleSpec.evidence.join("\n"),
    sequenceSource: exampleSpec.work_sequence.join("\n"),
    suppliedSource: "",
  };
}

describe("challenge author course-update reload", () => {
  it("keeps temporarily invalid source text even when parsed values match", () => {
    const baseline = challengeAuthorDraftFingerprint(draft("{}"));
    const invalidDraft = challengeAuthorDraftFingerprint(draft("{"));

    expect(challengeAuthorReloadIsSafe(invalidDraft, baseline, false)).toBe(
      false,
    );
  });

  it("waits for file interaction and accepts an exact saved baseline", () => {
    const baseline = challengeAuthorDraftFingerprint(draft());

    expect(challengeAuthorReloadIsSafe(baseline, baseline, true)).toBe(false);
    expect(challengeAuthorReloadIsSafe(baseline, baseline, false)).toBe(true);
  });
});
