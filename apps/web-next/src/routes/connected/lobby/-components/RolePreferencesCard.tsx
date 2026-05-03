import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import type { LobbyDetails } from '@core/rift/rift-lcu-types'
import type { LobbyMemberSnapshot } from '../-lobby-types'
import { ROLE_OPTIONS } from '../-lobby-runes'

const ROLE_ICONS: Record<string, string> = {
  TOP: '🛡️',
  JUNGLE: '🗡️',
  MIDDLE: '🔮',
  BOTTOM: '🏹',
  UTILITY: '💚',
  FILL: '⚔️',
  UNSELECTED: '❌',
}

interface RolePreferencesCardProps {
  lobbyDetails: LobbyDetails | null
  localLobbyMember: LobbyMemberSnapshot | null
  firstRoleDraft: string
  setFirstRoleDraft: (role: string) => void
  secondRoleDraft: string
  setSecondRoleDraft: (role: string) => void
  roleUpdatePending: boolean
  updateRoles: () => Promise<void>
}

export function RolePreferencesCard({
  lobbyDetails,
  localLobbyMember,
  firstRoleDraft,
  setFirstRoleDraft,
  secondRoleDraft,
  setSecondRoleDraft,
  roleUpdatePending,
  updateRoles,
}: RolePreferencesCardProps) {
  const { t } = useTranslation()

  if (!lobbyDetails?.showPositionSelector || !localLobbyMember) {
    return null
  }

  return (
    <div className='rounded-xl border border-gold-dim/30 bg-background/40 p-4 sm:col-span-2'>
      <p className='font-display text-sm uppercase tracking-[0.1em] text-primary'>
        {t(($) => $.connected.rolePreferencesTitle)}
      </p>
      <div className='mt-4 space-y-4'>
        <div>
          <p className='text-xs text-muted-foreground mb-2 uppercase tracking-wider'>First Choice</p>
          <div className='grid grid-cols-4 sm:grid-cols-7 gap-2'>
            {ROLE_OPTIONS.map((role) => (
              <button
                key={`first-${role}`}
                type='button'
                onClick={() => {
                  setFirstRoleDraft(role)
                  if (role === 'FILL') {
                    setSecondRoleDraft('UNSELECTED')
                  } else if (role === secondRoleDraft) {
                    setSecondRoleDraft('UNSELECTED')
                  }
                }}
                className={`flex flex-col items-center justify-center p-2 rounded-lg border transition-all ${
                  firstRoleDraft === role
                    ? 'border-primary bg-primary/20 shadow-[0_0_10px_rgba(200,169,110,0.3)]'
                    : 'border-gold-dim/30 bg-background/60 hover:border-primary/50 hover:bg-background/80'
                }`}
              >
                <span className='text-2xl mb-1'>{ROLE_ICONS[role]}</span>
                <span className='text-[10px] font-semibold uppercase tracking-wider truncate w-full text-center'>
                  {role === 'UTILITY' ? 'SUPPORT' : role}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className='text-xs text-muted-foreground mb-2 uppercase tracking-wider'>Second Choice</p>
          <div className='grid grid-cols-4 sm:grid-cols-7 gap-2'>
            {ROLE_OPTIONS.filter((role) => role !== 'FILL').map((role) => {
              const isDisabled = firstRoleDraft === 'FILL' || role === firstRoleDraft
              const isSelected = firstRoleDraft === 'FILL' ? role === 'UNSELECTED' : secondRoleDraft === role
              
              return (
                <button
                  key={`second-${role}`}
                  type='button'
                  disabled={isDisabled}
                  onClick={() => setSecondRoleDraft(role)}
                  className={`flex flex-col items-center justify-center p-2 rounded-lg border transition-all ${
                    isDisabled
                      ? 'opacity-40 cursor-not-allowed border-gold-dim/10 bg-background/40'
                      : isSelected
                        ? 'border-primary bg-primary/20 shadow-[0_0_10px_rgba(200,169,110,0.3)]'
                        : 'border-gold-dim/30 bg-background/60 hover:border-primary/50 hover:bg-background/80'
                  }`}
                >
                  <span className='text-2xl mb-1'>{ROLE_ICONS[role]}</span>
                  <span className='text-[10px] font-semibold uppercase tracking-wider truncate w-full text-center'>
                    {role === 'UTILITY' ? 'SUPPORT' : role}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      </div>
      <Button
        variant='default'
        className='mt-6 w-full font-display tracking-wider uppercase sm:w-auto'
        disabled={roleUpdatePending}
        onClick={() => {
          void updateRoles()
        }}
        type='button'
      >
        {t(($) => $.connected.roleSave)}
      </Button>
    </div>
  )
}
