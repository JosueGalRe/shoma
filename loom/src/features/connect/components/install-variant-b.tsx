import { Download } from 'lucide-react'

import { Button } from '@/components/ui'

import type { InstallVariantProps } from '../connect-types'

export function InstallVariantB({ label, onClick }: InstallVariantProps) {
  return (
    <div className="bg-surface-elevated/80 border-border-gold/30 mb-6 flex w-full max-w-sm flex-col items-center gap-3 rounded-xl border p-4 text-center shadow-lg backdrop-blur-xl">
      <div className="bg-primary/20 text-primary flex size-10 items-center justify-center rounded-full">
        <Download className="size-5" />
      </div>

      <div className="space-y-1">
        <h3 className="text-text font-medium">Install Sho'ma for the best experience</h3>

        <p className="text-muted text-xs">Get full-screen mode and faster access</p>
      </div>

      <Button className="w-full" onClick={onClick} variant="primary">
        {label}
      </Button>
    </div>
  )
}
