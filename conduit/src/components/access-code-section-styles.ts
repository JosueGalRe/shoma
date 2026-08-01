import { tv } from 'tailwind-variants'

export const accessCodeSectionStyles = tv({
  slots: {
    actions: 'flex flex-wrap justify-center gap-3',
    container: 'flex w-full shrink-0 flex-col items-center gap-6',
    copyButton: [
      'mb-3 min-h-8 gap-1.5 px-[14px] py-1 text-[12px]',
      'border-[color-mix(in_srgb,var(--shoma-primary)_50%,transparent)]! bg-[color-mix(in_srgb,var(--conduit-surface)_80%,transparent)]!',
      'hover:border-[var(--shoma-primary)]! hover:bg-[color-mix(in_srgb,var(--conduit-surface)_100%,transparent)]!',
    ],
    qrCanvas: 'block h-[160px] w-[160px]',
    qrContainer: 'flex items-center justify-center rounded-2xl border-none bg-white p-4 shadow-[0_8px_32px_rgba(0,0,0,0.3)]',
    qrToggleButton: 'min-h-9 w-full gap-1.5 border-[color-mix(in_srgb,var(--shoma-text-muted)_30%,transparent)]! text-[12px]',
  },
})
