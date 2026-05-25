import type { ComponentProps } from 'react'

import { User } from 'lucide-react'

import { cn } from '../lib/cn'

export interface AvatarProps extends ComponentProps<'div'> {
  src?: string
  alt?: string
  status?: 'online' | 'away' | 'offline'
  size?: 'sm' | 'md' | 'lg'
}

const statusColors = {
  away: 'border-accent',
  offline: 'border-muted',
  online: 'border-primary',
}

const sizeClasses = {
  lg: 'h-14 w-14',
  md: 'h-10 w-10',
  sm: 'h-8 w-8',
}

const iconSizes = {
  lg: 28,
  md: 20,
  sm: 16,
}

const Avatar = ({ className, src, alt, status, size = 'md', ref, ...props }: AvatarProps) => {
  return (
    <div
      ref={ref}
      className={cn(
        'relative inline-flex items-center justify-center overflow-hidden rounded-full border-2',
        status ? statusColors[status] : 'border-border',
        sizeClasses[size],
        className,
      )}
      {...props}
    >
      {src ? (
        <img src={src} alt={alt} className="h-full w-full object-cover" />
      ) : (
        <User className="text-muted" size={iconSizes[size]} />
      )}
    </div>
  )
}

Avatar.displayName = 'Avatar'

export { Avatar }
