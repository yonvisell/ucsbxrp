import { describe, expect, it } from "vitest";
import type { CourseDirectoryHandle, CourseFileHandle } from "./course-folder";
import { resolveProjectFolderById } from "./project-binding";

function project(name: string, projectId: string): CourseDirectoryHandle {
  return {
    kind: "directory",
    name,
    getFileHandle: async () =>
      ({
        getFile: async () => ({
          size: 100,
          text: async () => JSON.stringify({ session: { projectId } }),
        }),
      }) as CourseFileHandle,
  } as unknown as CourseDirectoryHandle;
}
function workspace(children: CourseDirectoryHandle[]): CourseDirectoryHandle {
  return {
    name: "Working",
    kind: "directory",
    async *entries() {
      for (const child of children) yield [child.name, child];
    },
  } as unknown as CourseDirectoryHandle;
}
describe("immutable run destination", () => {
  it("resolves project identity regardless of folder name or global selection", async () => {
    const source = project("renamed-A", "A");
    expect(
      await resolveProjectFolderById(
        workspace([project("active-B", "B"), source]),
        "A",
      ),
    ).toBe(source);
  });
  it("refuses ambiguous copied project IDs rather than choosing first or active", async () => {
    await expect(
      resolveProjectFolderById(
        workspace([project("original", "A"), project("copied", "A")]),
        "A",
      ),
    ).rejects.toThrow("Several Project folders");
  });
  it("does not substitute another project when the source was removed", async () => {
    expect(
      await resolveProjectFolderById(workspace([project("B", "B")]), "A"),
    ).toBeNull();
  });
});
