import { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { LcuHttpMethod, LcuPaths } from '@mimic/protocol-contract'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { type RuneTree } from '@/core/http/ddragon-client'
import { createLcuQueryOptions, perksCurrentPageDescriptor, perksPagesDescriptor } from '@/core/lcu/lcu-queries'
import { readNumber, readObject } from '@/core/lcu/parsers/base'
import { type PerkPage } from '@/core/lcu/parsers/perks'
import { useLCUTransport, useRiftClient } from '@/core/rift'
import { useRiftStore } from '@/core/state/rift-store'

import { runeIconUrl } from '../utils'

const STAT_SHARDS = [
  [
    { id: 5008, icon: 'perk-images/StatMods/StatModsAdaptiveForceIcon.png', name: 'Adaptive Force' },
    { id: 5005, icon: 'perk-images/StatMods/StatModsAttackSpeedIcon.png', name: 'Attack Speed' },
    { id: 5007, icon: 'perk-images/StatMods/StatModsCDRScalingIcon.png', name: 'Ability Haste' },
  ],
  [
    { id: 5008, icon: 'perk-images/StatMods/StatModsAdaptiveForceIcon.png', name: 'Adaptive Force' },
    { id: 5010, icon: 'perk-images/StatMods/StatModsMovementSpeedIcon.png', name: 'Movement Speed' },
    { id: 5001, icon: 'perk-images/StatMods/StatModsHealthScalingIcon.png', name: 'Scaling Health' },
  ],
  [
    { id: 5011, icon: 'perk-images/StatMods/StatModsHealthPlusIcon.png', name: 'Health' },
    { id: 5013, icon: 'perk-images/StatMods/StatModsTenacityIcon.png', name: 'Tenacity and Slow Resist' },
    { id: 5001, icon: 'perk-images/StatMods/StatModsHealthScalingIcon.png', name: 'Scaling Health' },
  ],
]

interface RuneEditorProps {
  runeTrees: RuneTree[]
}

export function RuneEditor({ runeTrees }: RuneEditorProps) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const code = useRiftStore((state) => state.code)
  const { client } = useRiftClient({ code, enabled: true })
  const transport = useLCUTransport(client)

  const pagesQuery = useQuery(createLcuQueryOptions(perksPagesDescriptor, transport))
  const currentPageQuery = useQuery(createLcuQueryOptions(perksCurrentPageDescriptor, transport))

  const pages = pagesQuery.data ?? []
  const currentPageData = readObject(currentPageQuery.data)
  const currentPageId = readNumber(currentPageData?.id)
  const currentPage = pages.find((p) => p.id === currentPageId)

  const [draftPage, setDraftPage] = useState<PerkPage | null>(null)
  const editableCurrentPage = currentPage?.isEditable ? currentPage : null
  const localPage = draftPage?.id === editableCurrentPage?.id ? draftPage : editableCurrentPage

  const invalidateQueries = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: ['lcu', LcuPaths.perks.pages] })
    void queryClient.invalidateQueries({ queryKey: ['lcu', LcuPaths.perks.currentPage] })
  }, [queryClient])

  const handleCreatePage = async () => {
    if (!runeTrees.length || !transport) return
    const newPage = {
      name: `Mimic Page ${pages.length + 1}`,
      primaryStyleId: runeTrees[0].id,
      subStyleId: runeTrees[1].id,
      selectedPerkIds: [0, 0, 0, 0, 0, 0, 5008, 5008, 5011],
    }
    const result = await transport.request(LcuPaths.perks.pages, LcuHttpMethod.POST, newPage)
    const contentObj = readObject(result.content)
    const newPageId = readNumber(contentObj?.id)
    if (newPageId !== null) {
      setDraftPage(null)
      await transport.request(LcuPaths.perks.currentPage, LcuHttpMethod.PUT, String(newPageId))
    }
    invalidateQueries()
  }

  const handleDeletePage = async () => {
    if (!currentPage || !currentPage.isEditable || !transport) return
    setDraftPage(null)
    await transport.request(LcuPaths.perks.page(currentPage.id), LcuHttpMethod.DELETE)
    invalidateQueries()
  }

  const handleSetCurrentPage = async (pageId: number) => {
    if (!transport) return
    setDraftPage(null)
    await transport.request(LcuPaths.perks.currentPage, LcuHttpMethod.PUT, String(pageId))
    invalidateQueries()
  }

  const savePage = useCallback(
    async (page: PerkPage) => {
      if (!page.isEditable || !transport) return
      await transport.request(LcuPaths.perks.page(page.id), LcuHttpMethod.PUT, page)
      invalidateQueries()
    },
    [transport, invalidateQueries]
  )

  const handleSelectPrimaryTree = (treeId: number) => {
    if (!localPage) return
    const newSubStyleId = runeTrees.find((t) => t.id !== treeId)?.id ?? localPage.subStyleId
    const newPage = {
      ...localPage,
      primaryStyleId: treeId,
      subStyleId: newSubStyleId,
      selectedPerkIds: [0, 0, 0, 0, 0, 0, localPage.selectedPerkIds[6] || 5008, localPage.selectedPerkIds[7] || 5008, localPage.selectedPerkIds[8] || 5011],
    }
    setDraftPage(newPage)
    void savePage(newPage)
  }

  const handleSelectSecondaryTree = (treeId: number) => {
    if (!localPage || localPage.primaryStyleId === treeId) return
    const newPage = {
      ...localPage,
      subStyleId: treeId,
      selectedPerkIds: [
        localPage.selectedPerkIds[0],
        localPage.selectedPerkIds[1],
        localPage.selectedPerkIds[2],
        localPage.selectedPerkIds[3],
        0,
        0,
        localPage.selectedPerkIds[6],
        localPage.selectedPerkIds[7],
        localPage.selectedPerkIds[8],
      ],
    }
    setDraftPage(newPage)
    void savePage(newPage)
  }

  const handleSelectPrimaryRune = (slotIndex: number, runeId: number) => {
    if (!localPage) return
    const newPerks = [...localPage.selectedPerkIds]
    newPerks[slotIndex] = runeId
    const newPage = { ...localPage, selectedPerkIds: newPerks }
    setDraftPage(newPage)
    void savePage(newPage)
  }

  const handleSelectSecondaryRune = (runeId: number) => {
    if (!localPage) return
    const secondaryTree = runeTrees.find((t) => t.id === localPage.subStyleId)
    if (!secondaryTree) return

    const slot = secondaryTree.slots.findIndex((s) => s.runes.some((r) => r.id === runeId))
    if (slot === -1) return

    const newPerks = [...localPage.selectedPerkIds]
    
    const existingRune1 = newPerks[4]
    const existingRune2 = newPerks[5]
    
    const slot1 = secondaryTree.slots.findIndex((s) => s.runes.some((r) => r.id === existingRune1))
    const slot2 = secondaryTree.slots.findIndex((s) => s.runes.some((r) => r.id === existingRune2))

    if (slot === slot1) {
      newPerks[4] = runeId
    } else if (slot === slot2) {
      newPerks[5] = runeId
    } else if (existingRune1 === 0) {
      newPerks[4] = runeId
    } else if (existingRune2 === 0) {
      newPerks[5] = runeId
    } else {
      newPerks[4] = newPerks[5]
      newPerks[5] = runeId
    }

    const newPage = { ...localPage, selectedPerkIds: newPerks }
    setDraftPage(newPage)
    void savePage(newPage)
  }

  const handleSelectStatShard = (slotIndex: number, runeId: number) => {
    if (!localPage) return
    const newPerks = [...localPage.selectedPerkIds]
    newPerks[6 + slotIndex] = runeId
    const newPage = { ...localPage, selectedPerkIds: newPerks }
    setDraftPage(newPage)
    void savePage(newPage)
  }

  if (!localPage) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('runes.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center space-y-4 py-8">
            <p className="text-sm text-lol-text-secondary">{t('runes.noPageSelected')}</p>
            <Button onClick={() => void handleCreatePage()}>{t('runes.createPage')}</Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  const primaryTree = runeTrees.find((t) => t.id === localPage.primaryStyleId)
  const secondaryTree = runeTrees.find((t) => t.id === localPage.subStyleId)

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{t('runes.title')}</CardTitle>
        <div className="flex space-x-2">
          <select
            className="rounded-md border border-lol-border-subtle bg-lol-navy-950 p-2 text-sm text-lol-text-primary transition-colors focus:border-lol-border-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lol-border-gold"
            onChange={(e) => void handleSetCurrentPage(Number(e.target.value))}
            value={localPage.id}
          >
            {pages.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <Button onClick={() => void handleCreatePage()} size="sm" variant="secondary">
            +
          </Button>
          <Button onClick={() => void handleDeletePage()} size="sm" variant="destructive">
            -
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Primary Tree */}
        <div className="space-y-4">
          <div className="flex space-x-2">
            {runeTrees.map((tree) => (
              <button
                className={`h-10 w-10 rounded-full border-2 bg-lol-navy-950 p-1 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lol-border-gold ${
                  tree.id === localPage.primaryStyleId ? 'border-lol-border-gold shadow-lol-glow-gold' : 'border-transparent opacity-50 hover:border-lol-border-gold/50 hover:opacity-100'
                }`}
                key={tree.id}
                onClick={() => handleSelectPrimaryTree(tree.id)}
              >
                <img alt={tree.name} className="h-full w-full" loading="lazy" src={runeIconUrl(tree.icon) ?? undefined} />
              </button>
            ))}
          </div>

          {primaryTree && (
            <div className="space-y-4 rounded-lg border border-lol-border-subtle bg-lol-navy-900/60 p-4">
              {primaryTree.slots.map((slot, slotIndex) => (
                <div className="flex justify-center space-x-4" key={slotIndex}>
                  {slot.runes.map((rune) => {
                    const isSelected = localPage.selectedPerkIds[slotIndex] === rune.id
                    return (
                      <button
                        className={`relative rounded-full transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lol-border-gold ${
                          isSelected ? 'scale-110 ring-2 ring-lol-border-gold shadow-lol-glow-gold' : 'opacity-50 hover:opacity-100 hover:ring-1 hover:ring-lol-border-gold/60'
                        } ${slotIndex === 0 ? 'h-14 w-14' : 'h-10 w-10'}`}
                        key={rune.id}
                        onClick={() => handleSelectPrimaryRune(slotIndex, rune.id)}
                        title={rune.name}
                      >
                        <img alt={rune.name} className="h-full w-full" loading="lazy" src={runeIconUrl(rune.icon) ?? undefined} />
                      </button>
                    )
                  })}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Secondary Tree */}
        <div className="space-y-4">
          <div className="flex space-x-2">
            {runeTrees
              .filter((t) => t.id !== localPage.primaryStyleId)
              .map((tree) => (
                <button
                  className={`h-8 w-8 rounded-full border-2 bg-lol-navy-950 p-1 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lol-border-gold ${
                    tree.id === localPage.subStyleId ? 'border-lol-border-gold shadow-lol-glow-gold' : 'border-transparent opacity-50 hover:border-lol-border-gold/50 hover:opacity-100'
                  }`}
                  key={tree.id}
                  onClick={() => handleSelectSecondaryTree(tree.id)}
                >
                  <img alt={tree.name} className="h-full w-full" loading="lazy" src={runeIconUrl(tree.icon) ?? undefined} />
                </button>
              ))}
          </div>

          {secondaryTree && (
            <div className="space-y-4 rounded-lg border border-lol-border-subtle bg-lol-navy-900/60 p-4">
              {secondaryTree.slots.slice(1).map((slot, slotIndex) => (
                <div className="flex justify-center space-x-4" key={slotIndex}>
                  {slot.runes.map((rune) => {
                    const isSelected = localPage.selectedPerkIds[4] === rune.id || localPage.selectedPerkIds[5] === rune.id
                    return (
                      <button
                        className={`h-10 w-10 rounded-full transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lol-border-gold ${
                          isSelected ? 'scale-110 ring-2 ring-lol-border-gold shadow-lol-glow-gold' : 'opacity-50 hover:opacity-100 hover:ring-1 hover:ring-lol-border-gold/60'
                        }`}
                        key={rune.id}
                        onClick={() => handleSelectSecondaryRune(rune.id)}
                        title={rune.name}
                      >
                        <img alt={rune.name} className="h-full w-full" loading="lazy" src={runeIconUrl(rune.icon) ?? undefined} />
                      </button>
                    )
                  })}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Stat Shards */}
        <div className="space-y-2 rounded-lg border border-lol-border-subtle bg-lol-navy-900/60 p-4">
          {STAT_SHARDS.map((row, rowIndex) => (
            <div className="flex justify-center space-x-4" key={rowIndex}>
              {row.map((shard, shardIndex) => {
                const isSelected = localPage.selectedPerkIds[6 + rowIndex] === shard.id
                return (
                  <button
                    className={`h-8 w-8 rounded-full transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lol-border-gold ${
                      isSelected ? 'scale-110 ring-2 ring-lol-border-gold shadow-lol-glow-gold' : 'opacity-50 hover:opacity-100 hover:ring-1 hover:ring-lol-border-gold/60'
                    }`}
                    key={`${shard.id}-${shardIndex}`}
                    onClick={() => handleSelectStatShard(rowIndex, shard.id)}
                    title={shard.name}
                  >
                    <img alt={shard.name} className="h-full w-full" loading="lazy" src={runeIconUrl(shard.icon) ?? undefined} />
                  </button>
                )
              })}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
