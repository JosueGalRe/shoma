import { useNavigate } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'

import { Badge, Button } from '@/components/ui'
import type { LobbyHeaderProps } from './lobby-header-types'
import { lobbyHeaderStyles } from './lobby-header-styles'

export function LobbyHeader({ isConnected, currentModeLabel }: LobbyHeaderProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const styles = lobbyHeaderStyles()

  return (
    <header className={styles.header()}>
      <div className='flex items-center gap-2'>
        <h2 className={styles.title()}>{t('lobby.title')}</h2>
        {!isConnected ? <span className={styles.subtitle()}>{t('connection.status.connecting')}</span> : null}
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
