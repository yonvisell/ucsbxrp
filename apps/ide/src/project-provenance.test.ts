import { describe, expect, it } from "vitest";
import {
  courseProjectTemplate,
  type CourseProjectTemplate,
} from "@ucsb-xrp/target";
import type { ProjectSnapshot } from "./project-files";
import {
  createProjectSession,
  snapshotForProjectSession,
} from "./project-session";
import {
  compareTemplateUpdate,
  createTemplateUpdateCopy,
  sourceTextDigest,
  stampProjectProvenance,
  validProjectProvenance,
} from "./project-provenance";

function template(
  files: Record<string, string>,
  id = "challenge_test",
): CourseProjectTemplate {
  return {
    id,
    label: id,
    shortLabel: id,
    summary: "Test fixture",
    kind: "challenge",
    components: [
      {
        name: "Odometry",
        file: "student_odometry.py",
        selectionFlag: "student",
      },
    ],
    project: { name: "Starter", entrypoint: "main.py", files },
  };
}
const original = template({
  "main.py": "print('old task')\n",
  "helper.py": "HELPER = 1\n",
  "student_odometry.py": "TODO = True\n",
  "course_setup.py": "CALIBRATION = 1\n",
  "world.json": "{}\n",
  "README.md": "Old instructions\n",
  "obsolete.py": "OLD = True\n",
});
const updated = template({
  ...original.project.files,
  "main.py": "print('corrected task')\n",
  "helper.py": "HELPER = 2\n",
  "student_odometry.py": "TODO = False\n",
  "course_setup.py": "CALIBRATION = 2\n",
  "world.json": '{"size": 2}\n',
  "README.md": "Corrected instructions\n",
  "new_helper.py": "NEW = True\n",
});
async function created(): Promise<ProjectSnapshot> {
  const stamped = await stampProjectProvenance(
    { ...original.project, name: "My Project", templateId: original.id },
    original,
    "dev.old",
  );
  return snapshotForProjectSession(
    createProjectSession(stamped, {
      source: "folder",
      createProjectId: () => "source-project",
      now: 100,
    }),
  );
}

describe("template correction provenance", () => {
  it("hashes the exact supplied source and retains unknown provenance for legacy projects", async () => {
    const project = await created();
    expect(validProjectProvenance(project.provenance)).toBe(true);
    expect(project.provenance?.origin.originalFileDigests["main.py"]).toBe(
      await sourceTextDigest(original.project.files["main.py"]!),
    );
    expect(
      (await compareTemplateUpdate(project, original, "new-app-same-template"))
        .status,
    ).toBe("current");
    const legacy = { ...project };
    delete legacy.provenance;
    expect((await compareTemplateUpdate(legacy, updated, "new")).status).toBe(
      "unknown",
    );
    await expect(
      createTemplateUpdateCopy(legacy, updated, "new", "copy"),
    ).rejects.toThrow("unknown");
    expect(legacy.provenance).toBeUndefined();
  });

  it("updates only unchanged supplied files in a separate identity and preserves edited, deleted, component, setting and unknown bytes", async () => {
    const source = await created();
    source.files["helper.py"] = "STUDENT_HELPER = 900\n";
    source.files["student_odometry.py"] = "MY_ODOMETRY = 42\n";
    source.files["student_notes.md"] = "My measurements\n";
    delete source.files["README.md"];
    const before = JSON.stringify(source);
    const result = await createTemplateUpdateCopy(
      source,
      updated,
      "dev.new",
      "Corrected copy",
      { createProjectId: () => "new-project", now: 200 },
    );
    expect(result.comparison.status).toBe("available");
    expect(result.comparison.update).toEqual(["main.py"]);
    expect(result.comparison.add).toEqual(["new_helper.py"]);
    expect(result.comparison.conflicts).toEqual(
      expect.arrayContaining([
        { path: "helper.py", reason: "edited" },
        { path: "student_odometry.py", reason: "component" },
        { path: "README.md", reason: "deleted" },
        { path: "world.json", reason: "settings" },
        { path: "course_setup.py", reason: "settings" },
      ]),
    );
    expect(result.project.files["main.py"]).toBe(
      updated.project.files["main.py"],
    );
    for (const path of [
      "helper.py",
      "student_odometry.py",
      "student_notes.md",
      "course_setup.py",
      "world.json",
    ])
      expect(result.project.files[path]).toBe(source.files[path]);
    expect(result.project.files["README.md"]).toBeUndefined();
    expect(result.project.session).toEqual({
      projectId: "new-project",
      revision: 1,
      savedRevision: 0,
      updatedAt: 200,
    });
    expect(result.project.provenance?.origin).toEqual(
      source.provenance?.origin,
    );
    expect(result.project.provenance?.baseline.creationRelease).toBe("dev.new");
    expect(result.project.provenance?.parent?.projectId).toBe("source-project");
    expect(JSON.stringify(source)).toBe(before);
  });

  it("does not remove a previously supplied file or collide with a student-created case-equivalent path", async () => {
    const source = await created();
    source.files["NEW_HELPER.py"] = "KEEP = 7\n";
    const removed = template({ ...updated.project.files });
    delete removed.project.files["obsolete.py"];
    const result = await createTemplateUpdateCopy(
      source,
      removed,
      "new",
      "copy",
    );
    expect(result.project.files["obsolete.py"]).toBe(
      source.files["obsolete.py"],
    );
    expect(result.project.files["NEW_HELPER.py"]).toBe("KEEP = 7\n");
    expect(result.project.files["new_helper.py"]).toBeUndefined();
    expect(result.comparison.conflicts).toContainEqual({
      path: "new_helper.py",
      reason: "path-collision",
    });
    expect(result.comparison.conflicts).toContainEqual({
      path: "obsolete.py",
      reason: "removed-from-template",
    });
  });

  it("retains origin and parent through carry-forward and deep-clones saved/recovered metadata", async () => {
    const source = await created();
    const nextTemplate = template(original.project.files, "challenge_next");
    const carried = await stampProjectProvenance(
      { ...source, name: "Next", templateId: nextTemplate.id },
      nextTemplate,
      "new",
      source,
    );
    expect(carried.provenance?.origin).toEqual(source.provenance?.origin);
    expect(carried.provenance?.baseline.templateId).toBe("challenge_next");
    expect(carried.provenance?.parent).toEqual({
      projectId: "source-project",
      revision: 0,
    });
    const recovered = snapshotForProjectSession(
      createProjectSession(JSON.parse(JSON.stringify(carried)), {
        source: "browser-draft",
      }),
    );
    expect(recovered.provenance).toEqual(carried.provenance);
    recovered.provenance!.origin.originalFileDigests["main.py"] = "f".repeat(
      64,
    );
    expect(carried.provenance!.origin.originalFileDigests["main.py"]).not.toBe(
      "f".repeat(64),
    );
  });

  it("works with an actual catalog template without inferring lineage from a project name", async () => {
    const supplied = courseProjectTemplate("demo_spiral");
    const project = await stampProjectProvenance(
      {
        ...supplied.project,
        name: "Renamed by student",
        templateId: supplied.id,
      },
      supplied,
      "dev.47",
    );
    expect(
      (await compareTemplateUpdate(project, supplied, "dev.48")).status,
    ).toBe("current");
    expect(project.provenance?.origin.templateId).toBe(supplied.id);
  });
});
