import { tv } from 'tailwind-variants'

export const inviteOverlayStyles = tv({
  slots: {
    closeButton:
      'text-muted hover:bg-secondary hover:text-foreground focus-visible:ring-ring rounded-full p-2 focus-visible:ring-2 focus-visible:outline-none',
    closeIcon: 'size-5',
    form: 'mb-6 flex gap-2',
    friendCheckbox: 'size-4 shrink-0 rounded-sm border transition-colors',
    friendItem:
      'focus-visible:ring-ring flex w-full items-center gap-3 rounded-md border p-2 text-left transition-colors focus-visible:ring-2 focus-visible:outline-none',
    header: 'mb-6 flex items-center justify-between',
    overlay: 'bg-background/80 fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm',
    panel:
      'border-border bg-background flex max-h-[90vh] w-full max-w-md flex-col gap-4 overflow-hidden rounded-lg border p-6 shadow-xl',
    permission: 'text-accent mb-4 text-sm',
    sectionTitle: 'text-muted mb-3 text-sm font-medium',
    suggestionItem: 'border-border flex items-center justify-between rounded-md border p-3',
    suggestionName: 'text-foreground min-w-0 flex-1 truncate text-sm font-medium',
    title: 'text-foreground text-xl font-semibold',
  },
  variants: {
    selected: {
      false: {
        friendCheckbox: 'border-border',
        friendItem: 'hover:bg-secondary/40 border-transparent',
      },
      true: {
        friendCheckbox: 'border-primary bg-primary',
        friendItem: 'border-primary/50 bg-secondary/60',
      },
    },
  },
})
