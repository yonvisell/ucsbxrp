import { describe, expect, it } from "vitest";

import {
  parseWorkspaceSurfaceReadyMessage,
  parseWorkspaceSurfaceVisibilityMessage,
  workspaceSurfaceReadyMessage,
  workspaceSurfaceReadyMessageType,
  workspaceSurfaceVisibilityMessage,
  workspaceSurfaceVisibilityMessageType,
  workspaceSurfaceStartsVisible,
} from "./workspace-visibility";

describe("workspace surface visibility", () => {
  it("starts standalone surfaces active and embedded surfaces paused", () => {
    expect(workspaceSurfaceStartsVisible(false)).toBe(true);
    expect(workspaceSurfaceStartsVisible(true)).toBe(false);
  });

  it("round-trips a typed Monitor visibility message", () => {
    const message = workspaceSurfaceVisibilityMessage("monitor", false);

    expect(parseWorkspaceSurfaceVisibilityMessage(message)).toEqual({
      type: workspaceSurfaceVisibilityMessageType,
      surface: "monitor",
      visible: false,
    });
  });

  it("round-trips the event-driven embedded-surface ready handshake", () => {
    expect(
      parseWorkspaceSurfaceReadyMessage(
        workspaceSurfaceReadyMessage("monitor"),
      ),
    ).toEqual({
      type: workspaceSurfaceReadyMessageType,
      surface: "monitor",
    });
    expect(
      parseWorkspaceSurfaceReadyMessage({
        type: workspaceSurfaceReadyMessageType,
        surface: "ide",
      }),
    ).toBeNull();
  });

  it("rejects malformed or unsupported messages", () => {
    expect(parseWorkspaceSurfaceVisibilityMessage(null)).toBeNull();
    expect(
      parseWorkspaceSurfaceVisibilityMessage({
        type: workspaceSurfaceVisibilityMessageType,
        surface: "ide",
        visible: true,
      }),
    ).toBeNull();
    expect(
      parseWorkspaceSurfaceVisibilityMessage({
        type: workspaceSurfaceVisibilityMessageType,
        surface: "monitor",
        visible: "no",
      }),
    ).toBeNull();
  });
});
