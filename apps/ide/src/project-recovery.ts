import {
  sameProjectContents,
  validateProjectSnapshot,
  type ProjectSnapshot,
} from "./project-files";
import {
  projectSessionHasUnsavedChanges,
  snapshotForProjectSession,
  type ProjectSession,
} from "./project-session";

const prefix = "ucsb-xrp-project-recovery-v1:";
const maximumRecords = 32;
const maximumStoredCharacters = 2_000_000;

export interface ProjectRecoveryRecord {
  key: string;
  owner: string;
  capturedAt: number;
  workspaceName: string | null;
  folderName: string | null;
  snapshot: ProjectSnapshot;
}

function validRecord(value: unknown): value is ProjectRecoveryRecord {
  if (!value || typeof value !== "object") return false;
  const record = value as ProjectRecoveryRecord;
  const project = record.snapshot;
  try {
    validateProjectSnapshot(project);
  } catch {
    return false;
  }
  return (
    typeof record.key === "string" &&
    record.key.startsWith(prefix) &&
    typeof record.owner === "string" &&
    Number.isSafeInteger(record.capturedAt) &&
    !!project &&
    typeof project.name === "string" &&
    typeof project.entrypoint === "string" &&
    !!project.files &&
    typeof project.files === "object" &&
    !Array.isArray(project.files) &&
    Object.values(project.files).every((value) => typeof value === "string") &&
    typeof project.session?.projectId === "string" &&
    Number.isSafeInteger(project.session.revision) &&
    Number.isSafeInteger(project.session.savedRevision) &&
    Number.isSafeInteger(project.session.updatedAt)
  );
}

/** Exceptional copies only. Native Project files still select ordinary startup. */
export class ProjectRecoveryStore {
  constructor(
    private readonly storage: Storage,
    readonly owner: string = crypto.randomUUID(),
  ) {}

  list(): ProjectRecoveryRecord[] {
    const records: ProjectRecoveryRecord[] = [];
    for (let index = 0; index < this.storage.length; index += 1) {
      const key = this.storage.key(index);
      if (!key?.startsWith(prefix)) continue;
      const text = this.storage.getItem(key);
      if (!text) continue;
      let value: unknown;
      try {
        value = JSON.parse(text);
      } catch {
        continue;
      }
      if (validRecord(value) && value.key === key) records.push(value);
    }
    return records.sort((a, b) => b.capturedAt - a.capturedAt);
  }

  retain(
    session: ProjectSession,
    location: { workspaceName: string | null; folderName: string | null },
  ): void {
    if (!projectSessionHasUnsavedChanges(session)) return;
    const key = `${prefix}${this.owner}:${session.projectId}`;
    const record: ProjectRecoveryRecord = {
      key,
      owner: this.owner,
      capturedAt: Date.now(),
      ...location,
      snapshot: snapshotForProjectSession(session),
    };
    const text = JSON.stringify(record);
    const existing = this.list().filter((item) => item.key !== key);
    const size = existing.reduce(
      (sum, item) => sum + (this.storage.getItem(item.key)?.length ?? 0),
      text.length,
    );
    if (existing.length >= maximumRecords || size > maximumStoredCharacters) {
      throw new Error(
        "Recovery storage is full. Download your unsaved project before closing this page; older recovery copies were kept.",
      );
    }
    this.storage.setItem(key, text);
    if (this.storage.getItem(key) !== text)
      throw new Error(
        "The browser could not verify the unsaved project recovery copy.",
      );
  }

  acknowledge(session: ProjectSession): void {
    if (projectSessionHasUnsavedChanges(session)) return;
    for (const record of this.list()) {
      const metadata = record.snapshot.session!;
      if (
        metadata.projectId === session.projectId &&
        metadata.revision === session.savedRevision &&
        sameProjectContents(record.snapshot, session.project)
      )
        this.discard(record);
    }
  }

  discard(record: ProjectRecoveryRecord): void {
    // Never remove a newer edit written after this recovery list was displayed.
    const latest = this.storage.getItem(record.key);
    if (
      latest &&
      JSON.stringify(JSON.parse(latest)) === JSON.stringify(record)
    ) {
      this.storage.removeItem(record.key);
    }
  }
}

export function downloadProjectRecovery(snapshot: ProjectSnapshot): void {
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(snapshot, null, 2) + "\n"], {
      type: "application/json",
    }),
  );
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${snapshot.name.replace(/[^a-zA-Z0-9_-]/g, "_")}-recovery.json`;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1_000);
}
