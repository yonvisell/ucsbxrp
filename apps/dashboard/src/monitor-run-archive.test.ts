import { describe, expect, it, vi } from "vitest";
import {
  autosaveDirectoryName,
  type CourseDirectoryHandle,
  type CourseFileHandle,
} from "../../shared/course-folder";
import {
  findRunGeneration,
  readRunAnnotations,
  saveRunAnnotations,
  saveRunArchive,
  type RunArchive,
} from "./monitor-run-archive";

vi.mock("../../ide/src/project-native-write", () => ({
  assertProjectWriterCurrent: async () => undefined,
  withProjectNativeWrite: async (
    _folder: unknown,
    _id: string,
    operation: () => Promise<unknown>,
  ) => operation(),
}));

function memoryFolder(
  files: Map<string, string>,
  prefix = "",
  beforeWrite: (path: string) => void = () => undefined,
): CourseDirectoryHandle {
  return {
    kind: "directory",
    name: prefix || "Project A",
    async *entries() {},
    getDirectoryHandle: async (name) =>
      memoryFolder(files, `${prefix}${name}/`, beforeWrite),
    getFileHandle: async (name, options) => {
      const path = prefix + name;
      if (!files.has(path) && !options?.create)
        throw new DOMException("Missing file", "NotFoundError");
      return {
        kind: "file",
        name,
        getFile: async () =>
          ({ text: async () => files.get(path) ?? "" }) as File,
        createWritable: async () => ({
          write: async (value: string | Blob) => {
            beforeWrite(path);
            files.set(
              path,
              typeof value === "string" ? value : await value.text(),
            );
          },
          close: async () => undefined,
        }),
      } as CourseFileHandle;
    },
    removeEntry: async (name) => {
      if (!files.delete(prefix + name))
        throw new DOMException("Missing file", "NotFoundError");
    },
  };
}
function archive(runId: string, notes = ""): RunArchive {
  const annotations = notes
    ? [
        {
          id: notes,
          label: notes,
          source: "virtual",
          seq: 1,
          tMs: 50,
          poseAvailable: true,
          xMm: 0,
          yMm: 0,
        },
      ]
    : [];
  return {
    runId,
    projectId: "project-a",
    metadata: JSON.stringify({
      runId,
      project: { projectId: "project-a", revision: "exact-source" },
      telemetrySamples: 2,
      annotations,
    }),
    telemetry: `source,seq,value,note\nvirtual,1,${runId},${notes}\nvirtual,2,${runId},\n`,
    output: `${runId} output`,
  };
}
function setup() {
  const files = new Map([
    [
      ".ucsb-xrp-project.json",
      JSON.stringify({ session: { projectId: "project-a" } }),
    ],
  ]);
  return { files, folder: memoryFolder(files) };
}

describe("run archives", () => {
  it("rejects a stale edited note after two remote edits but merges untouched stale notes and new additions", async () => {
    const { folder, files } = setup();
    const original = archive("concurrent", "base");
    const base = JSON.parse(original.metadata);
    const make = (
      label: string,
      revision: number,
      previousLabel?: string,
    ): RunArchive => ({
      ...original,
      metadata: JSON.stringify({
        ...base,
        annotations: [
          {
            ...base.annotations[0],
            label,
            revision,
            ...(previousLabel === undefined ? {} : { previousLabel }),
          },
        ],
      }),
    });
    await saveRunArchive(folder, original);
    await saveRunAnnotations(folder, make("A first", 1, "base"));
    await saveRunAnnotations(folder, make("A second", 2, "A first"));
    const before = [...files];
    await expect(
      saveRunAnnotations(folder, make("B independent", 1, "base")),
    ).rejects.toThrow("another Monitor");
    expect([...files]).toEqual(before);
    const staleWithAddition = make("A first", 1);
    const incoming = JSON.parse(staleWithAddition.metadata);
    incoming.annotations.push({
      ...base.annotations[0],
      id: "additional",
      label: "Separate observation",
    });
    staleWithAddition.metadata = JSON.stringify(incoming);
    await saveRunAnnotations(folder, staleWithAddition);
    const notes = await readRunAnnotations(folder, "concurrent", "project-a");
    expect(notes.map((note) => note.label)).toEqual([
      "A second",
      "Separate observation",
    ]);
    expect(notes.every((note) => note.previousLabel === undefined)).toBe(true);
  });
  it("edits exact notes, restores them on reopening, and rejects concurrent stale edits without changing saved data", async () => {
    const { folder, files } = setup();
    const original = archive("edited-run", "first text");
    await saveRunArchive(folder, original);
    const edited = { ...original };
    const metadata = JSON.parse(edited.metadata);
    metadata.annotations[0] = {
      ...metadata.annotations[0],
      label: "corrected, text\nsecond line",
      previousLabel: "first text",
      revision: 1,
    };
    edited.metadata = JSON.stringify(metadata);
    await saveRunAnnotations(folder, edited);
    expect(
      await readRunAnnotations(folder, edited.runId, edited.projectId),
    ).toMatchObject([
      {
        id: "first text",
        label: "corrected, text\nsecond line",
        revision: 1,
        seq: 1,
        tMs: 50,
      },
    ]);
    const telemetry = files.get(`${autosaveDirectoryName}/telemetry-1.csv`)!;
    expect(telemetry).toContain('"corrected, text\nsecond line"');
    expect(telemetry).toContain("virtual,2,edited-run,");
    const conflicting = {
      ...edited,
      metadata: JSON.stringify({
        ...metadata,
        annotations: [
          { ...metadata.annotations[0], label: "conflicting edit" },
        ],
      }),
    };
    await expect(saveRunAnnotations(folder, conflicting)).rejects.toThrow(
      "another Monitor",
    );
    expect(files.get(`${autosaveDirectoryName}/telemetry-1.csv`)).toBe(
      telemetry,
    );
    await saveRunAnnotations(folder, original);
    expect(
      (await readRunAnnotations(folder, edited.runId, edited.projectId))[0]
        ?.label,
    ).toBe("corrected, text\nsecond line");
  });

  it("refuses to restore notes from a different Project or run", async () => {
    const { folder } = setup();
    await saveRunArchive(folder, archive("saved", "keep"));
    expect(
      await readRunAnnotations(folder, "another-run", "project-a"),
    ).toEqual([]);
    await expect(
      readRunAnnotations(folder, "saved", "project-b"),
    ).rejects.toThrow("verified");
  });
  it("merges a note into its exact observation when virtual rows share a physics sequence", async () => {
    const { folder, files } = setup();
    const original = archive("run");
    original.telemetry =
      "source,seq,value,note,observation_seq\nvirtual,1,1.23000e-9,,41\nvirtual,1,-0.000,,42\n";
    await saveRunArchive(folder, original);
    const added = archive("run", "actuator update");
    const metadata = JSON.parse(added.metadata);
    metadata.annotations[0].observationSeq = 42;
    added.metadata = JSON.stringify(metadata);
    await saveRunAnnotations(folder, added);
    expect(files.get(`${autosaveDirectoryName}/telemetry-1.csv`)).toBe(
      "source,seq,value,note,observation_seq\nvirtual,1,1.23000e-9,,41\nvirtual,1,-0.000,actuator update,42\n",
    );
  });
  it("preserves a legacy archive when an exact observation note cannot be joined safely", async () => {
    const { folder, files } = setup();
    const original = archive("run");
    await saveRunArchive(folder, original);
    const before = [...files];
    const added = archive("run", "exact update");
    const metadata = JSON.parse(added.metadata);
    metadata.annotations[0].observationSeq = 42;
    added.metadata = JSON.stringify(metadata);
    await expect(saveRunAnnotations(folder, added)).rejects.toThrow(
      "no observation identities",
    );
    expect([...files]).toEqual(before);
  });
  it("updates the matching rotated run without relabeling a newer run", async () => {
    const { folder, files } = setup();
    await saveRunArchive(folder, archive("first"));
    await saveRunArchive(folder, archive("second"));
    expect(await saveRunAnnotations(folder, archive("first", "turn"))).toBe(2);
    expect(files.get(`${autosaveDirectoryName}/run-1.json`)).toBe(
      archive("second").metadata,
    );
    expect(files.get(`${autosaveDirectoryName}/telemetry-1.csv`)).toBe(
      archive("second").telemetry,
    );
    expect(files.get(`${autosaveDirectoryName}/run-2.txt`)).toBe(
      "first output",
    );
    expect(files.get(`${autosaveDirectoryName}/telemetry-2.csv`)).toBe(
      archive("first", "turn").telemetry,
    );
    await saveRunArchive(folder, archive("second"));
    expect(await findRunGeneration(folder, "first")).toBe(2);
  });
  it("refuses the wrong project before changing any archive files", async () => {
    const { folder, files } = setup();
    const before = [...files];
    await expect(
      saveRunArchive(folder, { ...archive("run"), projectId: "project-b" }),
    ).rejects.toThrow("could not be verified");
    expect([...files]).toEqual(before);
  });
  it("reports a rotated-out run and preserves all four newer runs", async () => {
    const { folder, files } = setup();
    for (let id = 1; id <= 5; id++)
      await saveRunArchive(folder, archive(String(id)));
    const before = [...files];
    await expect(
      saveRunAnnotations(folder, archive("1", "note")),
    ).rejects.toThrow("rotated out");
    expect([...files]).toEqual(before);
  });
  it("preserves an interrupted archive recovery copy before attempting another rotation", async () => {
    const { folder, files } = setup();
    const pending = JSON.stringify(archive("interrupted"));
    files.set(`${autosaveDirectoryName}/pending-run.json`, pending);
    await expect(saveRunArchive(folder, archive("new"))).rejects.toThrow(
      "earlier run archive",
    );
    expect(files.get(`${autosaveDirectoryName}/pending-run.json`)).toBe(
      pending,
    );
    expect(await findRunGeneration(folder, "new")).toBeNull();
  });
  it("retains complete notes when updating one archive file fails", async () => {
    const { folder, files } = setup();
    await saveRunArchive(folder, archive("run"));
    const failing = memoryFolder(files, "", (path) => {
      if (path.endsWith("run-1.json")) throw new Error("Disk disconnected");
    });
    const annotated = archive("run", "retained note");
    await expect(saveRunAnnotations(failing, annotated)).rejects.toThrow(
      "Disk disconnected",
    );
    const recovery = JSON.parse(
      files.get(`${autosaveDirectoryName}/pending-run.json`)!,
    );
    expect(recovery).toMatchObject({
      ...annotated,
      metadata: expect.any(String),
      annotationGeneration: 1,
    });
    expect(JSON.parse(recovery.metadata)).toEqual(
      JSON.parse(annotated.metadata),
    );
    await expect(saveRunArchive(folder, archive("run"))).rejects.toThrow(
      "earlier run archive",
    );
  });
  it("merges a late Monitor note without replacing original samples, identity, output or other notes", async () => {
    const { folder, files } = setup();
    const original = archive("run", "original note");
    await saveRunArchive(folder, original);
    const late = archive("run", "late note");
    late.telemetry = "truncated local replay";
    late.output = "truncated local output";
    late.metadata = JSON.stringify({
      ...JSON.parse(late.metadata),
      telemetrySamples: 1,
    });
    await saveRunAnnotations(folder, late);
    const saved = JSON.parse(files.get(`${autosaveDirectoryName}/run-1.json`)!);
    expect(saved.telemetrySamples).toBe(2);
    expect(saved.project).toEqual(JSON.parse(original.metadata).project);
    expect(
      saved.annotations.map((note: { label: string }) => note.label),
    ).toEqual(["original note", "late note"]);
    expect(files.get(`${autosaveDirectoryName}/telemetry-1.csv`)).toBe(
      original.telemetry.replace("original note", "original note | late note"),
    );
    expect(files.get(`${autosaveDirectoryName}/run-1.txt`)).toBe(
      original.output,
    );
    await saveRunAnnotations(folder, late);
    expect(
      JSON.parse(files.get(`${autosaveDirectoryName}/run-1.json`)!).annotations,
    ).toHaveLength(2);
  });
  it("preserves numeric bytes and quoted multiline cells when merging notes", async () => {
    const { folder, files } = setup();
    const original = archive("run", "original note");
    original.telemetry =
      'source,seq,value,note\r\nvirtual,1,1.23000e-9,"original, \"\"quoted\"\"\r\nnote"\r\nvirtual,2,-0.000,"other, sample"';
    await saveRunArchive(folder, original);
    const added = archive("run", "new, note");
    await saveRunAnnotations(folder, added);
    expect(files.get(`${autosaveDirectoryName}/telemetry-1.csv`)).toBe(
      'source,seq,value,note\r\nvirtual,1,1.23000e-9,"original, \"\"quoted\"\"\r\nnote | new, note"\r\nvirtual,2,-0.000,"other, sample"',
    );
    expect(files.get(`${autosaveDirectoryName}/run-1.txt`)).toBe(
      original.output,
    );
  });
});
