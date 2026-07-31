import { useTranslation } from 'react-i18next'

import { recentSessionsListStyles } from './recent-sessions-list-styles'

import type { RecentSessionsListProps } from './recent-sessions-list-types'

export function RecentSessionsList({ onReconnect, onRemove, sessions }: RecentSessionsListProps) {
  const { t } = useTranslation()
  const styles = recentSessionsListStyles()

  if (!sessions || sessions.length === 0) {
    return null
  }

  return (
    <div className={styles.root()}>
      <h2 className={styles.header()}>{t('connection.recentSessions', 'Recent Sessions')}</h2>

      <div className={styles.list()}>
        {sessions.map((session) => {
          return (
            <div key={session.code} className={styles.item()}>
              <button
                className={styles.reconnectButton()}
                onClick={() => {
                  onReconnect(session.code)
                }}
                type="button"
              >
                <span className={styles.itemText()}>
                  <span className={styles.deviceName()}>{session.deviceName ?? session.code}</span>

                  {session.deviceName ? <span className={styles.code()}>{session.code}</span> : null}
                </span>

                <span className={styles.reconnectLabel()}>{t('connection.reconnect', 'Reconnect')}</span>
              </button>

              <button
                aria-label={t('connection.removeRecentSession', 'Remove session')}
                className={styles.removeButton()}
                onClick={() => {
                  onRemove(session.code)
                }}
                type="button"
              >
                ×
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
