import { useNavigate } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { Badge, Button } from '@/components/ui'

interface LobbyHeaderProps {
  isConnected: boolean
  currentModeLabel: string
}

export function LobbyHeader({ isConnected, currentModeLabel }: LobbyHeaderProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()

  return (
    <header className="shrink-0 flex items-center justify-between px-4 h-[50px] border-b border-border/50">
      <div className="flex items-center gap-2">
        <h2 className="font-display text-lg tracking-wider text-primary">{t('lobby.title')}</h2>
        {!isConnected ? (
          <span className="text-[10px] text-accent">{t('connection.status.connecting')}</span>
        ) : null}
      </div>
      <div className="flex items-center gap-2">
        <Badge variant="outline" className="rounded-full px-2 py-0.5 text-[10px] uppercase tracking-[0.15em]">
          {currentModeLabel}
        </Badge>
        <Button
          onClick={() => void navigate({ to: '/connected/create-lobby' })}
          size="sm"
          variant="secondary"
        >
          {t('lobby.changeMode')}
        </Button>
      </div>
    </header>
  )
}
