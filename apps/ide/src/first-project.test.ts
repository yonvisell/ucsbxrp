import { expect, it } from "vitest";
import type { CourseDirectoryHandle } from "../../shared/course-folder";
import {
  nextAvailableProjectName,
  nextFirstProjectName,
  ProjectNameDraft,
} from "./first-project";

function folder(names: string[], beforeRead?: () => Promise<void>) {
  return {
    async *entries() {
      await beforeRead?.();
      for (const name of names) yield [name, {}];
    },
  } as unknown as CourseDirectoryHandle;
}

function deferred() {
  let resolve!: () => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<void>((success, failure) => {
    resolve = success;
    reject = failure;
  });
  return { promise, resolve, reject };
}

it("offers the first unused numbered name across case variants and file names", async () => {
  const parent = {
    async *entries() {
      for (const name of ["XRP_Project_01", "xrp_project_02", "XRP_Project_04"])
        yield [name, {}];
    },
  } as unknown as CourseDirectoryHandle;
  expect(await nextFirstProjectName(parent)).toBe("XRP_Project_03");
});

it("keeps an unused template name and enumerates files, case and normalized-name collisions", async () => {
  expect(await nextAvailableProjectName(folder([]), "Expanding-spiral")).toBe(
    "Expanding-spiral",
  );
  expect(
    await nextAvailableProjectName(
      folder([
        "Expanding-Spiral",
        "expanding-spiral_01",
        "Expanding-spiral_03",
      ]),
      "Expanding-spiral",
    ),
  ).toBe("Expanding-spiral_02");
  expect(await nextAvailableProjectName(folder(["Cafe\u0301"]), "Café")).toBe(
    "Café_01",
  );
});

it("bounds scans by actual entries and keeps suffixed names within the folder-name limit", async () => {
  await expect(
    nextAvailableProjectName(folder(Array(10_001).fill("same")), "Project"),
  ).rejects.toThrow("smaller Working folder");
  const base = "P".repeat(255);
  const name = await nextAvailableProjectName(folder([base]), base);
  expect(name).toHaveLength(255);
  expect(name.endsWith("_01")).toBe(true);
});

it("updates only generated names and rechecks a name occupied before Create", async () => {
  const draft = new ProjectNameDraft();
  const template = {};
  const names: string[] = [];
  const parent = folder(names);
  expect(draft.reset(template, "Project")).toBe("Project");
  expect(await draft.suggest(parent, template)).toBe("Project");
  names.push("project");
  expect(await draft.suggest(parent, template)).toBe("Project_01");
  expect(draft.name).toBe("Project_01");
});

it("preserves a custom name across a pending scan and a different template", async () => {
  const draft = new ProjectNameDraft();
  const first = {},
    second = {};
  draft.reset(first, "First");
  const delayed = deferred();
  const pending = draft.suggest(
    folder(["First"], () => delayed.promise),
    first,
  );
  draft.edit("Team 7");
  delayed.resolve();
  expect(await pending).toBeNull();
  expect(draft.select(second, "Second")).toBe("Team 7");
  expect(await draft.suggest(folder(["Team 7"]), second)).toBe("Team 7");
  expect(draft.isCustom).toBe(true);
});

it("ignores an earlier approved folder that finishes after the newly selected folder", async () => {
  const draft = new ProjectNameDraft();
  const template = {};
  draft.reset(template, "Project");
  const delayed = deferred();
  const old = draft.suggest(
    folder(["Project", "Project_01"], () => delayed.promise),
    template,
  );
  expect(await draft.suggest(folder(["Project"]), template)).toBe("Project_01");
  delayed.resolve();
  expect(await old).toBeNull();
  expect(draft.name).toBe("Project_01");
});

it("rejects stale template scans and closing a dialog invalidates its pending suggestion", async () => {
  const draft = new ProjectNameDraft();
  const first = {},
    second = {};
  draft.reset(first, "First");
  const delayed = deferred();
  const old = draft.suggest(
    folder(["First"], () => delayed.promise),
    first,
  );
  draft.select(second, "Second");
  expect(await draft.suggest(folder([]), second)).toBe("Second");
  delayed.resolve();
  expect(await old).toBeNull();
  expect(await draft.suggest(folder([]), first)).toBeNull();
  const closing = deferred();
  const pending = draft.suggest(
    folder(["Second"], () => closing.promise),
    second,
  );
  draft.reset(null, "");
  closing.resolve();
  expect(await pending).toBeNull();
  expect(draft.name).toBe("");
});

it("ignores a late permission error after a custom name replaces its suggestion", async () => {
  const draft = new ProjectNameDraft();
  const template = {};
  draft.reset(template, "Project");
  const delayed = deferred();
  const pending = draft.suggest(
    folder([], () => delayed.promise),
    template,
  );
  draft.edit("My work");
  delayed.reject(new Error("Folder access ended"));
  expect(await pending).toBeNull();
  expect(draft.name).toBe("My work");
});
