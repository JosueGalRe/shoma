import { tv } from 'tailwind-variants'

export const inputOTPStyles = tv({
  slots: {
    group: 'flex items-center',
    input: 'disabled:cursor-not-allowed',
    root: 'flex items-center gap-2 has-disabled:opacity-50',
    slot: 'border-input aria-invalid:border-destructive data-[active=true]:border-ring data-[active=true]:ring-ring/50 data-[active=true]:aria-invalid:border-destructive data-[active=true]:aria-invalid:ring-destructive/20 dark:bg-input/30 dark:data-[active=true]:aria-invalid:ring-destructive/40 relative flex h-9 w-9 items-center justify-center border-y border-r text-sm shadow-xs transition-all outline-none first:rounded-l-md first:border-l last:rounded-r-md data-[active=true]:z-10 data-[active=true]:ring-[3px]',
    slotCaret: 'animate-caret-blink bg-foreground h-4 w-px duration-1000',
    slotCaretWrap: 'pointer-events-none absolute inset-0 flex items-center justify-center',
  },
})
