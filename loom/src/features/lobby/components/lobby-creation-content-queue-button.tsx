import { Spinner } from '@/components/ui'

import { lobbyCreationContentStyles } from './lobby-creation-content-styles'
import type { LobbyCreationQueueButtonProps } from './lobby-creation-content-types'

export function LobbyCreationContentQueueButton({
  queueId,
  description,
  index,
  variant,
  onCreateLobby,
}: LobbyCreationQueueButtonProps) {
  const isDisabled = variant === 'disabled' || variant === 'pending'
  const labelVariant = variant === 'selected' || variant === 'pending' ? variant : undefined

  return (
    <button
      type='button'
      onClick={() => {
        return onCreateLobby(queueId)
      }}
      disabled={isDisabled}
      style={{ transitionDelay: variant === 'default' ? '0ms' : `${index * 40}ms` }}
      className={lobbyCreationContentStyles.queueItem({ variant })}
    >
      <div className={lobbyCreationContentStyles.queueStatus({ variant })}>
        {variant === 'pending' ? (
          <Spinner className='size-3' />
        ) : (
          <svg viewBox='0 0 24 24' fill='currentColor' className={lobbyCreationContentStyles.queueIcon}>
            <rect x='4' y='4' width='16' height='16' />
          </svg>
        )}
      </div>
      <span className={lobbyCreationContentStyles.queueLabel({ variant: labelVariant })}>{description}</span>
    </button>
  )
}
