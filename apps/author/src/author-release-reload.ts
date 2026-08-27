import type { ChallengeSpec } from "./challenge-spec";

export interface ChallengeAuthorDraft {
  spec: ChallengeSpec;
  worldSource: string;
  filesSource: string;
  evidenceSource: string;
  sequenceSource: string;
  suppliedSource: string;
}

/** Includes the editable source text so even temporarily invalid JSON is kept. */
export function challengeAuthorDraftFingerprint(
  draft: ChallengeAuthorDraft,
): string {
  return JSON.stringify(draft);
}

export function challengeAuthorReloadIsSafe(
  currentFingerprint: string,
  reloadableFingerprint: string,
  fileInteractionActive: boolean,
): boolean {
  return !fileInteractionActive && currentFingerprint === reloadableFingerprint;
}
