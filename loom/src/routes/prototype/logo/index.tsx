import { createFileRoute } from '@tanstack/react-router'
import { AmbientBackground } from '@shoma/design-system'

import { LogoVariantA } from './-components/logo-variant-a'
import { LogoVariantB } from './-components/logo-variant-b'
import { LogoVariantC } from './-components/logo-variant-c'
import { PrototypeSwitcher, type Variant } from './-components/prototype-switcher'

export const Route = createFileRoute('/prototype/logo/')({
  validateSearch: (search: Record<string, unknown>) => {
    const variant = search.variant as string
    return {
      variant: ['A', 'B', 'C'].includes(variant) ? (variant as Variant) : 'A',
    }
  },
  component: LogoPrototype,
})

function LogoPrototype() {
  const { variant } = Route.useSearch()

  const renderVariant = () => {
    switch (variant) {
      case 'B':
        return LogoVariantB
      case 'C':
        return LogoVariantC
      case 'A':
      default:
        return LogoVariantA
    }
  }

  const LogoComponent = renderVariant()

  const variantNames = {
    A: 'Hextech Monogram',
    B: 'Crystal Emblem',
    C: 'Typographic Wordmark'
  }

  return (
    <AmbientBackground className="items-center justify-center gap-12 p-8 min-h-screen">
      <div className="flex flex-col items-center gap-4 text-center">
        <h1 className="text-text text-3xl font-bold">Sho'ma Logo Prototype</h1>
        <p className="text-text-muted text-lg">{variantNames[variant]}</p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-12">
        <div className="flex flex-col items-center gap-3">
          <LogoComponent size="sm" />
          <span className="text-text-muted text-sm font-medium">sm</span>
        </div>
        
        <div className="flex flex-col items-center gap-3">
          <LogoComponent size="md" />
          <span className="text-text-muted text-sm font-medium">md</span>
        </div>
        
        <div className="flex flex-col items-center gap-3">
          <LogoComponent size="lg" />
          <span className="text-text-muted text-sm font-medium">lg</span>
        </div>
        
        <div className="flex flex-col items-center gap-3">
          <LogoComponent size="xl" />
          <span className="text-text-muted text-sm font-medium">xl</span>
        </div>
      </div>

      <div className="mt-12 flex flex-col items-center gap-6">
        <h2 className="text-text text-xl font-semibold">Custom Size (200px)</h2>
        <LogoComponent size={200} />
      </div>

      <PrototypeSwitcher currentVariant={variant} />
    </AmbientBackground>
  )
}
