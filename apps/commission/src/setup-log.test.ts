import { describe, expect, it } from "vitest";

import {
  createSetupLogEntry,
  renderSetupLog,
  setupDiagnosticEvent,
  setupSessionStartMessage,
} from "./setup-log";

describe("commissioning setup log", () => {
  it("preserves the original setup timestamp and success level in diagnostics", () => {
    const entry = createSetupLogEntry(
      "Folder",
      "Write access verified",
      "success",
      new Date("2026-08-07T12:00:00.000Z"),
    );

    expect(
      setupDiagnosticEvent({ entry, eventId: "session-1:setup:1" }),
    ).toEqual({
      event: "setup.folder",
      eventId: "session-1:setup:1",
      level: "info",
      message:
        "[2026-08-07T12:00:00.000Z] SUCCESS Folder: Write access verified",
      terminal: false,
    });
  });

  it("creates one explicit session-start diagnostic with environment details", () => {
    const entry = createSetupLogEntry(
      "Session start",
      setupSessionStartMessage({
        build: "app build abc123",
        courseRelease: "2026.08-dev.42",
        browser: "Chromium 140",
        operatingSystem: "macOS",
        capabilities: [
          "secure context yes",
          "Web Serial available",
          "service worker controller active",
        ],
      }),
      "info",
      new Date("2026-08-07T12:00:00.000Z"),
    );
    const event = setupDiagnosticEvent({ entry, eventId: "session-1:start" });

    expect(event.event).toBe("session.start");
    expect(event.message).toContain("Build: app build abc123");
    expect(event.message).toContain("course: 2026.08-dev.42");
    expect(event.message).toContain("browser: Chromium 140");
    expect(event.message).toContain("OS: macOS");
    expect(event.message).toContain("secure context yes");
    expect(event.message).not.toContain("telemetry");
  });

  it("keeps each current-attempt entry on one readable line", () => {
    const entry = createSetupLogEntry(
      "XRP service",
      "No reply\nwithin   three seconds",
      "warning",
      new Date("2026-08-07T12:00:00.000Z"),
    );

    expect(entry.message).toBe("No reply within three seconds");
    expect(renderSetupLog([entry], "test")).toContain(
      "WARNING XRP service: No reply within three seconds",
    );
  });
});
