import { tv } from 'tailwind-variants'

export const appStyles = tv({
  slots: {
    content: 'box-border flex flex-1 flex-col items-center justify-center gap-8 p-6',
    shell: 'overflow-hidden rounded-xl',
  },
})
