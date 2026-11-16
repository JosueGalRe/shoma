import { useState } from 'react'

import { text } from '@shoma/ui/text'
import { TextField } from '@shoma/ui/text-field'
import { color } from '@shoma/ui/tokens/color.stylex'
import { useToast } from '@shoma/ui/use-toast'
import { create, props } from '@stylexjs/stylex'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'

import { championSkinsDescriptor, createLcuQueryOptions } from '@/core/lcu/queries'
import { useSharedLCUTransport } from '@/core/relay/use-relay-state'
import { rankedSearch, rankName } from '@/lib/fuzzy-search-utils'

import { ChampSelectAction } from './champ-select-action'
import { SkinCarousel } from './skin-carousel'

import type { ChampSelectPanelProps } from './champ-select-screen-types'

// Figma "Cosmetic Selection": once the champion is locked, a search over its skins the player owns and the carousel.
// CONFIRM takes the picked one into the game
export function SkinPanel({ actionSlot, champSelect }: ChampSelectPanelProps) {
  const { t } = useTranslation()
  const transport = useSharedLCUTransport()
  const toast = useToast()
  const [search, setSearch] = useState('')
  const [draft, setDraft] = useState<number>()
  const [isSending, setIsSending] = useState(false)
  const local = champSelect.team.find((member) => {
    return member.cellId === champSelect.localPlayerCellId
  })
  const summonerId = local?.summonerId ?? 0
  const championId = local?.championId ?? 0
  const skinsQuery = useQuery({
    ...createLcuQueryOptions(championSkinsDescriptor(summonerId, championId), transport),
    enabled: Boolean(transport && summonerId && championId > 0),
  })
  const skins = skinsQuery.data ?? []
  const saved = champSelect.selection.skinId || championId * 1000
  const value = draft ?? saved
  const shown = search.trim()
    ? rankedSearch({
        items: skins,
        limit: skins.length,
        query: search,
        rankItem: (query, skin) => {
          return rankName(query, skin.name)
        },
      })
    : skins

  return (
    <div {...props(styles.root)}>
      <p {...props(text.marcellus16, styles.subtitle)}>{t('champSelect.cosmetics')}</p>

      <TextField
        aria-label={t('lobby.quickPlay.searchSkins')}
        clearLabel={t('lobby.quickPlay.clearSearch')}
        enterKeyHint="search"
        placeholder={t('lobby.quickPlay.searchSkins')}
        style={styles.search}
        value={search}
        onValueChange={setSearch}
      />

      {skinsQuery.isSuccess && shown.length === 0 ? (
        <p {...props(text.body3, styles.empty)}>{t('lobby.quickPlay.noSkins')}</p>
      ) : null}

      <SkinCarousel label={t('champSelect.cosmetics')} skins={shown} value={value} onPick={setDraft} />

      <ChampSelectAction
        disabled={isSending || value === saved}
        label={t('createLobby.confirm')}
        slot={actionSlot}
        onClick={() => {
          setIsSending(true)

          void champSelect.changeSelection({ selectedSkinId: value }).then((ok) => {
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
  empty: {
    color: color.textSecondary,
    margin: 0,
    textAlign: 'center',
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
  search: {
    flexShrink: 0,
  },
  subtitle: {
    color: color.text,
    margin: 0,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
})
