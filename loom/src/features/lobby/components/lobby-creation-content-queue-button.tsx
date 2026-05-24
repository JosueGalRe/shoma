import { Spinner } from '@/components/ui'

import { lobbyCreationContentStyles } from './lobby-creation-content-styles'
import type { LobbyCreationQueueButtonProps } from './lobby-creation-content-types'

export function LobbyCreationContentQueueButton({
  queueId,
  description,
  index,
  isExpanded,
  isSelected,
  isPending,
  isDisabled,
  onCreateLobby,
}: LobbyCreationQueueButtonProps) {
  const isActive = isSelected || isPending

  return (
    <button
      type='button'
      onClick={() => {return onCreateLobby(queueId)}}
      disabled={isDisabled}
      style={{ transitionDelay: isExpanded ? `${index * 40}ms` : '0ms' }}
      className={lobbyCreationContentStyles.queueItem({ expanded: isExpanded, active: isActive })}
    >
      <div className={lobbyCreationContentStyles.queueStatus({ active: isActive })}>
        {isPending ? (
          <Spinner className='size-3' />
        ) : (
          <svg viewBox='0 0 24 24' fill='currentColor' className={lobbyCreationContentStyles.queueIcon}>
            <rect x='4' y='4' width='16' height='16' />
          </svg>
        )}
      </div>
      <span className={lobbyCreationContentStyles.queueLabel({ active: isActive })}>{description}</span>
    </button>
  )
}
