import { useTranslation } from 'react-i18next'

import { lobbyCreationContentStyles } from './lobby-creation-content-styles'
import type { LobbyCreationHeaderProps } from './lobby-creation-content-types'

export function LobbyCreationContentHeader({ showBackToLobby, onBackToLobby }: LobbyCreationHeaderProps) {
  const { t } = useTranslation()

  return (
    <div className={lobbyCreationContentStyles.headerWrap}>
      <div className={lobbyCreationContentStyles.headerRow}>
        {showBackToLobby && onBackToLobby && (
          <button
            type='button'
            onClick={onBackToLobby}
            className={lobbyCreationContentStyles.backButton()}
            aria-label={t('common.back', 'Back')}
          >
            <svg viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2.5' strokeLinecap='round' strokeLinejoin='round' className={lobbyCreationContentStyles.backIcon}>
              <path d='M19 12H5M12 19l-7-7 7-7' />
            </svg>
          </button>
        )}
        <div className={lobbyCreationContentStyles.titleWrap}>
          <h1 className={lobbyCreationContentStyles.title}>{t('createLobby.title', 'SELECT MODE')}</h1>
          <div className={lobbyCreationContentStyles.titleDivider} />
        </div>
      </div>
    </div>
  )
}
