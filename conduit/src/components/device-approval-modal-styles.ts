import { tv } from 'tailwind-variants'

export const deviceApprovalModalStyles = tv({
  slots: {
    actions: 'flex w-full gap-3',
    body: 'm-0 text-center text-[13px] leading-[1.5] text-[var(--shoma-text)]',
    button: 'min-h-9 flex-1 gap-1.5 text-[12px]',
    header: 'flex flex-col items-center gap-3',
    icon: [
      'flex h-12 w-12 items-center justify-center rounded-full',
      'bg-[color-mix(in_srgb,var(--shoma-primary)_15%,transparent)]',
      'border border-[color-mix(in_srgb,var(--shoma-primary)_30%,transparent)]',
      'text-[var(--shoma-primary)] shadow-[0_0_20px_color-mix(in_srgb,var(--shoma-primary)_20%,transparent)]',
    ],
    modal: [
      'flex w-full max-w-[320px] flex-col items-center gap-5 p-6',
      'border border-[color-mix(in_srgb,var(--shoma-border-gold)_40%,transparent)]',
      'border-t-[color-mix(in_srgb,var(--shoma-border-gold)_60%,transparent)]',
      'bg-[color-mix(in_srgb,var(--conduit-surface)_95%,transparent)]',
      'shadow-[0_18px_48px_color-mix(in_srgb,var(--shoma-surface)_90%,transparent),0_0_24px_color-mix(in_srgb,var(--shoma-primary)_12%,transparent),inset_0_1px_0_color-mix(in_srgb,var(--shoma-primary)_15%,transparent)]',
    ],
    overlay: [
      'absolute top-8 right-0 bottom-0 left-0 z-[200]',
      'bg-[color-mix(in_srgb,var(--shoma-surface)_50%,transparent)]',
      'flex items-center justify-center backdrop-blur-[20px]',
      'border-t border-[color-mix(in_srgb,var(--shoma-border-gold)_20%,transparent)]',
    ],
    title:
      'm-0 text-[18px] font-[var(--shoma-font-family-display)] font-[var(--shoma-font-weight-semibold)] tracking-[0.04em] text-[var(--shoma-primary)]',
  },
  variants: {
    type: {
      approve: [
        'border-[color-mix(in_srgb,var(--shoma-primary)_50%,transparent)]! bg-[color-mix(in_srgb,var(--conduit-surface)_80%,transparent)]!',
        'hover:border-[var(--shoma-primary)]! hover:bg-[color-mix(in_srgb,var(--conduit-surface)_100%,transparent)]!',
      ],
      reject: [
        'border-[color-mix(in_srgb,var(--shoma-destructive)_50%,transparent)]! bg-[color-mix(in_srgb,var(--shoma-surface)_80%,transparent)]! text-[var(--shoma-destructive)]!',
        'hover:border-[var(--shoma-destructive)]! hover:bg-[color-mix(in_srgb,var(--shoma-destructive)_15%,transparent)]!',
      ],
    },
  },
})
