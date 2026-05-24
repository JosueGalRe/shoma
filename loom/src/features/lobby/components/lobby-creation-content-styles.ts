import { tv } from 'tailwind-variants'

export const lobbyCreationContentStyles = {
  container: 'flex h-full w-full flex-col overflow-y-auto px-4 pt-4 pb-12',
  loadingOrEmpty: 'flex h-full flex-col items-center justify-center',
  loadingText: 'text-muted text-sm',
  headerWrap: 'mb-8 shrink-0',
  headerRow: 'flex items-center gap-4',
  titleWrap: 'flex flex-col',
  title: 'font-display text-primary text-3xl font-semibold tracking-wider drop-shadow-[0_0_15px_rgba(200,170,110,0.4)]',
  titleDivider: 'from-primary mt-1 h-px w-20 bg-gradient-to-r to-transparent',
  modeList: 'flex w-full max-w-md flex-col gap-4 self-center pb-20',
  backButton: tv({
    base: 'border-border-gold/30 bg-surface/60 text-text hover:border-primary/50 hover:bg-surface/80 hover:text-primary flex size-10 shrink-0 items-center justify-center rounded-xl border shadow-[0_0_15px_rgba(200,170,110,0.15)] backdrop-blur-sm transition-all duration-300 hover:shadow-[0_0_20px_rgba(200,170,110,0.3)]',
  }),
  backIcon: 'size-5',
  modeCard: tv({
    base: 'group relative flex flex-col overflow-hidden rounded-xl border transition-all duration-350 backdrop-blur-md',
    variants: {
      expanded: {
        true: 'border-primary/50 bg-surface/80 shadow-[0_0_20px_rgba(200,170,110,0.2)]',
        false: 'border-border-gold/20 bg-surface/40 hover:border-primary/40 hover:bg-surface/60',
      },
    },
  }),
  modeCardAccent: 'bg-primary absolute top-0 left-0 h-full w-1 shadow-[0_0_10px_rgba(200,170,110,0.8)]',
  modeToggle: 'flex w-full items-center justify-between p-4 text-left',
  modeMeta: 'flex items-center gap-4',
  modeIconWrapper: tv({
    base: 'relative flex size-10 shrink-0 items-center justify-center rounded-full transition-transform duration-300',
    variants: {
      expanded: {
        true: 'scale-110 shadow-[0_0_20px_rgba(200,170,110,0.4)]',
        false: 'group-hover:scale-105',
      },
    },
  }),
  modeTitle: tv({
    base: 'text-base leading-tight font-bold tracking-wide transition-colors',
    variants: {
      expanded: {
        true: 'text-primary',
        false: 'text-text group-hover:text-primary/80',
      },
    },
  }),
  modeDescription: 'text-muted/70 mt-0.5 text-xs tracking-widest uppercase',
  chevron: tv({
    base: 'text-muted flex size-5 items-center justify-center transition-transform duration-300',
    variants: {
      expanded: {
        true: 'text-primary rotate-180',
      },
    },
  }),
  chevronIcon: 'size-4',
  queueContainer: 'grid transition-all duration-350 ease-in-out',
  queueBody: 'overflow-hidden',
  queueList: 'flex flex-col gap-2 px-4 pt-2 pb-4',
  queueItem: tv({
    base: 'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 transition-all duration-250',
    variants: {
      expanded: {
        true: 'translate-x-0 opacity-100',
        false: '-translate-x-4 opacity-0',
      },
      active: {
        true: 'bg-primary/20 text-primary shadow-[inset_0_0_10px_rgba(200,170,110,0.2)]',
        false: 'text-text/80 hover:bg-surface/50 hover:text-text',
      },
    },
  }),
  queueStatus: tv({
    base: 'flex size-4 items-center justify-center',
    variants: {
      active: {
        true: 'text-primary',
        false: 'text-muted',
      },
    },
  }),
  queueIcon: 'size-3 rotate-45',
  queueLabel: tv({
    base: 'text-sm font-medium tracking-wide',
    variants: {
      active: {
        true: 'font-bold',
      },
    },
  }),
  queueError: 'mt-2',
} as const
