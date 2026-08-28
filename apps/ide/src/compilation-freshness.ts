interface StringStorage {
  getItem(key: string): string | null;
  removeItem(key: string): void;
  setItem(key: string, value: string): void;
}

const compilationFreshnessKey = "ucsb-xrp-ide-compiled-digest-v1";

const contentDigestPattern = /^[a-f0-9]{64}$/;

function readCompiledDigest(storage: StringStorage): string | null {
  try {
    const value = storage.getItem(compilationFreshnessKey);
    return value && contentDigestPattern.test(value) ? value : null;
  } catch {
    return null;
  }
}

export function compilationIsFresh(
  storage: StringStorage,
  contentDigest: string,
): boolean {
  return readCompiledDigest(storage) === contentDigest;
}

export function rememberCompilation(
  storage: StringStorage,
  contentDigest: string,
): void {
  try {
    storage.setItem(compilationFreshnessKey, contentDigest);
  } catch {
    // Compilation remains valid in memory when session storage is unavailable.
  }
}

export function forgetCompilation(storage: StringStorage): void {
  try {
    storage.removeItem(compilationFreshnessKey);
  } catch {
    // The visible failure state is still authoritative for this page.
  }
}
