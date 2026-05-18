import type { SVGProps } from 'react'
import { cn } from '@shoma/design-system'

export interface LogoVariantProps extends SVGProps<SVGSVGElement> {
  size?: 'sm' | 'md' | 'lg' | 'xl' | number
}

export function LogoVariantB({ size = 'md', className, ...props }: LogoVariantProps) {
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
        'rounded-full shadow-[0_0_30px_-5px_rgba(10,200,185,0.3)]',
        className
      )}
      {...props}
    >
      <defs>
        <radialGradient id="crystal-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="var(--color-accent)" stopOpacity="0.2" />
          <stop offset="100%" stopColor="var(--color-surface)" stopOpacity="0.8" />
        </radialGradient>
        <filter id="blur-layer">
          <feGaussianBlur stdDeviation="2" />
        </filter>
      </defs>
      
      <circle cx="50" cy="50" r="48" className="fill-surface/60 stroke-border-gold/40 backdrop-blur-xl" strokeWidth="1" />
      <circle cx="50" cy="50" r="42" className="stroke-primary/30" strokeWidth="0.5" strokeDasharray="2 4" />
      
      <circle cx="50" cy="50" r="35" fill="url(#crystal-glow)" className="stroke-accent/50 backdrop-blur-md" strokeWidth="1.5" />
      
      <path d="M 50 15 L 80 32.5 L 80 67.5 L 50 85 L 20 67.5 L 20 32.5 Z" className="stroke-primary/60 fill-primary/5" strokeWidth="1" />
      <path d="M 50 15 L 50 50 L 80 32.5" className="stroke-primary/40" strokeWidth="1" />
      <path d="M 80 67.5 L 50 50 L 50 85" className="stroke-primary/40" strokeWidth="1" />
      <path d="M 20 67.5 L 50 50 L 20 32.5" className="stroke-primary/40" strokeWidth="1" />
      
      <circle cx="50" cy="50" r="12" className="fill-accent drop-shadow-[0_0_8px_rgba(10,200,185,0.8)]" />
      <circle cx="50" cy="50" r="4" className="fill-text/90" />
    </svg>
  )
}
