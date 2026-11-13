import { Toast } from '@base-ui/react/toast'

export type ToastType = 'error' | 'info' | 'success'

export interface ToastOptions {
  action?: { label: string; onClick: () => void }
  timeout?: number
  title: string
  type: ToastType
}

// Shows a toast in the nearest ToastProvider (@shoma/ui/toast)
export function useToast() {
  const manager = Toast.useToastManager()

  return {
    add: ({ action, ...options }: ToastOptions) => {
      return manager.add({ ...options, actionProps: action && { children: action.label, onClick: action.onClick } })
    },
    close: manager.close,
  }
}
