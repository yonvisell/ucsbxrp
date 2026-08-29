import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import type * as Monaco from "monaco-editor/editor/editor.api";

import {
  registerCoursePythonLanguage,
  setCoursePythonProjectContext,
} from "./course-python-language";

type CallableProvider = Record<string, (...args: unknown[]) => unknown>;

const providers: {
  completion?: CallableProvider;
  definition?: CallableProvider;
  hover?: CallableProvider;
  opener?: CallableProvider;
  signature?: CallableProvider;
} = {};

class TestRange {
  constructor(
    readonly startLineNumber: number,
    readonly startColumn: number,
    readonly endLineNumber: number,
    readonly endColumn: number,
  ) {}
}

class TestUri {
  constructor(private readonly value: string) {}

  toString(): string {
    return this.value;
  }
}

const monaco = {
  Range: TestRange,
  Uri: { parse: (value: string) => new TestUri(value) },
  editor: {
    registerEditorOpener(opener: CallableProvider) {
      providers.opener = opener;
      return { dispose() {} };
    },
  },
  languages: {
    CompletionItemKind: {
      Class: 1,
      Constant: 2,
      Function: 3,
      Module: 4,
      Variable: 5,
    },
    registerCompletionItemProvider(
      _language: string,
      provider: CallableProvider,
    ) {
      providers.completion = provider;
      return { dispose() {} };
    },
    registerDefinitionProvider(_language: string, provider: CallableProvider) {
      providers.definition = provider;
      return { dispose() {} };
    },
    registerHoverProvider(_language: string, provider: CallableProvider) {
      providers.hover = provider;
      return { dispose() {} };
    },
    registerSignatureHelpProvider(
      _language: string,
      provider: CallableProvider,
    ) {
      providers.signature = provider;
      return { dispose() {} };
    },
  },
} as unknown as typeof Monaco;

function positionAtEnd(line: string): Monaco.Position {
  return { lineNumber: 1, column: line.length + 1 } as Monaco.Position;
}

function modelFor(line: string): Monaco.editor.ITextModel {
  const word = line.match(/[A-Za-z_]\w*$/)?.[0] ?? "";
  const endColumn = line.length + 1;
  return {
    getLineContent: () => line,
    getWordUntilPosition: () => ({
      word,
      startColumn: endColumn - word.length,
      endColumn,
    }),
  } as unknown as Monaco.editor.ITextModel;
}

async function invoke<T>(
  provider: CallableProvider | undefined,
  method: string,
  line: string,
): Promise<T | null> {
  if (!provider) throw new Error(`${method} provider was not registered`);
  return (await provider[method]?.(
    modelFor(line),
    positionAtEnd(line),
    {},
    {},
  )) as T | null;
}

async function completionLabels(line: string): Promise<string[]> {
  const result = await invoke<{ suggestions: Array<{ label: string }> }>(
    providers.completion,
    "provideCompletionItems",
    line,
  );
  return result?.suggestions.map((suggestion) => suggestion.label) ?? [];
}

beforeAll(() => registerCoursePythonLanguage(monaco));

afterEach(() => setCoursePythonProjectContext(null));

describe("conservative course Python providers", () => {
  it("suppresses API and project completions after unrelated receivers", async () => {
    setCoursePythonProjectContext({
      projectId: "inmemory://course",
      files: { "helpers.py": "def helper():\n    pass\n" },
    });

    await expect(completionLabels("robot.")).resolves.toEqual([]);
    await expect(completionLabels("controller.update")).resolves.toEqual([]);

    const moduleMembers = await completionLabels("ucsb_xrp.");
    expect(moduleMembers).toContain("Robot");
    expect(moduleMembers).toContain("clamp");
    const liveMembers = await completionLabels("live.");
    expect(liveMembers).toContain("watch");
  });

  it.each(["update", "reset", "stop"])(
    "does not invent hover or signature help for ambiguous %s methods",
    async (name) => {
      await expect(
        invoke(providers.hover, "provideHover", name),
      ).resolves.toBeNull();
      await expect(
        invoke(providers.signature, "provideSignatureHelp", `${name}(`),
      ).resolves.toBeNull();
    },
  );

  it("accepts exact catalog qualification but not an unresolved receiver", async () => {
    const exactHover = await invoke<{ contents: Array<{ value: string }> }>(
      providers.hover,
      "provideHover",
      "Robot.stop",
    );
    expect(exactHover?.contents.map((item) => item.value).join("\n")).toContain(
      "stop() -> None",
    );
    await expect(
      invoke(providers.hover, "provideHover", "robot.step"),
    ).resolves.toBeNull();
    await expect(
      invoke(providers.signature, "provideSignatureHelp", "robot.step("),
    ).resolves.toBeNull();
  });

  it("navigates only to one unique top-level project declaration", async () => {
    setCoursePythonProjectContext({
      projectId: "inmemory://course",
      files: {
        "a.py": [
          "def helper():",
          "    pass",
          "class Nested:",
          "    def nested_only(self):",
          "        pass",
          "def update():",
          "    pass",
          "def reset():",
          "    pass",
          "def stop():",
          "    pass",
        ].join("\n"),
        "b.py": [
          "def update():",
          "    pass",
          "def reset():",
          "    pass",
          "def stop():",
          "    pass",
        ].join("\n"),
      },
    });

    const helper = await invoke<{
      uri: { toString(): string };
      range: TestRange;
    }>(providers.definition, "provideDefinition", "helper");
    expect(helper?.uri.toString()).toBe("inmemory://course/a.py");
    expect(helper?.range.startLineNumber).toBe(1);

    for (const name of ["update", "reset", "stop", "nested_only"]) {
      await expect(
        invoke(providers.definition, "provideDefinition", name),
      ).resolves.toBeNull();
    }
    await expect(
      invoke(providers.definition, "provideDefinition", "object.helper"),
    ).resolves.toBeNull();

    const globalCompletions = await completionLabels("");
    expect(globalCompletions).toContain("helper");
    expect(globalCompletions).not.toContain("update");
    expect(globalCompletions).not.toContain("reset");
    expect(globalCompletions).not.toContain("stop");
    expect(globalCompletions).not.toContain("nested_only");
  });

  it("opens an existing empty project file", () => {
    const openLocation = vi.fn();
    setCoursePythonProjectContext({
      projectId: "inmemory://course",
      files: { "empty.py": "" },
      openLocation,
    });

    const openCodeEditor = providers.opener?.openCodeEditor;
    if (!openCodeEditor) throw new Error("editor opener was not registered");
    const opened = openCodeEditor(
      null,
      new TestUri("inmemory://course/empty.py"),
      { lineNumber: 1, column: 1 },
    );

    expect(opened).toBe(true);
    expect(openLocation).toHaveBeenCalledWith({
      path: "empty.py",
      line: 1,
      column: 1,
    });
  });
});
