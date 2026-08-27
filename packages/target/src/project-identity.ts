import type { CourseProject, SynchronizedProject } from "./types";

function encodedPart(value: string): Uint8Array {
  const encoder = new TextEncoder();
  const body = encoder.encode(value);
  const prefix = encoder.encode(`${body.byteLength}:`);
  const result = new Uint8Array(prefix.byteLength + body.byteLength + 1);
  result.set(prefix, 0);
  result.set(body, prefix.byteLength);
  result[result.byteLength - 1] = ";".charCodeAt(0);
  return result;
}

function projectIdentityBytes(project: CourseProject): Uint8Array {
  const parts = [encodedPart(project.entrypoint)];
  for (const [path, contents] of Object.entries(project.files).sort(
    // MicroPython sorts strings by Unicode code point. localeCompare() is
    // locale-dependent and can order README.md after lower-case filenames,
    // causing the browser and XRP to calculate different project revisions.
    ([left], [right]) => (left < right ? -1 : left > right ? 1 : 0),
  )) {
    parts.push(encodedPart(path), encodedPart(contents));
  }
  const byteLength = parts.reduce((total, part) => total + part.byteLength, 0);
  const result = new Uint8Array(byteLength);
  let offset = 0;
  for (const part of parts) {
    result.set(part, offset);
    offset += part.byteLength;
  }
  return result;
}

function hex(bytes: ArrayBuffer): string {
  return Array.from(new Uint8Array(bytes), (value) =>
    value.toString(16).padStart(2, "0"),
  ).join("");
}

export async function projectRevision(project: CourseProject): Promise<string> {
  if (!globalThis.crypto?.subtle) {
    throw new Error("This browser cannot calculate a project revision");
  }
  const bytes = projectIdentityBytes(project);
  return hex(
    await globalThis.crypto.subtle.digest(
      "SHA-256",
      bytes.buffer as ArrayBuffer,
    ),
  );
}

export async function describeProject(
  project: CourseProject,
): Promise<SynchronizedProject> {
  const fallbackName = project.entrypoint.split("/").at(-1) ?? "XRP project";
  const name = project.name?.trim() || fallbackName;
  return {
    name: name.slice(0, 80),
    entrypoint: project.entrypoint,
    revision: await projectRevision(project),
    stale: false,
  };
}
