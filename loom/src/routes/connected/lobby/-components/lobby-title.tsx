import { text } from '@shoma/ui/text'
import { color } from '@shoma/ui/tokens/color.stylex'
import { create, props } from '@stylexjs/stylex'
import { useTranslation } from 'react-i18next'

import type { LobbyTitleProps } from './lobby-screen-types'

// Figma lobby "Title": the mode's icon and the queue's name, one line under the top bar
export function LobbyTitle({ iconUrl, label, onChangeMode }: LobbyTitleProps) {
  const { t } = useTranslation()
  const content = (
    <>
      {iconUrl ? <img alt="" draggable={false} src={iconUrl} {...props(styles.icon)} /> : null}

      <span aria-hidden {...props(styles.dot)} />

      <span {...props(text.heading1, styles.label)}>{label}</span>
    </>
  )

  if (!onChangeMode) {
    return <h1 {...props(styles.content, styles.row)}>{content}</h1>
  }

  return (
    <h1 {...props(styles.content, styles.row)}>
      <button
        aria-label={`${label}, ${t('lobby.changeMode')}`}
        type="button"
        {...props(styles.content, styles.button)}
        onClick={onChangeMode}
      >
        {content}
      </button>
    </h1>
  )
}

const styles = create({
  button: {
    WebkitTapHighlightColor: 'transparent',
    backgroundColor: 'transparent',
    borderWidth: 0,
    color: 'inherit',
    cursor: 'pointer',
    flexGrow: 1,
    margin: 0,
    opacity: { ':active': 0.7, default: 1 },
    outlineColor: color.focusRing,
    outlineOffset: 2,
    outlineStyle: { ':focus-visible': 'solid', default: 'none' },
    outlineWidth: 2,
    padding: 0,
    textAlign: 'start',
    touchAction: 'manipulation',
    transitionDuration: '150ms',
    transitionProperty: 'opacity',
  },
  content: {
    alignItems: 'center',
    display: 'flex',
    gap: 8,
    minWidth: 0,
  },
  dot: {
    backgroundColor: 'currentColor',
    borderRadius: '50%',
    flexShrink: 0,
    height: 4,
    width: 4,
  },
  icon: {
    flexShrink: 0,
    height: 40,
    objectFit: 'contain',
    width: 40,
  },
  label: {
    minWidth: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  row: {
    color: color.text,
    flexShrink: 0,
    margin: 0,
    paddingInline: 24,
  },
})
