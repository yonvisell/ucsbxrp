import type { CourseDirectoryHandle } from "../../shared/course-folder";

export function createMonitorProjectIdResolver(): (
  folder: CourseDirectoryHandle,
  session: { projectId: string } | undefined,
) => string {
  const legacyIds = new WeakMap<object, string>();
  let nextLegacyId = 1;

  return (folder, session) => {
    if (session) return session.projectId;
    const retained = legacyIds.get(folder);
    if (retained) return retained;
    const created = `monitor-legacy:${nextLegacyId++}:${folder.name}`;
    legacyIds.set(folder, created);
    return created;
  };
}

export const monitorProjectId = createMonitorProjectIdResolver();
