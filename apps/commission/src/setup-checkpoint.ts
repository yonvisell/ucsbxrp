import type { CourseDirectoryHandle } from "../../shared/course-folder";
import type { CommissioningResult } from "./commissioner";

const checkpointFile = "UCSB_XRP_Setup_pending.json";
export interface SetupCheckpoint {
  schemaVersion: 1;
  robotId: string;
  installedAtMs: number;
  result: CommissioningResult;
}

export async function saveSetupCheckpoint(
  folder: CourseDirectoryHandle,
  checkpoint: SetupCheckpoint,
  assertCurrent: () => void,
): Promise<void> {
  assertCurrent();
  const handle = await folder.getFileHandle(checkpointFile, { create: true });
  assertCurrent();
  const writable = await handle.createWritable({ mode: "exclusive" });
  try {
    await writable.write(JSON.stringify(checkpoint, null, 2) + "\n");
    assertCurrent();
    await writable.close();
  } catch (error) {
    await writable.abort?.();
    throw error;
  }
}

export async function loadSetupCheckpoint(
  folder: CourseDirectoryHandle,
  releaseId: string,
): Promise<SetupCheckpoint | null> {
  try {
    const file = await (await folder.getFileHandle(checkpointFile)).getFile();
    if (file.size > 16_384) return null;
    const value = JSON.parse(await file.text()) as SetupCheckpoint;
    const result = value?.result;
    if (
      value.schemaVersion !== 1 ||
      !/^[0-9a-f]{8,96}$/.test(value.robotId) ||
      !Number.isFinite(value.installedAtMs) ||
      result?.releaseId !== releaseId ||
      !Number.isInteger(result.activationGeneration) ||
      !/^[0-9a-f]{64}$/.test(result.runtimeManifestSha256) ||
      (result.network?.mode !== "station" &&
        result.network?.mode !== "access_point") ||
      typeof result.network.address !== "string" ||
      typeof result.network.ssid !== "string"
    )
      return null;
    return value;
  } catch (error) {
    if (
      error instanceof SyntaxError ||
      (error instanceof DOMException && error.name === "NotFoundError")
    )
      return null;
    throw error;
  }
}

export async function clearSetupCheckpoint(
  folder: CourseDirectoryHandle,
  checkpoint: SetupCheckpoint,
): Promise<void> {
  const current = await loadSetupCheckpoint(
    folder,
    checkpoint.result.releaseId,
  );
  if (
    current?.robotId === checkpoint.robotId &&
    current.result.activationGeneration ===
      checkpoint.result.activationGeneration &&
    current.installedAtMs === checkpoint.installedAtMs
  )
    await folder.removeEntry(checkpointFile);
}
