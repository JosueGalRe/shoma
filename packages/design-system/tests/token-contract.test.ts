import { describe, expect, it } from "bun:test";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { semanticTokenContract, semanticTokenNames } from "../src";

const tokenCssPath = join(import.meta.dir, "..", "src", "tokens", "semantic.css");

const readTokenCss = () => (existsSync(tokenCssPath) ? readFileSync(tokenCssPath, "utf8") : "");

describe("semantic token contract", () => {
  for (const tokenName of semanticTokenNames) {
    it(`defines --shoma-${tokenName}`, () => {
      const css = readTokenCss();
      const cssVariable = semanticTokenContract[tokenName];

      expect(css).toContain(`${cssVariable}:`);
    });
  }
});
