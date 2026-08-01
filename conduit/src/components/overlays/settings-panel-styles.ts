import { tv } from 'tailwind-variants'

export const settingsPanelStyles = tv({
  slots: {
    card: [
      'flex flex-col gap-2.5 rounded-xl p-3',
      'bg-[color-mix(in_srgb,var(--shoma-surface)_60%,transparent)]',
      'border border-[color-mix(in_srgb,var(--shoma-border-gold)_20%,transparent)]',
      'shadow-[0_4px_24px_color-mix(in_srgb,#000_20%,transparent)] backdrop-blur-[12px]',
    ],
    checkbox: [
      'relative m-0 inline-flex h-4 w-4 cursor-pointer appearance-none items-center justify-center rounded transition-all duration-200',
      'border border-[color-mix(in_srgb,var(--shoma-border-gold)_40%,transparent)]',
      'bg-[color-mix(in_srgb,var(--shoma-surface-elevated)_40%,transparent)]',
      'checked:border-[var(--shoma-primary)] checked:bg-[color-mix(in_srgb,var(--shoma-primary)_80%,transparent)]',
      'after:mb-0.5 after:hidden after:h-2 after:w-1 after:rotate-45 after:border-0 after:border-r-2 after:border-b-2 after:border-solid after:border-[var(--shoma-surface)] after:content-[""] checked:after:block',
    ],
    content: 'flex flex-col gap-3 p-3',
    scrollArea: 'flex-1',
    deviceBrowser: 'text-[11px] font-[var(--shoma-font-weight-normal)] text-[var(--shoma-text)]',
    deviceDate: 'whitespace-nowrap',
    deviceId: 'font-mono opacity-70',
    deviceInfo: 'flex min-w-0 flex-1 flex-col gap-0.5',
    deviceItem: [
      'flex items-center justify-between gap-3 rounded-lg px-3 py-2.5',
      'bg-[color-mix(in_srgb,var(--shoma-surface-elevated)_30%,transparent)]',
      'border border-[color-mix(in_srgb,var(--shoma-border-gold)_15%,transparent)]',
    ],
    deviceList: 'flex flex-col gap-2',
    deviceMeta: 'flex items-center gap-2 text-[11px] text-[var(--shoma-text)]',
    deviceName: 'flex items-center gap-1.5 text-[13px] font-[var(--shoma-font-weight-medium)] text-[var(--shoma-text)]',
    deviceRevoke: [
      'flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center rounded-md border-none bg-transparent text-[var(--shoma-text-muted)]',
      'hover:bg-[color-mix(in_srgb,var(--shoma-destructive)_15%,transparent)] hover:text-[var(--shoma-destructive)]',
    ],
    header:
      'flex items-center justify-between border-b border-[color-mix(in_srgb,var(--shoma-border-gold)_15%,transparent)] bg-transparent px-5 py-4',
    item: 'flex flex-col gap-2',
    label: 'flex cursor-pointer items-center gap-2 text-[13px] text-[var(--shoma-text)]',
    link: 'cursor-pointer border-none bg-none p-0 text-[13px] text-[var(--shoma-primary)] no-underline transition-opacity duration-200 hover:opacity-80',
    overlay: [
      'absolute top-8 right-0 bottom-0 left-0 z-[100]',
      'flex flex-col backdrop-blur-[16px]',
      'bg-[color-mix(in_srgb,var(--shoma-surface)_40%,transparent)]',
      'border-t border-[color-mix(in_srgb,var(--shoma-border-gold)_20%,transparent)]',
    ],
    select: [
      'min-w-[120px] cursor-pointer appearance-none rounded-md py-1.5 pr-7 pl-2.5 text-[13px] text-[var(--shoma-text)] outline-none',
      'bg-[color-mix(in_srgb,var(--shoma-surface-elevated)_40%,transparent)]',
      "bg-[url(\"data:image/svg+xml,%3Csvg_xmlns='http://www.w3.org/2000/svg'_width='12'_height='12'_viewBox='0_0_24_24'_fill='none'_stroke='currentColor'_stroke-width='2'_stroke-linecap='round'_stroke-linejoin='round'%3E%3Cpolyline_points='6_9_12_15_18_9'%3E%3C/polyline%3E%3C/svg%3E\")]",
      'bg-[position:right_10px_center] bg-no-repeat',
      'border border-[color-mix(in_srgb,var(--shoma-border-gold)_30%,transparent)]',
      'backdrop-blur-[8px] transition-all duration-200',
      'focus:border-[var(--shoma-primary)] focus:shadow-[0_0_0_2px_color-mix(in_srgb,var(--shoma-primary)_30%,transparent)]',
      '[&>option]:bg-[var(--shoma-surface)] [&>option]:text-[var(--shoma-text)]',
    ],
    title:
      'font-display flex items-center gap-2 text-[16px] font-[var(--shoma-font-weight-semibold)] text-[var(--shoma-primary)]',
    value: 'text-[13px] text-[var(--shoma-text)]',
  },
})
