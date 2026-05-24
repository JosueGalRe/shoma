import { tv } from 'tailwind-variants'

export const gameflowTransitionOverlayStyles = tv({
  slots: {
    backdrop: 'bg-background/85 fixed inset-0 z-40 flex items-center justify-center p-4 backdrop-blur-sm',
    card: 'border-primary/40 bg-secondary/90 rounded-lg border px-6 py-5 text-center shadow-[0_0_20px_var(--shoma-primary)]',
    spinner: 'text-primary mx-auto mb-3 size-8',
    label: 'text-foreground text-sm font-medium',
  },
})
