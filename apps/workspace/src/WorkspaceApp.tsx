import { useEffect, useState, type CSSProperties } from "react";

import { ResizableSeparator } from "../../shared/ResizableSeparator";

type WorkspaceMode = "split" | "ide" | "monitor";

function initiallyWide(): boolean {
  return (
    typeof window === "undefined" ||
    !window.matchMedia ||
    window.matchMedia("(min-width: 901px)").matches
  );
}

export function WorkspaceApp() {
  const [mode, setMode] = useState<WorkspaceMode>("split");
  const [wide, setWide] = useState(initiallyWide);
  const [splitPercent, setSplitPercent] = useState(50);

  useEffect(() => {
    if (!window.matchMedia) return;
    const query = window.matchMedia("(min-width: 901px)");
    const update = (event: MediaQueryListEvent) => setWide(event.matches);
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  const splitStyle: CSSProperties = wide
    ? {
        gridTemplateColumns: `${splitPercent}fr 5px ${100 - splitPercent}fr`,
        gridTemplateRows: "minmax(0, 1fr)",
      }
    : {
        gridTemplateColumns: "minmax(0, 1fr)",
        gridTemplateRows: `${splitPercent}fr 5px ${100 - splitPercent}fr`,
      };

  return (
    <div className="workspace-app">
      <header className="workspace-header">
        <a className="workspace-brand" href="../" aria-label="UCSBXRP home">
          <span className="brand-mark">UCSB</span>
          <span className="brand-xrp">XRP</span>
        </a>
        <strong className="workspace-title">IDE + Monitor</strong>
        <div
          aria-label="Workspace layout"
          className="workspace-layout-controls"
          role="group"
        >
          <button
            aria-pressed={mode === "ide"}
            onClick={() => setMode("ide")}
            title="Use the full workspace for the IDE."
          >
            IDE
          </button>
          <button
            aria-pressed={mode === "split"}
            onClick={() => setMode("split")}
            title={
              wide
                ? "Place the IDE and Monitor side by side."
                : "Stack the IDE and Monitor in this narrow window."
            }
          >
            {wide ? "Side by side" : "Stacked"}
          </button>
          <button
            aria-pressed={mode === "monitor"}
            onClick={() => setMode("monitor")}
            title="Use the full workspace for the Monitor."
          >
            Monitor
          </button>
        </div>
        <nav aria-label="Workspace links" className="workspace-links">
          <a href="../guide/">Guide</a>
          <a href="../">Home</a>
        </nav>
      </header>

      <main
        className={`workspace-panes mode-${mode} ${wide ? "wide" : "narrow"}`}
        style={mode === "split" ? splitStyle : undefined}
      >
        <section aria-label="IDE pane" className="workspace-pane ide-pane">
          <iframe allow="serial" src="../ide/?embedded=1" title="UCSBXRP IDE" />
        </section>
        {mode === "split" ? (
          <ResizableSeparator
            label="Resize IDE and Monitor"
            maximum={64}
            minimum={36}
            onChange={setSplitPercent}
            orientation={wide ? "vertical" : "horizontal"}
            value={splitPercent}
          />
        ) : null}
        <section
          aria-label="Monitor pane"
          className="workspace-pane monitor-pane"
        >
          <iframe src="../monitor/?embedded=1" title="UCSBXRP Monitor" />
        </section>
      </main>
    </div>
  );
}
