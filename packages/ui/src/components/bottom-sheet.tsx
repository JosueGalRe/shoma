import type { ReactNode } from 'react'

import { Drawer } from '@base-ui/react/drawer'
import { create, props } from '@stylexjs/stylex'

import { useOverlayContainer } from '../overlay-container'
import { text } from '../text'
import { color } from '../tokens/color.stylex'

import { Icon } from './icon'
import { IconButton } from './icon-button'

import type { StyleXStyles } from '@stylexjs/stylex'

export interface BottomSheetProps {
  children: ReactNode
  // The close button's icon: the back arrow (Figma "Options", "Add Friend") or an X (Figma "Invite")
  closeIcon?: 'arrow-left' | 'close'
  // Shows the close button before the title
  closeLabel?: string
  description?: string
  // Figma "Bottom Action": a bar pinned under the scrolling body, for the sheet's main button
  footer?: ReactNode
  // Figma "Invite": the screen's whole height and a line under the header
  fullHeight?: boolean
  onOpenChange: (open: boolean) => void
  open: boolean
  style?: StyleXStyles
  title: string
}

// Figma "Bottom Sheet": navy-600 panel with 16px top corners, sized to its content, swipe down to close.
// No backdrop: the Figma screens keep the page behind undimmed.
export function BottomSheet({
  children,
  closeIcon = 'arrow-left',
  closeLabel,
  description,
  footer,
  fullHeight = false,
  onOpenChange,
  open,
  style,
  title,
}: BottomSheetProps) {
  const container = useOverlayContainer()

  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange}>
      <Drawer.Portal container={container ?? undefined}>
        <Drawer.Viewport {...props(styles.viewport)}>
          <Drawer.Popup
            className={(state) => {
              return props(
                styles.popup,
                fullHeight && styles.fullHeight,
                footer !== undefined && styles.withFooter,
                state.transitionStatus !== undefined && styles.offscreen,
                state.transitionStatus === 'ending' && styles.ending,
                state.swiping && styles.swiping,
                style,
              ).className
            }}
          >
            <div {...props(styles.header, fullHeight && styles.dividedHeader)}>
              {closeLabel ? (
                <Drawer.Close
                  render={
                    <IconButton aria-label={closeLabel}>
                      <Icon name={closeIcon} />
                    </IconButton>
                  }
                />
              ) : null}

              <Drawer.Title {...props(text.heading2, styles.title)}>{title}</Drawer.Title>
            </div>

            <Drawer.Content {...props(styles.body)}>
              {description ? (
                <Drawer.Description {...props(text.heading3, styles.description)}>{description}</Drawer.Description>
              ) : null}

              {children}
            </Drawer.Content>

            {footer === undefined ? null : <div {...props(styles.footer)}>{footer}</div>}
          </Drawer.Popup>
        </Drawer.Viewport>
      </Drawer.Portal>
    </Drawer.Root>
  )
}

// The panel runs 48px below the screen edge so a drag upward never shows a gap under it
const bleed = '48px'

const styles = create({
  body: {
    display: 'flex',
    flexDirection: 'column',
    // Fills a full-height sheet, so the footer sits at the bottom
    flexGrow: 1,
    gap: 10,
    minHeight: 0,
    overflowY: 'auto',
    overscrollBehavior: 'contain',
    paddingBlock: 10,
    paddingInline: 24,
  },
  description: {
    color: color.text,
    margin: 0,
  },
  dividedHeader: {
    borderBottomColor: color.text,
    borderBottomStyle: 'solid',
    borderBottomWidth: 1,
  },
  // Closes in proportion to the swipe's strength, as Base UI's examples do
  ending: {
    transitionDuration: 'calc(var(--drawer-swipe-strength) * 400ms)',
  },
  footer: {
    backgroundColor: color.background,
    borderTopColor: color.text,
    borderTopStyle: 'solid',
    borderTopWidth: 1,
    flexShrink: 0,
    paddingBlockStart: 16,
    paddingBottom: `calc(16px + env(safe-area-inset-bottom))`,
    paddingInline: 24,
  },
  // Leaves a strip of the page above, so it still reads as a sheet
  fullHeight: {
    height: `calc(100dvh - 24px + ${bleed})`,
    maxHeight: `calc(100dvh - 24px + ${bleed})`,
  },
  header: {
    alignItems: 'center',
    display: 'flex',
    flexShrink: 0,
    gap: 10,
    paddingBlock: 16,
    paddingInline: 24,
  },
  offscreen: {
    transform: `translateY(calc(100% - ${bleed} + 2px))`,
  },
  popup: {
    backgroundColor: color.sheet,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    boxShadow: '0 -4px 32px 4px rgb(61 68 75 / 25%)',
    boxSizing: 'border-box',
    color: color.text,
    display: 'flex',
    flexDirection: 'column',
    marginBottom: `-${bleed}`,
    maxHeight: `calc(100dvh - 72px + ${bleed})`,
    // Wider than any phone, so phones get the full width and desktop a centered column
    maxWidth: 480,
    outlineStyle: 'none',
    paddingBottom: `calc(24px + env(safe-area-inset-bottom) + ${bleed})`,
    touchAction: 'auto',
    transform: 'translateY(var(--drawer-swipe-movement-y))',
    transitionDuration: { '@media (prefers-reduced-motion: reduce)': '0s', default: '450ms' },
    transitionProperty: 'transform',
    transitionTimingFunction: 'cubic-bezier(0.32, 0.72, 0, 1)',
    width: '100%',
    willChange: 'transform',
  },
  swiping: {
    transitionDuration: '0s',
    userSelect: 'none',
  },
  title: {
    margin: 0,
  },
  // The footer reaches the screen's bottom edge instead
  withFooter: {
    paddingBottom: bleed,
  },
  viewport: {
    alignItems: 'flex-end',
    display: 'flex',
    inset: 0,
    justifyContent: 'center',
    position: 'fixed',
    zIndex: 40,
  },
})
