import { tv } from 'tailwind-variants'

export const lobbyHeaderStyles = tv({
  slots: {
    header: 'border-border/50 flex h-[50px] shrink-0 items-center justify-between border-b px-4',
    subtitle: 'text-accent text-[10px]',
    title: 'font-display text-primary text-lg tracking-wider',
  },
})
