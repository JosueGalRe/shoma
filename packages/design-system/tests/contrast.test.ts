import { describe, expect, it } from "bun:test";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { semanticTokenContract, type SemanticTokenName } from "../src";

const minimumNormalTextContrast = 4.5;
const minimumLargeTextContrast = 3;
const tokenCssPath = join(import.meta.dir, "..", "src", "tokens", "semantic.css");

interface RgbColor {
  readonly red: number;
  readonly green: number;
  readonly blue: number;
}

const readTokenCss = () => (existsSync(tokenCssPath) ? readFileSync(tokenCssPath, "utf8") : "");

const readSemanticTokenValue = (tokenName: SemanticTokenName) => {
  const css = readTokenCss();
  const cssVariable = semanticTokenContract[tokenName];
  const match = css.match(new RegExp(`${cssVariable}:\\s*([^;]+);`));

  return match?.[1]?.trim();
};

const parseHexColor = (value: string): RgbColor | undefined => {
  const hex = value.match(/^#(?<hex>[0-9a-f]{3}|[0-9a-f]{6})$/i)?.groups?.hex;

  if (!hex) {
    return undefined;
  }

  const expanded = hex.length === 3
    ? hex.split("").map((character) => character + character).join("")
    : hex;

  return {
    red: Number.parseInt(expanded.slice(0, 2), 16),
    green: Number.parseInt(expanded.slice(2, 4), 16),
    blue: Number.parseInt(expanded.slice(4, 6), 16),
  };
};

const parseRgbChannel = (channel: string) => {
  const value = channel.trim();

  if (value.endsWith("%")) {
    return Math.round(Number.parseFloat(value) * 2.55);
  }

  return Number.parseFloat(value);
};

const parseRgbColor = (value: string): RgbColor | undefined => {
  const match = value.match(/^rgba?\((?<channels>[^)]+)\)$/i);

  if (!match?.groups?.channels) {
    return undefined;
  }

  const [red, green, blue] = match.groups.channels
    .split(/[,/\s]+/)
    .filter(Boolean)
    .slice(0, 3)
    .map(parseRgbChannel);

  if (red === undefined || green === undefined || blue === undefined) {
    return undefined;
  }

  return { red, green, blue };
};

const parseColor = (value: string): RgbColor | undefined => {
  return parseHexColor(value) ?? parseRgbColor(value);
};

const relativeLuminance = ({ red, green, blue }: RgbColor) => {
  const [linearRed, linearGreen, linearBlue] = [red, green, blue].map((channel) => {
    const normalized = channel / 255;

    return normalized <= 0.04045
      ? normalized / 12.92
      : ((normalized + 0.055) / 1.055) ** 2.4;
  });

  return (0.2126 * linearRed) + (0.7152 * linearGreen) + (0.0722 * linearBlue);
};

const contrastRatio = (foreground: RgbColor, background: RgbColor) => {
  const lighter = Math.max(relativeLuminance(foreground), relativeLuminance(background));
  const darker = Math.min(relativeLuminance(foreground), relativeLuminance(background));

  return (lighter + 0.05) / (darker + 0.05);
};

const expectTokenColor = (tokenName: SemanticTokenName) => {
  const value = readSemanticTokenValue(tokenName);

  expect(value, `${tokenName} must be declared as a concrete color`).toBeString();

  const color = parseColor(value ?? "");

  expect(color, `${tokenName} must use a contrast-testable color syntax`).toBeDefined();

  return color as RgbColor;
};

const expectContrast = (
  foregroundToken: SemanticTokenName,
  backgroundToken: SemanticTokenName,
  minimumRatio: number,
) => {
  const foreground = expectTokenColor(foregroundToken);
  const background = expectTokenColor(backgroundToken);

  expect(contrastRatio(foreground, background)).toBeGreaterThanOrEqual(minimumRatio);
};

describe("semantic token contrast", () => {
  it("meets WCAG 2.2 AA normal text contrast for foreground on background", () => {
    expectContrast("foreground", "background", minimumNormalTextContrast);
  });

  it("meets WCAG 2.2 AA normal text contrast for primary foreground on primary", () => {
    expectContrast("primary-foreground", "primary", minimumNormalTextContrast);
  });

  it("meets WCAG 2.2 AA large text contrast for muted text on background", () => {
    expectContrast("muted", "background", minimumLargeTextContrast);
  });

  it("meets WCAG 2.2 AA large text contrast for accent text on background", () => {
    expectContrast("accent", "background", minimumLargeTextContrast);
  });

  it("meets WCAG 2.2 AA large text contrast for destructive text on background", () => {
    expectContrast("destructive", "background", minimumLargeTextContrast);
  });
});
