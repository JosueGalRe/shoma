import { useSearch } from '@tanstack/react-router'

import { QuickPlayChampionScreen } from './-components/quick-play-champion-screen'
import { QuickPlayPositionScreen } from './-components/quick-play-position-screen'
import { QuickPlayRuneScreen } from './-components/quick-play-rune-screen'
import { QuickPlaySpellScreen } from './-components/quick-play-spell-screen'

// Figma Swift Play pickers: one part of one of the local player's two options, saved on confirm
export function QuickPlayRouteComponent() {
  const { option, part } = useSearch({ from: '/connected/quick-play' })

  if (part === 'position') {
    return <QuickPlayPositionScreen option={option} />
  }

  if (part === 'rune') {
    return <QuickPlayRuneScreen option={option} />
  }

  if (part === 'spells') {
    return <QuickPlaySpellScreen option={option} />
  }

  return <QuickPlayChampionScreen option={option} />
}
