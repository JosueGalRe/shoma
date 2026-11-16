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
import { useFriendStatusLine } from '../hooks/use-social-labels'
import { useSocialLCU } from '../hooks/use-social-lcu'
import { profileIconUrl, readGameName, translateGroupName } from '../lib/friend-utils'
import { filterFriendsByQuery, groupFriends } from '../lib/group-friends'

import { AddFriendSheet } from './add-friend-sheet'
import { ChatScreen } from './chat-screen'
import { FriendGroup } from './friend-group'
import { FriendRow } from './friend-row'
import { SocialEmpty } from './social-empty'
import { SocialLayer } from './social-layer'
import { SocialOptionsSheet } from './social-options-sheet'

import type { FriendGroup as FriendGroupData } from '../lib/group-friends'
import type { Puuid } from '@/core/types/branded'

// Figma "Social" (98:2786): the friend list over the current screen, opened from the top bar's chat button
export function SocialScreen() {
  const { t } = useTranslation()
  const open = useUiStore(uiStoreSelectors.isSocialOpen)
  const setOpen = useUiStore(uiStoreSelectors.setSocialOpen)
  const { friends, groups: folders, isLoading } = useSocialLCU()
  const { settings } = useChatSettings()
  const ddragonVersion = useLatestDdragonVersion().data
  const statusLine = useFriendStatusLine()
  const [query, setQuery] = useState('')
  const [sheet, setSheet] = useState<'add-friend' | 'options' | null>(null)
  // The friend stays while the chat slides away
  const [chat, setChat] = useState<{ friendId: Puuid | null; open: boolean }>({ friendId: null, open: false })

  const groups = groupFriends(filterFriendsByQuery(friends, query), folders, settings).filter((group) => {
    return query.trim() === '' || group.friends.length > 0
  })
  const chatFriend =
    friends.find((friend) => {
      return friend.id === chat.friendId
    }) ?? null

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
        {groups.map((group) => {
          return (
            <FriendGroup key={group.id} title={groupTitle(group)}>
              {group.friends.map((friend) => {
                return (
                  <FriendRow
                    key={friend.id}
                    iconUrl={profileIconUrl(ddragonVersion, friend.iconId)}
                    name={readGameName(friend.name)}
                    online={friend.status !== 'offline'}
                    status={statusLine(friend)}
                    onSelect={() => {
                      setChat({ friendId: friend.id, open: true })
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
        friend={chatFriend}
        open={chat.open}
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
  // Figma "Avatars": 24 around, 20 between the groups
  list: {
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
