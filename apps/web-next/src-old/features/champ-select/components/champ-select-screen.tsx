import { AramPanel } from './aram-panel'
import { PickBanPanel } from './pick-ban-panel'
import { RunesPanel } from './runes-panel'
import { SkinsPanel } from './skins-panel'
import { SummonersPanel } from './summoners-panel'

export function ChampSelectScreen() {
  return (
    <div className='space-y-6'>
      <PickBanPanel />
      <AramPanel />
      <SummonersPanel />
      <SkinsPanel />
      <RunesPanel />
    </div>
  )
}
