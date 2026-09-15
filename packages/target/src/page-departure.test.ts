import { describe, expect, it, vi } from "vitest";
import {
  registerPageDeparture,
  registerWorkspaceDeparture,
} from "./page-departure";

function page(parent?: Window, origin = "https://course.example"): Window {
  const scope = Object.assign(new EventTarget(), {
    location: { origin },
    parent,
  });
  if (!parent) scope.parent = scope as unknown as Window;
  return scope as unknown as Window;
}

function leave(scope: Window): boolean {
  return scope.dispatchEvent(new Event("beforeunload", { cancelable: true }));
}

describe("synchronous workspace departure", () => {
  it("captures every original warning before canceling both children from the first frame's event", () => {
    const host = page(),
      ide = page(host),
      monitor = page(host);
    const order: string[] = [];
    let pending = true;
    registerWorkspaceDeparture(() => [ide, monitor], host);
    registerPageDeparture(
      {
        needsProtection: () => {
          order.push("IDE read");
          return true;
        },
        cancel: () => {
          order.push("IDE cancel");
        },
      },
      ide,
    );
    registerPageDeparture(
      {
        needsProtection: () => {
          order.push("Monitor read");
          return pending;
        },
        cancel: () => {
          order.push("Monitor cancel");
          pending = false;
        },
      },
      monitor,
    );

    expect(leave(ide)).toBe(false);
    expect(pending).toBe(false);
    expect(order).toEqual([
      "IDE read",
      "Monitor read",
      "IDE cancel",
      "Monitor cancel",
    ]);
  });

  it("latches a pending-only warning after cancellation clears the last protection reason", () => {
    const host = page(),
      ide = page(host),
      monitor = page(host);
    let pending = true;
    const cancel = vi.fn(() => {
      pending = false;
    });
    registerWorkspaceDeparture(() => [ide, monitor], host);
    registerPageDeparture({ needsProtection: () => false }, ide);
    registerPageDeparture({ needsProtection: () => pending, cancel }, monitor);
    expect(leave(host)).toBe(false);
    expect(pending).toBe(false);
    expect(cancel).toHaveBeenCalledOnce();
    expect(leave(host)).toBe(true);
  });

  it("does not recurse or lose protection when a cancellation dispatches another native event", () => {
    const host = page(),
      ide = page(host),
      monitor = page(host);
    let pending = true;
    const nested: boolean[] = [];
    const first = vi.fn(() => {
      pending = false;
      nested.push(leave(monitor));
    });
    const second = vi.fn();
    registerWorkspaceDeparture(() => [ide, monitor], host);
    registerPageDeparture(
      { needsProtection: () => pending, cancel: first },
      ide,
    );
    registerPageDeparture({ cancel: second }, monitor);
    expect(leave(ide)).toBe(false);
    expect(nested).toEqual([false]);
    expect(first).toHaveBeenCalledOnce();
    expect(second).toHaveBeenCalledOnce();
  });

  it("keeps warning and cancels remaining participants after either phase throws", () => {
    const host = page(),
      ide = page(host),
      monitor = page(host);
    const remainingCheck = vi.fn(() => false),
      remainingCancel = vi.fn();
    registerWorkspaceDeparture(() => [ide, monitor], host);
    registerPageDeparture(
      {
        needsProtection: () => {
          throw new Error("read failed");
        },
        cancel: () => {
          throw new Error("cancel failed");
        },
      },
      ide,
    );
    registerPageDeparture(
      { needsProtection: remainingCheck, cancel: remainingCancel },
      monitor,
    );
    expect(leave(host)).toBe(false);
    expect(remainingCheck).toHaveBeenCalledOnce();
    expect(remainingCancel).toHaveBeenCalledOnce();
  });

  it("uses only the current explicit same-origin children, excluding tabs and other embeds", () => {
    const host = page(),
      ide = page(host),
      monitor = page(host),
      docs = page(host),
      otherTab = page(),
      foreign = page(host, "https://other.example");
    const own = vi.fn(),
      unrelated = vi.fn();
    registerWorkspaceDeparture(() => [ide, monitor, otherTab, foreign], host);
    registerPageDeparture({ cancel: own }, ide);
    registerPageDeparture({ cancel: own }, monitor);
    registerPageDeparture({ cancel: unrelated }, docs);
    registerPageDeparture({ cancel: unrelated }, otherTab);
    registerPageDeparture({ cancel: unrelated }, foreign);
    expect(leave(host)).toBe(true);
    expect(own).toHaveBeenCalledTimes(2);
    expect(unrelated).not.toHaveBeenCalled();
    expect(leave(docs)).toBe(true);
    expect(unrelated).toHaveBeenCalledOnce();
    expect(own).toHaveBeenCalledTimes(2);
  });

  it("removes old document registrations and uses replacement child capabilities", () => {
    const host = page(),
      ide = page(host);
    let monitor = page(host);
    const old = vi.fn(),
      current = vi.fn();
    const releaseWorkspace = registerWorkspaceDeparture(
      () => [ide, monitor],
      host,
    );
    const releaseOld = registerPageDeparture(
      { needsProtection: () => true, cancel: old },
      monitor,
    );
    expect(leave(host)).toBe(false);
    releaseOld();
    monitor = page(host);
    const releaseCurrent = registerPageDeparture({ cancel: current }, monitor);
    expect(leave(host)).toBe(true);
    expect(old).toHaveBeenCalledOnce();
    expect(current).toHaveBeenCalledOnce();
    releaseCurrent();
    releaseWorkspace();
    expect(leave(host)).toBe(true);
    expect(current).toHaveBeenCalledOnce();
    expect(leave(monitor)).toBe(true);
    expect(current).toHaveBeenCalledOnce();
  });
});
