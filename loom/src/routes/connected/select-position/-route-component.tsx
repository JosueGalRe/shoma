import { useState } from 'react'

import { Button } from '@shoma/ui/button'
import { ScreenBackground } from '@shoma/ui/screen-background'
import { text } from '@shoma/ui/text'
import { color } from '@shoma/ui/tokens/color.stylex'
import { create, props } from '@stylexjs/stylex'
import { useNavigate, useSearch } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'

import { TopBar } from '@/components/layout/top-bar'
import { useChangeRole } from '@/core/lcu/lcu-mutations'
import { useLobby } from '@/features/lobby'
import { normalizeRankedRoles, rankedRolesToPreferences } from '@/features/lobby/utils/compute-ranked-role-preferences'
import { assignRolePreference, isRolePairComplete, type RoleSlot } from '@/features/lobby/utils/compute-role-preferences'
import { JADE_RANKED_SOLO_QUEUE_ID } from '@/features/modes/mode-engine'

import { PositionOption } from './-components/position-option'

import type { LobbyRole, LobbyRolePreferences } from '@/features/lobby/lobby-store'

const POSITIONS: LobbyRole[] = ['TOP', 'JUNGLE', 'MIDDLE', 'BOTTOM', 'UTILITY', 'FILL']

// Figma "Select Position": the local player's primary and secondary positions, sent on confirm. A pick lands in the
// Slot of the tile that opened the screen, as in the client, then moves on to the other slot while that one is empty
export function SelectPositionRouteComponent() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const search = useSearch({ from: '/connected/select-position' })
  const { viewModel } = useLobby()
  const changeRole = useChangeRole()
  const [picked, setPicked] = useState<Pick<LobbyRolePreferences, 'first' | 'second'>>()
  const [slot, setSlot] = useState<RoleSlot>(search.slot)
  const pair = picked ?? viewModel.rolePreferences

  function goToLobby() {
    void navigate({ to: '/connected/lobby' })
  }

  function handleConfirm() {
    // Jade ranked ranks all five positions: the picked two lead and the rest keep their order
    const preferences: LobbyRolePreferences =
      viewModel.queueId === JADE_RANKED_SOLO_QUEUE_ID && pair.first !== 'FILL'
        ? rankedRolesToPreferences(normalizeRankedRoles({ ...viewModel.rolePreferences, ...pair }))
        : { first: pair.first, second: pair.second }

    changeRole.mutate(
      {
        fifthPreference: preferences.fifth,
        firstPreference: preferences.first,
        fourthPreference: preferences.fourth,
        secondPreference: preferences.second,
        thirdPreference: preferences.third,
      },
      { onSuccess: goToLobby },
    )
  }

  function handlePick(role: LobbyRole) {
    const next = assignRolePreference(pair, slot, role)
    const other = slot === 'first' ? 'second' : 'first'

    setPicked(next)

    if (next.first !== 'FILL' && next[other] === 'UNSELECTED') {
      setSlot(other)
    }
  }

  function readPriority(role: LobbyRole) {
    if (role === pair.first) {
      return 'primary'
    }

    return role === pair.second ? 'secondary' : null
  }

  return (
    <div {...props(styles.screen)}>
      <ScreenBackground />

      <TopBar onBack={goToLobby} />

      <main {...props(styles.content)}>
        <div {...props(styles.heading)}>
          <h1 {...props(text.heading2, styles.title)}>{t('lobby.selectPosition')}</h1>

          <p aria-live="polite" {...props(text.body3, styles.slot)}>
            {t(slot === 'first' ? 'lobby.primaryRole' : 'lobby.secondaryRole')}
          </p>
        </div>

        <div {...props(styles.grid)}>
          {POSITIONS.map((role) => {
            return (
              <PositionOption
                key={role}
                priority={readPriority(role)}
                role={role}
                onToggle={() => {
                  handlePick(role)
                }}
              />
            )
          })}
        </div>
      </main>

      <footer {...props(styles.footer)}>
        {changeRole.isError ? (
          <p role="alert" {...props(text.body4, styles.error)}>
            {t('lobby.errors.changeRoleFailed')}
          </p>
        ) : null}

        <Button disabled={!isRolePairComplete(pair) || changeRole.isPending} onClick={handleConfirm}>
          {t('createLobby.confirm')}
        </Button>
      </footer>
    </div>
  )
}

const styles = create({
  content: {
    display: 'flex',
    flexDirection: 'column',
    flexGrow: 1,
    gap: 32,
    minHeight: 0,
    overflowY: 'auto',
    paddingBlock: 16,
    paddingInline: 24,
  },
  error: {
    color: color.danger,
    margin: 0,
    textAlign: 'center',
  },
  // Figma "Bottom Action", with the lobby's 16px under the button so it doesn't move between the screens
  footer: {
    backgroundColor: color.background,
    display: 'flex',
    flexDirection: 'column',
    flexShrink: 0,
    gap: 10,
    paddingBlock: 16,
    paddingInline: 24,
  },
  grid: {
    display: 'grid',
    gap: 16,
    gridTemplateColumns: '1fr 1fr',
  },
  heading: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  screen: {
    display: 'flex',
    flexDirection: 'column',
    flexGrow: 1,
    minHeight: 0,
  },
  slot: {
    color: color.textSecondary,
    margin: 0,
    textTransform: 'uppercase',
  },
  title: {
    color: color.text,
    margin: 0,
  },
})
