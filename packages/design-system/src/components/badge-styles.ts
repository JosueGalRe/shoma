import { tv, type VariantProps } from 'tailwind-variants'

export const badgeVariants = tv({
  base: 'focus:ring-ring inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:ring-2 focus:ring-offset-2 focus:outline-none',
  defaultVariants: { variant: 'default' },
  variants: {
    variant: {
      default: 'bg-primary/10 text-primary border-primary/20 border',
      destructive: 'bg-error/10 text-error border-error/20 border',
      outline: 'border-border text-text',
      secondary: 'bg-surface text-text-muted border-border border',
    },
  },
})

export type BadgeVariantProps = VariantProps<typeof badgeVariants>
