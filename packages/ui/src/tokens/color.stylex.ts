import { defineVars } from '@stylexjs/stylex'

import { palette } from './palette.stylex'

/**
 * Roles as used across the Figma screens. Components style against these, never the palette, so a
 * theme only overrides this group. Hex values outside the palette come straight from the screens.
 */
export const color = defineVars({
  accent: palette.shimmer500,
  background: palette.navy500,
  brand: '#c9be97',
  danger: palette.error500,
  info: palette.blue500,
  overlay: 'rgb(2 13 24 / 73%)',
  primary: palette.mana500,
  primaryGradient: `linear-gradient(90deg, ${palette.mana800}, ${palette.mana400})`,
  success: palette.green500,
  text: palette.white50,
  textMuted: '#57707a',
  textSecondary: 'rgb(255 255 255 / 60%)',
})
