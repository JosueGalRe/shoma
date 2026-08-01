import { tv } from 'tailwind-variants'

export const errorToastStyles = tv({
  slots: {
    base: [
      'fixed right-6 bottom-6 z-[100] flex max-w-[320px] items-start gap-3 rounded-xl p-4',
      'border border-[color-mix(in_srgb,var(--shoma-destructive)_30%,transparent)]',
      'bg-[color-mix(in_srgb,var(--shoma-surface)_92%,transparent)]',
      'shadow-[0_8px_32px_color-mix(in_srgb,#000_40%,transparent)] backdrop-blur-[16px]',
      'transition-all duration-300 ease-in-out',
    ],
    content: 'flex flex-1 flex-col gap-1',
    dismiss: [
      'ml-2 flex items-center justify-center rounded-md border-none bg-transparent p-1',
      'cursor-pointer text-[var(--shoma-text-muted)] transition-all duration-200',
      'hover:bg-[color-mix(in_srgb,var(--shoma-surface-elevated)_60%,transparent)] hover:text-[var(--shoma-text)]',
    ],
    icon: 'mt-[2px] h-4 w-4 shrink-0 rounded-full bg-[var(--shoma-destructive)]',
    message: 'm-0 text-[12px] text-[var(--shoma-text-muted)]',
    title: 'm-0 text-[13px] font-[var(--shoma-font-weight-semibold)] text-[var(--shoma-text)]',
  },
})
