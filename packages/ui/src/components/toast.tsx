import type { ReactNode } from 'react'

import { Toast } from '@base-ui/react/toast'
import { create, props } from '@stylexjs/stylex'

import { text } from '../text'
import { color } from '../tokens/color.stylex'

import { Button } from './button'
import { Icon } from './icon'
import { IconButton } from './icon-button'

import type { ToastType } from '../use-toast'
import type { StyleXStyles } from '@stylexjs/stylex'

// Figma "Snackbar" (UI KIT): one at a time at the bottom of the screen; a newer one fades over the older
export function ToastProvider({
  children,
  closeLabel,
  style,
}: {
  children: ReactNode
  // Accessible name of every toast's close button
  closeLabel: string
  // The viewport sits 24px above the bottom; screens with bottom actions lift it with this
  style?: StyleXStyles
}) {
  return (
    <Toast.Provider limit={1}>
      {children}

      <Toast.Portal>
        <Toast.Viewport {...props(styles.viewport, style)}>
          <ToastList closeLabel={closeLabel} />
        </Toast.Viewport>
      </Toast.Portal>
    </Toast.Provider>
  )
}

function ToastList({ closeLabel }: { closeLabel: string }) {
  const { toasts } = Toast.useToastManager()

  return toasts.map((toast) => {
    const type = isToastType(toast.type) ? toast.type : 'info'

    return (
      <Toast.Root
        key={toast.id}
        toast={toast}
        {...props(styles.toast, bars[type], (toast.transitionStatus !== undefined || toast.limited === true) && styles.hidden)}
      >
        <Icon name={type === 'success' ? 'success' : 'error'} style={icons[type]} />

        <Toast.Title {...props(text.marcellus13, styles.title)} />

        <Toast.Action render={<Button size="medium" variant="tertiary" />} />

        <Toast.Close
          render={
            <IconButton aria-label={closeLabel} size="small">
              <Icon name="close" />
            </IconButton>
          }
        />
      </Toast.Root>
    )
  })
}

function isToastType(type: string | undefined): type is ToastType {
  return type === 'error' || type === 'info' || type === 'success'
}

const styles = create({
  // Enter, exit and replaced-by-a-newer-toast; Base UI waits for the transition before unmounting
  hidden: {
    opacity: 0,
    transform: { '@media (prefers-reduced-motion: reduce)': 'none', default: 'translateY(16px)' },
  },
  title: {
    color: color.text,
    flexGrow: 1,
    margin: 0,
  },
  toast: {
    '::before': {
      content: '""',
      insetBlock: -1,
      insetInlineStart: -1,
      position: 'absolute',
      width: 4,
    },
    alignItems: 'center',
    backgroundColor: color.surface,
    borderColor: color.border,
    borderStyle: 'solid',
    borderWidth: 1,
    bottom: 0,
    boxShadow: '0 12px 32px rgb(0 0 0 / 45%)',
    boxSizing: 'border-box',
    display: 'flex',
    gap: 14,
    insetInline: 0,
    minHeight: 54,
    opacity: 1,
    paddingBlock: 10,
    paddingInlineEnd: 10,
    paddingInlineStart: 16,
    position: 'absolute',
    // Follows the finger while swiping it away (down or right)
    transform: 'translate(var(--toast-swipe-movement-x, 0px), var(--toast-swipe-movement-y, 0px))',
    transitionDuration: '200ms',
    transitionProperty: 'opacity, transform',
    transitionTimingFunction: 'ease-out',
  },
  viewport: {
    bottom: 'calc(24px + env(safe-area-inset-bottom))',
    insetInline: 0,
    marginInline: 'auto',
    position: 'fixed',
    width: 'min(364px, 100% - 48px)',
    zIndex: 50,
  },
})

const bars = create({
  error: { '::before': { backgroundColor: color.danger } },
  info: { '::before': { backgroundColor: color.info } },
  success: { '::before': { backgroundColor: color.success } },
})

const icons = create({
  error: { color: color.danger },
  info: { color: color.info },
  success: { color: color.success },
})
