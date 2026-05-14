import { Button } from '@/components/ui/button'
import { type PerkPage } from '@/core/lcu/parsers/perks'

interface RunePageControlsProps {
  pages: PerkPage[]
  currentPageId: number | null
  onSetCurrentPage: (pageId: number) => void
  onCreatePage: () => void
  onDeletePage: () => void
}

export function RunePageControls({ pages, currentPageId, onSetCurrentPage, onCreatePage, onDeletePage }: RunePageControlsProps) {
  return (
    <div className="flex gap-x-2">
      <div className="flex overflow-x-auto gap-2">
        {pages.map((p) => {
          const isActive = p.id === currentPageId

          return (
            <button
              key={p.id}
              className={`h-11 shrink-0 whitespace-nowrap rounded-md border px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${isActive ? 'border-primary bg-secondary/60 text-primary' : 'border-border text-muted hover:text-foreground'}`}
              onClick={() => onSetCurrentPage(p.id)}
              type="button"
            >
              {p.name}
            </button>
          )
        })}
      </div>
      <Button onClick={onCreatePage} size="sm" variant="secondary">
        +
      </Button>
      <Button onClick={onDeletePage} size="sm" variant="destructive">
        -
      </Button>
    </div>
  )
}
