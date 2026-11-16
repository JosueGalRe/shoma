import { useState } from 'react'

import { Icon } from '@shoma/ui/icon'
import { IconButton } from '@shoma/ui/icon-button'
import { Loader } from '@shoma/ui/loader'
import { ScrollArea } from '@shoma/ui/scroll-area'
import { text } from '@shoma/ui/text'
import { TextField } from '@shoma/ui/text-field'
import { create, props } from '@stylexjs/stylex'
import { useTranslation } from 'react-i18next'

import { useLatestDdragonVersion } from '@/core/http/ddragon'
import { uiStoreSelectors, useUiStore } from '@/core/state/ui-store'

import { useChatSettings } from '../hooks/use-chat-settings'
import { useClashTeams } from '../hooks/use-clash-teams'
import { useFriendStatusLine } from '../hooks/use-social-labels'
import { useSocialLCU } from '../hooks/use-social-lcu'
import { useUnreadChats } from '../hooks/use-unread-chats'
import { readChatTarget } from '../lib/chat-utils'
import { profileIconUrl, readGameName, translateGroupName } from '../lib/friend-utils'
import { filterFriendsByQuery, groupFriends } from '../lib/group-friends'

import { AddFriendSheet } from './add-friend-sheet'
import { ChatScreen } from './chat-screen'
import { ClashTeamRow } from './clash-team-row'
import { FriendGroup } from './friend-group'
import { FriendRow } from './friend-row'
import { SocialEmpty } from './social-empty'
import { SocialLayer } from './social-layer'
import { SocialOptionsSheet } from './social-options-sheet'

import type { FriendGroup as FriendGroupData } from '../lib/group-friends'
import type { OpenChat } from '../social-types'

// Figma "Social" (98:2786): the friend list over the current screen, opened from the top bar's chat button
export function SocialScreen() {
  const { t } = useTranslation()
  const open = useUiStore(uiStoreSelectors.isSocialOpen)
  const setOpen = useUiStore(uiStoreSelectors.setSocialOpen)
  const { friends, groups: folders, isLoading } = useSocialLCU()
  const { settings } = useChatSettings()
  const ddragonVersion = useLatestDdragonVersion().data
  const statusLine = useFriendStatusLine()
  const unread = useUnreadChats()
  const [query, setQuery] = useState('')
  const [sheet, setSheet] = useState<'add-friend' | 'options' | null>(null)
  const teams = useClashTeams()
  // Who the chat is with stays while it slides away
  const [chat, setChat] = useState<OpenChat>({ id: null, kind: 'friend', open: false })

  const groups = groupFriends(filterFriendsByQuery(friends, query), folders, settings).filter((group) => {
    return query.trim() === '' || group.friends.length > 0
  })
  const chatTarget = readChatTarget(chat, friends, teams)

  function groupTitle(group: FriendGroupData) {
    const name = translateGroupName(group.id, t)

    return group.isFolder ? `${name} (${group.online}/${group.total})` : `${name} (${group.total})`
  }

  let list = (
    <SocialEmpty poro="question" style={styles.empty}>
      {t('social.empty')}
    </SocialEmpty>
  )

  if (friends.length === 0 && isLoading) {
    list = <Loader aria-label={t('social.loading')} style={styles.loader} />
  }

  if (friends.length > 0) {
    list = (
      <>
        {/* The client lists its Clash teams above the friends, and hides them while searching */}
        {teams.length > 0 && query.trim() === '' ? (
          <FriendGroup
            title={t('social.clash.title')}
            unread={teams.reduce((sum, team) => {
              return sum + (unread.byConversation.get(team.conversationId) ?? 0)
            }, 0)}
          >
            {teams.map((team) => {
              return (
                <ClashTeamRow
                  key={team.conversationId}
                  team={team}
                  unread={unread.byConversation.get(team.conversationId) ?? 0}
                  onSelect={() => {
                    setChat({ id: team.conversationId, kind: 'clash', open: true })
                  }}
                />
              )
            })}
          </FriendGroup>
        ) : null}

        {groups.map((group) => {
          const groupUnread = group.friends.reduce((sum, friend) => {
            return sum + (unread.byConversation.get(friend.id) ?? 0)
          }, 0)

          return (
            <FriendGroup key={group.id} title={groupTitle(group)} unread={groupUnread}>
              {group.friends.map((friend) => {
                return (
                  <FriendRow
                    key={friend.id}
                    iconUrl={profileIconUrl(ddragonVersion, friend.iconId)}
                    name={readGameName(friend.name)}
                    online={friend.status !== 'offline'}
                    status={statusLine(friend)}
                    unread={unread.byConversation.get(friend.id) ?? 0}
                    onSelect={() => {
                      setChat({ id: friend.id, kind: 'friend', open: true })
                    }}
                  />
                )
              })}
            </FriendGroup>
          )
        })}
      </>
    )
  }

  return (
    <SocialLayer
      actions={
        <IconButton
          aria-label={t('social.addFriend.title')}
          onClick={() => {
            setSheet('add-friend')
          }}
        >
          <Icon name="add-friend" />
        </IconButton>
      }
      backLabel={t('common.back')}
      open={open}
      title={t('social.title')}
      titleStyle={text.heading1}
      onOpenChange={(next) => {
        setOpen(next)

        if (!next) {
          setChat({ ...chat, open: false })
        }
      }}
    >
      <div {...props(styles.search)}>
        <TextField
          aria-label={t('social.search')}
          autoComplete="off"
          clearLabel={t('common.clear')}
          enterKeyHint="search"
          placeholder={t('social.search')}
          style={styles.searchField}
          value={query}
          onValueChange={setQuery}
        />

        <IconButton
          aria-label={t('social.options.title')}
          onClick={() => {
            setSheet('options')
          }}
        >
          <Icon name="sort" />
        </IconButton>
      </div>

      <ScrollArea contentStyle={styles.list} style={styles.scroll}>
        {list}
      </ScrollArea>

      <SocialOptionsSheet
        open={sheet === 'options'}
        onOpenChange={(next) => {
          setSheet(next ? 'options' : null)
        }}
      />

      <AddFriendSheet
        friends={friends}
        open={sheet === 'add-friend'}
        onOpenChange={(next) => {
          setSheet(next ? 'add-friend' : null)
        }}
      />

      <ChatScreen
        open={chat.open}
        target={chatTarget}
        onOpenChange={(next) => {
          setChat({ ...chat, open: next })
        }}
      />
    </SocialLayer>
  )
}

const styles = create({
  // Figma: the poro 132 under the search
  empty: {
    paddingBlockStart: 108,
  },
  // Figma "Avatars": 24 around, 20 between the groups; contained, so a long name can't widen Base UI's fit-content box
  list: {
    contain: 'inline-size',
    display: 'flex',
    flexDirection: 'column',
    gap: 20,
    paddingBlockEnd: 24,
    paddingInline: 24,
  },
  loader: {
    alignSelf: 'center',
    marginBlockStart: 108,
  },
  scroll: {
    flexGrow: 1,
  },
  search: {
    alignItems: 'center',
    display: 'flex',
    flexShrink: 0,
    gap: 8,
    paddingBlock: 24,
    paddingInline: 24,
  },
  searchField: {
    flexGrow: 1,
    minWidth: 0,
  },
})
