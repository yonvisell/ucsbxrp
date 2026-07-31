import type { CourseProject } from "./types";

const rawChallengeOneStarter = import.meta.glob(
  "../../../vendor/current/starters/challenge_1/*.py",
  {
    eager: true,
    import: "default",
    query: "?raw",
  },
) as Record<string, string>;

const starterDirectory = "../../../vendor/current/starters/challenge_1/";

const files = Object.fromEntries(
  Object.entries(rawChallengeOneStarter).map(([sourcePath, content]) => {
    if (!sourcePath.startsWith(starterDirectory)) {
      throw new Error(`Unexpected Challenge 1 starter file '${sourcePath}'`);
    }
    return [sourcePath.slice(starterDirectory.length), content];
  }),
);

if (Object.keys(files).length !== 5 || !("main.py" in files)) {
  throw new Error("The Challenge 1 starter must contain five Python files");
}

export const STAGE_ONE_PROJECT: CourseProject = Object.freeze({
  entrypoint: "main.py",
  files: Object.freeze(files),
});
