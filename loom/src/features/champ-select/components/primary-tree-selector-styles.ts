import { tv } from 'tailwind-variants'

export const primaryTreeSelectorStyles = tv({
  slots: {
    root: 'flex gap-x-2',
    button:
      'bg-background focus-visible:ring-ring h-12 w-12 rounded-full border-2 p-1 transition-all focus-visible:ring-2 focus-visible:outline-none',
    icon: 'h-full w-full',
  },
  variants: {
    selected: {
      true: {
        button: 'border-primary shadow-[0_0_20px_var(--shoma-primary)]',
      },
      false: {
        button: 'border-transparent opacity-50 hover:border-primary/50 hover:opacity-100',
      },
    },
  },
})
