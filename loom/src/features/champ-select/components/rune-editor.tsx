import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import * as v from 'valibot'

import { BottomSheet } from '@/components/ui/bottom-sheet'
import { Button } from '@/components/ui/button'
import { createLcuQueryOptions, perksCurrentPageDescriptor, perksPagesDescriptor } from '@/core/lcu/lcu-queries'
import { finiteNumber, parseObjectOrNull } from '@/core/lcu/parsers/base'
import type { PerkPage } from '@/core/lcu/parsers/perks';
import { useSharedLCUTransport } from '@/core/relay/relay-client-provider'
import { RuneId } from '@/core/types/branded';
import type { RuneId as RuneIdType } from '@/core/types/branded';
import { LcuHttpMethod, LcuPaths } from '@shoma/protocol-contract'

import { PrimaryTreeSelector } from './primary-tree-selector'
import { PrimaryRuneGrid } from './primary-rune-grid'
import { RunePageControls } from './rune-page-controls'
import { SecondaryRuneGrid } from './secondary-rune-grid'
import { SecondaryTreeSelector } from './secondary-tree-selector'
import { StatShardGrid } from './stat-shard-grid'
import { tabButtonBase, tabButtonActive, tabButtonInactive } from './rune-editor-styles'
import type { RuneEditorProps } from './rune-editor-types'

const PerkPageIdSchema = v.object({ id: finiteNumber })

export function RuneEditor({ runeTrees, isOpen, onClose }: RuneEditorProps) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const transport = useSharedLCUTransport()

  const [activeTab, setActiveTab] = useState<'recommended' | 'primary' | 'secondary'>('recommended')

  const pagesQuery = useQuery(createLcuQueryOptions(perksPagesDescriptor, transport))
  const currentPageQuery = useQuery(createLcuQueryOptions(perksCurrentPageDescriptor, transport))

  const pages = pagesQuery.data ?? []
  const currentPageId = parseObjectOrNull(PerkPageIdSchema, currentPageQuery.data)?.id ?? null
  const currentPage = pages.find((p) => p.id === currentPageId)

  const [draftPage, setDraftPage] = useState<PerkPage | null>(null)
  const editableCurrentPage = currentPage?.isEditable ? currentPage : null
  const localPage = draftPage?.id === editableCurrentPage?.id ? draftPage : editableCurrentPage

  const invalidateQueries = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: perksPagesDescriptor.queryKey })
    void queryClient.invalidateQueries({ queryKey: perksCurrentPageDescriptor.queryKey })
  }, [queryClient])

  const handleCreatePage = async () => {
    if (!runeTrees.length || !transport) { return }
    const newPage = {
      name: `Mimic Page ${pages.length + 1}`,
      primaryStyleId: runeTrees[0].id,
      subStyleId: runeTrees[1].id,
      selectedPerkIds: [
        RuneId(0),
        RuneId(0),
        RuneId(0),
        RuneId(0),
        RuneId(0),
        RuneId(0),
        RuneId(5008),
        RuneId(5008),
        RuneId(5011),
      ],
    }
    const result = await transport.request(LcuPaths.perks.pages, LcuHttpMethod.POST, newPage)
    const newPageId = parseObjectOrNull(PerkPageIdSchema, result.content)?.id ?? null
    if (newPageId !== null) {
      setDraftPage(null)
      await transport.request(LcuPaths.perks.currentPage, LcuHttpMethod.PUT, String(newPageId))
    }
    invalidateQueries()
  }

  const handleDeletePage = async () => {
    if (!currentPage || !currentPage.isEditable || !transport) { return }
    setDraftPage(null)
    await transport.request(LcuPaths.perks.page(currentPage.id), LcuHttpMethod.DELETE)
    invalidateQueries()
  }

  const handleSetCurrentPage = async (pageId: number) => {
    if (!transport) { return }
    setDraftPage(null)
    await transport.request(LcuPaths.perks.currentPage, LcuHttpMethod.PUT, String(pageId))
    invalidateQueries()
  }

  const savePage = useCallback(
    async (page: PerkPage) => {
      if (!page.isEditable || !transport) { return }
      await transport.request(LcuPaths.perks.page(page.id), LcuHttpMethod.PUT, page)
      invalidateQueries()
    },
    [transport, invalidateQueries],
  )

  const handleSelectPrimaryTree = (treeId: RuneIdType) => {
    if (!localPage) { return }
    const newSubStyleId = runeTrees.find((t) => t.id !== treeId)?.id ?? localPage.subStyleId
    const newPage = {
      ...localPage,
      primaryStyleId: treeId,
      subStyleId: newSubStyleId,
      selectedPerkIds: [
        RuneId(0),
        RuneId(0),
        RuneId(0),
        RuneId(0),
        RuneId(0),
        RuneId(0),
        localPage.selectedPerkIds[6] || RuneId(5008),
        localPage.selectedPerkIds[7] || RuneId(5008),
        localPage.selectedPerkIds[8] || RuneId(5011),
      ],
    }
    setDraftPage(newPage)
    void savePage(newPage)
  }

  const handleSelectSecondaryTree = (treeId: RuneIdType) => {
    if (!localPage || localPage.primaryStyleId === treeId) { return }
    const newPage = {
      ...localPage,
      subStyleId: treeId,
      selectedPerkIds: [
        localPage.selectedPerkIds[0],
        localPage.selectedPerkIds[1],
        localPage.selectedPerkIds[2],
        localPage.selectedPerkIds[3],
        RuneId(0),
        RuneId(0),
        localPage.selectedPerkIds[6],
        localPage.selectedPerkIds[7],
        localPage.selectedPerkIds[8],
      ],
    }
    setDraftPage(newPage)
    void savePage(newPage)
  }

  const handleSelectPrimaryRune = (slotIndex: number, runeId: RuneIdType) => {
    if (!localPage) { return }
    const newPerks = [...localPage.selectedPerkIds]
    newPerks[slotIndex] = runeId
    const newPage = { ...localPage, selectedPerkIds: newPerks }
    setDraftPage(newPage)
    void savePage(newPage)
  }

  const handleSelectSecondaryRune = (runeId: RuneIdType) => {
    if (!localPage) { return }
    const secondaryTree = runeTrees.find((t) => t.id === localPage.subStyleId)
    if (!secondaryTree) { return }

    const slot = secondaryTree.slots.findIndex((s) => s.runes.some((r) => r.id === runeId))
    if (slot === -1) { return }

    const newPerks = [...localPage.selectedPerkIds]

    const existingRune1 = newPerks[4]
    const existingRune2 = newPerks[5]

    const slot1 = secondaryTree.slots.findIndex((s) => s.runes.some((r) => r.id === existingRune1))
    const slot2 = secondaryTree.slots.findIndex((s) => s.runes.some((r) => r.id === existingRune2))

    if (slot === slot1) {
      newPerks[4] = runeId
    } else if (slot === slot2) {
      newPerks[5] = runeId
    } else if (existingRune1 === RuneId(0)) {
      newPerks[4] = runeId
    } else if (existingRune2 === RuneId(0)) {
      newPerks[5] = runeId
    } else {
      newPerks[4] = newPerks[5]
      newPerks[5] = runeId
    }

    const newPage = { ...localPage, selectedPerkIds: newPerks }
    setDraftPage(newPage)
    void savePage(newPage)
  }

  const handleSelectStatShard = (slotIndex: number, runeId: RuneIdType) => {
    if (!localPage) { return }
    const newPerks = [...localPage.selectedPerkIds]
    newPerks[6 + slotIndex] = runeId
    const newPage = { ...localPage, selectedPerkIds: newPerks }
    setDraftPage(newPage)
    void savePage(newPage)
  }

  if (!localPage) {
    return (
      <BottomSheet isOpen={isOpen} onClose={onClose} title={t('runes.title')}>
        <div className='flex flex-col items-center justify-center gap-y-4 py-8'>
          <p className='text-muted text-sm'>{t('runes.noPageSelected')}</p>
          <Button onClick={() => void handleCreatePage()}>{t('runes.createPage')}</Button>
        </div>
      </BottomSheet>
    )
  }

  const primaryTree = runeTrees.find((t) => t.id === localPage.primaryStyleId)
  const secondaryTree = runeTrees.find((t) => t.id === localPage.subStyleId)

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title={t('runes.title')} tall>
      <div className='mb-6'>
        <RunePageControls
          currentPageId={localPage.id}
          onCreatePage={() => void handleCreatePage()}
          onDeletePage={() => void handleDeletePage()}
          onSetCurrentPage={(id) => void handleSetCurrentPage(id)}
          pages={pages}
        />
      </div>

      <div className='border-border mb-6 flex gap-x-6 border-b'>
        <button
          className={`${tabButtonBase} ${activeTab === 'recommended' ? tabButtonActive : tabButtonInactive}`}
          onClick={() => setActiveTab('recommended')}
        >
          {t('runes.tabs.recommended', 'Recommended')}
        </button>
        <button
          className={`${tabButtonBase} ${activeTab === 'primary' ? tabButtonActive : tabButtonInactive}`}
          onClick={() => setActiveTab('primary')}
        >
          {t('runes.tabs.primary', 'Primary')}
        </button>
        <button
          className={`${tabButtonBase} ${activeTab === 'secondary' ? tabButtonActive : tabButtonInactive}`}
          onClick={() => setActiveTab('secondary')}
        >
          {t('runes.tabs.secondary', 'Secondary')}
        </button>
      </div>

      <div className='space-y-6'>
        {activeTab === 'recommended' && (
          <div className='space-y-4'>
            {['Meta', 'Pro', 'Anti-Meta'].map((type) => (
              <div
                key={type}
                className='border-border bg-secondary/60 relative flex cursor-not-allowed flex-col gap-y-2 rounded border p-4 opacity-50'
              >
                <div className='absolute inset-0 z-10 flex items-center justify-center'>
                  <span className='bg-secondary/80 text-muted rounded px-3 py-1 text-xs font-medium tracking-wider uppercase'>
                    {t('runes.comingSoon', 'Coming soon')}
                  </span>
                </div>

                <span className='text-foreground text-sm font-medium'>{type}</span>

                <div className='flex items-center justify-between'>
                  <div className='flex items-center gap-x-4'>
                    {runeTrees[0] && <img alt={runeTrees[0].name} className='size-12' src={runeTrees[0].icon} />}

                    <div className='flex gap-x-2'>
                      {runeTrees[0]?.slots.slice(0, 4).map((slot) => (
                        <img
                          key={slot.runes[0]?.id ?? slot.runes[0]?.name}
                          alt={slot.runes[0]?.name}
                          className='bg-secondary size-8 rounded-full'
                          src={slot.runes[0]?.icon}
                        />
                      ))}
                    </div>
                  </div>

                  {runeTrees[1] && <img alt={runeTrees[1].name} className='size-12' src={runeTrees[1].icon} />}
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'primary' && (
          <>
            <PrimaryTreeSelector
              onSelectTree={handleSelectPrimaryTree}
              runeTrees={runeTrees}
              selectedTreeId={localPage.primaryStyleId}
            />
            {primaryTree && (
              <PrimaryRuneGrid
                onSelectRune={handleSelectPrimaryRune}
                primaryTree={primaryTree}
                selectedPerkIds={localPage.selectedPerkIds}
              />
            )}
            <StatShardGrid onSelectStatShard={handleSelectStatShard} selectedPerkIds={localPage.selectedPerkIds} />
          </>
        )}

        {activeTab === 'secondary' && (
          <>
            <SecondaryTreeSelector
              onSelectTree={handleSelectSecondaryTree}
              primaryTreeId={localPage.primaryStyleId}
              runeTrees={runeTrees}
              selectedTreeId={localPage.subStyleId}
            />
            {secondaryTree && (
              <SecondaryRuneGrid
                onSelectRune={handleSelectSecondaryRune}
                secondaryTree={secondaryTree}
                selectedPerkIds={localPage.selectedPerkIds}
              />
            )}
            <StatShardGrid onSelectStatShard={handleSelectStatShard} selectedPerkIds={localPage.selectedPerkIds} />
          </>
        )}
      </div>
    </BottomSheet>
  )
}
