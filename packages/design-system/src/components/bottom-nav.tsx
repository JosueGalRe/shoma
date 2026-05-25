import type { ReactNode } from 'react'

export interface BottomNavProps {
  items: {
    id: string
    label: string
    icon: ReactNode
    badge?: number
    onClick: () => void
  }[]
}

export function BottomNav({ items }: BottomNavProps) {
  return (
    <nav
      aria-label='Lobby navigation'
      className='border-border bg-secondary/95 fixed right-0 bottom-0 left-0 z-30 flex h-[56px] items-center justify-around border-t pb-[env(safe-area-inset-bottom)] backdrop-blur-sm'
    >
      {items.map((item) => {
        return (
          <button
            key={item.id}
            onClick={item.onClick}
            aria-label={item.label}
            className='hover:bg-background focus-visible:ring-ring relative flex min-h-[44px] min-w-[44px] flex-col items-center justify-center rounded-lg px-3 py-1 transition-colors focus-visible:ring-2 focus-visible:outline-none'
          >
            {item.icon}

            <span className='text-muted mt-0.5 text-[10px]'>{item.label}</span>

            {item.badge !== undefined && item.badge > 0 && (
              <span
                aria-hidden='true'
                className='bg-destructive text-foreground absolute top-0 right-2 flex min-h-[16px] min-w-[16px] items-center justify-center rounded-full px-1 text-[10px] font-bold'
              >
                {item.badge > 99 ? '99+' : item.badge}
              </span>
            )}
          </button>
        )
      })}
    </nav>
  )
}
