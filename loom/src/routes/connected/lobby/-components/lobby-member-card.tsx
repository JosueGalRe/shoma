import type { LobbyMember } from '@/features/lobby/lobby-store'

import { lobbyStyles } from '../-styles'
import { MemberRuneIcon } from './member-rune-icon'

export function LobbyMemberCard({ member, showSecondaryRole }: { member: LobbyMember; showSecondaryRole: boolean }) {
  return (
    <div className='flex flex-col items-center gap-2'>
      <div className='relative'>
        <div className={lobbyStyles.memberAvatarContainer}>
          <img alt={member.displayName} className='h-full w-full object-cover' src={member.iconUrl ?? undefined} />
        </div>
      </div>
      <div className='flex flex-col items-center gap-1'>
        <span className='max-w-full truncate px-1 text-center text-xs font-medium text-[rgb(200,170,110)]'>
          {member.displayName}
        </span>
        <div className='flex items-center gap-1'>
          {member.firstPositionPreference !== 'UNSELECTED' && <MemberRuneIcon role={member.firstPositionPreference} />}
          {showSecondaryRole &&
            member.secondPositionPreference !== 'UNSELECTED' &&
            member.firstPositionPreference !== 'FILL' && <MemberRuneIcon role={member.secondPositionPreference} />}
        </div>
      </div>
    </div>
  )
}
