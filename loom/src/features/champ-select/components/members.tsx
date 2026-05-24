import { useTranslation } from 'react-i18next'

import type { ChampSelectMembersProps } from './members-types'
import { TeamPanel } from './team-panel'

export function ChampSelectMembers({ team, enemyTeam }: ChampSelectMembersProps) {
  const { t } = useTranslation()

  return (
    <section className='grid gap-4 md:grid-cols-2'>
      <TeamPanel
        championLabel={t('champSelect.champion')}
        emptyLabel={t('champSelect.noPlayersYet')}
        members={team}
        title={t('champSelect.allyTeam')}
      />
      <TeamPanel
        championLabel={t('champSelect.champion')}
        emptyLabel={t('champSelect.noPlayersYet')}
        members={enemyTeam}
        title={t('champSelect.enemyTeam')}
      />
    </section>
  )
}
