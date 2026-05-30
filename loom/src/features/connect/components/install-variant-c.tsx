import { Download } from 'lucide-react'

import { Button } from '@/components/ui'

import type { InstallVariantProps } from '../connect-types'

export function InstallVariantC({ label, onClick }: InstallVariantProps) {
  return (
    <div className="fixed bottom-6 left-0 flex w-full justify-center px-4">
      <Button
        className="bg-surface-elevated/90 border-border-gold/40 text-text hover:bg-surface-elevated h-12 rounded-full border px-6 shadow-xl backdrop-blur-xl"
        onClick={onClick}
        variant="ghost"
      >
        <Download className="text-primary mr-2 size-4" />

        <span className="font-medium tracking-wide">{label}</span>
      </Button>
    </div>
  )
}
