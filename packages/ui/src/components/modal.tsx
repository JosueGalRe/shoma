import type { ReactNode } from 'react'

import { AlertDialog } from '@base-ui/react/alert-dialog'
import { create, props } from '@stylexjs/stylex'

import { color } from '../tokens/color.stylex'
import { font } from '../tokens/font.stylex'

import type { StyleXStyles } from '@stylexjs/stylex'

export interface ModalProps {
  // The answers, usually a primary and a secondary Button at full width
  children: ReactNode
  description?: ReactNode
  onOpenChange: (open: boolean) => void
  open: boolean
  // Replaces the panel's background, e.g. the map art behind "Match found"
  style?: StyleXStyles
  title: string
}

// Figma "Modal" (swap request, match found): a centered panel over the dimmed screen with a gradient border and
// Bracket corners. Built on AlertDialog because it asks for a decision: a stray tap outside must not dismiss it.
export function Modal({ children, description, onOpenChange, open, style, title }: ModalProps) {
  return (
    <AlertDialog.Root open={open} onOpenChange={onOpenChange}>
      <AlertDialog.Portal>
        <AlertDialog.Backdrop
          className={(state) => {
            return props(styles.backdrop, state.transitionStatus !== undefined && styles.hidden).className
          }}
        />

        <AlertDialog.Popup
          className={(state) => {
            return props(styles.popup, state.transitionStatus !== undefined && styles.popupHidden, style).className
          }}
        >
          <span aria-hidden {...props(styles.corner, styles.topLeft)} />

          <span aria-hidden {...props(styles.corner, styles.topRight)} />

          <span aria-hidden {...props(styles.corner, styles.bottomLeft)} />

          <span aria-hidden {...props(styles.corner, styles.bottomRight)} />

          <AlertDialog.Title {...props(styles.title)}>{title}</AlertDialog.Title>

          {description ? <AlertDialog.Description {...props(styles.description)}>{description}</AlertDialog.Description> : null}

          {children}
        </AlertDialog.Popup>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  )
}

const corner = 8

const styles = create({
  backdrop: {
    backgroundColor: color.overlay,
    inset: 0,
    opacity: 1,
    position: 'fixed',
    transitionDuration: '200ms',
    transitionProperty: 'opacity',
    transitionTimingFunction: 'ease-out',
    zIndex: 60,
  },
  bottomLeft: {
    borderBottomWidth: 2,
    borderLeftWidth: 2,
    bottom: corner,
    height: 48,
    left: corner,
  },
  bottomRight: {
    borderBottomWidth: 2,
    borderRightWidth: 2,
    bottom: corner,
    height: 48,
    right: corner,
  },
  // The white brackets in the panel's corners, taller at the bottom as in the Figma
  corner: {
    borderColor: color.text,
    borderStyle: 'solid',
    borderWidth: 0,
    pointerEvents: 'none',
    position: 'absolute',
    width: 36,
  },
  description: {
    color: color.text,
    margin: 0,
    textAlign: 'center',
  },
  hidden: {
    opacity: 0,
  },
  popup: {
    backgroundImage: 'linear-gradient(rgb(45 81 92 / 70%), rgb(5 16 25 / 70%) 69%)',
    // Square corners, so border-image can paint the Figma's gradient stroke
    borderImageSlice: 1,
    borderImageSource: `linear-gradient(${color.focusRing}, #36c8f3)`,
    borderStyle: 'solid',
    borderWidth: 2,
    boxSizing: 'border-box',
    color: color.text,
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
    height: 'fit-content',
    inset: 0,
    margin: 'auto',
    opacity: 1,
    outlineStyle: 'none',
    paddingBottom: 24,
    paddingInline: 16,
    paddingTop: 16,
    position: 'fixed',
    transform: 'scale(1)',
    transitionDuration: '200ms',
    transitionProperty: 'opacity, transform',
    transitionTimingFunction: 'ease-out',
    width: 'min(356px, 100% - 56px)',
    zIndex: 60,
  },
  popupHidden: {
    opacity: 0,
    transform: { '@media (prefers-reduced-motion: reduce)': 'none', default: 'scale(0.96)' },
  },
  title: {
    fontFamily: font.display,
    fontSize: '1rem',
    fontWeight: 400,
    letterSpacing: '0.06em',
    lineHeight: 1.25,
    margin: 0,
    paddingBlock: 10,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  topLeft: {
    borderLeftWidth: 2,
    borderTopWidth: 2,
    height: 28,
    left: corner,
    top: corner,
  },
  topRight: {
    borderRightWidth: 2,
    borderTopWidth: 2,
    height: 28,
    right: corner,
    top: corner,
  },
})
