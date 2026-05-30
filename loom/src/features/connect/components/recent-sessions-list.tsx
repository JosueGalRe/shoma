import { useTranslation } from 'react-i18next'

import { recentSessionsListStyles } from './recent-sessions-list-styles'

import type { RecentSessionsListProps } from './recent-sessions-list-types'

export function RecentSessionsList({ onReconnect, sessions }: RecentSessionsListProps) {
  const { t } = useTranslation()
  const styles = recentSessionsListStyles()

  if (!sessions || sessions.length === 0) {
    return null
  }

  return (
    <div className={styles.root()}>
      <h2 className={styles.header()}>{t('connection.recentSessions', 'Recent Sessions')}</h2>

      <div className={styles.list()}>
        {sessions.map((code) => {
          return (
            <button
              key={code}
              className={styles.item()}
              onClick={() => {
                onReconnect(code)
              }}
              type="button"
            >
              <span className={styles.code()}>{code}</span>

              <span className={styles.reconnectLabel()}>{t('connection.reconnect', 'Reconnect')}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
