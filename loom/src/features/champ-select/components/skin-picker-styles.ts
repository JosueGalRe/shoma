import { tv } from 'tailwind-variants'

export const skinPickerStyles = tv({
  slots: {
    root: 'space-y-2',
    title: 'font-display text-primary text-sm font-medium tracking-[0.18em] uppercase',
    grid: 'grid grid-cols-2 gap-2',
    card: 'bg-secondary/60 hover:border-primary focus-visible:ring-ring overflow-hidden rounded-md border text-left transition-all hover:shadow-[0_0_20px_var(--shoma-primary)] focus-visible:ring-2 focus-visible:outline-none',
    image: 'h-20 w-full object-cover',
    label: 'text-muted p-2 text-xs',
  },
  variants: {
    selected: {
      true: {
        card: 'border-primary shadow-[0_0_20px_var(--shoma-primary)]',
      },
      false: {
        card: 'border-border',
      },
    },
  },
})
