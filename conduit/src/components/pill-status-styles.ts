import { tv } from 'tailwind-variants'

export const pillStatusStyles = tv({
  slots: {
    base: [
      'flex items-center gap-2 px-[14px] py-[6px]',
      'rounded-full border border-transparent',
      'text-[11px] backdrop-blur-[8px]',
    ],
    dot: 'h-[7px] w-[7px] rounded-full',
    label: 'text-[10px] tracking-[0.06em] text-[var(--shoma-muted)] uppercase',
    value: 'font-semibold',
  },
})
