import { describe, expect, it } from "vitest";

import type { CourseDirectoryHandle } from "../../shared/course-folder";
import { createMonitorProjectIdResolver } from "./monitor-project-identity";

function folder(name: string): CourseDirectoryHandle {
  return { name } as CourseDirectoryHandle;
}

describe("Monitor project identity", () => {
  it("keeps one legacy folder stable without merging distinct handles", () => {
    const projectId = createMonitorProjectIdResolver();
    const first = folder("same-name");
    const second = folder("same-name");

    expect(projectId(first, undefined)).toBe(projectId(first, undefined));
    expect(projectId(second, undefined)).not.toBe(projectId(first, undefined));
    expect(projectId(first, { projectId: "project-session:42" })).toBe(
      "project-session:42",
    );
  });
});
