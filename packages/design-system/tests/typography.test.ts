import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

import { describe, expect, it } from 'bun:test'

import { type TypographyFontFamilyName, typographyFontFamilyNames, type TypographyFontWeightName, typographyFontWeightNames, type TypographyScaleName, typographyScaleNames } from '../src'


const typographyCssPath = join(import.meta.dir, '..', 'src', 'styles', 'typography.css')

const readTypographyCss = () => {
  return existsSync(typographyCssPath) ? readFileSync(typographyCssPath, 'utf8') : ''
}

const readCssVariableValue = (cssVariable: string) => {
  const css = readTypographyCss()
  const match = new RegExp(`${cssVariable}:\\s*([^;]+);`).exec(css)

  return match?.[1]?.trim()
}

const expectCssVariable = (cssVariable: string) => {
  const value = readCssVariableValue(cssVariable)

  expect(value, `${cssVariable} must be declared`).toBeString()

  return value ?? ''
}

const expectThemeAlias = (themeVariable: string, cssVariable: string) => {
  expect(readTypographyCss()).toContain(`${themeVariable}: var(${cssVariable});`)
}

const isPositiveRem = (value: string) => {
  return /^\d+(?:\.\d+)?rem$/.test(value) && Number.parseFloat(value) > 0
}
const isNumericWeight = (value: string) => {
  return /^[1-9]\d{2}$/.test(value)
}
const isLetterSpacing = (value: string) => {
  return /^-?\d+(?:\.\d+)?em$/.test(value)
}

const scaleToken = (prefix: string, scaleName: TypographyScaleName) => {
  return `--shoma-${prefix}-${scaleName}`
}
const weightToken = (weightName: TypographyFontWeightName) => {
  return `--shoma-font-weight-${weightName}`
}

const fontFamilyVariables = {
  display: {
    cssVariable: '--shoma-font-display',
    value: "'Beaufort for LoL', serif",
  },
  mono: {
    cssVariable: '--shoma-font-mono',
    value: 'monospace',
  },
  primary: {
    cssVariable: '--shoma-font-body',
    value: "'Spiegel', sans-serif",
  },
} satisfies Record<TypographyFontFamilyName, { cssVariable: string; value: string }>

const fontFaces = [
  ['Beaufort for LoL', 'beaufortforlol-regular.otf', '400'],
  ['Beaufort for LoL', 'beaufortforlol-bold.otf', '700'],
  ['Beaufort for LoL', 'beaufortforlol-heavy.otf', '900'],
  ['Spiegel', 'spiegel-regular.otf', '400'],
  ['Spiegel', 'spiegel-semibold.otf', '600'],
  ['Spiegel', 'spiegel-bold.otf', '700'],
] as const

describe('typography tokens', () => {
  for (const scaleName of typographyScaleNames) {
    it(`defines valid font size, line height, and letter spacing tokens for ${scaleName}`, () => {
      expect(isPositiveRem(expectCssVariable(scaleToken('font-size', scaleName)))).toBe(true)
      expect(isPositiveRem(expectCssVariable(scaleToken('line-height', scaleName)))).toBe(true)
      expect(isLetterSpacing(expectCssVariable(scaleToken('letter-spacing', scaleName)))).toBe(true)
    })

    it(`maps ${scaleName} typography tokens into the Tailwind v4 theme`, () => {
      expectThemeAlias(`--text-${scaleName}`, scaleToken('font-size', scaleName))
      expectThemeAlias(`--leading-${scaleName}`, scaleToken('line-height', scaleName))
      expectThemeAlias(`--tracking-${scaleName}`, scaleToken('letter-spacing', scaleName))
    })
  }

  for (const familyName of typographyFontFamilyNames) {
    it(`defines and maps the ${familyName} font family`, () => {
      const fontFamily = fontFamilyVariables[familyName]

      expect(expectCssVariable(fontFamily.cssVariable)).toBe(fontFamily.value)
      expectThemeAlias(`--font-${familyName}`, fontFamily.cssVariable)
    })
  }

  for (const [fontFamily, fileName, fontWeight] of fontFaces) {
    it(`loads ${fontFamily} ${fontWeight} from CommunityDragon`, () => {
      const css = readTypographyCss()

      expect(css).toContain(`font-family: '${fontFamily}';`)

      expect(css).toContain(
        `src: url('https://raw.communitydragon.org/latest/game/assets/ux/fonts/${fileName}') format('opentype');`,
      )

      expect(css).toContain(`font-weight: ${fontWeight};`)
      expect(css).toContain('font-display: swap;')
    })
  }

  for (const weightName of typographyFontWeightNames) {
    it(`defines and maps the ${weightName} font weight`, () => {
      expect(isNumericWeight(expectCssVariable(weightToken(weightName)))).toBe(true)
      expectThemeAlias(`--font-weight-${weightName}`, weightToken(weightName))
    })
  }
})
