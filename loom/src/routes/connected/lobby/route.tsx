import { createFileRoute } from '@tanstack/react-router'
import { Crown, Pencil, Plus } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { PageHeader } from '@/components/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui'
import {
  currentSummonerDescriptor,
  gameQueuesDescriptor,
  invitesDescriptor,
  lobbySessionDescriptor,
  platformConfigDescriptor,
  queueDescriptor,
  queueSearchDescriptor,
  sentInvitesDescriptor,
} from '@/core/lcu/lcu-queries'
import { ensureLcuRouteData } from '@/core/relay/route-loader'
import { uiStoreSelectors, useUiStore } from '@/core/state/ui-store'
import { translateLcuError } from '@/features/diagnostics/eligibility-errors'
import { useLobby } from '@/features/lobby'
import { LobbyCreationContent } from '@/features/lobby/components/lobby-creation-content'
import { getModeNameKey, getModeRules } from '@/features/modes/mode-engine'
import { useQueue } from '@/features/queue'
import { PremadeReadyCheckOverlay } from '@/features/ready-check/components/premade-ready-check-overlay'
import { formatElapsedSeconds } from '@/hooks/use-elapsed-time'

import { LobbyBackgroundEffects } from './-components/lobby-background-effects'
import { LobbyBottomSheets } from './-components/lobby-bottom-sheets'
import { LobbyInviteOverlay } from './-components/lobby-invite-overlay'
import { LobbyVisibilityToggle } from './-components/lobby-visibility-toggle'

function MemberRuneIcon({ role }: { role: string }) {
  const roleMap: Record<string, string> = {
    TOP: 'https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-clash/global/default/assets/images/position-selector/positions/icon-position-top.png',
    JUNGLE:
      'https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-clash/global/default/assets/images/position-selector/positions/icon-position-jungle.png',
    MIDDLE:
      'https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-clash/global/default/assets/images/position-selector/positions/icon-position-middle.png',
    BOTTOM:
      'https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-clash/global/default/assets/images/position-selector/positions/icon-position-bottom.png',
    UTILITY:
      'https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-clash/global/default/assets/images/position-selector/positions/icon-position-utility.png',
    FILL: 'https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-clash/global/default/assets/images/position-selector/positions/icon-position-fill.png',
  }

  const url = roleMap[role]
  if (!url) return null

  return (
    <div className='rounded-full border border-[color-mix(in_srgb,rgb(200,170,110)_30%,transparent)] bg-[color-mix(in_srgb,rgb(10,20,40)_60%,transparent)] p-1 backdrop-blur-md'>
      <img alt={role} className='size-5 rounded-full' src={url} />
    </div>
  )
}

function LobbyMemberCard({
  member,
  showSecondaryRole,
}: {
  member: import('@/features/lobby/lobby-store').LobbyMember
  showSecondaryRole: boolean
}) {
  return (
    <div className='flex flex-col items-center gap-2'>
      <div className='relative'>
        <div className='size-14 overflow-hidden rounded-full border border-[color-mix(in_srgb,rgb(200,170,110)_40%,transparent)] shadow-[0_0_10px_color-mix(in_srgb,rgb(200,170,110)_15%,transparent)]'>
          <img alt={member.displayName} className='h-full w-full object-cover' src={member.iconUrl ?? undefined} />
        </div>
      </div>
      <div className='flex flex-col items-center gap-1'>
        <span className='max-w-full truncate px-1 text-center text-xs font-medium text-[rgb(200,170,110)]'>
          {member.displayName}
        </span>
        <div className='flex items-center gap-1'>
          {member.firstPositionPreference !== 'UNSELECTED' && <MemberRuneIcon role={member.firstPositionPreference} />}
          {showSecondaryRole &&
            member.secondPositionPreference !== 'UNSELECTED' &&
            member.firstPositionPreference !== 'FILL' && <MemberRuneIcon role={member.secondPositionPreference} />}
        </div>
      </div>
    </div>
  )
}

function LobbyRouteComponent() {
  const { t } = useTranslation()
  const { actionError, actions, isSettingPartyType, viewModel } = useLobby()
  const { cancelQueue, timer: queueTimer } = useQueue()
  const setLobbyInviteSheetOpen = useUiStore(uiStoreSelectors.setLobbyInviteSheetOpen)
  const setLobbyRoleSheetOpen = useUiStore(uiStoreSelectors.setLobbyRoleSheetOpen)
  const translatedActionError = actionError ? translateLcuError(actionError) : null
  const currentModeLabel = t(getModeNameKey(viewModel.mode))
  const modeRules = getModeRules(viewModel.mode)
  const showSecondaryRole = !(viewModel.isLobbyFull && modeRules.requiresRoleSelection)
  const isSwiftplay = viewModel.mode === 'swiftplay'
  const isSearching = viewModel.queueStatus.isSearching
  const searchLabel = isSearching ? `${t('queue.searching')} ${formatElapsedSeconds(queueTimer)}` : t('queue.notInQueue')

  if (!viewModel.hasLobby) return <LobbyCreationContent />

  const owner = viewModel.members.find((member) => member.isLeader) ?? viewModel.members[0]
  const others = viewModel.members.filter((member) => member.summonerId !== owner?.summonerId)

  return (
    <div className='flex h-full flex-col overflow-hidden'>
      <PageHeader
        actions={
          <LobbyVisibilityToggle
            disabled={isSearching}
            isLoading={isSettingPartyType}
            isOwner={viewModel.isOwner}
            onToggle={actions.setPartyType}
            partyType={viewModel.partyType}
          />
        }
        badges={[{ label: currentModeLabel }]}
        title={t('lobby.title')}
      />
      <LobbyBackgroundEffects isSearching={viewModel.queueStatus.isSearching} />

      <section className='shrink-0 p-4'>
        {owner ? (
          <button
            className='relative flex w-full flex-col items-center gap-3 rounded-xl border border-[color-mix(in_srgb,rgb(200,170,110)_20%,transparent)] bg-[color-mix(in_srgb,rgb(10,20,40)_40%,transparent)] p-5 backdrop-blur-md transition-all hover:border-[color-mix(in_srgb,rgb(200,170,110)_40%,transparent)] hover:bg-[color-mix(in_srgb,rgb(10,20,40)_50%,transparent)] hover:backdrop-blur-lg disabled:cursor-not-allowed disabled:opacity-60'
            disabled={isSearching}
            onClick={() => setLobbyRoleSheetOpen(true)}
            type='button'
          >
            <div className='absolute top-3 right-3 flex size-7 items-center justify-center rounded-full border border-[color-mix(in_srgb,rgb(200,170,110)_30%,transparent)] bg-[color-mix(in_srgb,rgb(10,20,40)_80%,transparent)] text-[color-mix(in_srgb,rgb(200,170,110)_70%,transparent)] backdrop-blur-md'>
              <Pencil className='size-3.5' />
            </div>
            <div className='relative'>
              <div className='size-20 overflow-hidden rounded-full border-2 border-[color-mix(in_srgb,rgb(200,170,110)_60%,transparent)] shadow-[0_0_25px_color-mix(in_srgb,rgb(200,170,110)_30%,transparent)]'>
                <img alt={owner.displayName} className='h-full w-full object-cover' src={owner.iconUrl ?? undefined} />
              </div>
              <div className='absolute -right-1 -bottom-1 flex size-6 items-center justify-center rounded-full border border-[color-mix(in_srgb,rgb(200,170,110)_50%,transparent)] bg-[color-mix(in_srgb,rgb(10,20,40)_80%,transparent)] backdrop-blur-md'>
                <Crown className='size-3 text-[rgb(200,170,110)]' />
              </div>
            </div>
            <div className='flex flex-col items-center gap-1.5'>
              <span className='text-center text-base font-bold text-[rgb(200,170,110)]'>{owner.displayName}</span>
              <div className='flex items-center gap-2'>
                {owner.firstPositionPreference !== 'UNSELECTED' && <MemberRuneIcon role={owner.firstPositionPreference} />}
                {showSecondaryRole &&
                  owner.secondPositionPreference !== 'UNSELECTED' &&
                  owner.firstPositionPreference !== 'FILL' && <MemberRuneIcon role={owner.secondPositionPreference} />}
              </div>
            </div>
          </button>
        ) : null}
      </section>

      <section className='shrink-0 px-4 py-2'>
        <div className='grid grid-cols-2 gap-3'>
          {others.map((member) => (
            <div
              key={member.summonerId}
              className={`flex flex-col items-center gap-2 rounded-xl border border-[color-mix(in_srgb,rgb(200,170,110)_15%,transparent)] bg-[color-mix(in_srgb,rgb(10,20,40)_30%,transparent)] p-3 backdrop-blur-md transition-all hover:bg-[color-mix(in_srgb,rgb(10,20,40)_40%,transparent)] hover:backdrop-blur-lg ${isSearching ? 'animate-[member-glow_2s_ease-in-out_infinite]' : ''}`}
            >
              <LobbyMemberCard member={member} showSecondaryRole={showSecondaryRole} />
            </div>
          ))}
        </div>
        {viewModel.canInvite ? (
          <button
            className='mt-3 flex w-full items-center justify-center gap-3 rounded-xl border border-dashed border-[color-mix(in_srgb,rgb(200,170,110)_30%,transparent)] bg-[color-mix(in_srgb,rgb(10,20,40)_20%,transparent)] p-4 text-[color-mix(in_srgb,rgb(200,170,110)_60%,transparent)] backdrop-blur-md transition-all hover:border-[color-mix(in_srgb,rgb(200,170,110)_60%,transparent)] hover:bg-[color-mix(in_srgb,rgb(10,20,40)_40%,transparent)] hover:text-[rgb(200,170,110)] hover:backdrop-blur-lg'
            onClick={() => setLobbyInviteSheetOpen(true)}
            type='button'
          >
            <div className='relative'>
              <Plus className='size-6' />
              {viewModel.invites.length > 0 ? (
                <span className='absolute -top-1 -right-2 flex size-4 items-center justify-center rounded-full bg-[rgb(200,170,110)] text-[10px] font-bold text-[color-mix(in_srgb,rgb(10,20,40)_80%,transparent)]'>
                  {viewModel.invites.length}
                </span>
              ) : null}
            </div>
            <span className='text-sm font-medium'>{t('lobby.bottomNav.invites')}</span>
          </button>
        ) : null}
      </section>

      {actionError ? (
        <div className='shrink-0 px-4'>
          <Card aria-live='polite' className='border-destructive bg-destructive/10 backdrop-blur-md'>
            <CardHeader className='py-2'>
              <CardTitle className='text-sm'>{t('errors.generic')}</CardTitle>
            </CardHeader>
            <CardContent className='space-y-1 pb-3 text-xs'>
              <p className='text-destructive'>
                {translatedActionError ? t(translatedActionError.messageKey) : t(actionError, { defaultValue: actionError })}
              </p>
              {translatedActionError ? (
                <p className='text-destructive'>
                  {translatedActionError.affectedSummoner ? `${translatedActionError.affectedSummoner}: ` : ''}
                  {t(translatedActionError.actionKey)}
                </p>
              ) : null}
            </CardContent>
          </Card>
        </div>
      ) : null}

      <div className='flex-1' />

      <section className='shrink-0 p-4'>
        <div className='relative'>
          <div
            className={`pointer-events-none absolute inset-0 animate-[queue-wave_2s_ease-out_infinite] rounded-2xl border-2 border-[color-mix(in_srgb,rgb(200,170,110)_50%,transparent)] blur-[2px] transition-opacity duration-1000 ${
              viewModel.queueStatus.isSearching ? 'opacity-100' : 'opacity-0'
            }`}
          />
          <div className='relative flex flex-col items-center gap-4 rounded-2xl border border-[color-mix(in_srgb,rgb(200,170,110)_30%,transparent)] bg-[color-mix(in_srgb,rgb(10,20,40)_60%,transparent)] p-5 backdrop-blur-md'>
            <div className='flex flex-col items-center gap-1'>
              <div className='flex items-center gap-2'>
                <span
                  className={`h-2.5 w-2.5 rounded-full ${isSearching ? 'animate-pulse bg-[rgb(200,170,110)] shadow-[0_0_8px_rgb(200,170,110)]' : 'bg-[color-mix(in_srgb,rgb(200,170,110)_30%,transparent)]'}`}
                />
                <span className='text-xs font-bold tracking-[0.25em] text-[color-mix(in_srgb,rgb(200,170,110)_90%,transparent)] uppercase tabular-nums'>
                  {searchLabel}
                </span>
              </div>
            </div>

            {isSearching ? (
              <button
                className='w-full rounded-full border border-[color-mix(in_srgb,rgb(200,170,110)_40%,transparent)] bg-[color-mix(in_srgb,rgb(10,20,40)_60%,transparent)] px-6 py-3 text-xs font-bold tracking-widest text-[color-mix(in_srgb,rgb(200,170,110)_60%,transparent)] uppercase backdrop-blur-md transition-all hover:border-[color-mix(in_srgb,rgb(200,170,110)_60%,transparent)] hover:bg-[color-mix(in_srgb,rgb(200,170,110)_10%,transparent)] hover:text-[color-mix(in_srgb,rgb(200,170,110)_90%,transparent)] hover:backdrop-blur-lg active:scale-[0.98]'
                onClick={() => void cancelQueue()}
                type='button'
              >
                {t('queue.cancel')}
              </button>
            ) : (
              <div className='flex w-full items-center gap-3'>
                <button
                  className='flex-1 rounded-full border border-[color-mix(in_srgb,rgb(200,170,110)_60%,transparent)] bg-gradient-to-r from-[color-mix(in_srgb,rgb(200,170,110)_20%,transparent)] to-[color-mix(in_srgb,rgb(200,170,110)_5%,transparent)] px-6 py-3 text-xs font-bold tracking-widest text-[rgb(200,170,110)] uppercase backdrop-blur-md transition-all hover:from-[color-mix(in_srgb,rgb(200,170,110)_30%,transparent)] hover:to-[color-mix(in_srgb,rgb(200,170,110)_10%,transparent)] hover:shadow-[0_0_25px_color-mix(in_srgb,rgb(200,170,110)_25%,transparent)] hover:backdrop-blur-lg active:scale-[0.98]'
                  disabled={!viewModel.canJoinQueue}
                  onClick={actions.joinQueue}
                  type='button'
                >
                  {t('queue.findMatch')}
                </button>
                <button
                  className='flex-1 rounded-full border border-[color-mix(in_srgb,rgb(200,170,110)_40%,transparent)] bg-[color-mix(in_srgb,rgb(10,20,40)_60%,transparent)] px-6 py-3 text-xs font-bold tracking-widest text-[color-mix(in_srgb,rgb(200,170,110)_60%,transparent)] uppercase backdrop-blur-md transition-all hover:border-[color-mix(in_srgb,rgb(200,170,110)_60%,transparent)] hover:bg-[color-mix(in_srgb,rgb(200,170,110)_10%,transparent)] hover:text-[color-mix(in_srgb,rgb(200,170,110)_90%,transparent)] hover:backdrop-blur-lg disabled:cursor-not-allowed disabled:opacity-50'
                  disabled={!isSearching}
                  onClick={actions.leaveQueue}
                  type='button'
                >
                  {t('queue.leave')}
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      <LobbyBottomSheets />
      <LobbyInviteOverlay />
      <PremadeReadyCheckOverlay isSwiftplay={isSwiftplay} />
    </div>
  )
}

export const Route = createFileRoute('/connected/lobby')({
  component: LobbyRouteComponent,
  loader: async ({ context }) => {
    await ensureLcuRouteData(context.queryClient, [
      lobbySessionDescriptor,
      queueDescriptor,
      queueSearchDescriptor,
      invitesDescriptor,
      sentInvitesDescriptor,
      currentSummonerDescriptor,
      gameQueuesDescriptor,
      platformConfigDescriptor('LcuSocial', 'EnabledGameQueues'),
      platformConfigDescriptor('LcuSocial', 'DefaultGameQueues'),
    ])
  },
})
