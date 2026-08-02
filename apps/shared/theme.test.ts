import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const theme = readFileSync(new URL("./theme.css", import.meta.url), "utf8");

function color(name: string): string {
  const match = theme.match(new RegExp(`--${name}:\\s*(#[0-9a-f]{6})`, "i"));
  if (!match) {
    throw new Error(`Missing color token --${name}`);
  }
  return match[1]!;
}

function relativeLuminance(hex: string): number {
  const channels = hex
    .slice(1)
    .match(/.{2}/g)!
    .map((channel) => Number.parseInt(channel, 16) / 255)
    .map((channel) =>
      channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4,
    );
  return 0.2126 * channels[0]! + 0.7152 * channels[1]! + 0.0722 * channels[2]!;
}

function contrast(foreground: string, background: string): number {
  const first = relativeLuminance(foreground);
  const second = relativeLuminance(background);
  return (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05);
}

describe("shared theme contrast", () => {
  const surfaces = ["page", "panel", "panel-raised"];

  it.each(["ink", "muted", "quiet", "cyan", "gold", "red"])(
    "keeps %s text at 4.5:1 or better on every application surface",
    (foreground) => {
      for (const background of surfaces) {
        expect(
          contrast(color(foreground), color(background)),
          `${foreground} on ${background}`,
        ).toBeGreaterThanOrEqual(4.5);
      }
    },
  );

  it.each([
    ["on-accent", "primary-bg"],
    ["on-accent", "primary-hover"],
    ["on-accent", "danger-bg"],
    ["on-accent", "danger-hover"],
    ["disabled-ink", "disabled-bg"],
  ])("keeps %s text legible on %s", (foreground, background) => {
    expect(
      contrast(color(foreground), color(background)),
    ).toBeGreaterThanOrEqual(4.5);
  });

  it("keeps control boundaries and focus indicators at 3:1 or better", () => {
    for (const background of surfaces) {
      expect(
        contrast(color("line-bright"), color(background)),
        `control boundary on ${background}`,
      ).toBeGreaterThanOrEqual(3);
      expect(
        contrast(color("cyan"), color(background)),
        `focus indicator on ${background}`,
      ).toBeGreaterThanOrEqual(3);
    }
    expect(
      contrast(color("on-accent"), color("primary-bg")),
    ).toBeGreaterThanOrEqual(3);
  });
});
