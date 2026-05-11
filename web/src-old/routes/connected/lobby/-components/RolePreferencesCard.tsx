import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import type { LobbyDetails } from '@core/rift/rift-lcu-types'
import type { LobbyMemberSnapshot } from '../-lobby-types'
import { ROLE_OPTIONS } from '../-lobby-runes'
import { formatRolePair } from '../-lobby-utils'

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
  const [isOpen, setIsOpen] = useState(false)

  if (!lobbyDetails?.showPositionSelector || !localLobbyMember) {
    return null
  }

  const handleSave = async () => {
    await updateRoles()
    setIsOpen(false)
  }

  return (
    <div className='sm:col-span-2'>
      <Button
        variant='outline'
        className='w-full h-16 flex justify-between items-center px-6 border-gold-dim/30 bg-background/40 hover:bg-background/60 hover:border-primary/50 transition-all rounded-xl'
        onClick={() => setIsOpen(true)}
      >
        <span className='font-display text-sm uppercase tracking-[0.1em] text-primary'>
          {t(($) => $.connected.rolePreferencesTitle)}
        </span>
        <div className='flex items-center gap-3'>
          <span className='text-lg font-semibold text-foreground'>
            {formatRolePair(
              localLobbyMember.firstPositionPreference,
              localLobbyMember.secondPositionPreference,
              t(($) => $.connected.roleFill),
              t(($) => $.connected.roleUnset),
            )}
          </span>
          <span className='text-muted-foreground'>›</span>
        </div>
      </Button>

      {isOpen && (
        <div className='fixed inset-0 z-50 flex flex-col justify-end bg-black/80 backdrop-blur-sm animate-in fade-in duration-200'>
          <div className='absolute inset-0' onClick={() => setIsOpen(false)} />
          <div className='relative bg-card border-t border-gold-dim/30 rounded-t-3xl p-6 pb-safe animate-in slide-in-from-bottom-full duration-300'>
            <div className='w-12 h-1.5 bg-muted rounded-full mx-auto mb-6' />
            
            <h2 className='font-display text-xl text-primary uppercase tracking-widest text-center mb-8'>
              {t(($) => $.connected.rolePreferencesTitle)}
            </h2>

            <div className='space-y-8'>
              <div>
                <p className='text-sm text-muted-foreground mb-3 uppercase tracking-wider font-semibold'>First Choice</p>
                <div className='grid grid-cols-4 sm:grid-cols-7 gap-3'>
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
                      className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all min-h-[80px] ${
                        firstRoleDraft === role
                          ? 'border-primary bg-primary/10 shadow-[0_0_15px_rgba(10,200,185,0.2)]'
                          : 'border-border bg-background/50 hover:border-primary/50'
                      }`}
                    >
                      <span className='text-3xl mb-2'>{ROLE_ICONS[role]}</span>
                      <span className='text-[10px] font-bold uppercase tracking-wider truncate w-full text-center'>
                        {role === 'UTILITY' ? 'SUPPORT' : role}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className='text-sm text-muted-foreground mb-3 uppercase tracking-wider font-semibold'>Second Choice</p>
                <div className='grid grid-cols-4 sm:grid-cols-7 gap-3'>
                  {ROLE_OPTIONS.filter((role) => role !== 'FILL').map((role) => {
                    const isDisabled = firstRoleDraft === 'FILL' || role === firstRoleDraft
                    const isSelected = firstRoleDraft === 'FILL' ? role === 'UNSELECTED' : secondRoleDraft === role
                    
                    return (
                      <button
                        key={`second-${role}`}
                        type='button'
                        disabled={isDisabled}
                        onClick={() => setSecondRoleDraft(role)}
                        className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all min-h-[80px] ${
                          isDisabled
                            ? 'opacity-30 cursor-not-allowed border-border bg-background/30'
                            : isSelected
                              ? 'border-secondary bg-secondary/10 shadow-[0_0_15px_rgba(200,170,110,0.2)]'
                              : 'border-border bg-background/50 hover:border-secondary/50'
                        }`}
                      >
                        <span className='text-3xl mb-2'>{ROLE_ICONS[role]}</span>
                        <span className='text-[10px] font-bold uppercase tracking-wider truncate w-full text-center'>
                          {role === 'UTILITY' ? 'SUPPORT' : role}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>

            <div className='mt-10 flex gap-4'>
              <Button
                variant='outline'
                className='flex-1 h-14 font-display tracking-widest uppercase rounded-xl'
                onClick={() => setIsOpen(false)}
                type='button'
              >
                Cancel
              </Button>
              <Button
                variant='default'
                className='flex-1 h-14 font-display tracking-widest uppercase bg-gradient-to-r from-primary to-teal-dim hover:from-teal hover:to-primary rounded-xl'
                disabled={roleUpdatePending}
                onClick={() => {
                  void handleSave()
                }}
                type='button'
              >
                {t(($) => $.connected.roleSave)}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
