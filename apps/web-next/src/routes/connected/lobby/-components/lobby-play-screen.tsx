import { useNavigate } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { Award, Flame, Settings, Sword, Trophy, Zap } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui'
import type { GameQueue } from '@/core/lcu/parsers/game-queues'

export type MappedQueueList = Record<string, GameQueue[]>

function ModeIcon({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`flex h-14 w-14 items-center justify-center rounded-xl border border-lol-border-gold/40 bg-gradient-to-br from-lol-navy-800 to-lol-navy-950 shadow-lol-glow-gold ${className ?? ''}`}>
      {children}
    </div>
  )
}

function getGroupDetails(section: string, t: (key: string, options?: Record<string, unknown>) => string) {
  const [mapId, gameMode] = section.split('-')
  if (mapId === '11' && gameMode === 'CLASSIC') {
    return {
      title: t('lobby.modes.sr'),
      description: t('lobby.modes.srDesc'),
      icon: <ModeIcon><Sword className="size-7 text-lol-gold" /></ModeIcon>,
    }
  }
  if (mapId === '12' && gameMode === 'ARAM') {
    return {
      title: t('lobby.modes.aram'),
      description: t('lobby.modes.aramDesc'),
      icon: <ModeIcon><Zap className="size-7 text-lol-gold" /></ModeIcon>,
    }
  }
  if (mapId === '22' && gameMode === 'TFT') {
    return {
      title: t('lobby.modes.tft'),
      description: t('lobby.modes.tftDesc'),
      icon: <ModeIcon><Trophy className="size-7 text-lol-gold" /></ModeIcon>,
    }
  }
  if (gameMode === 'CHERRY') {
    return {
      title: t('lobby.modes.arena'),
      description: t('lobby.modes.arenaDesc'),
      icon: <ModeIcon><Flame className="size-7 text-lol-gold" /></ModeIcon>,
    }
  }
  return {
    title: t(`modes.${gameMode.toLowerCase()}`, { defaultValue: gameMode }),
    description: '',
    icon: <ModeIcon><Flame className="size-7 text-lol-gold" /></ModeIcon>,
  }
}

interface LobbyPlayScreenProps {
  isPlayScreenLoading: boolean
  createLobbyError: string | null
  sections: string[]
  availableQueues: MappedQueueList
  isCreateLobbyPending: boolean
  handleCreateLobby: (queueId: number) => Promise<void>
}

export function LobbyPlayScreen({
  isPlayScreenLoading,
  createLobbyError,
  sections,
  availableQueues,
  isCreateLobbyPending,
  handleCreateLobby,
}: LobbyPlayScreenProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()

  return (
    <main className="space-y-6">
      <section className="space-y-2">
        <h2 className="font-display text-3xl tracking-wider text-lol-gold">{t('lobby.playTitle')}</h2>
        <p className="text-sm text-lol-text-muted">{t('lobby.playSubtitle')}</p>
      </section>

      {isPlayScreenLoading ? (
        <p className="text-sm text-lol-text-muted">{t('lobby.loading')}</p>
      ) : (
        <>
          {createLobbyError ? (
            <Card className="border-red-700 bg-red-950/40" aria-live="polite">
              <CardHeader>
                <CardTitle>{t('errors.generic')}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-red-200">
                {t(createLobbyError, { defaultValue: createLobbyError })}
              </CardContent>
            </Card>
          ) : null}

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {sections.map((section) => {
              const queues = availableQueues[section]
              const details = getGroupDetails(section, t)

              return (
                <Card key={section} className="flex flex-col overflow-hidden border-lol-border-subtle bg-lol-navy-900/60 transition-colors hover:border-lol-border-gold hover:shadow-lol-glow-gold">
                  <div className="flex items-start gap-4 border-b border-lol-border-subtle/50 bg-lol-navy-900/80 p-5">
                    <div className="shrink-0">
                      {details.icon}
                    </div>
                    <div className="min-w-0 flex-1 space-y-1">
                      <h3 className="font-display text-xl tracking-wider text-lol-gold">{details.title}</h3>
                      {details.description ? <p className="text-sm text-lol-text-muted">{details.description}</p> : null}
                    </div>
                  </div>
                  <div className="flex flex-col p-2">
                    {queues.map((queue) => (
                      <button
                        key={queue.id}
                        type="button"
                        disabled={isCreateLobbyPending}
                        onClick={() => void handleCreateLobby(queue.id)}
                        className="group flex items-center gap-3 rounded-md p-3 text-left transition-colors hover:bg-lol-navy-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lol-border-gold disabled:opacity-60"
                      >
                        <div className="size-2 shrink-0 rotate-45 border border-lol-gold transition-colors group-hover:bg-lol-gold" />
                        <span className="font-medium text-lol-text-primary transition-colors group-hover:text-lol-gold">
                          {queue.description}
                        </span>
                      </button>
                    ))}
                  </div>
                </Card>
              )
            })}

            <Card className="flex flex-col overflow-hidden border-lol-border-subtle bg-lol-navy-900/60 transition-colors hover:border-lol-border-gold hover:shadow-lol-glow-gold">
            <div className="flex items-start gap-4 border-b border-lol-border-subtle/50 bg-lol-navy-900/80 p-5">
              <div className="shrink-0">
                <ModeIcon><Settings className="size-7 text-lol-gold" /></ModeIcon>
              </div>
              <div className="min-w-0 flex-1 space-y-1">
                <h3 className="font-display text-xl tracking-wider text-lol-gold">{t('lobby.modes.custom')}</h3>
                <p className="text-sm text-lol-text-muted">{t('lobby.modes.customDesc')}</p>
              </div>
            </div>
            <div className="flex flex-col p-2">
              <button
                type="button"
                onClick={() => void navigate({ to: '/connected/custom' })}
                className="group flex items-center gap-3 rounded-md p-3 text-left transition-colors hover:bg-lol-navy-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lol-border-gold"
              >
                <div className="size-2 shrink-0 rotate-45 border border-lol-gold transition-colors group-hover:bg-lol-gold" />
                <span className="font-medium text-lol-text-primary transition-colors group-hover:text-lol-gold">
                  {t('lobby.open')}
                </span>
              </button>
            </div>
            </Card>

            <Card className="flex flex-col overflow-hidden border-lol-border-subtle bg-lol-navy-900/60 transition-colors hover:border-lol-border-gold hover:shadow-lol-glow-gold">
            <div className="flex items-start gap-4 border-b border-lol-border-subtle/50 bg-lol-navy-900/80 p-5">
              <div className="shrink-0">
                <ModeIcon><Award className="size-7 text-lol-gold" /></ModeIcon>
              </div>
              <div className="min-w-0 flex-1 space-y-1">
                <h3 className="font-display text-xl tracking-wider text-lol-gold">{t('lobby.modes.clash')}</h3>
                <p className="text-sm text-lol-text-muted">{t('lobby.modes.clashDesc')}</p>
              </div>
            </div>
            <div className="flex flex-col p-2">
              <button
                type="button"
                onClick={() => void navigate({ to: '/connected/clash' })}
                className="group flex items-center gap-3 rounded-md p-3 text-left transition-colors hover:bg-lol-navy-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lol-border-gold"
              >
                <div className="size-2 shrink-0 rotate-45 border border-lol-gold transition-colors group-hover:bg-lol-gold" />
                <span className="font-medium text-lol-text-primary transition-colors group-hover:text-lol-gold">
                  {t('lobby.open')}
                </span>
              </button>
            </div>
            </Card>
          </div>
        </>
      )}
    </main>
  )
}
