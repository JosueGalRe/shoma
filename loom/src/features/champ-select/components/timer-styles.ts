import { tv } from 'tailwind-variants'

export const timerStyles = tv({
  slots: {
    root: 'border-primary/30 bg-secondary/85 relative overflow-hidden',
    topAccent: 'bg-primary/50 pointer-events-none absolute inset-x-0 top-0 h-px',
    progress:
      'absolute top-0 left-0 h-1 w-full appearance-none bg-transparent transition-all duration-300 [&::-webkit-progress-bar]:bg-transparent',
    title: 'text-center text-2xl tracking-[0.24em] uppercase',
    card: 'border-border bg-secondary/60 rounded-md border p-3',
    label: 'text-muted text-xs tracking-[0.24em] uppercase',
    phaseValue: 'font-display text-foreground mt-1 text-lg font-semibold capitalize',
    timerCard: 'border-primary/30 bg-background/70 rounded-md border p-3 text-center shadow-md',
    timerValue: 'font-display text-3xl font-bold tabular-nums',
    turnValue: 'font-display text-lg font-semibold',
  },
  variants: {
    state: {
      normal: {
        progress: '[&::-moz-progress-bar]:bg-primary [&::-webkit-progress-value]:bg-primary',
        timerValue: 'text-primary',
      },
      warning: {
        progress: '[&::-moz-progress-bar]:bg-accent [&::-webkit-progress-value]:bg-accent',
        timerValue: 'text-accent',
      },
      critical: {
        progress: '[&::-moz-progress-bar]:bg-destructive [&::-webkit-progress-value]:bg-destructive',
        timerValue: 'text-destructive',
      },
    },
    size: {
      sm: {
        timerValue: 'text-2xl',
      },
      lg: {
        timerValue: 'text-3xl',
      },
    },
    myTurn: {
      true: {
        turnValue: 'text-primary',
      },
      false: {
        turnValue: 'text-muted',
      },
    },
  },
  defaultVariants: {
    state: 'normal',
    size: 'lg',
    myTurn: false,
  },
})
