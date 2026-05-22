import { Button } from '@/components/ui/button'
import { type PerkPage } from '@/core/lcu/parsers/perks'

interface RunePageControlsProps {
  pages: PerkPage[]
  currentPageId: number | null
  onSetCurrentPage: (pageId: number) => void
  onCreatePage: () => void
  onDeletePage: () => void
}

export function RunePageControls({
  pages,
  currentPageId,
  onSetCurrentPage,
  onCreatePage,
  onDeletePage,
}: RunePageControlsProps) {
  return (
    <div className='flex gap-x-2'>
      <div className='flex gap-2 overflow-x-auto'>
        {pages.map((p) => {
          const isActive = p.id === currentPageId

          return (
            <button
              key={p.id}
              className={`focus-visible:ring-ring h-11 shrink-0 rounded-md border px-3 text-sm font-medium whitespace-nowrap transition-colors focus-visible:ring-2 focus-visible:outline-none ${isActive ? 'border-primary bg-secondary/60 text-primary' : 'border-border text-muted hover:text-foreground'}`}
              onClick={() => onSetCurrentPage(p.id)}
              type='button'
            >
              {p.name}
            </button>
          )
        })}
      </div>
      <Button onClick={onCreatePage} size='sm' variant='secondary'>
        +
      </Button>
      <Button onClick={onDeletePage} size='sm' variant='destructive'>
        -
      </Button>
    </div>
  )
}
