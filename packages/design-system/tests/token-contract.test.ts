import { describe, expect, it } from "bun:test";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { semanticTokenContract, semanticTokenNames } from "../src";

const tokenCssPath = join(import.meta.dir, "..", "src", "tokens", "semantic.css");

const semanticTokenValues = {
  surface: "#010A13",
  "surface-elevated": "#0A1428",
  primary: "#C8AA6E",
  accent: "#0AC8B9",
  text: "#F0E6D2",
  "text-muted": "#A09B8C",
  border: "#1E2328",
  "border-gold": "#785A28",
  error: "#E84057",
  success: "#0AC8B9",
  "surface-hover": "#0F1F3A",
} satisfies Record<(typeof semanticTokenNames)[number], string>;

const readTokenCss = () => (existsSync(tokenCssPath) ? readFileSync(tokenCssPath, "utf8") : "");

describe("semantic token contract", () => {
  for (const tokenName of semanticTokenNames) {
    it(`defines --shoma-${tokenName}`, () => {
      const css = readTokenCss();
      const cssVariable = semanticTokenContract[tokenName];

      expect(css).toContain(`${cssVariable}: ${semanticTokenValues[tokenName]}`);
    });
  }
});
