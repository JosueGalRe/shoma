import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

import { describe, expect, it } from 'bun:test'

import { semanticTokenContract, semanticTokenNames } from '../src'

const tokenCssPath = join(import.meta.dir, '..', 'src', 'tokens', 'semantic.css')

const semanticTokenValues = {
  accent: '#0ac8b9',
  border: '#1e2328',
  'border-gold': '#785a28',
  error: '#e84057',
  primary: '#c8aa6e',
  success: '#0ac8b9',
  surface: '#010a13',
  'surface-elevated': '#0a1428',
  'surface-hover': '#0f1f3a',
  text: '#f0e6d2',
  'text-muted': '#a09b8c',
} satisfies Record<(typeof semanticTokenNames)[number], string>

const readTokenCss = () => {
  return existsSync(tokenCssPath) ? readFileSync(tokenCssPath, 'utf8') : ''
}

describe('semantic token contract', () => {
  for (const tokenName of semanticTokenNames) {
    it(`defines --shoma-${tokenName}`, () => {
      const css = readTokenCss()
      const cssVariable = semanticTokenContract[tokenName]

      expect(css).toContain(`${cssVariable}: ${semanticTokenValues[tokenName]}`)
    })
  }
})
