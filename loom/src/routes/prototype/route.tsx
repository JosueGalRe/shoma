import { createFileRoute } from '@tanstack/react-router'

import { ShomaHybridVariant } from './-components/shoma-hybrid-variant'

function PrototypeRouteComponent() {
  return (
    <div className="relative h-screen w-full overflow-hidden bg-black text-white">
      <ShomaHybridVariant />
    </div>
  )
}

export const Route = createFileRoute('/prototype')({
  component: PrototypeRouteComponent,
})
