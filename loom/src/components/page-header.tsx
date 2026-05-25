import { useTranslation } from 'react-i18next'

import { relayStoreSelectors, useRelayStore } from '@/core/state/relay-store'

import { pageHeaderStyles } from './page-header-styles'
import { getPageHeaderStatusColor, getPageHeaderStatusLabel } from './page-header-utils'

import type { PageHeaderProps } from './page-header-types'

export function PageHeader({ title, subtitle, badges, actions }: PageHeaderProps) {
  const { t } = useTranslation()
  const status = useRelayStore(relayStoreSelectors.status)
  const styles = pageHeaderStyles()

  const statusColor = getPageHeaderStatusColor(status)
  const statusLabel = getPageHeaderStatusLabel(status, t)

  return (
    <header className={styles.root()}>
      <div className={styles.content()}>
        <span className={styles.statusWrap()}>
          <span className={`${styles.statusPing()} ${statusColor}`} />

          <span className={`${styles.statusDot()} ${statusColor}`} />
        </span>

        <div className='flex min-w-0 flex-col'>
          <h2 className={styles.title()}>{title}</h2>

          {subtitle ? <span className={styles.subtitle()}>{subtitle}</span> : null}

          {status !== 'connected' ? <span className={styles.statusLabel()}>{statusLabel}</span> : null}
        </div>
      </div>

      <div className={styles.badges()}>
        {badges?.map((badge) => {
          return (
            <span key={badge.label} className={styles.badge()}>
              {badge.icon}

              {badge.label}
            </span>
          )
        })}

        {actions}
      </div>
    </header>
  )
}
