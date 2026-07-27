import { useTranslation } from 'react-i18next'

import { Input, ScrollArea } from '@/components/ui'

import { FriendsList } from './friends-list'

import type { SocialFriendsTabProps } from './social-friends-tab-types'

export function SocialFriendsTab({
  visibleFriends,
  unreadCounts,
  sentInviteStates,
  groupedFriends,
  collapsedGroups,
  handleToggleGroup,
  selectedFriendId,
  handleSelectFriend,
  handleInvite,
  isDisconnected,
  isInviting,
  ddragonVersion,
  searchQuery,
  setSearchQuery,
}: SocialFriendsTabProps) {
  const { t } = useTranslation()

  return (
    <ScrollArea className="h-full min-h-0">
      <div className="p-3">
        <Input
          aria-label={t('social.searchPlaceholder')}
          className="mb-3"
          onChange={(event) => {
            setSearchQuery(event.target.value)
          }}
          placeholder={t('social.searchPlaceholder')}
          type="search"
          value={searchQuery}
        />

        <FriendsList
          friends={visibleFriends}
          unreadCounts={unreadCounts}
          sentInviteStates={sentInviteStates}
          groupedFriends={groupedFriends}
          collapsedGroups={collapsedGroups}
          handleToggleGroup={handleToggleGroup}
          selectedFriendId={selectedFriendId}
          handleSelectFriend={handleSelectFriend}
          handleInvite={handleInvite}
          isDisconnected={isDisconnected}
          isInviting={isInviting}
          ddragonVersion={ddragonVersion}
        />
      </div>
    </ScrollArea>
  )
}
