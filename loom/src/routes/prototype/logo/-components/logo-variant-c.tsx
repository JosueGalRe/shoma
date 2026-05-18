import type { SVGProps } from 'react'
import { cn } from '@shoma/design-system'

export interface LogoVariantProps extends SVGProps<SVGSVGElement> {
  size?: 'sm' | 'md' | 'lg' | 'xl' | number
}

export function LogoVariantC({ size = 'md', className, ...props }: LogoVariantProps) {
  const sizeMap = {
    sm: 32,
    md: 64,
    lg: 96,
    xl: 128,
  }

  const numericSize = typeof size === 'number' ? size : sizeMap[size]
  const width = numericSize * 2.5
  const height = numericSize

  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 250 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn(
        'bg-surface/20 backdrop-blur-sm rounded-xl border border-primary/10',
        className
      )}
      {...props}
    >
      <defs>
        <linearGradient id="text-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="var(--color-text)" />
          <stop offset="100%" stopColor="var(--color-primary)" />
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>

      <path d="M 30 50 L 60 20 L 90 50 L 60 80 Z" className="fill-accent/10 stroke-accent/30" strokeWidth="2" filter="url(#glow)" />
      <path d="M 160 50 L 190 20 L 220 50 L 190 80 Z" className="fill-primary/5 stroke-primary/20" strokeWidth="1" />

      <text 
        x="125" 
        y="65" 
        fontFamily="system-ui, sans-serif" 
        fontSize="48" 
        fontWeight="900" 
        letterSpacing="8" 
        textAnchor="middle" 
        fill="url(#text-grad)"
        className="drop-shadow-[0_4px_12px_rgba(200,170,110,0.3)]"
      >
        SHO'MA
      </text>
      
      <rect x="20" y="85" width="210" height="2" className="fill-border-gold/40" />
      <rect x="115" y="83" width="20" height="6" className="fill-accent drop-shadow-[0_0_4px_rgba(10,200,185,0.8)]" />
    </svg>
  )
}
