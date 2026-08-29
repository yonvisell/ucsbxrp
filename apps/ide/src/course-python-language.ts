import type * as Monaco from "monaco-editor/editor/editor.api";

import catalogSource from "../../../course_content/api-reference.json";

type ProjectLocation = {
  path: string;
  line: number;
  column: number;
};

type ProjectContext = {
  projectId: string;
  files: Record<string, string>;
  openLocation?: (location: ProjectLocation) => void;
};

type CatalogMethod = {
  name: string;
  signature: string;
  summary: string;
};

type CatalogEntry = {
  id: string;
  name: string;
  symbols: string[];
  kind: string;
  purpose: string;
  signature?: string;
  import?: string;
  methods?: CatalogMethod[];
};

type SymbolHelp = {
  name: string;
  signature?: string;
  summary: string;
  detail: string;
  kind: string;
  referenceId: string;
};

type DeclaredSymbol = ProjectLocation & {
  name: string;
  kind: "class" | "function" | "variable" | "module";
};

const catalog = catalogSource as {
  apiVersion: string;
  publicModules: Record<string, string[]>;
  sections: Array<{ entries: CatalogEntry[] }>;
};

const catalogEntries = catalog.sections.flatMap((section) => section.entries);
const exactSymbolHelp = new Map<string, SymbolHelp>();
const shortSymbolHelp = new Map<string, SymbolHelp[]>();

function rememberSymbolHelp(name: string, help: SymbolHelp): void {
  exactSymbolHelp.set(name, help);
  const shortName = name.split(".").at(-1) ?? name;
  const candidates = shortSymbolHelp.get(shortName) ?? [];
  if (!candidates.includes(help)) candidates.push(help);
  shortSymbolHelp.set(shortName, candidates);
}

function resolveSymbolHelp(name: string): SymbolHelp | null {
  const exact = exactSymbolHelp.get(name);
  if (exact) return exact;
  if (name.includes(".")) return null;
  const candidates = shortSymbolHelp.get(name) ?? [];
  return candidates.length === 1 ? candidates[0]! : null;
}

for (const entry of catalogEntries) {
  const help = {
    name: entry.name,
    signature: entry.signature,
    summary: entry.purpose,
    detail: `${entry.kind} · UCSBXRP ${catalog.apiVersion}`,
    kind: entry.kind,
    referenceId: entry.id,
  } satisfies SymbolHelp;
  rememberSymbolHelp(entry.name, help);
  for (const symbol of entry.symbols) rememberSymbolHelp(symbol, help);
  for (const method of entry.methods ?? []) {
    const methodHelp = {
      name: method.name,
      signature: method.signature,
      summary: method.summary,
      detail: `${entry.name} method · UCSBXRP ${catalog.apiVersion}`,
      kind: "method",
      referenceId: entry.id,
    } satisfies SymbolHelp;
    const qualifiedName = `${entry.name}.${method.name}`;
    exactSymbolHelp.set(qualifiedName, methodHelp);
    const candidates = shortSymbolHelp.get(method.name) ?? [];
    candidates.push(methodHelp);
    shortSymbolHelp.set(method.name, candidates);
  }
}

let projectContext: ProjectContext | null = null;
let registered = false;

export function setCoursePythonProjectContext(
  context: ProjectContext | null,
): void {
  projectContext = context;
}

function uriForPath(monaco: typeof Monaco, projectId: string, path: string) {
  return monaco.Uri.parse(`${projectId}/${path}`);
}

function projectPathFromUri(resource: Monaco.Uri): string | null {
  if (!projectContext) return null;
  const prefix = `${projectContext.projectId}/`;
  const value = resource.toString();
  if (value.startsWith(prefix)) return value.slice(prefix.length);
  const decoded = decodeURIComponent(value);
  return decoded.startsWith(prefix) ? decoded.slice(prefix.length) : null;
}

function declaredSymbols(files: Record<string, string>): DeclaredSymbol[] {
  const result: DeclaredSymbol[] = [];
  for (const [path, source] of Object.entries(files)) {
    if (!path.endsWith(".py")) continue;
    const lines = source.split(/\r?\n/);
    for (let index = 0; index < lines.length; index += 1) {
      const line = lines[index]!;
      const declaration = line.match(
        /^(?:async\s+)?(def|class)\s+([A-Za-z_]\w*)/,
      );
      const assignment = line.match(/^([A-Za-z_]\w*)\s*(?::[^=]+)?=/);
      const name = declaration?.[2] ?? assignment?.[1];
      if (!name) continue;
      result.push({
        name,
        path,
        line: index + 1,
        column: Math.max(1, line.indexOf(name) + 1),
        kind:
          declaration?.[1] === "class"
            ? "class"
            : declaration
              ? "function"
              : "variable",
      });
    }
    const moduleName = path.replace(/\.py$/, "").replaceAll("/", ".");
    result.push({
      name: moduleName,
      path,
      line: 1,
      column: 1,
      kind: "module",
    });
  }
  return result;
}

function resolveProjectDeclaration(
  files: Record<string, string>,
  name: string,
): DeclaredSymbol | null {
  if (!name || name.includes(".")) return null;
  const matches = declaredSymbols(files).filter(
    (candidate) => candidate.name === name,
  );
  return matches.length === 1 ? matches[0]! : null;
}

function unambiguousProjectDeclarations(
  files: Record<string, string>,
): DeclaredSymbol[] {
  const declarations = declaredSymbols(files);
  const counts = new Map<string, number>();
  for (const declaration of declarations) {
    counts.set(declaration.name, (counts.get(declaration.name) ?? 0) + 1);
  }
  return declarations.filter(
    (declaration) => counts.get(declaration.name) === 1,
  );
}

interface CompletionSource {
  names: readonly string[];
  helpPrefix: string;
  includeProjectDeclarations: boolean;
}

function completionSource(linePrefix: string): CompletionSource {
  const importedModule = linePrefix.match(
    /\bfrom\s+(ucsb_xrp(?:\.live)?)\s+import\s+[^#]*$/,
  )?.[1];
  if (importedModule) {
    return {
      names: catalog.publicModules[importedModule] ?? [],
      helpPrefix: importedModule === "ucsb_xrp.live" ? "live." : "",
      includeProjectDeclarations: false,
    };
  }

  const memberReceiver = linePrefix.match(
    /(?:^|[^A-Za-z0-9_])([A-Za-z_]\w*(?:\.[A-Za-z_]\w*)*)\.[A-Za-z_]*$/,
  )?.[1];
  if (memberReceiver) {
    if (memberReceiver === "ucsb_xrp") {
      return {
        names: catalog.publicModules.ucsb_xrp ?? [],
        helpPrefix: "",
        includeProjectDeclarations: false,
      };
    }
    if (memberReceiver === "live" || memberReceiver === "ucsb_xrp.live") {
      return {
        names: catalog.publicModules["ucsb_xrp.live"] ?? [],
        helpPrefix: "live.",
        includeProjectDeclarations: false,
      };
    }
    return {
      names: [],
      helpPrefix: "",
      includeProjectDeclarations: false,
    };
  }

  return {
    names: catalog.publicModules.ucsb_xrp ?? [],
    helpPrefix: "",
    includeProjectDeclarations: true,
  };
}

function qualifiedNameAt(
  model: Monaco.editor.ITextModel,
  position: Monaco.Position,
): string {
  const line = model.getLineContent(position.lineNumber);
  const before = line.slice(0, position.column - 1);
  const after = line.slice(position.column - 1);
  const left = before.match(/[A-Za-z_]\w*(?:\.[A-Za-z_]\w*)*$/)?.[0] ?? "";
  const right = after.match(/^\w*/)?.[0] ?? "";
  return `${left}${right}`;
}

function signatureParameters(
  signature: string,
): Monaco.languages.ParameterInformation[] {
  const contents = signature.match(/\((.*)\)/)?.[1]?.trim();
  if (!contents) return [];
  return contents.split(/,\s*/).map((label) => ({ label }));
}

function completionKind(
  monaco: typeof Monaco,
  kind: string,
): Monaco.languages.CompletionItemKind {
  if (kind.includes("class") || kind.includes("record")) {
    return monaco.languages.CompletionItemKind.Class;
  }
  if (kind === "function" || kind === "method") {
    return monaco.languages.CompletionItemKind.Function;
  }
  if (kind === "module") return monaco.languages.CompletionItemKind.Module;
  if (kind === "constant") return monaco.languages.CompletionItemKind.Constant;
  return monaco.languages.CompletionItemKind.Variable;
}

export function registerCoursePythonLanguage(monaco: typeof Monaco): void {
  if (registered) return;
  registered = true;

  monaco.languages.registerCompletionItemProvider("python", {
    triggerCharacters: ["."],
    provideCompletionItems(model, position) {
      const word = model.getWordUntilPosition(position);
      const range = new monaco.Range(
        position.lineNumber,
        word.startColumn,
        position.lineNumber,
        word.endColumn,
      );
      const linePrefix = model
        .getLineContent(position.lineNumber)
        .slice(0, position.column - 1);
      const source = completionSource(linePrefix);
      const seen = new Set<string>();
      const suggestions: Monaco.languages.CompletionItem[] = [];
      for (const name of source.names) {
        const help =
          resolveSymbolHelp(`${source.helpPrefix}${name}`) ??
          resolveSymbolHelp(name);
        if (seen.has(name)) continue;
        seen.add(name);
        suggestions.push({
          label: name,
          kind: completionKind(monaco, help?.kind ?? "value"),
          detail: help?.signature ?? help?.detail ?? "UCSBXRP course API",
          documentation: help?.summary,
          insertText: name,
          range,
          sortText: `0-${name}`,
        });
      }
      const projectDeclarations = source.includeProjectDeclarations
        ? unambiguousProjectDeclarations(projectContext?.files ?? {})
        : [];
      for (const declaration of projectDeclarations) {
        if (seen.has(declaration.name) || declaration.name.includes("."))
          continue;
        seen.add(declaration.name);
        suggestions.push({
          label: declaration.name,
          kind: completionKind(monaco, declaration.kind),
          detail: `${declaration.kind} · ${declaration.path}:${declaration.line}`,
          insertText: declaration.name,
          range,
          sortText: `1-${declaration.name}`,
        });
      }
      return { suggestions };
    },
  });

  monaco.languages.registerHoverProvider("python", {
    provideHover(model, position) {
      const name = qualifiedNameAt(model, position);
      const help = resolveSymbolHelp(name);
      if (help) {
        return {
          contents: [
            ...(help.signature
              ? [{ value: `\`\`\`python\n${help.signature}\n\`\`\`` }]
              : []),
            { value: help.summary },
            {
              value: `[Open the full UCSBXRP API reference](../reference/#${help.referenceId})`,
            },
          ],
        };
      }
      const declaration = resolveProjectDeclaration(
        projectContext?.files ?? {},
        name,
      );
      if (!declaration) return null;
      return {
        contents: [
          {
            value: `**${declaration.name}** — ${declaration.kind} defined in \`${declaration.path}:${declaration.line}\``,
          },
        ],
      };
    },
  });

  monaco.languages.registerSignatureHelpProvider("python", {
    signatureHelpTriggerCharacters: ["(", ","],
    provideSignatureHelp(model, position) {
      const before = model
        .getLineContent(position.lineNumber)
        .slice(0, position.column - 1);
      const called = before.match(
        /([A-Za-z_]\w*(?:\.[A-Za-z_]\w*)*)\([^()]*$/,
      )?.[1];
      if (!called) return null;
      const help = resolveSymbolHelp(called);
      if (!help?.signature) return null;
      const activeParameter = Math.max(
        0,
        before
          .match(/([A-Za-z_]\w*(?:\.[A-Za-z_]\w*)*)\(([^()]*)$/)?.[2]
          ?.match(/,/g)?.length ?? 0,
      );
      return {
        value: {
          signatures: [
            {
              label: help.signature,
              documentation: help.summary,
              parameters: signatureParameters(help.signature),
            },
          ],
          activeSignature: 0,
          activeParameter,
        },
        dispose() {},
      };
    },
  });

  monaco.languages.registerDefinitionProvider("python", {
    provideDefinition(model, position) {
      if (!projectContext) return null;
      const name = qualifiedNameAt(model, position);
      if (!name) return null;
      const declaration = resolveProjectDeclaration(projectContext.files, name);
      if (!declaration) return null;
      return {
        uri: uriForPath(monaco, projectContext.projectId, declaration.path),
        range: new monaco.Range(
          declaration.line,
          declaration.column,
          declaration.line,
          declaration.column + declaration.name.length,
        ),
      };
    },
  });

  monaco.editor.registerEditorOpener({
    openCodeEditor(_source, resource, selectionOrPosition) {
      const path = projectPathFromUri(resource);
      if (
        !path ||
        !projectContext ||
        !Object.hasOwn(projectContext.files, path) ||
        !projectContext.openLocation
      ) {
        return false;
      }
      const position =
        selectionOrPosition && "startLineNumber" in selectionOrPosition
          ? {
              line: selectionOrPosition.startLineNumber,
              column: selectionOrPosition.startColumn,
            }
          : selectionOrPosition && "lineNumber" in selectionOrPosition
            ? {
                line: selectionOrPosition.lineNumber,
                column: selectionOrPosition.column,
              }
            : { line: 1, column: 1 };
      projectContext.openLocation({ path, ...position });
      return true;
    },
  });
}
