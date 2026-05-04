import { createFileRoute } from '@tanstack/react-router'
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
        <h2 className="text-xl font-bold text-white">{t('arena.title')}</h2>
        <p className="text-sm text-gray-400">{t('arena.description')}</p>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>{t('arena.title')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-gray-300">
          <p>{t('arena.info')}</p>
          <p className={isPartyValid ? 'text-green-400' : 'text-red-300'}>
            {t('arena.partySize', { current: members.length, max: arenaRules.maxPartySize })}
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            <a className={`inline-flex h-10 items-center justify-center rounded-md px-4 py-2 text-sm font-medium text-white ${isPartyValid ? 'bg-blue-600 hover:bg-blue-700' : 'pointer-events-none bg-gray-700 opacity-50'}`} href="/connected/champ-select">
              {t('arena.ready')}
            </a>
            <a className="inline-flex h-10 items-center justify-center rounded-md bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground hover:bg-secondary/80" href="/connected/lobby">
              {t('lobby.title')}
            </a>
          </div>
        </CardContent>
      </Card>
    </main>
  )
}

export const Route = createFileRoute('/connected/arena')({
  component: ArenaRouteComponent,
})
