import { Link, createFileRoute } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'

import { PageHeader } from '@/components/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui'
import { useLobby } from '@/features/lobby'
import { getModeRules } from '@/features/modes/mode-engine'

function ArenaRouteComponent() {
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
              className={`text-foreground focus-visible:ring-ring inline-flex h-10 items-center justify-center rounded-md px-4 py-2 text-sm font-medium focus-visible:ring-2 focus-visible:outline-none ${isPartyValid ? 'bg-secondary border-primary text-primary hover:bg-secondary border hover:shadow-[0_0_20px_var(--shoma-primary)]' : 'bg-secondary border-border text-muted pointer-events-none opacity-50'}`}
              to='/connected/champ-select'
            >
              {t('arena.ready')}
            </Link>
            <Link
              className='bg-secondary border-border text-foreground hover:bg-secondary focus-visible:ring-ring inline-flex h-10 items-center justify-center rounded-md border px-4 py-2 text-sm font-medium focus-visible:ring-2 focus-visible:outline-none'
              to='/connected/lobby'
            >
              {t('lobby.title')}
            </Link>
          </div>
        </CardContent>
      </Card>
    </main>
  )
}

export const Route = createFileRoute('/connected/arena')({
  component: ArenaRouteComponent,
})
