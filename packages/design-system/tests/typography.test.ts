import { describe, expect, it } from "bun:test";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import {
  typographyFontFamilyNames,
  typographyFontWeightNames,
  typographyScaleNames,
  type TypographyFontFamilyName,
  type TypographyFontWeightName,
  type TypographyScaleName,
} from "../src";

const typographyCssPath = join(import.meta.dir, "..", "src", "styles", "typography.css");

const readTypographyCss = () => existsSync(typographyCssPath)
  ? readFileSync(typographyCssPath, "utf8")
  : "";

const readCssVariableValue = (cssVariable: string) => {
  const css = readTypographyCss();
  const match = css.match(new RegExp(`${cssVariable}:\\s*([^;]+);`));

  return match?.[1]?.trim();
};

const expectCssVariable = (cssVariable: string) => {
  const value = readCssVariableValue(cssVariable);

  expect(value, `${cssVariable} must be declared`).toBeString();

  return value ?? "";
};

const expectThemeAlias = (themeVariable: string, cssVariable: string) => {
  expect(readTypographyCss()).toContain(`${themeVariable}: var(${cssVariable});`);
};

const isPositiveRem = (value: string) => /^\d+(?:\.\d+)?rem$/.test(value) && Number.parseFloat(value) > 0;
const isNumericWeight = (value: string) => /^[1-9]\d{2}$/.test(value);
const isLetterSpacing = (value: string) => /^-?\d+(?:\.\d+)?em$/.test(value);
const hasFontFallback = (value: string) => /(?:sans-serif|monospace)$/.test(value);

const scaleToken = (prefix: string, scaleName: TypographyScaleName) => `--shoma-${prefix}-${scaleName}`;
const familyToken = (familyName: TypographyFontFamilyName) => `--shoma-font-family-${familyName}`;
const weightToken = (weightName: TypographyFontWeightName) => `--shoma-font-weight-${weightName}`;

describe("typography tokens", () => {
  for (const scaleName of typographyScaleNames) {
    it(`defines valid font size, line height, and letter spacing tokens for ${scaleName}`, () => {
      expect(isPositiveRem(expectCssVariable(scaleToken("font-size", scaleName)))).toBe(true);
      expect(isPositiveRem(expectCssVariable(scaleToken("line-height", scaleName)))).toBe(true);
      expect(isLetterSpacing(expectCssVariable(scaleToken("letter-spacing", scaleName)))).toBe(true);
    });

    it(`maps ${scaleName} typography tokens into the Tailwind v4 theme`, () => {
      expectThemeAlias(`--text-${scaleName}`, scaleToken("font-size", scaleName));
      expectThemeAlias(`--leading-${scaleName}`, scaleToken("line-height", scaleName));
      expectThemeAlias(`--tracking-${scaleName}`, scaleToken("letter-spacing", scaleName));
    });
  }

  for (const familyName of typographyFontFamilyNames) {
    it(`defines and maps the ${familyName} font family`, () => {
      expect(hasFontFallback(expectCssVariable(familyToken(familyName)))).toBe(true);
      expectThemeAlias(`--font-${familyName}`, familyToken(familyName));
    });
  }

  for (const weightName of typographyFontWeightNames) {
    it(`defines and maps the ${weightName} font weight`, () => {
      expect(isNumericWeight(expectCssVariable(weightToken(weightName)))).toBe(true);
      expectThemeAlias(`--font-weight-${weightName}`, weightToken(weightName));
    });
  }
});
