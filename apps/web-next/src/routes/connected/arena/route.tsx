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
        <h2 className="text-xl font-display font-bold text-lol-gold">{t('arena.title')}</h2>
        <p className="text-sm text-lol-text-muted">{t('arena.description')}</p>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>{t('arena.title')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-lol-text-secondary">
          <p>{t('arena.info')}</p>
          <p className={isPartyValid ? 'text-green-400' : 'text-red-300'}>
            {t('arena.partySize', { current: members.length, max: arenaRules.maxPartySize })}
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            <Link className={`inline-flex h-10 items-center justify-center rounded-md px-4 py-2 text-sm font-medium text-lol-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lol-border-gold ${isPartyValid ? 'bg-lol-navy-800 border border-lol-border-gold text-lol-gold hover:bg-lol-navy-700 hover:shadow-lol-glow-gold' : 'pointer-events-none bg-lol-navy-900 border-lol-border-navy text-lol-text-muted opacity-50'}`} to="/connected/champ-select">
              {t('arena.ready')}
            </Link>
            <Link className="inline-flex h-10 items-center justify-center rounded-md bg-lol-navy-800 border border-lol-border-subtle px-4 py-2 text-sm font-medium text-lol-text-primary hover:bg-lol-navy-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lol-border-gold" to="/connected/lobby">
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
