import { tv } from 'tailwind-variants'

export const generatingStateStyles = tv({
  slots: {
    base: 'mt-2 flex flex-col items-center gap-3 text-[14px] tracking-[0.05em] text-[var(--shoma-primary)]',
    label: 'text-[13px] tracking-[0.05em]',
  },
})
