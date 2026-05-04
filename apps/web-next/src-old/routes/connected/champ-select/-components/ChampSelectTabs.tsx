import { useTranslation } from 'react-i18next'

interface ChampSelectTabsProps {
  children: React.ReactNode
  activeTab: string
  onTabChange: (tab: string) => void
}

export function ChampSelectTabs({ children, activeTab, onTabChange }: ChampSelectTabsProps) {
  const { t } = useTranslation()

  const tabs = [
    { id: 'champions', label: t(($) => $.connected.champSelectTitle) },
    { id: 'spells', label: t(($) => $.connected.champSelectSpellsTitle) },
    { id: 'runes', label: t(($) => $.connected.champSelectRunesTitle) },
    { id: 'skins', label: t(($) => $.connected.champSelectSkinsTitle) },
  ]

  return (
    <div className="flex flex-col w-full h-full">
      <div className="flex space-x-1 border-b border-gold-dim/20 mb-4 overflow-x-auto pb-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`
              px-4 py-2 text-sm font-display tracking-wider uppercase whitespace-nowrap transition-colors
              ${activeTab === tab.id 
                ? 'text-gold border-b-2 border-gold' 
                : 'text-muted-foreground hover:text-foreground'}
            `}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-y-auto">
        {children}
      </div>
    </div>
  )
}
