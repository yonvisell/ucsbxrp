import { describe, expect, it, vi } from "vitest";

import { DirectPhysicalTargetClient } from "./physical-target";
import { MAX_PORTABLE_PROJECT_FILES } from "./project-validation";
import type { CourseProject, TargetEvent } from "./types";
import {
  VirtualTargetClient,
  testCourseProjectComponents,
} from "./virtual-target";

function oversizedProject(): CourseProject {
  return {
    name: "Too many files",
    entrypoint: "main.py",
    files: Object.fromEntries([
      ["main.py", "print('ready')\n"],
      ...Array.from({ length: MAX_PORTABLE_PROJECT_FILES }, (_, index) => [
        `notes_${index}.txt`,
        "",
      ]),
    ]),
  };
}

describe("portable project target boundary", () => {
  it("rejects an incompatible project before virtual compilation or execution", async () => {
    const target = new VirtualTargetClient();
    const events: TargetEvent[] = [];
    target.subscribe((event) => events.push(event));

    await expect(target.check(oversizedProject())).resolves.toEqual({
      ok: false,
      detail:
        "This project has 49 files; an XRP project may contain at most 48. Remove or move 1 file, then try again.",
    });
    await expect(target.run(oversizedProject())).rejects.toThrow(
      "This project has 49 files",
    );
    await expect(target.synchronize(oversizedProject())).rejects.toThrow(
      "This project has 49 files",
    );
    await expect(
      testCourseProjectComponents(oversizedProject()),
    ).resolves.toMatchObject({
      ok: false,
      detail: expect.stringContaining("at most 48"),
    });
    expect(events).toContainEqual(
      expect.objectContaining({
        type: "console",
        line: expect.stringContaining("Compilation failed"),
      }),
    );
  });

  it("rejects an incompatible project before any physical XRP request", async () => {
    const fetchMock = vi.fn();
    const target = new DirectPhysicalTargetClient("192.168.7.30", {
      fetch: fetchMock,
    });

    await expect(target.check(oversizedProject())).resolves.toMatchObject({
      ok: false,
      detail: expect.stringContaining("at most 48"),
    });
    await expect(target.synchronize(oversizedProject())).rejects.toThrow(
      "This project has 49 files",
    );
    await expect(target.run(oversizedProject())).rejects.toThrow(
      "This project has 49 files",
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
