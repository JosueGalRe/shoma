import type { SVGProps } from 'react'
import { cn } from '@shoma/design-system'

export interface LogoVariantProps extends SVGProps<SVGSVGElement> {
  size?: 'sm' | 'md' | 'lg' | 'xl' | number
}

export function LogoVariantA({ size = 'md', className, ...props }: LogoVariantProps) {
  const sizeMap = {
    sm: 32,
    md: 64,
    lg: 96,
    xl: 128,
  }

  const numericSize = typeof size === 'number' ? size : sizeMap[size]

  return (
    <svg
      width={numericSize}
      height={numericSize}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn(
        'bg-surface/40 backdrop-blur-md',
        'rounded-2xl border border-border-gold/30 shadow-[0_4px_24px_-4px_rgba(120,90,40,0.2)]',
        className
      )}
      {...props}
    >
      <rect
        x="4"
        y="4"
        width="92"
        height="92"
        rx="12"
        className="stroke-primary/20"
        strokeWidth="1"
      />

      <path
        d="M 65 35 L 50 20 L 35 35 L 35 45 L 65 55 L 65 65 L 50 80 L 35 65"
        className="stroke-primary drop-shadow-[0_0_6px_rgba(200,170,110,0.4)]"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <path
        d="M 50 8 L 54 14 L 50 20 L 46 14 Z"
        className="fill-accent drop-shadow-[0_0_4px_rgba(10,200,185,0.6)]"
      />
      <path
        d="M 50 80 L 54 86 L 50 92 L 46 86 Z"
        className="fill-accent drop-shadow-[0_0_4px_rgba(10,200,185,0.6)]"
      />

      <path
        d="M 16 50 L 24 50"
        className="stroke-border-gold/50"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M 76 50 L 84 50"
        className="stroke-border-gold/50"
        strokeWidth="2"
        strokeLinecap="round"
      />
      
      <circle cx="16" cy="16" r="1.5" className="fill-border-gold/60" />
      <circle cx="84" cy="16" r="1.5" className="fill-border-gold/60" />
      <circle cx="16" cy="84" r="1.5" className="fill-border-gold/60" />
      <circle cx="84" cy="84" r="1.5" className="fill-border-gold/60" />
    </svg>
  )
}
