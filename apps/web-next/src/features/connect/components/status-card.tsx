import { Card } from '@/components/ui/card'

import type { ConnectionCopy } from '../connect-types'

type StatusCardProps = {
  copy: ConnectionCopy
}

export function StatusCard({ copy }: StatusCardProps) {
  return (
    <Card className='border-brass/40 bg-brass/10 mt-8 rounded-2xl p-5'>
      <h2 className='font-display text-ink text-2xl'>{copy.title}</h2>
      <p className='mt-2 text-slate-700'>{copy.body}</p>
    </Card>
  )
}
