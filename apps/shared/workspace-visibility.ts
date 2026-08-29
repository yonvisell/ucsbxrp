import { useEffect, useState } from "react";

export const workspaceSurfaceVisibilityMessageType =
  "ucsb-xrp-workspace-surface-visibility-v1";
export const workspaceSurfaceReadyMessageType =
  "ucsb-xrp-workspace-surface-ready-v1";

export type WorkspaceSurface = "monitor";

export interface WorkspaceSurfaceVisibilityMessage {
  readonly type: typeof workspaceSurfaceVisibilityMessageType;
  readonly surface: WorkspaceSurface;
  readonly visible: boolean;
}

export interface WorkspaceSurfaceReadyMessage {
  readonly type: typeof workspaceSurfaceReadyMessageType;
  readonly surface: WorkspaceSurface;
}

export function workspaceSurfaceVisibilityMessage(
  surface: WorkspaceSurface,
  visible: boolean,
): WorkspaceSurfaceVisibilityMessage {
  return { type: workspaceSurfaceVisibilityMessageType, surface, visible };
}

export function workspaceSurfaceReadyMessage(
  surface: WorkspaceSurface,
): WorkspaceSurfaceReadyMessage {
  return { type: workspaceSurfaceReadyMessageType, surface };
}

export function parseWorkspaceSurfaceReadyMessage(
  value: unknown,
): WorkspaceSurfaceReadyMessage | null {
  if (!value || typeof value !== "object") return null;
  const candidate = value as Partial<WorkspaceSurfaceReadyMessage>;
  return candidate.type === workspaceSurfaceReadyMessageType &&
    candidate.surface === "monitor"
    ? { type: workspaceSurfaceReadyMessageType, surface: candidate.surface }
    : null;
}

export function parseWorkspaceSurfaceVisibilityMessage(
  value: unknown,
): WorkspaceSurfaceVisibilityMessage | null {
  if (!value || typeof value !== "object") return null;
  const candidate = value as Partial<WorkspaceSurfaceVisibilityMessage>;
  return candidate.type === workspaceSurfaceVisibilityMessageType &&
    candidate.surface === "monitor" &&
    typeof candidate.visible === "boolean"
    ? {
        type: workspaceSurfaceVisibilityMessageType,
        surface: candidate.surface,
        visible: candidate.visible,
      }
    : null;
}

function documentIsVisible(): boolean {
  return (
    typeof document === "undefined" || document.visibilityState !== "hidden"
  );
}

export function workspaceSurfaceStartsVisible(embedded: boolean): boolean {
  return !embedded;
}

/**
 * Combines browser-tab visibility with the owning Workspace pane state. A
 * standalone application has no owning Workspace and therefore starts active.
 */
export function useWorkspaceSurfaceActive(surface: WorkspaceSurface): boolean {
  const [documentVisible, setDocumentVisible] = useState(documentIsVisible);
  const [workspaceVisible, setWorkspaceVisible] = useState(() =>
    workspaceSurfaceStartsVisible(
      typeof window !== "undefined" && window.parent !== window,
    ),
  );

  useEffect(() => {
    const updateDocumentVisibility = () =>
      setDocumentVisible(documentIsVisible());
    const updateWorkspaceVisibility = (event: MessageEvent<unknown>) => {
      if (
        window.parent === window ||
        event.source !== window.parent ||
        event.origin !== window.location.origin
      ) {
        return;
      }
      const message = parseWorkspaceSurfaceVisibilityMessage(event.data);
      if (message?.surface === surface) {
        setWorkspaceVisible(message.visible);
      }
    };

    document.addEventListener("visibilitychange", updateDocumentVisibility);
    window.addEventListener("message", updateWorkspaceVisibility);
    if (window.parent !== window) {
      window.parent.postMessage(
        workspaceSurfaceReadyMessage(surface),
        window.location.origin,
      );
    }
    return () => {
      document.removeEventListener(
        "visibilitychange",
        updateDocumentVisibility,
      );
      window.removeEventListener("message", updateWorkspaceVisibility);
    };
  }, [surface]);

  return documentVisible && workspaceVisible;
}
