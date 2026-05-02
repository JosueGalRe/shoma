import { Card } from '@/components/ui/card'

import type { ConnectionCopy } from '../connect-types'

type StatusCardProps = {
  copy: ConnectionCopy
}

export function StatusCard({ copy }: StatusCardProps) {
  return (
    <Card className='border-destructive/30 bg-destructive/10 mt-8 rounded-2xl p-5'>
      <h2 className='font-display text-foreground text-2xl'>{copy.title}</h2>
      <p className='mt-2 text-muted-foreground'>{copy.body}</p>
    </Card>
  )
}
