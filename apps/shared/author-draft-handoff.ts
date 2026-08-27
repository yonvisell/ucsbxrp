import type { CourseProject } from "@ucsb-xrp/target";

export interface AuthorDraftProject extends CourseProject {
  name: string;
}

export const authorDraftQueryParameter = "authorDraft";

const authorDraftKeyPrefix = "ucsb-xrp-author-draft-v1:";
const handoffLifetimeMs = 10 * 60_000;

interface AuthorDraftRecord {
  expiresAtMs: number;
  project: AuthorDraftProject;
}

function isAuthorDraftProject(value: unknown): value is AuthorDraftProject {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }
  const project = value as Partial<AuthorDraftProject>;
  return (
    typeof project.name === "string" &&
    project.name.trim().length > 0 &&
    typeof project.entrypoint === "string" &&
    typeof project.files === "object" &&
    project.files !== null &&
    !Array.isArray(project.files) &&
    typeof (project.files as Record<string, unknown>)[project.entrypoint] ===
      "string" &&
    Object.entries(project.files).every(
      ([path, source]) => path.length > 0 && typeof source === "string",
    )
  );
}

/** Stores one explicit, short-lived authoring draft for a newly opened IDE. */
export function createAuthorDraftHandoff(
  project: AuthorDraftProject,
  nowMs: number = Date.now(),
): string {
  if (!isAuthorDraftProject(project)) {
    throw new Error("The generated challenge project is incomplete.");
  }
  if (!globalThis.crypto?.randomUUID) {
    throw new Error("This browser cannot create an authoring draft identity.");
  }
  const token = globalThis.crypto.randomUUID();
  const record: AuthorDraftRecord = {
    expiresAtMs: nowMs + handoffLifetimeMs,
    project,
  };
  localStorage.setItem(
    `${authorDraftKeyPrefix}${token}`,
    JSON.stringify(record),
  );
  return token;
}

/**
 * Consumes only the draft named by the IDE URL. Unrelated retained projects
 * are never inspected or replaced by this transport.
 */
export function consumeAuthorDraftHandoff(
  search: string,
  nowMs: number = Date.now(),
): AuthorDraftProject | null {
  const token = new URLSearchParams(search).get(authorDraftQueryParameter);
  if (!token || !/^[0-9a-f-]{36}$/i.test(token)) return null;
  const key = `${authorDraftKeyPrefix}${token}`;
  const source = localStorage.getItem(key);
  if (source === null) return null;
  localStorage.removeItem(key);
  try {
    const record = JSON.parse(source) as Partial<AuthorDraftRecord>;
    return typeof record.expiresAtMs === "number" &&
      record.expiresAtMs >= nowMs &&
      isAuthorDraftProject(record.project)
      ? record.project
      : null;
  } catch {
    return null;
  }
}
