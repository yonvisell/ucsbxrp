import type { CourseProjectTemplate } from "@ucsb-xrp/target";
import type { ProjectSnapshot } from "./project-files";

export interface TemplateProvenance {
  templateId: string;
  templateRevision: string;
  creationRelease: string;
  originalFileDigests: Record<string, string>;
  componentPaths: string[];
}

export interface ProjectProvenance {
  schemaVersion: 1;
  /** The first explicitly selected supplied template; never rewritten by a correction. */
  origin: TemplateProvenance;
  /** The supplied template against which the present files are compared. */
  baseline: TemplateProvenance;
  parent?: { projectId: string; revision: number };
}

export interface TemplateUpdateConflict {
  path: string;
  reason:
    | "edited"
    | "deleted"
    | "settings"
    | "component"
    | "unknown-file"
    | "removed-from-template"
    | "path-collision";
}

export interface TemplateUpdateComparison {
  status: "current" | "available" | "unknown";
  reason: string;
  supplied: TemplateProvenance;
  update: string[];
  add: string[];
  preserve: string[];
  conflicts: TemplateUpdateConflict[];
}

const sha256 = /^[a-f0-9]{64}$/;
const settingsPaths = new Set(["course_setup.py", "world.json"]);

function safePath(path: string): boolean {
  return (
    path.length > 0 &&
    path.length <= 3072 &&
    !/[\\\u0000-\u001f:*?"<>|]/.test(path) &&
    !path.startsWith("/") &&
    path
      .split("/")
      .every(
        (part) =>
          part !== "" && part !== "." && part !== ".." && !/[. ]$/.test(part),
      )
  );
}
function validTemplate(value: unknown): value is TemplateProvenance {
  if (!value || typeof value !== "object") return false;
  const source = value as TemplateProvenance;
  return (
    typeof source.templateId === "string" &&
    source.templateId.length > 0 &&
    source.templateId.length <= 128 &&
    typeof source.creationRelease === "string" &&
    source.creationRelease.length > 0 &&
    source.creationRelease.length <= 128 &&
    typeof source.templateRevision === "string" &&
    sha256.test(source.templateRevision) &&
    !!source.originalFileDigests &&
    typeof source.originalFileDigests === "object" &&
    !Array.isArray(source.originalFileDigests) &&
    Object.keys(source.originalFileDigests).length <= 250 &&
    Object.entries(source.originalFileDigests).every(
      ([path, digest]) =>
        safePath(path) && typeof digest === "string" && sha256.test(digest),
    ) &&
    Array.isArray(source.componentPaths) &&
    source.componentPaths.length <= 250 &&
    source.componentPaths.every(
      (path) => typeof path === "string" && safePath(path),
    )
  );
}

export function validProjectProvenance(
  value: unknown,
): value is ProjectProvenance {
  if (!value || typeof value !== "object") return false;
  const provenance = value as ProjectProvenance;
  return (
    provenance.schemaVersion === 1 &&
    validTemplate(provenance.origin) &&
    validTemplate(provenance.baseline) &&
    (!provenance.parent ||
      (typeof provenance.parent.projectId === "string" &&
        provenance.parent.projectId.length > 0 &&
        provenance.parent.projectId.length <= 128 &&
        Number.isSafeInteger(provenance.parent.revision) &&
        provenance.parent.revision >= 0))
  );
}

export function cloneProjectProvenance(
  provenance: ProjectProvenance,
): ProjectProvenance {
  return structuredClone(provenance);
}

export async function sourceTextDigest(text: string): Promise<string> {
  const bytes = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
}

async function templateProvenance(
  template: CourseProjectTemplate,
  releaseId: string,
): Promise<TemplateProvenance> {
  const originalFileDigests: Record<string, string> = {};
  for (const path of Object.keys(template.project.files).sort())
    originalFileDigests[path] = await sourceTextDigest(
      template.project.files[path]!,
    );
  return {
    templateId: template.id,
    templateRevision: await sourceTextDigest(
      JSON.stringify([
        "ucsb-xrp-template-v1",
        template.id,
        template.project.entrypoint,
        Object.entries(originalFileDigests),
      ]),
    ),
    creationRelease: releaseId,
    originalFileDigests,
    componentPaths: template.components
      .map((component) => component.file)
      .sort(),
  };
}

/** Call only for an explicit new-template or carry-forward action, never a legacy open. */
export async function stampProjectProvenance(
  project: ProjectSnapshot,
  template: CourseProjectTemplate,
  releaseId: string,
  sourceProject?: ProjectSnapshot,
): Promise<ProjectSnapshot> {
  const inherited = sourceProject?.provenance ?? project.provenance;
  const baseline = await templateProvenance(template, releaseId);
  if (!sourceProject && inherited?.baseline.templateId === template.id)
    return {
      ...project,
      files: { ...project.files },
      provenance: cloneProjectProvenance(inherited),
    };
  return {
    ...project,
    files: { ...project.files },
    provenance: {
      schemaVersion: 1,
      origin: inherited
        ? cloneProjectProvenance(inherited).origin
        : structuredClone(baseline),
      baseline,
      ...(sourceProject?.session
        ? {
            parent: {
              projectId: sourceProject.session.projectId,
              revision: sourceProject.session.revision,
            },
          }
        : inherited?.parent
          ? { parent: { ...inherited.parent } }
          : {}),
    },
  };
}

function pathCollides(
  files: Record<string, string>,
  candidate: string,
): boolean {
  const folded = (path: string) => path.normalize("NFC").toLowerCase();
  const next = folded(candidate);
  return Object.keys(files).some((path) => {
    const existing = folded(path);
    if (
      existing === next ||
      existing.startsWith(next + "/") ||
      next.startsWith(existing + "/")
    )
      return true;
    const a = path.split("/");
    const b = candidate.split("/");
    for (let i = 0; i < Math.min(a.length, b.length) - 1; i += 1) {
      if (folded(a[i]!) !== folded(b[i]!)) break;
      if (a[i] !== b[i]) return true;
    }
    return false;
  });
}

export async function compareTemplateUpdate(
  project: ProjectSnapshot,
  template: CourseProjectTemplate,
  releaseId: string,
): Promise<TemplateUpdateComparison> {
  const supplied = await templateProvenance(template, releaseId);
  const comparison: TemplateUpdateComparison = {
    status: "unknown",
    reason:
      "This Project has no recorded original template revision. Its source remains unchanged.",
    supplied,
    update: [],
    add: [],
    preserve: [],
    conflicts: [],
  };
  const provenance = project.provenance;
  if (!provenance || provenance.baseline.templateId !== template.id)
    return comparison;
  const baseline = provenance.baseline;
  comparison.status =
    supplied.templateRevision === baseline.templateRevision
      ? "current"
      : "available";
  comparison.reason =
    comparison.status === "current"
      ? "The supplied template is unchanged."
      : "A changed supplied template is available. Review the comparison before creating a separate Project.";
  const componentPaths = new Set([
    ...baseline.componentPaths,
    ...supplied.componentPaths,
  ]);
  for (const path of Object.keys(template.project.files).sort()) {
    const source = project.files[path];
    const original = baseline.originalFileDigests[path];
    const incoming = supplied.originalFileDigests[path];
    if (source === template.project.files[path]) {
      comparison.preserve.push(path);
      continue;
    }
    if (source === undefined) {
      if (original) comparison.conflicts.push({ path, reason: "deleted" });
      else if (pathCollides(project.files, path))
        comparison.conflicts.push({ path, reason: "path-collision" });
      else comparison.add.push(path);
      continue;
    }
    comparison.preserve.push(path);
    if (settingsPaths.has(path)) {
      if (incoming !== original)
        comparison.conflicts.push({ path, reason: "settings" });
      continue;
    }
    if (componentPaths.has(path) || path === "student_work.py") {
      if (incoming !== original)
        comparison.conflicts.push({ path, reason: "component" });
      continue;
    }
    if (!original) {
      comparison.conflicts.push({ path, reason: "unknown-file" });
      continue;
    }
    if ((await sourceTextDigest(source)) !== original) {
      if (incoming !== original)
        comparison.conflicts.push({ path, reason: "edited" });
      continue;
    }
    comparison.preserve.pop();
    comparison.update.push(path);
  }
  for (const path of Object.keys(project.files).sort()) {
    if (path in template.project.files) continue;
    comparison.preserve.push(path);
    if (baseline.originalFileDigests[path])
      comparison.conflicts.push({ path, reason: "removed-from-template" });
  }
  return comparison;
}

/** No source-folder mutation. Edited, component, calibration and unknown bytes remain exact. */
export async function createTemplateUpdateCopy(
  project: ProjectSnapshot,
  template: CourseProjectTemplate,
  releaseId: string,
  newName: string,
  options: { createProjectId?: () => string; now?: number } = {},
): Promise<{ project: ProjectSnapshot; comparison: TemplateUpdateComparison }> {
  const comparison = await compareTemplateUpdate(project, template, releaseId);
  if (comparison.status === "unknown")
    throw new Error(
      "The original template revision is unknown. Export or duplicate this Project and compare its files manually.",
    );
  const files = { ...project.files };
  for (const path of [...comparison.update, ...comparison.add])
    files[path] = template.project.files[path]!;
  return {
    comparison,
    project: {
      ...project,
      name: newName,
      files,
      provenance: {
        schemaVersion: 1,
        origin: cloneProjectProvenance(project.provenance!).origin,
        baseline: comparison.supplied,
        ...(project.session
          ? {
              parent: {
                projectId: project.session.projectId,
                revision: project.session.revision,
              },
            }
          : {}),
      },
      session: {
        projectId: (options.createProjectId ?? (() => crypto.randomUUID()))(),
        revision: 1,
        savedRevision: 0,
        updatedAt: options.now ?? Date.now(),
      },
    },
  };
}
