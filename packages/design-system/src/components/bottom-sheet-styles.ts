import { tv } from 'tailwind-variants'

export const bottomSheetStyles = tv({
  slots: {
    content: 'overflow-y-auto overscroll-contain px-6 pb-6',
    contentFlush: 'flex min-h-0 flex-1 flex-col',
    dragHandle: 'shrink-0 cursor-grab touch-pan-y appearance-none border-0 bg-transparent p-0 active:cursor-grabbing',
    dragHandleBar: 'bg-primary mx-auto mt-3 mb-4 h-1.5 w-12 rounded-full opacity-50',
    glow: 'pointer-events-none absolute rounded-full',
    header: 'shrink-0 px-6 pb-4',
    headerTitle: 'text-foreground text-lg font-semibold',
    layout: 'relative z-10 flex h-full min-h-0 flex-col',
    scrim: 'bg-background/60 fixed inset-0 z-40 backdrop-blur-sm transition-opacity duration-200 ease-out',
    sheet:
      'bg-surface fixed right-0 bottom-0 left-0 z-50 m-0 flex max-h-[90vh] w-full max-w-none flex-col overflow-hidden rounded-t-2xl border-0 p-0 pb-[env(safe-area-inset-bottom)] transition-transform duration-200 ease-out',
  },
  variants: {
    isAnimating: {
      false: {
        scrim: 'opacity-0',
        sheet: 'translate-y-full',
      },
      true: {
        scrim: 'opacity-100',
        sheet: 'translate-y-0',
      },
    },
    tall: {
      true: {
        sheet: 'h-[90vh]',
      },
    },
  },
})
