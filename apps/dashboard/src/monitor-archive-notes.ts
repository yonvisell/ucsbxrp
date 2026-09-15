import type { MonitorAnnotation } from "./monitor-export-core";

import { csvRows, decodeCsvCell, encodeCsvCell } from "./csv-records";

export function validatedAnnotations(value: unknown): MonitorAnnotation[] {
  if (value === undefined) return [];
  if (
    !Array.isArray(value) ||
    value.length > 1_024 ||
    value.some(
      (item) =>
        !item ||
        typeof item.id !== "string" ||
        item.id.length === 0 ||
        item.id.length > 256 ||
        typeof item.label !== "string" ||
        item.label.length > 4_096 ||
        !Number.isFinite(item.tMs) ||
        item.tMs < 0 ||
        typeof item.poseAvailable !== "boolean" ||
        !Number.isFinite(item.xMm) ||
        !Number.isFinite(item.yMm) ||
        (item.revision !== undefined &&
          (!Number.isSafeInteger(item.revision) || item.revision < 0)) ||
        (item.previousLabel !== undefined &&
          typeof item.previousLabel !== "string") ||
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
  if (new Set(value.map((note) => note.id)).size !== value.length)
    throw new Error(
      "The saved run contains duplicate note identities. Export local notes before repairing the archive.",
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
  const retained = validatedAnnotations(stored.annotations);
  const merged = new Map(retained.map((note) => [note.id, note]));
  const additions: MonitorAnnotation[] = [];
  const edits: MonitorAnnotation[] = [];
  for (const note of validatedAnnotations(incoming.annotations)) {
    const previous = merged.get(note.id);
    if (previous) {
      if (JSON.stringify(previous) === JSON.stringify(note)) continue;
      const previousRevision = previous.revision ?? 0;
      const revision = note.revision ?? 0;
      const sameAnchor = [
        "source",
        "seq",
        "observationSeq",
        "physicsStepSeq",
        "tMs",
        "poseAvailable",
        "xMm",
        "yMm",
      ].every(
        (key) =>
          previous[key as keyof MonitorAnnotation] ===
          note[key as keyof MonitorAnnotation],
      );
      // A committed snapshot may be stale, but an unsaved text edit must never
      // be acknowledged by silently replacing it with a newer disk revision.
      if (
        sameAnchor &&
        revision <= previousRevision &&
        note.label === previous.label
      )
        continue;
      if (
        sameAnchor &&
        revision < previousRevision &&
        note.previousLabel === undefined
      )
        continue;
      if (
        revision !== previousRevision + 1 ||
        note.previousLabel !== previous.label ||
        !sameAnchor
      )
        throw new Error(
          "A saved note with this identity changed in another Monitor. Export this version before resolving it.",
        );
      merged.set(note.id, note);
      edits.push(note);
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
  for (const annotation of [...additions, ...edits]) {
    if (annotation.observationSeq !== undefined && observationSeq < 0) {
      throw new Error(
        "The saved telemetry has no observation identities for this note. Export the displayed notes separately.",
      );
    }
  }
  for (const annotation of additions) {
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
    const matchesRow = (annotation: MonitorAnnotation) =>
      annotation.source === rowSource &&
      (annotation.observationSeq === undefined
        ? String(annotation.seq) === decodeCsvCell(row.cells[seq]!)
        : observationSeq >= 0 &&
          String(annotation.observationSeq) ===
            decodeCsvCell(row.cells[observationSeq]!));
    if (edits.some(matchesRow)) {
      const expected = retained
        .filter(matchesRow)
        .map((annotation) => annotation.label)
        .join(" | ");
      if (decodeCsvCell(row.cells[note]!) !== expected)
        throw new Error(
          "The saved note text no longer matches its metadata. Export the edited version before resolving it.",
        );
      row.cells[note] = encodeCsvCell(
        [...merged.values()]
          .filter(matchesRow)
          .map((annotation) => annotation.label)
          .join(" | "),
      );
      continue;
    }
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
