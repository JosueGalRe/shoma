import { tv } from 'tailwind-variants'

export const retryButtonStyles = tv({
  slots: {
    attempt: [
      'inline-flex h-[18px] min-w-[18px] items-center justify-center px-[5px]',
      'text-[10px] font-[var(--shoma-font-weight-bold)] text-[var(--shoma-primary)]',
      'rounded-full bg-[color-mix(in_srgb,var(--shoma-primary)_15%,transparent)]',
    ],
    base: [
      'inline-flex items-center justify-center gap-2 px-[14px] py-[6px]',
      'text-[12px] font-[var(--shoma-font-weight-medium)] tracking-[0.03em] text-[var(--shoma-text)]',
      'bg-[color-mix(in_srgb,var(--conduit-surface)_80%,transparent)]',
      'rounded-full border border-[color-mix(in_srgb,var(--shoma-border-gold)_40%,transparent)]',
      'cursor-pointer backdrop-blur-[8px] transition-all duration-200 ease-in-out',
      'hover:not-disabled:bg-[color-mix(in_srgb,var(--conduit-surface)_100%,transparent)]',
      'hover:not-disabled:border-[color-mix(in_srgb,var(--shoma-border-gold)_70%,transparent)]',
      'hover:not-disabled:text-[var(--shoma-primary)]',
      'disabled:cursor-not-allowed disabled:opacity-60',
    ],
    spinner: [
      'h-3 w-3 rounded-full border-2',
      'border-[color-mix(in_srgb,var(--shoma-primary)_30%,transparent)]',
      'border-t-[var(--shoma-primary)]',
      'animate-[spin_0.8s_linear_infinite]',
    ],
  },
})
