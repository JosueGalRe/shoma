import { tv } from 'tailwind-variants'

export const landscapeWarningStyles = tv({
  slots: {
    overlay: 'bg-background/95 text-foreground fixed inset-0 z-[9999] flex flex-col items-center justify-center p-6 text-center backdrop-blur-md',
    iconWrap: 'border-border bg-secondary/80 text-primary mb-6 flex size-20 items-center justify-center rounded-full border',
    title: 'text-primary mb-2 text-2xl font-semibold',
    body: 'text-muted max-w-xs',
  },
})
