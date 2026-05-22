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
    <header className='border-border/50 flex h-[50px] shrink-0 items-center justify-between border-b px-4'>
      <div className='flex items-center gap-2'>
        <h2 className='font-display text-primary text-lg tracking-wider'>{t('lobby.title')}</h2>
        {!isConnected ? <span className='text-accent text-[10px]'>{t('connection.status.connecting')}</span> : null}
      </div>
      <div className='flex items-center gap-2'>
        <Badge variant='outline' className='rounded-full px-2 py-0.5 text-[10px] tracking-[0.15em] uppercase'>
          {currentModeLabel}
        </Badge>
        <Button onClick={() => void navigate({ to: '/connected/create-lobby' })} size='sm' variant='secondary'>
          {t('lobby.changeMode')}
        </Button>
      </div>
    </header>
  )
}
