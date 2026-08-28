import type { ReactNode } from "react";

import { CourseHeader } from "../../shared/CourseHeader";
import { useHashTarget } from "../../shared/useHashTarget";
import {
  apiAnchors,
  apiCatalog,
  type ApiEntry,
  type ApiMethod,
  type ApiValue,
} from "./api-catalog";

const legacySectionAnchors: Record<string, string[]> = {
  "data-types": ["records"],
  "worlds-maps-missions": ["worlds", "maps", "missions"],
  "hardware-math": ["utilities"],
};

export function ReferenceApp() {
  useHashTarget();

  return (
    <div className="reference-app">
      <CourseHeader active="reference" className="reference-header" />
      <div className="reference-layout">
        <nav className="reference-toc" aria-label="API sections">
          {apiCatalog.sections.map((section) => (
            <div className="toc-section" key={section.id}>
              <a className="toc-group" href={`#${section.id}`}>
                {section.title}
              </a>
              {section.entries.map((entry) => (
                <a className="toc-child" href={`#${entry.id}`} key={entry.id}>
                  {entry.name}
                </a>
              ))}
            </div>
          ))}
        </nav>

        <main className="reference-content">
          <section className="reference-intro">
            <h1>{apiCatalog.title}</h1>
            <p>{apiCatalog.introduction}</p>
            <h2>Units and coordinate conventions</h2>
            <ul className="compact-list">
              {apiCatalog.conventions.map((convention) => (
                <li key={convention}>{convention}</li>
              ))}
            </ul>
          </section>

          {apiCatalog.sections.map((section) => (
            <section className="api-section" id={section.id} key={section.id}>
              {(legacySectionAnchors[section.id] ?? []).map((anchor) => (
                <span className="anchor-alias" id={anchor} key={anchor} />
              ))}
              <h2>{section.title}</h2>
              {section.introduction && <p>{section.introduction}</p>}
              <div className="entry-list">
                {section.entries.map((entry) => (
                  <EntryReference entry={entry} key={entry.id} />
                ))}
              </div>
            </section>
          ))}
        </main>
      </div>
    </div>
  );
}

function EntryReference({ entry }: { entry: ApiEntry }) {
  const importStatement = entryImport(entry);

  return (
    <article className="class-reference" id={entry.id}>
      <header className="entry-heading">
        <h3>{entry.name}</h3>
      </header>

      <p className="entry-purpose">{entry.purpose}</p>

      <dl className="entry-meta">
        <div>
          <dt>Role</dt>
          <dd>{roleLabel(entry.kind)}</dd>
        </div>
        {entry.projectFile && (
          <div>
            <dt>Student file</dt>
            <dd>
              <code>{entry.projectFile}</code>
            </dd>
          </div>
        )}
        {entry.baseClass && (
          <div>
            <dt>Base class</dt>
            <dd>
              <TypeText value={entry.baseClass} currentAnchor={entry.id} />
            </dd>
          </div>
        )}
        {importStatement && (
          <div className="entry-import">
            <dt>Import</dt>
            <dd>
              <code>{importStatement}</code>
            </dd>
          </div>
        )}
      </dl>

      {entry.signature && (
        <DefinitionBlock title={signatureTitle(entry)}>
          <TypeText
            className="class-signature"
            currentAnchor={entry.id}
            value={entry.signature}
          />
        </DefinitionBlock>
      )}

      {entry.state && (
        <InfoBlock title="State between calls">
          <p>{entry.state}</p>
        </InfoBlock>
      )}

      {entry.relevantConfigFields && (
        <InfoBlock title="Configuration used">
          <p>
            {entry.configType && <TypeText value={entry.configType} />}
            {entry.configType ? ": " : ""}
            {entry.relevantConfigFields.map((field, index) => (
              <span key={field}>
                {index > 0 && ", "}
                <a
                  className="config-field-link"
                  href={`#${configFieldAnchor(entry.configType, field)}`}
                >
                  <code>{field}</code>
                </a>
              </span>
            ))}
          </p>
        </InfoBlock>
      )}

      {entry.parameters && entry.parameters.length > 0 && (
        <InfoBlock title={entryParameterTitle(entry)}>
          <ValueTable rows={entry.parameters} />
        </InfoBlock>
      )}

      {entry.returns && (
        <ReturnValue type={entry.returns.type}>
          {entry.returns.description}
        </ReturnValue>
      )}

      {entry.requiredBehavior && (
        <RequirementList values={entry.requiredBehavior} />
      )}

      {entry.exceptions && entry.exceptions.length > 0 && (
        <InfoBlock title="Exceptions">
          <ul className="compact-list">
            {entry.exceptions.map((exception) => (
              <li key={exception}>{exception}</li>
            ))}
          </ul>
        </InfoBlock>
      )}

      {entry.properties && entry.properties.length > 0 && (
        <InfoBlock title={propertyTitle(entry)}>
          <ValueTable
            rowAnchorPrefix={`field-${entry.id}`}
            rows={entry.properties}
          />
        </InfoBlock>
      )}

      {entry.methods?.map((method) => (
        <MethodReference
          currentAnchor={entry.id}
          method={method}
          key={method.id}
        />
      ))}

      {entry.notes && entry.notes.length > 0 && (
        <InfoBlock title="Notes">
          <ul className="compact-list">
            {entry.notes.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        </InfoBlock>
      )}

      {entry.example && (
        <div className="code-example">
          <h4>{entry.example.title}</h4>
          <pre>
            <code>{entry.example.code}</code>
          </pre>
        </div>
      )}
    </article>
  );
}

function MethodReference({
  currentAnchor,
  method,
}: {
  currentAnchor: string;
  method: ApiMethod;
}) {
  return (
    <section className="method-reference" id={method.id}>
      <h4>{method.name}()</h4>
      <p className="method-purpose">{method.summary}</p>
      <TypeText
        className="method-signature"
        currentAnchor={currentAnchor}
        value={method.signature}
      />

      {method.parameters && method.parameters.length > 0 && (
        <InfoBlock title="Parameters">
          <ValueTable rows={method.parameters} />
        </InfoBlock>
      )}

      {method.returns && (
        <ReturnValue type={method.returns.type}>
          {method.returns.description}
        </ReturnValue>
      )}

      {method.requiredBehavior && (
        <RequirementList values={method.requiredBehavior} />
      )}

      {method.exceptions && method.exceptions.length > 0 && (
        <InfoBlock title="Exceptions">
          <ul className="compact-list">
            {method.exceptions.map((exception) => (
              <li key={exception}>{exception}</li>
            ))}
          </ul>
        </InfoBlock>
      )}
    </section>
  );
}

function InfoBlock({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="info-block">
      <h5>{title}</h5>
      {children}
    </div>
  );
}

function DefinitionBlock({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="definition-block">
      <h4>{title}</h4>
      {children}
    </div>
  );
}

function RequirementList({ values }: { values: string[] }) {
  return (
    <InfoBlock title="Required behavior">
      <ul className="compact-list">
        {values.map((value) => (
          <li key={value}>{value}</li>
        ))}
      </ul>
    </InfoBlock>
  );
}

function ReturnValue({
  type,
  children,
}: {
  type: string;
  children: ReactNode;
}) {
  return (
    <InfoBlock title="Return value">
      <p className="return-line">
        <TypeText value={type} /> — {children}
      </p>
    </InfoBlock>
  );
}

function ValueTable({
  rowAnchorPrefix,
  rows,
}: {
  rowAnchorPrefix?: string;
  rows: ApiValue[];
}) {
  return (
    <div className="parameter-table">
      <div className="parameter-head" aria-hidden="true">
        <span>Name</span>
        <span>Type</span>
        <span>Default</span>
        <span>Unit</span>
        <span>Description</span>
      </div>
      {rows.map((row) => (
        <div
          className="parameter-row"
          id={
            rowAnchorPrefix
              ? `${rowAnchorPrefix}-${slugify(row.name)}`
              : undefined
          }
          key={row.name}
        >
          <code data-label="Name">{row.name}</code>
          <span data-label="Type">
            <TypeText value={row.type} />
          </span>
          <span data-label="Default">{row.default ?? "—"}</span>
          <span data-label="Unit">{row.units ?? "—"}</span>
          <span data-label="Description">{row.description}</span>
        </div>
      ))}
    </div>
  );
}

function TypeText({
  className,
  currentAnchor,
  value,
}: {
  className?: string;
  currentAnchor?: string;
  value: string;
}) {
  const symbols = [...apiAnchors.keys()].sort(
    (left, right) => right.length - left.length,
  );
  const pattern = new RegExp(`(${symbols.map(escapeRegExp).join("|")})`, "g");
  const parts = value.split(pattern);

  return (
    <code className={["type-expression", className].filter(Boolean).join(" ")}>
      {parts.map((part, index) => {
        const anchor = apiAnchors.get(part);
        return anchor && anchor !== currentAnchor ? (
          <a href={`#${anchor}`} key={`${part}-${index}`}>
            {part}
          </a>
        ) : (
          <span key={`${part}-${index}`}>{part}</span>
        );
      })}
    </code>
  );
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function entryImport(entry: ApiEntry) {
  if (entry.import) return entry.import;
  if (entry.projectFile) {
    const moduleName = entry.projectFile.replace(/\.py$/, "");
    return `from ${moduleName} import ${entry.name}`;
  }
  if (entry.id === "module-live" || entry.name.startsWith("live.")) {
    return "from ucsb_xrp import live";
  }
  if (entry.kind === "value object") return null;
  return `from ucsb_xrp import ${entry.name}`;
}

function roleLabel(kind: string) {
  const labels: Record<string, string> = {
    "student component": "Class you implement",
    "supplied class": "Class supplied by UCSBXRP",
    "value record": "Read-only value",
    "configuration record": "Read-only configuration",
    "value object": "Value returned by the live module",
  };
  return labels[kind] ?? kind;
}

function signatureTitle(entry: ApiEntry) {
  if (entry.baseClass) return "Class declaration";
  if (entry.kind === "constant") return "Value";
  if (entry.signature?.includes(".from_arena(")) return "Factory function";
  if (
    entry.kind.includes("class") ||
    entry.kind.includes("record") ||
    entry.kind === "value object"
  ) {
    return "Constructor";
  }
  return "Signature";
}

function entryParameterTitle(entry: ApiEntry) {
  if (entry.signature?.includes(".from_arena(")) {
    return "Factory parameters";
  }
  if (entry.baseClass || entry.kind.includes("class")) {
    return "Constructor parameters";
  }
  return "Parameters";
}

function propertyTitle(entry: ApiEntry) {
  if (entry.kind === "configuration record") {
    return "Constructor parameters and readable fields";
  }
  return "Readable fields";
}

function configFieldAnchor(configType: string | undefined, field: string) {
  const entryAnchor = configType ? apiAnchors.get(configType) : undefined;
  return `field-${entryAnchor ?? "configuration"}-${slugify(field)}`;
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
