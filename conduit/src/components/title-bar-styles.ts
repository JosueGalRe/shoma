import { tv } from 'tailwind-variants'

export const titleBarStyles = tv({
  slots: {
    base: 'flex h-8 shrink-0 items-center justify-between border-b border-[var(--conduit-border-subtle)] bg-transparent px-2 backdrop-blur-[12px]',
    button: [
      'flex h-6 w-6 cursor-pointer items-center justify-center rounded-md border-none bg-transparent text-[var(--shoma-text)]',
      'transition-colors duration-200',
      'hover:bg-[var(--conduit-surface)] hover:text-[var(--shoma-primary)]',
    ],
    controls: 'flex gap-1',
    title:
      'font-display pointer-events-none ml-1 text-[12px] font-[var(--shoma-font-weight-semibold)] tracking-[0.08em] text-[var(--shoma-primary)]',
  },
  variants: {
    close: {
      true: {
        button: 'hover:bg-[var(--shoma-destructive)] hover:text-[var(--shoma-text)]',
      },
    },
  },
})
