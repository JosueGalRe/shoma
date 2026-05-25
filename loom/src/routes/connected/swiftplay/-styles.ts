import { tv } from 'tailwind-variants'

export const swiftplayStyles = tv({
  slots: {
    banner: 'border-destructive bg-destructive/10 text-destructive rounded-md border p-3 text-sm',
    main: 'space-y-4 p-4',
    options: 'grid gap-4',
    submitButton: 'w-full',
  },
})
