export interface PageDepartureParticipant {
  /** Read before any participant is canceled, so its warning cannot disappear. */
  needsProtection?(): boolean;
  /** Synchronous cancellation only; this must not release the document's ports. */
  cancel?(): void;
}

const REGISTRY_KEY = "__ucsbXrpPageDepartureV1";

interface DepartureRegistry {
  readonly scope: Window;
  readonly participants: Set<PageDepartureParticipant>;
  readonly beforeUnload: (event: BeforeUnloadEvent) => void;
  children?: () => readonly Window[];
  dispatching: boolean;
}

type DepartureWindow = Window & {
  [REGISTRY_KEY]?: DepartureRegistry;
};

function currentWindow(): Window | undefined {
  return typeof window === "undefined" ? undefined : window;
}

function registryFor(scope: Window): DepartureRegistry | undefined {
  return (scope as DepartureWindow)[REGISTRY_KEY];
}

function isWorkspaceChild(scope: Window, child: Window): boolean {
  try {
    return (
      child.parent === scope && child.location.origin === scope.location.origin
    );
  } catch {
    return false;
  }
}

function departureBoundary(local: DepartureRegistry): DepartureRegistry {
  try {
    const parent = local.scope.parent;
    if (parent === local.scope || !isWorkspaceChild(parent, local.scope))
      return local;
    const enclosing = registryFor(parent);
    if (enclosing?.children?.().includes(local.scope)) return enclosing;
  } catch {
    // A standalone document or unrelated embedding has only its local scope.
  }
  return local;
}

function prepareDeparture(boundary: DepartureRegistry): boolean {
  // A cancellation callback may synchronously dispatch another lifecycle event.
  // Never recurse, and never let that inner event erase the original warning.
  if (boundary.dispatching) return true;
  boundary.dispatching = true;
  let needsProtection = false;
  try {
    const registries = new Set<DepartureRegistry>([boundary]);
    try {
      for (const child of boundary.children?.() ?? []) {
        if (!isWorkspaceChild(boundary.scope, child)) continue;
        const registry = registryFor(child);
        if (registry) registries.add(registry);
      }
    } catch {
      needsProtection = true;
    }
    const participants = [...registries].flatMap((registry) => [
      ...registry.participants,
    ]);
    // Do not short-circuit: all original protection reasons must be captured
    // before any callback can clear a pending-start or unsaved-data flag.
    for (const participant of participants) {
      try {
        if (participant.needsProtection?.()) needsProtection = true;
      } catch {
        needsProtection = true;
      }
    }
    for (const participant of participants) {
      try {
        participant.cancel?.();
      } catch {
        // A failing participant must neither silence the warning nor prevent
        // the remaining workspace targets from canceling their own starts.
        needsProtection = true;
      }
    }
    return needsProtection;
  } finally {
    boundary.dispatching = false;
  }
}

function ensureRegistry(scope: Window): DepartureRegistry {
  const existing = registryFor(scope);
  if (existing) return existing;
  const registry: DepartureRegistry = {
    scope,
    participants: new Set(),
    dispatching: false,
    beforeUnload: (event) => {
      if (!prepareDeparture(departureBoundary(registry))) return;
      event.preventDefault();
      event.returnValue = "";
    },
  };
  Object.defineProperty(scope, REGISTRY_KEY, {
    configurable: true,
    value: registry,
  });
  scope.addEventListener("beforeunload", registry.beforeUnload);
  return registry;
}

function releaseUnusedRegistry(registry: DepartureRegistry): void {
  if (registry.participants.size > 0 || registry.children) return;
  registry.scope.removeEventListener("beforeunload", registry.beforeUnload);
  if (registryFor(registry.scope) === registry) {
    Reflect.deleteProperty(registry.scope, REGISTRY_KEY);
  }
}

/** Register local warning/cancellation behavior; independently bundled frames share their Window registry. */
export function registerPageDeparture(
  participant: PageDepartureParticipant,
  scope: Window | undefined = currentWindow(),
): () => void {
  if (!scope) return () => undefined;
  const registry = ensureRegistry(scope);
  registry.participants.add(participant);
  return () => {
    registry.participants.delete(participant);
    releaseUnusedRegistry(registry);
  };
}

/** Limit synchronous departure fanout to this workspace's explicitly supplied child frames. */
export function registerWorkspaceDeparture(
  children: () => readonly Window[],
  scope: Window | undefined = currentWindow(),
): () => void {
  if (!scope) return () => undefined;
  const registry = ensureRegistry(scope);
  registry.children = children;
  return () => {
    if (registry.children === children) registry.children = undefined;
    releaseUnusedRegistry(registry);
  };
}
