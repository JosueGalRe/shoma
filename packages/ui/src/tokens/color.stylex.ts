import { defineVars } from '@stylexjs/stylex'

import { palette } from './palette.stylex'

/**
 * Roles as used across the Figma screens. Components style against these, never the palette, so a
 * theme only overrides this group. Hex values outside the palette come straight from the screens.
 */
export const color = defineVars({
  accent: palette.shimmer500,
  accentPressed: palette.shimmer600,
  // Navy veil the Figma lays over the screen art
  artScrim: 'rgb(12 21 30 / 49%)',
  background: palette.navy500,
  border: palette.mana700,
  borderDisabled: '#3c4f57',
  borderStrong: palette.mana100,
  brand: '#c9be97',
  bubbleReceived: palette.shimmer600,
  bubbleSent: palette.navy400,
  chip: '#123324',
  // The dashboard's DISCONNECTED status
  chipLost: '#451c1c',
  chipText: palette.mana100,
  control: palette.shimmer400,
  controlMark: palette.shimmer50,
  danger: palette.error500,
  fieldBackground: 'rgb(116 169 185 / 6%)',
  focusRing: palette.mana300,
  glow: 'rgb(129 190 251 / 5%)',
  icon: palette.navy50,
  // The position icons' unlit lanes
  iconMuted: palette.navy400,
  iconOnLight: palette.navy900,
  info: palette.blue500,
  // The party leader's crown
  leader: '#bea876',
  loader: palette.mana600,
  menu: '#121e27',
  onAccent: palette.mana50,
  overlay: 'rgb(2 13 24 / 73%)',
  // The lobby's arch and the queue cards
  panel: palette.navy700,
  pressed: 'rgb(116 169 185 / 16%)',
  primary: palette.mana500,
  primaryGradient: `linear-gradient(90deg, ${palette.mana800}, ${palette.mana400})`,
  primaryGradientDisabled: 'linear-gradient(90deg, #24333b, #33474f)',
  primaryGradientPressed: 'linear-gradient(90deg, #244149, #5a8b9a)',
  selected: palette.mana800,
  sheet: palette.navy600,
  slotDisabled: palette.mana800,
  slotIconDisabled: palette.mana900,
  stepTodo: palette.navy300,
  success: palette.green500,
  surface: '#142129',
  // The expanded champ select teams, over the screen
  teamsOverlay: 'rgb(10 19 30 / 92%)',
  text: palette.white50,
  textAction: palette.mana300,
  textDisabled: palette.mana700,
  textLabel: palette.mana400,
  textMuted: '#57707a',
  textSecondary: 'rgb(255 255 255 / 60%)',
  tileBorder: palette.shimmer300,
  // Champ select's countdown: its pill, and the bar's fill in ban and pick turns
  timerBackground: '#051019',
  timerBan: 'linear-gradient(90deg, #f0f0f0, #c16927 51%, #ff6600)',
  timerPick: `linear-gradient(90deg, #aad8e5, ${palette.mana500} 58%, #203a41)`,
  trackOff: palette.white900,
  trackOffDisabled: palette.blue900,
  trackOn: palette.shimmer900,
  trackOnDisabled: palette.shimmer800,
})
