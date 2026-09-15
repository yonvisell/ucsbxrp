import { useLayoutEffect, useRef, useState } from "react";
import type { TelemetrySample } from "@ucsb-xrp/target";
import type { MonitorAnnotation } from "./monitor-export-core";
import { inspectionValue, observationDescription } from "./monitor-inspection";

export interface NoteRequest {
  runId: string;
  sample: TelemetrySample;
  alternatives: readonly TelemetrySample[];
  note?: MonitorAnnotation;
  number?: number;
}

export function MonitorNotes({
  annotations,
  canAdd,
  visible,
  onAdd,
  onEdit,
  onToggle,
  feedback,
}: {
  annotations: readonly MonitorAnnotation[];
  canAdd: boolean;
  visible: boolean;
  onAdd(): void;
  onEdit(note: MonitorAnnotation): void;
  onToggle(): void;
  feedback: string;
}) {
  return (
    <section className="annotation-tools" aria-labelledby="monitor-notes-title">
      <div className="notes-heading">
        <h3 id="monitor-notes-title">Notes</h3>
        <button disabled={!canAdd} onClick={onAdd} type="button">
          Add note
        </button>
      </div>
      <p className="annotation-hint">
        Choose a time in a plot, then Note. Notes also mark the world path.
      </p>
      {annotations.length > 0 ? (
        <>
          <button
            aria-pressed={visible}
            className="annotation-visibility"
            onClick={onToggle}
            type="button"
          >{`${visible ? "Hide" : "Show"} notes · ${annotations.length}`}</button>
          <ol className="monitor-note-list" aria-label="Run notes">
            {annotations.map((note, index) => (
              <li key={note.id}>
                <button
                  onClick={() => onEdit(note)}
                  aria-label={`Review note ${index + 1}: ${note.label}`}
                  type="button"
                >
                  <span className="note-number">{index + 1}</span>
                  <span>
                    <strong>{note.label}</strong>
                    <small>
                      {(note.tMs / 1_000).toFixed(3)} s
                      {note.poseAvailable ? "" : " · no pose"}
                    </small>
                  </span>
                </button>
              </li>
            ))}
          </ol>
        </>
      ) : (
        <p className="annotation-hint">
          {canAdd ? "No notes yet." : "Run a program to add notes."}
        </p>
      )}
      {feedback ? (
        <p className="annotation-feedback" role="status">
          {feedback}
        </p>
      ) : null}
    </section>
  );
}

/** A captured observation stays fixed while live data and other windows advance. */
export function MonitorNoteEditor({
  request,
  onSubmit,
  onClose,
  onDraftChange,
  canStop = false,
  onStop,
}: {
  request: NoteRequest;
  onSubmit(sample: TelemetrySample, label: string, request: NoteRequest): void;
  onClose(): void;
  onDraftChange(active: boolean): void;
  canStop?: boolean;
  onStop?(): Promise<void>;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const input = useRef<HTMLTextAreaElement>(null);
  const [sample, setSample] = useState(request.sample);
  const [label, setLabel] = useState(request.note?.label ?? "");
  const [error, setError] = useState("");
  const [stopping, setStopping] = useState(false);
  useLayoutEffect(() => {
    const previous = document.activeElement;
    onDraftChange(true);
    dialog.current?.showModal();
    input.current?.focus();
    return () => {
      onDraftChange(false);
      if (previous instanceof HTMLElement && previous.isConnected)
        previous.focus();
    };
  }, [onDraftChange]);
  return (
    <dialog
      ref={dialog}
      className="monitor-note-dialog"
      aria-labelledby="monitor-note-editor-title"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
    >
      <form
        onSubmit={(event) => {
          event.preventDefault();
          try {
            onSubmit(sample, label.trim(), request);
            onClose();
          } catch (reason: unknown) {
            setError(reason instanceof Error ? reason.message : String(reason));
          }
        }}
      >
        <div className="note-dialog-heading">
          <h2 id="monitor-note-editor-title">
            {request.note ? `Note ${request.number}` : "Add note"}
          </h2>
          {canStop && onStop ? (
            <button
              className="danger-button"
              disabled={stopping}
              onClick={async () => {
                setStopping(true);
                try {
                  await onStop();
                } catch (reason: unknown) {
                  setError(
                    `Stop was not confirmed: ${reason instanceof Error ? reason.message : String(reason)}`,
                  );
                } finally {
                  setStopping(false);
                }
              }}
              type="button"
            >
              {stopping ? "Stopping…" : "Stop"}
            </button>
          ) : null}
        </div>
        <p className="note-anchor" data-testid="note-anchor">
          {observationDescription(sample)}
        </p>
        {!request.note && request.alternatives.length > 1 ? (
          <label className="note-observation-choice">
            Updates at this time
            <select
              aria-label="Observation at this time"
              value={request.alternatives.indexOf(sample)}
              onChange={(event) =>
                setSample(request.alternatives[Number(event.target.value)]!)
              }
            >
              {request.alternatives.map((candidate, index) => (
                <option
                  key={candidate.observationSeq ?? `${candidate.seq}-${index}`}
                  value={index}
                >
                  {observationDescription(candidate)} · L/R{" "}
                  {inspectionValue(candidate.leftWheelSpeedMmS)}/
                  {inspectionValue(candidate.rightWheelSpeedMmS)} mm/s
                </option>
              ))}
            </select>
          </label>
        ) : null}
        <dl className="note-observation-values">
          <div>
            <dt>Wheel speeds L/R</dt>
            <dd>
              {inspectionValue(sample.leftWheelSpeedMmS)} /{" "}
              {inspectionValue(sample.rightWheelSpeedMmS)} mm/s
            </dd>
          </div>
          <div>
            <dt>Position</dt>
            <dd>
              {sample.poseAvailable
                ? `${inspectionValue(sample.xMm)}, ${inspectionValue(sample.yMm)} mm`
                : "Unavailable"}
            </dd>
          </div>
          <div>
            <dt>Pose source</dt>
            <dd>
              {sample.poseAvailable
                ? sample.source === "virtual"
                  ? "Simulator truth"
                  : "Published odometry"
                : "No published pose"}
            </dd>
          </div>
        </dl>
        <label className="note-text-label">
          Note
          <textarea
            aria-label="Note label"
            maxLength={280}
            ref={input}
            value={label}
            onChange={(event) => setLabel(event.target.value)}
            placeholder="What happened at this time?"
          />
        </label>
        {error ? (
          <p className="note-editor-error" role="alert">
            {error}
          </p>
        ) : null}
        <div className="note-editor-actions">
          <button onClick={onClose} type="button">
            Cancel
          </button>
          <button
            className="primary-button"
            disabled={!label.trim()}
            type="submit"
          >
            {request.note ? "Save note" : "Add"}
          </button>
        </div>
      </form>
    </dialog>
  );
}
