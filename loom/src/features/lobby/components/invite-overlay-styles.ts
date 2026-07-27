import { tv } from 'tailwind-variants'

export const inviteOverlayStyles = tv({
  slots: {
    closeButton:
      'focus-visible:ring-ring rounded-full p-2 text-[color-mix(in_srgb,rgb(200,170,110)_70%,transparent)] transition-colors hover:bg-[color-mix(in_srgb,rgb(200,170,110)_15%,transparent)] hover:text-[rgb(200,170,110)] focus-visible:ring-2 focus-visible:outline-none',
    closeIcon: 'size-5',
    filterInput:
      'text-foreground rounded-full border-[color-mix(in_srgb,rgb(200,170,110)_15%,transparent)] bg-[color-mix(in_srgb,rgb(10,20,40)_40%,transparent)] placeholder:text-[color-mix(in_srgb,rgb(200,170,110)_50%,transparent)]',
    form: 'mb-6 flex gap-2',
    friendCheckbox: 'size-4 shrink-0 rounded-sm border transition-colors',
    friendItem:
      'focus-visible:ring-ring flex w-full items-center gap-3 rounded-xl border p-2 text-left transition-colors focus-visible:ring-2 focus-visible:outline-none',
    header: 'flex items-center justify-between',
    inviteButton:
      'rounded-full border border-[color-mix(in_srgb,rgb(200,170,110)_40%,transparent)] bg-[color-mix(in_srgb,rgb(10,20,40)_60%,transparent)] text-xs font-bold tracking-widest text-[color-mix(in_srgb,rgb(200,170,110)_60%,transparent)] uppercase transition-all hover:bg-[color-mix(in_srgb,rgb(200,170,110)_10%,transparent)]',
    overlay: 'bg-background/60 fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md',
    panel:
      'bg-surface/80 flex max-h-[90vh] w-full max-w-md flex-col gap-4 overflow-hidden rounded-2xl border border-[color-mix(in_srgb,rgb(200,170,110)_20%,transparent)] p-6 shadow-[0_0_25px_color-mix(in_srgb,rgb(200,170,110)_10%,transparent)] backdrop-blur-md',
    permission: 'mb-4 text-sm text-[color-mix(in_srgb,rgb(200,170,110)_70%,transparent)]',
    sectionTitle:
      'mb-3 text-xs font-bold tracking-[0.2em] text-[color-mix(in_srgb,rgb(200,170,110)_70%,transparent)] uppercase',
    sendButton:
      'w-full rounded-full border border-[color-mix(in_srgb,rgb(200,170,110)_60%,transparent)] bg-gradient-to-r from-[color-mix(in_srgb,rgb(200,170,110)_20%,transparent)] to-[color-mix(in_srgb,rgb(200,170,110)_5%,transparent)] px-6 py-3 text-xs font-bold tracking-widest text-[rgb(200,170,110)] uppercase backdrop-blur-md transition-all hover:from-[color-mix(in_srgb,rgb(200,170,110)_30%,transparent)] hover:to-[color-mix(in_srgb,rgb(200,170,110)_10%,transparent)] hover:shadow-[0_0_25px_color-mix(in_srgb,rgb(200,170,110)_25%,transparent)] hover:backdrop-blur-lg active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40',
    suggestionItem:
      'flex items-center justify-between rounded-xl border border-transparent p-3 transition-colors hover:border-[color-mix(in_srgb,rgb(200,170,110)_15%,transparent)] hover:bg-[color-mix(in_srgb,rgb(10,20,40)_40%,transparent)]',
    suggestionName: 'text-foreground min-w-0 flex-1 truncate text-sm font-medium',
    title: 'text-xl font-bold tracking-widest text-[rgb(200,170,110)] uppercase',
  },
  variants: {
    selected: {
      false: {
        friendCheckbox: 'border-[color-mix(in_srgb,rgb(200,170,110)_50%,transparent)]',
        friendItem:
          'border-transparent hover:border-[color-mix(in_srgb,rgb(200,170,110)_15%,transparent)] hover:bg-[color-mix(in_srgb,rgb(10,20,40)_40%,transparent)]',
      },
      true: {
        friendCheckbox: 'border-[rgb(200,170,110)] bg-[rgb(200,170,110)]',
        friendItem:
          'border-[color-mix(in_srgb,rgb(200,170,110)_40%,transparent)] bg-[color-mix(in_srgb,rgb(200,170,110)_10%,transparent)]',
      },
    },
  },
})
