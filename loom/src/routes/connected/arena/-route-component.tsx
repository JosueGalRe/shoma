import { Link } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'

import { PageHeader } from '@/components/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui'
import { useLobby } from '@/features/lobby'
import { getModeRules } from '@/features/modes/mode-engine'

import { arenaStyles } from './-styles'

export function ArenaRouteComponent() {
  const { t } = useTranslation()
  const { viewModel } = useLobby()
  const { members } = viewModel
  const arenaRules = getModeRules('arena')
  const isPartyValid = members.length <= arenaRules.maxPartySize

  return (
    <main className='space-y-4 p-4'>
      <PageHeader title={t('arena.title')} subtitle={t('arena.description')} />

      <Card>
        <CardHeader>
          <CardTitle>{t('arena.title')}</CardTitle>
        </CardHeader>

        <CardContent className='text-muted space-y-3 text-sm'>
          <p>{t('arena.info')}</p>

          <p className={isPartyValid ? 'text-primary' : 'text-destructive'}>
            {t('arena.partySize', { current: members.length, max: arenaRules.maxPartySize })}
          </p>

          <div className='grid gap-2 sm:grid-cols-2'>
            <Link
              className={`${arenaStyles.readyLinkBase} ${isPartyValid ? arenaStyles.readyLinkValid : arenaStyles.readyLinkInvalid}`}
              to='/connected/champ-select'
            >
              {t('arena.ready')}
            </Link>

            <Link className={arenaStyles.lobbyLink} to='/connected/lobby'>
              {t('lobby.title')}
            </Link>
          </div>
        </CardContent>
      </Card>
    </main>
  )
}
