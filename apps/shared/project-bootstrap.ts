export const PROJECT_BOOTSTRAP_KEY = "ucsb-xrp-project-bootstrap-v1";

const projectBootstrapLifetimeMs = 15_000;

interface ProjectBootstrapRecord {
  ownerId: string;
  expiresAtMs: number;
}

function storageOrDefault(storage?: Storage): Storage {
  return storage ?? window.localStorage;
}

function readRecord(storage: Storage): ProjectBootstrapRecord | null {
  try {
    const value = JSON.parse(
      storage.getItem(PROJECT_BOOTSTRAP_KEY) ?? "null",
    ) as Partial<ProjectBootstrapRecord> | null;
    if (
      value === null ||
      typeof value.ownerId !== "string" ||
      value.ownerId.length === 0 ||
      typeof value.expiresAtMs !== "number" ||
      !Number.isFinite(value.expiresAtMs)
    ) {
      return null;
    }
    return { ownerId: value.ownerId, expiresAtMs: value.expiresAtMs };
  } catch {
    return null;
  }
}

function defaultOwnerId(): string {
  return globalThis.crypto.randomUUID();
}

/**
 * Mark that an open IDE is resolving its remembered project folder.
 *
 * The short expiry is only crash recovery. A normal IDE explicitly clears its
 * own record after the reconciled project has reached the shared target.
 */
export function beginProjectBootstrap(
  storage?: Storage,
  nowMs: number = Date.now(),
  createOwnerId: () => string = defaultOwnerId,
): string {
  const ownerId = createOwnerId();
  storageOrDefault(storage).setItem(
    PROJECT_BOOTSTRAP_KEY,
    JSON.stringify({
      ownerId,
      expiresAtMs: nowMs + projectBootstrapLifetimeMs,
    } satisfies ProjectBootstrapRecord),
  );
  return ownerId;
}

/** Clear this IDE's record without clearing a newer IDE tab's record. */
export function finishProjectBootstrap(
  ownerId: string,
  storage?: Storage,
): void {
  const selectedStorage = storageOrDefault(storage);
  if (readRecord(selectedStorage)?.ownerId !== ownerId) return;
  selectedStorage.removeItem(PROJECT_BOOTSTRAP_KEY);
}

export function projectBootstrapExpiresAt(storage?: Storage): number | null {
  return readRecord(storageOrDefault(storage))?.expiresAtMs ?? null;
}

export function projectBootstrapIsPending(
  storage?: Storage,
  nowMs: number = Date.now(),
): boolean {
  const record = readRecord(storageOrDefault(storage));
  return record !== null && record.expiresAtMs > nowMs;
}
