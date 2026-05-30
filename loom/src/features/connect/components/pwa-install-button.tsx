import { Download } from 'lucide-react'

import { Button } from '@/components/ui'

import type { InstallVariantProps } from '../connect-types'

export function PwaInstallButton({ label, onClick }: InstallVariantProps) {
  return (
    <div className="fixed bottom-8 left-0 z-40 flex w-full justify-center px-6">
      <Button
        className="group border-border-gold/20 bg-surface-elevated/60 text-text hover:border-primary/30 hover:bg-surface-hover/60 hover:text-primary relative h-14 gap-3 overflow-hidden rounded-full border px-8 text-sm font-medium tracking-wider shadow-[0_8px_32px_rgba(0,0,0,0.4)] backdrop-blur-2xl transition-all duration-300 hover:shadow-[0_8px_32px_rgba(200,170,110,0.15)] active:scale-[0.97]"
        onClick={onClick}
        variant="ghost"
      >
        <span className="bg-surface-hover/50 group-hover:bg-primary/20 flex size-8 items-center justify-center rounded-full transition-colors">
          <Download className="size-4" />
        </span>

        {label}
      </Button>
    </div>
  )
}
