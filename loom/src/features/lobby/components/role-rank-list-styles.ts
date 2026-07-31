import { tv } from 'tailwind-variants'

export const roleRankListStyles = tv({
  slots: {
    fillCheck:
      'flex size-4 items-center justify-center rounded-sm border border-[color-mix(in_srgb,rgb(200,170,110)_50%,transparent)] text-[10px] font-bold text-[rgb(200,170,110)]',
    fillToggle:
      'flex items-center gap-2 rounded-full border border-transparent px-3 py-1 text-xs text-[rgb(200,170,110)] transition-all enabled:hover:border-[color-mix(in_srgb,rgb(200,170,110)_60%,transparent)] enabled:hover:bg-[color-mix(in_srgb,rgb(200,170,110)_10%,transparent)] disabled:opacity-40',
    root: 'relative flex w-full flex-col items-center gap-2',
    slot: 'focus-visible:ring-ring flex min-w-11 flex-col items-center gap-0.5 rounded-lg border border-[color-mix(in_srgb,rgb(200,170,110)_25%,transparent)] bg-[color-mix(in_srgb,rgb(10,20,40)_60%,transparent)] px-2 py-1.5 transition-all focus-visible:ring-2 focus-visible:outline-none enabled:hover:border-[color-mix(in_srgb,rgb(200,170,110)_60%,transparent)] enabled:hover:bg-[color-mix(in_srgb,rgb(200,170,110)_10%,transparent)] disabled:opacity-40',
    slotIndex: 'text-[10px] font-bold text-[rgb(160,155,140)]',
    slots: 'flex items-center gap-1.5',
    strip:
      'absolute bottom-full left-1/2 z-20 mb-3 flex -translate-x-1/2 items-center gap-3 rounded-full border border-[color-mix(in_srgb,rgb(200,170,110)_25%,transparent)] bg-[color-mix(in_srgb,rgb(10,20,40)_90%,transparent)] px-4 py-2 shadow-lg backdrop-blur-md transition-all duration-150',
    stripButton:
      'focus-visible:ring-ring flex size-8 items-center justify-center rounded-full transition-transform hover:scale-110 focus-visible:ring-2 focus-visible:outline-none',
  },
  variants: {
    fill: {
      true: {
        slot: 'opacity-40',
      },
    },
    open: {
      false: {
        strip: 'pointer-events-none translate-y-1 opacity-0',
      },
      true: {
        strip: 'translate-y-0 opacity-100',
      },
    },
  },
})
