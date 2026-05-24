import { tv } from 'tailwind-variants'

export const inviteOverlayStyles = tv({
  slots: {
    overlay: 'bg-background/80 fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm',
    panel: 'border-border bg-background w-full max-w-md rounded-lg border p-6 shadow-xl',
    header: 'mb-6 flex items-center justify-between',
    title: 'text-foreground text-xl font-semibold',
    closeButton:
      'text-muted hover:bg-secondary hover:text-foreground focus-visible:ring-ring rounded-full p-2 focus-visible:ring-2 focus-visible:outline-none',
    closeIcon: 'size-5',
    form: 'mb-6 flex gap-2',
    permission: 'text-accent mb-4 text-sm',
    sectionTitle: 'text-muted mb-3 text-sm font-medium',
    list: 'max-h-60 space-y-2 overflow-y-auto pr-2',
    suggestionItem: 'border-border flex items-center justify-between rounded-md border p-3',
    suggestionName: 'text-foreground text-sm font-medium',
  },
})
