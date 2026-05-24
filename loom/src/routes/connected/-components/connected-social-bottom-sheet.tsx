import { BottomSheet } from '@/components/ui'
import { uiStoreSelectors, useUiStore } from '@/core/state/ui-store'
import { SocialPanel } from '@/features/social/components/social-panel'

export function ConnectedSocialBottomSheet() {
  const isSocialDrawerOpen = useUiStore(uiStoreSelectors.isSocialDrawerOpen)
  const setSocialDrawerOpen = useUiStore(uiStoreSelectors.setSocialDrawerOpen)

  return (
    <BottomSheet isOpen={isSocialDrawerOpen} onClose={() => { setSocialDrawerOpen(false) }} tall flush>
      <SocialPanel />
    </BottomSheet>
  )
}
