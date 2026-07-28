import { pageHeaderStyles } from './page-header-styles'

import type { PageHeaderProps } from './page-header-types'

export function PageHeader({ title, subtitle, badges, actions }: PageHeaderProps) {
  const styles = pageHeaderStyles()

  return (
    <header className={styles.root()}>
      <div className={styles.content()}>
        <div className="flex min-w-0 flex-col">
          <h2 className={styles.title()}>{title}</h2>

          {subtitle ? <span className={styles.subtitle()}>{subtitle}</span> : null}
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
