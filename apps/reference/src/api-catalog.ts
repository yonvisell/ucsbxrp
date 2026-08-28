import catalogSource from "../../../course_content/api-reference.json";

export type ApiValue = {
  name: string;
  type: string;
  description: string;
  default?: string;
  units?: string;
};

export type ApiReturn = { type: string; description: string };

export type ApiMethod = {
  id: string;
  name: string;
  signature: string;
  summary: string;
  parameters?: ApiValue[];
  returns?: ApiReturn;
  exceptions?: string[];
  requiredBehavior?: string[];
};

export type ApiExample = { title: string; code: string };

export type ApiEntry = {
  id: string;
  name: string;
  symbols: string[];
  kind: string;
  purpose: string;
  signature?: string;
  import?: string;
  projectFile?: string;
  baseClass?: string;
  configType?: string;
  state?: string;
  relevantConfigFields?: string[];
  parameters?: ApiValue[];
  properties?: ApiValue[];
  methods?: ApiMethod[];
  returns?: ApiReturn;
  exceptions?: string[];
  requiredBehavior?: string[];
  notes?: string[];
  example?: ApiExample;
};

export type ApiSection = {
  id: string;
  title: string;
  introduction?: string;
  entries: ApiEntry[];
};

export type ApiCatalog = {
  schemaVersion: number;
  apiVersion: string;
  title: string;
  introduction: string;
  publicModules: Record<string, string[]>;
  conventions: string[];
  sections: ApiSection[];
};

export const apiCatalog = catalogSource as ApiCatalog;
export const apiEntries = apiCatalog.sections.flatMap(
  (section) => section.entries,
);

export const apiAnchors = new Map<string, string>();
for (const entry of apiEntries) {
  apiAnchors.set(entry.name, entry.id);
  for (const symbol of entry.symbols) apiAnchors.set(symbol, entry.id);
}
