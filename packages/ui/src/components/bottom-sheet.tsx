import type { ReactNode } from 'react'

import { Drawer } from '@base-ui/react/drawer'
import { create, props } from '@stylexjs/stylex'
import { ArrowLeft } from 'lucide-react'

import { text } from '../text'
import { color } from '../tokens/color.stylex'

import { IconButton } from './icon-button'

import type { StyleXStyles } from '@stylexjs/stylex'

export interface BottomSheetProps {
  children: ReactNode
  // Shows the back arrow before the title (Figma "Options", "Add Friend"); it closes the sheet
  closeLabel?: string
  description?: string
  onOpenChange: (open: boolean) => void
  open: boolean
  style?: StyleXStyles
  title: string
}

// Figma "Bottom Sheet": navy-600 panel with 16px top corners, sized to its content, swipe down to close.
// No backdrop: the Figma screens keep the page behind undimmed.
export function BottomSheet({ children, closeLabel, description, onOpenChange, open, style, title }: BottomSheetProps) {
  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange}>
      <Drawer.Portal>
        <Drawer.Viewport {...props(styles.viewport)}>
          <Drawer.Popup
            className={(state) => {
              return props(
                styles.popup,
                state.transitionStatus !== undefined && styles.offscreen,
                state.transitionStatus === 'ending' && styles.ending,
                state.swiping && styles.swiping,
                style,
              ).className
            }}
          >
            <div {...props(styles.header)}>
              {closeLabel ? (
                <Drawer.Close
                  render={
                    <IconButton aria-label={closeLabel}>
                      <ArrowLeft />
                    </IconButton>
                  }
                />
              ) : null}

              <Drawer.Title {...props(text.heading1, styles.title)}>{title}</Drawer.Title>
            </div>

            <Drawer.Content {...props(styles.body)}>
              {description ? (
                <Drawer.Description {...props(text.heading3, styles.description)}>{description}</Drawer.Description>
              ) : null}

              {children}
            </Drawer.Content>
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
  // Closes in proportion to the swipe's strength, as Base UI's examples do
  ending: {
    transitionDuration: 'calc(var(--drawer-swipe-strength) * 400ms)',
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
  viewport: {
    alignItems: 'flex-end',
    display: 'flex',
    inset: 0,
    justifyContent: 'center',
    position: 'fixed',
    zIndex: 40,
  },
})
