import { ChevronDown } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Avatar, Button } from '@/components/ui'

import {
  friendsListChevronStyles,
  friendsListFriendRowStyles,
  friendsListInviteButtonStyles,
  friendsListStyles,
  socialStatusDotStyles,
  socialUnreadBadgeStyles,
} from '../social-styles'

import {
  isFriendInvitable,
  profileIconUrl,
  readFriendStatusDetail,
  translateGroupName,
  useTranslatedActivityLabels,
  useTranslatedInviteStateLabels,
  useTranslatedStatusLabels,
} from './social-utils'

import type { Friend, FriendsListProps } from '../social-types'

export function FriendsList({
  friends,
  groupedFriends,
  collapsedGroups,
  handleToggleGroup,
  selectedFriendId,
  handleSelectFriend,
  handleInvite,
  isDisconnected,
  isInviting,
  ddragonVersion,
  unreadCounts,
  sentInviteStates,
}: FriendsListProps) {
  const styles = friendsListStyles()
  const { t } = useTranslation()
  const statusLabels = useTranslatedStatusLabels()
  const activityLabels = useTranslatedActivityLabels()
  const inviteStateLabels: Record<string, string> = useTranslatedInviteStateLabels()

  if (friends.length === 0) {
    return (
      <div className={styles.emptyState()}>
        <div className={styles.emptyTitle()}>No friends online</div>

        <p className={styles.emptyText()}>Friends will appear here once social data is available.</p>
      </div>
    )
  }

  const renderGroupFriends = (groupFriends: Friend[], isCollapsed: boolean) => {
    if (isCollapsed) {
      return null
    }

    if (groupFriends.length === 0) {
      return <p className={styles.groupEmpty()}>No friends in this group.</p>
    }

    return (
      <div className={styles.friendList()}>
        {groupFriends.map((friend) => {
          const isSelected = selectedFriendId === friend.id
          const activityLabel = friend.activity ? activityLabels[friend.activity] : undefined
          const statusDetail = readFriendStatusDetail(friend, {
            activityLabel,
            riotMobileLabel: t('social.status.riotMobile'),
            statusLabel: statusLabels[friend.status],
          })
          const unreadCount = unreadCounts.get(friend.id) ?? 0
          const sentInviteState = sentInviteStates.get(friend.summonerId)

          return (
            <div key={friend.id} className={friendsListFriendRowStyles({ selected: isSelected })}>
              <button
                type="button"
                onClick={() => {
                  return handleSelectFriend(friend.id)
                }}
                className={styles.friendButton()}
              >
                <Avatar
                  src={profileIconUrl(ddragonVersion, friend.iconId)}
                  alt={friend.name}
                  status={friend.status}
                  size="sm"
                />

                <span className={styles.friendInfo()}>
                  <span className={styles.friendName()}>
                    {friend.name}

                    {unreadCount > 0 ? (
                      <span
                        aria-label={t('social.unreadMessages', { count: unreadCount })}
                        className={socialUnreadBadgeStyles()}
                      >
                        {unreadCount}
                      </span>
                    ) : null}
                  </span>

                  <span className={styles.friendStatus()}>
                    <span className={socialStatusDotStyles({ status: friend.status })} />

                    {statusDetail}
                  </span>
                </span>
              </button>

              {sentInviteState ? (
                <span className={styles.sentInviteChip()}>{inviteStateLabels[sentInviteState] ?? sentInviteState}</span>
              ) : (
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    return handleInvite(friend)
                  }}
                  disabled={!isFriendInvitable(friend) || isDisconnected || isInviting}
                  className={friendsListInviteButtonStyles()}
                >
                  Invite
                </Button>
              )}
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div className={styles.root()}>
      {groupedFriends.map(([group, groupFriends]) => {
        const isCollapsed = collapsedGroups.has(group)
        const groupContent = renderGroupFriends(groupFriends, isCollapsed)

        return (
          <div key={group} className={styles.group()}>
            <button
              type="button"
              aria-controls={`social-group-${group}`}
              aria-expanded={!isCollapsed}
              onClick={() => {
                return handleToggleGroup(group)
              }}
              className={styles.groupButton()}
            >
              <span className={styles.groupTitle()}>{translateGroupName(group, t)}</span>

              <span className={styles.groupCount()}>
                {groupFriends.length}

                <ChevronDown className={friendsListChevronStyles({ collapsed: isCollapsed })} aria-hidden="true" />
              </span>
            </button>

            <div className={styles.groupContent()} id={`social-group-${group}`}>
              {groupContent}
            </div>
          </div>
        )
      })}
    </div>
  )
}
