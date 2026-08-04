import { tv } from 'tailwind-variants'

export const wardPickerSheetStyles = tv({
  slots: {
    card: 'border-border bg-secondary/70 flex flex-col items-center gap-1 rounded-lg border p-2',
    grid: 'grid grid-cols-3 gap-2 p-1',
    image: 'size-14 object-contain',
    name: 'text-foreground w-full truncate text-center text-[10px]',
  },
  variants: {
    selected: {
      true: {
        card: 'border-primary ring-primary/50 ring-1',
      },
    },
  },
})
