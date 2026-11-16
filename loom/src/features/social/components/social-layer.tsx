import { createContext, type RefObject, useContext, useRef } from 'react'

import { Dialog } from '@base-ui/react/dialog'
import { Icon } from '@shoma/ui/icon'
import { IconButton } from '@shoma/ui/icon-button'
import { OverlayContainer } from '@shoma/ui/overlay-container'
import { ScreenBackground } from '@shoma/ui/screen-background'
import { text } from '@shoma/ui/text'
import { color } from '@shoma/ui/tokens/color.stylex'
import { create, props } from '@stylexjs/stylex'

import type { SocialLayerProps } from '../social-types'

// The layer a nested one (a chat over Social) opened in, which takes the focus back when it closes
const ParentPopup = createContext<RefObject<HTMLDivElement | null> | null>(null)

// A screen that slides in over the current one, so Social and its chats open from any screen without leaving it. In a
// Wide window it docks in the panel beside the screens instead, without blocking them
export function SocialLayer({
  actions,
  backLabel,
  children,
  leading,
  onOpenChange,
  open,
  panel = null,
  pinned = false,
  subtitle,
  title,
  titleStyle,
  wide = false,
}: SocialLayerProps) {
  const popupRef = useRef<HTMLDivElement>(null)
  const parentPopup = useContext(ParentPopup)
  const docked = panel !== null
  // Pinned, it never slides: it's there from the start
  const slides = !pinned

  return (
    // Docking or undocking starts it over: a popup sliding out of the removed panel never finishes leaving
    <Dialog.Root
      key={docked ? 'docked' : 'over'}
      disablePointerDismissal={docked}
      modal={!docked}
      open={open}
      onOpenChange={onOpenChange}
    >
      <Dialog.Portal container={panel ?? undefined}>
        <Dialog.Popup
          ref={popupRef}
          className={(state) => {
            return props(
              styles.popup,
              wide && styles.wide,
              docked && styles.docked,
              slides && state.transitionStatus !== undefined && (docked ? styles.dockedOffscreen : styles.offscreen),
            ).className
          }}
          // Focus moves the default way for the keyboard only: after a tap or click, Chrome would ring the back arrow on
          // Opening and the button that opened it on closing. A tap leaves it in the layer underneath instead, ringless
          finalFocus={(closeType) => {
            return closeType === 'keyboard' || (parentPopup?.current ?? false)
          }}
          initialFocus={(openType) => {
            if (pinned) {
              return false
            }

            return openType === 'keyboard' ? true : popupRef.current
          }}
        >
          <ScreenBackground />

          <header {...props(styles.header)}>
            {pinned ? null : (
              <Dialog.Close
                render={
                  <IconButton aria-label={backLabel}>
                    <Icon name="arrow-left" />
                  </IconButton>
                }
              />
            )}

            {leading}

            <div {...props(styles.heading)}>
              <Dialog.Title {...props(titleStyle, styles.title)}>{title}</Dialog.Title>

              {subtitle === undefined ? null : (
                <Dialog.Description {...props(text.body3, styles.title, styles.subtitle)}>{subtitle}</Dialog.Description>
              )}
            </div>

            {actions ? <div {...props(styles.actions)}>{actions}</div> : null}
          </header>

          {/* Its sheets open in it too, in the panel when docked */}
          <OverlayContainer value={panel}>
            <ParentPopup value={popupRef}>{children}</ParentPopup>
          </OverlayContainer>
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
  // In the panel, over its whole box; contained, so the fixed background stays in it too. AppShell already pads the
  // Safe areas
  docked: {
    contain: 'paint',
    maxWidth: 'none',
    paddingBottom: 0,
    paddingLeft: 0,
    paddingRight: 0,
    paddingTop: 0,
    position: 'absolute',
  },
  dockedOffscreen: {
    transform: 'translateX(100%)',
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
  heading: {
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
    minWidth: 0,
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
  // Keeps its line while it's empty, so the header doesn't move once a count arrives
  subtitle: {
    color: color.textSecondary,
    minHeight: '1.2em',
  },
  title: {
    margin: 0,
    minWidth: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  wide: {
    maxWidth: 'none',
  },
})
