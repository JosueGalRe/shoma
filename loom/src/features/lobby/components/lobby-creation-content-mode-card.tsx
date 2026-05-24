import { useTranslation } from 'react-i18next'

import { AnimatedModeIcon } from '@/components/animated-mode-icon'
import { Alert, AlertDescription } from '@/components/ui'

import { LobbyCreationContentQueueButton } from './lobby-creation-content-queue-button'
import { lobbyCreationContentStyles } from './lobby-creation-content-styles'
import type { LobbyCreationModeCardProps } from './lobby-creation-content-types'

export function LobbyCreationContentModeCard({
  mode,
  isExpanded,
  onToggle,
  onCreateLobby,
  selectedQueueId,
  pendingQueueId,
  isCreatingLobby,
  hasCreateError,
}: LobbyCreationModeCardProps) {
  const { t } = useTranslation()

  return (
    <div className={lobbyCreationContentStyles.modeCard({ expanded: isExpanded })}>
      {isExpanded && <div className={lobbyCreationContentStyles.modeCardAccent} />}

      <button type='button' onClick={onToggle} className={lobbyCreationContentStyles.modeToggle}>
        <div className={lobbyCreationContentStyles.modeMeta}>
          <div className={lobbyCreationContentStyles.modeIconWrapper({ expanded: isExpanded })}>
            <AnimatedModeIcon mode={mode} isExpanded={isExpanded} />
          </div>
          <div className='flex min-w-0 flex-col items-start'>
            <span className={lobbyCreationContentStyles.modeTitle({ expanded: isExpanded })}>{t(mode.nameKey)}</span>
            <span className={lobbyCreationContentStyles.modeDescription}>{t(mode.descriptionKey)}</span>
          </div>
        </div>

        <div className={lobbyCreationContentStyles.chevron({ expanded: isExpanded })}>
          <svg
            viewBox='0 0 24 24'
            fill='none'
            stroke='currentColor'
            strokeWidth='2'
            strokeLinecap='round'
            strokeLinejoin='round'
            className={lobbyCreationContentStyles.chevronIcon}
          >
            <polyline points='6 9 12 15 18 9'></polyline>
          </svg>
        </div>
      </button>

      <div className={lobbyCreationContentStyles.queueContainer}>
        <div className={lobbyCreationContentStyles.queueBody}>
          <div className={lobbyCreationContentStyles.queueList}>
            {mode.queues.map((queue, index) => {
              const isQueueSelected = selectedQueueId === queue.id
              const isQueuePending = pendingQueueId === queue.id

              return (
                <LobbyCreationContentQueueButton
                  key={queue.id}
                  queueId={queue.id}
                  description={queue.description}
                  index={index}
                  isExpanded={isExpanded}
                  isSelected={isQueueSelected}
                  isPending={isQueuePending}
                  isDisabled={isCreatingLobby}
                  onCreateLobby={onCreateLobby}
                />
              )
            })}

            {hasCreateError && (
              <Alert variant='destructive' className={lobbyCreationContentStyles.queueError}>
                <AlertDescription>{t('createLobby.createError')}</AlertDescription>
              </Alert>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
