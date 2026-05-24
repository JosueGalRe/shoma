import { tv } from 'tailwind-variants'

export const queueOverlayStyles = tv({
  slots: {
    overlay: 'bg-background/80 fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm',
    card: 'bg-secondary/95 relative w-full max-w-md overflow-hidden rounded-2xl border-none shadow-2xl',
    header: 'space-y-3 pb-0 text-center',
    emblem:
      'border-primary/40 bg-secondary text-primary mx-auto flex size-14 items-center justify-center rounded-full border shadow-[0_0_20px_var(--shoma-primary)]',
    title: 'font-display text-primary text-2xl tracking-[0.2em]',
    subtitle: 'text-muted text-xs tracking-[0.2em] uppercase',
    timer: 'font-display text-foreground text-3xl tracking-tight tabular-nums',
    content: 'space-y-3 pt-5',
    section: 'border-border bg-secondary/70 rounded-md border p-3 text-center',
    sectionLabel: 'text-muted text-xs tracking-[0.2em] uppercase',
    sectionValue: 'text-foreground mt-2 text-lg font-medium',
    sectionHint: 'text-muted mt-2 text-sm',
    penalty: 'border-destructive/60 bg-destructive/10 text-destructive rounded-md border p-3 text-center text-sm',
    actions: 'flex justify-center pt-2',
    cancelButton: 'min-h-12 px-6 text-sm',
  },
})
