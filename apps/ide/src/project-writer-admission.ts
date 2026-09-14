import {
  readCourseTextFile,
  writeCourseTextFile,
  type CourseDirectoryHandle,
} from "../../shared/course-folder";

const prefix = ".ucsb-xrp-writer-";
const legacyLeaseFile = ".ucsb-xrp-writer.json";
const maximumParticipants = 32;

interface Ticket {
  schemaVersion: 1;
  owner: string;
  choosing: boolean;
  ticket: number;
  createdAt: number;
}

/** Text is an exact comparison token for an explicitly selected recovery action. */
export interface ProjectWriterRecord {
  fileName: string;
  text: string;
  owner: string;
  choosing: boolean;
  ticket: number | null;
  createdAt: number | null;
}

export class ProjectWriterBlockedError extends Error {
  readonly name = "ProjectWriterBlockedError";
  constructor(readonly records: ProjectWriterRecord[]) {
    super(
      "Another browser may still be saving this Project. Close its editor and retry. If that browser was interrupted, use Project writer recovery after closing all other UCSBXRP editors. An old timestamp does not release a writer automatically.",
    );
  }
}

export function isProjectWriterRecordFile(name: string): boolean {
  return (
    name === legacyLeaseFile ||
    (name.startsWith(prefix) && name.endsWith(".json"))
  );
}

export async function inspectProjectWriters(
  root: CourseDirectoryHandle,
): Promise<ProjectWriterRecord[]> {
  const records: ProjectWriterRecord[] = [];
  let scanned = 0;
  for await (const [name, handle] of root.entries()) {
    if (++scanned > 2_000)
      throw new Error(
        "Project writer scan exceeded 2000 entries. Source files were not changed.",
      );
    if (handle.kind !== "file" || !isProjectWriterRecordFile(name)) continue;
    if (records.length >= maximumParticipants)
      throw new Error(
        "Too many pending Project writers. Close other editors and recover their writer records before saving.",
      );
    let text: string;
    try {
      const file = await handle.getFile();
      if (file.size > 4_096)
        throw new Error(
          "A Project writer record is too large. Keep this folder for manual recovery.",
        );
      text = await file.text();
    } catch (error) {
      if (error instanceof DOMException && error.name === "NotFoundError")
        continue;
      throw error;
    }
    let ticket: Ticket | null = null;
    try {
      const value = JSON.parse(text) as Ticket;
      if (
        value.schemaVersion === 1 &&
        typeof value.owner === "string" &&
        name === `${prefix}${value.owner}.json` &&
        typeof value.choosing === "boolean" &&
        Number.isSafeInteger(value.ticket) &&
        value.ticket >= 0 &&
        Number.isSafeInteger(value.createdAt) &&
        value.createdAt >= 0
      )
        ticket = value;
    } catch {
      /* A participant whose initial close was interrupted remains blocking. */
    }
    records.push({
      fileName: name,
      text,
      owner: ticket?.owner ?? name,
      choosing: ticket?.choosing ?? true,
      ticket: ticket?.ticket ?? null,
      createdAt: ticket?.createdAt ?? null,
    });
  }
  return records;
}

export interface ProjectWriterAdmission {
  assertCurrent(): Promise<void>;
  release(): Promise<void>;
}

/**
 * A dynamic-participant bakery protocol over independently owned native files.
 * Atomic file close and read-after-close visibility are required of the native
 * filesystem. A missing participant is a cancellation, never lease expiry.
 */
export async function acquireProjectWriter(
  root: CourseDirectoryHandle,
  options: {
    ownerId?: string;
    waitLimitMs?: number;
    pollMs?: number;
  } = {},
): Promise<ProjectWriterAdmission> {
  const owner = options.ownerId ?? crypto.randomUUID();
  if (!/^[A-Za-z0-9_-]{1,128}$/.test(owner))
    throw new Error("Invalid Project writer identity.");
  const fileName = `${prefix}${owner}.json`;
  const ticket: Ticket = {
    schemaVersion: 1,
    owner,
    choosing: true,
    ticket: 0,
    createdAt: Date.now(),
  };
  let ownText = JSON.stringify(ticket);
  let released = false;
  let admitted = false;
  let initialWritten = false;
  const release = async () => {
    released = true;
    if ((await readCourseTextFile(root, fileName)) === ownText)
      await root.removeEntry(fileName);
  };
  try {
    if ((await readCourseTextFile(root, fileName)) !== null)
      throw new Error(
        "This Project writer identity already exists. Reopen this page before retrying.",
      );
    await writeCourseTextFile(root, fileName, ownText);
    initialWritten = true;
    const participants = await inspectProjectWriters(root);
    const maximum = Math.max(
      0,
      ...participants.map((record) => record.ticket ?? 0),
    );
    if (maximum >= Number.MAX_SAFE_INTEGER)
      throw new ProjectWriterBlockedError(participants);
    ticket.ticket = maximum + 1;
    ticket.choosing = false;
    ownText = JSON.stringify(ticket);
    await writeCourseTextFile(root, fileName, ownText);
    const deadline = Date.now() + (options.waitLimitMs ?? 2_000);
    for (;;) {
      const others = (await inspectProjectWriters(root)).filter(
        (record) => record.fileName !== fileName,
      );
      const blocking = others.filter(
        (record) =>
          record.choosing ||
          record.ticket === null ||
          record.ticket < ticket.ticket ||
          (record.ticket === ticket.ticket && record.owner < owner),
      );
      if (blocking.length === 0) break;
      if (Date.now() >= deadline) throw new ProjectWriterBlockedError(blocking);
      await new Promise<void>((resolve) =>
        setTimeout(resolve, options.pollMs ?? 40),
      );
    }
    const assertCurrent = async () => {
      if (released || (await readCourseTextFile(root, fileName)) !== ownText)
        throw new Error(
          "The Project writer was cancelled or recovered in another browser. This pending file was not committed. Reopen the Project before saving again.",
        );
    };
    await assertCurrent();
    admitted = true;
    return { assertCurrent, release };
  } finally {
    if (!admitted && initialWritten) await release();
  }
}

/**
 * Explicit recovery only: the caller must first ask the user to close all other
 * Project editors. Compare each selected record exactly; never remove a newer
 * writer or interpret elapsed time as proof that an editor is gone.
 */
export async function releaseSelectedProjectWriters(
  root: CourseDirectoryHandle,
  expected: readonly ProjectWriterRecord[],
): Promise<void> {
  const lock = await root.getFileHandle(".ucsb-xrp-write-lock", {
    create: true,
  });
  const writable = await lock.createWritable({
    mode: "exclusive",
    keepExistingData: true,
  });
  try {
    const actual = await inspectProjectWriters(root);
    if (
      actual.length !== expected.length ||
      actual.some(
        (record) =>
          !expected.some(
            (candidate) =>
              candidate.fileName === record.fileName &&
              candidate.text === record.text,
          ),
      )
    )
      throw new Error(
        "The Project writer records changed. Review them again before recovery.",
      );
    for (const record of expected) {
      if ((await readCourseTextFile(root, record.fileName)) !== record.text)
        throw new Error(
          "A writer changed during recovery. No newer writer was released.",
        );
      await root.removeEntry(record.fileName);
    }
  } finally {
    if (writable.abort) await writable.abort();
    else await writable.close();
  }
}
