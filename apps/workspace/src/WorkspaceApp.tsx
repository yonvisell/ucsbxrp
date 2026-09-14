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

function initialDocumentation(): string | null {
  const section = new URLSearchParams(window.location.search).get("help");
  return section === "guide" || section === "reference"
    ? `../${section}/${window.location.hash}`
    : null;
}

export function WorkspaceApp() {
  const [mode, setModeState] = useState<WorkspaceMode>(initialMode);
  const [documentationUrl, setDocumentationUrl] = useState<string | null>(
    initialDocumentation,
  );
  const [wide, setWide] = useState(initiallyWide);
  const [splitPercent, setSplitPercent] = useState(50);
  const navigationState = useRef({ mode, documentationUrl });
  navigationState.current = { mode, documentationUrl };
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
    const restore = () => {
      setModeState(initialMode());
      setDocumentationUrl(initialDocumentation());
    };
    window.addEventListener("popstate", restore);
    return () => window.removeEventListener("popstate", restore);
  }, []);

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

  const rememberNavigation = (
    nextMode: WorkspaceMode,
    documentUrl: string | null,
  ) => {
    const url = new URL(window.location.href);
    url.searchParams.set("mode", nextMode);
    if (documentUrl)
      url.searchParams.set(
        "help",
        new URL(documentUrl, window.location.href).pathname.includes(
          "/reference/",
        )
          ? "reference"
          : "guide",
      );
    else url.searchParams.delete("help");
    url.hash = documentUrl
      ? new URL(documentUrl, window.location.href).hash
      : "";
    if (url.href !== window.location.href)
      window.history.pushState(null, "", url);
  };
  const setMode = (next: WorkspaceMode): void => {
    setModeState(next);
    rememberNavigation(next, navigationState.current.documentationUrl);
  };
  const openDocumentation = (url: string | null): void => {
    setDocumentationUrl(url);
    rememberNavigation(navigationState.current.mode, url);
  };
  const wireNavigation = (frame: HTMLIFrameElement) => {
    const doc = frame.contentDocument;
    if (!doc) return;
    doc.addEventListener("click", (event) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      )
        return;
      const anchor = (
        event.target as Element | null
      )?.closest<HTMLAnchorElement>("a[href]");
      if (!anchor || anchor.hasAttribute("download")) return;
      const url = new URL(anchor.href);
      if (url.origin !== window.location.origin) return;
      const base = new URL("../", window.location.href).pathname;
      if (!url.pathname.startsWith(base)) return;
      const page = url.pathname.slice(base.length).split("/")[0];
      if (page === "guide" || page === "reference") {
        if (
          frame.title === "Course documentation" &&
          url.pathname === new URL(frame.src).pathname &&
          url.hash
        )
          return;
        event.preventDefault();
        openDocumentation(url.href);
      } else if (page === "workspace" || page === "ide" || page === "monitor") {
        event.preventDefault();
        const requested =
          page === "workspace" ? url.searchParams.get("mode") : page;
        const next =
          requested === "monitor" || requested === "split" ? requested : "ide";
        setModeState(next);
        setDocumentationUrl(null);
        rememberNavigation(next, null);
      } else if (
        frame.title === "Course documentation" &&
        (page === "" || page === "commission")
      ) {
        event.preventDefault();
        window.location.assign(url.href);
      }
    });
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
          <a
            href="../guide/"
            onClick={(event) => {
              event.preventDefault();
              openDocumentation("../guide/");
            }}
          >
            Guide
          </a>
          <a
            href="../reference/"
            onClick={(event) => {
              event.preventDefault();
              openDocumentation("../reference/");
            }}
          >
            API
          </a>
          <a href="../">Home</a>
        </nav>
      </header>

      <div
        className={`workspace-content ${documentationUrl ? "with-documentation" : ""}`}
      >
        <main
          className={`workspace-panes mode-${mode} ${wide ? "wide" : "narrow"}`}
          style={mode === "split" ? splitStyle : undefined}
        >
          <section aria-label="IDE pane" className="workspace-pane ide-pane">
            <iframe
              allow="serial"
              onLoad={(event) => wireNavigation(event.currentTarget)}
              src="../ide/?embedded=1"
              title="UCSBXRP IDE"
            />
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
              onLoad={(event) => {
                wireNavigation(event.currentTarget);
                monitorFrameRef.current?.contentWindow?.postMessage(
                  workspaceSurfaceVisibilityMessage("monitor", monitorVisible),
                  window.location.origin,
                );
              }}
              ref={monitorFrameRef}
              src={monitorSource}
              title="UCSBXRP Monitor"
            />
          </section>
        </main>
        {documentationUrl ? (
          <aside
            aria-label="Course documentation"
            className="workspace-documentation"
          >
            <div className="documentation-toolbar">
              <strong>Guide and API</strong>
              <button onClick={() => openDocumentation(null)}>
                Close documentation
              </button>
            </div>
            <iframe
              onLoad={(event) => wireNavigation(event.currentTarget)}
              src={documentationUrl}
              title="Course documentation"
            />
          </aside>
        ) : null}
      </div>
    </div>
  );
}
