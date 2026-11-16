import { useState } from 'react'

import { ScrollArea } from '@shoma/ui/scroll-area'
import { text } from '@shoma/ui/text'
import { Tile, TileGroup } from '@shoma/ui/tile'
import { color } from '@shoma/ui/tokens/color.stylex'
import { useToast } from '@shoma/ui/use-toast'
import { create, props } from '@stylexjs/stylex'
import { useTranslation } from 'react-i18next'

import { communityDragonGameDataUrl } from '@/core/http/ddragon'
import { InfoSheet } from '@/features/champ-select/components/info-sheet'

import { ChampSelectAction } from './champ-select-action'

import type { ChampSelectPanelProps } from './champ-select-screen-types'
import type { WardSkin } from '@/core/lcu/parsers/champ-select'

// Figma "Select Ward": the player's ward skins; CONFIRM takes the picked one into the game
export function WardsPanel({ actionSlot, champSelect }: ChampSelectPanelProps) {
  const { t } = useTranslation()
  const toast = useToast()
  const [draft, setDraft] = useState<number>()
  const [isSending, setIsSending] = useState(false)
  // Kept after closing, so the sheet keeps its text while it slides away
  const [info, setInfo] = useState<WardSkin>()
  const [isInfoOpen, setIsInfoOpen] = useState(false)
  const saved = champSelect.selection.wardSkinId ?? 0
  const value = draft ?? saved

  return (
    <div {...props(styles.root)}>
      <h2 {...props(text.heading2, styles.subtitle)}>{t('champSelect.selectWard')}</h2>

      <ScrollArea contentStyle={styles.content} style={styles.scroll}>
        <TileGroup
          aria-label={t('champSelect.wardSkin')}
          style={styles.grid}
          value={value > 0 ? [String(value)] : []}
          onValueChange={(values) => {
            const picked = Number(values[0])

            if (picked > 0) {
              setDraft(picked)
            }
          }}
        >
          {champSelect.wardSkins.map((ward) => {
            const name = ward.name ?? ''

            return (
              <Tile
                key={ward.id}
                image={ward.wardImagePath ? communityDragonGameDataUrl(ward.wardImagePath) : ''}
                infoLabel={t('champSelect.aboutWard', { name })}
                label={name}
                value={String(ward.id)}
                onInfoClick={() => {
                  setInfo(ward)
                  setIsInfoOpen(true)
                }}
              />
            )
          })}
        </TileGroup>
      </ScrollArea>

      <InfoSheet body={info?.description ?? ''} open={isInfoOpen} title={info?.name ?? ''} onOpenChange={setIsInfoOpen} />

      <ChampSelectAction
        disabled={isSending || value <= 0 || value === saved}
        label={t('createLobby.confirm')}
        slot={actionSlot}
        onClick={() => {
          setIsSending(true)

          void champSelect.changeSelection({ wardSkinId: value }).then((ok) => {
            setIsSending(false)

            if (ok) {
              setDraft(undefined)

              return
            }

            toast.add({ title: t('errors.generic'), type: 'error' })
          })
        }}
      />
    </div>
  )
}

const styles = create({
  // Room for the picked tile's ring and the info badges, which reach past them
  content: {
    padding: 12,
  },
  // Figma: 80px tiles four to a row across the body, 16 between rows
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 80px)',
    justifyContent: 'space-between',
    rowGap: 16,
  },
  root: {
    display: 'flex',
    flexDirection: 'column',
    flexGrow: 1,
    gap: 32,
    minHeight: 0,
    paddingBlock: 16,
    paddingInline: 24,
  },
  scroll: {
    flexGrow: 1,
    margin: -12,
  },
  subtitle: {
    color: color.text,
    flexShrink: 0,
    margin: 0,
  },
})
