import { useState } from 'react'

import { create, props } from '@stylexjs/stylex'
import { useNavigate } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'

import { readRole } from '@/core/lcu/parsers/lobby'
import { PositionOption } from '@/features/lobby/components/position-option'
import { useQuickPlaySlots } from '@/features/lobby/hooks/use-quick-play-slots'
import { setSlotPosition } from '@/features/lobby/utils/quick-play-slots'

import { QuickPlayScreen } from './quick-play-screen'

import type { QuickPlayPickerProps } from './quick-play-screen-types'
import type { LobbyRole } from '@/features/lobby/lobby-store'

const POSITIONS: LobbyRole[] = ['TOP', 'JUNGLE', 'MIDDLE', 'BOTTOM', 'UTILITY']

// Figma Swift Play "Select Position": the option's position, in mana for option I and shimmer for II. Taking the other
// Option's position swaps the two, as in the client; PRIORITY marks the ones matchmaking is short of
export function QuickPlayPositionScreen({ option }: QuickPlayPickerProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const quickPlay = useQuickPlaySlots()
  const current = quickPlay.slots[option]?.positionPreference ?? 'UNSELECTED'
  const [position, setPosition] = useState(current)
  const preview = setSlotPosition(quickPlay.slots, { option, position }, [])

  function goToLobby() {
    void navigate({ to: '/connected/lobby' })
  }

  function readPriority(role: LobbyRole) {
    if (readRole(preview[0]?.positionPreference) === role) {
      return 'primary'
    }

    return readRole(preview[1]?.positionPreference) === role ? 'secondary' : null
  }

  return (
    <QuickPlayScreen
      confirmDisabled={readRole(position) === 'UNSELECTED' || quickPlay.isPending}
      hasError={quickPlay.error !== null}
      title={t('lobby.selectPosition')}
      onConfirm={() => {
        if (position === current) {
          goToLobby()

          return
        }

        quickPlay.setPosition(option, position, goToLobby)
      }}
    >
      <div {...props(styles.grid)}>
        {POSITIONS.map((role) => {
          return (
            <PositionOption
              key={role}
              caption={quickPlay.scarcePositions.includes(role) ? t('lobby.quickPlay.priority') : null}
              priority={readPriority(role)}
              role={role}
              onToggle={() => {
                setPosition(role)
              }}
            />
          )
        })}
      </div>
    </QuickPlayScreen>
  )
}

const styles = create({
  grid: {
    display: 'grid',
    gap: 16,
    gridTemplateColumns: '1fr 1fr',
  },
})
