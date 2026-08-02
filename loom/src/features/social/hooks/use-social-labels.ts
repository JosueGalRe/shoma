import { useTranslation } from 'react-i18next'

export function useTranslatedStatusLabels() {
  const { t } = useTranslation()

  return {
    away: t('social.status.away'),
    busy: t('social.status.busy'),
    offline: t('social.status.offline'),
    online: t('social.status.online'),
  }
}

export function useTranslatedActivityLabels() {
  const { t } = useTranslation()

  return {
    'champ-select': t('social.activity.champSelect'),
    'in-game': t('social.activity.inGame'),
    'in-lobby': t('social.activity.inLobby'),
    'in-queue': t('social.activity.inQueue'),
  }
}

export function useTranslatedInviteStateLabels() {
  const { t } = useTranslation()

  return {
    Accepted: t('social.inviteState.accepted'),
    Declined: t('social.inviteState.declined'),
    Kicked: t('social.inviteState.kicked'),
    Pending: t('social.inviteState.pending'),
  }
}
