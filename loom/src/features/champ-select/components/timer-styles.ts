import { tv } from 'tailwind-variants'

export const timerStyles = tv({
  defaultVariants: {
    myTurn: false,
    size: 'lg',
    state: 'normal',
  },
  slots: {
    card: 'border-border bg-secondary/60 rounded-md border p-3',
    label: 'text-muted text-xs tracking-[0.24em] uppercase',
    phaseValue: 'font-display text-foreground mt-1 text-lg font-semibold capitalize',
    progress:
      'absolute top-0 left-0 h-1 w-full appearance-none bg-transparent transition-all duration-300 [&::-webkit-progress-bar]:bg-transparent',
    root: 'border-primary/30 bg-secondary/85 relative overflow-hidden',
    timerCard: 'border-primary/30 bg-background/70 rounded-md border p-3 text-center shadow-md',
    timerValue: 'font-display text-3xl font-bold tabular-nums',
    title: 'text-center text-2xl tracking-[0.24em] uppercase',
    topAccent: 'bg-primary/50 pointer-events-none absolute inset-x-0 top-0 h-px',
    turnValue: 'font-display text-lg font-semibold',
  },
  variants: {
    myTurn: {
      false: {
        turnValue: 'text-muted',
      },
      true: {
        turnValue: 'text-primary',
      },
    },
    size: {
      lg: {
        timerValue: 'text-3xl',
      },
      sm: {
        timerValue: 'text-2xl',
      },
    },
    state: {
      critical: {
        progress: '[&::-moz-progress-bar]:bg-destructive [&::-webkit-progress-value]:bg-destructive',
        timerValue: 'text-destructive',
      },
      normal: {
        progress: '[&::-moz-progress-bar]:bg-primary [&::-webkit-progress-value]:bg-primary',
        timerValue: 'text-primary',
      },
      warning: {
        progress: '[&::-moz-progress-bar]:bg-accent [&::-webkit-progress-value]:bg-accent',
        timerValue: 'text-accent',
      },
    },
  },
})
