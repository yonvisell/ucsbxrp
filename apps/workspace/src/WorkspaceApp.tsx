import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";

import { ResizableSeparator } from "../../shared/ResizableSeparator";
import {
  parseWorkspaceSurfaceReadyMessage,
  workspaceSurfaceVisibilityMessage,
} from "../../shared/workspace-visibility";

type WorkspaceMode = "split" | "ide" | "monitor";

function initialMode(): WorkspaceMode {
  if (typeof window === "undefined") return "ide";
  const requested = new URLSearchParams(window.location.search).get("mode");
  return requested === "split" || requested === "monitor" ? requested : "ide";
}

function initiallyWide(): boolean {
  return (
    typeof window === "undefined" ||
    !window.matchMedia ||
    window.matchMedia("(min-width: 901px)").matches
  );
}

export function WorkspaceApp() {
  const [mode, setModeState] = useState<WorkspaceMode>(initialMode);
  const [wide, setWide] = useState(initiallyWide);
  const [splitPercent, setSplitPercent] = useState(50);
  const monitorFrameRef = useRef<HTMLIFrameElement>(null);
  const monitorVisible = mode === "split" || mode === "monitor";
  const [monitorSource] = useState(
    () =>
      `../monitor/?embedded=1&workspaceVisible=${monitorVisible ? "1" : "0"}`,
  );

  useEffect(() => {
    if (!window.matchMedia) return;
    const query = window.matchMedia("(min-width: 901px)");
    const update = (event: MediaQueryListEvent) => setWide(event.matches);
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    const url = new URL(window.location.href);
    if (url.searchParams.get("mode") === mode) return;
    url.searchParams.set("mode", mode);
    window.history.replaceState(null, "", url);
  }, [mode]);

  useLayoutEffect(() => {
    monitorFrameRef.current?.contentWindow?.postMessage(
      workspaceSurfaceVisibilityMessage("monitor", monitorVisible),
      window.location.origin,
    );
  }, [monitorVisible]);

  useLayoutEffect(() => {
    const respondToMonitorReady = (event: MessageEvent<unknown>) => {
      const monitorWindow = monitorFrameRef.current?.contentWindow;
      if (
        !monitorWindow ||
        event.source !== monitorWindow ||
        event.origin !== window.location.origin ||
        parseWorkspaceSurfaceReadyMessage(event.data)?.surface !== "monitor"
      ) {
        return;
      }
      monitorWindow.postMessage(
        workspaceSurfaceVisibilityMessage("monitor", monitorVisible),
        window.location.origin,
      );
    };
    window.addEventListener("message", respondToMonitorReady);
    return () => window.removeEventListener("message", respondToMonitorReady);
  }, [monitorVisible]);

  const splitStyle: CSSProperties = wide
    ? {
        gridTemplateColumns: `${splitPercent}fr 1px ${100 - splitPercent}fr`,
        gridTemplateRows: "minmax(0, 1fr)",
      }
    : {
        gridTemplateColumns: "minmax(0, 1fr)",
        gridTemplateRows: `${splitPercent}fr 1px ${100 - splitPercent}fr`,
      };

  const setMode = (next: WorkspaceMode): void => {
    setModeState(next);
  };

  const resizePanes = (next: number): void => {
    if (next <= 5) {
      setMode("monitor");
      return;
    }
    if (next >= 95) {
      setMode("ide");
      return;
    }
    setSplitPercent(next);
  };

  return (
    <div className="workspace-app">
      <header className="workspace-header">
        <a className="workspace-brand" href="../" aria-label="UCSBXRP home">
          <span className="brand-mark">UCSB</span>
          <span className="brand-xrp">XRP</span>
        </a>
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
            maximum={95}
            minimum={5}
            onChange={resizePanes}
            orientation={wide ? "vertical" : "horizontal"}
            value={splitPercent}
          />
        ) : null}
        <section
          aria-label="Monitor pane"
          className="workspace-pane monitor-pane"
        >
          <iframe
            onLoad={() =>
              monitorFrameRef.current?.contentWindow?.postMessage(
                workspaceSurfaceVisibilityMessage("monitor", monitorVisible),
                window.location.origin,
              )
            }
            ref={monitorFrameRef}
            src={monitorSource}
            title="UCSBXRP Monitor"
          />
        </section>
      </main>
    </div>
  );
}
