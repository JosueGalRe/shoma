import { RiftClientState } from '@core/rift/rift-client-types'

import {
  findRuneSlotIndex,
  normalizeSelectedPerkIds,
  type RuneStyle,
} from '../../-lobby-runes'
import type { EditableRunePagePayload, UseLobbyRuneActionsOptions } from './lobby-rune-actions-types'

export function useLobbyRuneActions(options: UseLobbyRuneActionsOptions) {
  const {
    status,
    lcuClient,
    queryClient,
    appendLog,
    runeEditPending,
    setRuneEditPending,
    runePageActionPending,
    setRunePageActionPending,
    runeUpdatePending,
    setRuneUpdatePending,
    secondaryRuneSelectionIndex,
    setSecondaryRuneSelectionIndex,
    editableActiveRunePage,
    activeRunePage,
    runeStyles,
    runePages,
    runePageNameDraft,
    buildNewRunePageName,
    buildDeleteConfirmMessage,
    confirm,
  } = options

  async function updateEditableRunePage(mutator: (page: EditableRunePagePayload) => void) {
    const targetPage = editableActiveRunePage
    if (!targetPage || status !== RiftClientState.CONNECTED || runeEditPending) {
      return
    }

    setRuneEditPending(true)
    try {
      const detailResponse = await lcuClient.perks.getPage(targetPage.id)
      if (detailResponse.status !== 200 || typeof detailResponse.content !== 'object' || detailResponse.content === null) {
        return
      }

      const runePageDetail = detailResponse.content as {
        selectedPerkIds?: unknown
        [key: string]: unknown
      }

      const payload = {
        ...runePageDetail,
        selectedPerkIds: normalizeSelectedPerkIds(runePageDetail.selectedPerkIds),
      }

      mutator(payload)

      const updateResponse = await lcuClient.perks.updatePage(targetPage.id, payload)
      appendLog(`rune page edit status: ${updateResponse.status}`)
      await queryClient.invalidateQueries({ queryKey: ['rune-pages'] })
    } catch (error) {
      appendLog(`rune page edit failed: ${String(error)}`)
    } finally {
      setRuneEditPending(false)
    }
  }

  async function selectPrimaryRuneStyle(styleId: number) {
    const targetPage = editableActiveRunePage
    if (!targetPage || targetPage.primaryStyleId === styleId) {
      return
    }

    const fallbackSecondaryStyle = runeStyles.find((style) => style.id !== styleId)
    await updateEditableRunePage((page) => {
      page.primaryStyleId = styleId
      page.subStyleId = fallbackSecondaryStyle?.id ?? page.subStyleId ?? styleId
      page.secondaryStyleId = page.subStyleId

      page.selectedPerkIds = [
        0,
        0,
        0,
        0,
        0,
        0,
        page.selectedPerkIds[6] ?? 0,
        page.selectedPerkIds[7] ?? 0,
        page.selectedPerkIds[8] ?? 0,
      ]
      setSecondaryRuneSelectionIndex(0)
    })
  }

  async function selectPrimaryRune(slotIndex: number, runeId: number) {
    await updateEditableRunePage((page) => {
      page.selectedPerkIds[slotIndex] = runeId
    })
  }

  async function selectSecondaryRuneStyle(styleId: number) {
    const targetPage = editableActiveRunePage
    if (!targetPage || targetPage.primaryStyleId === styleId || targetPage.secondaryStyleId === styleId) {
      return
    }

    await updateEditableRunePage((page) => {
      page.subStyleId = styleId
      page.secondaryStyleId = styleId
      page.selectedPerkIds[4] = 0
      page.selectedPerkIds[5] = 0
      setSecondaryRuneSelectionIndex(0)
    })
  }

  async function selectSecondaryRune(runeId: number, secondaryRuneStyle: RuneStyle | null) {
    const targetPage = editableActiveRunePage
    const targetStyle = secondaryRuneStyle
    if (!targetPage || !targetStyle) {
      return
    }

    const selectedPerkIds = targetPage.selectedPerkIds
    const replacementIndex = 4 + secondaryRuneSelectionIndex
    const otherRuneId = selectedPerkIds[replacementIndex]
    const runeSlotIndex = findRuneSlotIndex(targetStyle, runeId)
    if (runeSlotIndex < 0) {
      return
    }

    if (otherRuneId > 0) {
      const otherRuneSlotIndex = findRuneSlotIndex(targetStyle, otherRuneId)
      if (otherRuneSlotIndex === runeSlotIndex) {
        return
      }
    }

    const nextSecondaryIndex = (secondaryRuneSelectionIndex + 1) % 2
    const assignIndex = 4 + nextSecondaryIndex

    await updateEditableRunePage((page) => {
      page.selectedPerkIds[assignIndex] = runeId
      setSecondaryRuneSelectionIndex(nextSecondaryIndex)
    })
  }

  async function selectStatShard(slotIndex: number, runeId: number) {
    await updateEditableRunePage((page) => {
      page.selectedPerkIds[6 + slotIndex] = runeId
    })
  }

  async function createRunePage() {
    if (status !== RiftClientState.CONNECTED || runePageActionPending) {
      return
    }

    const fallbackPrimaryStyleId = runeStyles[0]?.id ?? 8000
    const fallbackSecondaryStyleId = runeStyles[1]?.id ?? runeStyles[0]?.id ?? 8100
    const templatePage = activeRunePage

    const body = {
      name: buildNewRunePageName(runePages.length + 1),
      primaryStyleId: templatePage?.primaryStyleId ?? fallbackPrimaryStyleId,
      secondaryStyleId: templatePage?.secondaryStyleId ?? fallbackSecondaryStyleId,
      selectedPerkIds: templatePage?.selectedPerkIds.length ? templatePage.selectedPerkIds : [0, 0, 0, 0, 0, 0, 0, 0, 0],
    }

    setRunePageActionPending(true)
    try {
      const response = await lcuClient.perks.createPage(body)
      appendLog(`rune page create status: ${response.status}`)
      if (response.status === 200 && typeof response.content === 'object' && response.content !== null) {
        const createdPage = response.content as {
          id?: unknown
        }

        if (typeof createdPage.id === 'number') {
          const selectResponse = await lcuClient.perks.selectCurrentPage(createdPage.id)
          appendLog(`rune page select status: ${selectResponse.status}`)
        }
      }

      await queryClient.invalidateQueries({ queryKey: ['rune-pages'] })
    } catch (error) {
      appendLog(`rune page create failed: ${String(error)}`)
    } finally {
      setRunePageActionPending(false)
    }
  }

  async function renameActiveRunePage() {
    const targetPage = activeRunePage
    const nextName = runePageNameDraft.trim()
    if (!targetPage || !targetPage.isEditable || nextName.length === 0 || status !== RiftClientState.CONNECTED || runePageActionPending) {
      return
    }

    setRunePageActionPending(true)
    try {
      const detailResponse = await lcuClient.perks.getPage(targetPage.id)
      if (detailResponse.status !== 200 || typeof detailResponse.content !== 'object' || detailResponse.content === null) {
        return
      }

      const runePageDetail = detailResponse.content as {
        name?: unknown
      }
      const updateResponse = await lcuClient.perks.updatePage(targetPage.id, {
        ...runePageDetail,
        name: nextName,
      })
      appendLog(`rune page rename status: ${updateResponse.status}`)

      await queryClient.invalidateQueries({ queryKey: ['rune-pages'] })
    } catch (error) {
      appendLog(`rune page rename failed: ${String(error)}`)
    } finally {
      setRunePageActionPending(false)
    }
  }

  async function deleteActiveRunePage() {
    const targetPage = activeRunePage
    if (!targetPage || !targetPage.isEditable || status !== RiftClientState.CONNECTED || runePageActionPending) {
      return
    }

    if (!confirm(buildDeleteConfirmMessage(targetPage.name))) {
      return
    }

    setRunePageActionPending(true)
    try {
      const response = await lcuClient.perks.deletePage(targetPage.id)
      appendLog(`rune page delete status: ${response.status}`)
      await queryClient.invalidateQueries({ queryKey: ['rune-pages'] })
    } catch (error) {
      appendLog(`rune page delete failed: ${String(error)}`)
    } finally {
      setRunePageActionPending(false)
    }
  }

  async function selectRunePage(runePageId: number) {
    if (status !== RiftClientState.CONNECTED || runeUpdatePending) {
      return
    }

    setRuneUpdatePending(true)
    try {
      const response = await lcuClient.perks.selectCurrentPage(runePageId)
      appendLog(`rune page select status: ${response.status}`)
      await queryClient.invalidateQueries({ queryKey: ['rune-pages'] })
    } catch (error) {
      appendLog(`rune page select failed: ${String(error)}`)
    } finally {
      setRuneUpdatePending(false)
    }
  }

  return {
    selectPrimaryRuneStyle,
    selectPrimaryRune,
    selectSecondaryRuneStyle,
    selectSecondaryRune,
    selectStatShard,
    createRunePage,
    renameActiveRunePage,
    deleteActiveRunePage,
    selectRunePage,
  }
}
