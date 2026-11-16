import { BottomSheet } from '@shoma/ui/bottom-sheet'
import { Checkbox } from '@shoma/ui/checkbox'
import { Radio, RadioGroup } from '@shoma/ui/radio-group'
import { color } from '@shoma/ui/tokens/color.stylex'
import { create, props } from '@stylexjs/stylex'
import { useTranslation } from 'react-i18next'

import { useChatSettings } from '../hooks/use-chat-settings'

import type { FriendListSettings } from '../lib/group-friends'
import type { SheetProps } from '../social-types'

// Figma "Options" (99:3642): the client's own friend list options, saved to the client as they change
export function SocialOptionsSheet({ onOpenChange, open }: SheetProps) {
  const { t } = useTranslation()
  const { canSave, settings, update } = useChatSettings()

  return (
    <BottomSheet closeLabel={t('common.back')} open={open} title={t('social.options.title')} onOpenChange={onOpenChange}>
      <RadioGroup
        aria-label={t('social.options.sort')}
        disabled={!canSave}
        style={styles.group}
        value={settings.sortBy}
        onValueChange={(sortBy: FriendListSettings['sortBy']) => {
          update({ sortBy })
        }}
      >
        <Radio label={t('social.options.sortAlphabetical')} value="alphabetical" />

        <Radio label={t('social.options.sortStatus')} value="availability" />
      </RadioGroup>

      <hr {...props(styles.divider)} />

      <Checkbox
        checked={settings.chatGBG}
        disabled={!canSave}
        label={t('social.options.groupGames')}
        onCheckedChange={(chatGBG) => {
          update({ chatGBG })
        }}
      />

      {/* Grouping by game takes Riot Mobile and offline friends out too, so the client shows both ticked */}
      <Checkbox
        checked={settings.chatGroupMobile || settings.chatGBG}
        disabled={!canSave || settings.chatGBG}
        label={t('social.options.groupMobile')}
        onCheckedChange={(chatGroupMobile) => {
          update({ chatGroupMobile })
        }}
      />

      <Checkbox
        checked={settings.chatGroupOffline || settings.chatGBG}
        disabled={!canSave || settings.chatGBG}
        label={t('social.options.groupOffline')}
        onCheckedChange={(chatGroupOffline) => {
          update({ chatGroupOffline })
        }}
      />
    </BottomSheet>
  )
}

const styles = create({
  divider: {
    borderStyle: 'none',
    borderTopColor: color.text,
    borderTopStyle: 'solid',
    borderTopWidth: 1,
    margin: 0,
  },
  // Figma: 10 between the options, as between the sheet's rows
  group: {
    gap: 10,
  },
})
