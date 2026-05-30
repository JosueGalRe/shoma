import { Download } from 'lucide-react'

import { Button } from '@/components/ui'

import type { InstallVariantProps } from '../connect-types'

export function InstallVariantA({ label, onClick }: InstallVariantProps) {
  return (
    <div className="absolute -right-4 -bottom-4">
      <Button
        aria-label={label}
        className="size-14 rounded-full shadow-[0_0_20px_rgba(200,170,110,0.3)]"
        onClick={onClick}
        size="icon"
        variant="primary"
      >
        <Download className="size-6" />
      </Button>
    </div>
  )
}
