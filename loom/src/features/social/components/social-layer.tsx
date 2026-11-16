import { useRef } from 'react'

import { Dialog } from '@base-ui/react/dialog'
import { Icon } from '@shoma/ui/icon'
import { IconButton } from '@shoma/ui/icon-button'
import { ScreenBackground } from '@shoma/ui/screen-background'
import { color } from '@shoma/ui/tokens/color.stylex'
import { create, props } from '@stylexjs/stylex'

import type { SocialLayerProps } from '../social-types'

// A screen that slides in over the current one, so Social and its chats open from any screen without leaving it
export function SocialLayer({
  actions,
  backLabel,
  children,
  leading,
  onOpenChange,
  open,
  title,
  titleStyle,
}: SocialLayerProps) {
  const popupRef = useRef<HTMLDivElement>(null)

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Popup
          ref={popupRef}
          className={(state) => {
            return props(styles.popup, state.transitionStatus !== undefined && styles.offscreen).className
          }}
          // Keyboard users land on the back button; a tap or click focuses the panel, without a ring on the arrow
          initialFocus={(openType) => {
            return openType === 'keyboard' ? true : popupRef.current
          }}
        >
          <ScreenBackground />

          <header {...props(styles.header)}>
            <Dialog.Close
              render={
                <IconButton aria-label={backLabel}>
                  <Icon name="arrow-left" />
                </IconButton>
              }
            />

            {leading}

            <Dialog.Title {...props(titleStyle, styles.title)}>{title}</Dialog.Title>

            {actions ? <div {...props(styles.actions)}>{actions}</div> : null}
          </header>

          {children}
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

const styles = create({
  actions: {
    display: 'flex',
    gap: 8,
    marginInlineStart: 'auto',
  },
  // Figma "Title": 40px back button, 8 to the title, the actions at the end
  header: {
    alignItems: 'center',
    display: 'flex',
    flexShrink: 0,
    gap: 8,
    paddingBlock: 16,
    paddingInline: 24,
  },
  // Off the viewport's edge, not the column's: a wide window would otherwise show it beside the app before it slides in
  offscreen: {
    transform: 'translateX(100vw)',
  },
  // The app's 480px column, as AppShell draws it
  popup: {
    backgroundColor: color.background,
    boxSizing: 'border-box',
    color: color.text,
    display: 'flex',
    flexDirection: 'column',
    inset: 0,
    marginInline: 'auto',
    maxWidth: 480,
    outlineStyle: 'none',
    paddingBottom: 'env(safe-area-inset-bottom)',
    paddingLeft: 'env(safe-area-inset-left)',
    paddingRight: 'env(safe-area-inset-right)',
    paddingTop: 'env(safe-area-inset-top)',
    position: 'fixed',
    transitionDuration: { '@media (prefers-reduced-motion: reduce)': '0s', default: '350ms' },
    transitionProperty: 'transform',
    transitionTimingFunction: 'cubic-bezier(0.32, 0.72, 0, 1)',
    zIndex: 30,
  },
  title: {
    margin: 0,
    minWidth: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
})
