import { tv } from 'tailwind-variants'

export const accessCodeDisplayStyles = tv({
  slots: {
    code: [
      'text-[52px] font-[var(--shoma-font-weight-bold)] tracking-[0.12em]',
      'mb-1 font-mono text-[var(--shoma-primary)]',
      '[text-shadow:0_0_40px_var(--conduit-glow-primary)]',
      'cursor-text whitespace-nowrap select-text',
    ],
    skeleton: 'mb-1 flex h-[52px] items-center justify-center gap-3',
    skeletonDigit: [
      'h-8 w-8 rounded bg-[color-mix(in_srgb,var(--shoma-primary)_30%,transparent)]',
      'animate-[skeleton-pulse_1.4s_ease-in-out_infinite]',
    ],
  },
})
