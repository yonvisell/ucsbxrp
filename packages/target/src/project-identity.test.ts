import { describe, expect, it } from "vitest";

import { describeProject, projectRevision } from "./project-identity";

describe("course project identity", () => {
  it("is stable across file insertion order and excludes the display name", async () => {
    const first = {
      name: "First name",
      entrypoint: "main.py",
      files: { "main.py": "print('ok')\n", "lib/a.py": "VALUE = 1\n" },
    };
    const second = {
      name: "Second name",
      entrypoint: "main.py",
      files: { "lib/a.py": "VALUE = 1\n", "main.py": "print('ok')\n" },
    };

    await expect(projectRevision(first)).resolves.toBe(
      await projectRevision(second),
    );
    await expect(projectRevision(first)).resolves.toBe(
      "94c8db611816a391e40858466e242721dc446e44bf0b02688f5a63056c5d73e3",
    );
  });

  it("changes for source or entrypoint changes", async () => {
    const base = {
      entrypoint: "main.py",
      files: { "main.py": "print('one')\n", "other.py": "print('two')\n" },
    };
    expect(
      await projectRevision({
        ...base,
        files: { ...base.files, "main.py": "print('changed')\n" },
      }),
    ).not.toBe(await projectRevision(base));
    expect(await projectRevision({ ...base, entrypoint: "other.py" })).not.toBe(
      await projectRevision(base),
    );
  });

  it("describes the runnable project without exposing its source", async () => {
    const descriptor = await describeProject({
      name: "  Straight run  ",
      entrypoint: "main.py",
      files: { "main.py": "pass\n" },
    });
    expect(descriptor).toMatchObject({
      name: "Straight run",
      entrypoint: "main.py",
      stale: false,
    });
    expect(descriptor.revision).toMatch(/^[a-f0-9]{64}$/);
    expect(descriptor).not.toHaveProperty("files");
  });
});
