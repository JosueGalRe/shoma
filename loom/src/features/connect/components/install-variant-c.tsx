import { Download } from 'lucide-react'

import { Button } from '@/components/ui'

import type { InstallVariantProps } from '../connect-types'

export function InstallVariantC({ label, onClick }: InstallVariantProps) {
  return (
    <div className="fixed bottom-8 left-0 z-40 flex w-full justify-center px-6">
      <Button
        className="group relative h-14 gap-3 overflow-hidden rounded-full border border-border-gold/20 bg-surface-elevated/60 px-8 text-sm font-medium tracking-wider text-text shadow-[0_8px_32px_rgba(0,0,0,0.4)] backdrop-blur-2xl transition-all duration-300 hover:border-primary/30 hover:bg-surface-hover/60 hover:shadow-[0_8px_32px_rgba(200,170,110,0.15)] hover:text-primary active:scale-[0.97]"
        onClick={onClick}
        variant="ghost"
      >
        <span className="flex size-8 items-center justify-center rounded-full bg-surface-hover/50 transition-colors group-hover:bg-primary/20">
          <Download className="size-4" />
        </span>

        {label}
      </Button>
    </div>
  )
}
