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
      <select
        className="rounded-md border border-lol-border-subtle bg-lol-navy-950 p-2 text-sm text-lol-text-primary transition-colors focus:border-lol-border-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lol-border-gold"
        onChange={(e) => onSetCurrentPage(Number(e.target.value))}
        value={currentPageId ?? ''}
      >
        {pages.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </select>
      <Button onClick={onCreatePage} size="sm" variant="secondary">
        +
      </Button>
      <Button onClick={onDeletePage} size="sm" variant="destructive">
        -
      </Button>
    </div>
  )
}
