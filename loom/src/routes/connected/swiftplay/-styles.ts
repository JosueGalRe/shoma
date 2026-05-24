import { tv } from 'tailwind-variants'

export const swiftplayStyles = tv({
  slots: {
    main: 'space-y-4 p-4',
    banner: 'border-destructive bg-destructive/10 text-destructive rounded-md border p-3 text-sm',
    options: 'grid gap-4',
    submitButton: 'w-full',
  },
})
