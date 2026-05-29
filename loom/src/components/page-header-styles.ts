import { tv } from 'tailwind-variants'

export const pageHeaderStyles = tv({
  slots: {
    badge:
      'flex h-8 items-center gap-1 rounded-full border border-[rgba(200,170,110,0.4)] bg-[rgba(10,20,40,0.6)] px-3 text-[10px] font-bold tracking-wider text-[rgba(200,170,110,0.8)] uppercase tabular-nums',
    badges: 'flex min-w-0 items-center gap-2',
    content: 'flex min-w-0 flex-1 items-center gap-2',
    root: 'flex shrink-0 items-center gap-3 px-4 pt-3 pb-2',
    statusDot: 'relative inline-flex size-2 rounded-full',
    statusLabel: 'text-accent text-[10px] font-bold tracking-wider uppercase',
    statusPing: 'absolute inline-flex h-full w-full animate-ping rounded-full opacity-40',
    statusWrap: 'relative flex size-2 shrink-0',
    subtitle: 'truncate text-[10px] font-bold tracking-wider text-[rgba(200,170,110,0.6)] uppercase',
    title: 'font-display shrink-0 truncate text-base font-semibold tracking-widest text-[rgb(200,170,110)] uppercase',
  },
})
