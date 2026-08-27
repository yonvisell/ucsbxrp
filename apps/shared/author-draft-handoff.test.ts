import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  authorDraftQueryParameter,
  consumeAuthorDraftHandoff,
  createAuthorDraftHandoff,
  type AuthorDraftProject,
} from "./author-draft-handoff";

const project: AuthorDraftProject = {
  name: "6 · Stopping response",
  entrypoint: "main.py",
  files: {
    "main.py": 'print("ready")\n',
    "README.md": "# Stopping response\n",
  },
};

describe("author draft IDE handoff", () => {
  beforeEach(() => {
    const entries = new Map<string, string>();
    vi.stubGlobal("localStorage", {
      clear: () => entries.clear(),
      getItem: (key: string) => entries.get(key) ?? null,
      key: (index: number) => [...entries.keys()][index] ?? null,
      get length() {
        return entries.size;
      },
      removeItem: (key: string) => {
        entries.delete(key);
      },
      setItem: (key: string, value: string) => {
        entries.set(key, value);
      },
    } satisfies Storage);
    vi.stubGlobal("crypto", {
      randomUUID: () => "12345678-1234-4123-8123-123456789abc",
    });
  });

  afterEach(() => vi.unstubAllGlobals());

  it("delivers one explicitly named project once", () => {
    const token = createAuthorDraftHandoff(project, 1_000);
    const search = `?${authorDraftQueryParameter}=${token}`;

    expect(consumeAuthorDraftHandoff(search, 2_000)).toEqual(project);
    expect(consumeAuthorDraftHandoff(search, 2_000)).toBeNull();
  });

  it("does not deliver expired or unrelated records", () => {
    const token = createAuthorDraftHandoff(project, 1_000);

    expect(
      consumeAuthorDraftHandoff("?authorDraft=not-a-token", 2_000),
    ).toBeNull();
    expect(
      consumeAuthorDraftHandoff(
        `?${authorDraftQueryParameter}=${token}`,
        1_000 + 10 * 60_000 + 1,
      ),
    ).toBeNull();
  });
});
