import { Link, createFileRoute } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui'
import { useLobby } from '@/features/lobby'
import { getModeRules } from '@/features/modes/mode-engine'

function ArenaRouteComponent() {
  const { t } = useTranslation()
  const { members } = useLobby()
  const arenaRules = getModeRules('arena')
  const isPartyValid = members.length <= arenaRules.maxPartySize

  return (
    <main className="space-y-4">
      <section className="space-y-1">
        <h2 className="text-xl font-display font-semibold text-primary">{t('arena.title')}</h2>
        <p className="text-sm text-muted">{t('arena.description')}</p>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>{t('arena.title')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted">
          <p>{t('arena.info')}</p>
          <p className={isPartyValid ? 'text-primary' : 'text-destructive'}>
            {t('arena.partySize', { current: members.length, max: arenaRules.maxPartySize })}
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            <Link className={`inline-flex h-10 items-center justify-center rounded-md px-4 py-2 text-sm font-medium text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${isPartyValid ? 'bg-secondary border border-primary text-primary hover:bg-secondary hover:shadow-[0_0_20px_var(--shoma-primary)]' : 'pointer-events-none bg-secondary border-border text-muted opacity-50'}`} to="/connected/champ-select">
              {t('arena.ready')}
            </Link>
            <Link className="inline-flex h-10 items-center justify-center rounded-md bg-secondary border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" to="/connected/lobby">
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
