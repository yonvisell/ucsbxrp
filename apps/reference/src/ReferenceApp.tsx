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
            <p>
              The <a href="../guide/">Guide</a> explains projects, the IDE,
              Monitor, and robot setup. This page is the definitive reference
              for public Python names, arguments, return values, and required
              component behavior.
            </p>
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
  return (
    <article className="class-reference" id={entry.id}>
      <header className="entry-heading">
        <div>
          <span className="entry-kind">{entry.kind}</span>
          <h3>{entry.name}</h3>
        </div>
        {entry.projectFile && <code>{entry.projectFile}</code>}
      </header>

      <p className="entry-purpose">{entry.purpose}</p>

      {entry.baseClass && (
        <p className="component-base">
          Base class <TypeText value={entry.baseClass} /> defines the public
          methods shown below.{" "}
          {entry.configType ? (
            <>
              Its constructor stores the supplied{" "}
              <TypeText value={entry.configType} /> as read-only{" "}
              <code>self.config</code>.{" "}
            </>
          ) : (
            <>It requires no configuration constructor. </>
          )}
          Implement the project class shown below.
        </p>
      )}

      {entry.import && (
        <p className="import-line">
          <strong>Import:</strong> <code>{entry.import}</code>
        </p>
      )}

      {entry.signature && (
        <code className="class-signature">{entry.signature}</code>
      )}

      {entry.state && (
        <InfoBlock title="Information retained between calls">
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
                <code>{field}</code>
              </span>
            ))}
          </p>
        </InfoBlock>
      )}

      {entry.parameters && entry.parameters.length > 0 && (
        <InfoBlock title="Parameters">
          <ValueTable rows={entry.parameters} />
        </InfoBlock>
      )}

      {entry.properties && entry.properties.length > 0 && (
        <InfoBlock title="Readable fields">
          <ValueTable rows={entry.properties} />
        </InfoBlock>
      )}

      {entry.methods?.map((method) => (
        <MethodReference method={method} key={method.id} />
      ))}

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

function MethodReference({ method }: { method: ApiMethod }) {
  return (
    <section className="method-reference" id={method.id}>
      <h4>{method.name}()</h4>
      <code className="method-signature">{method.signature}</code>
      <p>{method.summary}</p>

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

function ValueTable({ rows }: { rows: ApiValue[] }) {
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
        <div className="parameter-row" key={row.name}>
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

function TypeText({ value }: { value: string }) {
  const symbols = [...apiAnchors.keys()].sort(
    (left, right) => right.length - left.length,
  );
  const pattern = new RegExp(`(${symbols.map(escapeRegExp).join("|")})`, "g");
  const parts = value.split(pattern);

  return (
    <code className="type-expression">
      {parts.map((part, index) => {
        const anchor = apiAnchors.get(part);
        return anchor ? (
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
