import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

import type { ConnectionCopy } from '../connect-types'

type StatusCardProps = {
  copy: ConnectionCopy
  isError?: boolean
}

export function StatusCard({ copy, isError = true }: StatusCardProps) {
  return (
    <Card className={cn(
      'mt-8 rounded-2xl p-5',
      isError 
        ? 'border-destructive/30 bg-destructive/10' 
        : 'border-primary/30 bg-primary/10'
    )}>
      <h2 className='font-display text-foreground text-2xl'>{copy.title}</h2>
      <p className='mt-2 text-muted-foreground'>{copy.body}</p>
    </Card>
  )
}
