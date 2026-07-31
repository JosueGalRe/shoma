import { Check, Loader2, Share2, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import type { ShareInviteButtonProps } from './share-invite-button-types'

export function ShareInviteButton({ copied, failed, isSharing, onShare }: ShareInviteButtonProps) {
  const { t } = useTranslation()

  let icon = <Share2 className="size-3.5" />

  if (isSharing) {
    icon = <Loader2 className="size-3.5 animate-spin" />
  } else if (copied) {
    icon = <Check className="size-3.5" />
  } else if (failed) {
    icon = <X className="size-3.5 text-[rgb(232,64,87)]" />
  }

  return (
    <button
      aria-label={t('lobby.shareInvite')}
      className="flex size-8 items-center justify-center rounded-full border border-[color-mix(in_srgb,rgb(200,170,110)_40%,transparent)] bg-[color-mix(in_srgb,rgb(10,20,40)_40%,transparent)] text-[rgb(200,170,110)] backdrop-blur-md transition-colors hover:border-[color-mix(in_srgb,rgb(200,170,110)_60%,transparent)] hover:bg-[color-mix(in_srgb,rgb(200,170,110)_10%,transparent)]"
      disabled={isSharing}
      onClick={onShare}
      type="button"
    >
      {icon}
    </button>
  )
}
