import { tv } from 'tailwind-variants'

export const readyCheckOverlayStyles = tv({
  defaultVariants: {
    blocked: false,
    urgent: false,
  },
  slots: {
    acceptButton:
      'group relative h-20 w-full overflow-hidden border-y-2 transition-all hover:shadow-[0_0_40px_rgba(200,170,110,0.4)] active:scale-[0.98]',
    acceptLabel: 'font-display relative text-3xl font-black tracking-[0.2em] uppercase',
    acceptShimmer: 'via-primary/20 absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent to-transparent',
    actionBottomBorder:
      'absolute inset-x-0 bottom-0 h-[2px] bg-[linear-gradient(90deg,transparent,rgba(200,170,110,1),transparent)] bg-[length:200%_100%]',
    actionTopBorder:
      'absolute inset-x-0 top-0 h-[2px] bg-[linear-gradient(90deg,transparent,rgba(200,170,110,1),transparent)] bg-[length:200%_100%]',
    actionWrap: 'relative w-full',
    actions: 'mt-8 flex w-full max-w-md flex-col gap-6',
    content: 'relative z-10 flex w-full flex-col items-center gap-10 px-4 text-center',
    declineButton: 'text-sm font-bold tracking-[0.2em] uppercase transition-colors',
    error: 'text-destructive text-sm',
    headingGroup: 'space-y-4',
    outerRing: 'border-border-gold/10 absolute size-[600px] rounded-full border',
    overlay: 'fixed inset-0 z-[100] flex items-center justify-center overflow-hidden',
    particle1: 'bg-primary/40 absolute top-[30%] left-[20%] size-1 rounded-full',
    particle2: 'bg-primary/30 absolute top-[60%] left-[70%] size-1.5 rounded-full',
    particle3: 'bg-primary/20 absolute top-[20%] left-[60%] size-2 rounded-full',
    particle4: 'bg-primary/50 absolute top-[70%] left-[30%] size-1 rounded-full',
    particles: 'pointer-events-none absolute inset-0 overflow-hidden',
    rings: 'pointer-events-none absolute inset-0 flex items-center justify-center',
    rotatingRing: 'border-border-gold/20 absolute size-[400px] rounded-full border border-dashed',
    scrim: 'absolute inset-0 bg-black/80 backdrop-blur-xl',
    subtitle: 'flex items-center justify-center gap-3 text-sm font-bold tracking-[0.3em] uppercase opacity-0',
    subtitleDot: 'bg-primary/50 size-1 rounded-full',
    timerFrame: 'relative flex size-40 items-center justify-center',
    timerInner: 'border-border-gold/30 absolute size-24 rounded-full border',
    timerMid: 'border-border-gold/20 absolute size-32 rounded-full border',
    timerOuter: 'border-border-gold/10 absolute size-40 rounded-full border',
    timerText: 'font-display relative text-7xl font-black',
    timerWrap: 'flex items-center justify-center',
    title: 'font-display text-5xl font-black tracking-[0.15em] uppercase md:text-6xl',
  },
  variants: {
    blocked: {
      false: {},
      true: {
        acceptButton: 'cursor-not-allowed opacity-50',
        declineButton: 'cursor-not-allowed opacity-50',
      },
    },
    urgent: {
      false: {
        acceptButton: 'bg-primary/10 border-primary/30 hover:bg-primary/20',
        acceptLabel: 'text-primary',
        declineButton: 'text-muted hover:text-primary',
        timerText: 'text-primary',
        title: 'text-primary',
      },
      true: {
        acceptButton: '',
        acceptLabel: '',
        declineButton: '',
        timerText: '',
        title: '',
      },
    },
  },
})

export const premadeReadyCheckOverlayStyles = tv({
  slots: {
    content: 'space-y-8 pt-2',
    count: 'font-display text-foreground text-4xl',
    countWrap: 'absolute flex flex-col items-center justify-center',
    header: 'space-y-2 pt-8 pb-4 text-center',
    member: 'flex flex-col items-center gap-2',
    memberAvatarWrap: 'relative',
    memberName: 'text-foreground max-w-full truncate text-xs',
    memberStatus: 'border-background absolute -right-1 -bottom-1 flex size-5 items-center justify-center rounded-full border-2',
    membersGrid: 'grid grid-cols-2 gap-4 sm:grid-cols-3',
    overlay: 'bg-background/80 fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm',
    panel:
      'bg-secondary/95 relative overflow-hidden rounded-2xl shadow-2xl shadow-[0_0_24px_color-mix(in_srgb,var(--shoma-primary)_18%,transparent)]',
    ring: 'relative flex items-center justify-center',
    ringProgress: 'text-primary transition-all duration-500 ease-out motion-reduce:transition-none',
    ringSvg: 'size-40 -rotate-90 transform',
    ringTrack: 'text-background',
    ringWrap: 'flex justify-center',
    subtitle: 'text-muted text-xs tracking-[0.1em]',
    title: 'font-display text-primary text-2xl tracking-[0.1em]',
  },
  variants: {
    status: {
      accepted: {
        memberStatus: 'bg-primary',
      },
      declined: {
        memberStatus: 'bg-destructive',
      },
      pending: {
        memberStatus: 'bg-primary',
      },
    },
  },
})
