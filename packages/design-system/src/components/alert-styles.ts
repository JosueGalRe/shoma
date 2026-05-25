import { tv, type VariantProps } from 'tailwind-variants'

export const alertVariants = tv({
  base: 'relative w-full rounded-lg p-4 [&>svg]:absolute [&>svg]:top-4 [&>svg]:left-4 [&>svg+div]:translate-y-[-3px] [&>svg~*]:pl-7',
  defaultVariants: {
    variant: 'default',
  },
  variants: {
    variant: {
      default: 'bg-surface/70 border-border-gold/30 text-text [&>svg]:text-text border',
      destructive: 'bg-error/10 border-error/30 text-error [&>svg]:text-error border',
    },
  },
})

export type AlertVariantProps = VariantProps<typeof alertVariants>
