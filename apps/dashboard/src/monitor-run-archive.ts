import {
  autosaveDirectoryName,
  readCourseTextFile,
  writeCourseTextFile,
  writeRotatingTextBundle,
  type CourseDirectoryHandle,
} from "../../shared/course-folder";
import {
  assertProjectWriterCurrent,
  withProjectNativeWrite,
} from "../../ide/src/project-native-write";
import {
  mergeArchiveNotes,
  validatedAnnotations,
} from "./monitor-archive-notes";
import type { MonitorAnnotation } from "./monitor-export-core";

export interface RunArchive {
  runId: string;
  projectId: string;
  metadata: string;
  telemetry: string;
  output: string;
}

export async function verifyRunFolder(
  folder: CourseDirectoryHandle,
  projectId: string,
): Promise<void> {
  const text = await readCourseTextFile(folder, ".ucsb-xrp-project.json");
  const stored = text
    ? (JSON.parse(text) as { session?: { projectId?: string } })
    : null;
  if (!projectId || stored?.session?.projectId !== projectId) {
    throw new Error(
      "The run's Project folder could not be verified. Export the displayed run before closing this page.",
    );
  }
}

export async function findRunGeneration(
  folder: CourseDirectoryHandle,
  runId: string,
): Promise<number | null> {
  for (let generation = 1; generation <= 4; generation += 1) {
    const text = await readCourseTextFile(
      folder,
      `${autosaveDirectoryName}/run-${generation}.json`,
    );
    if (text === null) continue;
    const metadata = JSON.parse(text) as { runId?: string };
    if (metadata.runId === runId) return generation;
  }
  return null;
}

/** Read only the notes for this verified retained run; never replace its data. */
export async function readRunAnnotations(
  folder: CourseDirectoryHandle,
  runId: string,
  projectId: string,
): Promise<MonitorAnnotation[]> {
  await verifyRunFolder(folder, projectId);
  const generation = await findRunGeneration(folder, runId);
  if (generation === null) return [];
  const text = await readCourseTextFile(
    folder,
    `${autosaveDirectoryName}/run-${generation}.json`,
  );
  const metadata = text ? JSON.parse(text) : null;
  if (metadata?.runId !== runId || metadata?.project?.projectId !== projectId)
    throw new Error(
      "The saved run changed while its notes were being read. Reopen the Monitor to retry.",
    );
  // previousLabel is a pending edit's comparison base, not a saved draft.
  return validatedAnnotations(metadata.annotations).map(
    ({ previousLabel: _previousLabel, ...note }) => note,
  );
}

/** A complete recovery copy precedes rotation and remains if any write fails. */
export async function saveRunArchive(
  folder: CourseDirectoryHandle,
  run: RunArchive,
): Promise<void> {
  await withProjectNativeWrite(folder, run.projectId, async () => {
    await verifyRunFolder(folder, run.projectId);
    const options = { assertCurrent: () => assertProjectWriterCurrent(folder) };
    const journalPath = `${autosaveDirectoryName}/pending-run.json`;
    if ((await readCourseTextFile(folder, journalPath)) !== null) {
      throw new Error(
        "An earlier run archive was interrupted. Preserve UCSB_XRP_Autosaves/pending-run.json and export this run before repairing the archive.",
      );
    }
    if ((await findRunGeneration(folder, run.runId)) !== null) return;
    const recovery = JSON.stringify(run) + "\n";
    await writeCourseTextFile(folder, journalPath, recovery, options);
    if ((await readCourseTextFile(folder, journalPath)) !== recovery)
      throw new Error("The complete run recovery copy could not be verified.");
    await writeRotatingTextBundle(
      folder,
      [
        { baseName: "run", extension: "txt", content: run.output },
        { baseName: "telemetry", extension: "csv", content: run.telemetry },
        { baseName: "run", extension: "json", content: run.metadata },
      ],
      options,
    );
    const directory = await folder.getDirectoryHandle(autosaveDirectoryName);
    await options.assertCurrent();
    await directory.removeEntry("pending-run.json");
  });
}

export async function saveRunAnnotations(
  folder: CourseDirectoryHandle,
  run: RunArchive,
): Promise<number> {
  return withProjectNativeWrite(folder, run.projectId, async () => {
    await verifyRunFolder(folder, run.projectId);
    const options = { assertCurrent: () => assertProjectWriterCurrent(folder) };
    if (
      (await readCourseTextFile(
        folder,
        `${autosaveDirectoryName}/pending-run.json`,
      )) !== null
    )
      throw new Error(
        "Run rotation was interrupted. Export the displayed run with its notes before repairing the archive.",
      );
    const generation = await findRunGeneration(folder, run.runId);
    if (generation === null)
      throw new Error(
        "This run has rotated out of the four saved runs. Export the displayed run to retain its notes.",
      );
    const storedMetadata = await readCourseTextFile(
      folder,
      `${autosaveDirectoryName}/run-${generation}.json`,
    );
    const storedTelemetry = await readCourseTextFile(
      folder,
      `${autosaveDirectoryName}/telemetry-${generation}.csv`,
    );
    const storedOutput = await readCourseTextFile(
      folder,
      `${autosaveDirectoryName}/run-${generation}.txt`,
    );
    if (
      storedMetadata === null ||
      storedTelemetry === null ||
      storedOutput === null
    )
      throw new Error(
        "The saved run is incomplete. Export the displayed run before repairing the archive.",
      );
    run = {
      ...run,
      ...mergeArchiveNotes(
        storedMetadata,
        storedTelemetry,
        run.metadata,
        run.runId,
        run.projectId,
      ),
      output: storedOutput,
    };
    const journalPath = `${autosaveDirectoryName}/pending-run.json`;
    const recovery =
      JSON.stringify({ ...run, annotationGeneration: generation }) + "\n";
    await writeCourseTextFile(folder, journalPath, recovery, options);
    if ((await readCourseTextFile(folder, journalPath)) !== recovery)
      throw new Error(
        "The complete annotation recovery copy could not be verified.",
      );
    await writeCourseTextFile(
      folder,
      `${autosaveDirectoryName}/telemetry-${generation}.csv`,
      run.telemetry,
      options,
    );
    await writeCourseTextFile(
      folder,
      `${autosaveDirectoryName}/run-${generation}.json`,
      run.metadata,
      options,
    );
    if (
      (await readCourseTextFile(
        folder,
        `${autosaveDirectoryName}/telemetry-${generation}.csv`,
      )) !== run.telemetry ||
      (await readCourseTextFile(
        folder,
        `${autosaveDirectoryName}/run-${generation}.json`,
      )) !== run.metadata
    )
      throw new Error(
        "The saved run notes could not be verified. Export the displayed run before repairing the archive.",
      );
    await options.assertCurrent();
    await (
      await folder.getDirectoryHandle(autosaveDirectoryName)
    ).removeEntry("pending-run.json");
    return generation;
  });
}
