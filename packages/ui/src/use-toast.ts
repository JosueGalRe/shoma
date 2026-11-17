import type { ReactNode } from 'react'

import { Toast } from '@base-ui/react/toast'

export type ToastType = 'error' | 'info' | 'success'

export interface ToastData {
  buttons?: ReactNode
  image?: string
}

export interface ToastOptions extends ToastData {
  action?: { label: string; onClick: () => void }
  // Adding again with the same id updates that toast in place
  id?: string
  timeout?: number
  title: string
  type: ToastType
}

// Shows a toast in the nearest ToastProvider (@shoma/ui/toast). `image` replaces the type's icon (a mode's art, as the
// Figma's invite snackbar), and `buttons` (icon buttons that answer it) replace the close: such a toast stays until
// Answered, so it neither times out on its own nor swipes away
export function useToast() {
  const manager = Toast.useToastManager<ToastData>()

  return {
    add: ({ action, buttons, image, ...options }: ToastOptions) => {
      return manager.add({
        ...options,
        actionProps: action && { children: action.label, onClick: action.onClick },
        data: { buttons, image },
        timeout: buttons ? 0 : options.timeout,
      })
    },
    close: manager.close,
  }
}
