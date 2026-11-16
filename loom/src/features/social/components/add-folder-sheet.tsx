import { useState } from 'react'

import { BottomSheet } from '@shoma/ui/bottom-sheet'
import { Button } from '@shoma/ui/button'
import { TextField } from '@shoma/ui/text-field'
import { color } from '@shoma/ui/tokens/color.stylex'
import { useToast } from '@shoma/ui/use-toast'
import { create, props } from '@stylexjs/stylex'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'

import { useCreateFriendGroup } from '@/core/lcu/lcu-mutations'
import { createLcuQueryOptions, friendGroupsDescriptor } from '@/core/lcu/queries'
import { useSharedLCUTransport } from '@/core/relay/use-relay-state'

import { type FolderNameError, validateFolderName } from '../lib/folder-name'

import type { SheetProps } from '../social-types'

// The client's "Add folder", which the Figma only draws as Social's button: a name, checked as the client checks it, laid
// Out as Add Friend. The new folder comes first in the list
export function AddFolderSheet({ onOpenChange, open }: SheetProps) {
  const { t } = useTranslation()
  const toast = useToast()
  const transport = useSharedLCUTransport()
  const folders = useQuery(createLcuQueryOptions(friendGroupsDescriptor, transport)).data ?? []
  const createFolder = useCreateFriendGroup()
  const [name, setName] = useState('')
  const [error, setError] = useState<FolderNameError | null>(null)

  function submit() {
    const problem = validateFolderName(name, {
      reserved: [t('social.status.riotMobile'), t('social.group.offline'), t('social.group.otherServers')],
      taken: [
        t('social.group.default'),
        ...folders.map((folder) => {
          return folder.name
        }),
      ],
    })

    setError(problem)

    if (problem) {
      return
    }

    createFolder.mutate(
      {
        name: name.trim(),
        priority:
          Math.max(
            0,
            ...folders.map((folder) => {
              return folder.priority
            }),
          ) + 1,
      },
      {
        onError: () => {
          toast.add({ title: t('social.addFolder.failed'), type: 'error' })
        },
        onSuccess: () => {
          setName('')
          onOpenChange(false)
          toast.add({ title: t('social.addFolder.created'), type: 'success' })
        },
      },
    )
  }

  return (
    <BottomSheet closeLabel={t('common.back')} open={open} title={t('social.addFolder.title')} onOpenChange={onOpenChange}>
      <form
        {...props(styles.content)}
        onSubmit={(event) => {
          event.preventDefault()

          if (name.trim() !== '' && !createFolder.isPending) {
            submit()
          }
        }}
      >
        <TextField
          autoComplete="off"
          clearLabel={t('common.clear')}
          error={error ? t(`social.addFolder.errors.${error}`) : undefined}
          label={t('social.addFolder.name')}
          placeholder={t('social.addFolder.namePlaceholder')}
          value={name}
          onValueChange={(value) => {
            setName(value)
            setError(null)
          }}
        />

        <hr {...props(styles.divider)} />

        <Button disabled={name.trim() === '' || createFolder.isPending} type="submit">
          {t('social.addFolder.submit')}
        </Button>
      </form>
    </BottomSheet>
  )
}

const styles = create({
  // Add Friend's: 16 between the field, the line and the button
  content: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  divider: {
    borderStyle: 'none',
    borderTopColor: color.text,
    borderTopStyle: 'solid',
    borderTopWidth: 1,
    margin: 0,
  },
})
