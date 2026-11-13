import { defineVars } from '@stylexjs/stylex'

import { palette } from './palette.stylex'

/**
 * Roles as used across the Figma screens. Components style against these, never the palette, so a
 * theme only overrides this group. Hex values outside the palette come straight from the screens.
 */
export const color = defineVars({
  accent: palette.shimmer500,
  accentPressed: palette.shimmer600,
  background: palette.navy500,
  border: palette.mana700,
  borderDisabled: '#3c4f57',
  borderStrong: palette.mana100,
  brand: '#c9be97',
  danger: palette.error500,
  fieldBackground: 'rgb(116 169 185 / 6%)',
  focusRing: palette.mana300,
  icon: palette.navy50,
  info: palette.blue500,
  overlay: 'rgb(2 13 24 / 73%)',
  pressed: 'rgb(116 169 185 / 16%)',
  primary: palette.mana500,
  primaryGradient: `linear-gradient(90deg, ${palette.mana800}, ${palette.mana400})`,
  primaryGradientDisabled: 'linear-gradient(90deg, #24333b, #33474f)',
  primaryGradientPressed: 'linear-gradient(90deg, #244149, #5a8b9a)',
  success: palette.green500,
  surface: '#142129',
  text: palette.white50,
  textAction: palette.mana300,
  textDisabled: palette.mana700,
  textLabel: palette.mana400,
  textMuted: '#57707a',
  textSecondary: 'rgb(255 255 255 / 60%)',
})
