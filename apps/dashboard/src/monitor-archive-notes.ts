import type { MonitorAnnotation } from "./monitor-export-core";

import { csvRows, decodeCsvCell, encodeCsvCell } from "./csv-records";

function annotations(value: unknown): MonitorAnnotation[] {
  if (value === undefined) return [];
  if (
    !Array.isArray(value) ||
    value.length > 1_024 ||
    value.some(
      (item) =>
        !item ||
        typeof item.id !== "string" ||
        typeof item.label !== "string" ||
        !["virtual", "physical"].includes(item.source) ||
        !Number.isSafeInteger(item.seq) ||
        (item.observationSeq !== undefined &&
          (!Number.isSafeInteger(item.observationSeq) ||
            item.observationSeq < 0)),
    )
  )
    throw new Error(
      "The saved run notes cannot be safely merged. Export the displayed notes separately.",
    );
  return value as MonitorAnnotation[];
}

/** A late Monitor may add notes, but cannot replace stored samples or metadata. */
export function mergeArchiveNotes(
  existingMetadata: string,
  existingTelemetry: string,
  incomingMetadata: string,
  runId: string,
  projectId: string,
): { metadata: string; telemetry: string } {
  const stored = JSON.parse(existingMetadata);
  const incoming = JSON.parse(incomingMetadata);
  if (
    stored.runId !== runId ||
    incoming.runId !== runId ||
    stored.project?.projectId !== projectId ||
    incoming.project?.projectId !== projectId
  )
    throw new Error(
      "The saved run identity changed. Export the displayed notes separately.",
    );
  const retained = annotations(stored.annotations);
  const merged = new Map(retained.map((note) => [note.id, note]));
  const additions: MonitorAnnotation[] = [];
  for (const note of annotations(incoming.annotations)) {
    const previous = merged.get(note.id);
    if (previous) {
      if (JSON.stringify(previous) !== JSON.stringify(note))
        throw new Error(
          "A saved note with this identity changed in another Monitor. Export this version before resolving it.",
        );
      continue;
    }
    additions.push(note);
    merged.set(note.id, note);
  }
  if (merged.size > 1_024)
    throw new Error(
      "This run has reached its saved note limit. Export additional notes separately.",
    );
  const rows = csvRows(existingTelemetry);
  const header = rows[0]?.cells.map(decodeCsvCell) ?? [];
  const source = header.indexOf("source"),
    seq = header.indexOf("seq"),
    observationSeq = header.indexOf("observation_seq"),
    note = header.indexOf("note");
  if (source < 0 || seq < 0 || note < 0)
    throw new Error(
      "The saved telemetry columns cannot be verified. Export the displayed notes separately.",
    );
  const bySample = new Map<string, string[]>();
  for (const annotation of additions) {
    if (annotation.observationSeq !== undefined && observationSeq < 0) {
      throw new Error(
        "The saved telemetry has no observation identities for this note. Export the displayed notes separately.",
      );
    }
    const key =
      annotation.observationSeq === undefined
        ? `${annotation.source}:legacy:${annotation.seq}`
        : `${annotation.source}:observation:${annotation.observationSeq}`;
    bySample.set(key, [...(bySample.get(key) ?? []), annotation.label]);
  }
  for (const row of rows.slice(1)) {
    if (row.cells.length !== header.length)
      throw new Error(
        "The saved telemetry rows are incomplete. Export the displayed notes separately.",
      );
    const rowSource = decodeCsvCell(row.cells[source]!);
    const labels = [
      ...(bySample.get(
        `${rowSource}:legacy:${decodeCsvCell(row.cells[seq]!)}`,
      ) ?? []),
      ...(observationSeq < 0
        ? []
        : (bySample.get(
            `${rowSource}:observation:${decodeCsvCell(row.cells[observationSeq]!)}`,
          ) ?? [])),
    ];
    if (labels?.length)
      row.cells[note] = encodeCsvCell(
        [decodeCsvCell(row.cells[note]!), ...labels]
          .filter(Boolean)
          .join(" | "),
      );
  }
  return {
    metadata:
      JSON.stringify(
        { ...stored, annotations: [...merged.values()] },
        null,
        2,
      ) + "\n",
    telemetry: rows.map((row) => row.cells.join(",") + row.ending).join(""),
  };
}
