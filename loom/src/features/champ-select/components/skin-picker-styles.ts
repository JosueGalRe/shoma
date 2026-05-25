import { tv } from 'tailwind-variants'

export const skinPickerStyles = tv({
  slots: {
    card: 'bg-secondary/60 hover:border-primary focus-visible:ring-ring overflow-hidden rounded-md border text-left transition-all hover:shadow-[0_0_20px_var(--shoma-primary)] focus-visible:ring-2 focus-visible:outline-none',
    grid: 'grid grid-cols-2 gap-2',
    image: 'h-20 w-full object-cover',
    label: 'text-muted p-2 text-xs',
    root: 'space-y-2',
    title: 'font-display text-primary text-sm font-medium tracking-[0.18em] uppercase',
  },
  variants: {
    selected: {
      false: {
        card: 'border-border',
      },
      true: {
        card: 'border-primary shadow-[0_0_20px_var(--shoma-primary)]',
      },
    },
  },
})
