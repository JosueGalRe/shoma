import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import type { LobbyDetails } from '@core/rift/rift-lcu-types'
import type { LobbyMemberSnapshot } from '../-lobby-types'
import { ROLE_OPTIONS } from '../-lobby-runes'

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
    <div className='rounded-xl border border-[#785a28]/30 bg-[#010a13]/40 p-4 sm:col-span-2'>
      <p className='font-display text-sm uppercase tracking-[0.1em] text-[#c8a96e]'>
        {t(($) => $.connected.rolePreferencesTitle)}
      </p>
      <div className='mt-3 grid gap-3 sm:grid-cols-2'>
        <select
          className='h-10 rounded-md border border-[#785a28]/50 bg-[#010a13]/60 px-3 text-sm text-[#f0e6d2] outline-none focus:border-[#c8a96e]'
          onChange={(event) => {
            const nextValue = event.target.value
            setFirstRoleDraft(nextValue)
            if (nextValue === 'FILL') {
              setSecondRoleDraft('UNSELECTED')
            } else if (nextValue === secondRoleDraft) {
              setSecondRoleDraft('UNSELECTED')
            }
          }}
          value={firstRoleDraft}
        >
          {ROLE_OPTIONS.map((role) => (
            <option key={role} value={role} className='bg-[#010a13] text-[#f0e6d2]'>
              {role}
            </option>
          ))}
        </select>

        <select
          className='h-10 rounded-md border border-[#785a28]/50 bg-[#010a13]/60 px-3 text-sm text-[#f0e6d2] outline-none focus:border-[#c8a96e] disabled:opacity-50'
          disabled={firstRoleDraft === 'FILL'}
          onChange={(event) => {
            setSecondRoleDraft(event.target.value)
          }}
          value={firstRoleDraft === 'FILL' ? 'UNSELECTED' : secondRoleDraft}
        >
          {ROLE_OPTIONS.filter((role) => role !== 'FILL').map((role) => (
            <option key={role} value={role} className='bg-[#010a13] text-[#f0e6d2]'>
              {role}
            </option>
          ))}
        </select>
      </div>
      <Button
        variant='default'
        className='mt-4 w-full font-display tracking-wider uppercase sm:w-auto'
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
