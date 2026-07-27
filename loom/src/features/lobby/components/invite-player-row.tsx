import { inviteOverlayStyles } from './invite-overlay-styles'

import type { InvitePlayerRowProps } from './invite-player-row-types'

export function InvitePlayerRow({ disabled, icon, name, onToggle, selected }: InvitePlayerRowProps) {
  const styles = inviteOverlayStyles()

  return (
    <button
      type="button"
      aria-pressed={selected}
      className={styles.friendItem({ selected })}
      disabled={disabled}
      onClick={onToggle}
    >
      <span className={styles.friendCheckbox({ selected })} aria-hidden="true" />

      {icon}

      <span className={styles.suggestionName()}>{name}</span>
    </button>
  )
}
